import express, { Router, Request, Response, NextFunction } from "express";
import dotenv from "dotenv";
dotenv.config();
import { GoogleGenAI, Type } from "@google/genai";
import { geminiPool } from "./_lib/geminiPool.js";
import { listVercelEnvs, addVercelEnv, removeVercelEnv, triggerVercelDeployment } from "./_lib/vercelSync.js";
import { 
  verifyAndCheckQuota, 
  recordUsage, 
  initFirebase, 
  logApiValidationAttempt, 
  getRecentValidationLogs, 
  categorizeGeminiError,
  sanitizeLogMessage 
} from "./_lib/aiUsage.js";
import geminiRouter from "./_lib/gemini.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Enable CORS and OPTIONS preflight for robust cross-origin and Vercel routing
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, x-gemini-api-key, x-gemini-model, x-gemini-api-id");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

// Hàm khởi tạo client Gemini (sử dụng API Key được truyền vào hoặc fallback sang GEMINI_API_KEY từ biến môi trường)
function getGeminiClient(apiKey?: string) {
  return {
    models: {
      generateContent: async (params: any) => {
        const poolResult = await geminiPool.generateContent(params.contents, params.model, params.config);
        return poolResult.response;
      }
    }
  } as any;
}

// Hàm lấy API Id từ Request
function extractApiId(req: Request): string | undefined {
  const headerId = req.headers['x-gemini-api-id'];
  if (typeof headerId === 'string' && headerId.trim()) {
    return headerId.trim();
  }
  if (req.body && typeof req.body.apiId === 'string' && req.body.apiId.trim()) {
    return req.body.apiId.trim();
  }
  return undefined;
}

async function resolveApiKey(apiId?: string): Promise<string | undefined> {
  if (!apiId) return undefined;
  try {
    const { adminDb } = initFirebase();
    if (adminDb) {
      const doc = await adminDb.collection('geminiApiSecrets').doc(apiId).get();
      if (doc.exists) {
        return doc.data()?.apiKey;
      }
    }
  } catch (e) {
    console.error("Error resolving API key from Firestore:", e);
  }
  return undefined;
}

// Hàm kiểm tra và trừ hạn mức (quota) AI
async function withAiQuota(req: any, res: any, requestedMode: 'fast' | 'balanced' | 'smart', handler: (req: any, res: any, modelConfig: any) => Promise<void>) {
  if (geminiPool.getKeys().length === 0) {
    return res.status(200).json({ 
      success: false, 
      error: "Hệ thống chưa được cấu hình API Key nào trong Vercel Environment Variables. Vui lòng thêm API Key." 
    });
  }
  
  const customModel = req.headers['x-gemini-model'] || req.body?.model || (requestedMode === 'smart' ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

  let uid = "guest";
  let email = "guest@wey.app";
  let cost = requestedMode === 'smart' ? 2 : 1;
  let modelConfig = {
    model: typeof customModel === 'string' && customModel.trim() ? customModel.trim() : (requestedMode === 'smart' ? 'gemini-2.5-pro' : 'gemini-2.5-flash'),
    cost,
    mode: requestedMode,
  };

  if (idToken && !idToken.startsWith('dev-')) {
    try {
      const quotaData = await verifyAndCheckQuota(idToken, requestedMode);
      uid = quotaData.uid;
      email = quotaData.email;
      cost = quotaData.cost;
      modelConfig.model = typeof customModel === 'string' && customModel.trim() ? customModel.trim() : quotaData.modelConfig.model;
    } catch (err: any) {
      return res.status(200).json({ success: false, error: err.message || "Tài khoản của bạn đã đạt giới hạn quota AI trong ngày." });
    }
  }

  try {
    await handler(req, res, modelConfig);
    if (idToken && !idToken.startsWith('dev-')) {
      await recordUsage(uid, email, requestedMode, cost, true);
    }
  } catch (err: any) {
    if (idToken && !idToken.startsWith('dev-')) {
      await recordUsage(uid, email, requestedMode, cost, false);
    }
    if (!res.headersSent) {
      console.error("AI execution error:", err);
      const safeError = sanitizeLogMessage(err?.message || "Lỗi khi xử lý AI.");
      res.status(200).json({ success: false, error: safeError });
    }
  }
}

const apiRouter = Router();

apiRouter.use("/gemini", geminiRouter);
apiRouter.use("/chat", geminiRouter);

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Lấy danh sách API công khai sẵn sàng sử dụng (Không bao giờ trả apiKey bí mật)
apiRouter.get("/gemini-keys/available", async (req, res) => {
  try {
    const { adminDb } = initFirebase();
    if (!adminDb) {
      return res.json({ success: true, apis: [] });
    }
    const snapshot = await adminDb.collection("geminiApisPublic").where("enabled", "==", true).get();
    const apis: any[] = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (data.status === "ACTIVE" || data.status === "UNCHECKED") {
        apis.push({
          id: doc.id,
          name: data.name || "Gemini API",
          email: data.email || "",
          model: data.model || "gemini-2.5-flash",
          status: data.status || "ACTIVE",
          responseTimeMs: data.responseTimeMs || 0,
          enabled: true,
        });
      }
    });
    return res.json({ success: true, apis });
  } catch (err: any) {
    console.error("Error fetching available APIs:", err);
    return res.json({ success: true, apis: [] });
  }
});

