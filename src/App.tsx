import React, { useState } from 'react';
import { type GameType, type GameId, type GameSetupConfig, type QuestionBank, type Question, type AnswerLog, type Team, PRESET_THEMES } from "./types";
import { DEFAULT_QUESTION_BANKS } from './data/defaultBanks';
import { soundFx } from './utils/audio';

import { QuestionBankEditor } from './components/QuestionBankEditor';
import { AiQuestionModal } from './components/AiQuestionModal';
import { GameStatisticsPanel } from './components/GameStatisticsPanel';
import { GameSetupModal } from './components/GameSetupModal';
import { RefillQuestionsModal } from './components/RefillQuestionsModal';
import { SummaryModal } from './components/SummaryModal';
import { GuestLimitModal } from './components/GuestLimitModal';
import { UnauthorizedDomainModal } from './components/UnauthorizedDomainModal';
import { ApiSelectModal } from './components/api/ApiSelectModal';
import { ApiManagerModal } from './components/api/ApiManagerModal';
import { NavbarApiStatus } from './components/api/NavbarApiStatus';
import { apiManager } from './services/apiManager';

import { OpenBoxGame } from './components/games/OpenBoxGame';
import { MancalaGame } from './components/games/MancalaGame';
import { WheelGame } from './components/games/WheelGame';
import { LudoGame } from './components/games/LudoGame';
import { BettingGame } from './components/games/BettingGame';
import { BingoGame } from './components/games/BingoGame';
import { TerritoryGame } from './components/games/TerritoryGame';
import { TugOfWarGame } from './components/games/TugOfWarGame';
import { TowerGame } from './components/games/TowerGame';
import { PuzzleGame } from './components/games/PuzzleGame';
import { RaceGame } from './components/games/RaceGame';
import { RandomCallGame } from './components/games/RandomCallGame';
import { AICameraCallGame } from './components/games/AICameraCallGame';
import { LuckyStarGame } from './components/games/LuckyStarGame';

import { EggCallGame } from './components/games/EggCallGame';
import { BlindBoxGame } from './components/games/BlindBoxGame';
import { PokemonGame } from './components/games/PokemonGame';
import { BattleshipGame } from './components/games/BattleshipGame';

import { PictogramGame } from './components/games/PictogramGame';
import { MagicWheelGame } from './components/games/MagicWheelGame';
import { PoseChallengeGame } from './components/games/PoseChallengeGame';
import { CaroGame } from './components/games/CaroGame';
import { ChessGame } from './components/games/ChessGame';

import { WhackMoleGame } from './components/games/WhackMoleGame';
import { ClassificationGame } from './components/games/ClassificationGame';
import { FlagCaptureGame } from './components/games/FlagCaptureGame';
import { SackRaceGame } from './components/games/SackRaceGame';
import { SnailWordSearchGame } from './components/games/SnailWordSearchGame';

import { MineBoomGame } from './components/games/MineBoomGame';
import { GoldMinerGame } from './components/games/GoldMinerGame';
import { BearPassingGame } from './components/games/BearPassingGame';
import { LetterArrangeGame } from './components/games/LetterArrangeGame';
import { ApplePickingGame } from './components/games/ApplePickingGame';
import { SonTinhThuyTinhGame } from "./components/games/SonTinhThuyTinhGame";
import { CoThuGame } from './components/games/CoThuGame';
import { MonopolyGame } from './components/games/MonopolyGame';
import { WerewolfGame } from './components/games/WerewolfGame';
import { CaseInvestigationGame } from './components/games/detective/CaseInvestigationGame';
import { TeaBattleGame } from './components/games/TeaBattleGame';
import { BowlingGame } from './components/games/BowlingGame';
import { ChaseGame } from './components/games/ChaseGame';
import { QuickActionMenu } from './components/QuickActionMenu';

import { BgMusicControllerModal } from './components/BgMusicControllerModal';
import { bgMusicManager } from './utils/bgMusic';

import { LoginButton } from './components/LoginButton';
import { AdminView, WebConfig } from './components/AdminView';
import { QuestionBankView } from './components/QuestionBankView';
import { GameQuickGuideModal } from './components/GameQuickGuideModal';
import { WeyGuideMascot } from './components/WeyGuideMascot';
import { useAuth } from './contexts/AuthContext';
import { saveQuestionBankToCloud, deleteCloudQuestionBank, getCloudQuestionBanks } from './lib/db';
import { getPlayLimitStatus, consumePlayCount, PlayLimitStatus } from './utils/playLimit';

import {
  Sparkles,
  BookOpen,
  Volume2,
  VolumeX,
  Play,
  RotateCcw,
  Trophy,
  Flame,
  Award,
  Gamepad2,
  CheckCircle2,
  Users,
  Grid,
  HelpCircle,
  Database,
  ShieldCheck,
  Bell,
  Lock,
  Maximize,
  Minimize,
  Key,
  Music,
  Search,
  Tag,
  Filter,
  X,
} from 'lucide-react';

export interface GameInfo {
  id: GameType;
  title: string;
  description: string;
  icon: string;
  badge: string;
  color: string;
  tags?: string[];
}

