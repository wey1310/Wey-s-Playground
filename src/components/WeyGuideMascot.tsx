import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Sparkles,
  BookOpen,
  HelpCircle,
  ChevronRight,
  Search,
  Gamepad2,
  GraduationCap,
  Lightbulb,
  Cpu,
  Volume2,
  CheckCircle2,
  Compass,
  ArrowRight,
  Maximize2,
  Smile,
  Layers,
  Award,
  Zap,
  Flame,
  FileText,
  Clock,
  Tv,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { soundFx } from '../utils/audio';

interface WeyGuideMascotProps {
  onOpenBankView?: () => void;
  onSelectGame?: (gameId: string) => void;
}

interface GuideItem {
  id: string;
  category: 'quickstart' | 'modes_questions' | 'teacher' | 'games' | 'ai' | 'tips';
  title: string;
  summary: string;
  details: string[];
  icon: string;
  badge?: string;
  tags: string[];
}

const GUIDE_CATEGORIES = [
  { id: 'quickstart', label: 'Bắt Đầu Nhanh', icon: '🚀' },
  { id: 'modes_questions', label: 'Chế Độ & Dạng Câu Hỏi', icon: '📝' },
  { id: 'teacher', label: 'Thầy Cô & Quản Trò', icon: '🎓' },
  { id: 'games', label: 'Luật & Thao Tác Trò Chơi', icon: '🕹️' },
  { id: 'ai', label: 'Trợ Lý AI', icon: '🤖' },
  { id: 'tips', label: 'Mẹo & Phím Tắt', icon: '💡' },
];

const POPULAR_SEARCH_CHIPS = [
  'Cách tạo bộ câu hỏi',
  'Quét đề thi bằng AI',
  'Chế độ chơi và dạng câu hỏi',
  'Cách bấm rải quân Ô Ăn Quan',
  'Trình chiếu TV Toàn Màn Hình',
  'Xử lý khi hết câu hỏi',
  'Đua Cá Ngựa',
  'Chiếm Lãnh Thổ 36 Ô',
  'Xuất Nhập File Excel/JSON'
];

function removeVietnameseTones(str: string): string {
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim();
}

