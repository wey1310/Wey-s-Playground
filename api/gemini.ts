
import express from 'express';
import { GoogleGenAI } from '@google/genai';
import { initFirebase, verifyAndCheckQuota, recordUsage } from './aiUsage.js';

const router = express.Router();

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

function getGeminiClient(apiKey: string) {
  if (!apiKey || typeof apiKey !== 'string' || !apiKey.trim()) {
    throw new Error("Chưa chọn API Gemini hoặc API không hợp lệ. Vui lòng chọn API trong mục Quản lý API.");
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

// A generic proxy endpoint for Gemini
router.post('/', async (req, res) => {
  const customApiId = (req.headers['x-gemini-api-id'] as string) || req.body.apiId;
  const customKey = await resolveApiKey(customApiId);
  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
  const mode = req.body.aiMode || 'balanced';

  if (!customKey) {
    return res.status(400).json({
      success: false,
      error: "Chưa chọn API Gemini hoặc API không hợp lệ. Vui lòng chọn API khả dụng trong mục Quản lý API."
    });
  }

  // Quota & Auth check
  let uid = "guest";
  let email = "guest@wey.app";
  let cost = 1;
  let modelConfig = { model: mode === 'smart' ? 'gemini-2.5-pro' : 'gemini-2.5-flash' };

  if (idToken && !idToken.startsWith('dev-')) {
    try {
      const quotaData = await verifyAndCheckQuota(idToken, mode);
      uid = quotaData.uid;
      email = quotaData.email;
      cost = quotaData.cost;
      modelConfig = quotaData.modelConfig;
    } catch (err: any) {
      return res.status(403).json({ success: false, error: err.message || "Tài khoản đã hết hạn mức AI trong ngày." });
    }
  }

  try {
    const { prompt, contents, systemInstruction, temperature = 0.7, responseMimeType, responseSchema, model } = req.body;
    const payloadContents = contents || prompt;
    if (!payloadContents) {
      return res.status(400).json({ success: false, error: "Dữ liệu gửi lên phải bao gồm 'prompt' hoặc 'contents'." });
    }

    const ai = getGeminiClient(customKey);
    const config: any = {
      temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 1),
    };
    
    if (systemInstruction && typeof systemInstruction === 'string') {
      config.systemInstruction = systemInstruction.slice(0, 4000);
    }
    if (responseMimeType) config.responseMimeType = responseMimeType;
    if (responseSchema) config.responseSchema = responseSchema;

    const targetModel = model || modelConfig.model;
    const response = await ai.models.generateContent({
      model: targetModel,
      contents: payloadContents,
      config
    });

    if (idToken && !idToken.startsWith('dev-')) {
      await recordUsage(uid, email, mode, cost, true);
    }

    return res.json({ success: true, text: response.text, data: response });
  } catch (err: any) {
    if (idToken && !idToken.startsWith('dev-')) {
      await recordUsage(uid, email, mode, cost, false);
    }
    console.error("Gemini Proxy Error:", err);
    return res.status(500).json({ success: false, error: err.message || "Lỗi khi gọi API Gemini." });
  }
});

export default router;