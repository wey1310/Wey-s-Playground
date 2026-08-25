import re
with open('src/services/apiManager.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace(
    "import { collection, doc, setDoc, getDocs, onSnapshot, deleteDoc, updateDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';",
    "import { collection, doc, setDoc, getDoc, getDocs, onSnapshot, deleteDoc, updateDoc, Timestamp, query, orderBy, limit } from 'firebase/firestore';"
)

with open('src/services/apiManager.ts', 'w', encoding='utf-8') as f:
    f.write(content)