// Endpoint xác thực API Key thật với Google Gemini (Chuẩn REST JSON, An toàn bảo mật & Ghi log Server-Side)
apiRouter.post("/gemini-keys/validate", async (req, res) => {
  let body: any = req.body;
  if (Buffer.isBuffer(body)) {
    try {
      body = JSON.parse(body.toString("utf-8"));
    } catch {
      body = {};
    }
  } else if (typeof body === "string") {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  } else if (!body || typeof body !== "object") {
    body = {};
  }

  const apiKey = body?.apiKey || req.headers["x-gemini-api-key"] || (req.query?.apiKey as string);
  const model = body?.model || req.headers["x-gemini-model"] || (req.query?.model as string) || "gemini-2.5-flash";
  const apiId = body?.apiId || req.headers["x-gemini-api-id"] || (req.query?.apiId as string);
  const clientIp = (req.headers["x-forwarded-for"] as string) || req.socket.remoteAddress || "";
  const userAgent = req.headers["user-agent"] || "";

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    const errorMsg = "Vui lòng cung cấp Gemini API Key để kiểm tra.";
    await logApiValidationAttempt({
      rawKey: undefined,
      model: typeof model === "string" ? model : "gemini-2.5-flash",
      success: false,
      status: "INVALID",
      httpStatus: 200,
      responseTimeMs: 0,
      error: errorMsg,
      ip: clientIp,
      userAgent,
      apiId: typeof apiId === "string" ? apiId : undefined,
    });

    return res.status(200).json({
      success: false,
      status: "INVALID",
      errorCategory: "MISSING_API_KEY",
      error: errorMsg,
      responseTimeMs: 0,
      checkedAt: new Date().toISOString(),
    });
  }

  const startTime = Date.now();
  const cleanKey = apiKey.trim();
  const testModel = (typeof model === "string" && model.trim()) ? model.trim() : "gemini-2.5-flash";

  try {
    // 1. Khởi tạo GoogleGenAI SDK một cách an toàn (Catch initialization exceptions)
    let ai: GoogleGenAI;
    try {
      ai = new GoogleGenAI({
        apiKey: cleanKey,
      });
    } catch (initErr: any) {
      const sanitizedInitErr = sanitizeLogMessage(initErr?.message || "Lỗi khởi tạo SDK GoogleGenAI");
      await logApiValidationAttempt({
        rawKey: cleanKey,
        model: testModel,
        success: false,
        status: "INVALID",
        httpStatus: 200,
        responseTimeMs: Date.now() - startTime,
        error: initErr,
        ip: clientIp,
        userAgent,
        apiId: typeof apiId === "string" ? apiId : undefined,
      });

      return res.status(200).json({
        success: false,
        status: "INVALID",
        errorCategory: "SDK_INITIALIZATION_ERROR",
        error: `Khởi tạo Google GenAI SDK thất bại: ${sanitizedInitErr}`,
        responseTimeMs: Date.now() - startTime,
        checkedAt: new Date().toISOString(),
      });
    }

    // 2. Thử kiểm tra với model được chỉ định trước, nếu 404/not_found thì tự động thử model khả dụng khác
    let activeWorkingModel = testModel;
    let response;
    
    try {
      response = await ai.models.generateContent({
        model: testModel,
        contents: "Reply with OK.",
        config: {
          maxOutputTokens: 10,
          temperature: 0.1,
        },
      });
    } catch (primaryErr: any) {
      const errMsg = String(primaryErr?.message || "").toLowerCase();
      // Nếu lỗi do model không tìm thấy (404 hoặc NOT_FOUND hoặc unsupported), thử các model phổ biến khác
      if (
        errMsg.includes("not_found") || 
        errMsg.includes("models/") || 
        errMsg.includes("404") || 
        errMsg.includes("unsupported model")
      ) {
        const fallbackCandidates = ["gemini-2.0-flash", "gemini-1.5-flash", "gemini-1.5-pro", "gemini-2.5-flash"].filter(m => m !== testModel);
        let fallbackSuccess = false;
        
        for (const fbModel of fallbackCandidates) {
          try {
            response = await ai.models.generateContent({
              model: fbModel,
              contents: "Reply with OK.",
              config: { maxOutputTokens: 10, temperature: 0.1 },
            });
            activeWorkingModel = fbModel;
            fallbackSuccess = true;
            break;
          } catch (fbErr) {
            // Tiếp tục thử candidate tiếp theo
          }
        }
        
        if (!fallbackSuccess) {
          throw primaryErr; // Ném lại lỗi ban đầu nếu không có model nào chạy được
        }
      } else {
        throw primaryErr;
      }
    }

    const responseTimeMs = Date.now() - startTime;

    // Ghi log thành công (Masked Hint, không bao giờ log raw key)
    await logApiValidationAttempt({
      rawKey: cleanKey,
      model: activeWorkingModel,
      success: true,
      status: "ACTIVE",
      httpStatus: 200,
      responseTimeMs,
      ip: clientIp,
      userAgent,
      apiId: typeof apiId === "string" ? apiId : undefined,
    });

    return res.status(200).json({
      success: true,
      status: "ACTIVE",
      responseTimeMs,
      model: activeWorkingModel,
      message: activeWorkingModel !== testModel 
        ? `✓ API hoạt động tốt (đã tự động điều chỉnh sang model ${activeWorkingModel})` 
        : "API hoạt động bình thường",
      checkedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const rawErrorMessage = String(err?.message || err || "");
    const { status, category, userMessage } = categorizeGeminiError(rawErrorMessage);

    // Ghi log thất bại chi tiết & an toàn (Masked Hint, Sanitize Error, Không bao giờ log raw key)
    await logApiValidationAttempt({
      rawKey: cleanKey,
      model: testModel,
      success: false,
      status,
      httpStatus: 200,
      responseTimeMs,
      error: err,
      ip: clientIp,
      userAgent,
      apiId: typeof apiId === "string" ? apiId : undefined,
    });

    // Luôn trả về 200 kèm JSON payload có success: false để Vercel/proxies không chặn thành HTML Error 500
    return res.status(200).json({
      success: false,
      status,
      errorCategory: category,
      error: userMessage,
      responseTimeMs,
      checkedAt: new Date().toISOString(),
    });
  }
});

// Endpoint lấy lịch sử log kiểm tra API (An toàn - không chứa raw key)
apiRouter.get("/gemini-keys/validation-logs", (req, res) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 20, 1), 50);
  const logs = getRecentValidationLogs(limit);
  res.json({
    success: true,
    count: logs.length,
    logs,
  });
});