export const GAMES_LIST: GameInfo[] = [
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

  {
    id: 'eggcall',
    title: 'Đập Trứng Gọi Tên',
    description: 'Trò chơi điểm danh ngẫu nhiên vui nhộn với hiệu ứng đập trứng.',
    icon: '🥚',
    badge: 'Mini Game',
    color: 'from-orange-400 to-red-500',
    tags: ['Khởi động', 'Gọi tên'],
  },
  {
    id: 'blindbox',
    title: 'Blind Box',
    description: 'Mở hộp mù ngẫu nhiên nhận điểm số bí mật và trả lời câu hỏi.',
    icon: '🎁',
    badge: 'Trắc nghiệm',
    color: 'from-pink-500 to-purple-600',
    tags: ['Khởi động', 'Đồng đội', 'Luyện tập'],
  },
  {
    id: 'lucky_star',
    title: '⭐ Ngôi Sao May Mắn',
    description: 'Bầu trời sao vũ trụ lung linh, xáo trộn huyền ảo và ngẫu nhiên chọn ra học sinh may mắn.',
    icon: '⭐',
    badge: 'Mới • Bầu trời sao',
    color: 'from-amber-500 via-yellow-400 to-amber-600',
    tags: ['Khởi động', 'Gọi tên', 'Lớp học', 'Vũ trụ'],
  },
  {
    id: 'randomcall',
    title: 'Gọi Tên Ngẫu Nhiên',
    description: 'Điều khiển bằng cử chỉ tay qua Camera để chọn học sinh ngẫu nhiên và trả lời câu hỏi.',
    icon: '🤚',
    badge: 'Công Nghệ AI',
    color: 'from-blue-600 to-indigo-800',
    tags: ['Khởi động', 'Luyện tập', 'Gọi tên'],
  },
  {
    id: 'openbox',
    title: 'Hộp Quà May Mắn',
    description: 'Mở hộp quà bất ngờ, trả lời câu hỏi tích điểm thưởng.',
    icon: '🎁',
    badge: 'Trắc nghiệm',
    color: 'from-amber-500 to-rose-600',
    tags: ['Khởi động', 'Luyện tập'],
  },
  {
    id: 'mancala',
    title: 'Ô Ăn Quan',
    description: 'Trò chơi dân gian kết hợp hỏi đáp, rải quân ăn điểm.',
    icon: '🏺',
    badge: 'Trí tuệ',
    color: 'from-amber-600 to-amber-900',
    tags: ['Đấu trí', 'Tìm hiểu kiến thức'],
  },
  {
    id: 'wheel',
    title: 'Vòng Quay Kỳ Diệu',
    description: 'Thử vận may với vòng quay, chinh phục thử thách.',
    icon: '🎡',
    badge: 'May mắn',
    color: 'from-purple-500 to-pink-600',
    tags: ['Khởi động', 'Gọi tên'],
  },
  {
    id: 'ludo',
    title: 'Đua Cá Ngựa',
    description: 'Tung xúc xắc, vượt chướng ngại vật đưa ngựa về chuồng.',
    icon: '🎲',
    badge: 'Chiến thuật',
    color: 'from-blue-500 to-indigo-600',
    tags: ['Đồng đội', 'Luyện tập'],
  },
  {
    id: 'betting',
    title: 'Cược Điểm Sinh Tử',
    description: 'Cược số điểm bạn tin tưởng và nhân đôi phần thưởng.',
    icon: '💰',
    badge: 'Mạo hiểm',
    color: 'from-emerald-500 to-teal-600',
    tags: ['Đấu trí', 'Củng cố'],
  },
  {
    id: 'bingo',
    title: 'Bingo Tri Thức',
    description: 'Điền đúng câu hỏi để tạo thành hàng thẳng chiến thắng.',
    icon: '🎯',
    badge: 'Kịch tính',
    color: 'from-rose-500 to-orange-500',
    tags: ['Luyện tập', 'Củng cố'],
  },
  {
    id: 'territory',
    title: 'Chiếm Lãnh Thổ',
    description: 'Trả lời đúng để mở rộng bờ cõi bản đồ cho đội mình.',
    icon: '🗺️',
    badge: 'Đồng đội',
    color: 'from-amber-500 to-yellow-600',
    tags: ['Đồng đội', 'Luyện tập'],
  },
  {
    id: 'tug_of_war',
    title: 'Kéo Co Trí Tuệ',
    description: 'Kéo dây về phía đội mình bằng tốc độ trả lời đúng.',
    icon: '🪢',
    badge: 'Tốc độ',
    color: 'from-red-500 to-amber-600',
    tags: ['Vận động', 'Đồng đội', 'Khởi động'],
  },
  {
    id: 'tower',
    title: 'Xây Tháp Tri Thức',
    description: 'Chồng từng tầng tháp thật cao bằng những câu trả lời chuẩn xác.',
    icon: '🏗️',
    badge: 'Kiên trì',
    color: 'from-cyan-500 to-blue-600',
    tags: ['Luyện tập', 'Củng cố'],
  },
  {
    id: 'puzzle',
    title: 'Mảnh Ghép Bí Ẩn',
    description: 'Lật mở từng ô tranh bí mật phía sau các câu đố hóc búa.',
    icon: '🧩',
    badge: 'Khám phá',
    color: 'from-violet-500 to-purple-700',
    tags: ['Khởi động', 'Tìm hiểu kiến thức'],
  },
  {
    id: 'race',
    title: 'Đua Xe Siêu Tốc',
    description: 'Tăng tốc về đích đầu tiên bằng cách giải toán thần sầu.',
    icon: '🏎️',
    badge: 'Cạnh tranh',
    color: 'from-red-600 to-rose-700',
    tags: ['Luyện tập', 'Củng cố'],
  },
  {
    id: 'pokemon',
    title: 'Bắt Pokemon',
    description: 'Sưu tập các Pokemon huyền thoại khi chinh phục câu hỏi.',
    icon: '⚡',
    badge: 'Sưu tầm',
    color: 'from-yellow-400 to-amber-500',
    tags: ['Luyện tập', 'Khởi động'],
  },
  {
    id: 'battleship',
    title: 'Bắn Tàu Chiến',
    description: 'Định vị tọa độ bắn chìm hạm đội tàu đối phương.',
    icon: '🚢',
    badge: 'Đấu trí',
    color: 'from-slate-600 to-blue-900',
    tags: ['Đấu trí', 'Củng cố'],
  },
  {
    id: 'pictogram',
    title: 'Đuổi Hình Bắt Chữ',
    description: 'Nhìn hình đoán ý, lật mở câu thành ngữ bí ẩn.',
    icon: '🖼️',
    badge: 'Ô chữ',
    color: 'from-amber-400 to-orange-500',
    tags: ['Khởi động', 'Tìm hiểu kiến thức'],
  },
  {
    id: 'magic_wheel',
    title: 'Chiếc Nón Kỳ Diệu',
    description: 'Bảng ô chữ bí mật, trả lời câu hỏi và lật mở từng chữ cái.',
    icon: '🔮',
    badge: 'Ô chữ',
    color: 'from-purple-600 to-indigo-700',
    tags: ['Tìm hiểu kiến thức', 'Đấu trí'],
  },
  {
    id: 'pose_challenge',
    title: 'Thử Thách Vận Động',
    description: 'Tạo dáng động tác hình thể tương ứng với đáp án bạn chọn.',
    icon: '🤸',
    badge: 'Vận động',
    color: 'from-emerald-400 to-teal-500',
    tags: ['Vận động', 'Khởi động'],
  },
  {
    id: 'caro',
    title: 'Cờ Caro (3x3)',
    description: 'Đấu trí Caro 2 đội, trả lời đúng để đánh X/O tạo hàng 3.',
    icon: '❌',
    badge: 'Chiến thuật',
    color: 'from-rose-500 to-red-600',
    tags: ['Đấu trí', 'Củng cố', 'Đồng đội'],
  },
  {
    id: 'chess',
    title: 'Cờ Vua Tri Thức',
    description: 'Đại chiến Cờ Vua 2 đội, định hướng vị trí đi và bắt Vua đối phương.',
    icon: '♟️',
    badge: 'Đấu trí',
    color: 'from-amber-700 to-slate-900',
    tags: ['Đấu trí', 'Đồng đội'],
  },
  {
    id: 'whack_a_mole',
    title: 'Đập Chuột Chũi',
    description: 'Phản xạ nhanh tay đập trúng chú chuột mang đáp án chính xác trên sân cỏ.',
    icon: '🔨',
    badge: 'Phản xạ',
    color: 'from-amber-600 to-yellow-500',
    tags: ['Khởi động', 'Luyện tập', 'Vận động'],
  },
  {
    id: 'classification',
    title: 'Phân Loại',
    description: 'Kéo thả hoặc phân chia các đối tượng vào nhóm kiến thức tương ứng.',
    icon: '📁',
    badge: 'Kiến thức',
    color: 'from-teal-500 to-emerald-600',
    tags: ['Luyện tập', 'Tìm hiểu kiến thức', 'Đồng đội'],
  },
  {
    id: 'flag_capture',
    title: 'Cướp Cờ',
    description: 'Gameshow cướp cờ kịch tính, trả lời đúng để bứt tốc giật cờ vàng về căn cứ.',
    icon: '🚩',
    badge: 'Vận động',
    color: 'from-red-500 to-amber-500',
    tags: ['Vận động', 'Đồng đội', 'Đấu trí'],
  },
  {
    id: 'sack_race',
    title: 'Nhảy Bao Bố',
    description: 'Đua nhảy bao bố nhiều làn, trả lời đúng để bật nhảy bứt phá về đích.',
    icon: '🌾',
    badge: 'Đua tốc độ',
    color: 'from-green-500 to-emerald-700',
    tags: ['Vận động', 'Đồng đội', 'Luyện tập'],
  },
  {
    id: 'snail_word_search',
    title: 'Ốc Sên Tinh Mắt',
    description: 'Tìm từ khóa ẩn giấu trong ma trận chữ cái cùng linh vật Ốc Sên tinh nghịch.',
    icon: '🐌',
    badge: 'Tìm từ',
    color: 'from-lime-500 to-emerald-600',
    tags: ['Tìm hiểu kiến thức', 'Đấu trí', 'Luyện tập'],
  },
  {
    id: 'mine_boom',
    title: 'Dò Boom Tri Thức',
    description: 'Chiến thuật chọn ô né Boom, trả lời câu hỏi và ăn điểm vàng kịch tính.',
    icon: '💣',
    badge: 'Cân não',
    color: 'from-amber-600 to-red-600',
    tags: ['Đấu trí', 'Đồng đội', 'Luyện tập'],
  },
  {
    id: 'gold_miner',
    title: 'Đào Vàng',
    description: 'Canh chuẩn góc thả móc neo để kéo vàng nguyên khối, né tránh đá tảng.',
    icon: '⛏️',
    badge: 'Khéo léo',
    color: 'from-amber-500 to-yellow-600',
    tags: ['Khởi động', 'Luyện tập', 'Đồng đội'],
  },
  {
    id: 'bear_pass',
    title: 'Truyền Gấu Sân Khấu',
    description: 'Âm nhạc phát rộn ràng, chú gấu dừng bất ngờ khi nhạc tắt để tìm người may mắn.',
    icon: '🧸',
    badge: 'Gọi tên',
    color: 'from-emerald-500 to-teal-600',
    tags: ['Khởi động', 'Gọi tên', 'Vận động'],
  },
  {
    id: 'letter_arrange',
    title: 'Sắp Xếp Chữ Cái',
    description: 'Sắp xếp các thẻ chữ cái tiếng Việt bị xáo trộn thành từ khóa kiến thức chuẩn.',
    icon: '🔤',
    badge: 'Ô chữ',
    color: 'from-indigo-500 to-purple-600',
    tags: ['Tìm hiểu kiến thức', 'Luyện tập', 'Củng cố'],
  },
  {
    id: 'apple_pick',
    title: 'Hái Táo (Ông Smith)',
    description: 'Bàn cờ hái táo chiến thuật, né tránh ô chia hết cho số bí mật của Ông Smith.',
    icon: '🍎',
    badge: 'Boardgame',
    color: 'from-red-500 to-rose-700',
    tags: ['Đấu trí', 'Đồng đội', 'Luyện tập'],
  },
  {
    id: "cothu",
    title: "Cờ Thú (Jungle Chess)",
    description: "Trận chiến trí tuệ của các loài vật, ăn quân theo cấp bậc và đưa quân vào hang ổ đối phương.",
    icon: "🐾",
    badge: "Chiến thuật",
    color: "from-green-600 to-emerald-700",
  },
  {
    id: 'son_tinh_thuy_tinh',
    title: 'Sơn Tinh Thủy Tinh',
    description: 'Đại chiến chiến thuật tìm sính lễ, thi triển thần phép dâng núi và gọi lũ dâng nước.',
    icon: '⚔️',
    badge: 'Chiến thuật',
    color: 'from-emerald-600 to-blue-700',
    tags: ['Đấu trí', 'Đồng đội', 'Tìm hiểu kiến thức'],
  },
  {
    id: 'monopoly',
    title: 'Cờ Tỷ Phú Tri Thức',
    description: 'Boardgame kinh tế giáo dục theo lượt: trả lời câu hỏi, gieo xúc xắc, mua đất, xây nhà, thu tiền thuê & rút thẻ sự kiện!',
    icon: '🎩',
    badge: 'Boardgame',
    color: 'from-amber-600 to-yellow-700',
    tags: ['Đấu trí', 'Đồng đội', 'Luyện tập'],
  },
  {
    id: 'werewolf_village',
    title: 'Ma Sói: Ngôi Làng Bí Ẩn',
    description: 'Đấu trí điều tra 12 cư dân AI thông minh: chu kỳ đêm/ngày huyền bí, trả lời câu hỏi để mở quyền đoán nhân dạng kẻ giấu mặt!',
    icon: '🐺',
    badge: 'Trinh thám',
    color: 'from-indigo-900 to-slate-950',
    tags: ['Đấu trí', 'Đồng đội', 'Tìm hiểu kiến thức', 'Củng cố'],
  },
  {
    id: 'case_investigation',
    title: 'Hồ Sơ Vụ Án (Conan Mystery)',
    description: 'Đại chiến suy luận thám tử đỉnh cao: khám nghiệm hiện trường, bóc trần mâu thuẫn lời khai, giải mã timeline và chỉ điểm kẻ thủ ác!',
    icon: '🔎',
    badge: 'Thám tử',
    color: 'from-amber-800 to-stone-950',
    tags: ['Đấu trí', 'Đồng đội', 'Tìm hiểu kiến thức', 'Củng cố'],
  },
  {
    id: 'tea_battle',
    title: 'Đại Chiến Trà (Tanjiro vs Kanao)',
    description: 'Nhập vai Tanjiro khiêu chiến Kanao: chọn cốc trà theo số thứ tự, trả lời câu hỏi để úp cốc thắng điểm hoặc bị tạt trà!',
    icon: '🍵',
    badge: 'Trà Đạo Anime',
    color: 'from-emerald-700 to-teal-900',
    tags: ['Đấu trí', 'Đồng đội', 'Luyện tập', 'Củng cố'],
  },
  {
    id: 'bowling',
    title: 'Bowling Trí Tuệ',
    description: 'Sàn Bowling giáo dục: trả lời đúng để nhận bóng ném, canh lực và góc ném ngã Strike toàn bộ 10 Pins!',
    icon: '🎳',
    badge: 'Physics',
    color: 'from-amber-600 to-red-800',
    tags: ['Khởi động', 'Luyện tập', 'Vận động'],
  },
  {
    id: 'chase',
    title: 'Rượt Bắt (Tom & Jerry Catch)',
    description: 'Mèo Tom truy bắt chuột Jerry trong phòng khách: trả lời đúng để vào săn bắt, đoán đúng vị trí đồ vật nhân đôi x2 điểm!',
    icon: '🐱🐭',
    badge: 'Truy Tìm x2 Điểm',
    color: 'from-indigo-700 to-purple-900',
    tags: ['Đồng đội', 'Đấu trí', 'Củng cố'],
  },
];