const GUIDE_ITEMS: GuideItem[] = [
  // Quickstart
  {
    id: 'qs_1',
    category: 'quickstart',
    title: 'Quy trình 4 bước tổ chức trò chơi lớp học',
    summary: 'Chỉ mất 30 giây để bắt đầu một tiết học sôi nổi, hấp dẫn.',
    icon: '⚡',
    badge: 'Cơ bản',
    tags: ['cách tạo bộ câu hỏi', 'cách bắt đầu', 'tổ chức trò chơi', 'soạn bài', 'cách chơi', 'hướng dẫn giáo viên', 'quy trình', 'bắt đầu', 'setup', 'cài đặt', 'chọn game', 'chọn đội', '4 buoc'],
    details: [
      'Bước 1: Chọn bộ câu hỏi có sẵn hoặc bấm "Ngân Hàng Câu Hỏi" để tạo bộ mới.',
      'Bước 2: Chọn 1 trong 16 trò chơi tương tác từ Thư Viện Trò Chơi.',
      'Bước 3: Tùy chỉnh số đội (1 đến 4 đội), thời gian trả lời và chủ đề hình nền.',
      'Bước 4: Bấm "Bắt Đầu Chơi" và trình chiếu lên máy chiếu/TV cho học sinh tham gia!'
    ]
  },
  {
    id: 'qs_2',
    category: 'quickstart',
    title: 'Chế độ Chơi Không Cần Soạn Câu Hỏi (Number Mode)',
    summary: 'Dành cho các trò chơi khởi động nhanh không cần chuẩn bị trước.',
    icon: '🎲',
    badge: 'Tiện lợi',
    tags: ['khong can soan cau hoi', 'che do so ao', 'number mode', 'quay so', 'khoi dong nhanh', 'doc cau hoi truc tiep', 'choi nhanh'],
    details: [
      'Khi cài đặt trò chơi, chọn "Chế độ Số Câu Hỏi Ảo (1 - 1000)".',
      'Hệ thống sẽ quay số câu hỏi tự động. Giáo viên có thể đọc câu hỏi trực tiếp từ sách hoặc bảng phụ.',
      'Sau khi học sinh trả lời, giáo viên bấm "ĐÚNG" hoặc "SAI" để trò chơi tiếp tục bình thường!'
    ]
  },

  // Modes & Question Formats
  {
    id: 'mode_guide_1',
    category: 'modes_questions',
    title: 'Tổng quan 3 Chế Độ Chơi chính trong Game',
    summary: 'Lựa chọn chế độ phù hợp với từng tình huống bài giảng và tiết học.',
    icon: '🎯',
    badge: 'Chế độ chơi',
    tags: ['che do choi', 'cac che do', 'che do cau hoi', 'che do so ao', 'che do van dong', 'game modes', 'tuy chon'],
    details: [
      '1. Chế độ Ngân Hàng Câu Hỏi (Mặc định): Sử dụng các câu hỏi đã soạn sẵn trong hệ thống hoặc do AI tạo. Hiển thị đề bài trực quan, tính giờ tự động, tự chấm đáp án.',
      '2. Chế độ Số Ảo (Virtual Number 1 - 1000): Không cần nạp nội dung câu hỏi trước. Hệ thống quay số ngẫu nhiên để chọn câu hỏi từ sách vở hoặc tài liệu ngoài lớp.',
      '3. Chế độ Vận Động & Hoạt Náo (Warmup/Activity): Dành cho các trò chơi tạo dáng (Pose Challenge), kéo co, thi đua vận động nhẹ nhàng giữa giờ học.'
    ]
  },
  {
    id: 'qfmt_1',
    category: 'modes_questions',
    title: 'Dạng 1: Trắc Nghiệm 4 Đáp Án (MCQ A, B, C, D) & Cách Thao Tác',
    summary: 'Hình thức phổ biến nhất, trực quan và dễ tiếp cận cho mọi lứa tuổi.',
    icon: '🔘',
    badge: 'Trắc nghiệm',
    tags: ['trac nghiem', '4 dap an', 'mcq', 'a b c d', 'cach chon dap an', 'cach an', 'thao tac', 'loi giai'],
    details: [
      'Giao diện hiển thị câu hỏi và 4 ô đáp án A, B, C, D to rõ ràng.',
      'Cách bấm: Học sinh hoặc quản trò nhấp chuột/chạm trực tiếp vào ô đáp án đã chọn (A, B, C hoặc D).',
      'Phản hồi: Ô đáp án đúng sẽ sáng màu XANH LÁ kèm âm thanh chúc mừng; nếu chọn sai sẽ đổi màu ĐỎ và hiện đáp án đúng.',
      'Hộp lời giải chi tiết sẽ mở ra ngay phía dưới để giáo viên giải thích thêm cho lớp trước khi bấm "Tiếp Tục".'
    ]
  },
  {
    id: 'qfmt_2',
    category: 'modes_questions',
    title: 'Dạng 2: Câu Hỏi Đúng / Sai (True or False) & Cách Thao Tác',
    summary: 'Kiểm tra nhanh mức độ nắm bắt định nghĩa và kiến thức cốt lõi.',
    icon: '⚖️',
    badge: 'Đúng / Sai',
    tags: ['dung sai', 'true false', 'cau hoi dung sai', 'cach an', 'thao tac', 'xac nhan'],
    details: [
      'Màn hình đưa ra một nhận định hoặc bài toán cần phán đoán tính đúng sai.',
      'Cách bấm: Nhấp chuột vào nút [ĐÚNG - Xanh lá] hoặc nút [SAI - Đỏ cam].',
      'Hệ thống lập tức đối chiếu và đưa ra phân tích lập luận logic giúp học sinh củng cố kiến thức.'
    ]
  },
  {
    id: 'qfmt_3',
    category: 'modes_questions',
    title: 'Dạng 3: Câu Hỏi Điền Từ & Tự Luận Ngắn (Short Answer)',
    summary: 'Kích thích học sinh tự tư duy và phát biểu miệng trước lớp.',
    icon: '✍️',
    badge: 'Tự luận',
    tags: ['dien tu', 'tu luan', 'short answer', 'tra loi ngan', 'cham diem', 'hien dap an', 'quan tro'],
    details: [
      'Hiển thị câu hỏi gợi mở hoặc đoạn văn khuyết từ.',
      'Học sinh giơ tay phát biểu câu trả lời.',
      'Cách bấm: Giáo viên nhấp nút [Hiện Đáp Án / Lời Giải] để cả lớp cùng so sánh kết quả chuẩn xác.',
      'Sau đó quản trò bấm nút [CHẤM ĐÚNG] hoặc [CHẤM SAI] để hệ thống ghi nhận điểm và chuyển lượt chơi.'
    ]
  },
  {
    id: 'qfmt_4',
    category: 'modes_questions',
    title: 'Dạng 4: Câu Hỏi Hình Ảnh AI & Sơ Đồ Vector (AI Diagrams)',
    summary: 'Minh họa trực quan các sơ đồ khoa học, bản đồ địa lý và hình khối toán học.',
    icon: '🖼️',
    badge: 'Hình ảnh AI',
    tags: ['hinh anh', 'so do', 'diagram', 'svg', 'phong to', 'anh minh hoa', 'ai ve'],
    details: [
      'Hình ảnh vector SVG độ phân giải cao được nhúng trực tiếp ngay dưới nội dung câu hỏi.',
      'Cách bấm: Có thể nhấp vào hình ảnh để phóng to toàn màn hình cho cả lớp cùng quan sát các chi tiết chú thích.',
      'Sau khi quan sát, chọn đáp án trắc nghiệm hoặc phát biểu phân tích sơ đồ.'
    ]
  },
  {
    id: 'qfmt_5',
    category: 'modes_questions',
    title: 'Dạng 5: Đuổi Hình Bắt Chữ AI & Đoán Ô Chữ Bí Mật',
    summary: 'Thử thách liên tưởng hình ảnh với thành ngữ, tục ngữ và thuật ngữ khoa học.',
    icon: '🧩',
    badge: 'Đố chữ AI',
    tags: ['duoi hinh bat chu', 'o chu', 'doan chu', 'pictogram', 'wheel', 'cum tu bi mat'],
    details: [
      'Đuổi hình bắt chữ: Quan sát bức tranh ẩn dụ do AI sinh ra, nhận diện số ô chữ cái gợi ý -> Nhập chữ hoặc hô to đáp án.',
      'Chiếc nón kỳ diệu: Quay vòng quay nhận điểm cược -> Chọn 1 chữ cái để lật mở ô chữ trên bảng -> Bấm [Đoán Cụm Từ] khi đã đoán ra toàn bộ từ khóa!'
    ]
  },

  // Teacher Tips
  {
    id: 'tc_1',
    category: 'teacher',
    title: 'Mẹo trình chiếu tối ưu trên Máy Chiếu / Màn hình TV lớp',
    summary: 'Đảm bảo 100% học sinh quan sát rõ ràng từ mọi vị trí trong lớp.',
    icon: '📺',
    badge: 'Khuyên dùng',
    tags: ['man hinh', 'may chieu', 'tv', 'toan man hinh', 'fullscreen', 'f11', 'phong to', 'thu nho', '100%', 'hien thi', 'quan sat', 'trinh chieu'],
    details: [
      'Nhấn phím F11 trên bàn phím để bật chế độ Toàn Màn Hình (Fullscreen) không viền.',
      'Giữ trình duyệt ở độ thu phóng 100% (hoặc nhấn Ctrl + 0 để đưa về chuẩn). Giao diện game đã được tối ưu co giãn tự động.',
      'Bật âm thanh hiệu ứng để tăng không khí kịch tính, hoặc tắt loa tại góc trên cùng nếu cần không gian yên tĩnh.'
    ]
  },
  {
    id: 'tc_2',
    category: 'teacher',
    title: 'Xử lý khi trò chơi chạy hết câu hỏi giữa chừng (Nạp Thêm Câu Hỏi)',
    summary: 'Không lo gián đoạn cuộc chơi khi số lượt chơi nhiều hơn số câu hỏi.',
    icon: '🔄',
    badge: 'Đặc sắc',
    tags: ['het cau hoi', 'nap cau hoi', 'them cau hoi', 'nap them', 'tiep tuc tran dau', 'khong mat diem', 'chuyen bo cau hoi'],
    details: [
      'Khi hết câu hỏi, hệ thống sẽ tự động hiển thị Hộp Thoại Nạp Câu Hỏi.',
      'Bạn có thể chọn nhanh một ngân hàng câu hỏi khác để tiếp tục nối tiếp điểm số.',
      'Hoặc chuyển sang chế độ câu hỏi số ảo hoặc chơi vận động không cần câu hỏi mà không làm mất điểm của các đội!'
    ]
  },
  {
    id: 'tc_3',
    category: 'teacher',
    title: 'Lưu trữ đám mây & Đăng nhập Google an toàn',
    summary: 'Mang theo ngân hàng câu hỏi đến mọi lớp học chỉ với 1 tài khoản.',
    icon: '☁️',
    badge: 'Đám mây',
    tags: ['dang nhap', 'google', 'cloud', 'dam may', 'luu tru', 'dong bo', 'khong mat du lieu', 'tai khoan', 'mat du lieu', 'sao luu'],
    details: [
      'Bấm nút "Đăng Nhập" góc trên để liên kết tài khoản Google an toàn.',
      'Mọi ngân hàng câu hỏi bạn tạo sẽ tự động đồng bộ lên máy chủ đám mây an toàn.',
      'Không bị giới hạn lượt chơi khách và có thể xuất/nhập file Excel bất cứ lúc nào.'
    ]
  },

  // Games
  {
    id: 'gm_mancala',
    category: 'games',
    title: 'Ô Ăn Quan (2 Đội Hình Chữ Nhật & 3 Đội Hình Tam Giác)',
    summary: 'Trò chơi trí tuệ dân gian với bố cục bàn cờ hình học sống động.',
    icon: '🏺',
    badge: 'Dân gian',
    tags: ['o an quan', 'mancala', '3 doi', 'tam giac', '2 doi', 'chu nhat', 'rai quan', 'an quan', '15 dan', '3 quan', 'soi', 'luat choi o an quan'],
    details: [
      'Bước 1: Chọn chế độ 2 Đội (bàn chữ nhật 10 ô) hoặc 3 Đội (bàn tam giác 15 ô).',
      'Bước 2: Hệ thống quay ngẫu nhiên 1 câu hỏi, đội nào giành quyền và trả lời đúng sẽ được rải quân.',
      'Bước 3: Chọn 1 ô Dân của đội mình và bấm mũi tên để rải sỏi thuận/ngược chiều kim đồng hồ.',
      'Bước 4: Khi rải hết sỏi mà gặp ô trống, đội chơi sẽ được ĂN toàn bộ sỏi ở ô liền sau (10đ/Quan, 1đ/Dân). Nếu ô kế tiếp cũng trống, ăn tiếp!'
    ]
  },
  {
    id: 'gm_ludo',
    category: 'games',
    title: 'Đua Cá Ngựa (Ludo Show)',
    summary: 'Chiến thuật xúc xắc và đua ngựa về đích kịch tính.',
    icon: '🐴',
    badge: 'Chiến thuật',
    tags: ['dua ca ngua', 'ca ngua', 'ludo', 'xuc xac', 'da ngua', 'xuat chuong', 've dich', '4 chuong', 'luat choi ca ngua'],
    details: [
      'Bước 1: Hai đến Bốn đội cùng thi đấu trên bàn cờ Cá Ngựa.',
      'Bước 2: Trả lời đúng câu hỏi để được tung xúc xắc.',
      'Bước 3: Tung được số 6 thì sẽ được "Xuất Chuồng" một chú ngựa mới.',
      'Bước 4: Nếu điểm đến của ngựa trùng với vị trí ngựa đối phương, bạn có quyền "Đá" họ về chuồng!',
      'Bước 5: Đội đầu tiên đưa đủ 4 chú ngựa lên chuồng theo thứ tự 1-2-3-4 sẽ giành chiến thắng.'
    ]
  },
  {
    id: 'gm_territory',
    category: 'games',
    title: 'Chiếm Lãnh Thổ (Bản Đồ 36 Ô Chiến Thuật)',
    summary: 'Bản đồ ghép liền mạch 4 loại địa hình Núi, Rừng, Biển, Đồng bằng.',
    icon: '🗺️',
    badge: 'Chiến thuật',
    tags: ['chiem lanh tho', 'ban do 36 o', 'territory', 'dia hinh', 'nui', 'rung', 'bien', 'dong bang', 'dot kich', 'mo rong dat'],
    details: [
      'Bước 1: Bản đồ gồm 36 ô lục giác với các loại địa hình Núi (thủ 3), Rừng (thủ 2), Đồng bằng (thủ 1).',
      'Bước 2: Mỗi đội lần lượt trả lời câu hỏi để giành quyền mở rộng lãnh thổ hoặc tấn công ô của đối thủ.',
      'Bước 3: Khi tấn công, số điểm tấn công phải lớn hơn hoặc bằng sức phòng thủ (DEF) của địa hình đó.',
      'Bước 4: Sử dụng "Thử Thách Đột Kích" đúng lúc để xoay chuyển cục diện, chiếm gọn vùng đất của địch!'
    ]
  },
  {
    id: 'gm_battleship',
    category: 'games',
    title: 'Bắn Tàu Chiến Hải Quân',
    summary: 'Dò tọa độ và tiêu diệt hạm đội tàu chiến trên đại dương.',
    icon: '🚢',
    badge: 'Hải chiến',
    tags: ['ban tau chien', 'hai quan', 'battleship', 'toa do', 'dai bac', 'radar', 'ham doi', 'tau san bay'],
    details: [
      'Bước 1: Bàn cờ ẩn chứa các loại tàu chiến với kích thước khác nhau (Tàu tuần tra 1 ô, Tàu sân bay 3 ô...).',
      'Bước 2: Đội chơi chọn một tọa độ trên lưới và trả lời câu hỏi tương ứng.',
      'Bước 3: Trả lời đúng, đại bác sẽ khai hỏa vào tọa độ đó. Nếu trúng tàu, nhận thêm điểm thưởng lớn!',
      'Bước 4: Thỉnh thoảng sử dụng Radar để quét một khu vực lớn xem có tàu địch đang ẩn nấp hay không.'
    ]
  },
  {
    id: 'gm_wheel',
    category: 'games',
    title: 'Chiếc Nón Kỳ Diệu & Vòng Quay May Mắn',
    summary: 'Đoán chữ ô chữ bí mật kết hợp thử thách vòng quay điểm số.',
    icon: '🎡',
    badge: 'Gameshow',
    tags: ['chiec non ky dieu', 'vong quay may man', 'wheel', 'doan chu', 'o chu', 'mat luot', 'nhan doi', 'cum tu'],
    details: [
      'Bước 1: Giáo viên tạo ô chữ bí mật, có thể nhờ AI tạo tự động dựa trên từ khóa bài học.',
      'Bước 2: Các đội quay "Chiếc Nón Kỳ Diệu" để xác định điểm số (có thể quay trúng x2, Chia điểm, hoặc Mất lượt).',
      'Bước 3: Trả lời đúng câu hỏi sẽ được quyền đoán chữ cái.',
      'Bước 4: Đoán đúng toàn bộ ô chữ sẽ nhận điểm cực khủng và kết thúc trò chơi.'
    ]
  },
  {
    id: 'gm_openbox',
    category: 'games',
    title: 'Chiếc Hộp Bí Mật (Hộp Quà May Mắn)',
    summary: 'Mở từng gói quà bất ngờ với hiệu ứng hoạt hình sinh động.',
    icon: '🎁',
    badge: 'May mắn',
    tags: ['chiec hop bi mat', 'hop qua', 'open box', 'qua tang', 'mo hop', 'diem thuong', 'may man'],
    details: [
      'Bước 1: Trò chơi sẽ hiển thị các hộp quà bí ẩn trên giao diện Rừng Xanh, Vũ Trụ, Cầu Vồng,...',
      'Bước 2: Học sinh hoặc các đội lần lượt chọn hộp quà muốn mở.',
      'Bước 3: Giải quyết câu hỏi bên trong hộp để nhận chìa khóa.',
      'Bước 4: Hộp mở ra sẽ chứa điểm thưởng ngẫu nhiên (từ 10 đến 100 điểm) hoặc phần quà đặc biệt do giáo viên cài đặt.'
    ]
  },
  {
    id: 'gm_magicwheel',
    category: 'games',
    title: 'Vòng Xoay Thần Tốc & Vòng Quay May Mắn',
    summary: 'Vòng quay chọn ngẫu nhiên học sinh, câu hỏi hoặc phần thưởng.',
    icon: '🎯',
    badge: 'Nhanh gọn',
    tags: ['vong xoay than toc', 'magic wheel', 'quay ten hoc sinh', 'chon ngau nhien', 'vong quay'],
    details: [
      'Bước 1: Chọn chế độ "Vòng Quay May Mắn" ở menu chính.',
      'Bước 2: Nhập danh sách tên học sinh, các đội hoặc phần thưởng.',
      'Bước 3: Nhấn nút QUAY để mũi tên dừng lại ngẫu nhiên và chọn ra người may mắn.',
      'Bước 4: Có thể gắn câu hỏi vào vòng quay để vừa gọi tên vừa kiểm tra bài cũ cực kỳ tiện lợi.'
    ]
  },
  {
    id: 'gm_bingo',
    category: 'games',
    title: 'Đấu Trường Bingo Trí Tuệ',
    summary: 'Nối hàng ngang, hàng dọc, đường chéo để giành chiến thắng Bingo.',
    icon: '🔲',
    badge: 'Tương tác',
    tags: ['bingo', 'dau truong bingo', 'bang so', 'noi hang', 'duong cheo', 'hang ngang', 'hang doc'],
    details: [
      'Bước 1: Mỗi đội sẽ được phát một bảng Bingo ngẫu nhiên (3x3 hoặc 5x5).',
      'Bước 2: Trả lời đúng các câu hỏi trắc nghiệm xuất hiện trên màn hình.',
      'Bước 3: Đánh dấu vào ô số tương ứng với đáp án đúng trên bảng của mình.',
      'Bước 4: Đội đầu tiên nối được 1 (hoặc nhiều) đường thẳng ngang, dọc, chéo và hô BINGO sẽ chiến thắng!'
    ]
  },
  {
    id: 'gm_tugofwar',
    category: 'games',
    title: 'Kéo Co Tri Thức (Tug of War)',
    summary: 'Thi đấu đối kháng 2 đội kéo dây theo số câu trả lời đúng.',
    icon: '🪢',
    badge: 'Đối kháng',
    tags: ['keo co tri thuc', 'tug of war', 'keo co', 'doi khang', 'suc manh', 'keo day'],
    details: [
      'Bước 1: Chọn đội hình 2 phe: Xanh và Đỏ.',
      'Bước 2: Hệ thống tung ra các câu hỏi trắc nghiệm cần phản xạ nhanh.',
      'Bước 3: Cả hai đội cùng giành quyền trả lời. Đội nào trả lời đúng và nhanh hơn, sợi dây thừng sẽ kéo về phe đó 1 mốc.',
      'Bước 4: Kéo qua mốc chiến thắng (+5 hoặc -5) để giật cúp vô địch!'
    ]
  },
  {
    id: 'gm_betting',
    category: 'games',
    title: 'Đấu Giá Điểm Số & Đặt Cược Trí Tuệ',
    summary: 'Chiến thuật quản lý điểm cược trước mỗi câu hỏi khó.',
    icon: '💰',
    badge: 'Tâm lý',
    tags: ['dau gia tri tue', 'dat cuoc', 'betting', 'quan ly diem', 'nhan doi diem', 'mao hiem'],
    details: [
      'Bước 1: Trước mỗi câu hỏi, hệ thống sẽ hé lộ mức độ khó và chủ đề.',
      'Bước 2: Các đội tính toán và đặt cược số điểm mình đang có (10đ, 20đ, 50đ hoặc Tất tay).',
      'Bước 3: Bắt đầu trả lời câu hỏi.',
      'Bước 4: Đúng: Nhận lại gấp đôi số điểm đã cược. Sai: Mất sạch số điểm cược! Rất đau tim!'
    ]
  },
  {
    id: 'gm_pokemon',
    category: 'games',
    title: 'Thu Phục Bảo Bối (Pokemon Master)',
    summary: 'Ném bóng PokeBall thu phục thần thú quý hiếm.',
    icon: '⚡',
    badge: 'Phiêu lưu',
    tags: ['pokemon', 'thu phuc bao boi', 'pokeball', 'than thu', 'tien hoa', 'thu cung'],
    details: [
      'Bước 1: Bản đồ trò chơi sẽ xuất hiện nhiều bãi cỏ, tương ứng với các câu hỏi bí ẩn.',
      'Bước 2: Giải đố để ném bóng (PokeBall, GreatBall, UltraBall) vào sinh vật huyền thoại đang ẩn nấp.',
      'Bước 3: Tốc độ trả lời càng nhanh, bóng dùng càng xịn thì tỉ lệ bắt trúng càng cao.',
      'Bước 4: Đội nào thu thập được nhiều Thần Thú xịn nhất (Legendary) sẽ có tổng lực chiến mạnh nhất!'
    ]
  },
  {
    id: 'gm_tower',
    category: 'games',
    title: 'Xây Tháp Tri Thức (Tower Builder)',
    summary: 'Xếp chồng các tầng tháp cao vút không bị nghiêng đổ.',
    icon: '🏰',
    badge: 'Khéo léo',
    tags: ['xay thap tri thuc', 'tower builder', 'xep gach', 'can bang', 'tang thap', 'cong trinh'],
    details: [
      'Bước 1: Trò chơi kiểm tra sự khéo léo và kiên nhẫn.',
      'Bước 2: Mỗi lần trả lời đúng 1 câu hỏi, đội của bạn sẽ được đặt thêm 1 tầng tháp.',
      'Bước 3: Càng lên cao, gió sẽ thổi mạnh và tháp sẽ chao đảo.',
      'Bước 4: Đội xây được tòa tháp cao nhất mà không bị sập là người chiến thắng.'
    ]
  },
  {
    id: 'gm_race',
    category: 'games',
    title: 'Đường Đua Thần Tốc (Racing Championship)',
    summary: 'Đua xe công thức 1 vượt chướng ngại vật về đích.',
    icon: '🏎️',
    badge: 'Tốc độ',
    tags: ['duong dua than toc', 'racing', 'dua xe', 'nitro', 'tang toc', 've dich'],
    details: [
      'Bước 1: Chọn xe đua và vào vạch xuất phát.',
      'Bước 2: Mỗi khúc cua là một câu hỏi. Trả lời đúng để vượt khúc cua và giữ tốc độ cao.',
      'Bước 3: Trả lời xuất sắc liên tiếp để tích lũy bình Nitro siêu tốc.',
      'Bước 4: Bơm Nitro để vượt mặt đối thủ và cán đích nhận cúp vô địch vinh quang!'
    ]
  },
  {
    id: 'gm_puzzle',
    category: 'games',
    title: 'Mảnh Ghép Bí Ẩn (Mystery Puzzle)',
    summary: 'Lật mở từng mảnh ghép để đoán bức tranh chủ đề bí mật.',
    icon: '🧩',
    badge: 'Khám phá',
    tags: ['manh ghep bi an', 'puzzle', 'lat tranh', 'doan hinh', 'buc tranh bi mat'],
    details: [
      'Bước 1: Một bức tranh bí ẩn (do giáo viên tải lên hoặc chọn ngẫu nhiên) bị che bởi 9 hoặc 16 mảnh ghép.',
      'Bước 2: Trả lời đúng các câu hỏi để lật mở từng mảnh ghép nhỏ.',
      'Bước 3: Xâu chuỗi các hình ảnh lật được để đoán nội dung toàn bức tranh.',
      'Bước 4: Đội bấm chuông và đoán đúng bức tranh sớm nhất sẽ nhận giải đặc biệt!'
    ]
  },
  {
    id: 'gm_posechallenge',
    category: 'games',
    title: 'Thử Thách Tạo Dáng (Pose Challenge)',
    summary: 'Trò chơi vận động sôi nổi dành cho giờ sinh hoạt và khởi động.',
    icon: '🕺',
    badge: 'Vận động',
    tags: ['thu thach tao dang', 'pose challenge', 'van dong', 'tao dang', 'hoat nao', 'khoi dong'],
    details: [
      'Bước 1: Giáo viên phát động trò chơi giữa giờ để khởi động cơ thể (Warm-up).',
      'Bước 2: Màn hình sẽ hiển thị 1 hình dáng ngộ nghĩnh (Pose) ngẫu nhiên.',
      'Bước 3: Cả lớp phải làm theo và giữ nguyên tư thế đó trong vòng 5 giây đếm ngược.',
      'Bước 4: Giáo viên làm trọng tài, cộng điểm cho tổ/đội nào tạo dáng đều, đẹp và hài hước nhất.'
    ]
  },
  {
    id: 'gm_pictogram',
    category: 'games',
    title: 'Đuổi Hình Bắt Chữ AI (Pictogram Game)',
    summary: 'AI tự động vẽ tranh đố chữ ca dao tục ngữ và khái niệm khoa học.',
    icon: '🎨',
    badge: 'Trí tuệ AI',
    tags: ['duoi hinh bat chu', 'pictogram', 've tranh do chu', 'ca dao tuc ngu', 'ai sinh hinh'],
    details: [
      'Bước 1: Bật AI sinh hình ảnh trong trò chơi Đuổi Hình Bắt Chữ.',
      'Bước 2: AI tự động vẽ ra các bức tranh vui nhộn mô tả ca dao tục ngữ hoặc định nghĩa khoa học.',
      'Bước 3: Các đội nhìn hình, liên tưởng ý nghĩa và hô to đáp án.',
      'Bước 4: Nếu khó quá, có thể xin gợi ý chữ cái đầu tiên hoặc xin lời giải thích từ Wey!'
    ]
  },

  {
    id: 'gm_randomcall',
    category: 'games',
    title: 'Gọi Tên Ngẫu Nhiên (Random Call)',
    summary: 'Quay ngẫu nhiên tên học sinh -> Bốc câu hỏi tương ứng -> Trả lời & Ghi điểm.',
    icon: '🎯',
    badge: 'Gọi Tên',
    tags: ['goi ten ngau nhien', 'random call', 'goi ten', 'boc tham', 'quay ten', 'danh sach hoc sinh', 'khong lap lai'],
    details: [
      'Bước 1: Giáo viên nhập danh sách học sinh (1 học sinh/1 dòng) hoặc nạp nhanh danh sách mẫu.',
      'Bước 2: Chọn tùy chọn "Không Lặp Lại" để mỗi học sinh chỉ được gọi 1 lần, hoặc "Cho Phép Lặp Lại".',
      'Bước 3: Nhấn nút [QUAY TÊN NGẪU NHIÊN] để vòng quay dừng lại ở học sinh may mắn.',
      'Bước 4: Nhấn nút [BỐC CÂU HỎI CHO HỌC SINH NÀY] để mở câu hỏi từ Ngân Hàng, học sinh trả lời trong thời gian quy định.',
      'Bước 5: Giáo viên bấm [Chấm Đúng (+10đ)] hoặc [Chưa Chính Xác] rồi tiếp tục gọi học sinh tiếp theo!'
    ]
  },
  {
    id: 'gm_eggcall',
    category: 'games',
    title: 'Đập Trứng May Mắn (Egg Call)',
    summary: 'Đập vỡ quả trứng bí ẩn để gọi tên học sinh trả lời câu hỏi bài học.',
    icon: '🥚',
    badge: 'Đập Trứng',
    tags: ['dap trung may man', 'egg call', 'dap trung', 'goi ten', 'trung vang', 'qua trung bi an'],
    details: [
      'Bước 1: Nhập danh sách học sinh lớp và chọn ngân hàng câu hỏi phù hợp.',
      'Bước 2: Học sinh hoặc thầy cô nhấp vào Quả Trứng Vàng hoặc bấm nút [ĐẬP TRỨNG].',
      'Bước 3: Quả trứng rung lắc kèm âm thanh hoạt hình và vỡ ra cùng hiệu ứng pháo hoa rực rỡ hé lộ tên học sinh!',
      'Bước 4: Bấm [🎲 Bốc Câu Hỏi] để kiểm tra kiến thức của học sinh vừa được gọi.',
      'Bước 5: Sau khi trả lời xong, bấm [👉 Gọi Học Sinh Tiếp Theo] để trứng mới xuất hiện.'
    ]
  },
  {
    id: 'gm_blindbox',
    category: 'games',
    title: 'Mở Hộp Mù Bí Ẩn (Blind Box)',
    summary: 'Các đội trả lời câu hỏi để giành quyền khui hộp mù nhận điểm thưởng và vật phẩm theo chủ đề.',
    icon: '🎁',
    badge: 'Hộp Mù',
    tags: ['mo hop mu', 'blind box', 'hop bi an', 'vat pham', 'chu de', 'tra loi cau hoi mo hop'],
    details: [
      'Bước 1: Chọn chủ đề Blind Box (Sinh vật biển, Khám phá vũ trụ, Đồ chơi cổ tích...).',
      'Bước 2: Mỗi đội lần lượt chọn hộp bí ẩn và trả lời câu hỏi được chỉ định.',
      'Bước 3: Nếu TRẢ LỜI ĐÚNG -> Hộp mù sẽ được mở khóa, hé lộ vật phẩm quý hiếm cùng điểm cộng ngẫu nhiên!',
      'Bước 4: Nếu TRẢ LỜI SAI -> Hộp bị khóa lại và chuyển cơ hội cho đội tiếp theo.',
      'Bước 5: Đội sưu tập được nhiều vật phẩm hiếm nhất và điểm cao nhất sẽ chiến thắng.'
    ]
  },
  {
    id: 'gm_caro',
    category: 'games',
    title: 'Cờ Caro Cổ Điển (Gomoku 5-in-a-row)',
    summary: 'Đấu trí trên bàn cờ caro truyền thống, nối 5 quân liên tiếp để chiến thắng.',
    icon: '❌',
    badge: 'Kinh điển',
    tags: ['caro', 'co caro', 'gomoku', '5 in a row', 'x o', 'co x o'],
    details: [
      'Bước 1: Trò chơi chia làm 2 phe X và O trên bàn cờ caro.',
      'Bước 2: Trả lời đúng câu hỏi để được quyền đánh 1 quân cờ lên vị trí bất kỳ.',
      'Bước 3: Chú ý quan sát và chặn các nước cờ nguy hiểm của đối phương.',
      'Bước 4: Đội đầu tiên tạo thành hàng 5 quân liên tiếp (ngang, dọc, chéo) sẽ giành chiến thắng tuyệt đối!'
    ]
  },
  {
    id: 'gm_chess',
    category: 'games',
    title: 'Cờ Vua Trí Tuệ (Bàn Cờ 8x8)',
    summary: 'Chiến thuật cờ vua kết hợp trả lời câu hỏi để được phép di chuyển quân cờ.',
    icon: '♟️',
    badge: 'Chiến thuật',
    tags: ['co vua', 'chess', 'co ban', 'chieu tuong', 'chieu mat', 'checkmate'],
    details: [
      'Bước 1: Bàn cờ vua 8x8 tiêu chuẩn với đầy đủ quân.',
      'Bước 2: Để được di chuyển quân cờ, đội phải trả lời đúng 1 câu hỏi do giáo viên đưa ra.',
      'Bước 3: Nếu trả lời sai, đội sẽ bị mất lượt, tạo cơ hội cho đối phương phản công.',
      'Bước 4: Triển khai chiến thuật, Chiếu Bí (Checkmate) Vua đối phương để kết thúc ván đấu tri thức này!'
    ]
  },
  {
    id: 'gm_applepick',
    category: 'games',
    title: 'Hái Táo (Ông Smith)',
    summary: 'Trò chơi Boardgame giáo dục Hái Táo, né tránh các ô chia hết cho số bí mật của Ông Smith.',
    icon: '🍎',
    badge: 'Boardgame',
    tags: ['hai tao', 'apple pick', 'ong smith', 'chia het', 'toan hoc', 'boardgame', 'xuc xac'],
    details: [
      'Bước 1: Ông Smith chọn một số bí mật (2, 3, 4, 5, 6).',
      'Bước 2: Các đội lần lượt đổ xúc xắc để di chuyển quân cờ quanh khu vườn.',
      'Bước 3: Nếu dừng chân ở ô CÓ số chia hết cho số bí mật, đội sẽ bị Ông Smith bắt mất lượt.',
      'Bước 4: Nếu dừng ở ô KHÔNG chia hết, đội an toàn và nhận 1 quả táo.',
      'Bước 5: Đội thu thập đủ 6 quả táo trước sẽ chiến thắng!'
    ]
  },
  {
    id: 'gm_cothu',
    category: 'games',
    title: 'Cờ Thú (Jungle Chess)',
    summary: 'Trận chiến trí tuệ của các loài vật, ăn quân theo cấp bậc và đưa quân vào hang ổ đối phương.',
    icon: '🐾',
    badge: 'Chiến thuật',
    tags: ['Boardgame', 'Đấu trí'],
    details: [
      'Boardgame Cờ Thú phiên bản giáo dục.',
      '1. Giáo viên đưa ra câu hỏi. Đội trả lời đúng sẽ giành quyền đi cờ.',
      '2. Luật ăn quân: Thú lớn ăn thú bé (Voi > Sư tử > Hổ > Báo > Chó > Sói > Mèo > Chuột).',
      '3. Đặc biệt: Chuột ăn được Voi và có thể đi dưới sông. Sư tử và Hổ có thể nhảy qua sông.',
      '4. Nếu đưa được một quân cờ vào Hang Ổ của đối phương, đội đó sẽ giành Chiến thắng và được nhân đôi điểm số ván đó!'
    ],
  },
  {
    id: 'gm_sontinh',
    category: 'games',
    title: 'Sơn Tinh Thủy Tinh',
    summary: 'Đại chiến chiến thuật tìm sính lễ, thi triển phép thuật dâng núi và gọi lũ.',
    icon: '⚔️',
    badge: 'Chiến thuật',
    tags: ['son tinh thuy tinh', 'su thi', 'viet nam', 'chien thuat', 'phep thuat', 'voi 9 nga'],
    details: [
      'Bước 1: Chọn chế độ 2 phe (Sơn Tinh vs Thủy Tinh) hoặc Free-For-All.',
      'Bước 2: Trả lời câu hỏi để tích lũy Điểm Hành Động (AP).',
      'Bước 3: Dùng AP để di chuyển trên bản đồ lục lăng (Hex grid), nhặt sính lễ (Voi 9 ngà...).',
      'Bước 4: Dùng phép thuật đặc trưng (Sơn Tinh dâng núi chặn đường, Thủy Tinh gọi lũ đẩy lùi) để cản bước đối phương.',
      'Bước 5: Đội đầu tiên thu thập đủ 3 sính lễ sẽ chiến thắng.'
    ]
  },
  {
    id: 'gm_mineboom',
    category: 'games',
    title: 'Dò Boom Tri Thức',
    summary: 'Lật mở các ô gạch ẩn, né tránh Boom và thu thập điểm vàng kịch tính.',
    icon: '💣',
    badge: 'Cân não',
    tags: ['do boom', 'mine sweeper', 'mine boom', 'quyet dinh', 'may man', 'lat o'],
    details: [
      'Bước 1: Chọn một ô gạch chưa lật trên bãi mìn.',
      'Bước 2: Trả lời đúng câu hỏi để được phép lật ô gạch.',
      'Bước 3: Nếu mở ra Điểm Vàng -> Cộng điểm. Nếu lật trúng BOOM -> Trừ điểm cảnh cáo.',
      'Bước 4: Nếu một đội lật trúng quá số lượng Boom tối đa (ví dụ 3 Boom), đội đó sẽ bị loại.',
      'Bước 5: Kết thúc khi lật hết các ô, đội nhiều điểm nhất thắng!'
    ]
  },
  {
    id: 'gm_goldminer',
    category: 'games',
    title: 'Đào Vàng',
    summary: 'Canh chuẩn góc thả móc neo để kéo vàng, né tránh đá tảng mất thời gian.',
    icon: '⛏️',
    badge: 'Khéo léo',
    tags: ['dao vang', 'gold miner', 'canh goc', 'tha moc', 'keo vang'],
    details: [
      'Bước 1: Trả lời câu hỏi để nhận lượt thả neo móc vàng.',
      'Bước 2: Quan sát móc neo đung đưa, căn góc và bấm "Thả" để bắt các quặng vàng lớn.',
      'Bước 3: Nếu kéo trúng đá tảng sẽ tốn thời gian và bị trừ điểm. Có thể kéo được Túi Bí Mật chứa điểm thưởng.',
      'Bước 4: Tích cực gom vàng để đạt số điểm cao nhất!'
    ]
  },
  {
    id: 'gm_bearpass',
    category: 'games',
    title: 'Truyền Gấu Sân Khấu',
    summary: 'Âm nhạc nổi lên và dừng bất ngờ để gọi tên học sinh trả bài.',
    icon: '🧸',
    badge: 'Gọi tên',
    tags: ['truyen gau', 'bear pass', 'am nhac', 'goi ten', 'ngau nhien', 'tuong tac'],
    details: [
      'Bước 1: Lớp học đứng thành vòng tròn hoặc ngồi tại chỗ, nhạc nổi lên.',
      'Bước 2: Trên màn hình, Gấu Teddy sẽ được truyền qua lại. Nhạc có thể dừng ngẫu nhiên.',
      'Bước 3: Khi nhạc tắt, Gấu dừng ở tên học sinh nào, học sinh đó phải trả lời câu hỏi.',
      'Bước 4: Trả lời đúng nhận điểm/phần thưởng, trả lời sai sẽ nhận hình phạt vui nhộn.'
    ]
  },
  {
    id: 'gm_letterarrange',
    category: 'games',
    title: 'Sắp Xếp Chữ Cái',
    summary: 'Sắp xếp các thẻ chữ cái bị xáo trộn thành từ khóa đúng.',
    icon: '🔤',
    badge: 'Ô chữ',
    tags: ['sap xep chu', 'letter arrange', 'ghep chu', 'tu vung', 'tieng viet'],
    details: [
      'Bước 1: Trò chơi hiển thị một từ khóa bị xáo trộn các chữ cái (Anagram).',
      'Bước 2: Kéo thả các thẻ chữ cái hoặc nhấp theo thứ tự để tạo thành từ có nghĩa.',
      'Bước 3: Có thể dùng gợi ý nếu gặp từ khóa khó.',
      'Bước 4: Tăng vốn từ vựng và luyện phản xạ rất tốt!'
    ]
  },
  {
    id: 'gm_monopoly',
    category: 'games',
    title: 'Cờ Tỷ Phú Tri Thức',
    summary: 'Boardgame kinh tế giáo dục: gieo xúc xắc, mua đất, xây nhà, rút thẻ sự kiện và thu tiền thuê.',
    icon: '🎩',
    badge: 'Boardgame',
    tags: ['co ty phu', 'monopoly', 'ty phu', 'bat dong san', 'xuc xac', 'dau tri', 'kinh te'],
    details: [
      'Bước 1: Đến lượt, đội trả lời câu hỏi tri thức. Trả lời ĐÚNG để mở khóa quyền gieo xúc xắc, trả lời SAI bị mất lượt.',
      'Bước 2: Gieo xúc xắc để di chuyển quân cờ quanh 24 ô trên bàn cờ chu vi.',
      'Bước 3: Đáp vào ô Đất trống có thể mua để làm chủ sở hữu; đáp vào ô đất của mình có thể nâng cấp xây nhà.',
      'Bước 4: Đối thủ đi vào đất của bạn sẽ phải trả tiền thuê! Có thể dùng Thẻ Khiên Miễn Phí để tránh trả tiền thuê.',
      'Bước 5: Đi qua ô START nhận lương +$200; đội có tài sản lớn nhất hoặc sống sót cuối cùng sẽ chiến thắng.'
    ]
  },
  {
    id: 'gm_werewolf',
    category: 'games',
    title: 'Ma Sói: Ngôi Làng Bí Ẩn',
    summary: 'Đấu trí điều tra 12 cư dân NPC đêm tự động & Biểu quyết vote treo cổ Ma Sói.',
    icon: '🐺',
    badge: 'Trinh thám',
    tags: ['ma soi', 'werewolf', 'ngoi lang bi an', 'npc', 'vote treo co', 'tien tri', 'bao ve', 'phu thuy', 'tho san'],
    details: [
      'Bước 1: Ban đêm (Night Engine): 12 NPC thông minh tự động thực hiện hành động bí mật (Sói cắn, Tiên tri soi, Bảo vệ tạo khiên, Phù thủy cứu/độc, Thợ săn găm đạn).',
      'Bước 2: Bình minh (Dawn): Ngôi làng công bố danh tính người tử nạn đêm qua (nếu có) và hiển thị Nhật ký Manh Mối đêm không tiết lộ danh tính NPC.',
      'Bước 3: Biểu quyết Vote Treo Cổ: Đội đến lượt thảo luận và bỏ phiếu Vote 1 NPC tình nghi. NPC bị vote sẽ BỊ TREO CỔ (tử nạn ngay) và hé lộ danh tính thật.',
      'Bước 4: Nếu Treo cổ đúng Ma Sói: Đội nhận thưởng điểm x2 và loại bỏ mối nguy hiểm cho dân làng.',
      'Bước 5: Chế độ câu hỏi: Trả lời đúng để nhận quyền Vote hoặc kiểm tra danh tính. Chế độ bỏ qua câu hỏi: Đến lượt là tiến hành vote treo cổ ngay.'
    ]
  },
  {
    id: 'gm_whackamole',
    category: 'games',
    title: 'Đập Chuột Chũi Nhanh Tay',
    summary: 'Phản xạ nhanh đập trúng chuột mang đáp án đúng, né chuột bẫy bom.',
    icon: '🔨',
    badge: 'Phản xạ',
    tags: ['dap chuot chui', 'whack a mole', 'dap chuot', 'phan xa', 'go bua', 'ne bom', 'khoi dong'],
    details: [
      'Bước 1: Đọc câu hỏi hiển thị trên bảng phía trên sân cỏ.',
      'Bước 2: Các chú chuột chũi trồi lên từ các hang mang theo các đáp án A, B, C, D.',
      'Bước 3: Nhấp chuột hoặc chạm tay vào chú chuột có đáp án ĐÚNG.',
      'Bước 4: Đập đúng: Hiệu ứng búa gõ sao bay, nhận trọn điểm thưởng câu hỏi (+10đ).',
      'Bước 5: Đập sai hoặc đập trúng Chuột Bẫy Bom 💣: Bị choáng váng và trừ điểm (-5đ)!'
    ]
  },
  {
    id: 'gm_classification',
    category: 'games',
    title: 'Phân Loại Thẻ Bài & Rác Thải',
    summary: 'Kéo thả đối tượng từ kho trung tâm vào đúng nhóm phân loại tương ứng.',
    icon: '📁',
    badge: 'Tư duy',
    tags: ['phan loai', 'classification', 'phan loai the bai', 'phan loai rac', 'keo tha', 'nhom'],
    details: [
      'Bước 1: Nhấp chọn một đối tượng (từ, cụm từ, hình ảnh) ở kho trung tâm.',
      'Bước 2: Nhấp chọn nhóm phân loại phù hợp ở hàng bên dưới (hoặc kéo thả trực tiếp).',
      'Bước 3: Nếu đúng: Đối tượng bay vào giỏ/nhóm thành công và cộng điểm.',
      'Bước 4: Nếu sai: Báo hiệu rung lắc và hoàn trả lại kho trung tâm.'
    ]
  },
  {
    id: 'gm_flagcapture',
    category: 'games',
    title: 'Cướp Cờ Tri Thức',
    summary: 'Trả lời đúng kích hoạt vận động viên bứt tốc cướp cờ vàng về căn cứ.',
    icon: '🚩',
    badge: 'Đua tốc độ',
    tags: ['cuop co tri thuc', 'flag capture', 'cuop co', 'chay nhanh', 'but toc', 'the thao'],
    details: [
      'Bước 1: Lá cờ vàng danh dự đặt tại tâm sân khấu thể thao.',
      'Bước 2: Đến lượt, đội đọc câu hỏi và lựa chọn phương án chính xác.',
      'Bước 3: Trả lời ĐÚNG: Vận động viên đội bạn bứt tốc lao tới tâm sân khấu giật cờ và chạy về đích!',
      'Bước 4: Trả lời SAI: Đứng yên tại căn cứ và mất cơ hội cướp cờ ở vòng đấu đó.'
    ]
  },
  {
    id: 'gm_sackrace',
    category: 'games',
    title: 'Nhảy Bao Bố Về Đích',
    summary: 'Đua nhảy bao bố theo làn thi đấu, trả lời đúng để nhảy tiến lên về đích.',
    icon: '🌾',
    badge: 'Đồng đội',
    tags: ['nhay bao bo', 'sack race', 'dua bao bo', 'lan dua', 've dich', 'van dong'],
    details: [
      'Bước 1: Mỗi đội xuất phát tại một làn đua (lane) riêng biệt.',
      'Bước 2: Đến lượt, đội trả lời câu hỏi hiển thị trên màn hình.',
      'Bước 3: Trả lời ĐÚNG: Nhân vật nhảy bật bưng bưng tiến lên 1 hoặc 2 bước về phía trước.',
      'Bước 4: Trả lời SAI: Bị vấp đứng yên tại chỗ.',
      'Bước 5: Đội đầu tiên nhảy chạm vạch đích sẽ giương cúp vô địch (+50đ)!'
    ]
  },
  {
    id: 'gm_snailwords',
    category: 'games',
    title: 'Ốc Sên Tinh Mắt',
    summary: 'Tìm từ khóa ẩn giấu trong ma trận chữ cái cùng linh vật Ốc Sên.',
    icon: '🐌',
    badge: 'Ô chữ',
    tags: ['oc sen tinh mat', 'snail word search', 'tim tu', 'ma tran chu', 'tu khoa an'],
    details: [
      'Bước 1: Quan sát danh sách từ khóa cần tìm ở cột bên trái.',
      'Bước 2: Tìm kiếm chuỗi chữ cái tương ứng trong bảng ma trận.',
      'Bước 3: Nhấp vào ô chữ cái đầu tiên, sau đó nhấp vào ô chữ cái cuối cùng của từ (hoặc kéo chuột).',
      'Bước 4: Tìm đúng: Từ khóa được highlight nổi bật rực rỡ và Ốc sên nhảy múa chúc mừng (+20đ/từ)!'
    ]
  },

  // AI Features
  {
    id: 'ai_0',
    category: 'ai',
    title: '🔑 Quản Trị Gemini API Key & Kiểm Tra Kết Nối Real-Time',
    summary: 'Hệ thống Quản Lý API Key độc lập, kiểm tra trạng thái Online/Offline trực tiếp từ Google.',
    icon: '🔑',
    badge: 'Bảo mật & Quản trị',
    tags: ['api key', 'gemini api', 'quan tri api', 'test key', 'kiem tra api', 'admin api', 'gemini 2.5', 'flash', 'pro', 'chuyen doi api'],
    details: [
      'Bước 1: Bấm vào biểu tượng Cài Đặt AI / Quản Lý API Key trên thanh tiêu đề.',
      'Bước 2: Thêm một hoặc nhiều Gemini API Key riêng biệt (mỗi key có nhãn gợi nhớ riêng).',
      'Bước 3: Bấm nút "Kiểm Tra Trực Tiếp": Hệ thống gửi yêu cầu xác thực thật tới Google, hiển thị mã trạng thái HTTP (200 OK, 400, 401 Unauthorized, 429 Quota Exceeded...).',
      'Bước 4: Bấm "Chọn Dùng" để đặt làm API Key đang hoạt động cho toàn bộ tính năng AI (Quét tài liệu, Tạo đề thi, Vẽ sơ đồ SVG, Trợ lý ảo).',
      'Bước 5: Tùy chọn chuyển đổi linh hoạt giữa các mô hình Gemini 2.5 Flash (siêu tốc) hoặc Gemini 2.5 Pro (tư duy sâu).'
    ]
  },
  {
    id: 'ai_1',
    category: 'ai',
    title: 'Quét Tự Động Tài Liệu / Đề Thi Bằng AI & OCR Đa Định Dạng',
    summary: 'Chuyển toàn bộ đề thi Word/PDF/Text/Ảnh thành ngân hàng câu hỏi trong 3 giây.',
    icon: '📄',
    badge: 'AI Siêu Tốc',
    tags: ['cách tạo bộ câu hỏi', 'quet de', 'quet tai lieu', 'ocr', 'import', 'word', 'pdf', 'text', 'anh', 'soan cau hoi', 'tu dong', 'tao de', 'nhap de', 'trich xuat', 'doc', 'docx', 'paste text'],
    details: [
      'Bấm nút "Tạo Bằng AI" ở góc trên hoặc vào "Ngân Hàng Câu Hỏi" -> "Quét Tài Liệu AI".',
      'Dán đoạn văn bản đề thi thô, tải file Word (.docx), file PDF hoặc tải hình ảnh chụp đề thi.',
      'AI sẽ tự động nhận diện câu hỏi, 4 đáp án A-B-C-D, đáp án đúng, công thức toán LaTeX và lời giải chi tiết cực kỳ chuẩn xác!'
    ]
  },
  {
    id: 'ai_2',
    category: 'ai',
    title: 'Sinh Câu Hỏi Tự Động Chuẩn Chương Trình GDPT 2018',
    summary: 'Tạo bộ đề theo Khối Lớp, Môn Học và 4 Mức Độ Tư Duy (Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao).',
    icon: '✨',
    badge: 'Chuẩn GDPT 2018',
    tags: ['cách tạo bộ câu hỏi', 'tao cau hoi ai', 'sinh de', 'gdpt 2018', 'nhan biet', 'thong hieu', 'van dung', 'van dung cao', 'mon hoc', 'lop', 'toan', 'van', 'tieng anh', 'lich su', 'trac nghiem', 'gemini'],
    details: [
      'Chọn Môn Học (Toán, Ngữ Văn, Tiếng Anh, KHTN, Lịch Sử - Địa Lý, Tin Học, GDCD...), Khối Lớp (1 - 12) và Chủ đề bài học.',
      'Lựa chọn phân bổ 4 mức độ nhận thức: Nhận biết, Thông hiểu, Vận dụng và Vận dụng cao.',
      'AI sẽ tự động tạo bộ câu hỏi đa dạng (Trắc nghiệm 4 lựa chọn, Đúng/Sai, Điền từ) bám sát yêu cầu cần đạt.',
      'Bạn có thể xem trước, chỉnh sửa đáp án, bổ sung hình ảnh và lưu thẳng vào ngân hàng câu hỏi.'
    ]
  },
  {
    id: 'ai_3',
    category: 'ai',
    title: 'Tạo Hình Ảnh Minh Họa & Sơ Đồ Vector SVG Bằng AI',
    summary: 'Minh họa trực quan các khái niệm khoa học, sinh học, địa lý, hình học bằng đồ họa SVG sắc nét.',
    icon: '🎨',
    badge: 'Đồ họa SVG',
    tags: ['tao anh ai', 've anh', 'minh hoa bai hoc', 'do hoa', 'hinh anh cau hoi', 'svg', 'ai ve anh', 'so do hinh hoc', 'vector'],
    details: [
      'Trong trình chỉnh sửa câu hỏi, bấm nút "Tạo Ảnh AI / Sơ Đồ SVG".',
      'Nhập mô tả hình ảnh cần vẽ (VD: Sơ đồ chu trình nước, Mô hình tế bào thực vật, Tam giác vuông đồng dạng, Bản đồ khí hậu...).',
      'AI sẽ sinh mã vector SVG sắc nét không vỡ hạt trên màn hình TV lớn và gắn trực tiếp vào câu hỏi.'
    ]
  },

  // Tips
  {
    id: 'tip_1',
    category: 'tips',
    title: 'Bộ Phím Tắt & Thao Tác Nhanh Tiện Lợi',
    summary: 'Giúp giáo viên làm chủ bục giảng mượt mà và chuyên nghiệp.',
    icon: '⌨️',
    badge: 'Phím tắt',
    tags: ['phim tat', 'f11', 'esc', 'phim tat nhanh', 'tat am thanh', 'thoat game', 'hotkey', 'shortcuts'],
    details: [
      'F11: Bật / Tắt chế độ toàn màn hình không viền trình duyệt.',
      'Esc: Đóng các modal / cửa sổ hướng dẫn nhanh chóng.',
      'Nút Loa Góc Trên: Bật hoặc tắt nhạc nền và âm thanh tương tác.',
      'Nút Thoát Game: Quay trở lại trang chủ bất kỳ lúc nào mà không bị đơ giao diện.'
    ]
  },
  {
    id: 'tip_2',
    category: 'tips',
    title: 'Xuất & Nhập Ngân Hàng Câu Hỏi Ra File Excel / JSON',
    summary: 'Dễ dàng chia sẻ bộ đề cho đồng nghiệp hoặc sao lưu về máy tính.',
    icon: '💾',
    badge: 'Tiện ích',
    tags: ['cách tạo bộ câu hỏi', 'luu de', 'xuat file', 'nhap file', 'excel', 'json', 'sao luu', 'chia se', 'tai ve', 'mo file', 'in an'],
    details: [
      'Trong trang "Ngân Hàng Câu Hỏi", bấm nút "Xuất File JSON" để lưu về máy.',
      'Muốn nạp vào máy khác chỉ cần bấm "Nhập File" là có ngay toàn bộ câu hỏi đã soạn.',
      'Hỗ trợ in ấn và chỉnh sửa câu hỏi trực tiếp trên trình duyệt cực kỳ tiện lợi.'
    ]
  }
];

