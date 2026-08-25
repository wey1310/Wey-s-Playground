import React from 'react';
import {
  X,
  Trophy,
  CheckCircle2,
  Play,
  Gamepad2,
  Sparkles,
} from 'lucide-react';
import type { GameId, GameType } from "../types";

export interface GameGuideDetail {
  id: GameId | GameType | string;
  title: string;
  subtitle: string;
  icon: string;
  badge: string;
  objective: string;
  steps: string[];
  scoring: string[];
}

export const GAME_GUIDES_DATA: Record<string, GameGuideDetail> = {
  // 1. Hộp Quà May Mắn
  openbox: {
    id: 'openbox',
    title: 'Hộp Quà May Mắn',
    subtitle: 'Mở hộp quà bí mật và trả lời câu hỏi',
    icon: '🎁',
    badge: 'Trắc nghiệm & Mở hộp',
    objective: 'Mở toàn bộ các hộp quà và ghi nhiều điểm nhất cho đội mình.',
    steps: [
      'Chế độ Ngân Hàng Câu Hỏi: Đến lượt, đội nhấp chọn 1 hộp quà bí mật bất kỳ trên màn hình. Trả lời đúng để bung mở hộp và nhận điểm.',
      'Chế độ Số Ảo (1 - 1000): Hệ thống mở hộp tương ứng với số thứ tự câu hỏi trong sách. Giáo viên chấm ĐÚNG / SAI trực tiếp.',
      'Trả lời ĐÚNG: Hộp quà bung mở pháo hoa rực rỡ, đội nhận ngay +10 điểm.',
      'Trả lời SAI: Hộp mở ra dấu X, không nhận điểm và chuyển lượt cho đội kế tiếp.',
    ],
    scoring: [
      'Mỗi câu đúng: +10 điểm',
      'Đội nhiều điểm nhất sau khi mở hết hộp sẽ chiến thắng',
    ],
  },
  open_box: {
    id: 'open_box',
    title: 'Hộp Quà May Mắn',
    subtitle: 'Mở hộp quà bí mật và trả lời câu hỏi',
    icon: '🎁',
    badge: 'Trắc nghiệm & Mở hộp',
    objective: 'Mở toàn bộ các hộp quà và ghi nhiều điểm nhất cho đội mình.',
    steps: [
      'Chế độ Ngân Hàng Câu Hỏi: Đến lượt, đội nhấp chọn 1 hộp quà bí mật bất kỳ trên màn hình. Trả lời đúng để bung mở hộp và nhận điểm.',
      'Chế độ Số Ảo (1 - 1000): Hệ thống mở hộp tương ứng với số thứ tự câu hỏi trong sách. Giáo viên chấm ĐÚNG / SAI trực tiếp.',
      'Trả lời ĐÚNG: Hộp quà bung mở pháo hoa rực rỡ, đội nhận ngay +10 điểm.',
      'Trả lời SAI: Hộp mở ra dấu X, không nhận điểm và chuyển lượt cho đội kế tiếp.',
    ],
    scoring: [
      'Mỗi câu đúng: +10 điểm',
      'Đội nhiều điểm nhất sau khi mở hết hộp sẽ chiến thắng',
    ],
  },

  // 2. Ô Ăn Quan
  mancala: {
    id: 'mancala',
    title: 'Ô Ăn Quan',
    subtitle: 'Dân gian kết hợp hỏi đáp rải quân chiến thuật',
    icon: '🏺',
    badge: 'Chiến thuật dân gian',
    objective: 'Bốc quân rải vòng quanh bàn cờ để "ăn" nhiều quân Quan và Dân nhất.',
    steps: [
      'Chế độ 2 Đội (Bàn cờ Chữ Nhật): Gồm 10 ô Dân (5 hạt/ô) và 2 ô Quan (1 viên Quan + 5 hạt).',
      'Chế độ 3 Đội (Bàn cờ Tam Giác): Gồm 15 ô Dân và 3 ô Quan chia đều 3 cánh.',
      'Đến lượt, đội chọn một ô Dân của phe mình và trả lời ĐÚNG câu hỏi để được bốc quân.',
      'Quân tự động rải lần lượt từng hạt vào các ô kế tiếp theo chiều đã chọn.',
      'Nếu hạt cuối cùng dừng trước 1 ô trống và ô tiếp theo có quân ➔ Ăn toàn bộ quân ở ô đó!',
      'Hết quân hoặc ăn hết các ô Quan ➔ Kết thúc ván đấu tính điểm.',
    ],
    scoring: [
      'Mỗi hạt Dân ăn được: +1 điểm',
      'Mỗi viên Quan ăn được: +10 điểm',
      'Đội có tổng số quân quy đổi cao nhất sẽ chiến thắng!',
    ],
  },
  oanquan: {
    id: 'oanquan',
    title: 'Ô Ăn Quan',
    subtitle: 'Dân gian kết hợp hỏi đáp rải quân chiến thuật',
    icon: '🏺',
    badge: 'Chiến thuật dân gian',
    objective: 'Bốc quân rải vòng quanh bàn cờ để "ăn" nhiều quân Quan và Dân nhất.',
    steps: [
      'Chế độ 2 Đội (Bàn cờ Chữ Nhật): Gồm 10 ô Dân (5 hạt/ô) và 2 ô Quan (1 viên Quan + 5 hạt).',
      'Chế độ 3 Đội (Bàn cờ Tam Giác): Gồm 15 ô Dân và 3 ô Quan chia đều 3 cánh.',
      'Đến lượt, đội chọn một ô Dân của phe mình và trả lời ĐÚNG câu hỏi để được bốc quân.',
      'Quân tự động rải lần lượt từng hạt vào các ô kế tiếp theo chiều đã chọn.',
      'Nếu hạt cuối cùng dừng trước 1 ô trống và ô tiếp theo có quân ➔ Ăn toàn bộ quân ở ô đó!',
      'Hết quân hoặc ăn hết các ô Quan ➔ Kết thúc ván đấu tính điểm.',
    ],
    scoring: [
      'Mỗi hạt Dân ăn được: +1 điểm',
      'Mỗi viên Quan ăn được: +10 điểm',
      'Đội có tổng số quân quy đổi cao nhất sẽ chiến thắng!',
    ],
  },

  // 3. Vòng Quay Kỳ Diệu
  wheel: {
    id: 'wheel',
    title: 'Vòng Quay Kỳ Diệu',
    subtitle: 'Quay chọn số câu hỏi và chinh phục thử thách',
    icon: '🎡',
    badge: 'May mắn & Tốc độ',
    objective: 'Quay bánh xe để chọn câu hỏi ngẫu nhiên và trả lời đúng để tích lũy điểm.',
    steps: [
      'Chế độ Vòng Quay Câu Hỏi: Bấm "Quay Vòng", bánh xe xoay tròn dừng ở ô câu hỏi nào thì đội trả lời câu hỏi đó.',
      'Chế độ Vòng Quay Điểm Thưởng: Dừng ở ô điểm nào (10đ, 20đ, 50đ, Mất Lượt, Nhân Đôi), trả lời đúng để nhận trọn số điểm đó.',
      'Trả lời ĐÚNG: Nhận điểm thưởng và ô số đó được đánh dấu hoàn thành.',
      'Trả lời SAI: Không nhận điểm, chuyển lượt quay sang đội tiếp theo.',
    ],
    scoring: [
      'Mỗi câu trả lời đúng: +10 điểm (hoặc theo ô điểm quay được)',
      'Đội nhiều điểm nhất sau khi quay hết các ô sẽ chiến thắng',
    ],
  },

  // 4. Cờ Cá Ngựa Tri Thức
  ludo: {
    id: 'ludo',
    title: 'Cờ Cá Ngựa Tri Thức',
    subtitle: 'Đổ xí ngầu, xuất chuồng, cản đường, đá ngựa và leo bậc chuồng',
    icon: '🐎',
    badge: 'Board Game Cờ Cá Ngựa',
    objective: 'Ra quân, di chuyển khôn ngoan, đá ngựa đối thủ và đưa đủ các chú ngựa leo lên đỉnh chuồng (bậc 6).',
    steps: [
      'Đến lượt, đội trả lời câu hỏi: Trả lời ĐÚNG sẽ được quyền đổ xí ngầu; trả lời SAI bị mất lượt.',
      'Luật Xuất chuồng: Đổ được mặt 6 hoặc 1 (1 xí ngầu) / Đôi hoặc Nhất-Lục (2 xí ngầu) để xuất ngựa ra bàn cờ.',
      'Luật Di chuyển & Cản đường: Ngựa đi theo chiều kim đồng hồ đúng số bước. Không thể nhảy qua ngựa khác trên đường đi nếu bị cản.',
      'Luật Đá ngựa: Khi đi đúng số bước tới ô đang có ngựa đối thủ ➔ ĐÁ VĂNG ngựa đối thủ về chuồng và nhận +30 điểm thưởng!',
      'Luật Vào chuồng & Lên bậc: Khi đi giáp 1 vòng về cửa chuồng, ngựa bắt đầu vào chuồng và leo từng bậc từ 1 đến 6 theo số bước đổ được.',
    ],
    scoring: [
      'Đá ngựa đối phương về chuồng: +30 điểm thưởng',
      'Tiến bậc chuồng: +10 điểm × bậc (Bậc 1 = +10đ, Bậc 6 = +60đ)',
      'Đội có nhiều ngựa vào bậc chuồng cao nhất hoặc điểm cao nhất sẽ chiến thắng!',
    ],
  },
  cangua: {
    id: 'cangua',
    title: 'Cờ Cá Ngựa Tri Thức',
    subtitle: 'Đổ xí ngầu, xuất chuồng, cản đường, đá ngựa và leo bậc chuồng',
    icon: '🐎',
    badge: 'Board Game Cờ Cá Ngựa',
    objective: 'Ra quân, di chuyển khôn ngoan, đá ngựa đối thủ và đưa đủ các chú ngựa leo lên đỉnh chuồng (bậc 6).',
    steps: [
      'Đến lượt, đội trả lời câu hỏi: Trả lời ĐÚNG sẽ được quyền đổ xí ngầu; trả lời SAI bị mất lượt.',
      'Luật Xuất chuồng: Đổ được mặt 6 hoặc 1 (1 xí ngầu) / Đôi hoặc Nhất-Lục (2 xí ngầu) để xuất ngựa ra bàn cờ.',
      'Luật Di chuyển & Cản đường: Ngựa đi theo chiều kim đồng hồ đúng số bước. Không thể nhảy qua ngựa khác trên đường đi nếu bị cản.',
      'Luật Đá ngựa: Khi đi đúng số bước tới ô đang có ngựa đối thủ ➔ ĐÁ VĂNG ngựa đối thủ về chuồng và nhận +30 điểm thưởng!',
      'Luật Vào chuồng & Lên bậc: Khi đi giáp 1 vòng về cửa chuồng, ngựa bắt đầu vào chuồng và leo từng bậc từ 1 đến 6 theo số bước đổ được.',
    ],
    scoring: [
      'Đá ngựa đối phương về chuồng: +30 điểm thưởng',
      'Tiến bậc chuồng: +10 điểm × bậc (Bậc 1 = +10đ, Bậc 6 = +60đ)',
      'Đội có nhiều ngựa vào bậc chuồng cao nhất hoặc điểm cao nhất sẽ chiến thắng!',
    ],
  },

  // 5. Cược Điểm Sinh Tử
  betting: {
    id: 'betting',
    title: 'Cược Điểm Sinh Tử',
    subtitle: 'Cược số điểm tin tưởng trước mỗi câu hỏi',
    icon: '💰',
    badge: 'Mạo hiểm & Quyết đoán',
    objective: 'Quản lý vốn điểm và đặt cược thông minh để dẫn đầu bảng xếp hạng.',
    steps: [
      'Xem trước chủ đề và độ khó của câu hỏi.',
      'Đội thảo luận và quyết định cược số điểm (từ 10 điểm đến toàn bộ điểm hiện có - All-in).',
      'Câu hỏi chính thức hiển thị trên màn hình: trả lời trong thời gian quy định.',
      'Trả lời ĐÚNG: Nhận thêm đúng 100% số điểm đã cược.',
      'Trả lời SAI: Bị TRỪ đúng số điểm đã đặt cược!',
    ],
    scoring: [
      'Đúng: Điểm hiện tại + Điểm đã cược',
      'Sai: Điểm hiện tại - Điểm đã cược',
    ],
  },

  // 6. Bingo Tri Thức
  bingo: {
    id: 'bingo',
    title: 'Bingo Tri Thức',
    subtitle: 'Nối các ô số thành hàng thẳng chiến thắng',
    icon: '🎯',
    badge: 'Lưới Bingo chiến lược',
    objective: 'Nối liền các ô số thành 1 hàng ngang, dọc hoặc chéo hoàn chỉnh.',
    steps: [
      'Chọn 1 ô số trên bảng lưới và trả lời câu hỏi tương ứng.',
      'Trả lời ĐÚNG: Ô số chuyển thành màu cờ của đội bạn.',
      'Trả lời SAI: Ô số vẫn mở để đội khác chọn ở lượt sau.',
      'Đội đầu tiên nối đủ 4 hoặc 5 ô liên tiếp theo hàng ngang, dọc hoặc chéo sẽ hô BINGO!',
    ],
    scoring: [
      'Mỗi ô chiếm đóng: +10 điểm',
      'Hoàn thành đường BINGO: +100 điểm thưởng chiến thắng',
    ],
  },

  // 7. Chiếm Lãnh Thổ
  territory: {
    id: 'territory',
    title: 'Chiếm Lãnh Thổ',
    subtitle: 'Cắm cờ mở rộng bờ cõi bản đồ',
    icon: '🗺️',
    badge: 'Chiến thuật bản đồ',
    objective: 'Chiếm đóng nhiều ô đất nhất trên ma trận bản đồ 36 ô.',
    steps: [
      'Chọn ô đất kề cận lãnh thổ của mình và trả lời câu hỏi.',
      'Trả lời ĐÚNG: Cắm cờ mở rộng bờ cõi (+10 điểm).',
      'Ô Tài Nguyên Vàng: Chiếm ô có biểu tượng kho báu để nhận điểm nhân 3 (+30đ).',
      'Quyền Thách Đấu (2 lần/game): Tấn công trực tiếp ô đất đối thủ. Trả lời đúng để cướp trắng ô đất!',
      'Sau khi hết lượt, đội sở hữu diện tích lãnh thổ lớn nhất sẽ chiến thắng.',
    ],
    scoring: [
      'Mỗi ô đất chiếm được: +10 điểm',
      'Ô Tài nguyên đặc biệt: +30 điểm',
      'Thách đấu chiếm đất đối thủ thành công: +25 điểm',
    ],
  },

  // 8. Kéo Co Trí Tuệ
  tug_of_war: {
    id: 'tug_of_war',
    title: 'Kéo Co Trí Tuệ',
    subtitle: 'Đối kháng 2 đội giành quyền bấm chuông',
    icon: '🪢',
    badge: 'Tốc độ đối kháng',
    objective: 'Kéo mốc cờ trung tâm vượt qua vạch mức về phía sân đội mình.',
    steps: [
      'Hai đội cùng đọc câu hỏi và bấm chuông giành quyền trả lời nhanh.',
      'Trả lời ĐÚNG: Kéo dây +1 nấc về phía sân đội mình.',
      'Trả lời SAI: Dây bị kéo ngược về phía đối thủ!',
      'Kéo mốc cờ chạm vạch chiến thắng trước ➔ Thắng Knock-out tuyệt đối!',
    ],
    scoring: [
      'Mỗi câu đúng nhanh nhất: Kéo dây +1 nấc',
      'Kéo cờ qua vạch đích: +100 điểm vinh quang',
    ],
  },
  tugofwar: {
    id: 'tugofwar',
    title: 'Kéo Co Trí Tuệ',
    subtitle: 'Đối kháng 2 đội giành quyền bấm chuông',
    icon: '🪢',
    badge: 'Tốc độ đối kháng',
    objective: 'Kéo mốc cờ trung tâm vượt qua vạch mức về phía sân đội mình.',
    steps: [
      'Hai đội cùng đọc câu hỏi và bấm chuông giành quyền trả lời nhanh.',
      'Trả lời ĐÚNG: Kéo dây +1 nấc về phía sân đội mình.',
      'Trả lời SAI: Dây bị kéo ngược về phía đối thủ!',
      'Kéo mốc cờ chạm vạch chiến thắng trước ➔ Thắng Knock-out tuyệt đối!',
    ],
    scoring: [
      'Mỗi câu đúng nhanh nhất: Kéo dây +1 nấc',
      'Kéo cờ qua vạch đích: +100 điểm vinh quang',
    ],
  },

  // 9. Xây Tháp Tri Thức
  tower: {
    id: 'tower',
    title: 'Xây Tháp Tri Thức',
    subtitle: 'Chồng từng tầng tháp bằng câu trả lời chuẩn xác',
    icon: '🏗️',
    badge: 'Kiên trì & Tích lũy',
    objective: 'Xây dựng tháp cao tầng nhất mà không bị sụp đổ.',
    steps: [
      'Mỗi câu trả lời ĐÚNG sẽ đặt thêm 1 tầng kiên cố lên đỉnh tháp.',
      'Đúng liên tiếp kích hoạt "Khối Vàng" nhân đôi điểm tầng.',
      'Trả lời SAI: Tầng bị lệch. Sai 3 lần liên tiếp có nguy cơ sập tầng tháp!',
    ],
    scoring: [
      'Mỗi tầng tháp đúng: +10 điểm',
      'Tầng tháp vàng (Combo chuỗi): +25 điểm',
    ],
  },

  // 10. Mảnh Ghép Bí Ẩn
  puzzle: {
    id: 'puzzle',
    title: 'Mảnh Ghép Bí Ẩn',
    subtitle: 'Lật mở từng ô tranh để đoán bức tranh toàn cảnh',
    icon: '🧩',
    badge: 'Khám phá & Suy luận',
    objective: 'Lật các mảnh ghép và đoán đúng từ khóa / hình ảnh bức tranh toàn cảnh.',
    steps: [
      'Chọn mảnh ghép số và trả lời ĐÚNG để lật mở góc tranh tương ứng.',
      'Bất kỳ lúc nào, đội có thể bấm "Đoán Bức Tranh" để đưa ra đáp án từ khóa lớn.',
      'Đoán ĐÚNG tranh lớn: Mở toàn bộ tranh và nhận thưởng điểm tối đa!',
    ],
    scoring: [
      'Mở đúng 1 mảnh ghép: +10 điểm',
      'Đoán đúng Bức tranh toàn cảnh: +50 đến +100 điểm thưởng',
    ],
  },

  // 11. Đua Xe Siêu Tốc
  race: {
    id: 'race',
    title: 'Đua Xe Siêu Tốc',
    subtitle: 'Giải bài cực nhanh để xe bay về đích',
    icon: '🏎️',
    badge: 'Tốc độ & Phản xạ',
    objective: 'Lái siêu xe của đội mình vượt qua chặng đua và cán đích đầu tiên.',
    steps: [
      'Mỗi đội điều khiển 1 siêu xe trên làn đua riêng.',
      'Trả lời ĐÚNG câu hỏi giúp xe tăng tốc (+100m).',
      'Trả lời siêu tốc dưới 5 giây: Kích hoạt Nitro bay vọt (+250m).',
      'Xe đầu tiên chạm vạch ca-rô về đích sẽ nhận cúp vô địch!',
    ],
    scoring: [
      'Mỗi câu đúng: Tiến +100m',
      'Kích hoạt Nitro: Tiến +250m',
      'Cán đích đầu tiên: +50 điểm Quán quân',
    ],
  },

  // 12. Bắt Pokemon
  pokemon: {
    id: 'pokemon',
    title: 'Bắt Pokemon',
    subtitle: 'Chinh phục câu hỏi để thu phục Pokemon huyền thoại',
    icon: '⚡',
    badge: 'Sưu tầm & Phiêu lưu',
    objective: 'Ném bóng thu phục thật nhiều Pokemon quý hiếm vào Pokédex của đội.',
    steps: [
      'Mỗi câu hỏi sẽ xuất hiện 1 chú Pokemon hoang dã.',
      'Trả lời ĐÚNG: Ném Pokéball thành công và thu phục Pokemon về đội.',
      'Trả lời SAI: Pokemon sẽ chạy thoát vào rừng cỏ!',
      'Giữ chuỗi trả lời đúng để gặp gỡ các Pokemon Huyền Thoại (CP cực cao).',
    ],
    scoring: [
      'Pokemon Thường: +10 CP',
      'Pokemon Hiếm: +30 CP',
      'Pokemon Huyền Thoại: +50 CP',
    ],
  },

  // 13. Bắn Tàu Chiến Hạm
  battleship: {
    id: 'battleship',
    title: 'Bắn Tàu Chiến Hạm',
    subtitle: 'Định vị tọa độ bắn chìm hạm đội đối phương',
    icon: '🚢',
    badge: 'Hải chiến & Tọa độ',
    objective: 'Dò tìm tọa độ và bắn chìm toàn bộ hạm đội tàu của đối phương trên biển.',
    steps: [
      'Chọn một tọa độ nghi vấn (ví dụ: C4, F7) và trả lời câu hỏi.',
      'Trả lời ĐÚNG: Khai hỏa pháo kích vào tọa độ đó.',
      'Trúng tàu (HIT): Tàu bốc cháy và đội được thưởng thêm lượt bắn tiếp theo.',
      'Trượt (MISS): Đạn rơi xuống biển, chuyển lượt sang đội bạn.',
      'Bắn trúng toàn bộ các khoang của tàu để bắn chìm (SUNK) con tàu đó!',
    ],
    scoring: [
      'Bắn trúng khoang tàu (HIT): +15 điểm',
      'Bắn chìm 1 chiến hạm (SUNK): +50 điểm',
      'Bắn chìm toàn bộ hạm đội trước: Chiến thắng!',
    ],
  },

  // 14. Đuổi Hình Bắt Chữ
  pictogram: {
    id: 'pictogram',
    title: 'Đuổi Hình Bắt Chữ',
    subtitle: 'Nhìn các hình ảnh gợi ý để đoán cụm từ',
    icon: '🖼️',
    badge: 'Hình ảnh & Ngôn ngữ',
    objective: 'Ghép nối các hình ảnh gợi ý để tìm ra cụm từ, thành ngữ bí ẩn.',
    steps: [
      'Hình ảnh gợi ý đầu tiên được mở sẵn. Đội có thể trả lời ngay hoặc mở thêm ảnh.',
      'Đội bấm chuông và đưa ra đáp án chính xác của cụm từ.',
      'Càng mở ít hình ảnh gợi ý mà đoán đúng, đội nhận càng nhiều điểm thưởng!',
    ],
    scoring: [
      'Đoán đúng ở Gợi ý 1: +100 điểm',
      'Đoán đúng ở Gợi ý 2: +75 điểm',
      'Đoán đúng ở Gợi ý 3: +50 điểm',
      'Đoán đúng ở Gợi ý 4+: +30 điểm',
    ],
  },

  // 15. Chiếc Nón Kỳ Diệu
  magic_wheel: {
    id: 'magic_wheel',
    title: 'Chiếc Nón Kỳ Diệu',
    subtitle: 'Bảng ô chữ bí mật, trả lời câu hỏi & đoán từng chữ cái',
    icon: '🔮',
    badge: 'Game Show Ô Chữ',
    objective: 'Lật mở các chữ cái trong ô chữ hoặc đoán chính xác toàn bộ từ khóa bí mật.',
    steps: [
      'Đến lượt, đội chọn trực tiếp 1 chữ cái trên bảng ký tự (hoặc trả lời câu hỏi).',
      'Nếu chữ cái CÓ trong từ khóa: Các ô chữ chứa ký tự đó sẽ tự động lật mở (+100đ mỗi chữ cái).',
      'Nếu chữ cái KHÔNG CÓ: Đội mất lượt và chuyển quyền chọn sang đội tiếp theo.',
      'Bất kỳ lúc nào, đội có thể bấm "Đoán toàn bộ từ khóa" để giành trọn số điểm còn lại!',
    ],
    scoring: [
      'Mỗi chữ cái mở đúng: +100 điểm × số lần xuất hiện',
      'Đoán đúng toàn bộ từ khóa: Nhận toàn bộ số điểm còn lại của các ô chưa mở',
    ],
  },
  magicwheel: {
    id: 'magicwheel',
    title: 'Chiếc Nón Kỳ Diệu',
    subtitle: 'Bảng ô chữ bí mật, trả lời câu hỏi & đoán từng chữ cái',
    icon: '🔮',
    badge: 'Game Show Ô Chữ',
    objective: 'Lật mở các chữ cái trong ô chữ hoặc đoán chính xác toàn bộ từ khóa bí mật.',
    steps: [
      'Đến lượt, đội chọn trực tiếp 1 chữ cái trên bảng ký tự (hoặc trả lời câu hỏi).',
      'Nếu chữ cái CÓ trong từ khóa: Các ô chữ chứa ký tự đó sẽ tự động lật mở (+100đ mỗi chữ cái).',
      'Nếu chữ cái KHÔNG CÓ: Đội mất lượt và chuyển quyền chọn sang đội tiếp theo.',
      'Bất kỳ lúc nào, đội có thể bấm "Đoán toàn bộ từ khóa" để giành trọn số điểm còn lại!',
    ],
    scoring: [
      'Mỗi chữ cái mở đúng: +100 điểm × số lần xuất hiện',
      'Đoán đúng toàn bộ từ khóa: Nhận toàn bộ số điểm còn lại của các ô chưa mở',
    ],
  },

  // 16. Thử Thách Vận Động (Pose Challenge)
  pose_challenge: {
    id: 'pose_challenge',
    title: 'Thử Thách Vận Động (Pose Challenge)',
    subtitle: 'Chọn đáp án bằng động tác hình thể sinh động',
    icon: '🤸',
    badge: 'Vận động & Trắc nghiệm',
    objective: 'Quan sát 4 đáp án (A, B, C, D) tương ứng với 4 hình ảnh động tác cơ thể, tạo dáng đúng động tác của đáp án bạn chọn.',
    steps: [
      'Màn hình hiển thị câu hỏi trắc nghiệm cùng 4 lựa chọn A, B, C, D.',
      'Mỗi lựa chọn được gắn kèm một hình ảnh động tác cơ thể đơn giản (giơ tay, dang tay, nghiêng người, kiễng chân...).',
      'Đội chơi chọn đáp án bằng cách thực hiện đúng tư thế động tác gắn với đáp án đó (hoặc bấm chọn trực tiếp).',
      'Giáo viên xác nhận: Trả lời đúng nhận điểm thưởng và chuyển sang câu hỏi tiếp theo.',
    ],
    scoring: [
      'Mỗi câu trả lời đúng kèm động tác: +100 điểm (hoặc theo cấu hình)',
      'Đội có tổng điểm cao nhất sau tất cả câu hỏi sẽ chiến thắng!',
    ],
  },
  posechallenge: {
    id: 'posechallenge',
    title: 'Thử Thách Vận Động (Pose Challenge)',
    subtitle: 'Chọn đáp án bằng động tác hình thể sinh động',
    icon: '🤸',
    badge: 'Vận động & Trắc nghiệm',
    objective: 'Quan sát 4 đáp án (A, B, C, D) tương ứng với 4 hình ảnh động tác cơ thể, tạo dáng đúng động tác của đáp án bạn chọn.',
    steps: [
      'Màn hình hiển thị câu hỏi trắc nghiệm cùng 4 lựa chọn A, B, C, D.',
      'Mỗi lựa chọn được gắn kèm một hình ảnh động tác cơ thể đơn giản (giơ tay, dang tay, nghiêng người, kiễng chân...).',
      'Đội chơi chọn đáp án bằng cách thực hiện đúng tư thế động tác gắn với đáp án đó (hoặc bấm chọn trực tiếp).',
      'Giáo viên xác nhận: Trả lời đúng nhận điểm thưởng và chuyển sang câu hỏi tiếp theo.',
    ],
    scoring: [
      'Mỗi câu trả lời đúng kèm động tác: +100 điểm (hoặc theo cấu hình)',
      'Đội có tổng điểm cao nhất sau tất cả câu hỏi sẽ chiến thắng!',
    ],
  },

  // 17. Cờ Caro (3x3)
  caro: {
    id: 'caro',
    title: 'Cờ Caro (3x3)',
    subtitle: 'Đấu trí Caro 2 đội kết hợp hỏi đáp',
    icon: '❌',
    badge: 'Chiến thuật 2 Đội',
    objective: 'Trả lời đúng câu hỏi để đặt ký hiệu X hoặc O, tạo thành hàng 3 liên tiếp để giành chiến thắng.',
    steps: [
      'Bắt buộc gồm 2 đội: Đội X và Đội O.',
      'Đến lượt, đội bấm nút "Random Câu Hỏi": thảo luận và trả lời câu hỏi.',
      'Trả lời ĐÚNG: Nhận điểm câu hỏi và được đánh 1 nước cờ (X hoặc O) vào ô trống trên bàn cờ 3x3.',
      'Trả lời SAI: Bị mất lượt đánh cờ, quyền lấy câu hỏi chuyển sang đội đối thủ.',
      'Đội đầu tiên xếp được 3 ô thẳng hàng (ngang, dọc, chéo) sẽ chiến thắng ván cờ!',
    ],
    scoring: [
      'Mỗi câu hỏi trả lời đúng: +10 điểm',
      'Thắng ván cờ Caro: Nhận điểm thưởng gấp 3 lần (x3) = +30 điểm!',
    ],
  },

  // 18. Cờ Vua Tri Thức
  chess: {
    id: 'chess',
    title: 'Cờ Vua Tri Thức',
    subtitle: 'Đấu cờ vua 2 đội với định hướng nước đi thông minh',
    icon: '♟️',
    badge: 'Đại Chiến 2 Đội',
    objective: 'Trả lời câu hỏi để giành lượt đi cờ, ăn quân và bắt Vua đối phương.',
    steps: [
      'Bắt buộc gồm 2 đội: Đội Trắng (White) và Đội Đen (Black).',
      'Đến lượt, đội bấm "Random Câu Hỏi" để trả lời câu hỏi.',
      'Trả lời ĐÚNG: Nhận điểm câu hỏi và được đi 1 nước cờ trên bàn cờ vua.',
      'Trả lời SAI: Bị mất lượt đi cờ, chuyển lượt sang đội đối phương.',
      'Định hướng vị trí đi: Nhấp vào quân của đội mình để xem toàn bộ các ô đi hợp lệ (chấm xanh) và ô ăn quân (viền đỏ).',
      'Bắt được Vua đối phương (hoặc phong cấp, chiếu hết) để giành chiến thắng chung cuộc!',
    ],
    scoring: [
      'Mỗi câu hỏi trả lời đúng: +10 điểm',
      'Thắng ván Cờ Vua (bắt Vua): Nhận điểm thưởng gấp 5 lần (x5) = +50 điểm!',
    ],
  },

  // 19. Cờ Thú Rừng Xanh
  co_thu: {
    id: 'co_thu',
    title: 'Cờ Thú Rừng Xanh (Animal Chess)',
    subtitle: 'Đấu cờ 7x9 với 8 cấp thú và quy luật bơi lội, nhảy sông, đặt bẫy',
    icon: '🦁',
    badge: 'Chiến thuật động vật',
    objective: 'Chiếm được Hang đối phương hoặc tiêu diệt toàn bộ thú của đối phương.',
    steps: [
      'Bàn cờ 7 hàng 9 cột, 2 đội Đỏ và Xanh. 8 cấp bậc sức mạnh: Chuột (1) < Mèo (2) < Chó (3) < Sói (4) < Báo (5) < Hổ (6) < Sư tử (7) < Voi (8).',
      'Quy tắc đặc biệt: Chuột (1) là loài duy nhất ăn được Voi (8)!',
      'Vượt Sông: Chuột có thể bơi xuống sông. Hổ và Sư tử có thể nhảy vọt ngang/dọc qua sông.',
      'Bẫy & Hang: Thú đối thủ vào ô Bẫy của bạn sẽ bị mất hết sức mạnh (bất kỳ thú nào của bạn cũng ăn được). Bước vào ô HANG đối thủ ➔ Thắng trận ngay!',
    ],
    scoring: [
      'Mỗi thú đối phương ăn được: +10đ đến +80đ tùy cấp thú',
      'Chiếm được Hang đối phương: +100 điểm vinh quang chiến thắng',
    ],
  },
  cothu: {
    id: 'cothu',
    title: 'Cờ Thú Rừng Xanh (Animal Chess)',
    subtitle: 'Đấu cờ 7x9 với 8 cấp thú và quy luật bơi lội, nhảy sông, đặt bẫy',
    icon: '🦁',
    badge: 'Chiến thuật động vật',
    objective: 'Chiếm được Hang đối phương hoặc tiêu diệt toàn bộ thú của đối phương.',
    steps: [
      'Bàn cờ 7 hàng 9 cột, 2 đội Đỏ và Xanh. 8 cấp bậc sức mạnh: Chuột (1) < Mèo (2) < Chó (3) < Sói (4) < Báo (5) < Hổ (6) < Sư tử (7) < Voi (8).',
      'Quy tắc đặc biệt: Chuột (1) là loài duy nhất ăn được Voi (8)!',
      'Vượt Sông: Chuột có thể bơi xuống sông. Hổ và Sư tử có thể nhảy vọt ngang/dọc qua sông.',
      'Bẫy & Hang: Thú đối thủ vào ô Bẫy của bạn sẽ bị mất hết sức mạnh (bất kỳ thú nào của bạn cũng ăn được). Bước vào ô HANG đối thủ ➔ Thắng trận ngay!',
    ],
    scoring: [
      'Mỗi thú đối phương ăn được: +10đ đến +80đ tùy cấp thú',
      'Chiếm được Hang đối phương: +100 điểm vinh quang chiến thắng',
    ],
  },

  // 20. Hái Táo Ông Smith
  apple_picking: {
    id: 'apple_picking',
    title: 'Hái Táo Vườn Ông Smith',
    subtitle: 'Đua thu thập táo, tránh quy luật chia hết bí mật của Ông Smith',
    icon: '🍎',
    badge: 'Toán học & May mắn',
    objective: 'Di chuyển quanh vườn, hái đủ số táo mục tiêu (mặc định 6 táo) mà không bị Ông Smith bắt.',
    steps: [
      'Bàn cờ gồm 36 ô (hoặc theo cấu hình). Mỗi lượt, đội trả lời câu hỏi để gieo xí ngầu di chuyển.',
      'Ô Táo Thường: Hái được +1 🍎.',
      'Ô Táo Vàng: Hái được +3 🍎 siêu giá trị.',
      'Ô Lò Xo: Bật nhảy tiến hoặc lùi ngẫu nhiên.',
      'QUY LUẬT BÍ MẬT ÔNG SMITH: Ông Smith có 1 số bí mật K (2, 3, 4, 5 hoặc 6). Đội dừng chân ở ô chia hết cho K sẽ bị Ông Smith phát hiện, tịch thu táo hoặc đẩy về ô xuất phát!',
    ],
    scoring: [
      'Mỗi quả táo hái được: +10 điểm',
      'Đội đầu tiên gom đủ táo mục tiêu: +100 điểm chiến thắng',
    ],
  },
  apple_pick: {
    id: 'apple_pick',
    title: 'Hái Táo Vườn Ông Smith',
    subtitle: 'Đua thu thập táo, tránh quy luật chia hết bí mật của Ông Smith',
    icon: '🍎',
    badge: 'Toán học & May mắn',
    objective: 'Di chuyển quanh vườn, hái đủ số táo mục tiêu (mặc định 6 táo) mà không bị Ông Smith bắt.',
    steps: [
      'Bàn cờ gồm 36 ô (hoặc theo cấu hình). Mỗi lượt, đội trả lời câu hỏi để gieo xí ngầu di chuyển.',
      'Ô Táo Thường: Hái được +1 🍎.',
      'Ô Táo Vàng: Hái được +3 🍎 siêu giá trị.',
      'Ô Lò Xo: Bật nhảy tiến hoặc lùi ngẫu nhiên.',
      'QUY LUẬT BÍ MẬT ÔNG SMITH: Ông Smith có 1 số bí mật K (2, 3, 4, 5 hoặc 6). Đội dừng chân ở ô chia hết cho K sẽ bị Ông Smith phát hiện, tịch thu táo hoặc đẩy về ô xuất phát!',
    ],
    scoring: [
      'Mỗi quả táo hái được: +10 điểm',
      'Đội đầu tiên gom đủ táo mục tiêu: +100 điểm chiến thắng',
    ],
  },
  applepick: {
    id: 'applepick',
    title: 'Hái Táo Vườn Ông Smith',
    subtitle: 'Đua thu thập táo, tránh quy luật chia hết bí mật của Ông Smith',
    icon: '🍎',
    badge: 'Toán học & May mắn',
    objective: 'Di chuyển quanh vườn, hái đủ số táo mục tiêu (mặc định 6 táo) mà không bị Ông Smith bắt.',
    steps: [
      'Bàn cờ gồm 36 ô (hoặc theo cấu hình). Mỗi lượt, đội trả lời câu hỏi để gieo xí ngầu di chuyển.',
      'Ô Táo Thường: Hái được +1 🍎.',
      'Ô Táo Vàng: Hái được +3 🍎 siêu giá trị.',
      'Ô Lò Xo: Bật nhảy tiến hoặc lùi ngẫu nhiên.',
      'QUY LUẬT BÍ MẬT ÔNG SMITH: Ông Smith có 1 số bí mật K (2, 3, 4, 5 hoặc 6). Đội dừng chân ở ô chia hết cho K sẽ bị Ông Smith phát hiện, tịch thu táo hoặc đẩy về ô xuất phát!',
    ],
    scoring: [
      'Mỗi quả táo hái được: +10 điểm',
      'Đội đầu tiên gom đủ táo mục tiêu: +100 điểm chiến thắng',
    ],
  },
  applepicking: {
    id: 'applepicking',
    title: 'Hái Táo Vườn Ông Smith',
    subtitle: 'Đua thu thập táo, tránh quy luật chia hết bí mật của Ông Smith',
    icon: '🍎',
    badge: 'Toán học & May mắn',
    objective: 'Di chuyển quanh vườn, hái đủ số táo mục tiêu (mặc định 6 táo) mà không bị Ông Smith bắt.',
    steps: [
      'Bàn cờ gồm 36 ô (hoặc theo cấu hình). Mỗi lượt, đội trả lời câu hỏi để gieo xí ngầu di chuyển.',
      'Ô Táo Thường: Hái được +1 🍎.',
      'Ô Táo Vàng: Hái được +3 🍎 siêu giá trị.',
      'Ô Lò Xo: Bật nhảy tiến hoặc lùi ngẫu nhiên.',
      'QUY LUẬT BÍ MẬT ÔNG SMITH: Ông Smith có 1 số bí mật K (2, 3, 4, 5 hoặc 6). Đội dừng chân ở ô chia hết cho K sẽ bị Ông Smith phát hiện, tịch thu táo hoặc đẩy về ô xuất phát!',
    ],
    scoring: [
      'Mỗi quả táo hái được: +10 điểm',
      'Đội đầu tiên gom đủ táo mục tiêu: +100 điểm chiến thắng',
    ],
  },
  haitao: {
    id: 'haitao',
    title: 'Hái Táo Vườn Ông Smith',
    subtitle: 'Đua thu thập táo, tránh quy luật chia hết bí mật của Ông Smith',
    icon: '🍎',
    badge: 'Toán học & May mắn',
    objective: 'Di chuyển quanh vườn, hái đủ số táo mục tiêu (mặc định 6 táo) mà không bị Ông Smith bắt.',
    steps: [
      'Bàn cờ gồm 36 ô (hoặc theo cấu hình). Mỗi lượt, đội trả lời câu hỏi để gieo xí ngầu di chuyển.',
      'Ô Táo Thường: Hái được +1 🍎.',
      'Ô Táo Vàng: Hái được +3 🍎 siêu giá trị.',
      'Ô Lò Xo: Bật nhảy tiến hoặc lùi ngẫu nhiên.',
      'QUY LUẬT BÍ MẬT ÔNG SMITH: Ông Smith có 1 số bí mật K (2, 3, 4, 5 hoặc 6). Đội dừng chân ở ô chia hết cho K sẽ bị Ông Smith phát hiện, tịch thu táo hoặc đẩy về ô xuất phát!',
    ],
    scoring: [
      'Mỗi quả táo hái được: +10 điểm',
      'Đội đầu tiên gom đủ táo mục tiêu: +100 điểm chiến thắng',
    ],
  },

  // 21. Sơn Tinh Thủy Tinh
  son_tinh_thuy_tinh: {
    id: 'son_tinh_thuy_tinh',
    title: 'Sơn Tinh Thủy Tinh',
    subtitle: 'Đại chiến sính lễ Voi 9 ngà, Gà 9 cựa, Ngựa 9 hồng mao',
    icon: '⚔️',
    badge: 'Thần thoại đối kháng',
    objective: 'Thu thập đủ 3 món sính lễ thần kỳ và dâng lên Vua Hùng tại Cung Điện Phong Châu.',
    steps: [
      'Bàn cờ 24 ô chia làm vùng Núi Tản Viên, Đồng Bằng, Cung Điện Vua Hùng và Biển Đông.',
      'Trả lời ĐÚNG câu hỏi để tích lũy Điểm Hành Động (AP) và gieo xúc xắc di chuyển.',
      '3 Món Sính Lễ: Voi 9 Ngà, Gà 9 Cựa, Ngựa 9 Hồng Mao nằm tại các vị trí bí mật trên bản đồ.',
      'Phép Thần: Sơn Tinh có thể dựng Luỹ Đá cản đường; Thủy Tinh có thể Dâng Nước ngập lụt làm chậm đối thủ.',
      'Đội gom đủ 3 sính lễ và về đích Cung Điện đầu tiên sẽ rước Mị Nương và chiến thắng!',
    ],
    scoring: [
      'Mỗi món sính lễ thu thập: +50 điểm',
      'Dâng sính lễ thành công tại Cung Điện: +150 điểm vinh quang',
    ],
  },
  sontinhthuytinh: {
    id: 'sontinhthuytinh',
    title: 'Sơn Tinh Thủy Tinh',
    subtitle: 'Đại chiến sính lễ Voi 9 ngà, Gà 9 cựa, Ngựa 9 hồng mao',
    icon: '⚔️',
    badge: 'Thần thoại đối kháng',
    objective: 'Thu thập đủ 3 món sính lễ thần kỳ và dâng lên Vua Hùng tại Cung Điện Phong Châu.',
    steps: [
      'Bàn cờ 24 ô chia làm vùng Núi Tản Viên, Đồng Bằng, Cung Điện Vua Hùng và Biển Đông.',
      'Trả lời ĐÚNG câu hỏi để tích lũy Điểm Hành Động (AP) và gieo xúc xắc di chuyển.',
      '3 Món Sính Lễ: Voi 9 Ngà, Gà 9 Cựa, Ngựa 9 Hồng Mao nằm tại các vị trí bí mật trên bản đồ.',
      'Phép Thần: Sơn Tinh có thể dựng Luỹ Đá cản đường; Thủy Tinh có thể Dâng Nước ngập lụt làm chậm đối thủ.',
      'Đội gom đủ 3 sính lễ và về đích Cung Điện đầu tiên sẽ rước Mị Nương và chiến thắng!',
    ],
    scoring: [
      'Mỗi món sính lễ thu thập: +50 điểm',
      'Dâng sính lễ thành công tại Cung Điện: +150 điểm vinh quang',
    ],
  },
  son_tinh: {
    id: 'son_tinh',
    title: 'Sơn Tinh Thủy Tinh',
    subtitle: 'Đại chiến sính lễ Voi 9 ngà, Gà 9 cựa, Ngựa 9 hồng mao',
    icon: '⚔️',
    badge: 'Thần thoại đối kháng',
    objective: 'Thu thập đủ 3 món sính lễ thần kỳ và dâng lên Vua Hùng tại Cung Điện Phong Châu.',
    steps: [
      'Bàn cờ 24 ô chia làm vùng Núi Tản Viên, Đồng Bằng, Cung Điện Vua Hùng và Biển Đông.',
      'Trả lời ĐÚNG câu hỏi để tích lũy Điểm Hành Động (AP) và gieo xúc xắc di chuyển.',
      '3 Món Sính Lễ: Voi 9 Ngà, Gà 9 Cựa, Ngựa 9 Hồng Mao nằm tại các vị trí bí mật trên bản đồ.',
      'Phép Thần: Sơn Tinh có thể dựng Luỹ Đá cản đường; Thủy Tinh có thể Dâng Nước ngập lụt làm chậm đối thủ.',
      'Đội gom đủ 3 sính lễ và về đích Cung Điện đầu tiên sẽ rước Mị Nương và chiến thắng!',
    ],
    scoring: [
      'Mỗi món sính lễ thu thập: +50 điểm',
      'Dâng sính lễ thành công tại Cung Điện: +150 điểm vinh quang',
    ],
  },
  sontinh: {
    id: 'sontinh',
    title: 'Sơn Tinh Thủy Tinh',
    subtitle: 'Đại chiến sính lễ Voi 9 ngà, Gà 9 cựa, Ngựa 9 hồng mao',
    icon: '⚔️',
    badge: 'Thần thoại đối kháng',
    objective: 'Thu thập đủ 3 món sính lễ thần kỳ và dâng lên Vua Hùng tại Cung Điện Phong Châu.',
    steps: [
      'Bàn cờ 24 ô chia làm vùng Núi Tản Viên, Đồng Bằng, Cung Điện Vua Hùng và Biển Đông.',
      'Trả lời ĐÚNG câu hỏi để tích lũy Điểm Hành Động (AP) và gieo xúc xắc di chuyển.',
      '3 Món Sính Lễ: Voi 9 Ngà, Gà 9 Cựa, Ngựa 9 Hồng Mao nằm tại các vị trí bí mật trên bản đồ.',
      'Phép Thần: Sơn Tinh có thể dựng Luỹ Đá cản đường; Thủy Tinh có thể Dâng Nước ngập lụt làm chậm đối thủ.',
      'Đội gom đủ 3 sính lễ và về đích Cung Điện đầu tiên sẽ rước Mị Nương và chiến thắng!',
    ],
    scoring: [
      'Mỗi món sính lễ thu thập: +50 điểm',
      'Dâng sính lễ thành công tại Cung Điện: +150 điểm vinh quang',
    ],
  },

  // 22. Hộp Mù May Mắn (Blind Box)
  blindbox: {
    id: 'blindbox',
    title: 'Hộp Mù May Mắn (Blind Box)',
    subtitle: 'Mở 20 hộp mù bí ẩn theo 9 chủ đề hoạt hình & thế giới',
    icon: '📦',
    badge: 'Sưu tầm & May mắn',
    objective: 'Chọn và khui các hộp mù bí ẩn để tích lũy điểm thưởng cao nhất.',
    steps: [
      'Chọn 1 trong 9 chủ đề yêu thích (Conan, Anime, Disney, Động vật, Khủng long, Pokemon...).',
      'Đến lượt, đội chọn 1 hộp mù chưa mở trên kệ trưng bày.',
      'Trả lời câu hỏi xuất hiện. Trả lời ĐÚNG: Hộp mù tự động bung nắp hé lộ mô hình nhân vật kèm điểm thưởng (+10, +20, +30, +50 hoặc -10 điểm phạt).',
      'Trả lời SAI: Hộp vẫn đóng kín và mất lượt cho đội tiếp theo.',
    ],
    scoring: [
      'Điểm trong hộp mù: +10đ, +20đ, +30đ, +50đ hoặc -10đ',
      'Đội có tổng điểm cao nhất sau khi khui hết hộp sẽ chiến thắng',
    ],
  },
  blind_box: {
    id: 'blind_box',
    title: 'Hộp Mù May Mắn (Blind Box)',
    subtitle: 'Mở 20 hộp mù bí ẩn theo 9 chủ đề hoạt hình & thế giới',
    icon: '📦',
    badge: 'Sưu tầm & May mắn',
    objective: 'Chọn và khui các hộp mù bí ẩn để tích lũy điểm thưởng cao nhất.',
    steps: [
      'Chọn 1 trong 9 chủ đề yêu thích (Conan, Anime, Disney, Động vật, Khủng long, Pokemon...).',
      'Đến lượt, đội chọn 1 hộp mù chưa mở trên kệ trưng bày.',
      'Trả lời câu hỏi xuất hiện. Trả lời ĐÚNG: Hộp mù tự động bung nắp hé lộ mô hình nhân vật kèm điểm thưởng (+10, +20, +30, +50 hoặc -10 điểm phạt).',
      'Trả lời SAI: Hộp vẫn đóng kín và mất lượt cho đội tiếp theo.',
    ],
    scoring: [
      'Điểm trong hộp mù: +10đ, +20đ, +30đ, +50đ hoặc -10đ',
      'Đội có tổng điểm cao nhất sau khi khui hết hộp sẽ chiến thắng',
    ],
  },

  // 23. Truyền Gấu Nhịp Điệu
  bear_passing: {
    id: 'bear_passing',
    title: 'Truyền Gấu Nhịp Điệu',
    subtitle: 'Âm nhạc rộn ràng, dừng bất ngờ chọn học sinh phát biểu',
    icon: '🧸',
    badge: 'Hoạt náo & Khởi động',
    objective: 'Truyền chú gấu bông theo điệu nhạc sôi động và dừng ngẫu nhiên chọn học sinh.',
    steps: [
      'Thầy cô chọn bài hát và bấm "BẮT ĐẦU TRUYỀN GẤU".',
      'Nhạc vang lên, chú gấu bông được chuyền tay liên tục quanh các bạn học sinh.',
      'Thời gian dừng hoàn toàn NGẪU NHIÊN và BÍ MẬT (không hiển thị đồng hồ đếm ngược).',
      'Nhạc tắt đột ngột ➔ Chú gấu dừng ở học sinh nào thì bạn đó sẽ được vinh danh trên sân khấu để trả lời câu hỏi hoặc nhận quà!',
    ],
    scoring: [
      'Trò chơi tương tác khởi động không tính điểm đội',
      'Lưu danh sách học sinh đã được nhận gấu vào bảng vinh danh',
    ],
  },
  bear_pass: {
    id: 'bear_pass',
    title: 'Truyền Gấu Nhịp Điệu',
    subtitle: 'Âm nhạc rộn ràng, dừng bất ngờ chọn học sinh phát biểu',
    icon: '🧸',
    badge: 'Hoạt náo & Khởi động',
    objective: 'Truyền chú gấu bông theo điệu nhạc sôi động và dừng ngẫu nhiên chọn học sinh.',
    steps: [
      'Thầy cô chọn bài hát và bấm "BẮT ĐẦU TRUYỀN GẤU".',
      'Nhạc vang lên, chú gấu bông được chuyền tay liên tục quanh các bạn học sinh.',
      'Thời gian dừng hoàn toàn NGẪU NHIÊN và BÍ MẬT (không hiển thị đồng hồ đếm ngược).',
      'Nhạc tắt đột ngột ➔ Chú gấu dừng ở học sinh nào thì bạn đó sẽ được vinh danh trên sân khấu để trả lời câu hỏi hoặc nhận quà!',
    ],
    scoring: [
      'Trò chơi tương tác khởi động không tính điểm đội',
      'Lưu danh sách học sinh đã được nhận gấu vào bảng vinh danh',
    ],
  },

  // 24. Đập Trứng Khủng Long
  egg_call: {
    id: 'egg_call',
    title: 'Đập Trứng Khủng Long',
    subtitle: 'Chọn quả trứng bí mật, đập vỡ vỏ nở ra tên học sinh',
    icon: '🥚',
    badge: 'Gọi tên & Đố vui',
    objective: 'Chọn các quả trứng khủng long, đập vỏ tìm bạn học sinh trả lời câu hỏi.',
    steps: [
      'Danh sách học sinh được hệ thống tự động giấu ngẫu nhiên vào các quả trứng.',
      'Nhấp chọn 1 quả trứng khủng long bất kỳ trên màn hình.',
      'Quả trứng nứt vỏ và nở ra tên học sinh may mắn kèm câu hỏi thử thách.',
      'Học sinh trả lời câu hỏi: Trả lời ĐÚNG nở ra chú Khủng Long Vàng (+10đ); Trả lời SAI nở ra vỏ trứng vỡ.',
    ],
    scoring: [
      'Trả lời đúng câu hỏi: +10 điểm',
      'Có thể theo dõi bảng điểm cá nhân của từng học sinh sau buổi học',
    ],
  },
  eggcall: {
    id: 'eggcall',
    title: 'Đập Trứng Khủng Long',
    subtitle: 'Chọn quả trứng bí mật, đập vỡ vỏ nở ra tên học sinh',
    icon: '🥚',
    badge: 'Gọi tên & Đố vui',
    objective: 'Chọn các quả trứng khủng long, đập vỏ tìm bạn học sinh trả lời câu hỏi.',
    steps: [
      'Danh sách học sinh được hệ thống tự động giấu ngẫu nhiên vào các quả trứng.',
      'Nhấp chọn 1 quả trứng khủng long bất kỳ trên màn hình.',
      'Quả trứng nứt vỏ và nở ra tên học sinh may mắn kèm câu hỏi thử thách.',
      'Học sinh trả lời câu hỏi: Trả lời ĐÚNG nở ra chú Khủng Long Vàng (+10đ); Trả lời SAI nở ra vỏ trứng vỡ.',
    ],
    scoring: [
      'Trả lời đúng câu hỏi: +10 điểm',
      'Có thể theo dõi bảng điểm cá nhân của từng học sinh sau buổi học',
    ],
  },

  // 25. Gọi Tên Ngẫu Nhiên
  random_call: {
    id: 'random_call',
    title: 'Gọi Tên Ngẫu Nhiên',
    subtitle: 'Vòng quay gọi tên học sinh thông minh, lưu tự động',
    icon: '🎲',
    badge: 'Quản lý lớp học',
    objective: 'Bốc thăm công bằng và ngẫu nhiên học sinh phát biểu, kiểm tra bài cũ.',
    steps: [
      'Nhập hoặc dán danh sách học sinh (tự động lưu vào LocalStorage không lo mất).',
      'Bấm "🎲 BẮT ĐẦU GỌI TÊN": Bảng quay roulette xoay tròn và chọn ra 1 bạn học sinh ngẫu nhiên kèm pháo hoa.',
      'Tùy chọn bốc câu hỏi ngẫu nhiên từ ngân hàng câu hỏi cho bạn đó trả lời.',
      'Giáo viên chấm điểm nhanh: Đúng (+10đ), Cần hỗ trợ (+5đ), Chưa đúng (0đ).',
    ],
    scoring: [
      'Đánh giá Đúng: +10 điểm',
      'Cần hỗ trợ: +5 điểm',
      'Hỗ trợ chế độ không gọi lặp lại để mọi học sinh đều có cơ hội phát biểu',
    ],
  },
  randomcall: {
    id: 'randomcall',
    title: 'Gọi Tên Ngẫu Nhiên',
    subtitle: 'Vòng quay gọi tên học sinh thông minh, lưu tự động',
    icon: '🎲',
    badge: 'Quản lý lớp học',
    objective: 'Bốc thăm công bằng và ngẫu nhiên học sinh phát biểu, kiểm tra bài cũ.',
    steps: [
      'Nhập hoặc dán danh sách học sinh (tự động lưu vào LocalStorage không lo mất).',
      'Bấm "🎲 BẮT ĐẦU GỌI TÊN": Bảng quay roulette xoay tròn và chọn ra 1 bạn học sinh ngẫu nhiên kèm pháo hoa.',
      'Tùy chọn bốc câu hỏi ngẫu nhiên từ ngân hàng câu hỏi cho bạn đó trả lời.',
      'Giáo viên chấm điểm nhanh: Đúng (+10đ), Cần hỗ trợ (+5đ), Chưa đúng (0đ).',
    ],
    scoring: [
      'Đánh giá Đúng: +10 điểm',
      'Cần hỗ trợ: +5 điểm',
      'Hỗ trợ chế độ không gọi lặp lại để mọi học sinh đều có cơ hội phát biểu',
    ],
  },

  // 26. Đập Chuột Chũi
  whack_a_mole: {
    id: 'whack_a_mole',
    title: 'Đập Chuột Chũi',
    subtitle: 'Phản xạ nhanh đập trúng chuột mang đáp án đúng',
    icon: '🔨',
    badge: 'Khởi động & Vận động',
    objective: 'Quan sát các hang chuột nhô lên và nhanh tay đập đúng chú chuột mang đáp án chính xác.',
    steps: [
      'Đọc câu hỏi hiển thị trên bảng phía trên sân cỏ.',
      'Các chú chuột chũi trồi lên từ các hang mang theo các đáp án A, B, C, D.',
      'Nhấp chuột hoặc chạm tay vào chú chuột có đáp án ĐÚNG.',
      'Đập đúng: Hiệu ứng búa gõ sao bay, nhận trọn điểm thưởng câu hỏi (+10đ).',
      'Đập sai hoặc đập trúng Chuột Bẫy Bom 💣: Bị choáng váng và trừ điểm (-5đ)!',
    ],
    scoring: [
      'Đập đúng chuột: +10 điểm',
      'Đập sai / trúng bẫy: -5 điểm',
    ],
  },
  whackamole: {
    id: 'whackamole',
    title: 'Đập Chuột Chũi',
    subtitle: 'Phản xạ nhanh đập trúng chuột mang đáp án đúng',
    icon: '🔨',
    badge: 'Khởi động & Vận động',
    objective: 'Quan sát các hang chuột nhô lên và nhanh tay đập đúng chú chuột mang đáp án chính xác.',
    steps: [
      'Đọc câu hỏi hiển thị trên bảng phía trên sân cỏ.',
      'Các chú chuột chũi trồi lên từ các hang mang theo các đáp án A, B, C, D.',
      'Nhấp chuột hoặc chạm tay vào chú chuột có đáp án ĐÚNG.',
      'Đập đúng: Hiệu ứng búa gõ sao bay, nhận trọn điểm thưởng câu hỏi (+10đ).',
      'Đập sai hoặc đập trúng Chuột Bẫy Bom 💣: Bị choáng váng và trừ điểm (-5đ)!',
    ],
    scoring: [
      'Đập đúng chuột: +10 điểm',
      'Đập sai / trúng bẫy: -5 điểm',
    ],
  },

  // 27. Phân Loại
  classification: {
    id: 'classification',
    title: 'Phân Loại Thẻ Bài / Rác Thải',
    subtitle: 'Xếp các đối tượng vào nhóm chuẩn xác',
    icon: '📁',
    badge: 'Tìm hiểu kiến thức',
    objective: 'Phân loại toàn bộ các đối tượng xuất hiện ở trung tâm vào đúng nhóm tương ứng.',
    steps: [
      'Nhấp chọn một đối tượng (từ, cụm từ, hình ảnh) ở kho trung tâm.',
      'Nhấp chọn nhóm phân loại phù hợp ở hàng bên dưới (hoặc kéo thả trực tiếp).',
      'Nếu đúng: Đối tượng bay vào giỏ/nhóm thành công và cộng điểm.',
      'Nếu sai: Báo hiệu rung lắc và hoàn trả lại kho trung tâm.',
    ],
    scoring: [
      'Mỗi đối tượng phân loại đúng: +10 điểm',
      'Phân loại sai: -5 điểm',
    ],
  },

  // 28. Cướp Cờ Tri Thức
  flag_capture: {
    id: 'flag_capture',
    title: 'Cướp Cờ Tri Thức',
    subtitle: 'Trả lời đúng kích hoạt vận động viên bứt tốc cướp cờ',
    icon: '🚩',
    badge: 'Vận động & Đấu trí',
    objective: 'Trả lời câu hỏi nhanh và chính xác nhất để vận động viên chạy tới cướp cờ vàng về căn cứ.',
    steps: [
      'Lá cờ vàng danh dự đặt tại tâm sân khấu thể thao.',
      'Đến lượt, đội đọc câu hỏi và lựa chọn phương án chính xác.',
      'Trả lời ĐÚNG: Vận động viên đội bạn bứt tốc lao tới tâm sân khấu giật cờ và chạy về đích!',
      'Trả lời SAI: Đứng yên tại căn cứ và mất cơ hội cướp cờ ở vòng đấu đó.',
    ],
    scoring: [
      'Cướp cờ thành công: +15 điểm / cờ',
      'Trả lời sai: -5 điểm',
    ],
  },
  flagcapture: {
    id: 'flagcapture',
    title: 'Cướp Cờ Tri Thức',
    subtitle: 'Trả lời đúng kích hoạt vận động viên bứt tốc cướp cờ',
    icon: '🚩',
    badge: 'Vận động & Đấu trí',
    objective: 'Trả lời câu hỏi nhanh và chính xác nhất để vận động viên chạy tới cướp cờ vàng về căn cứ.',
    steps: [
      'Lá cờ vàng danh dự đặt tại tâm sân khấu thể thao.',
      'Đến lượt, đội đọc câu hỏi và lựa chọn phương án chính xác.',
      'Trả lời ĐÚNG: Vận động viên đội bạn bứt tốc lao tới tâm sân khấu giật cờ và chạy về đích!',
      'Trả lời SAI: Đứng yên tại căn cứ và mất cơ hội cướp cờ ở vòng đấu đó.',
    ],
    scoring: [
      'Cướp cờ thành công: +15 điểm / cờ',
      'Trả lời sai: -5 điểm',
    ],
  },

  // 29. Nhảy Bao Bố
  sack_race: {
    id: 'sack_race',
    title: 'Nhảy Bao Bố Về Đích',
    subtitle: 'Đua nhảy bao bố trên các làn thi đấu',
    icon: '🌾',
    badge: 'Vận động & Đồng đội',
    objective: 'Trả lời đúng liên tục để nhân vật trong bao bố nhảy tiến lên và về đích đầu tiên.',
    steps: [
      'Mỗi đội xuất phát tại một làn đua (lane) riêng biệt.',
      'Đến lượt, đội trả lời câu hỏi hiển thị trên màn hình.',
      'Trả lời ĐÚNG: Nhân vật nhảy bật bưng bưng tiến lên 1 hoặc 2 bước về phía trước.',
      'Trả lời SAI: Bị vấp đứng yên tại chỗ.',
      'Đội đầu tiên nhảy chạm vạch đích sẽ giương cúp vô địch!',
    ],
    scoring: [
      'Mỗi bước nhảy đúng: +10 điểm',
      'Về đích đầu tiên: +50 điểm chiến thắng',
    ],
  },
  sackrace: {
    id: 'sackrace',
    title: 'Nhảy Bao Bố Về Đích',
    subtitle: 'Đua nhảy bao bố trên các làn thi đấu',
    icon: '🌾',
    badge: 'Vận động & Đồng đội',
    objective: 'Trả lời đúng liên tục để nhân vật trong bao bố nhảy tiến lên và về đích đầu tiên.',
    steps: [
      'Mỗi đội xuất phát tại một làn đua (lane) riêng biệt.',
      'Đến lượt, đội trả lời câu hỏi hiển thị trên màn hình.',
      'Trả lời ĐÚNG: Nhân vật nhảy bật bưng bưng tiến lên 1 hoặc 2 bước về phía trước.',
      'Trả lời SAI: Bị vấp đứng yên tại chỗ.',
      'Đội đầu tiên nhảy chạm vạch đích sẽ giương cúp vô địch!',
    ],
    scoring: [
      'Mỗi bước nhảy đúng: +10 điểm',
      'Về đích đầu tiên: +50 điểm chiến thắng',
    ],
  },

  // 30. Ốc Sên Tinh Mắt
  snail_word_search: {
    id: 'snail_word_search',
    title: 'Ốc Sên Tinh Mắt',
    subtitle: 'Tìm từ khóa ẩn giấu trong ma trận chữ cái',
    icon: '🐌',
    badge: 'Tìm hiểu kiến thức',
    objective: 'Tìm đủ các từ khóa trong danh sách ẩn trong ma trận chữ cái cùng linh vật Ốc Sên.',
    steps: [
      'Quan sát danh sách từ khóa cần tìm ở cột bên trái.',
      'Tìm kiếm chuỗi chữ cái tương ứng trong bảng ma trận.',
      'Nhấp vào ô chữ cái đầu tiên, sau đó nhấp vào ô chữ cái cuối cùng của từ (hoặc kéo chuột).',
      'Tìm đúng: Từ khóa được highlight nổi bật rực rỡ và Ốc sên nhảy múa chúc mừng!',
    ],
    scoring: [
      'Mỗi từ tìm thấy: +20 điểm',
      'Tìm hết toàn bộ bảng từ: +50 điểm thưởng',
    ],
  },
  snail_words: {
    id: 'snail_words',
    title: 'Ốc Sên Tinh Mắt',
    subtitle: 'Tìm từ khóa ẩn giấu trong ma trận chữ cái',
    icon: '🐌',
    badge: 'Tìm hiểu kiến thức',
    objective: 'Tìm đủ các từ khóa trong danh sách ẩn trong ma trận chữ cái cùng linh vật Ốc Sên.',
    steps: [
      'Quan sát danh sách từ khóa cần tìm ở cột bên trái.',
      'Tìm kiếm chuỗi chữ cái tương ứng trong bảng ma trận.',
      'Nhấp vào ô chữ cái đầu tiên, sau đó nhấp vào ô chữ cái cuối cùng của từ (hoặc kéo chuột).',
      'Tìm đúng: Từ khóa được highlight nổi bật rực rỡ và Ốc sên nhảy múa chúc mừng!',
    ],
    scoring: [
      'Mỗi từ tìm thấy: +20 điểm',
      'Tìm hết toàn bộ bảng từ: +50 điểm thưởng',
    ],
  },

  // 31. Dò Boom Tri Thức
  mine_boom: {
    id: 'mine_boom',
    title: 'Dò Boom Tri Thức',
    subtitle: 'Né Boom ẩn, trả lời câu hỏi và ăn điểm vàng kịch tính',
    icon: '💣',
    badge: 'Cân não & Chiến thuật',
    objective: 'Chọn đúng các ô điểm vàng, trả lời đúng câu hỏi và tránh dính 3 quả Boom!',
    steps: [
      'Đến lượt, đội nhấp chọn 1 ô bất kỳ trên bãi mìn bí ẩn.',
      'Trả lời câu hỏi trắc nghiệm trong thời gian giới hạn.',
      'Trả lời ĐÚNG: Lật mở ô. Nếu là Ô Vàng ➔ Nhận điểm thưởng tương ứng (+10 đến +50 điểm).',
      'Nếu là Ô BOOM ➔ Bị nổ boom, trừ điểm phạt và tích lũy 1 cảnh báo Boom.',
      'Dính đủ 3 quả Boom ➔ Đội bị xử THUA ngay lập tức!',
    ],
    scoring: [
      'Ô Vàng: +10 đến +50 điểm tùy độ hiếm',
      'Ô Boom: -15 điểm và nhận 1 vạch Boom (Tối đa 3)',
      'Ô May Mắn: x2 điểm hoặc bảo vệ miễn nhiễm Boom',
    ],
  },

  // 32. Đào Vàng Tri Thức
  gold_miner: {
    id: 'gold_miner',
    title: 'Đào Vàng Tri Thức',
    subtitle: 'Canh chuẩn góc thả móc neo kéo vàng nguyên khối',
    icon: '⛏️',
    badge: 'Khéo léo & Phản xạ',
    objective: 'Trả lời đúng để kích hoạt Móc Neo, canh đúng góc kéo các thỏi vàng giá trị cao.',
    steps: [
      'Đến lượt, đội trả lời câu hỏi trắc nghiệm để mở khóa hệ thống Cần Cẩu.',
      'Trả lời ĐÚNG ➔ Móc neo bắt đầu đung đưa qua lại.',
      'Đội tự canh thời điểm chuẩn xác và bấm nút "KÉO / THẢ MÓC" để phóng móc.',
      'Kéo trúng Vàng ➔ Thu về điểm lớn (+30 đến +100 điểm).',
      'Kéo trúng Đá ➔ Móc nặng kéo chậm và bị trừ điểm phạt.',
      'Kéo trúng Túi Bí Mật 🎁 ➔ 70% mở ra Vàng, 30% ra Đá.',
    ],
    scoring: [
      'Vàng nhỏ: +10 đến +30 điểm',
      'Vàng trung & Vàng lớn: +50 đến +100 điểm',
      'Đá: -15 điểm',
      'Túi quà may mắn: Vàng ngẫu nhiên hoặc Đá',
    ],
  },

  // 33. Sắp Xếp Chữ Cái
  letter_arrange: {
    id: 'letter_arrange',
    title: 'Sắp Xếp Chữ Cái',
    subtitle: 'Ghép thẻ ký tự tiếng Việt thành từ khóa kiến thức chuẩn xác',
    icon: '🔤',
    badge: 'Ô chữ & Từ vựng',
    objective: 'Sắp xếp lại các thẻ chữ cái bị xáo trộn để tạo thành từ khóa chính xác.',
    steps: [
      'Đọc gợi ý hoặc câu hỏi kiến thức trên màn hình.',
      'Chạm vào các thẻ chữ cái bị xáo trộn ở kho dưới để đưa vào vùng đáp án.',
      'Có thể bấm "Thêm Dấu Cách" nếu là cụm từ nhiều chữ, hoặc chạm vào chữ đã đặt để hoàn lại.',
      'Bấm "HOÀN TẤT & KIỂM TRA" để xác nhận đáp án trước khi hết giờ.',
    ],
    scoring: [
      'Sắp xếp chính xác: +20 điểm (hoặc tùy cấu hình)',
      'Sử dụng Gợi ý: Hỗ trợ tìm từ mà không mất điểm',
    ],
  },

  // 34. Cờ Tỷ Phú Tri Thức
  monopoly: {
    id: 'monopoly',
    title: 'Cờ Tỷ Phú Tri Thức',
    subtitle: 'Boardgame kinh tế giáo dục & thử thách theo lượt',
    icon: '🎩',
    badge: 'Boardgame & Đấu trí',
    objective: 'Xây dựng đế chế bất động sản, thu tiền thuê đất và trở thành đội có tổng tài sản lớn nhất.',
    steps: [
      'Chế độ Có Câu Hỏi: Đến lượt, đội trả lời ĐÚNG câu hỏi tri thức để mở khóa quyền gieo xúc xắc (Sai: Mất lượt).',
      'Chế độ Không Câu Hỏi / Tự Do: Gieo xúc xắc trực tiếp quanh 24 ô trên bàn cờ.',
      'Đáp vào ô Đất trống: Có quyền Mua đất để sở hữu và thu tiền thuê khi đối thủ đi vào.',
      'Đáp vào ô Đất của mình: Chi tiền để Nâng cấp nhà (tăng gấp đôi tiền thuê).',
      'Đáp vào ô CƠ HỘI / KHÍ VẬN: Rút thẻ sự kiện nhận thưởng, nhận thẻ khiên miễn tiền thuê, hoặc dịch chuyển.',
      'Đi qua ô START: Nhận ngay lương thưởng +$200 vào tài khoản.',
    ],
    scoring: [
      'Mỗi câu đúng: Được quyền di chuyển và thực hiện hành động kinh tế',
      'Đội cuối cùng không bị phá sản hoặc đạt mốc tài sản mục tiêu sẽ chiến thắng',
    ],
  },
  cotyphu: {
    id: 'cotyphu',
    title: 'Cờ Tỷ Phú Tri Thức',
    subtitle: 'Boardgame kinh tế giáo dục & thử thách theo lượt',
    icon: '🎩',
    badge: 'Boardgame & Đấu trí',
    objective: 'Xây dựng đế chế bất động sản, thu tiền thuê đất và trở thành đội có tổng tài sản lớn nhất.',
    steps: [
      'Chế độ Có Câu Hỏi: Đến lượt, đội trả lời ĐÚNG câu hỏi tri thức để mở khóa quyền gieo xúc xắc (Sai: Mất lượt).',
      'Chế độ Không Câu Hỏi / Tự Do: Gieo xúc xắc trực tiếp quanh 24 ô trên bàn cờ.',
      'Đáp vào ô Đất trống: Có quyền Mua đất để sở hữu và thu tiền thuê khi đối thủ đi vào.',
      'Đáp vào ô Đất của mình: Chi tiền để Nâng cấp nhà (tăng gấp đôi tiền thuê).',
      'Đáp vào ô CƠ HỘI / KHÍ VẬN: Rút thẻ sự kiện nhận thưởng, nhận thẻ khiên miễn tiền thuê, hoặc dịch chuyển.',
      'Đi qua ô START: Nhận ngay lương thưởng +$200 vào tài khoản.',
    ],
    scoring: [
      'Mỗi câu đúng: Được quyền di chuyển và thực hiện hành động kinh tế',
      'Đội cuối cùng không bị phá sản hoặc đạt mốc tài sản mục tiêu sẽ chiến thắng',
    ],
  },

  // 35. Ma Sói: Ngôi Làng Bí Ẩn
  werewolf_village: {
    id: 'werewolf_village',
    title: 'Ma Sói: Ngôi Làng Bí Ẩn',
    subtitle: 'Đấu trí điều tra 12 cư dân NPC & Biểu quyết vote treo cổ',
    icon: '🐺',
    badge: 'Trinh thám & Biểu quyết',
    objective: 'Tìm và biểu quyết treo cổ toàn bộ Ma Sói ẩn mình trong 12 cư dân làng để bảo vệ bình yên.',
    steps: [
      'Ban đêm (Night Engine): 12 NPC thông minh tự động thực hiện hành động bí mật (Sói cắn, Tiên tri soi, Bảo vệ tạo khiên, Phù thủy cứu/độc, Thợ săn găm đạn).',
      'Bình minh (Dawn): Ngôi làng công bố danh tính người tử nạn đêm qua (nếu có) và hiển thị Nhật ký Manh Mối đêm không tiết lộ danh tính NPC.',
      'Biểu quyết Vote Treo Cổ: Đội đến lượt thảo luận và bỏ phiếu Vote 1 NPC tình nghi. NPC bị vote sẽ BỊ TREO CỔ (tử nạn ngay) và hé lộ danh tính thật.',
      'Nếu Treo cổ đúng Ma Sói: Đội nhận thưởng điểm x2 và loại bỏ mối nguy hiểm cho dân làng.',
      'Chế độ câu hỏi: Trả lời đúng để nhận quyền Vote hoặc kiểm tra danh tính. Chế độ bỏ qua câu hỏi: Đến lượt là tiến hành vote treo cổ ngay.',
    ],
    scoring: [
      'Vote treo cổ trúng Ma Sói: +200 điểm (hoặc Cơ bản × 2)',
      'Vote nhầm Dân Làng / Thần: NPC bị xử tử và không nhận điểm',
      'Đội có điểm số cao nhất sau khi tiêu diệt hết Sói hoặc hết số đêm sẽ giành chiến thắng',
    ],
  },
  werewolf: {
    id: 'werewolf',
    title: 'Ma Sói: Ngôi Làng Bí Ẩn',
    subtitle: 'Đấu trí điều tra 12 cư dân NPC & Biểu quyết vote treo cổ',
    icon: '🐺',
    badge: 'Trinh thám & Biểu quyết',
    objective: 'Tìm và biểu quyết treo cổ toàn bộ Ma Sói ẩn mình trong 12 cư dân làng để bảo vệ bình yên.',
    steps: [
      'Ban đêm (Night Engine): 12 NPC thông minh tự động thực hiện hành động bí mật (Sói cắn, Tiên tri soi, Bảo vệ tạo khiên, Phù thủy cứu/độc, Thợ săn găm đạn).',
      'Bình minh (Dawn): Ngôi làng công bố danh tính người tử nạn đêm qua (nếu có) và hiển thị Nhật ký Manh Mối đêm không tiết lộ danh tính NPC.',
      'Biểu quyết Vote Treo Cổ: Đội đến lượt thảo luận và bỏ phiếu Vote 1 NPC tình nghi. NPC bị vote sẽ BỊ TREO CỔ (tử nạn ngay) và hé lộ danh tính thật.',
      'Nếu Treo cổ đúng Ma Sói: Đội nhận thưởng điểm x2 và loại bỏ mối nguy hiểm cho dân làng.',
      'Chế độ câu hỏi: Trả lời đúng để nhận quyền Vote hoặc kiểm tra danh tính. Chế độ bỏ qua câu hỏi: Đến lượt là tiến hành vote treo cổ ngay.',
    ],
    scoring: [
      'Vote treo cổ trúng Ma Sói: +200 điểm (hoặc Cơ bản × 2)',
      'Vote nhầm Dân Làng / Thần: NPC bị xử tử và không nhận điểm',
      'Đội có điểm số cao nhất sau khi tiêu diệt hết Sói hoặc hết số đêm sẽ giành chiến thắng',
    ],
  },
  masoi: {
    id: 'masoi',
    title: 'Ma Sói: Ngôi Làng Bí Ẩn',
    subtitle: 'Đấu trí điều tra 12 cư dân NPC & Biểu quyết vote treo cổ',
    icon: '🐺',
    badge: 'Trinh thám & Biểu quyết',
    objective: 'Tìm và biểu quyết treo cổ toàn bộ Ma Sói ẩn mình trong 12 cư dân làng để bảo vệ bình yên.',
    steps: [
      'Ban đêm (Night Engine): 12 NPC thông minh tự động thực hiện hành động bí mật (Sói cắn, Tiên tri soi, Bảo vệ tạo khiên, Phù thủy cứu/độc, Thợ săn găm đạn).',
      'Bình minh (Dawn): Ngôi làng công bố danh tính người tử nạn đêm qua (nếu có) và hiển thị Nhật ký Manh Mối đêm không tiết lộ danh tính NPC.',
      'Biểu quyết Vote Treo Cổ: Đội đến lượt thảo luận và bỏ phiếu Vote 1 NPC tình nghi. NPC bị vote sẽ BỊ TREO CỔ (tử nạn ngay) và hé lộ danh tính thật.',
      'Nếu Treo cổ đúng Ma Sói: Đội nhận thưởng điểm x2 và loại bỏ mối nguy hiểm cho dân làng.',
      'Chế độ câu hỏi: Trả lời đúng để nhận quyền Vote hoặc kiểm tra danh tính. Chế độ bỏ qua câu hỏi: Đến lượt là tiến hành vote treo cổ ngay.',
    ],
    scoring: [
      'Vote treo cổ trúng Ma Sói: +200 điểm (hoặc Cơ bản × 2)',
      'Vote nhầm Dân Làng / Thần: NPC bị xử tử và không nhận điểm',
      'Đội có điểm số cao nhất sau khi tiêu diệt hết Sói hoặc hết số đêm sẽ giành chiến thắng',
    ],
  },
  ma_soi: {
    id: 'ma_soi',
    title: 'Ma Sói: Ngôi Làng Bí Ẩn',
    subtitle: 'Đấu trí điều tra 12 cư dân NPC & Biểu quyết vote treo cổ',
    icon: '🐺',
    badge: 'Trinh thám & Biểu quyết',
    objective: 'Tìm và biểu quyết treo cổ toàn bộ Ma Sói ẩn mình trong 12 cư dân làng để bảo vệ bình yên.',
    steps: [
      'Ban đêm (Night Engine): 12 NPC thông minh tự động thực hiện hành động bí mật (Sói cắn, Tiên tri soi, Bảo vệ tạo khiên, Phù thủy cứu/độc, Thợ săn găm đạn).',
      'Bình minh (Dawn): Ngôi làng công bố danh tính người tử nạn đêm qua (nếu có) và hiển thị Nhật ký Manh Mối đêm không tiết lộ danh tính NPC.',
      'Biểu quyết Vote Treo Cổ: Đội đến lượt thảo luận và bỏ phiếu Vote 1 NPC tình nghi. NPC bị vote sẽ BỊ TREO CỔ (tử nạn ngay) và hé lộ danh tính thật.',
      'Nếu Treo cổ đúng Ma Sói: Đội nhận thưởng điểm x2 và loại bỏ mối nguy hiểm cho dân làng.',
      'Chế độ câu hỏi: Trả lời đúng để nhận quyền Vote hoặc kiểm tra danh tính. Chế độ bỏ qua câu hỏi: Đến lượt là tiến hành vote treo cổ ngay.',
    ],
    scoring: [
      'Vote treo cổ trúng Ma Sói: +200 điểm (hoặc Cơ bản × 2)',
      'Vote nhầm Dân Làng / Thần: NPC bị xử tử và không nhận điểm',
      'Đội có điểm số cao nhất sau khi tiêu diệt hết Sói hoặc hết số đêm sẽ giành chiến thắng',
    ],
  },
};

