import express, { Router, Request, Response, NextFunction } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { verifyAndCheckQuota, recordUsage, initFirebase } from "./aiUsage.js";
import geminiRouter from "./gemini.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Hàm khởi tạo client Gemini (Đã gỡ bỏ httpOptions để chống lỗi tường lửa)
function getGeminiClient(customApiKey?: string) {
  const apiKey = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Hệ thống chưa có API Key. Vui lòng cấu hình và xác thực Gemini API trong mục Quản lý API.");
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
  });
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
        return doc.data().apiKey;
      }
    }
  } catch (e) {
    console.error("Error resolving API key from Firestore:", e);
  }
  return undefined;
}

// Hàm kiểm tra và trừ hạn mức (quota) AI
async function withAiQuota(req: any, res: any, requestedMode: 'fast' | 'balanced' | 'smart', handler: (req: any, res: any, modelConfig: any) => Promise<void>) {
  const customApiId = extractApiId(req);
  const resolvedApiKey = await resolveApiKey(customApiId) || process.env.GEMINI_API_KEY;
  (req as any).resolvedApiKey = resolvedApiKey;
  const customModel = req.headers['x-gemini-model'] || req.body?.model || (requestedMode === 'smart' ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

  if (resolvedApiKey) {
    const modelConfig = {
      model: typeof customModel === 'string' && customModel.trim() ? customModel.trim() : 'gemini-2.5-flash',
      cost: 0,
      mode: requestedMode,
    };

    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    try {
      await handler(req, res, modelConfig);
      if (idToken && !idToken.startsWith('dev-')) {
        try {
          const quotaData = await verifyAndCheckQuota(idToken, requestedMode);
          await recordUsage(quotaData.uid, quotaData.email, requestedMode, 0, true);
        } catch {}
      }
    } catch (err: any) {
      if (!res.headersSent) {
        res.status(500).json({ success: false, error: err.message || "Lỗi khi xử lý AI." });
      }
    }
    return;
  }

  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
  
  if (!idToken) {
    return res.status(401).json({ success: false, error: "Vui lòng nhập/chọn Gemini API Key trong mục 'Quản lý API' hoặc đăng nhập tài khoản để sử dụng AI." });
  }

  let quotaData;
  try {
    quotaData = await verifyAndCheckQuota(idToken, requestedMode);
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }

  const { uid, email, cost, modelConfig } = quotaData;

  try {
    await handler(req, res, modelConfig);
    await recordUsage(uid, email, requestedMode, cost, true);
  } catch (err: any) {
    await recordUsage(uid, email, requestedMode, cost, false);
    if (!res.headersSent) {
      res.status(500).json({ success: false, error: err.message || "Lỗi khi xử lý AI." });
    }
  }
}

const apiRouter = Router();

apiRouter.use("/gemini", geminiRouter);

apiRouter.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Endpoint xác thực API Key thật với Google Gemini (Đã được vá lỗi 500)
apiRouter.post("/gemini-keys/validate", async (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch {
      body = {};
    }
  }

  const apiKey = body?.apiKey || req.headers['x-gemini-api-key'];
  const model = body?.model || req.headers['x-gemini-model'] || "gemini-2.5-flash";

  if (!apiKey || typeof apiKey !== "string" || !apiKey.trim()) {
    return res.status(400).json({
      success: false,
      status: "INVALID",
      error: "Vui lòng cung cấp Gemini API Key để kiểm tra.",
    });
  }

  const startTime = Date.now();
  const cleanKey = apiKey.trim();
  const testModel = (typeof model === 'string' && model.trim()) ? model.trim() : "gemini-2.5-flash";

  try {
    // KHÔNG dùng header giả mạo để kết nối mượt mà qua Vercel
    const ai = new GoogleGenAI({ apiKey: cleanKey });

    // Prompt siêu ngắn gọn để tránh mọi rào cản ngôn ngữ của Google
    await ai.models.generateContent({
      model: testModel,
      contents: "Hello",
      config: {
        maxOutputTokens: 5,
        temperature: 0,
      },
    });

    const responseTimeMs = Date.now() - startTime;

    return res.status(200).json({
      success: true,
      status: "ACTIVE",
      responseTimeMs,
      model: testModel,
      message: "API hoạt động bình thường",
      checkedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.error("🔥 Lỗi kiểm tra API Key:", err);
    const responseTimeMs = Date.now() - startTime;
    
    // Trích xuất chuỗi lỗi an toàn
    const rawError = err?.message || err?.statusText || String(err) || "";
    const errMessage = rawError.toUpperCase();
    
    let status = "ERROR";
    let httpStatus = 200; // Trả về 200 kèm success: false để Frontend dễ đọc JSON
    let userFriendlyError = "Lỗi kết nối khi gửi request tới máy chủ Google AI.";

    if (errMessage.includes("API_KEY_INVALID") || errMessage.includes("API KEY NOT VALID") || errMessage.includes("UNAUTHENTICATED") || errMessage.includes("400")) {
      status = "INVALID";
      userFriendlyError = "API Key không hợp lệ hoặc sai định dạng. Vui lòng kiểm tra lại key.";
    } else if (errMessage.includes("PERMISSION_DENIED") || errMessage.includes("403")) {
      status = "INVALID";
      userFriendlyError = "API Key không có quyền truy cập Gemini API hoặc Google Cloud Project bị vô hiệu hóa.";
    } else if (errMessage.includes("RESOURCE_EXHAUSTED") || errMessage.includes("QUOTA") || errMessage.includes("RATE LIMIT") || errMessage.includes("429")) {
      status = "QUOTA_EXCEEDED";
      userFriendlyError = "API Key đã hết hạn mức sử dụng (Quota) hoặc bị giới hạn tần suất.";
    } else if (errMessage.includes("NOT_FOUND") || errMessage.includes("MODELS/") || errMessage.includes("404")) {
      status = "MODEL_ERROR";
      userFriendlyError = `Model "${testModel}" không khả dụng cho API Key này.`;
    } else if (errMessage.includes("FETCH_ERROR") || errMessage.includes("ECONNREFUSED") || errMessage.includes("NETWORK")) {
      status = "ERROR";
      userFriendlyError = "Lỗi kết nối mạng từ máy chủ Vercel tới Google AI.";
    } else {
      status = "ERROR";
      userFriendlyError = `Lỗi từ Google: ${rawError.slice(0, 150)}`;
    }

    return res.status(httpStatus).json({
      success: false,
      status,
      error: userFriendlyError,
      responseTimeMs,
      checkedAt: new Date().toISOString(),
    });
  }
});

// Lấy thông tin sử dụng AI
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
      
      if (doc.exists) {
        return res.json({ success: true, usage: doc.data() });
      } 
      
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

// AI Question Generator
apiRouter.post("/generate-questions", async (req, res) => {
  const mode = req.body.aiMode || "balanced";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { 
      subject, 
      grade, 
      topic, 
      types, 
      count = 10,
      learningOutcome,
      cognitiveLevels,
      matrix = 'standard',
      competencyFocus,
      textbookEdition = 'Kết nối tri thức với cuộc sống'
    } = req.body;
    
    if (!topic || !subject) {
      res.status(400).json({ success: false, error: "Môn học và tên chủ đề bài học là bắt buộc!" });
      return;
    }
    
    const safeTypes = Array.isArray(types) && types.length > 0 ? types : ['mcq'];
    const typeMapping: Record<string, string> = {
      'mcq': 'Trắc nghiệm 4 lựa chọn (A, B, C, D)',
      'tf': 'Đúng / Sai (True / False)',
      'text': 'Trả lời ngắn / Điền khuyết'
    };
    const typeString = safeTypes.map(t => typeMapping[t] || t).join(", ");

    const ai = getGeminiClient((req as any).resolvedApiKey);
    let safeCount = Math.min(Math.max(1, count), 20); 

    const cognitiveInfo = Array.isArray(cognitiveLevels) && cognitiveLevels.length > 0
      ? `Tập trung vào các mức độ nhận thức sau: ${cognitiveLevels.join(', ')}.`
      : matrix === 'practice'
      ? `Phân bổ mức độ nhận thức theo ma trận Ôn tập & Củng cố: ~50% Nhận biết, ~30% Thông hiểu, ~20% Vận dụng.`
      : matrix === 'advanced'
      ? `Phân bổ mức độ nhận thức theo ma trận Phát triển năng lực: ~20% Nhận biết, ~30% Thông hiểu, ~30% Vận dụng, ~20% Vận dụng cao.`
      : matrix === 'balanced'
      ? `Phân bổ đều 4 mức độ nhận thức: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao (~25% mỗi mức).`
      : `Phân bổ mức độ nhận thức theo ma trận chuẩn Bộ GD&ĐT: ~40% Nhận biết, ~30% Thông hiểu, ~20% Vận dụng, ~10% Vận dụng cao.`;

    const outcomeContext = learningOutcome && learningOutcome.trim()
      ? `- Yêu cầu cần đạt (YCCĐ) trọng tâm người dạy yêu cầu: "${learningOutcome.trim()}"`
      : `- Tự động xác định chính xác các YCCĐ cốt lõi của bài học theo khung Chương trình GDPT 2018 môn ${subject} ${grade}.`;

    const competencyContext = competencyFocus && competencyFocus.trim()
      ? `- Trọng tâm phát triển năng lực: "${competencyFocus.trim()}"`
      : `- Phát triển toàn diện các năng lực đặc thù của môn ${subject}.`;
    
    const prompt = `YÊU CẦU BIÊN SOẠN CÂU HỎI KHẢO THÍ:
- Môn học: ${subject}
- Khối/Lớp: ${grade || "Chung"}
- Tên bài học / Chủ đề yêu cầu: "${topic}"
- Bộ sách giáo khoa chuẩn: ${textbookEdition}
- Khung chương trình chuẩn: Chương trình Giáo dục Phổ thông 2018
- Số lượng câu hỏi cần tạo: ${safeCount} câu
- Định dạng câu hỏi: ${typeString}
${outcomeContext}
${competencyContext}
- Ma trận phân bổ nhận thức: ${cognitiveInfo}

QUY TRÌNH THẨM ĐỊNH & BIÊN SOẠN BẮT BUỘC:
1. BƯỚC 1: THẨM ĐỊNH TÍNH HỢP LỆ
   - Nếu chủ đề "${topic}" hoặc môn "${subject}" KHÔNG THUỘC phạm vi chương trình K-12 hoặc là nội dung phi giáo dục:
     -> BẮT BUỘC TRẢ VỀ: "isValidCurriculum": false, "rejectionReason": "Lý do từ chối...", "questions": []
   - Nếu hợp lệ:
     -> ĐẶT "isValidCurriculum": true và biên soạn câu hỏi.

2. BƯỚC 2: QUY TẮC BIÊN SOẠN CHUẨN MỰC SƯ PHẠM
   - Đúng chuẩn kiến thức, thuật ngữ khoa học mới (VD: Danh pháp Hóa học IUPAC).
   - Thể hiện tinh thần "Kết nối tri thức với cuộc sống".
   - Phân hóa rõ ràng 4 mức độ nhận thức.
   - Câu trắc nghiệm (mcq) phải có 4 phương án A, B, C, D phân biệt.
   - Lời giải thích (explanation) phải chi tiết.`;
    
    if (prompt.length > 10000) {
      throw new Error("Dữ liệu đầu vào quá dài. Tối đa 10.000 ký tự.");
    }

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: {
        systemInstruction: `Bạn là Chuyên gia Khảo thí và Đánh giá Giáo dục Quốc gia Việt Nam. Luôn xuất JSON.`,
        temperature: 0.55,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidCurriculum: { type: Type.BOOLEAN },
            rejectionReason: { type: Type.STRING },
            curriculumMapping: {
              type: Type.OBJECT,
              properties: {
                subject: { type: Type.STRING },
                grade: { type: Type.STRING },
                textbookLesson: { type: Type.STRING },
                primaryLearningOutcome: { type: Type.STRING }
              }
            },
            questions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING },
                  content: { type: Type.STRING },
                  options: { type: Type.ARRAY, items: { type: Type.STRING } },
                  correct: { type: Type.STRING },
                  cognitiveLevel: { type: Type.STRING },
                  learningOutcome: { type: Type.STRING },
                  competency: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["type", "content", "correct", "cognitiveLevel", "explanation"]
              }
            }
          },
          required: ["isValidCurriculum", "questions"]
        }
      }
    });

    let text = response.text || "";
    if (text.includes("```json")) {
      text = text.replace(/```json/gi, "").replace(/```/g, "").trim();
    } else if (text.includes("```")) {
      text = text.replace(/```/g, "").trim();
    }
    
    let parsedResult: any = null;
    try {
      parsedResult = JSON.parse(text);
    } catch {
      const startObj = text.indexOf('{');
      const endObj = text.lastIndexOf('}');
      if (startObj !== -1 && endObj !== -1) {
        try {
          parsedResult = JSON.parse(text.substring(startObj, endObj + 1));
        } catch {
          parsedResult = null;
        }
      }
      if (!parsedResult) {
        const start = text.indexOf('[');
        const end = text.lastIndexOf(']');
        if (start !== -1 && end !== -1) {
          parsedResult = {
            isValidCurriculum: true,
            questions: JSON.parse(text.substring(start, end + 1))
          };
        } else {
          throw new Error("Không thể phân tích dữ liệu phản hồi từ AI.");
        }
      }
    }

    if (parsedResult.isValidCurriculum === false) {
      const rejectMsg = parsedResult.rejectionReason || "Yêu cầu không hợp lệ.";
      res.status(400).json({ 
        success: false, 
        error: rejectMsg,
        rejectionReason: rejectMsg
      });
      return;
    }

    const rawList = Array.isArray(parsedResult.questions) ? parsedResult.questions : [];
    if (rawList.length === 0) {
      res.status(400).json({
        success: false,
        error: parsedResult.rejectionReason || "Không thể tạo câu hỏi."
      });
      return;
    }

    const formatted = rawList.map((q: any, idx: number) => {
      let finalCorrect: any = q.correct;
      if (q.type === 'mcq') {
        const num = parseInt(String(q.correct), 10);
        finalCorrect = isNaN(num) ? 0 : Math.min(3, Math.max(0, num));
      } else if (q.type === 'tf') {
        finalCorrect = String(q.correct).toLowerCase() === 'true';
      } else {
        finalCorrect = String(q.correct);
      }

      let rawCog = String(q.cognitiveLevel || 'Thông hiểu').trim();
      let cogLevel = 'Thông hiểu';
      if (rawCog.toLowerCase().includes('nhận biết') || rawCog.toLowerCase().includes('nhan biet')) {
        cogLevel = 'Nhận biết';
      } else if (rawCog.toLowerCase().includes('vận dụng cao') || rawCog.toLowerCase().includes('van dung cao')) {
        cogLevel = 'Vận dụng cao';
      } else if (rawCog.toLowerCase().includes('vận dụng') || rawCog.toLowerCase().includes('van dung')) {
        cogLevel = 'Vận dụng';
      } else {
        cogLevel = 'Thông hiểu';
      }

      return {
        id: `ai_${Date.now()}_${idx}`,
        type: q.type || 'mcq',
        content: q.content || `Câu ${idx + 1}`,
        options: Array.isArray(q.options) && q.options.length === 4 ? q.options : (q.type === 'mcq' ? ["A", "B", "C", "D"] : undefined),
        correct: finalCorrect,
        cognitiveLevel: cogLevel,
        learningOutcome: q.learningOutcome || `Yêu cầu cần đạt chuẩn bài học môn ${subject} ${grade}`,
        competency: q.competency || `Năng lực đặc thù môn ${subject}`,
        explanation: q.explanation || ''
      };
    });

    res.json({ 
      success: true, 
      questions: formatted,
      curriculumMapping: parsedResult.curriculumMapping
    });
  });
});

apiRouter.post("/parse-document", async (req, res) => {
  const mode = req.body.aiMode || "smart";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { rawText } = req.body;
    if (!rawText || !rawText.trim()) {
      res.status(400).json({ 
        success: false, 
        error: "Không có văn bản để quét! Vui lòng nhập hoặc tải file tài liệu."
      });
      return;
    }
    const ai = getGeminiClient((req as any).resolvedApiKey);
    const safeRawText = rawText.slice(0, 25000);
    const prompt = `Trích xuất câu hỏi trắc nghiệm từ văn bản sau:\n"""${safeRawText}"""`;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: {
        systemInstruction: "Bạn là chuyên gia trích xuất dữ liệu. Luôn trả về JSON mảng câu hỏi hợp lệ.",
        temperature: 0.2,
        responseMimeType: "application/json",
      }
    });

    res.json({ success: true, text: response.text });
  });
});

apiRouter.post("/generate-image", async (req, res) => {
  const mode = req.body.aiMode || "smart";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { prompt: imagePrompt, subject = "Học tập" } = req.body;
    if (!imagePrompt) {
      res.status(400).json({ success: false, error: "Mô tả hình ảnh là bắt buộc!" });
      return;
    }
    const ai = getGeminiClient((req as any).resolvedApiKey);
    const promptText = `Tạo vector SVG học tập môn ${subject}: "${imagePrompt}". Chỉ xuất DUY NHẤT một thẻ <svg>...</svg>.`;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: promptText,
    });

    let cleanSvg = response.text || `<svg></svg>`;
    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
    res.json({ success: true, svg: cleanSvg, dataUri, prompt: imagePrompt });
  });
});

apiRouter.post("/enhance-question", async (req, res) => {
  const mode = req.body.aiMode || "balanced";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { content, type = "mcq", subject = "Tổng hợp" } = req.body;
    const ai = getGeminiClient((req as any).resolvedApiKey);
    const safeContent = content.slice(0, 4000);
    const prompt = `Soạn đáp án & giải thích cho câu hỏi: "${safeContent}", loại ${type}, môn ${subject}.`;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: {
        temperature: 0.6,
        responseMimeType: "application/json",
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    res.json({ success: true, ...parsed });
  });
});

apiRouter.post("/generate-wheel-phrase", async (req, res) => {
  const mode = req.body.aiMode || "fast";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { topic = "Tổng hợp" } = req.body;
    const ai = getGeminiClient((req as any).resolvedApiKey);
    const prompt = `Gợi ý 5 cụm từ Tiếng Việt in hoa cho game show Chiếc nón kỳ diệu, chủ đề: ${topic}. Xuất JSON mảng chuỗi.`;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    res.json({ success: true, phrases: JSON.parse(response.text || "[]") });
  });
});

apiRouter.post("/generate-pictogram-phrases", async (req, res) => {
  const mode = req.body.aiMode || "fast";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { topic = "Quang hợp" } = req.body;
    const ai = getGeminiClient((req as any).resolvedApiKey);
    const prompt = `Đề xuất 5 cụm từ Tiếng Việt in hoa cho game Nhìn hình đoán chữ, chủ đề: ${topic}. Xuất JSON mảng chuỗi.`;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    res.json({ success: true, phrases: JSON.parse(response.text || "[]") });
  });
});

apiRouter.post("/generate-pictogram", async (req, res) => {
  const mode = req.body.aiMode || "smart";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { phrase, difficulty = "medium" } = req.body;
    const ai = getGeminiClient((req as any).resolvedApiKey);
    const targetHintCount = difficulty === "easy" ? 3 : difficulty === "hard" ? 5 : 4;
    const prompt = `Phân tích cụm từ "${phrase}" thành ${targetHintCount} gợi ý hình ảnh cho game Nhìn hình đoán chữ. Xuất JSON mảng đối tượng: [{"conceptIdea": "...", "provider": "SEARCH", "searchKeyword": "..."}]`;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: { responseMimeType: "application/json" },
    });

    const parsedHints = JSON.parse(response.text || "[]");
    const hints = parsedHints.map((item: any, idx: number) => {
      const keyword = item.searchKeyword || phrase;
      const searchImageUrl = `[https://picsum.photos/seed/$](https://picsum.photos/seed/$){encodeURIComponent(keyword + idx)}/400/400`;
      return {
        id: `hint_${Date.now()}_${idx}`,
        conceptIdea: item.conceptIdea || `Gợi ý #${idx + 1}`,
        provider: item.provider || "SEARCH",
        searchImageUrl,
        imageUrl: searchImageUrl,
        isRevealed: idx === 0,
      };
    });

    res.json({ success: true, phrase, difficulty, hints });
  });
});

app.use("/api", apiRouter);
app.use("/", apiRouter);

// Bắt lỗi toàn cục
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error("🔥 Global API Error Caught:", err);
  if (!res.headersSent) {
    res.status(500).json({ 
      success: false, 
      error: err.message || "Đã xảy ra lỗi máy chủ nội bộ. Vui lòng kiểm tra lại cấu hình." 
    });
  }
});

export default app;