import express, { Router, Request, Response, NextFunction } from "express";
import { GoogleGenAI, Type } from "@google/genai";
import { verifyAndCheckQuota, recordUsage, initFirebase } from "./aiUsage.js";
import geminiRouter from "./gemini.js";

const app = express();
app.use(express.json({ limit: "10mb" }));

// Hàm khởi tạo client Gemini (hỗ trợ Custom API Key từ API Manager hoặc Fallback Env)
function getGeminiClient(customApiKey?: string) {
  const apiKey = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("Hệ thống chưa có API Key. Vui lòng cấu hình và xác thực Gemini API trong mục Quản lý API.");
  }
  return new GoogleGenAI({
    apiKey: apiKey.trim(),
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
}

// Hàm lấy API Key từ Request (headers hoặc body)
function extractApiKey(req: Request): string | undefined {
  const headerKey = req.headers['x-gemini-api-key'];
  if (typeof headerKey === 'string' && headerKey.trim()) {
    return headerKey.trim();
  }
  if (req.body && typeof req.body.apiKey === 'string' && req.body.apiKey.trim()) {
    return req.body.apiKey.trim();
  }
  return undefined;
}

// Hàm kiểm tra và trừ hạn mức (quota) AI
async function withAiQuota(req: any, res: any, requestedMode: 'fast' | 'balanced' | 'smart', handler: (req: any, res: any, modelConfig: any) => Promise<void>) {
  const customApiKey = extractApiKey(req);
  const customModel = req.headers['x-gemini-model'] || req.body?.model || (requestedMode === 'smart' ? 'gemini-2.5-pro' : 'gemini-2.5-flash');

  // Nếu người dùng/admin đã nạp hoặc chọn Custom API Key (hoặc có sẵn hệ thống), cho phép chạy trực tiếp ngay
  if (customApiKey || process.env.GEMINI_API_KEY) {
    const modelConfig = {
      model: typeof customModel === 'string' && customModel.trim() ? customModel.trim() : 'gemini-2.5-flash',
      cost: 0,
      mode: requestedMode,
    };

    const authHeader = req.headers.authorization;
    const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;

    try {
      await handler(req, res, modelConfig);
      // Nếu có idToken thì vẫn ghi nhận lịch sử một cách an toàn
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

// Endpoint xác thực API Key thật với Google Gemini
apiRouter.post("/gemini-keys/validate", async (req, res) => {
  const { apiKey, model = "gemini-2.5-flash" } = req.body;
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
    const ai = new GoogleGenAI({
      apiKey: cleanKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });

    const response = await ai.models.generateContent({
      model: testModel,
      contents: "Ping test Gemini connection. Respond with OK.",
      config: {
        maxOutputTokens: 10,
        temperature: 0.1,
      },
    });

    const responseTimeMs = Date.now() - startTime;

    return res.json({
      success: true,
      status: "ACTIVE",
      responseTimeMs,
      model: testModel,
      message: "✓ API hoạt động bình thường",
      checkedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    const responseTimeMs = Date.now() - startTime;
    const errMessage = String(err.message || err || "");
    let status = "ERROR";
    let userFriendlyError = "Lỗi kết nối Gemini API.";

    if (
      errMessage.includes("API_KEY_INVALID") ||
      errMessage.includes("API key not valid") ||
      errMessage.includes("INVALID_ARGUMENT") ||
      errMessage.includes("400")
    ) {
      status = "INVALID";
      userFriendlyError = "API Key không hợp lệ. Vui lòng kiểm tra lại key.";
    } else if (
      errMessage.includes("RESOURCE_EXHAUSTED") ||
      errMessage.includes("quota") ||
      errMessage.includes("Quota") ||
      errMessage.includes("429")
    ) {
      if (errMessage.toLowerCase().includes("rate limit") || errMessage.toLowerCase().includes("rate_limit")) {
        status = "RATE_LIMITED";
        userFriendlyError = "Đã vượt quá giới hạn tần suất gọi API (Rate limit). Vui lòng thử lại sau.";
      } else {
        status = "QUOTA_EXCEEDED";
        userFriendlyError = "Quota tài khoản đã hết (RESOURCE_EXHAUSTED / Hạn mức đã dùng hết).";
      }
    } else if (
      errMessage.includes("PERMISSION_DENIED") ||
      errMessage.includes("403")
    ) {
      status = "INVALID";
      userFriendlyError = "Không có quyền truy cập Gemini API hoặc dự án bị vô hiệu hóa.";
    } else if (
      errMessage.includes("NOT_FOUND") ||
      errMessage.includes("models/") ||
      errMessage.includes("404")
    ) {
      status = "ERROR";
      userFriendlyError = `Model "${testModel}" không khả dụng cho API Key này.`;
    } else if (
      errMessage.includes("FETCH_ERROR") ||
      errMessage.includes("ECONNREFUSED") ||
      errMessage.includes("network")
    ) {
      status = "ERROR";
      userFriendlyError = "Lỗi kết nối mạng khi gửi request tới máy chủ Google AI.";
    } else {
      status = "ERROR";
      userFriendlyError = errMessage || "Lỗi không xác định khi kết nối tới Gemini API.";
    }

    return res.status(200).json({
      success: false,
      status,
      error: userFriendlyError,
      rawError: errMessage,
      responseTimeMs,
      checkedAt: new Date().toISOString(),
    });
  }
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

// AI Question Generator - Chuẩn CT GDPT 2018 & SGK Kết nối tri thức với cuộc sống
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
    
    // Phòng vệ an toàn tuyệt đối cho mảng types từ Client gửi lên
    const safeTypes = Array.isArray(types) && types.length > 0 ? types : ['mcq'];
    const typeMapping: Record<string, string> = {
      'mcq': 'Trắc nghiệm 4 lựa chọn (A, B, C, D)',
      'tf': 'Đúng / Sai (True / False)',
      'text': 'Trả lời ngắn / Điền khuyết'
    };
    const typeString = safeTypes.map(t => typeMapping[t] || t).join(", ");

    const ai = getGeminiClient(extractApiKey(req));
    let safeCount = Math.min(Math.max(1, count), 20); 

    // Phân bổ ma trận nhận thức
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
      : `- Tự động xác định chính xác các YCCĐ cốt lõi của bài học theo khung Chương trình GDPT 2018 (Thông tư 32/2018/TT-BGDĐT) môn ${subject} ${grade}.`;

    const competencyContext = competencyFocus && competencyFocus.trim()
      ? `- Trọng tâm phát triển năng lực: "${competencyFocus.trim()}"`
      : `- Phát triển toàn diện các năng lực đặc thù của môn ${subject} và năng lực chung (giải quyết vấn đề, tự chủ - tự học).`;
    
    const prompt = `YÊU CẦU BIÊN SOẠN CÂU HỎI KHẢO THÍ:
- Môn học: ${subject}
- Khối/Lớp: ${grade || "Chung"}
- Tên bài học / Chủ đề yêu cầu: "${topic}"
- Bộ sách giáo khoa chuẩn: ${textbookEdition} (Nhà xuất bản Giáo dục Việt Nam)
- Khung chương trình chuẩn: Chương trình Giáo dục Phổ thông 2018 (Ban hành kèm Thông tư 32/2018/TT-BGDĐT)
- Số lượng câu hỏi cần tạo nếu hợp lệ: ${safeCount} câu
- Định dạng câu hỏi: ${typeString}
${outcomeContext}
${competencyContext}
- Ma trận phân bổ nhận thức: ${cognitiveInfo}

QUY TRÌNH THẨM ĐỊNH & BIÊN SOẠN BẮT BUỘC:
1. BƯỚC 1: THẨM ĐỊNH TÍNH HỢP LỆ VỚI CT GDPT 2018 VÀ SGK KẾT NỐI TRI THỨC
   - Nếu chủ đề "${topic}" hoặc môn "${subject}" KHÔNG THUỘC phạm vi chương trình giáo dục phổ thông (K-12) của Bộ Giáo dục & Đào tạo Việt Nam, hoặc là nội dung phi giáo dục (cờ bạc, bạo lực, văn hóa phẩm độc hại, hack, thông tin giả/xuyên tạc, giải trí không lành mạnh, spam ký tự), hoặc KHÔNG THỂ ánh xạ tới bất kỳ Yêu cầu cần đạt (YCCĐ) nào trong CT GDPT 2018 và SGK Kết nối tri thức:
     -> BẮT BUỘC TRẢ VỀ: "isValidCurriculum": false, "rejectionReason": "Nêu rõ và lịch sự lý do từ chối sư phạm bằng Tiếng Việt...", "questions": []
   - Nếu chủ đề hợp lệ:
     -> ĐẶT "isValidCurriculum": true, "rejectionReason": null, và tiến hành biên soạn đúng ${safeCount} câu hỏi ở Bước 2.

2. BƯỚC 2: QUY TẮC BIÊN SOẠN CHUẨN MỰC SƯ PHẠM
   - Đúng chuẩn kiến thức, kĩ năng, thuật ngữ và danh pháp khoa học quốc tế mới (Đặc biệt danh pháp Hóa học/KHTN chuẩn IUPAC: alkane, alkene, alkyne, alcohol, aldehyde, ketone, carboxylic acid, ester, amine, amino acid, protein, lipid, carbohydrate, oxygen, hydrogen, sulfur, nitrogen, chlorine, sodium, potassium, calcium, copper, iron, zinc, aluminium, oxide, hydroxide, sulfate, chloride, nitrate, carbonate, enthalpy, entropy...).
   - Thể hiện sâu sắc tinh thần "Kết nối tri thức với cuộc sống": Câu hỏi gắn liền thực tiễn sinh động, hiện tượng tự nhiên đời sống, ứng dụng công nghệ, bảo vệ môi trường, bối cảnh đất nước và con người Việt Nam.
   - Phân hóa rõ ràng 4 mức độ nhận thức: 'Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao'. Mỗi câu phải ghi rõ trường cognitiveLevel.
   - Với mỗi câu hỏi, chỉ rõ Yêu cầu cần đạt (learningOutcome) và Năng lực đặc thù (competency) được đánh giá.
   - Câu trắc nghiệm (mcq) phải có 4 phương án A, B, C, D phân biệt, phương án nhiễu có tính sư phạm cao.
   - Lời giải thích (explanation) phải chi tiết, nêu rõ căn cứ bài học trong SGK ${textbookEdition} và các bước lập luận/giải.`;
    
    if (prompt.length > 10000) {
      throw new Error("Dữ liệu đầu vào quá dài. Tối đa 10.000 ký tự.");
    }

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: prompt,
      config: {
        systemInstruction: `Bạn là Chuyên gia Khảo thí và Đánh giá Giáo dục Quốc gia Việt Nam kiêm Tác giả bộ sách giáo khoa "Kết nối tri thức với cuộc sống" (NXB Giáo dục Việt Nam). Bạn tuân thủ tuyệt đối Chương trình Giáo dục phổ thông 2018 (Thông tư 32/2018/TT-BGDĐT). Bạn có nghĩa vụ thẩm định nghiêm ngặt tính sư phạm và BẮT BUỘC TỪ CHỐI (isValidCurriculum = false) mọi chủ đề hoặc yêu cầu đầu vào không thuộc hoặc không thể ánh xạ vào CT GDPT 2018 và SGK Kết nối tri thức. Khi hợp lệ, bạn tạo ra các câu hỏi mẫu mực, chuẩn danh pháp khoa học mới và giàu tính thực tiễn.`,
        temperature: 0.55,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValidCurriculum: {
              type: Type.BOOLEAN,
              description: "true nếu chủ đề thuộc CT GDPT 2018 & SGK Kết nối tri thức; false nếu không thuộc chương trình giáo dục hoặc không phù hợp sư phạm"
            },
            rejectionReason: {
              type: Type.STRING,
              description: "Giải thích chi tiết lý do từ chối nếu isValidCurriculum = false"
            },
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
              description: "Mảng danh sách câu hỏi tạo được khi hợp lệ",
              items: {
                type: Type.OBJECT,
                properties: {
                  type: { type: Type.STRING, description: "'mcq', 'tf', hoặc 'text'" },
                  content: { type: Type.STRING, description: "Nội dung câu hỏi chuẩn mực sư phạm" },
                  options: { type: Type.ARRAY, items: { type: Type.STRING }, description: "4 phương án cho mcq [A, B, C, D]" },
                  correct: { type: Type.STRING, description: "index (0-3) cho mcq, 'true'/'false' cho tf, đáp án text cho text" },
                  cognitiveLevel: { type: Type.STRING, description: "'Nhận biết', 'Thông hiểu', 'Vận dụng', hoặc 'Vận dụng cao'" },
                  learningOutcome: { type: Type.STRING, description: "Yêu cầu cần đạt (YCCĐ) theo CT GDPT 2018" },
                  competency: { type: Type.STRING, description: "Năng lực đặc thù của môn học" },
                  explanation: { type: Type.STRING, description: "Lời giải thích sư phạm chi tiết và căn cứ SGK Kết nối tri thức" }
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

    // Kiểm tra tính từ chối bắt buộc (Mandatory rejection)
    if (parsedResult.isValidCurriculum === false) {
      const rejectMsg = parsedResult.rejectionReason || 
        `Yêu cầu "${topic}" không thuộc phạm vi chuẩn của Chương trình GDPT 2018 hoặc SGK Kết nối tri thức với cuộc sống. Vui lòng chọn hoặc nhập tên bài học chuẩn trong chương trình phổ thông.`;
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
        error: parsedResult.rejectionReason || "Không thể tạo câu hỏi cho chủ đề này theo chuẩn GDPT 2018. Vui lòng thử lại với tên bài học cụ thể hơn."
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

      // Chuẩn hóa mức độ nhận thức
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
    const ai = getGeminiClient(extractApiKey(req));
    
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

apiRouter.post("/generate-image", async (req, res) => {
  const mode = req.body.aiMode || "smart";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { prompt: imagePrompt, subject = "Học tập" } = req.body;
    if (!imagePrompt) {
      res.status(400).json({ success: false, error: "Mô tả hình ảnh là bắt buộc!" });
      return;
    }
    
    if (imagePrompt.length > 2000) throw new Error("Mô tả hình ảnh quá dài");
    
    const ai = getGeminiClient(extractApiKey(req));
    const promptText = `Tạo vector SVG học tập môn ${subject}: "${imagePrompt}". Chỉ xuất DUY NHẤT một thẻ <svg ...>...</svg> hoàn chỉnh và hợp lệ, viewBox="0 0 400 300", màu sắc tươi sáng, đẹp mắt.`;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: promptText,
      config: {
        systemInstruction: "Chuyên gia thiết kế SVG giáo dục. Chỉ xuất SVG.",
        temperature: 0.7,
      },
    });

    let rawText = response.text || "";
    let cleanSvg = rawText.trim();
    if (cleanSvg.includes("<svg") && cleanSvg.includes("</svg>")) {
      cleanSvg = cleanSvg.substring(cleanSvg.indexOf("<svg"), cleanSvg.lastIndexOf("</svg>") + 6);
    } else {
      cleanSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" width="100%" height="100%"><rect width="400" height="300" rx="20" fill="#F0FDF4" stroke="#86EFAC" stroke-width="2"/><circle cx="200" cy="130" r="60" fill="#BBF7D0"/><text x="200" y="145" font-size="50" text-anchor="middle">🌟</text><text x="200" y="230" font-size="16" font-weight="bold" fill="#166534" text-anchor="middle">${imagePrompt.slice(0, 35)}</text></svg>`;
    }

    const dataUri = `data:image/svg+xml;utf8,${encodeURIComponent(cleanSvg)}`;
    res.json({ success: true, svg: cleanSvg, dataUri, prompt: imagePrompt });
  });
});

apiRouter.post("/enhance-question", async (req, res) => {
  const mode = req.body.aiMode || "balanced";
  await withAiQuota(req, res, mode, async (req, res, modelConfig) => {
    const { content, type = "mcq", subject = "Tổng hợp" } = req.body;
    const ai = getGeminiClient(extractApiKey(req));
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
    const ai = getGeminiClient(extractApiKey(req));
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
    const ai = getGeminiClient(extractApiKey(req));
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
    const ai = getGeminiClient(extractApiKey(req));
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
      const searchImageUrl = `https://picsum.photos/seed/${encodeURIComponent(keyword + idx)}/400/400`;
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