import express from 'express';
import { geminiPool } from './geminiPool.js';
import { verifyAndCheckQuota, recordUsage, sanitizeLogMessage } from './aiUsage.js';

const router = express.Router();

// Helper to send status safely
const handleStatusRequest = (req: express.Request, res: express.Response) => {
  try {
    const state = geminiPool.getPublicState();
    return res.status(200).json(state);
  } catch (err: any) {
    console.error("Error retrieving Gemini Pool state:", err);
    return res.status(200).json({
      success: false,
      totalKeysConfigured: 0,
      usableKeysNow: 0,
      ignoredKeys: [],
      quarantinedKeys: [],
      modelTiers: [],
      stats: {
        totalRequests: 0,
        totalSuccess: 0,
        totalFail: 0,
        rotate429Count: 0,
        fallbackModelCount: 0,
        fallbackKeyCount: 0
      },
      totalConfigured: 0,
      keys: [],
      cooldowns: [],
      modelPriority: [],
      error: err?.message || "Lỗi khi nạp trạng thái Key Pool"
    });
  }
};

// 1. Reference Endpoints: GET /api/gemini/status & GET /api/gemini/rotation-status
router.get('/status', handleStatusRequest);
router.get('/rotation-status', handleStatusRequest);
router.get('/pool', handleStatusRequest);
router.get('/pool-state', handleStatusRequest);

// 2. Refresh Key Pool
router.post('/refresh', (req, res) => {
  try {
    geminiPool.loadGeminiKeys();
    const state = geminiPool.getPublicState();
    return res.status(200).json(state);
  } catch (err: any) {
    console.error("Error refreshing Gemini Pool:", err);
    return res.status(200).json({ success: false, error: err?.message || "Lỗi làm mới Key Pool" });
  }
});

// 3. Fallback GET on base route returns status as JSON
router.get('/', handleStatusRequest);

// 4. POST generic proxy endpoint for Gemini / Chat
router.post('/', async (req, res) => {
  const authHeader = req.headers.authorization;
  const idToken = authHeader?.startsWith('Bearer ') ? authHeader.split('Bearer ')[1] : null;
  const mode = req.body.aiMode || 'balanced';

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
      return res.status(200).json({ success: false, error: err.message || "Tài khoản đã hết hạn mức AI trong ngày." });
    }
  }

  try {
    const { prompt, contents, systemInstruction, temperature = 0.7, responseMimeType, responseSchema, model } = req.body;
    const payloadContents = contents || prompt;

    if (!payloadContents) {
      return res.status(200).json({ success: false, error: "Dữ liệu gửi lên phải bao gồm 'prompt' hoặc 'contents'." });
    }

    const config: any = {
      temperature: Math.min(Math.max(Number(temperature) || 0.7, 0), 1),
    };
    
    if (systemInstruction && typeof systemInstruction === 'string') {
      config.systemInstruction = systemInstruction.slice(0, 4000);
    }
    if (responseMimeType) config.responseMimeType = responseMimeType;
    if (responseSchema) config.responseSchema = responseSchema;

    const targetModel = model || modelConfig.model;
    
    const poolResult = await geminiPool.generateContent(payloadContents, targetModel, config);

    if (idToken && !idToken.startsWith('dev-')) {
      await recordUsage(uid, email, mode, cost, true);
    }

    const responseText = poolResult.response?.text || poolResult.text || '';
    const keyIndexUsed = poolResult.keyIndex ?? 0;
    const isDowngraded = (poolResult.modelFallbacks || 0) > 0;

    return res.json({ 
      success: true, 
      text: responseText, 
      data: poolResult.response,
      usedModel: poolResult.modelUsed,
      keyIndexUsed: keyIndexUsed,
      keyMasked: poolResult.keyMasked,
      downgraded: isDowngraded,
      meta: {
        keyId: poolResult.keyId,
        envName: poolResult.envName,
        keyMasked: poolResult.keyMasked,
        keyIndex: keyIndexUsed,
        modelUsed: poolResult.modelUsed,
        usedModel: poolResult.modelUsed,
        latency: poolResult.latency,
        modelFallbacks: poolResult.modelFallbacks,
        keyRotations: poolResult.keyRotations,
        fallbackModelCount: poolResult.modelFallbacks,
        fallbackKeyCount: poolResult.keyRotations,
        downgraded: isDowngraded
      }
    });

  } catch (err: any) {
    if (idToken && !idToken.startsWith('dev-')) {
      await recordUsage(uid, email, mode, cost, false);
    }
    console.error("Gemini Proxy Error:", err);
    const safeError = sanitizeLogMessage(err?.message || "Lỗi khi gọi API Gemini.");
    return res.status(200).json({ success: false, error: safeError });
  }
});

export default router;