interface GameQuickGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId?: GameId | GameType | string | null;
  onStartGame?: () => void;
}

export const GameQuickGuideModal: React.FC<GameQuickGuideModalProps> = ({
  isOpen,
  onClose,
  gameId = 'openbox',
  onStartGame,
}) => {
  if (!isOpen) return null;

  const rawId = (gameId || 'openbox').toString().toLowerCase().trim();
  const normalizedId = rawId.replace(/[-_]/g, '');
  const guide = 
    GAME_GUIDES_DATA[rawId] || 
    GAME_GUIDES_DATA[normalizedId] || 
    (Object.entries(GAME_GUIDES_DATA).find(([k]) => k.toLowerCase().replace(/[-_]/g, '') === normalizedId)?.[1]) ||
    GAME_GUIDES_DATA['openbox'];

  return (
    <div
      className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs animate-fade-in overflow-y-auto"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-[#FFFDFB] border-2 border-[#DED5B8] rounded-[24px] max-w-lg w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] my-auto animate-scale-up">
        {/* Header */}
        <div className="bg-[#F8F4E6] p-4 sm:p-5 border-b border-[#DED5B8] flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-white border border-[#D8CFAF] shadow-2xs flex items-center justify-center text-2xl shrink-0">
              {guide.icon}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-full bg-[#E9F0D9] text-[#4F683C] border border-[#B9CDA0]">
                  {guide.badge}
                </span>
              </div>
              <h2 className="text-lg sm:text-xl font-[900] text-[#35452E] tracking-tight mt-0.5">
                {guide.title}
              </h2>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-[#D8CFAF] transition cursor-pointer shrink-0"
            title="Đóng"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body: Súc tích, trực quan */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
          {/* Mục tiêu */}
          <div className="bg-[#E9F0D9]/70 p-3 rounded-xl border border-[#B9CDA0] flex items-start gap-2.5 text-[#35452E]">
            <Trophy className="w-4 h-4 text-[#6F8F55] shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <strong className="font-extrabold text-[#293B23]">Mục tiêu: </strong>
              {guide.objective}
            </div>
          </div>

          {/* Các bước chơi ngắn gọn */}
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-wider text-[#6F8F55] flex items-center gap-1.5 text-[11px]">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Cách chơi trong game:</span>
            </h4>
            <div className="space-y-2">
              {guide.steps.map((step, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-white border border-[#E8E1CE] flex items-start gap-2.5 text-slate-700 leading-relaxed shadow-2xs"
                >
                  <span className="w-5 h-5 rounded-full bg-[#E9F0D9] text-[#4F683C] font-black text-[11px] flex items-center justify-center shrink-0 border border-[#B9CDA0]">
                    {idx + 1}
                  </span>
                  <span className="pt-0.5">{step}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Cách tính điểm */}
          <div className="space-y-2">
            <h4 className="font-black uppercase tracking-wider text-amber-800 flex items-center gap-1.5 text-[11px]">
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Quy chuẩn tính điểm:</span>
            </h4>
            <div className="p-2.5 rounded-xl bg-[#FFFDF5] border border-amber-200 space-y-1.5 text-amber-950 font-medium">
              {guide.scoring.map((score, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <span className="text-amber-500">⭐</span>
                  <span>{score}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-[#F8F5E9] p-3.5 sm:p-4 border-t border-[#DED5B8] flex items-center justify-between gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition cursor-pointer"
          >
            Đã Hiểu
          </button>

          {onStartGame && (
            <button
              onClick={() => {
                onClose();
                onStartGame();
              }}
              className="px-4 py-2 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white text-xs font-black rounded-xl shadow-sm transition flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current text-[#E9D58F]" />
              <span>Vào Chơi Game</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
