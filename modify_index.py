import re

with open('api/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Add resolveApiKey
resolve_func = """
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

# Replace extractApiKey
content = re.sub(
    r"function extractApiKey\(req: Request\): string \| undefined \{.*?\n\}",
    """// Hàm lấy API Id từ Request
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
""" + resolve_func,
    content,
    flags=re.DOTALL
)

# Replace withAiQuota logic
content = re.sub(
    r"const customApiKey = extractApiKey\(req\);",
    """const customApiId = extractApiId(req);
  const resolvedApiKey = await resolveApiKey(customApiId) || process.env.GEMINI_API_KEY;
  (req as any).resolvedApiKey = resolvedApiKey;""",
    content
)

content = re.sub(
    r"if \(customApiKey \|\| process.env.GEMINI_API_KEY\) \{",
    r"if (resolvedApiKey) {",
    content
)

# Replace all getGeminiClient(extractApiKey(req))
content = content.replace("getGeminiClient(extractApiKey(req))", "getGeminiClient((req as any).resolvedApiKey)")

with open('api/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)