const getTagColor = (tag: string) => {
  switch (tag) {
    case 'Khởi động': return 'bg-[#FFE4E1] text-[#D86C70] border-[#F8BBD0]'; // Pastel Pink/Red
    case 'Luyện tập': return 'bg-[#E3F2FD] text-[#2C629F] border-[#BBDEFB]'; // Pastel Blue
    case 'Tìm hiểu kiến thức': return 'bg-[#FFF9C4] text-[#8C7B14] border-[#FFF59D]'; // Pastel Yellow
    case 'Gọi tên': return 'bg-[#E1BEE7] text-[#6A1B9A] border-[#CE93D8]'; // Pastel Purple
    case 'Củng cố': return 'bg-[#C8E6C9] text-[#2E7D32] border-[#A5D6A7]'; // Pastel Green
    case 'Vận động': return 'bg-[#FFCCBC] text-[#D84315] border-[#FFAB91]'; // Pastel Deep Orange
    case 'Đấu trí': return 'bg-[#B2EBF2] text-[#006064] border-[#80DEEA]'; // Pastel Cyan
    case 'Đồng đội': return 'bg-[#FFECB3] text-[#F57F17] border-[#FFE082]'; // Pastel Amber
    default: return 'bg-gray-100 text-gray-700 border-gray-300';
  }
};

const getBadgeStyle = (badge: string) => {
  switch (badge) {
    case 'Trắc nghiệm':
      return 'bg-w-accent-light text-w-primary-dark border-w-accent-border';
    case 'Trí tuệ':
      return 'bg-[#FAF3D1] text-[#7A6218] border-[#E9D58F]';
    case 'May mắn':
      return 'bg-[#FBE8EC] text-[#913B53] border-[#F2B6C7]';
    case 'Chiến thuật':
      return 'bg-[#E2EED3] text-w-primary-hover border-w-accent-border';
    case 'Mạo hiểm':
      return 'bg-w-accent-light text-w-primary-dark border-w-accent-border';
    case 'Kịch tính':
      return 'bg-[#FBE8EC] text-[#913B53] border-[#F2B6C7]';
    case 'Đồng đội':
      return 'bg-[#FAF3D1] text-[#7A6218] border-[#E9D58F]';
    case 'Tốc độ':
      return 'bg-[#FBE8EC] text-[#913B53] border-[#F2B6C7]';
    case 'Kiên trì':
      return 'bg-[#E2EED3] text-w-primary-hover border-w-accent-border';
    case 'Khám phá':
      return 'bg-w-accent-light text-w-primary-dark border-w-accent-border';
    case 'Cạnh tranh':
      return 'bg-[#FBE8EC] text-[#913B53] border-[#F2B6C7]';
    case 'Sưu tầm':
      return 'bg-[#FAF3D1] text-[#7A6218] border-[#E9D58F]';
    case 'Đấu trí':
      return 'bg-[#E2EED3] text-w-primary-hover border-w-accent-border';
    case 'Ô chữ':
      return 'bg-[#FAF3D1] text-[#7A6218] border-[#E9D58F]';
    case 'Vận động':
      return 'bg-[#E2EED3] text-w-primary-hover border-w-accent-border';
    default:
      return 'bg-w-accent-light text-w-primary-dark border-w-accent-border';
  }
};

