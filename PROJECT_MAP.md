# PROJECT MAP - Wey-Play (Ôn Tập Tri Thức - Đấu Trường Game Show)

Mục tiêu: Tiếp tục phát triển project hiện tại, **KHÔNG** xây lại từ đầu, giữ nguyên cấu trúc và chức năng hiện có.

## 1. Core
- `src/App.tsx`: Layout chính, chọn trò chơi, quản lý modal và state trò chơi đang chạy.
- `src/main.tsx`: Entry point React, tích hợp AuthProvider.
- `src/types.ts`: Toàn bộ type definitions (Question, QuestionBank, Team, GameSetupConfig, GameType, GameId, AnswerLog, v.v.).
- `server.ts`: Server Express backend (API proxy gọi Gemini `@google/genai` để sinh câu hỏi tự động).
- `index.html`: Entry HTML template.
- `vite.config.ts` & `package.json`: Config build Vite & scripts runner.

## 2. Authentication & Data Storage
- `src/contexts/AuthContext.tsx`: Context quản lý trạng thái đăng nhập của giáo viên.
- `src/components/LoginButton.tsx`: Nút đăng nhập / đăng xuất trên Navbar.
- `src/lib/db.ts`: Xử lý lưu trữ ngân hàng câu hỏi (LocalStorage / Cloud sync).

## 3. Educational Games (`src/components/games/`)
- `OpenBoxGame.tsx`: Mở hộp bí mật (chọn hộp ngẫu nhiên).
- `MancalaGame.tsx`: Ô ăn quan tri thức.
- `WheelGame.tsx`: Vòng quay kỳ diệu.
- `LudoGame.tsx`: Cờ cá ngựa tri thức.
- `BettingGame.tsx`: Canh bạc tri thức (đặt cược điểm, khiên, hút điểm).
- `BingoGame.tsx`: Bingo tri thức (ô ma trận bingo).
- `TerritoryGame.tsx`: Đấu trường tranh đất.
- `TugOfWarGame.tsx`: Kéo co tri thức 1v1.
- `TowerGame.tsx`: Xây tháp tri thức.
- `PuzzleGame.tsx`: Mảnh ghép bí ẩn (đoán bức tranh sau ô).
- `RaceGame.tsx`: Đua đến đích.
- `PokemonGame.tsx`: Thu phục thú cưng / đánh quái.
- `BattleshipGame.tsx`: Đánh tàu chiến (bắn pháo theo tọa độ).

## 4. UI & Modals (`src/components/`)
- `Navbar.tsx`: Thanh điều hướng chính (logo, chọn ngân hàng câu hỏi, tạo câu hỏi AI, mute âm thanh, quản trị).
- `GameSetupModal.tsx`: Modal cấu hình trước khi chơi (chọn chế độ, số câu, tính thời gian, đội chơi, tên đội).
- `QuestionBankModal.tsx`: Quản lý ngân hàng câu hỏi (thêm/sửa/xóa câu hỏi, nạp file Word/PDF/TXT).
- `AiQuestionModal.tsx`: Modal nhập chủ đề & tạo câu hỏi bằng Gemini AI.
- `QuestionDisplayModal.tsx`: Modal hiển thị câu hỏi và đáp án trong lúc chơi.
- `SummaryModal.tsx`: Modal tổng kết điểm số, xếp hạng và xem lịch sử câu trả lời sau khi kết thúc game.
- `AdminModal.tsx`: Modal quản trị.
- `ErrorBoundary.tsx`: Bắt lỗi React runtime.

## 5. Data & Utilities
- `src/data/defaultBanks.ts`: Bộ ngân hàng câu hỏi mặc định (Toán, Lý, Hóa, Sinh, Sử, Địa, Tiếng Anh, v.v.).
- `src/utils/audio.ts`: Quản lý hiệu ứng âm thanh (soundFx: đúng, sai, thắng, click, toggle mute).
- `src/utils/fileParser.ts`: Đọc và bóc tách câu hỏi từ file `.txt`, `.docx`, `.pdf`.

## 6. Assets (`public/assets/` & `src/assets/`)
- `public/assets/games/`: Hình ảnh, sprite, GIF icon cho từng minigame (betting, ludo, openbox, pokemon, territory, v.v.).
- `public/assets/themes/`: Hình nền chủ đề (cloud.jpg, cowboy.jpg, ocean.jpg, rainbow.jpg).
- `public/assets/home-bg.webp` & `public/assets/logo.png`: Hình nền trang chủ và logo ứng dụng.

---

## BẮT BUỘC TUÂN THỦ (RULES)
1. **Không sửa module ngoài phạm vi yêu cầu.**
2. **Không đổi cấu trúc thư mục nếu không cần thiết.**
3. **Không xóa file đang được sử dụng.**
4. **Không thay đổi API/interface hiện có nếu không được yêu cầu.**
5. **Sau mỗi thay đổi phải chạy build / lint để xác minh.**
6. **Không rewrite toàn bộ project hoặc refactor hàng loạt file.**
7. **Xác định chính xác các file liên quan trước khi sửa.**
8. **Nếu phát hiện lỗi không liên quan đến nhiệm vụ hiện tại, KHÔNG tự ý sửa. Chỉ báo cáo.**