// Lấy thông tin sử dụng AI (Đã thêm tự động khởi tạo dữ liệu Firestore & fallback an toàn)
apiRouter.get("/ai-usage", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
    
    const { adminAuth, adminDb } = initFirebase();
    if (!adminAuth || !adminDb || !idToken || idToken.startsWith('dev-')) {
      return res.json({
        success: true,
        usage: {
          email: "hoangbang1310@gmail.com",
          dailyLimit: 100,
          dailyUsed: 0,
          totalCost: 0,
          requestsCount: 0,
          createdAt: new Date().toISOString()
        }
      });
    }
    
    try {
      const decodedToken = await adminAuth.verifyIdToken(idToken);
      const userRef = adminDb.collection('aiUsage').doc(decodedToken.uid);
      const doc = await userRef.get();
      
      // Nếu dữ liệu đã tồn tại, trả về cho người dùng
      if (doc.exists) {
        return res.json({ success: true, usage: doc.data() });
      } 
      
      // Nếu cơ sở dữ liệu trống, TỰ ĐỘNG TẠO dữ liệu mặc định
      const defaultUsage = {
        email: decodedToken.email || "Khách",
        dailyLimit: 100,
        dailyUsed: 0,
        totalCost: 0,
        requestsCount: 0,
        createdAt: new Date().toISOString()
      };
      
      await userRef.set(defaultUsage);
      res.json({ success: true, usage: defaultUsage });
    } catch (verifyErr) {
      // Fallback in case of token verification issue in preview
      return res.json({
        success: true,
        usage: {
          email: "hoangbang1310@gmail.com",
          dailyLimit: 100,
          dailyUsed: 0,
          totalCost: 0,
          requestsCount: 0,
          createdAt: new Date().toISOString()
        }
      });
    }
  } catch(err: any) {
    res.json({
      success: true,
      usage: {
        dailyLimit: 100,
        dailyUsed: 0,
        totalCost: 0,
        requestsCount: 0
      }
    });
  }
});

