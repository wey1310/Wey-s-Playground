import re

with open('src/components/games/PictogramGame.tsx', 'r') as f:
    content = f.read()

content = re.sub(r"useState<string>\(\s*'NĂNG LƯỢNG MẶT TRỜI\nQUANG HỢP Ở THỰC VẬT\nHỆ TUẦN HOÀN NGƯỜI'\s*\)", r"useState<string>(`NĂNG LƯỢNG MẶT TRỜI\nQUANG HỢP Ở THỰC VẬT\nHỆ TUẦN HOÀN NGƯỜI`)", content)

with open('src/components/games/PictogramGame.tsx', 'w') as f:
    f.write(content)

print("Fixed PictogramGame.tsx")
