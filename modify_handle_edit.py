import re

with open('src/components/api/AdminApiSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

new_handle = """  const handleEdit = async (config: GeminiApiConfig) => {
    setEditingConfig(config);
    setFormName(config.name);
    setFormEmail(config.email);
    setFormModel(config.model || 'gemini-2.5-flash');
    setFormNotes(config.notes || '');
    setFormEnabled(config.enabled);
    setFormError(null);
    setSubTab('add');
    
    // Fetch actual secret key
    const secretKey = await apiManager.getSecretApiKey(config.id);
    setFormApiKey(secretKey);
  };
"""

content = re.sub(
    r"const handleEdit = \(config: GeminiApiConfig\) => \{.*?\n  \};\n",
    new_handle,
    content,
    flags=re.DOTALL
)

with open('src/components/api/AdminApiSection.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