// Các API khác...
apiRouter.post("/parse-document", async (req, res) => {
  const mode = req.body.aiMode || "smart";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      res.status(400).json({ 
        success: false, 
        error: "Không có văn bản để quét! Vui lòng nhập hoặc tải file tài liệu.",
        diagnostics: {
          status: "invalid",
          totalDetected: 0,
          validCount: 0,
          invalidCount: 0,
          message: "Văn bản rỗng. Vui lòng nhập hoặc tải lên nội dung đề thi.",
          issues: [{ item: "Toàn bộ văn bản", reason: "Nội dung trống", suggestion: "Dán nội dung câu hỏi hoặc tải file Word (.docx), TXT, JSON" }]
        }
      });
      return;
    }
    const ai = getGeminiClient((req as any).resolvedApiKey);
    
    const safeRawText = rawText.slice(0, 25000);
    const prompt = `Bạn là một chuyên gia khảo thí & thẩm định đề thi giáo dục Việt Nam.
Nhiệm vụ của bạn là:
1. Đọc và phân tích toàn bộ văn bản thô bên dưới để trích xuất danh sách câu hỏi.
2. Hỗ trợ TẤT CẢ các dạng câu hỏi:
   - Trắc nghiệm 4 lựa chọn (type: "mcq"): 4 options A, B, C, D; correct là index 0, 1, 2, hoặc 3 (hoặc "A", "B", "C", "D").
   - Đúng / Sai (type: "tf"): correct là "true" hoặc "false".
   - Trả lời ngắn / Tự luận / Điền khuyết (type: "text"): correct là từ khóa hoặc đáp án chuẩn dạng chuỗi.
3. Nhận diện các ký hiệu đáp án đa dạng:
   - Dòng "Đáp án: A" hoặc "Đáp án đúng: Đúng", "Key: ...", "Ans: ..."
   - Dấu hoa thị "*" đặt trước phương án đúng (VD: *A. Phương án đúng)
   - Bảng đáp án tổng hợp ở cuối tài liệu (VD: 1.A 2.B 3.C...)
   - Câu hỏi có kèm lời giải / giải thích ("Lời giải: ...", "Giải thích: ...")
4. QUAN TRỌNG VỀ BÁO LỖI & THẨM ĐỊNH (DIAGNOSTICS):
   - Nếu một câu hỏi hoặc đoạn văn bị thiếu dữ kiện (ví dụ: thiếu đáp án, thiếu phương án lựa chọn, định dạng gãy vỡ, nội dung quá ngắn hoặc vô nghĩa), hãy liệt kê cụ thể vào danh sách "issues".
   - Nếu toàn bộ văn bản KHÔNG chứa câu hỏi hợp lệ nào (ví dụ: người dùng dán vào bài thơ, danh sách tên, đoạn văn nghị luận không có câu hỏi), hãy giải thích RÕ RÀNG VÀ CỤ THỂ lý do trong "message" và chỉ dẫn người dùng cách sửa hoặc tham khảo định dạng mẫu.

Văn bản thô cần phân tích:
"""${safeRawText}"""`;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia thẩm định đề thi và trích xuất dữ liệu giáo dục chuẩn xác cao. Luôn trả về đúng cấu trúc JSON bao gồm mảng 'questions' và đối tượng 'diagnostics'.",
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            questions: {
              type: Type.ARRAY,
              description: "Danh sách các câu hỏi hợp lệ đã trích xuất được",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "'mcq' cho trắc nghiệm 4 lựa chọn, 'tf' cho đúng sai, 'text' cho tự luận/điền khuyết/trả lời ngắn" },
                  content: { type: Type.STRING, description: "Nội dung câu hỏi đầy đủ" },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Mảng 4 phương án cho mcq [A, B, C, D]" },
                  correct: { type: Type.STRING, description: "0-3 hoặc A-D cho mcq; 'true'/'false' cho tf; chuỗi đáp án cho text" },
                  explanation: { type: Type.STRING, description: "Lời giải hoặc giải thích chi tiết nếu có" }
                },
                required: ["type", "content", "correct"]
              }
            },
            diagnostics: {
              type: Type.OBJECT,
              description: "Báo cáo chi tiết về quá trình nhận diện và xử lý",
              properties: {
                status: { type: Type.STRING, description: "'success' nếu đọc tốt, 'partial' nếu có câu lỗi bị bỏ qua, 'invalid' nếu không có câu hỏi hợp lệ" },
                totalDetected: { type: Type.INTEGER, description: "Tổng số câu hỏi hoặc khối câu hỏi phát hiện được trong văn bản" },
                validCount: { type: Type.INTEGER, description: "Số câu hỏi trích xuất thành công" },
                invalidCount: { type: Type.INTEGER, description: "Số câu hỏi hoặc đoạn văn không thể xử lý" },
                message: { type: Type.STRING, description: "Thông báo chi tiết và cụ thể cho người dùng về kết quả xử lý" },
                issues: {
                  type: Type.ARRAY,
                  description: "Chi tiết từng lỗi cụ thể gặp phải trên từng câu hoặc dòng",
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      item: { type: Type.STRING, description: "Vị trí hoặc tên câu (VD: Câu 3, Đoạn 2)" },
                      reason: { type: Type.STRING, description: "Lý do cụ thể không hợp lệ (VD: Thiếu phương án lựa chọn, Không tìm thấy đáp án đúng)" },
                      suggestion: { type: Type.STRING, description: "Hướng dẫn sửa cụ thể" }
                    },
                    required: ["item", "reason"]
                  }
                }
              },
              required: ["status", "validCount", "invalidCount", "message"]
            }
          },
          required: ["questions", "diagnostics"]
        }
      }
    });

    let docText = response.text || "";
    if (docText.includes("```json")) {
      docText = docText.replace(/```json/gi, "").replace(/```/g, "").trim();
    } else if (docText.includes("```")) {
      docText = docText.replace(/```/g, "").trim();
    }
    
    let parsedResult: any = null;
    try {
      parsedResult = JSON.parse(docText);
    } catch {
      const start = docText.indexOf('{');
      const end = docText.lastIndexOf('}');
      if (start !== -1 && end !== -1) {
        try {
          parsedResult = JSON.parse(docText.substring(start, end + 1));
        } catch {
          parsedResult = null;
        }
      }
    }

    if (!parsedResult) {
      // Fallback if model returned plain array
      try {
        const startArr = docText.indexOf('[');
        const endArr = docText.lastIndexOf(']');
        if (startArr !== -1 && endArr !== -1) {
          const rawArr = JSON.parse(docText.substring(startArr, endArr + 1));
          parsedResult = {
            questions: rawArr,
            diagnostics: {
              status: rawArr.length > 0 ? "success" : "invalid",
              totalDetected: rawArr.length,
              validCount: rawArr.length,
              invalidCount: 0,
              message: rawArr.length > 0 ? `Đã nhận diện thành công ${rawArr.length} câu hỏi.` : "Không tìm thấy câu hỏi hợp lệ trong văn bản."
            }
          };
        }
      } catch (arrErr) {
        // Leave parsedResult as null
      }
    }

    if (!parsedResult || !Array.isArray(parsedResult.questions)) {
      res.json({
        success: false,
        error: "Không thể trích xuất câu hỏi từ văn bản này.",
        questions: [],
        diagnostics: {
          status: "invalid",
          totalDetected: 0,
          validCount: 0,
          invalidCount: 1,
          message: "AI không phát hiện cấu trúc câu hỏi nào trong nội dung bạn cung cấp. Vui lòng kiểm tra lại cấu trúc đề thi (VD: Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A).",
          issues: [
            {
              item: "Nội dung văn bản",
              reason: "Không có định dạng câu hỏi hoặc đáp án nhận diện được",
              suggestion: "Thêm tiền tố 'Câu 1:', 'A. B. C. D.' và 'Đáp án:' cho mỗi câu hỏi"
            }
          ]
        }
      });
      return;
    }

    const rawQuestions = parsedResult.questions || [];
    const diagnostics = parsedResult.diagnostics || {
      status: rawQuestions.length > 0 ? "success" : "invalid",
      totalDetected: rawQuestions.length,
      validCount: rawQuestions.length,
      invalidCount: 0,
      message: rawQuestions.length > 0 ? `Trích xuất thành công ${rawQuestions.length} câu hỏi.` : "Không có câu hỏi hợp lệ."
    };

    const formatted = rawQuestions.map((q: any, idx: number) => {
      const qType = q.type === 'tf' ? 'tf' : q.type === 'text' ? 'text' : 'mcq';
      let finalCorrect: any = q.correct;
      if (qType === 'mcq') {
        if (typeof q.correct === 'number') {
          finalCorrect = Math.min(3, Math.max(0, q.correct));
        } else if (typeof q.correct === 'string') {
          const num = parseInt(q.correct, 10);
          if (!isNaN(num)) {
            finalCorrect = Math.min(3, Math.max(0, num));
          } else {
            const letter = q.correct.trim().toUpperCase();
            if (letter === 'A') finalCorrect = 0;
            else if (letter === 'B') finalCorrect = 1;
            else if (letter === 'C') finalCorrect = 2;
            else if (letter === 'D') finalCorrect = 3;
            else finalCorrect = 0;
          }
        } else {
          finalCorrect = 0;
        }
      } else if (qType === 'tf') {
        finalCorrect = String(q.correct).toLowerCase() === 'true' || String(q.correct).toLowerCase() === 'đúng' || String(q.correct).toLowerCase() === 'đ';
      } else {
        finalCorrect = String(q.correct || '');
      }

      let options = undefined;
      if (qType === 'mcq') {
        if (Array.isArray(q.options) && q.options.length >= 2) {
          options = q.options.slice(0, 4).map((opt: any) => String(opt).trim());
          while (options.length < 4) {
            options.push(`Phương án ${String.fromCharCode(65 + options.length)}`);
          }
        } else {
          options = ["Phương án A", "Phương án B", "Phương án C", "Phương án D"];
        }
      }

      return {
        id: `imp_ai_${Date.now()}_${idx}`,
        type: qType,
        content: (q.content || `Câu ${idx + 1}`).trim(),
        options,
        correct: finalCorrect,
        explanation: (q.explanation || '').trim()
      };
    });

    if (formatted.length === 0) {
      res.json({
        success: false,
        error: diagnostics.message || "Không có câu hỏi hợp lệ nào được tìm thấy.",
        questions: [],
        diagnostics
      });
      return;
    }

    res.json({ 
      success: true, 
      questions: formatted,
      diagnostics
    });
  });
});

// Gemini Pool Endpoints
const handlePoolStatus = (req: Request, res: Response) => {
  try {
    const publicState = geminiPool.getPublicState();
    return res.status(200).json(publicState);
  } catch (e: any) {
    return res.status(200).json({ 
      success: true, 
      totalKeysConfigured: 0, 
      usableKeysNow: 0, 
      totalConfigured: 0, 
      keys: [], 
      error: e?.message || "Không thể lấy thông tin Key Pool" 
    });
  }
};

const handlePoolRefresh = (req: Request, res: Response) => {
  try {
    geminiPool.loadGeminiKeys();
    const publicState = geminiPool.getPublicState();
    return res.status(200).json({ ...publicState, message: "Đã làm mới danh sách Key Pool từ Environment Variables." });
  } catch (e: any) {
    return res.status(200).json({ success: false, error: e?.message || "Không thể làm mới Key Pool" });
  }
};

apiRouter.get("/gemini/status", handlePoolStatus);
apiRouter.get("/gemini/rotation-status", handlePoolStatus);
apiRouter.get("/gemini/pool", handlePoolStatus);
apiRouter.get("/gemini/pool-state", handlePoolStatus);
apiRouter.post("/gemini/refresh", handlePoolRefresh);

apiRouter.get("/gemini-keys/pool", handlePoolStatus);
apiRouter.get("/gemini-keys/pool-state", handlePoolStatus);
apiRouter.post("/gemini-keys/pool/refresh", handlePoolRefresh);

apiRouter.post("/gemini-keys/test-rotation", async (req, res) => {
  try {
    const { prompt = "Viết 1 câu chào ngắn gọn bằng tiếng Việt." } = req.body || {};
    const startTime = Date.now();
    const result = await geminiPool.generateContent(prompt, undefined, {
      temperature: 0.7,
      systemInstruction: "Bạn là trợ lý AI hữu ích. Hãy trả lời ngắn gọn trong 1 câu."
    });
    const keyIndexUsed = result.keyIndex ?? 0;
    const isDowngraded = (result.modelFallbacks || 0) > 0;
    res.status(200).json({
      success: true,
      text: result.text,
      usedModel: result.modelUsed,
      keyIndexUsed,
      keyMasked: result.keyMasked,
      downgraded: isDowngraded,
      meta: {
        keyId: result.keyId,
        envName: result.envName,
        keyMasked: result.keyMasked,
        keyIndex: keyIndexUsed,
        keyLength: result.keyLength,
        modelUsed: result.modelUsed,
        usedModel: result.modelUsed,
        latency: result.latency || (Date.now() - startTime),
        keyRotations: result.keyRotations,
        modelFallbacks: result.modelFallbacks,
        fallbackModelCount: result.modelFallbacks,
        fallbackKeyCount: result.keyRotations,
        downgraded: isDowngraded
      }
    });
  } catch (e: any) {
    res.status(200).json({
      success: false,
      error: e?.message || "Kiểm tra xoay vòng key thất bại."
    });
  }
});

apiRouter.get("/gemini-keys/debug-env", (req, res) => {
  const envSource = (typeof process !== "undefined" ? process.env : {}) as any;
  const envs: Record<string, string> = {};
  for (const k in envSource) {
    const upper = k.toUpperCase();
    if (upper.includes("GEMINI") || upper.includes("GOOGLE") || upper.includes("VERCEL") || upper.startsWith("API_KEY")) {
      const val = String(envSource[k] || "").trim();
      const prefix = val.slice(0, 5);
      const suffix = val.length > 8 ? val.slice(-4) : "";
      envs[k] = val ? `${prefix}...${suffix} (${val.length} chars)` : "[empty]";
    }
  }
  res.json({
    success: true,
    nodeEnv: process.env.NODE_ENV,
    detectedEnvs: envs,
    loadedPoolKeys: geminiPool.getKeys().map(k => ({
      id: k.id,
      number: k.number,
      envName: k.envName,
      masked: k.masked,
      length: k.length
    }))
  });
});

apiRouter.get("/gemini/pool-debug", (req, res) => {
  try {
    const keys = geminiPool.getKeys();
    res.json({
      success: true,
      totalKeys: keys.length,
      keys: keys.map(k => ({
        id: k.id,
        envName: k.envName,
        number: k.number,
        masked: k.masked,
        length: k.length
      }))
    });
  } catch (err: any) {
    res.status(200).json({
      success: false,
      error: err?.message || "Lỗi nạp debug pool"
    });
  }
});

app.use("/api", apiRouter);
app.use("/", apiRouter);

// Bắt lỗi toàn cục (Luôn trả JSON 500 an toàn, không làm crash)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Global API Error Caught:", err);
  if (!res.headersSent) {
    res.status(500).json({ 
      success: false, 
      error: err?.message || "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng kiểm tra lại cấu hình." 
    });
  }
});

export default app;