const WEY_QUOTES = [
  "Xin chào thầy cô và các bạn! Mình là Wey - chú chuột lang nước (Capybara) hiền lành, người bạn đồng hành vui vẻ của lớp học! 🦦",
  "💡 Thầy cô nhớ ĐĂNG NHẬP và chọn API Key hợp lệ trước khi dùng AI để tạo câu hỏi/sinh ảnh mượt mà nhé! 🔑✨",
  "Mẹo nhỏ: Nhấn phím F11 trên bàn phím để bật Toàn Màn Hình, giúp học sinh quan sát rõ nhất nhé! 📺",
  "🤖 Muốn quét đề thi Word/PDF siêu tốc? Nhớ kiểm tra API Key đã kết nối rồi bấm 'Quét Tài Liệu AI' nhé! 📄",
  "Nếu đang chơi mà hết câu hỏi giữa chừng? Đừng lo, hộp thoại 'Nạp Câu Hỏi' sẽ hiện ra để bạn chọn bộ câu hỏi khác ngay lập tức! 🔄",
  "Wey's Playground cập nhật liên tục, hiện đã có 35 trò chơi tương tác đa dạng kèm thẻ mục đích (Khởi động, Luyện tập, Đấu trí...)! 🎲",
  "Thầy cô có thể chia sẻ bộ câu hỏi cho đồng nghiệp bằng nút 'Xuất/Nhập File' ở phần Ngân Hàng Câu Hỏi! 💾"
];