export default function App() {
  const {
    user,
    isAdmin,
    isBlocked,
    errorMessage,
    clearError,
    loginWithGoogle,
    showUnauthorizedModal,
    setShowUnauthorizedModal,
  } = useAuth();

  // Play limit state for guests (3 plays/day)
  const [playLimitStatus, setPlayLimitStatus] = useState<PlayLimitStatus>(() =>
    getPlayLimitStatus(!!user)
  );
  const [isGuestLimitModalOpen, setIsGuestLimitModalOpen] = useState<boolean>(false);

  // Sync play limit when user changes
  React.useEffect(() => {
    setPlayLimitStatus(getPlayLimitStatus(!!user));
  }, [user]);

  // Question banks list with localStorage persistence & automatic preset merging
  const [questionBanks, setQuestionBanks] = useState<QuestionBank[]>(() => {
    const map = new Map<string, QuestionBank>();
    // Always pre-populate with all default preset question banks (2 standard SGK banks)
    DEFAULT_QUESTION_BANKS.forEach(b => map.set(b.id, b));

    const saved = localStorage.getItem('wey_question_banks_v4') || localStorage.getItem('wey_question_banks_v3') || localStorage.getItem('wey_question_banks_v2');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          parsed.forEach((b: QuestionBank) => {
            if (b.isPreset) {
              // Only keep preset if it exists in current DEFAULT_QUESTION_BANKS
              const latestPreset = DEFAULT_QUESTION_BANKS.find(def => def.id === b.id);
              if (latestPreset) {
                map.set(b.id, latestPreset);
              }
            } else {
              map.set(b.id, b);
            }
          });
        }
      } catch (e) {}
    }
    return Array.from(map.values());
  });

  // Ensure any newly added DEFAULT_QUESTION_BANKS are merged immediately and obsolete presets removed
  React.useEffect(() => {
    setQuestionBanks(prev => {
      let changed = false;
      const map = new Map<string, QuestionBank>();
      DEFAULT_QUESTION_BANKS.forEach(b => {
        map.set(b.id, b);
      });
      prev.forEach(b => {
        // Keep non-preset banks (user custom created)
        if (!b.isPreset) {
          map.set(b.id, b);
        }
      });
      const result = Array.from(map.values());
      if (result.length !== prev.length) {
        changed = true;
      }
      return changed ? result : prev;
    });
  }, []);

  // Sync questionBanks to localStorage
  React.useEffect(() => {
    localStorage.setItem('wey_question_banks_v4', JSON.stringify(questionBanks));
  }, [questionBanks]);

  // Load cloud question banks when user is logged in
  React.useEffect(() => {
    if (user?.uid) {
      getCloudQuestionBanks(user.uid).then(cloudBanks => {
        if (cloudBanks && cloudBanks.length > 0) {
          setQuestionBanks(prev => {
            const map = new Map<string, QuestionBank>();
            DEFAULT_QUESTION_BANKS.forEach(b => map.set(b.id, b));
            prev.forEach(b => map.set(b.id, b));
            cloudBanks.forEach(b => map.set(b.id, b));
            return Array.from(map.values());
          });
        }
      });
    }
  }, [user?.uid]);

  // Active question bank ID initialized with newest bank
  const [activeBankId, setActiveBankId] = useState<string>(() => {
    const savedId = localStorage.getItem('wey_active_bank_id');
    if (savedId && questionBanks.some(b => b.id === savedId)) return savedId;
    const sorted = [...questionBanks].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    return sorted[0]?.id || DEFAULT_QUESTION_BANKS[0].id;
  });

  React.useEffect(() => {
    localStorage.setItem('wey_active_bank_id', activeBankId);
  }, [activeBankId]);

  // Web Configuration State with localStorage persistence
  const [webConfig, setWebConfig] = useState<WebConfig>(() => {
    const saved = localStorage.getItem('wey_web_config');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return {
      siteTitle: "WEY'S PLAYGROUND",
      siteSubtitle: "Kho Game Online Sinh Động Của Wey",
      bgImageUrl: "/assets/home-bg.webp",
      announcement: "",
      primaryTheme: "pastel",
    };
  });

  React.useEffect(() => {
    localStorage.setItem('wey_web_config', JSON.stringify(webConfig));
    document.title = webConfig.siteTitle || "WEY'S PLAYGROUND";
    
    // Apply dynamic theme to body
    const themeClass = webConfig.primaryTheme && webConfig.primaryTheme !== 'pastel' ? `theme-${webConfig.primaryTheme}` : '';
    // Remove all theme classes first
    Array.from(document.body.classList).forEach(c => {
      if (c.startsWith('theme-')) {
        document.body.classList.remove(c);
      }
    });
    // Add the selected theme if any
    if (themeClass) {
      document.body.classList.add(themeClass);
    }
  }, [webConfig]);

  // Handler to keep only the single latest question bank ("Chốt cái mới nhất thôi")
  const handleKeepOnlyLatestBank = async () => {
    const sorted = [...questionBanks].sort(
      (a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
    const latest = sorted[0];
    if (latest) {
      setQuestionBanks([latest]);
      setActiveBankId(latest.id);

      // Also delete old banks from cloud
      const oldBanks = sorted.slice(1);
      for (const bank of oldBanks) {
        if (!bank.isPreset) {
          await deleteCloudQuestionBank(bank.id);
        }
      }
    }
  };

  const [playCounts, setPlayCounts] = useState<Record<string, number>>(() => {
    try {
      const stored = localStorage.getItem('wey_game_play_counts');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  const [totalQuestionsAnswered, setTotalQuestionsAnswered] = useState<number>(() => {
    try {
      const stored = localStorage.getItem('wey_total_questions_answered');
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [gameSortBy, setGameSortBy] = useState<'newest' | 'most_played' | 'alphabetical'>('newest');

  // Audio State
  const [isMuted, setIsMuted] = useState<boolean>(soundFx.getMute());

  // Active Modals
  const [isAiModalOpen, setIsAiModalOpen] = useState<boolean>(false);
  const [isApiSelectModalOpen, setIsApiSelectModalOpen] = useState<boolean>(false);
  const [isApiManagerModalOpen, setIsApiManagerModalOpen] = useState<boolean>(false);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState<boolean>(false);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState<boolean>(false);
  const [showRefillModal, setShowRefillModal] = useState<boolean>(false);
  const [isQuickGuideOpen, setIsQuickGuideOpen] = useState<boolean>(false);
  const [quickGuideGameId, setQuickGuideGameId] = useState<GameId | string>('openbox');

  const handleRefillConfirm = (updates: Partial<GameSetupConfig>) => {
    if (activeGameConfig) {
      setActiveGameConfig({ ...activeGameConfig, ...updates });
      setShowRefillModal(false);
    }
  };

  // Setup & Active Game state
  const [selectedGameType, setSelectedGameType] = useState<GameType>('openbox');
  const [activeGameConfig, setActiveGameConfig] = useState<GameSetupConfig | null>(null);
  
  // Fullscreen & Stage ResizeObserver state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const gameContainerRef = React.useRef<HTMLDivElement>(null);
  const gameStageLayoutRef = React.useRef<HTMLDivElement>(null);
  const [stageMetrics, setStageMetrics] = useState<{
    width: number;
    height: number;
    scale: number;
    isCompactHeight: boolean;
    isVeryCompact: boolean;
    isNarrow: boolean;
    gridTemplateColumns: string;
    gap: string;
    columnCount: number;
  }>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1280,
    height: typeof window !== 'undefined' ? window.innerHeight : 800,
    scale: 1,
    isCompactHeight: false,
    isVeryCompact: false,
    isNarrow: false,
    gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
    gap: '16px',
    columnCount: 4,
  });

  // ResizeObserver & Fullscreen Aggressive Recalculation on gameContainer and game-stage-layout
  React.useEffect(() => {
    let timeoutIds: any[] = [];

    // Dedicated forcing function to recalculate and dynamically enforce grid-template-columns, gap, and padding
    const forceResetStageLayout = (_entries?: ResizeObserverEntry[]) => {
      const containerEl = gameContainerRef.current;
      const stageEl = gameStageLayoutRef.current;
      const isFsActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );

      // Measure dimensions from stage element or container fallback
      const stageRect = stageEl?.getBoundingClientRect();
      const containerRect = containerEl?.getBoundingClientRect();

      const width = isFsActive
        ? Math.max(window.innerWidth, stageRect?.width || 0, containerRect?.width || 0, document.documentElement.clientWidth || 0)
        : (stageRect?.width || containerRect?.width || window.innerWidth);

      const height = isFsActive
        ? Math.max(window.innerHeight, stageRect?.height || 0, containerRect?.height || 0, document.documentElement.clientHeight || 0)
        : (stageRect?.height || containerRect?.height || window.innerHeight);

      // Calculate adaptive scale factor for standard and projector widescreen displays
      const baseHeight = isFsActive ? 820 : 740;
      const calculatedScale = Math.min(1.2, Math.max(0.75, height / baseHeight));

      const isCompactHeight = height < 740;
      const isVeryCompact = height < 580;
      const isNarrow = width < 768;

      // Dynamically determine gridTemplateColumns & columnCount for true 100% display experience
      let columnCount = 4;
      let gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      if (width < 500 || (isVeryCompact && width < 600)) {
        columnCount = 1;
        gridTemplateColumns = 'repeat(1, minmax(0, 1fr))';
      } else if (width < 780 || (isCompactHeight && width < 900)) {
        columnCount = 2;
        gridTemplateColumns = 'repeat(2, minmax(0, 1fr))';
      } else if (width < 1120) {
        columnCount = 3;
        gridTemplateColumns = 'repeat(3, minmax(0, 1fr))';
      } else {
        columnCount = 4;
        gridTemplateColumns = 'repeat(4, minmax(0, 1fr))';
      }

      // Dynamically determine gap value to prevent overflow in tight/small window scenarios
      let gap = '16px';
      if (isVeryCompact || width < 480) {
        gap = '6px';
      } else if (isCompactHeight || isNarrow || width < 768) {
        gap = '10px';
      } else if (width < 1024) {
        gap = '12px';
      } else {
        gap = '16px';
      }

      const padY = isVeryCompact ? '4px' : isCompactHeight ? '8px' : isFsActive ? '12px' : '16px';
      const padX = isNarrow ? '6px' : isCompactHeight ? '10px' : isFsActive ? '14px' : '20px';

      // Forcing function directly writes to DOM style properties on both stage and container
      if (stageEl) {
        stageEl.style.setProperty('--stage-grid-cols', gridTemplateColumns);
        stageEl.style.setProperty('--stage-gap', gap);
        stageEl.style.setProperty('--grid-template-columns', gridTemplateColumns);
        stageEl.style.setProperty('--gap', gap);
        stageEl.style.setProperty('--stage-scale', String(calculatedScale));
        stageEl.style.setProperty('--stage-pad-y', padY);
        stageEl.style.setProperty('--stage-pad-x', padX);
      }

      if (containerEl) {
        containerEl.style.setProperty('--stage-width', `${width}px`);
        containerEl.style.setProperty('--stage-height', `${height}px`);
        containerEl.style.setProperty('--stage-scale', String(calculatedScale));
        containerEl.style.setProperty('--stage-pad-y', padY);
        containerEl.style.setProperty('--stage-pad-x', padX);
        containerEl.style.setProperty('--stage-grid-cols', gridTemplateColumns);
        containerEl.style.setProperty('--stage-gap', gap);
        containerEl.style.setProperty('--grid-template-columns', gridTemplateColumns);
        containerEl.style.setProperty('--gap', gap);
      }

      setStageMetrics({
        width,
        height,
        scale: calculatedScale,
        isCompactHeight,
        isVeryCompact,
        isNarrow,
        gridTemplateColumns,
        gap,
        columnCount,
      });
    };

    // Multi-pass recalculation schedule to ensure layout adapts across all browser fullscreen animation phases
    const triggerAggressiveRecalculation = () => {
      // 1. Immediate sync pass
      forceResetStageLayout();

      // 2. RequestAnimationFrame pass
      if (typeof window !== 'undefined') {
        window.requestAnimationFrame(() => {
          forceResetStageLayout();
          window.dispatchEvent(new Event('resize'));
        });
      }

      // 3. Staged timeout passes (20ms, 80ms, 200ms, 400ms)
      [20, 80, 200, 400].forEach(delay => {
        const id = setTimeout(() => {
          forceResetStageLayout();
          window.dispatchEvent(new Event('resize'));
        }, delay);
        timeoutIds.push(id);
      });
    };

    const handleFullscreenChange = () => {
      const isFsActive = !!(
        document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).mozFullScreenElement ||
        (document as any).msFullscreenElement
      );
      setIsFullscreen(isFsActive);
      triggerAggressiveRecalculation();
    };

    // Fullscreen event listeners specifically attached to document, container, and game-stage-layout
    const stageDom = gameStageLayoutRef.current;
    const containerDom = gameContainerRef.current;

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);

    if (stageDom) {
      stageDom.addEventListener('fullscreenchange', handleFullscreenChange);
      stageDom.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      stageDom.addEventListener('mozfullscreenchange', handleFullscreenChange);
      stageDom.addEventListener('MSFullscreenChange', handleFullscreenChange);
    }

    if (containerDom) {
      containerDom.addEventListener('fullscreenchange', handleFullscreenChange);
      containerDom.addEventListener('webkitfullscreenchange', handleFullscreenChange);
      containerDom.addEventListener('mozfullscreenchange', handleFullscreenChange);
      containerDom.addEventListener('MSFullscreenChange', handleFullscreenChange);
    }

    // ResizeObserver on both the stage layout and outer container
    let resizeObserver: ResizeObserver | null = null;
    try {
      resizeObserver = new ResizeObserver((entries) => {
        forceResetStageLayout(entries);
      });
      if (containerDom) resizeObserver.observe(containerDom);
      if (stageDom) resizeObserver.observe(stageDom);
    } catch (e) {
      console.warn('ResizeObserver initialization:', e);
    }

    const handleWindowResize = () => {
      forceResetStageLayout();
    };
    window.addEventListener('resize', handleWindowResize);

    // Initial update
    triggerAggressiveRecalculation();

    return () => {
      timeoutIds.forEach(id => clearTimeout(id));
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);

      if (stageDom) {
        stageDom.removeEventListener('fullscreenchange', handleFullscreenChange);
        stageDom.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        stageDom.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        stageDom.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      }

      if (containerDom) {
        containerDom.removeEventListener('fullscreenchange', handleFullscreenChange);
        containerDom.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
        containerDom.removeEventListener('mozfullscreenchange', handleFullscreenChange);
        containerDom.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      }

      window.removeEventListener('resize', handleWindowResize);
      if (resizeObserver) {
        resizeObserver.disconnect();
      }
    };
  }, [activeGameConfig, isFullscreen]);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      gameContainerRef.current?.requestFullscreen().then(() => {
        setIsFullscreen(true);
        // Aggressively recompute on transition promise resolution
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      }).catch(err => {
        console.warn('Error attempting to enable full-screen mode:', err?.message || err);
      });
    } else {
      document.exitFullscreen().then(() => {
        setIsFullscreen(false);
        setTimeout(() => window.dispatchEvent(new Event('resize')), 50);
      }).catch(err => {
        console.warn('Error attempting to exit full-screen mode:', err?.message || err);
      });
    }
  };

  // Search and Tag Filtering State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // Extract all unique tags
  const allTags = React.useMemo(() => {
    const tags = new Set<string>();
    GAMES_LIST.forEach(game => {
      if (game.tags) {
        game.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, []);

  const filteredGames = React.useMemo(() => {
    return GAMES_LIST.filter(game => {
      const matchesSearch = game.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            game.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesTag = selectedTag ? (game.tags && game.tags.includes(selectedTag)) : true;
      return matchesSearch && matchesTag;
    });
  }, [searchQuery, selectedTag]);

  // View state
  const [currentView, setCurrentView] = useState<'home' | 'question-bank' | 'bank-editor' | 'admin'>('home');
  const [isBgMusicModalOpen, setIsBgMusicModalOpen] = useState<boolean>(false);

  // Summary state
  const [lastGameAnswerLogs, setLastGameAnswerLogs] = useState<AnswerLog[]>([]);
  const [lastGameTeams, setLastGameTeams] = useState<Team[]>([]);
  const [lastGameConfig, setLastGameConfig] = useState<GameSetupConfig | null>(null);

  const toggleMute = () => {
    const muted = soundFx.toggleMute();
    setIsMuted(muted);
  };

  const handleOpenQuickGuide = (gameId: GameId | string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    soundFx.cardFlip();
    setQuickGuideGameId(gameId);
    setIsQuickGuideOpen(true);
  };

  const handleOpenSetup = (gameType: GameType) => {
    // Check guest play limits
    const status = getPlayLimitStatus(!!user);
    setPlayLimitStatus(status);

    if (!user && !status.allowed) {
      soundFx.wrong();
      setIsGuestLimitModalOpen(true);
      return;
    }

    soundFx.buttonClick();
    setSelectedGameType(gameType);
    setIsSetupModalOpen(true);
  };

  const handleStartGame = (config: GameSetupConfig) => {
    // Check & consume guest play limit
    const status = getPlayLimitStatus(!!user);
    if (!user) {
      if (!status.allowed) {
        soundFx.wrong();
        setIsGuestLimitModalOpen(true);
        return;
      }
      const updated = consumePlayCount(false);
      setPlayLimitStatus(updated);
    }

    setIsSetupModalOpen(false);
    setActiveGameConfig(config);
    setLastGameConfig(config);
    setLastGameTeams(config.teams);

    setPlayCounts(prev => {
      const newCounts = { ...prev, [config.gameId]: (prev[config.gameId] || 0) + 1 };
      localStorage.setItem('wey_game_play_counts', JSON.stringify(newCounts));
      return newCounts;
    });
  };

  const handleEndGame = (param1?: any, param2?: any) => {
    let resolvedTeams = activeGameConfig?.teams ? [...activeGameConfig.teams] : lastGameConfig?.teams ? [...lastGameConfig.teams] : [];
    let resolvedLogs: AnswerLog[] = [];

    if (Array.isArray(param1) && Array.isArray(param2)) {
      resolvedTeams = param1;
      resolvedLogs = param2;
    } else if (Array.isArray(param1)) {
      if (
        param1.length > 0 &&
        ('isCorrect' in param1[0] || 'questionNumber' in param1[0] || 'correctAnswer' in param1[0])
      ) {
        resolvedLogs = param1;
        if (activeGameConfig?.teams) {
          resolvedTeams = activeGameConfig.teams;
        } else if (lastGameConfig?.teams) {
          resolvedTeams = lastGameConfig.teams;
        }
      } else {
        resolvedTeams = param1;
      }
    }

    const safeTeams = (resolvedTeams || []).map((t, idx) => ({
      id: t?.id || `team_${idx + 1}`,
      name: t?.name || `Đội ${idx + 1}`,
      avatar: t?.avatar || t?.emoji || '⭐',
      color: t?.color || '#3b82f6',
      score: typeof t?.score === 'number' && !isNaN(t.score) ? t.score : 0,
    }));

    setLastGameTeams(safeTeams);
    setLastGameAnswerLogs(resolvedLogs);
    if (resolvedLogs.length > 0) {
      setTotalQuestionsAnswered(prev => {
        const next = prev + resolvedLogs.length;
        localStorage.setItem('wey_total_questions_answered', next.toString());
        return next;
      });
    }
    if (activeGameConfig) {
      setLastGameConfig(activeGameConfig);
    }
    setActiveGameConfig(null);
    setIsSummaryModalOpen(true);
  };

  const handlePlayAgain = () => {
    const configToReplay = activeGameConfig || lastGameConfig;

    // Check & consume guest play limit on play again
    const status = getPlayLimitStatus(!!user);
    if (!user) {
      if (!status.allowed) {
        soundFx.wrong();
        setIsGuestLimitModalOpen(true);
        setActiveGameConfig(null);
        return;
      }
      const updated = consumePlayCount(false);
      setPlayLimitStatus(updated);
    }

    setIsSummaryModalOpen(false);
    if (configToReplay) {
      const resetConfig = {
        ...configToReplay,
        teams: configToReplay.teams.map(t => ({ ...t, score: 0 })),
      };
      setActiveGameConfig(resetConfig);
      setLastGameConfig(resetConfig);
    }
  };

  const handleGoHome = () => {
    setIsSummaryModalOpen(false);
    setActiveGameConfig(null);
  };

  const handleAiQuestionsGenerated = async (newBank: QuestionBank) => {
    setQuestionBanks(prev => [newBank, ...prev]);
    setActiveBankId(newBank.id);
    if (user?.uid) {
      await saveQuestionBankToCloud({
        ...newBank,
        userId: user.uid,
        userEmail: user.email || undefined,
      });
    }
  };

  const activeBank = questionBanks.find(b => b.id === activeBankId) || questionBanks[0];
  const currentGameBank = activeGameConfig?.selectedBankId
    ? questionBanks.find(b => b.id === activeGameConfig.selectedBankId) || activeBank
    : activeBank;
  const currentQuestions = currentGameBank?.questions || [];
  const selectedGameInfo = GAMES_LIST.find(g => g.id === selectedGameType) || GAMES_LIST[0];

  // Theme background helper
  const getAppBackgroundStyle = () => {
    if (activeGameConfig?.theme) {
      return {
        backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.4)), url(/assets/themes/${activeGameConfig.theme}.jpg)`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundAttachment: 'fixed',
      };
    }
    return {
      backgroundImage: `url(${webConfig.bgImageUrl || '/assets/home-bg.webp'})`,
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      backgroundAttachment: 'fixed',
    };
  };

  return (
    <div
      className={`min-h-screen text-w-text-main flex flex-col justify-between selection:bg-w-accent-muted selection:text-w-text-main transition-all duration-700 ${
        !activeGameConfig ? 'bg-w-bg-main/60' : ''
      }`}
      style={getAppBackgroundStyle()}
    >
      {/* Top Announcement Banner if set by Admin */}
      {webConfig.announcement && !activeGameConfig && (
        <div className="bg-gradient-to-r from-amber-500 via-emerald-600 to-teal-600 text-white text-xs sm:text-sm font-extrabold px-4 py-2 text-center shadow-md flex items-center justify-center gap-2">
          <Bell className="w-4 h-4 animate-bounce shrink-0" />
          <span className="truncate">{webConfig.announcement}</span>
        </div>
      )}

      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-w-bg-card/90 backdrop-blur-md border-b border-w-border/80 shadow-[0_4px_20px_rgba(79,104,60,0.06)] px-4 sm:px-6 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <div
            onClick={() => {
              setActiveGameConfig(null);
              setCurrentView('home');
            }}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/assets/Picture1.png"
              alt="Wey's Playground Logo"
              className="h-12 sm:h-[54px] w-auto object-contain rounded-xl drop-shadow-[0_3px_6px_rgba(79,104,60,0.12)] group-hover:scale-105 group-hover:-rotate-2 transition-transform duration-300 ease-out"
            />
            <div>
              <h1 className="text-lg sm:text-xl font-[800] text-w-primary-dark tracking-tight leading-none">
                {webConfig.siteTitle || "WEY'S PLAYGROUND"}
              </h1>
              <p className="text-[11px] font-[700] text-w-text-muted mt-0.5">
                {webConfig.siteSubtitle || "Kho Game Online Sinh Động Của Wey"}
              </p>
            </div>
          </div>

          {/* Action Header Buttons */}
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={() => {
                setActiveGameConfig(null);
                setCurrentView('question-bank');
              }}
              className="flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-[#E2EED3] hover:bg-[#D4E4C1] text-w-primary-hover font-[700] text-[11px] sm:text-xs rounded-[16px] shadow-[0_4px_12px_rgba(79,104,60,0.12)] hover:shadow-[0_6px_16px_rgba(79,104,60,0.18)] transition-all duration-200 border border-w-accent-border"
            >
              <Database className="w-4 h-4 text-w-primary-dark" />
              <span className="hidden sm:inline">Ngân Hàng Câu Hỏi</span>
              <span className="sm:hidden">NHCH</span>
            </button>

            {/* ONLY RENDER ADMIN BUTTON IF USER IS AUTHORIZED SUPER ADMIN */}
            {isAdmin && (
              <button
                onClick={() => {
                  soundFx.buttonClick();
                  setActiveGameConfig(null);
                  setCurrentView('admin');
                }}
                className="flex items-center gap-1.5 px-3 sm:px-3.5 py-2 bg-w-primary-dark hover:bg-[#3E522F] text-[#E9D58F] text-xs font-[800] rounded-[18px] shadow-sm hover:-translate-y-0.5 transition-all cursor-pointer border border-[#E9D58F]/30"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-[#E9D58F]" />
                <span>Admin Hub</span>
              </button>
            )}

            <LoginButton
              onCloudBanksLoaded={banks => {
                const allBanks = [...DEFAULT_QUESTION_BANKS];
                const uniqueBanks = banks.reduce((acc, bank) => {
                  if (!acc.find(b => b.id === bank.id)) acc.push(bank);
                  return acc;
                }, [...allBanks]);
                setQuestionBanks(uniqueBanks);
              }}
            />

            {/* API Health Status Indicator & Quick Switcher */}
            <NavbarApiStatus
              onOpenSelectModal={() => setIsApiSelectModalOpen(true)}
              onOpenManagerModal={() => setIsApiManagerModalOpen(true)}
            />

            <button
              onClick={() => {
                soundFx.buttonClick();
                setIsAiModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 sm:px-4.5 py-2 bg-[#F2B6C7] hover:bg-[#EEA3B7] text-w-text-main text-xs font-[800] rounded-[18px] border border-[#E59EB2] shadow-[0_3px_10px_rgba(242,182,199,0.35)] hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-w-bg-card animate-spin" />
              <span className="hidden sm:inline">Tạo Bằng AI</span>
            </button>

            <button
              onClick={toggleMute}
              className="p-2.5 bg-w-bg-card hover:bg-w-bg-main text-w-primary-dark rounded-[18px] border border-[#D8CFAF] shadow-[0_2px_8px_rgba(79,104,60,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer"
              title={isMuted ? 'Bật Âm Thanh' : 'Tắt Âm Thanh'}
            >
              {isMuted ? (
                <VolumeX className="w-4 h-4 text-[#E05252]" />
              ) : (
                <Volume2 className="w-4 h-4 text-w-primary" />
              )}
            </button>

            {/* Background Music Modal Controller Button */}
            <button
              onClick={() => {
                soundFx.buttonClick();
                setIsBgMusicModalOpen(true);
              }}
              className="p-2.5 bg-w-bg-card hover:bg-w-accent-light text-w-primary-dark rounded-[18px] border border-w-accent-border shadow-[0_2px_8px_rgba(79,104,60,0.06)] hover:-translate-y-0.5 transition-all cursor-pointer relative group"
              title="Nhạc Nền Thư Giãn (Looping Background Music)"
            >
              <Music className="w-4 h-4 text-w-primary-dark group-hover:scale-110 transition-transform" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-emerald-500 rounded-full" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Body */}
      <main className={`flex-1 flex flex-col w-full mx-auto transition-all ${
        activeGameConfig
          ? 'max-w-[1550px] p-2 sm:p-3 space-y-3'
          : 'max-w-7xl p-4 sm:p-6 lg:p-8 space-y-6'
      }`}>
        
        {/* Error / Blocked notification */}
        {errorMessage && (
          <div className="bg-rose-50 border-2 border-rose-300 rounded-[20px] p-4 flex items-center justify-between gap-3 shadow-md animate-fade-in text-rose-900">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-rose-200 text-rose-900 flex items-center justify-center font-bold text-sm shrink-0">
                ⚠️
              </div>
              <div className="text-xs font-bold leading-relaxed">{errorMessage}</div>
            </div>
            <button
              onClick={clearError}
              className="px-3 py-1 bg-rose-200 hover:bg-rose-300 text-rose-900 rounded-lg text-xs font-bold transition"
            >
              Đóng
            </button>
          </div>
        )}

        {/* Render Active Game Mode */}
        {activeGameConfig ? (
          <div 
            className={`flex flex-col ${stageMetrics.isCompactHeight ? 'space-y-1.5' : 'space-y-3'} ${
              isFullscreen ? 'p-1.5 sm:p-3 overflow-y-auto w-full h-full min-h-screen' : 'flex-1 w-full'
            }`}
            ref={gameContainerRef}
            style={{
              ...(isFullscreen ? getAppBackgroundStyle() : {}),
              ['--stage-width' as any]: `${stageMetrics.width}px`,
              ['--stage-height' as any]: `${stageMetrics.height}px`,
              ['--stage-scale' as any]: `${stageMetrics.scale}`,
              ['--stage-pad-y' as any]: stageMetrics.isVeryCompact ? '4px' : stageMetrics.isCompactHeight ? '8px' : '16px',
              ['--stage-pad-x' as any]: stageMetrics.isNarrow ? '6px' : stageMetrics.isCompactHeight ? '12px' : '20px',
              ['--stage-grid-cols' as any]: stageMetrics.gridTemplateColumns,
              ['--stage-gap' as any]: stageMetrics.gap,
              ['--grid-template-columns' as any]: stageMetrics.gridTemplateColumns,
              ['--gap' as any]: stageMetrics.gap,
            }}
          >
            {/* Active Game Top Bar */}
            <div className={`flex flex-wrap items-center justify-between gap-2 bg-w-bg-card border border-w-border ${
              stageMetrics.isCompactHeight ? 'px-2.5 py-1.5' : 'px-3.5 py-2'
            } rounded-xl shadow-xs wey-paper-card shrink-0 ${isFullscreen ? 'sticky top-0 z-50' : ''}`}>
              <div className="flex items-center gap-2">
                <span className="text-lg sm:text-xl">{selectedGameInfo?.icon || '🎮'}</span>
                <div>
                  <h3 className="text-xs sm:text-sm font-[800] text-w-text-main flex items-center gap-2">
                    <span>{selectedGameInfo?.title || 'Trò chơi'}</span>
                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                      Đang chơi
                    </span>
                    {isFullscreen && (
                      <span className="hidden sm:inline text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Phóng to máy chiếu
                      </span>
                    )}
                  </h3>
                </div>
              </div>

              <div className="flex items-center gap-1.5 sm:gap-2">
                <button
                  type="button"
                  onClick={toggleFullscreen}
                  className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-100 text-w-primary-hover text-xs font-bold rounded-lg border border-slate-300 shadow-2xs transition hover:-translate-y-0.5 cursor-pointer"
                  title={isFullscreen ? "Thu nhỏ" : "Phóng to toàn màn hình máy chiếu"}
                >
                  {isFullscreen ? <Minimize className="w-3.5 h-3.5" /> : <Maximize className="w-3.5 h-3.5" />}
                  <span className="hidden sm:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenQuickGuide(activeGameConfig.gameId)}
                  className="flex items-center gap-1 px-2.5 py-1 bg-w-accent-light hover:bg-[#D4E4C1] text-w-primary-hover text-xs font-bold rounded-lg border border-w-accent-border shadow-2xs transition hover:-translate-y-0.5 cursor-pointer"
                  title="Xem nhanh hướng dẫn luật chơi"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Luật Chơi</span>
                </button>

                <button
                  type="button"
                  onClick={handleGoHome}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 shadow-2xs transition cursor-pointer"
                >
                  Thoát Game
                </button>
              </div>
            </div>

            {/* Dynamic Game Stage Layout Container */}
            <div 
              ref={gameStageLayoutRef}
              className="game-stage-layout flex-1 flex flex-col min-h-0 w-full"
              style={{
                ['--stage-grid-cols' as any]: stageMetrics.gridTemplateColumns,
                ['--stage-gap' as any]: stageMetrics.gap,
                ['--grid-template-columns' as any]: stageMetrics.gridTemplateColumns,
                ['--gap' as any]: stageMetrics.gap,
              }}
            >
              
              {(activeGameConfig.gameId === 'lucky_star' || activeGameConfig.gameId === 'luckystar') && (
                <LuckyStarGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} />
              )}
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
{(activeGameConfig.gameId === 'openbox' || activeGameConfig.gameId === 'open_box') && (
              <OpenBoxGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'mancala' && (
              <MancalaGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'wheel' && (
              <WheelGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'ludo' && (
              <LudoGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'betting' && (
              <BettingGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'bingo' && (
              <BingoGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'territory' && (
              <TerritoryGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'tug_of_war' || activeGameConfig.gameId === 'tugofwar') && (
              <TugOfWarGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'tower' && (
              <TowerGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'puzzle' && (
              <PuzzleGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'race' && (
              <RaceGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'randomcall' && (
              <RandomCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} />
            )}
            {activeGameConfig.gameId === 'eggcall' && (
              <EggCallGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} />
            )}
            {activeGameConfig.gameId === 'blindbox' && (
              <BlindBoxGame config={activeGameConfig} questions={currentQuestions} onGameEnd={handleEndGame} />
            )}
            {activeGameConfig.gameId === 'pokemon' && (
              <PokemonGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'battleship' && (
              <BattleshipGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'pictogram' && (
              <PictogramGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'magic_wheel' && (
              <MagicWheelGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'pose_challenge' || activeGameConfig.gameId === 'posechallenge') && (
              <PoseChallengeGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'caro' && (
              <CaroGame
                config={activeGameConfig}
                questions={currentQuestions}
                banks={questionBanks}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'whack_a_mole' || activeGameConfig.gameId === 'whackamole' || activeGameConfig.gameId === 'whack_mole' || activeGameConfig.gameId === 'whackmole' || activeGameConfig.gameId === 'dap_chuot' || activeGameConfig.gameId === 'dapchuot') && (
              <WhackMoleGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'classification' || activeGameConfig.gameId === 'phanloai' || activeGameConfig.gameId === 'phan_loai') && (
              <ClassificationGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'flag_capture' || activeGameConfig.gameId === 'flagcapture' || activeGameConfig.gameId === 'cuopco' || activeGameConfig.gameId === 'cuop_co') && (
              <FlagCaptureGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'sack_race' || activeGameConfig.gameId === 'sackrace' || activeGameConfig.gameId === 'nhaybaobo' || activeGameConfig.gameId === 'nhay_bao_bo') && (
              <SackRaceGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'snail_word_search' || activeGameConfig.gameId === 'snailwordsearch' || activeGameConfig.gameId === 'snail_words' || activeGameConfig.gameId === 'ocsen' || activeGameConfig.gameId === 'oc_sen') && (
              <SnailWordSearchGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'mine_boom' || activeGameConfig.gameId === 'mineboom' || activeGameConfig.gameId === 'doboom' || activeGameConfig.gameId === 'do_boom') && (
              <MineBoomGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {activeGameConfig.gameId === 'chess' && (
              <ChessGame
                config={activeGameConfig}
                questions={currentQuestions}
                banks={questionBanks}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'gold_miner' || activeGameConfig.gameId === 'goldminer' || activeGameConfig.gameId === 'daovang') && (
              <GoldMinerGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'bear_pass' || activeGameConfig.gameId === 'bearpass' || activeGameConfig.gameId === 'truyengau') && (
              <BearPassingGame
                config={activeGameConfig}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'letter_arrange' || activeGameConfig.gameId === 'letterarrange' || activeGameConfig.gameId === 'sapxepchu') && (
              <LetterArrangeGame
                config={activeGameConfig}
                questions={currentQuestions}
                onGameEnd={handleEndGame}
              />
            )}
            {(activeGameConfig.gameId === 'apple_pick' || activeGameConfig.gameId === 'applepick' || activeGameConfig.gameId === 'haitao') && (
              <ApplePickingGame
                config={activeGameConfig}
                questions={currentQuestions}
                onEndGame={handleEndGame}
                onRunOutOfQuestions={() => setShowRefillModal(true)}
                onUpdateScore={(teamId, delta) => {
                  const saved = localStorage.getItem(`wey_teams_${activeGameConfig.gameId}`);
                  if (saved) {
                    try {
                      const teams = JSON.parse(saved);
                      const updated = teams.map((t: Team) => t.id === teamId ? { ...t, score: (t.score || 0) + delta } : t);
                      localStorage.setItem(`wey_teams_${activeGameConfig.gameId}`, JSON.stringify(updated));
                    } catch {}
                  }
                }}
              />
            )}
            {(activeGameConfig.gameId === 'son_tinh_thuy_tinh' || activeGameConfig.gameId === 'sontinhthuytinh' || activeGameConfig.gameId === 'sontinh_thuytinh') && (
              <SonTinhThuyTinhGame
                config={activeGameConfig}
                questions={currentQuestions}
                onEndGame={handleEndGame}
                onRunOutOfQuestions={() => setShowRefillModal(true)}
                onUpdateScore={(teamId, delta) => {
                  const saved = localStorage.getItem(`wey_teams_${activeGameConfig.gameId}`);
                  if (saved) {
                    try {
                      const teams = JSON.parse(saved);
                      const updated = teams.map((t: Team) => t.id === teamId ? { ...t, score: (t.score || 0) + delta } : t);
                      localStorage.setItem(`wey_teams_${activeGameConfig.gameId}`, JSON.stringify(updated));
                    } catch {}
                  }
                }}
              />
            )}
            {(activeGameConfig.gameId === "cothu" || activeGameConfig.gameId === "co_thu") && (
              <CoThuGame
                config={activeGameConfig}
                questions={currentQuestions}
                onEndGame={handleEndGame}
                onRunOutOfQuestions={() => setShowRefillModal(true)}
                onUpdateScore={(teamId, delta) => {
                  const saved = localStorage.getItem(`wey_teams_${activeGameConfig.gameId}`);
                  if (saved) {
                    try {
                      const teams = JSON.parse(saved);
                      const updated = teams.map((t: Team) => t.id === teamId ? { ...t, score: (t.score || 0) + delta } : t);
                      localStorage.setItem(`wey_teams_${activeGameConfig.gameId}`, JSON.stringify(updated));
                    } catch (e) {}
                  }
                }}
              />
            )}
            {(activeGameConfig.gameId === 'monopoly' || activeGameConfig.gameId === 'cotyphu' || activeGameConfig.gameId === 'co_ty_phu') && (
              <MonopolyGame
                config={activeGameConfig}
                banks={questionBanks}
                activeBankId={activeBankId}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
                onOpenQuickGuide={(gId) => handleOpenQuickGuide(gId)}
              />
            )}
            {(activeGameConfig.gameId === 'werewolf_village' || activeGameConfig.gameId === 'masoi' || activeGameConfig.gameId === 'werewolf' || activeGameConfig.gameId === 'ma_soi') && (
              <WerewolfGame
                config={activeGameConfig}
                banks={questionBanks}
                activeBankId={activeBankId}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
                onOpenQuickGuide={(gId) => handleOpenQuickGuide(gId)}
              />
            )}
            {(activeGameConfig.gameId === 'case_investigation' || activeGameConfig.gameId === 'hosovuan' || activeGameConfig.gameId === 'case_mystery') && (
              <CaseInvestigationGame
                config={activeGameConfig}
                questions={currentQuestions}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
              />
            )}
            {(activeGameConfig.gameId === 'tea_battle' || activeGameConfig.gameId === 'teabattle' || activeGameConfig.gameId === 'tranchientra') && (
              <TeaBattleGame
                config={activeGameConfig}
                questions={currentQuestions}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
              />
            )}
            {(activeGameConfig.gameId === 'bowling' || activeGameConfig.gameId === 'bowling_game') && (
              <BowlingGame
                config={activeGameConfig}
                questions={currentQuestions}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
              />
            )}
            {(activeGameConfig.gameId === 'chase' || activeGameConfig.gameId === 'chase_race' || activeGameConfig.gameId === 'cuocduoibat') && (
              <ChaseGame
                config={activeGameConfig}
                questions={currentQuestions}
                onBackToHome={() => {
                  handleEndGame([], true);
                  setCurrentView('home');
                }}
              />
            )}
            </div>
          </div>
        ) : currentView === 'admin' ? (
          <AdminView
            onBackToHome={() => setCurrentView('home')}
            questionBanks={questionBanks}
            activeBankId={activeBankId}
            onSelectActiveBank={bankId => setActiveBankId(bankId)}
            onDeleteBank={async id => {
              const bankToDelete = questionBanks.find(b => b.id === id);
              if (bankToDelete && !bankToDelete.isPreset) {
                await deleteCloudQuestionBank(id);
              }
              setQuestionBanks(prev => {
                const remaining = prev.filter(b => b.id !== id);
                if (activeBankId === id && remaining.length > 0) {
                  setActiveBankId(remaining[0].id);
                }
                return remaining;
              });
            }}
            onKeepOnlyLatestBank={handleKeepOnlyLatestBank}
            onOpenBankManager={bankId => {
              setActiveBankId(bankId);
              setCurrentView('bank-editor');
            }}
            webConfig={webConfig}
            onUpdateWebConfig={newConfig => setWebConfig(newConfig)}
          />
        ) : currentView === 'bank-editor' ? (
          <div>
            <QuestionBankEditor
              banks={questionBanks}
              activeBankId={activeBankId}
              onSelectBank={bankId => setActiveBankId(bankId)}
              onClose={() => setCurrentView('home')}
              onSaveBank={async updatedBank => {
                setQuestionBanks(prev =>
                  prev.map(b => (b.id === updatedBank.id ? updatedBank : b))
                );
                if (user?.uid) {
                  await saveQuestionBankToCloud({
                    ...updatedBank,
                    userId: user.uid,
                    userEmail: user.email || undefined,
                  });
                }
              }}
              onOpenAiGenerator={() => setIsAiModalOpen(true)}
            />
          </div>
        ) : currentView === 'question-bank' ? (
          <QuestionBankView
            onBack={() => setCurrentView('home')}
            questionBanks={questionBanks}
            onUpdateBanks={newBanks => setQuestionBanks(newBanks)}
            onOpenQuickManager={bankId => {
              setActiveBankId(bankId);
              setCurrentView('bank-editor');
            }}
            onOpenAiGenerator={() => setIsAiModalOpen(true)}
          />
        ) : (
          /* HOME VIEW - GAME CATALOG, SEARCH & TAGS */
          <div className="space-y-6">
            {/* Active Question Bank Banner & Quick Switcher */}
            <div className="bg-w-bg-card border-2 border-w-border rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-w-accent-light text-w-primary-dark flex items-center justify-center text-xl shrink-0 border border-w-accent-border">
                  📚
                </div>
                <div>
                  <div className="text-[11px] font-extrabold uppercase tracking-wider text-w-text-muted">
                    Ngân Hàng Câu Hỏi Đang Dùng
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm sm:text-base font-extrabold text-w-text-main">
                      {activeBank?.name || 'Ngân hàng mặc định'}
                    </span>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                      {currentQuestions.length} câu hỏi
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => setCurrentView('question-bank')}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-white hover:bg-slate-50 text-w-primary-hover text-xs font-extrabold rounded-xl border border-w-border shadow-2xs transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Database className="w-3.5 h-3.5 text-w-primary-dark" />
                  <span>Đổi Bộ Câu Hỏi</span>
                </button>
                <button
                  type="button"
                  onClick={() => setIsAiModalOpen(true)}
                  className="flex-1 sm:flex-initial px-3.5 py-2 bg-[#F2B6C7] hover:bg-[#EEA3B7] text-w-text-main text-xs font-extrabold rounded-xl border border-[#E59EB2] shadow-2xs transition hover:-translate-y-0.5 cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5 text-w-bg-card" />
                  <span>Tạo Bằng AI</span>
                </button>
              </div>
            </div>

            {/* Search and Tags Filter Bar */}
            <div className="bg-w-bg-card border-2 border-w-border rounded-2xl p-4 sm:p-5 shadow-xs space-y-4">
              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-w-text-muted" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm kiếm trò chơi theo tên hoặc mô tả (ví dụ: 'đua xe', 'gọi tên', 'vòng quay', 'trắc nghiệm')..."
                  className="w-full pl-10 pr-10 py-2.5 bg-white border border-w-border rounded-xl text-xs sm:text-sm font-bold text-w-text-main placeholder-w-text-muted/60 focus:outline-none focus:border-w-primary-dark focus:ring-2 focus:ring-w-primary-dark/20 transition shadow-inner"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-w-text-muted hover:text-w-text-main transition"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Tag Filtering Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <div className="text-[11px] font-extrabold uppercase tracking-wider text-w-text-muted flex items-center gap-1 mr-1">
                  <Tag className="w-3.5 h-3.5" />
                  <span>Phân loại:</span>
                </div>

                {/* 'All' tag chip */}
                <button
                  type="button"
                  onClick={() => setSelectedTag(null)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                    selectedTag === null
                      ? 'bg-w-primary-dark text-white shadow-xs'
                      : 'bg-white text-w-text-muted border border-w-border hover:bg-w-accent-light'
                  }`}
                >
                  <span>Tất cả</span>
                  <span className="text-[10px] opacity-80">({GAMES_LIST.length})</span>
                </button>

                {/* Individual tag chips */}
                {allTags.map((tag) => {
                  const count = GAMES_LIST.filter(g => g.tags && g.tags.includes(tag)).length;
                  const isActive = selectedTag === tag;
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSelectedTag(isActive ? null : tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                        isActive
                          ? 'bg-w-primary-dark text-white shadow-xs'
                          : 'bg-white text-w-text-muted border border-w-border hover:bg-w-accent-light'
                      }`}
                    >
                      <span>{tag}</span>
                      <span className="text-[10px] opacity-80">({count})</span>
                    </button>
                  );
                })}
              </div>

              {/* Result Count and Active Filters Bar */}
              {(searchQuery || selectedTag) && (
                <div className="flex items-center justify-between pt-2 border-t border-w-border/60 text-xs font-bold text-w-text-muted">
                  <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-w-primary-dark" />
                    <span>
                      Tìm thấy <strong className="text-w-primary-dark">{filteredGames.length}</strong> trò chơi phù hợp
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSearchQuery('');
                      setSelectedTag(null);
                    }}
                    className="text-rose-600 hover:text-rose-700 hover:underline cursor-pointer"
                  >
                    Xóa tất cả bộ lọc
                  </button>
                </div>
              )}
            </div>

            {/* Games Grid */}
            {filteredGames.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                {filteredGames.map((game) => {
                  const playCount = playCounts[game.id] || 0;
                  return (
                    <div
                      key={game.id}
                      className="group bg-w-bg-card hover:bg-white border-2 border-w-border hover:border-w-accent-border rounded-2xl p-4 sm:p-5 shadow-xs hover:shadow-lg transition-all duration-300 flex flex-col justify-between hover:-translate-y-1 relative overflow-hidden"
                    >
                      {/* Top Badges & Meta */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between gap-2">
                          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-w-accent-light to-w-accent-muted border border-w-accent-border flex items-center justify-center text-2xl shadow-xs group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 overflow-hidden">
                            {webConfig.gameAvatars?.[game.id] ? (
                              <img src={webConfig.gameAvatars[game.id]} alt={game.title} className="w-full h-full object-cover" />
                            ) : (
                              game.icon
                            )}
                          </div>

                          <div className="flex items-center gap-1.5 flex-wrap justify-end">
                            {game.badge && (
                              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-w-accent-light text-w-primary-dark border border-w-accent-border">
                                {game.badge}
                              </span>
                            )}
                            {playCount > 0 && (
                              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-50 text-amber-700 border border-amber-200">
                                Đã chơi {playCount}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Title & Description */}
                        <div>
                          <h3 className="text-base font-extrabold text-w-text-main group-hover:text-w-primary-dark transition-colors line-clamp-1">
                            {game.title}
                          </h3>
                          <p className="text-xs text-w-text-muted font-medium mt-1 line-clamp-2 leading-relaxed">
                            {game.description}
                          </p>
                        </div>

                        {/* Tag Badges */}
                        {game.tags && game.tags.length > 0 && (
                          <div className="flex items-center gap-1 flex-wrap pt-1">
                            {game.tags.map((t) => (
                              <span
                                key={t}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedTag(t);
                                }}
                                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-w-bg-tag text-w-text-muted hover:bg-w-accent-light hover:text-w-primary-dark transition cursor-pointer border border-w-border"
                              >
                                #{t}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="pt-4 mt-4 border-t border-w-border/70 flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenSetup(game.id)}
                          className="flex-1 py-2.5 px-3 bg-w-primary-dark hover:bg-w-primary-hover text-white text-xs font-black rounded-xl shadow-xs hover:shadow-md transition flex items-center justify-center gap-1.5 cursor-pointer transform group-hover:scale-[1.02]"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Chơi Ngay</span>
                        </button>

                        <button
                          type="button"
                          onClick={(e) => handleOpenQuickGuide(game.id, e)}
                          className="p-2.5 bg-white hover:bg-slate-50 text-w-text-muted hover:text-w-text-main rounded-xl border border-w-border shadow-2xs transition cursor-pointer"
                          title="Xem luật chơi"
                        >
                          <BookOpen className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* Empty Search State */
              <div className="bg-w-bg-card border-2 border-w-border rounded-3xl p-12 text-center space-y-4 max-w-lg mx-auto">
                <div className="w-16 h-16 rounded-3xl bg-w-accent-light text-w-primary-dark flex items-center justify-center text-3xl mx-auto shadow-xs border border-w-accent-border">
                  🔍
                </div>
                <div>
                  <h3 className="text-lg font-extrabold text-w-text-main">
                    Không tìm thấy trò chơi nào
                  </h3>
                  <p className="text-xs text-w-text-muted font-medium mt-1 leading-relaxed">
                    Không có trò chơi nào khớp với từ khóa "{searchQuery}" hoặc phân loại đã chọn.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedTag(null);
                  }}
                  className="px-5 py-2.5 bg-w-primary-dark hover:bg-w-primary-hover text-white text-xs font-extrabold rounded-xl shadow-xs transition cursor-pointer"
                >
                  Xem Tất Cả Trò Chơi
                </button>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {!activeGameConfig && currentView === 'home' && (
        <footer className="w-full text-center py-6 mt-8 border-t border-w-border bg-w-bg-card/80">
          <p className="text-w-text-muted font-bold text-sm">© 2026 Wey Playground. All rights reserved.</p>
        </footer>
      )}

      {/* Wey Guide Mascot */}
      {!activeGameConfig && currentView === 'home' && (
        <WeyGuideMascot onSelectGame={handleOpenSetup} />
      )}

      {/* Modals */}
      {isSetupModalOpen && selectedGameInfo && (
        <GameSetupModal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
          gameId={selectedGameInfo.id as GameId}
          gameTitle={selectedGameInfo.title}
          gameIcon={selectedGameInfo.icon}
          gameDescription={selectedGameInfo.description || ''}
          availableThemes={PRESET_THEMES.map(t => t.id)}
          banks={questionBanks}
          activeBankId={activeBankId}
          onStartGame={handleStartGame}
        />
      )}

      {showRefillModal && (
        <RefillQuestionsModal
          isOpen={showRefillModal}
          onClose={() => setShowRefillModal(false)}
          banks={questionBanks}
          currentConfig={activeGameConfig!}
          onConfirm={handleRefillConfirm}
          onSummary={() => {
            setShowRefillModal(false);
            if (activeGameConfig) {
              handleEndGame({}, []);
            }
          }}
        />
      )}

      <AiQuestionModal
        isOpen={isAiModalOpen}
        onClose={() => setIsAiModalOpen(false)}
        banks={questionBanks}
        activeBankId={activeBankId}
        onSaveGeneratedQuestions={async (newBank: QuestionBank) => {
          setQuestionBanks(prev => [newBank, ...prev]);
          if (user?.uid) {
            await saveQuestionBankToCloud({
              ...newBank,
              userId: user.uid,
              userEmail: user.email || undefined,
            });
          }
          setActiveBankId(newBank.id);
          setIsAiModalOpen(false);
        }}
      />

      <BgMusicControllerModal
        isOpen={isBgMusicModalOpen}
        onClose={() => setIsBgMusicModalOpen(false)}
      />

      <SummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        teams={lastGameTeams}
        answerLogs={lastGameAnswerLogs}
        onPlayAgain={() => {
          setIsSummaryModalOpen(false);
          if (lastGameConfig) {
            handleStartGame(lastGameConfig);
          }
        }}
        onGoHome={() => {
          setIsSummaryModalOpen(false);
          setActiveGameConfig(null);
          setCurrentView('home');
        }}
      />

      <GuestLimitModal
        isOpen={isGuestLimitModalOpen}
        onClose={() => setIsGuestLimitModalOpen(false)}
        guestId={playLimitStatus?.guestId || ''}
        playsUsed={playLimitStatus?.playsUsed || 0}
        maxPlays={playLimitStatus?.maxPlays || 3}
      />

      <UnauthorizedDomainModal
        isOpen={showUnauthorizedModal}
        onClose={() => setShowUnauthorizedModal(false)}
      />

      {isApiSelectModalOpen && (
        <ApiSelectModal
          isOpen={isApiSelectModalOpen}
          onClose={() => setIsApiSelectModalOpen(false)}
          onSelectAndProceed={(config) => {
            apiManager.setActiveApiId(config.id);
            setIsApiSelectModalOpen(false);
          }}
          onOpenFullManager={() => {
            setIsApiSelectModalOpen(false);
            setIsApiManagerModalOpen(true);
          }}
        />
      )}

      {isApiManagerModalOpen && (
        <ApiManagerModal
          isOpen={isApiManagerModalOpen}
          onClose={() => setIsApiManagerModalOpen(false)}
        />
      )}

      <GameQuickGuideModal
        isOpen={isQuickGuideOpen}
        onClose={() => setIsQuickGuideOpen(false)}
        gameId={quickGuideGameId}
        onStartGame={() => {
          setIsQuickGuideOpen(false);
          if (quickGuideGameId) {
            const foundGame = GAMES_LIST.find(g => g.id === quickGuideGameId);
            if (foundGame) {
              handleOpenSetup(foundGame.id as GameType);
            }
          }
        }}
      />

      <QuickActionMenu
        onOpenQuestionBanks={() => setCurrentView('question-bank')}
        isGameActive={activeGameConfig !== null}
        onResetActiveGame={() => {
          if (activeGameConfig) {
            handleStartGame(activeGameConfig);
          }
        }}
      />
    </div>
  );
}


