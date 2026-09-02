const fs = require('fs');

// 1. Fix AdminGameUIEditor.tsx
let editor = fs.readFileSync('src/components/gameUI/AdminGameUIEditor.tsx', 'utf8');

const gamesList = `const AVAILABLE_GAMES = [
  { id: 'lucky_star', name: 'Ngôi Sao May Mắn (Lucky Star)' },
  { id: 'randomcall', name: 'Gọi Tên Ngẫu Nhiên (Random Call)' },
  { id: 'eggcall', name: 'Đập Trứng Gọi Tên (Egg Call)' },
  { id: 'openbox', name: 'Mở Hộp Bí Mật (Open Box)' },
  { id: 'wheel', name: 'Vòng Quay May Mắn (Wheel)' },
  { id: 'bingo', name: 'Đấu Trường Bingo' },
  { id: 'territory', name: 'Chiếm Lĩnh Lãnh Thổ' },
  { id: 'tugofwar', name: 'Kéo Co Tri Thức' },
  { id: 'tower', name: 'Xây Tháp' },
  { id: 'puzzle', name: 'Ghép Hình' },
  { id: 'race', name: 'Đua Xe' },
  { id: 'blindbox', name: 'Hộp Mù' },
  { id: 'pokemon', name: 'Bắt Pokemon' },
  { id: 'battleship', name: 'Bắn Tàu' },
  { id: 'pictogram', name: 'Đuổi Hình Bắt Chữ' },
  { id: 'magic_wheel', name: 'Vòng Quay Phép Thuật' },
  { id: 'posechallenge', name: 'Thử Thách Tạo Dáng' },
  { id: 'caro', name: 'Cờ Ca-rô' },
  { id: 'whackamole', name: 'Đập Chuột' },
  { id: 'classification', name: 'Phân Loại' },
  { id: 'flagcapture', name: 'Cướp Cờ' },
  { id: 'sackrace', name: 'Nhảy Bao Bố' },
  { id: 'snailwordsearch', name: 'Ốc Sên Tìm Chữ' },
  { id: 'mineboom', name: 'Dò Mìn' },
  { id: 'chess', name: 'Cờ Vua' },
  { id: 'goldminer', name: 'Đào Vàng' },
  { id: 'bearpass', name: 'Truyền Gấu' },
  { id: 'letterarrange', name: 'Sắp Xếp Chữ' },
  { id: 'applepick', name: 'Hái Táo' },
  { id: 'sontinhthuytinh', name: 'Sơn Tinh Thủy Tinh' },
  { id: 'cothu', name: 'Cờ Thú' },
  { id: 'monopoly', name: 'Cờ Tỷ Phú' },
  { id: 'werewolf', name: 'Ma Sói' },
  { id: 'case_investigation', name: 'Hồ Sơ Vụ Án' },
  { id: 'teabattle', name: 'Trận Chiến Trà' },
  { id: 'bowling', name: 'Bowling' },
  { id: 'chase', name: 'Cuộc Đuổi Bắt' },
  { id: 'mancala', name: 'Ô Ăn Quan' },
  { id: 'ai_star_call', name: 'Gọi Tên Ngôi Sao AI' },
  { id: 'ai_galaxy_call', name: 'Gọi Tên Ngân Hà AI' },
  { id: 'ai_nebula_call', name: 'Gọi Tên Tinh Vân AI' },
  { id: 'ai_bubble_call', name: 'Gọi Tên Bong Bóng AI' },
  { id: 'ludo', name: 'Cờ Cá Ngựa' },
  { id: 'betting', name: 'Đặt Cược' }
];`;

