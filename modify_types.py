import re

with open('src/types.ts', 'r') as f:
    content = f.read()

old_interface = """export interface QuestionBank {
  id: string;"""

new_interface = """export interface QuestionBank {
  id: string;
  type?: 'quiz' | 'word';"""

if old_interface in content:
    content = content.replace(old_interface, new_interface)
    with open('src/types.ts', 'w') as f:
        f.write(content)
    print("Modified types.ts")
else:
    print("Not found in types.ts")
