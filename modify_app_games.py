import re

with open('src/App.tsx', 'r') as f:
    content = f.read()

# 1. Add import
import_statement = "import { AICameraCallGame } from './components/games/AICameraCallGame';\n"
content = re.sub(r'(import { PictogramGame } from)', r'\1', import_statement + content, count=1) # Just stick it near the top but be safe. Wait, better to just put it after import { RandomCallGame }
content = re.sub(r"(import { RandomCallGame } from '[^']+';)", r"\1\n" + import_statement, content)

# 2. Add to GAMES_LIST
games_list_addition = """
  {
    id: 'ai_star_call',
    title: 'Ngôi Sao Tri Thức',
    description: 'Điều khiển bằng AI Camera, giơ ngón tay gọi tên học sinh ngẫu nhiên.',
    icon: '🌟',
    badge: 'Camera AI',
    color: 'from-blue-600 to-indigo-800',
    tags: ['Khởi động', 'Gọi tên', 'Công Nghệ AI'],
  },
  {
    id: 'ai_galaxy_call',
    title: 'Dải Ngân Hà',
    description: 'Hiệu ứng dải ngân hà tuyệt đẹp. Điều khiển 100% bằng cử chỉ tay.',
    icon: '🌌',
    badge: 'Camera AI',
    color: 'from-purple-600 to-indigo-800',
    tags: ['Khởi động', 'Gọi tên', 'Công Nghệ AI'],
  },
  {
    id: 'ai_nebula_call',
    title: 'Tinh Vân Huyền Bí',
    description: 'Thu hút tinh vân bằng bàn tay. Gọi tên học sinh thật ngầu.',
    icon: '🌠',
    badge: 'Camera AI',
    color: 'from-blue-600 to-purple-800',
    tags: ['Khởi động', 'Gọi tên', 'Công Nghệ AI'],
  },
  {
    id: 'ai_bubble_call',
    title: 'Bong Bóng Trí Tuệ',
    description: 'Chỉ tay để làm nổ bong bóng phép thuật gọi tên.',
    icon: '🫧',
    badge: 'Camera AI',
    color: 'from-cyan-600 to-blue-800',
    tags: ['Khởi động', 'Gọi tên', 'Công Nghệ AI'],
  },
"""
content = re.sub(r'(const GAMES_LIST: GameInfo\[\] = \[)', r'\1' + games_list_addition, content)

# 3. Add to rendering
rendering_addition = """
              {activeGameConfig.gameId === 'ai_star_call' && (
                <AICameraCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} themeType="star" />
              )}
              {activeGameConfig.gameId === 'ai_galaxy_call' && (
                <AICameraCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} themeType="galaxy" />
              )}
              {activeGameConfig.gameId === 'ai_nebula_call' && (
                <AICameraCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} themeType="nebula" />
              )}
              {activeGameConfig.gameId === 'ai_bubble_call' && (
                <AICameraCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} themeType="bubble" />
              )}
"""
content = re.sub(r"({\(activeGameConfig\.gameId === 'openbox')", rendering_addition + r"\1", content)

with open('src/App.tsx', 'w') as f:
    f.write(content)