editor = editor.replace(/const AVAILABLE_GAMES = \[\s*\{ id: 'lucky_star'[\s\S]*?\];/, gamesList);

// Fix scale logic
editor = editor.replace(/let scale = Math\.min\(1, availableW \/ targetW, availableH \/ targetH\);/, 'let scale = Math.min(availableW / targetW, availableH / targetH);');

// Change save function name from handleSave不成 to handleSaveInner or just fix it
editor = editor.replace(/const handleSave不成 = async \(\) => {/g, 'const handleSave = async () => {');
editor = editor.replace(/const handleSave = handleSave不成;/g, '');

// Change color scheme from dark to light
// 1. bg-slate-950 -> bg-slate-50
// 2. bg-slate-900 -> bg-white
// 3. border-slate-800 -> border-slate-200
// 4. text-slate-100 -> text-slate-800
// 5. text-slate-400 -> text-slate-500
// 6. bg-slate-800 -> bg-slate-100
// 7. hover:bg-slate-800 -> hover:bg-slate-100
// 8. bg-slate-700 -> bg-slate-200
// 9. text-slate-300 -> text-slate-600
// 10. border-slate-700 -> border-slate-300
// 11. text-slate-500 -> text-slate-400

editor = editor.replace(/bg-slate-950/g, 'bg-slate-50');
editor = editor.replace(/bg-slate-900/g, 'bg-white');
editor = editor.replace(/border-slate-800/g, 'border-slate-200');
editor = editor.replace(/border-slate-700/g, 'border-slate-300');
editor = editor.replace(/text-slate-100/g, 'text-slate-800');
editor = editor.replace(/text-slate-200/g, 'text-slate-700');
editor = editor.replace(/text-slate-300/g, 'text-slate-600');
editor = editor.replace(/text-slate-400/g, 'text-slate-500');
editor = editor.replace(/text-slate-500/g, 'text-slate-400');
editor = editor.replace(/bg-slate-800/g, 'bg-slate-100');
editor = editor.replace(/bg-slate-750/g, 'bg-slate-50');
editor = editor.replace(/bg-slate-700/g, 'bg-slate-200');

fs.writeFileSync('src/components/gameUI/AdminGameUIEditor.tsx', editor);

// 2. Fix App.tsx renderEditorGameContent
let app = fs.readFileSync('src/App.tsx', 'utf8');

// The replacement logic:
const newRenderEditor = `const renderEditorGameContent = (gameId: string) => {
    const mockTeams = [
      { id: '1', name: 'Đội 1', score: 0, avatar: '🦁', color: '#3B82F6' },
      { id: '2', name: 'Đội 2', score: 0, avatar: '🐯', color: '#EF4444' },
    ];
    const baseMockConfig = {
      gameId: gameId,
      mode: 'bank',
      teamMode: true,
      teams: mockTeams,
      timerEnabled: true,
      timeLimitSeconds: 30,
      theme: 'basic',
      totalQuestionsNumber: currentQuestions.length || 10,
      studentsList: ['Nguyễn Văn A', 'Trần Thị B', 'Lê Hoàng C', 'Phạm Minh D', 'Vũ Quỳnh E', 'Hoàng Gia F', 'Đặng Thảo G', 'Bùi Đức H'],
    };

    switch (gameId) {
      case 'lucky_star': return <LuckyStarGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'randomcall': return <RandomCallGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'eggcall': return <EggCallGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'openbox': return <OpenBoxGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'wheel': return <WheelGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'bingo': return <BingoGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'territory': return <TerritoryGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'tugofwar': return <TugOfWarGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'tower': return <TowerGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'puzzle': return <PuzzleGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'race': return <RaceGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'blindbox': return <BlindBoxGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'pokemon': return <PokemonGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'battleship': return <BattleshipGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'pictogram': return <PictogramGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'magic_wheel': return <MagicWheelGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'posechallenge': return <PoseChallengeGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'caro': return <CaroGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'whackamole': return <WhackMoleGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'classification': return <ClassificationGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'flagcapture': return <FlagCaptureGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'sackrace': return <SackRaceGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'snailwordsearch': return <SnailWordSearchGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'mineboom': return <MineBoomGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'chess': return <ChessGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'goldminer': return <GoldMinerGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'bearpass': return <BearPassingGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'letterarrange': return <LetterArrangeGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'applepick': return <ApplePickingGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'sontinhthuytinh': return <SonTinhThuyTinhGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'cothu': return <CoThuGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'monopoly': return <MonopolyGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'werewolf': return <WerewolfGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'case_investigation': return <CaseInvestigationGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'teabattle': return <TeaBattleGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'bowling': return <BowlingGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'chase': return <ChaseGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'mancala': return <MancalaGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'ai_star_call': return <AICameraCallGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'ai_galaxy_call': return <AICameraCallGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'ai_nebula_call': return <AICameraCallGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'ai_bubble_call': return <AICameraCallGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'ludo': return <LudoGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
      case 'betting': return <BettingGame config={baseMockConfig as any} questions={currentQuestions} onGameEnd={() => {}} />;
    }

    return (
      <div className="h-full flex flex-col items-center justify-center p-8 text-center bg-slate-50 text-slate-800 rounded-2xl">
        <h3 className="text-xl font-bold mb-2">Đang xem trước trò chơi {gameId}</h3>
        <p className="text-sm text-slate-500">Chọn các thành phần giao diện trên thanh công cụ để chỉnh sửa trực tiếp.</p>
      </div>
    );
  };`;

app = app.replace(/const renderEditorGameContent = \(gameId: string\) => \{[\s\S]*?return \([\s\S]*?<\/[dD]iv>\s*\);\s*\};/, newRenderEditor);

fs.writeFileSync('src/App.tsx', app);