// Stopwords in Vietnamese search queries to skip
const STOP_WORDS = new Set([
  'cách', 'lam', 'làm', 'sao', 'cho', 'để', 'de', 'như', 'nhu', 'thế', 'the', 'nào', 'nao',
  'ở', 'o', 'đâu', 'dau', 'các', 'cac', 'của', 'cua', 'và', 'va', 'hoặc', 'hoac', 'có', 'co'
]);

export const WeyGuideMascot: React.FC<WeyGuideMascotProps> = ({
  onOpenBankView,
  onSelectGame,
}) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [activeCategory, setActiveCategory] = useState<string>('quickstart');
  const [selectedGuideId, setSelectedGuideId] = useState<string>('qs_1');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [quoteIndex, setQuoteIndex] = useState<number>(0);
  const [isBubbleVisible, setIsBubbleVisible] = useState<boolean>(true);
  const [isMinimized, setIsMinimized] = useState<boolean>(() => {
    return localStorage.getItem('wey_mascot_hidden') === 'true';
  });

  // Rotate quotes periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % WEY_QUOTES.length);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  const toggleVisibility = () => {
    soundFx.buttonClick();
    const nextState = !isMinimized;
    setIsMinimized(nextState);
    localStorage.setItem('wey_mascot_hidden', String(nextState));
  };

  const handleOpenHub = () => {
    soundFx.cardPower();
    setIsOpen(true);
  };

  // Smart Search Engine (Fuzzy, Accent-Insensitive, Token-Scored)
  const searchResults = useMemo(() => {
    const raw = searchQuery.trim();
    if (!raw) {
      return GUIDE_ITEMS.filter(item => item.category === activeCategory);
    }

    const normQuery = removeVietnameseTones(raw);
    const tokens = normQuery
      .split(/\s+/)
      .filter(t => t.length > 0 && !STOP_WORDS.has(t));

    const scored = GUIDE_ITEMS.map(item => {
      let score = 0;
      const normTitle = removeVietnameseTones(item.title);
      const normSummary = removeVietnameseTones(item.summary);
      const normDetails = removeVietnameseTones(item.details.join(' '));
      const normTags = item.tags.map(t => removeVietnameseTones(t));

      // 1. Exact phrase match in tags or title
      if (normTitle.includes(normQuery)) score += 120;
      if (normTags.some(t => t.includes(normQuery) || normQuery.includes(t))) score += 100;
      if (normSummary.includes(normQuery)) score += 60;
      if (normDetails.includes(normQuery)) score += 40;

      // 2. Token-level matching
      tokens.forEach(tok => {
        if (normTitle.includes(tok)) score += 30;
        if (normTags.some(t => t.includes(tok))) score += 25;
        if (normSummary.includes(tok)) score += 15;
        if (normDetails.includes(tok)) score += 10;
      });

      // 3. Synonym expansions (e.g. "cách tạo bộ câu hỏi" / "soạn đề")
      if (normQuery.includes('tao') && (normQuery.includes('cau hoi') || normQuery.includes('bo') || normQuery.includes('de'))) {
        if (item.id === 'ai_1' || item.id === 'ai_2' || item.id === 'qs_1' || item.id === 'tip_2') {
          score += 80;
        }
      }

      if (normQuery.includes('man hinh') || normQuery.includes('chieu') || normQuery.includes('tv') || normQuery.includes('f11')) {
        if (item.id === 'tc_1' || item.id === 'tip_1') {
          score += 90;
        }
      }

      if (normQuery.includes('o an quan') || normQuery.includes('tam giac') || normQuery.includes('3 doi')) {
        if (item.id === 'gm_mancala') {
          score += 150;
        }
      }

      if (normQuery.includes('che do') || normQuery.includes('dang cau hoi') || normQuery.includes('trac nghiem') || normQuery.includes('dung sai') || normQuery.includes('tu luan') || normQuery.includes('cach bam') || normQuery.includes('cach an') || normQuery.includes('hinh thuc')) {
        if (item.category === 'modes_questions') {
          score += 120;
        }
      }

      return { item, score };
    });

    return scored
      .filter(entry => entry.score > 0)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item);
  }, [searchQuery, activeCategory]);

  // Update selected guide when search result changes
  useEffect(() => {
    if (searchResults.length > 0) {
      if (!searchResults.some(g => g.id === selectedGuideId)) {
        setSelectedGuideId(searchResults[0].id);
      }
    }
  }, [searchResults, selectedGuideId]);

  const currentGuide = GUIDE_ITEMS.find(g => g.id === selectedGuideId) || searchResults[0] || GUIDE_ITEMS[0];

  return (
    <>
      {/* Floating Mascot Widget */}
      {!isMinimized && (
        <aside aria-label="Trợ lý linh vật Wey" className="fixed bottom-4 right-4 z-40 flex flex-col items-end gap-2 pointer-events-auto select-none">
          {/* Animated Speech Bubble */}
          {isBubbleVisible && !isOpen && (
            <div className="max-w-[280px] sm:max-w-[320px] bg-w-bg-card text-w-text-main p-3 rounded-2xl rounded-br-xs border-2 border-w-border shadow-xl text-xs font-semibold relative animate-fade-in wey-paper-card">
              <button
                onClick={() => setIsBubbleVisible(false)}
                className="absolute -top-2 -left-2 w-5 h-5 bg-white border border-slate-300 rounded-full text-slate-500 hover:text-slate-900 flex items-center justify-center text-[10px] shadow-xs cursor-pointer"
                title="Tạm ẩn lời thoại"
              >
                ✕
              </button>
              
              <div className="flex items-start gap-2">
                <span className="text-base shrink-0 animate-bounce">🐹</span>
                <p className="leading-relaxed text-[11px] sm:text-xs">
                  {WEY_QUOTES[quoteIndex]}
                </p>
              </div>

              <div className="mt-2 pt-2 border-t border-w-border/60 flex items-center justify-between text-[10px] text-w-text-muted">
                <button
                  onClick={() => {
                    soundFx.buttonClick();
                    setQuoteIndex(prev => (prev + 1) % WEY_QUOTES.length);
                  }}
                  className="text-w-primary-dark hover:underline font-bold flex items-center gap-1 cursor-pointer"
                >
                  <span>Mẹo tiếp theo</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
                <button
                  onClick={handleOpenHub}
                  className="px-2 py-0.5 bg-w-accent-light text-w-primary-dark rounded-full font-bold hover:bg-w-accent-muted transition cursor-pointer"
                >
                  Xem Cẩm Nang 📖
                </button>
              </div>
            </div>
          )}

          {/* Floating Mascot Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleVisibility}
              className="p-1.5 bg-w-bg-card/90 hover:bg-white text-w-text-muted hover:text-w-text-main rounded-full border border-w-border shadow-md text-xs transition cursor-pointer"
              title="Ẩn Linh Vật Wey"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            <button
              onClick={handleOpenHub}
              className="group relative flex items-center gap-2 bg-gradient-to-r from-w-primary via-w-primary-dark to-w-primary-hover text-white p-2 sm:px-4 sm:py-2.5 rounded-full shadow-[0_6px_20px_rgba(79,104,60,0.35)] hover:shadow-[0_8px_25px_rgba(79,104,60,0.45)] hover:scale-105 transition-all duration-300 border-2 border-w-border/80 cursor-pointer"
            >
              <div className="relative">
                <img
                  src="/assets/Picture2.png"
                  alt="Wey Mascot"
                  className="w-9 h-9 sm:w-10 sm:h-10 object-cover rounded-full drop-shadow-md group-hover:rotate-6 transition-transform border-2 border-white/50"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.endsWith('/assets/hamster.jpg')) {
                      target.src = '/assets/hamster.jpg';
                    }
                  }}
                />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white animate-ping" />
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-amber-400 rounded-full border-2 border-white" />
              </div>

              <div className="hidden sm:block text-left pr-1">
                <div className="text-xs font-black text-w-bg-card leading-none flex items-center gap-1">
                  <span>Linh Vật Wey</span>
                  <span className="text-[9px] bg-amber-100 text-w-text-main px-1.5 py-0.2 rounded-full font-bold">
                    Trợ Lý
                  </span>
                </div>
                <div className="text-[10px] text-amber-500 font-semibold mt-0.5">
                  Bấm để xem hướng dẫn
                </div>
              </div>
            </button>
          </div>
        </aside>
      )}

      {/* When Minimized: Small Restore Button on Right edge */}
      {isMinimized && (
        <button
          onClick={toggleVisibility}
          className="fixed bottom-4 right-4 z-40 flex items-center gap-1.5 px-3 py-2 bg-w-bg-card text-w-primary-dark hover:bg-w-accent-light text-xs font-bold rounded-full border border-w-border shadow-lg hover:scale-105 transition cursor-pointer"
          title="Bật Linh Vật Wey Hướng Dẫn"
        >
          <img
            src="/assets/Picture2.png"
            alt="Wey"
            className="w-5 h-5 object-cover rounded-full"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              if (!target.src.endsWith('/assets/hamster.jpg')) {
                target.src = '/assets/hamster.jpg';
              }
            }}
          />
          <span>Linh Vật Wey 🦦</span>
        </button>
      )}

      {/* Main Guidance Hub Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 animate-fade-in">
          <div
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity"
            onClick={() => setIsOpen(false)}
          />

          <div className="bg-w-bg-card rounded-[28px] shadow-[0_20px_60px_rgba(0,0,0,0.25)] border-4 border-w-border w-full max-w-4xl max-h-[92vh] flex flex-col relative z-10 overflow-hidden wey-paper-card">
            {/* Modal Header */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-w-primary-dark via-w-primary-hover to-w-primary-dark text-white flex items-center justify-between border-b border-w-primary-hover">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-w-bg-card/20 border border-w-border/50 flex items-center justify-center shadow-inner overflow-hidden">
                  <img
                    src="/assets/Picture2.png"
                    alt="Wey"
                    className="w-full h-full object-cover drop-shadow"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (!target.src.endsWith('/assets/hamster.jpg')) {
                        target.src = '/assets/hamster.jpg';
                      }
                    }}
                  />
                </div>
                <div>
                  <h2 className="text-base sm:text-lg font-[800] text-w-bg-card flex items-center gap-2">
                    <span>Cẩm Nang Hướng Dẫn - Trợ Lý Wey</span>
                    <span className="text-[10px] bg-amber-100 text-w-text-main px-2 py-0.5 rounded-full font-black">
                      V1.0
                    </span>
                  </h2>
                  <p className="text-xs text-w-accent-muted font-medium mt-0.5">
                    Tìm kiếm thông minh mọi bí quyết, luật 16 trò chơi và kỹ năng quản trò cùng Wey
                  </p>
                </div>
              </div>

              <button
                onClick={() => setIsOpen(false)}
                className="p-2 hover:bg-white/20 rounded-full text-w-bg-card transition cursor-pointer"
                title="Đóng cẩm nang"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Smart Search Bar with Web-like suggestions */}
            <div className="px-5 py-3.5 bg-w-bg-main/90 border-b border-w-border space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto py-1 max-w-full">
                  {GUIDE_CATEGORIES.map(cat => {
                    const isActive = activeCategory === cat.id && searchQuery.trim() === '';
                    return (
                      <button
                        key={cat.id}
                        onClick={() => {
                          soundFx.buttonClick();
                          setActiveCategory(cat.id);
                          setSearchQuery('');
                          const first = GUIDE_ITEMS.find(g => g.category === cat.id);
                          if (first) setSelectedGuideId(first.id);
                        }}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                          isActive
                            ? 'bg-w-primary-dark text-white shadow-md'
                            : 'bg-white/80 text-w-primary-hover hover:bg-w-accent-light border border-w-border'
                        }`}
                      >
                        <span>{cat.icon}</span>
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-80">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm: cách tạo câu hỏi, luật chơi..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-white border border-w-border rounded-xl pl-9 pr-8 py-2 text-xs text-w-text-main font-semibold placeholder:text-slate-400 focus:outline-none focus:border-w-primary-dark focus:ring-2 focus:ring-w-primary-dark/30 shadow-inner"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs w-5 h-5 flex items-center justify-center bg-slate-100 rounded-full cursor-pointer"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Popular Search Suggestion Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] text-w-text-muted font-semibold pt-0.5">
                <span className="shrink-0 text-[10px] text-amber-900 bg-amber-200/70 px-1.5 py-0.5 rounded font-bold">
                  Gợi ý:
                </span>
                {POPULAR_SEARCH_CHIPS.map((chip, cIdx) => (
                  <button
                    key={cIdx}
                    onClick={() => {
                      soundFx.buttonClick();
                      setSearchQuery(chip);
                    }}
                    className={`px-2.5 py-0.5 rounded-full border text-[10px] whitespace-nowrap transition cursor-pointer ${
                      searchQuery === chip
                        ? 'bg-w-primary-dark text-white border-w-primary-hover shadow-xs'
                        : 'bg-white/70 hover:bg-w-accent-light text-w-primary-hover border-w-border'
                    }`}
                  >
                    {chip}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Body: Left Master List + Right Detail Reader */}
            <div className="flex-1 grid grid-cols-1 md:grid-cols-12 min-h-[380px] max-h-[calc(92vh-220px)] overflow-hidden">
              {/* Left Column: Topics List */}
              <div className="md:col-span-5 border-r border-w-border p-3 space-y-2 overflow-y-auto bg-w-bg-card">
                {searchResults.length === 0 ? (
                  <div className="text-center py-10 px-4 text-slate-400 text-xs space-y-2">
                    <div className="text-3xl">🔍</div>
                    <div className="font-bold text-slate-600">
                      Không tìm thấy bài viết phù hợp với "{searchQuery}"
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Hãy thử tìm các từ khóa như: <span className="text-w-primary-dark font-semibold">câu hỏi, ô ăn quan, máy chiếu, AI, f11</span>
                    </p>
                  </div>
                ) : (
                  searchResults.map(guide => {
                    const isSelected = guide.id === currentGuide?.id;
                    return (
                      <div
                        key={guide.id}
                        onClick={() => {
                          soundFx.buttonClick();
                          setSelectedGuideId(guide.id);
                        }}
                        className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-start gap-3 ${
                          isSelected
                            ? 'bg-w-accent-light border-w-accent-border shadow-sm ring-1 ring-w-primary-dark/30'
                            : 'bg-white/80 hover:bg-w-bg-main border-w-border'
                        }`}
                      >
                        <span className="text-xl shrink-0 mt-0.5">{guide.icon}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <h4 className={`text-xs font-[800] truncate ${isSelected ? 'text-w-text-main' : 'text-slate-700'}`}>
                              {guide.title}
                            </h4>
                            {guide.badge && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded-full bg-white border border-w-border text-w-primary-dark shrink-0">
                                {guide.badge}
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-w-text-muted line-clamp-2 mt-0.5 leading-relaxed font-medium">
                            {guide.summary}
                          </p>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Right Column: Active Guide Details */}
              <div className="md:col-span-7 p-4 sm:p-6 overflow-y-auto bg-w-bg-card flex flex-col justify-between space-y-4">
                {currentGuide && (
                  <div className="space-y-4">
                    {/* Title & Icon Header */}
                    <div className="flex items-start gap-3 pb-3 border-b border-w-border">
                      <div className="w-12 h-12 rounded-2xl bg-w-accent-light border border-w-accent-border flex items-center justify-center text-2xl shadow-xs shrink-0">
                        {currentGuide.icon}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-w-primary-dark bg-w-accent-light px-2 py-0.5 rounded-full border border-w-accent-border">
                            {currentGuide.badge || 'Hướng dẫn'}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-lg font-[800] text-w-text-main mt-1 leading-snug">
                          {currentGuide.title}
                        </h3>
                        <p className="text-xs text-w-text-muted font-medium mt-0.5">
                          {currentGuide.summary}
                        </p>
                      </div>
                    </div>

                    {/* Step-by-Step Details List */}
                    <div className="space-y-2.5">
                      {currentGuide.details.map((step, sIdx) => (
                        <div
                          key={sIdx}
                          className="flex items-start gap-3 p-3 bg-white border border-w-border rounded-xl shadow-2xs text-xs font-semibold text-w-text-main leading-relaxed"
                        >
                          <div className="w-5 h-5 rounded-full bg-w-primary-dark text-white flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5 shadow-xs">
                            {sIdx + 1}
                          </div>
                          <div className="flex-1">{step}</div>
                        </div>
                      ))}
                    </div>

                    {/* Pro Tip Callout */}
                    <div className="p-3 bg-w-bg-alt border border-w-border rounded-xl flex items-start gap-2.5 text-xs text-amber-700">
                      <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                      <div className="leading-relaxed">
                        <span className="font-bold">Mẹo từ Wey:</span> Hãy nhấn phím <span className="font-bold text-amber-900 bg-amber-200 px-1 rounded">F11</span> trên bàn phím để bật Toàn Màn Hình, giúp học sinh toàn lớp theo dõi trọn vẹn trận đấu!
                      </div>
                    </div>
                  </div>
                )}

                {/* Footer Action Buttons */}
                <div className="pt-3 border-t border-w-border flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {onOpenBankView && (
                      <button
                        onClick={() => {
                          setIsOpen(false);
                          onOpenBankView();
                        }}
                        className="px-3 py-1.5 bg-w-accent-light hover:bg-w-accent-muted text-w-primary-hover font-bold text-xs rounded-xl border border-w-accent-border shadow-xs flex items-center gap-1.5 transition cursor-pointer"
                      >
                        <BookOpen className="w-3.5 h-3.5 text-w-primary-dark" />
                        <span>Xem Ngân Hàng</span>
                      </button>
                    )}
                  </div>

                  <button
                    onClick={() => setIsOpen(false)}
                    className="px-4 py-1.5 bg-w-primary-dark hover:bg-w-primary-hover text-white font-bold text-xs rounded-xl shadow-md transition cursor-pointer"
                  >
                    Đã Hiểu & Bắt Đầu
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
