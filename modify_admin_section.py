import re
with open('src/components/api/AdminApiSection.tsx', 'r', encoding='utf-8') as f:
    content = f.read()
content = content.replace("const saved = apiManager.saveConfig({", "const saved = await apiManager.saveConfig({")
with open('src/components/api/AdminApiSection.tsx', 'w', encoding='utf-8') as f:
    f.write(content)
