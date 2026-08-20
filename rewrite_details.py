import re

content = open("src/components/WeyGuideMascot.tsx", "r", encoding="utf-8").read()

updates = {
  'gm_mancala': [
    'Bước 1: Chọn chế độ 2 Đội (bàn chữ nhật 10 ô) hoặc 3 Đội (bàn tam giác 15 ô).',
    'Bước 2: Hệ thống quay ngẫu nhiên 1 câu hỏi, đội nào giành quyền và trả lời đúng sẽ được rải quân.',
    'Bước 3: Chọn 1 ô Dân của đội mình và bấm mũi tên để rải sỏi thuận/ngược chiều kim đồng hồ.',
    'Bước 4: Khi rải hết sỏi mà gặp ô trống, đội chơi sẽ được ĂN toàn bộ sỏi ở ô liền sau (10đ/Quan, 1đ/Dân). Nếu ô kế tiếp cũng trống, ăn tiếp!'
  ],
  'gm_ludo': [
    'Bước 1: Hai đến Bốn đội cùng thi đấu trên bàn cờ Cá Ngựa.',
    'Bước 2: Trả lời đúng câu hỏi để được tung xúc xắc.',
    'Bước 3: Tung được số 6 thì sẽ được "Xuất Chuồng" một chú ngựa mới.',
    'Bước 4: Nếu điểm đến của ngựa trùng với vị trí ngựa đối phương, bạn có quyền "Đá" họ về chuồng!',
    'Bước 5: Đội đầu tiên đưa đủ 4 chú ngựa lên chuồng theo thứ tự 1-2-3-4 sẽ giành chiến thắng.'
  ],
  'gm_territory': [
    'Bước 1: Bản đồ gồm 36 ô lục giác với các loại địa hình Núi (thủ 3), Rừng (thủ 2), Đồng bằng (thủ 1).',
    'Bước 2: Mỗi đội lần lượt trả lời câu hỏi để giành quyền mở rộng lãnh thổ hoặc tấn công ô của đối thủ.',
    'Bước 3: Khi tấn công, số điểm tấn công phải lớn hơn hoặc bằng sức phòng thủ (DEF) của địa hình đó.',
    'Bước 4: Sử dụng "Thử Thách Đột Kích" đúng lúc để xoay chuyển cục diện, chiếm gọn vùng đất của địch!'
  ],
  'gm_battleship': [
    'Bước 1: Bàn cờ ẩn chứa các loại tàu chiến với kích thước khác nhau (Tàu tuần tra 1 ô, Tàu sân bay 3 ô...).',
    'Bước 2: Đội chơi chọn một tọa độ trên lưới và trả lời câu hỏi tương ứng.',
    'Bước 3: Trả lời đúng, đại bác sẽ khai hỏa vào tọa độ đó. Nếu trúng tàu, nhận thêm điểm thưởng lớn!',
    'Bước 4: Thỉnh thoảng sử dụng Radar để quét một khu vực lớn xem có tàu địch đang ẩn nấp hay không.'
  ],
  'gm_wheel': [
    'Bước 1: Giáo viên tạo ô chữ bí mật, có thể nhờ AI tạo tự động dựa trên từ khóa bài học.',
    'Bước 2: Các đội quay "Chiếc Nón Kỳ Diệu" để xác định điểm số (có thể quay trúng x2, Chia điểm, hoặc Mất lượt).',
    'Bước 3: Trả lời đúng câu hỏi sẽ được quyền đoán chữ cái.',
    'Bước 4: Đoán đúng toàn bộ ô chữ sẽ nhận điểm cực khủng và kết thúc trò chơi.'
  ],
  'gm_openbox': [
    'Bước 1: Trò chơi sẽ hiển thị các hộp quà bí ẩn trên giao diện Rừng Xanh, Vũ Trụ, Cầu Vồng,...',
    'Bước 2: Học sinh hoặc các đội lần lượt chọn hộp quà muốn mở.',
    'Bước 3: Giải quyết câu hỏi bên trong hộp để nhận chìa khóa.',
    'Bước 4: Hộp mở ra sẽ chứa điểm thưởng ngẫu nhiên (từ 10 đến 100 điểm) hoặc phần quà đặc biệt do giáo viên cài đặt.'
  ],
  'gm_magicwheel': [
    'Bước 1: Chọn chế độ "Vòng Quay May Mắn" ở menu chính.',
    'Bước 2: Nhập danh sách tên học sinh, các đội hoặc phần thưởng.',
    'Bước 3: Nhấn nút QUAY để mũi tên dừng lại ngẫu nhiên và chọn ra người may mắn.',
    'Bước 4: Có thể gắn câu hỏi vào vòng quay để vừa gọi tên vừa kiểm tra bài cũ cực kỳ tiện lợi.'
  ],
  'gm_bingo': [
    'Bước 1: Mỗi đội sẽ được phát một bảng Bingo ngẫu nhiên (3x3 hoặc 5x5).',
    'Bước 2: Trả lời đúng các câu hỏi trắc nghiệm xuất hiện trên màn hình.',
    'Bước 3: Đánh dấu vào ô số tương ứng với đáp án đúng trên bảng của mình.',
    'Bước 4: Đội đầu tiên nối được 1 (hoặc nhiều) đường thẳng ngang, dọc, chéo và hô BINGO sẽ chiến thắng!'
  ],
  'gm_tugofwar': [
    'Bước 1: Chọn đội hình 2 phe: Xanh và Đỏ.',
    'Bước 2: Hệ thống tung ra các câu hỏi trắc nghiệm cần phản xạ nhanh.',
    'Bước 3: Cả hai đội cùng giành quyền trả lời. Đội nào trả lời đúng và nhanh hơn, sợi dây thừng sẽ kéo về phe đó 1 mốc.',
    'Bước 4: Kéo qua mốc chiến thắng (+5 hoặc -5) để giật cúp vô địch!'
  ],
  'gm_betting': [
    'Bước 1: Trước mỗi câu hỏi, hệ thống sẽ hé lộ mức độ khó và chủ đề.',
    'Bước 2: Các đội tính toán và đặt cược số điểm mình đang có (10đ, 20đ, 50đ hoặc Tất tay).',
    'Bước 3: Bắt đầu trả lời câu hỏi.',
    'Bước 4: Đúng: Nhận lại gấp đôi số điểm đã cược. Sai: Mất sạch số điểm cược! Rất đau tim!'
  ],
  'gm_pokemon': [
    'Bước 1: Bản đồ trò chơi sẽ xuất hiện nhiều bãi cỏ, tương ứng với các câu hỏi bí ẩn.',
    'Bước 2: Giải đố để ném bóng (PokeBall, GreatBall, UltraBall) vào sinh vật huyền thoại đang ẩn nấp.',
    'Bước 3: Tốc độ trả lời càng nhanh, bóng dùng càng xịn thì tỉ lệ bắt trúng càng cao.',
    'Bước 4: Đội nào thu thập được nhiều Thần Thú xịn nhất (Legendary) sẽ có tổng lực chiến mạnh nhất!'
  ],
  'gm_tower': [
    'Bước 1: Trò chơi kiểm tra sự khéo léo và kiên nhẫn.',
    'Bước 2: Mỗi lần trả lời đúng 1 câu hỏi, đội của bạn sẽ được đặt thêm 1 tầng tháp.',
    'Bước 3: Càng lên cao, gió sẽ thổi mạnh và tháp sẽ chao đảo.',
    'Bước 4: Đội xây được tòa tháp cao nhất mà không bị sập là người chiến thắng.'
  ],
  'gm_race': [
    'Bước 1: Chọn xe đua và vào vạch xuất phát.',
    'Bước 2: Mỗi khúc cua là một câu hỏi. Trả lời đúng để vượt khúc cua và giữ tốc độ cao.',
    'Bước 3: Trả lời xuất sắc liên tiếp để tích lũy bình Nitro siêu tốc.',
    'Bước 4: Bơm Nitro để vượt mặt đối thủ và cán đích nhận cúp vô địch vinh quang!'
  ],
  'gm_puzzle': [
    'Bước 1: Một bức tranh bí ẩn (do giáo viên tải lên hoặc chọn ngẫu nhiên) bị che bởi 9 hoặc 16 mảnh ghép.',
    'Bước 2: Trả lời đúng các câu hỏi để lật mở từng mảnh ghép nhỏ.',
    'Bước 3: Xâu chuỗi các hình ảnh lật được để đoán nội dung toàn bức tranh.',
    'Bước 4: Đội bấm chuông và đoán đúng bức tranh sớm nhất sẽ nhận giải đặc biệt!'
  ],
  'gm_posechallenge': [
    'Bước 1: Giáo viên phát động trò chơi giữa giờ để khởi động cơ thể (Warm-up).',
    'Bước 2: Màn hình sẽ hiển thị 1 hình dáng ngộ nghĩnh (Pose) ngẫu nhiên.',
    'Bước 3: Cả lớp phải làm theo và giữ nguyên tư thế đó trong vòng 5 giây đếm ngược.',
    'Bước 4: Giáo viên làm trọng tài, cộng điểm cho tổ/đội nào tạo dáng đều, đẹp và hài hước nhất.'
  ],
  'gm_pictogram': [
    'Bước 1: Bật AI sinh hình ảnh trong trò chơi Đuổi Hình Bắt Chữ.',
    'Bước 2: AI tự động vẽ ra các bức tranh vui nhộn mô tả ca dao tục ngữ hoặc định nghĩa khoa học.',
    'Bước 3: Các đội nhìn hình, liên tưởng ý nghĩa và hô to đáp án.',
    'Bước 4: Nếu khó quá, có thể xin gợi ý chữ cái đầu tiên hoặc xin lời giải thích từ Wey!'
  ],
  'gm_caro': [
    'Bước 1: Trò chơi chia làm 2 phe X và O trên bàn cờ caro.',
    'Bước 2: Trả lời đúng câu hỏi để được quyền đánh 1 quân cờ lên vị trí bất kỳ.',
    'Bước 3: Chú ý quan sát và chặn các nước cờ nguy hiểm của đối phương.',
    'Bước 4: Đội đầu tiên tạo thành hàng 5 quân liên tiếp (ngang, dọc, chéo) sẽ giành chiến thắng tuyệt đối!'
  ],
  'gm_chess': [
    'Bước 1: Bàn cờ vua 8x8 tiêu chuẩn với đầy đủ quân.',
    'Bước 2: Để được di chuyển quân cờ, đội phải trả lời đúng 1 câu hỏi do giáo viên đưa ra.',
    'Bước 3: Nếu trả lời sai, đội sẽ bị mất lượt, tạo cơ hội cho đối phương phản công.',
    'Bước 4: Triển khai chiến thuật, Chiếu Bí (Checkmate) Vua đối phương để kết thúc ván đấu tri thức này!'
  ]
}

def replace_details(content, game_id, new_details):
    # Regex to find details array for a specific id
    # We look for `id: 'game_id'` followed by some lines, then `details: [...]`
    pattern = r"(id:\s*'" + game_id + r"'.*?details:\s*\[).*?(\]\s*\n?\s*\})"
    
    # Format the new details as a string array
    details_str = ",\n      ".join(f"'{d}'" for d in new_details)
    replacement = r"\g<1>\n      " + details_str + r"\n    \g<2>"
    
    return re.sub(pattern, replacement, content, flags=re.DOTALL)

for game_id, details in updates.items():
    content = replace_details(content, game_id, details)

with open("src/components/WeyGuideMascot.tsx", "w", encoding="utf-8") as f:
    f.write(content)

print("Done")
