import re
with open('src/services/apiManager.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the import issue
content = content.replace("import { getDoc } from 'firebase/firestore';", "")
content = content.replace("const { getDoc } = await import('firebase/firestore');", "")
content = content.replace("import('firebase/firestore').then(({ increment, updateDoc, doc, Timestamp }) => {", 
                          "import('firebase/firestore').then(({ increment }) => {")

with open('src/services/apiManager.ts', 'w', encoding='utf-8') as f:
    f.write(content)
