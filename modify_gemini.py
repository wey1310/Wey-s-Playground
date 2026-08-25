import re

with open('api/gemini.ts', 'r', encoding='utf-8') as f:
    content = f.read()

resolve_func = """
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
"""

content = resolve_func + content

content = content.replace("const customKey = (req.headers['x-gemini-api-key'] as string) || req.body.apiKey;", """const customApiId = (req.headers['x-gemini-api-id'] as string) || req.body.apiId;
  const customKey = await resolveApiKey(customApiId) || process.env.GEMINI_API_KEY;""")

with open('api/gemini.ts', 'w', encoding='utf-8') as f:
    f.write(content)
