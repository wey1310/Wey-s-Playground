import re

with open('api/index.ts', 'r', encoding='utf-8') as f:
    content = f.read()

content = content.replace("let httpStatus = 500;", "let httpStatus = 200;")

with open('api/index.ts', 'w', encoding='utf-8') as f:
    f.write(content)
