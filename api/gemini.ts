
import { initFirebase } from "./aiUsage.js";

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
import express from 'express';
import { GoogleGenAI } from '@google/genai';

// SỬA LỖI TẠI ĐÂY: Thêm đuôi .js
import { verifyAndCheckQuota, recordUsage } from './aiUsage.js';

const router = express.Router();

function getGeminiClient(customApiKey?: string) {
  const apiKey = (customApiKey && typeof customApiKey === 'string' && customApiKey.trim()) || process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY environment variable is not configured.");
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
  const customKey = await resolveApiKey(customApiId) || process.env.GEMINI_API_KEY;
  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
  const mode = req.body.aiMode || 'balanced';

  // If custom API key or server GEMINI_API_KEY is available, proceed immediately
  if (customKey || process.env.GEMINI_API_KEY) {
    try {
      const { prompt, contents, systemInstruction, temperature = 0.7, responseMimeType, responseSchema, model } = req.body;
      const payloadContents = contents || prompt;
      if (!payloadContents) {
        throw new Error("Dữ liệu gửi lên phải bao gồm 'prompt' hoặc 'contents'.");
      }

      const ai = getGeminiClient(customKey);
      const config: any = {
        temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 1),
      };
      
      if (systemInstruction && typeof systemInstruction === 'string') {
        config.systemInstruction = systemInstruction.slice(0, 2000);
      }
      if (responseMimeType) config.responseMimeType = responseMimeType;
      if (responseSchema) config.responseSchema = responseSchema;

      const targetModel = model || (mode === 'smart' ? 'gemini-2.5-pro' : 'gemini-2.5-flash');
      const response = await ai.models.generateContent({
        model: targetModel,
        contents: payloadContents,
        config
      });

      return res.json({ success: true, text: response.text, data: response });
    } catch (err: any) {
      console.error("Gemini Proxy Error:", err);
      return res.status(500).json({ success: false, error: err.message || "Lỗi khi gọi API Gemini." });
    }
  }
  
  if (!idToken) {
    return res.status(401).json({ success: false, error: "Vui lòng nhập/chọn Gemini API Key trong mục 'Quản lý API' hoặc đăng nhập tài khoản Google để sử dụng tính năng AI." });
  }

  let quotaData;
  try {
    quotaData = await verifyAndCheckQuota(idToken, mode);
  } catch (err: any) {
    return res.status(403).json({ success: false, error: err.message });
  }

  const { uid, email, cost, modelConfig } = quotaData;

  try {
    const { prompt, contents, systemInstruction, temperature = 0.7, responseMimeType, responseSchema } = req.body;

    let payloadContents = contents || prompt;
    if (!payloadContents) {
      throw new Error("Dữ liệu gửi lên phải bao gồm 'prompt' hoặc 'contents'.");
    }

    if (typeof payloadContents === 'string' && payloadContents.length > 8000) {
      throw new Error("Độ dài nội dung vượt quá giới hạn cho phép (tối đa 8.000 ký tự).");
    }

    const ai = getGeminiClient(customKey);
    const config: any = {
      temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 1),
    };
    
    if (systemInstruction && typeof systemInstruction === 'string') {
      config.systemInstruction = systemInstruction.slice(0, 2000);
    }
    if (responseMimeType) config.responseMimeType = responseMimeType;
    if (responseSchema) config.responseSchema = responseSchema;

    const response = await ai.models.generateContent({
      model: modelConfig.model,
      contents: payloadContents,
      config
    });

    await recordUsage(uid, email, mode, cost, true);
    res.json({ success: true, text: response.text, data: response });
  } catch (err: any) {
    await recordUsage(uid, email, mode, cost, false);
    console.error("Gemini Proxy Error:", err);
    res.status(500).json({ success: false, error: err.message || "Lỗi khi gọi API Gemini." });
  }
});

export default router;