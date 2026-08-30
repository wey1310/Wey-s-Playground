// Danh mục môn học và phân phối chương trình SGK Kết nối tri thức với cuộc sống (Chương trình GDPT 2018)

export interface SubjectInfo {
  id: string;
  name: string;
  category: 'primary' | 'secondary' | 'high' | 'all';
  icon: string;
}

export interface LessonItem {
  id: string;
  title: string;
  chapter?: string;
  term?: 1 | 2; // Học kì 1 hoặc 2
}

export const GRADES = [
  'Lớp 1', 'Lớp 2', 'Lớp 3', 'Lớp 4', 'Lớp 5',
  'Lớp 6', 'Lớp 7', 'Lớp 8', 'Lớp 9',
  'Lớp 10', 'Lớp 11', 'Lớp 12'
] as const;

export type GradeLevel = typeof GRADES[number];

// Danh sách đầy đủ các môn học theo từng cấp học trong CT GDPT 2018
export const PRIMARY_SUBJECTS = [
  'Tiếng Việt',
  'Toán',
  'Đạo đức',
  'Tự nhiên và Xã hội',
  'Khoa học',
  'Lịch sử và Địa lí',
  'Tin học',
  'Công nghệ',
  'Tiếng Anh',
  'Âm nhạc',
  'Mĩ thuật',
  'Giáo dục thể chất',
  'Hoạt động trải nghiệm'
];

export const SECONDARY_SUBJECTS = [
  'Ngữ văn',
  'Toán',
  'Tiếng Anh',
  'Khoa học tự nhiên',
  'Lịch sử và Địa lí',
  'Giáo dục công dân',
  'Tin học',
  'Công nghệ',
  'Âm nhạc',
  'Mĩ thuật',
  'Giáo dục thể chất',
  'Hoạt động trải nghiệm, hướng nghiệp'
];

export const HIGH_SCHOOL_SUBJECTS = [
  'Ngữ văn',
  'Toán',
  'Tiếng Anh',
  'Vật lí',
  'Hóa học',
  'Sinh học',
  'Lịch sử',
  'Địa lí',
  'Giáo dục kinh tế và pháp luật',
  'Tin học',
  'Công nghệ',
  'Âm nhạc',
  'Mĩ thuật',
  'Giáo dục thể chất',
  'Giáo dục quốc phòng và an ninh',
  'Hoạt động trải nghiệm, hướng nghiệp'
];

export const ALL_SUBJECTS = Array.from(
  new Set([...PRIMARY_SUBJECTS, ...SECONDARY_SUBJECTS, ...HIGH_SCHOOL_SUBJECTS])
);

export function normalizeGrade(grade?: string): string {
  if (!grade) return 'Lớp 7';
  const trimmed = grade.trim();
  const exact = GRADES.find(g => g.toLowerCase() === trimmed.toLowerCase());
  if (exact) return exact;
  const match = trimmed.match(/\b(1[0-2]|[1-9])\b/) || trimmed.match(/(\d+)/);
  if (match) {
    const num = parseInt(match[1], 10);
    if (num >= 1 && num <= 12) {
      return `Lớp ${num}`;
    }
  }
  return trimmed;
}

export function getSubjectsForGrade(grade: string): string[] {
  const norm = normalizeGrade(grade);
  const match = norm.match(/\d+/);
  const num = match ? parseInt(match[0], 10) : 7;
  if (num >= 10 && num <= 12) {
    return HIGH_SCHOOL_SUBJECTS;
  }
  if (num >= 6 && num <= 9) {
    return SECONDARY_SUBJECTS;
  }
  if (num === 1 || num === 2) {
    return ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Tiếng Anh', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm'];
  }
  if (num === 3) {
    return ['Tiếng Việt', 'Toán', 'Đạo đức', 'Tự nhiên và Xã hội', 'Tin học', 'Công nghệ', 'Tiếng Anh', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm'];
  }
  if (num >= 4 && num <= 5) {
    return ['Tiếng Việt', 'Toán', 'Đạo đức', 'Khoa học', 'Lịch sử và Địa lí', 'Tin học', 'Công nghệ', 'Tiếng Anh', 'Âm nhạc', 'Mĩ thuật', 'Giáo dục thể chất', 'Hoạt động trải nghiệm'];
  }
  return ALL_SUBJECTS;
}

// CSDL Bài học SGK "Kết nối tri thức với cuộc sống"
export const KET_NOI_TRI_THUC_CURRICULUM: Record<string, Record<string, string[]>> = {
  // LỚP 1
  'Lớp 1': {
    'Toán': [
      'Bài 1: Các số 0, 1, 2, 3, 4, 5',
      'Bài 2: Các số 6, 7, 8, 9, 10',
      'Bài 3: So sánh và xếp thứ tự các số trong phạm vi 10',
      'Bài 4: Hình chữ nhật, hình thoi, hình tròn, hình tam giác',
      'Bài 5: Phép cộng trong phạm vi 10',
      'Bài 6: Phép trừ trong phạm vi 10',
      'Bài 7: Bảng cộng, bảng trừ trong phạm vi 10',
      'Bài 8: Các số trong phạm vi 100',
      'Bài 9: Phép cộng, phép trừ không nhớ trong phạm vi 100',
      'Bài 10: Xem giờ đúng trên đồng hồ'
    ],
    'Tiếng Việt': [
      'Chủ điểm 1: Tôi là học sinh',
      'Chủ điểm 2: Em học chữ cái và dấu thanh',
      'Chủ điểm 3: Bạn bè gắn bó',
      'Chủ điểm 4: Mái ấm gia đình',
      'Chủ điểm 5: Thế giới tuổi thơ',
      'Chủ điểm 6: Thiên nhiên tươi đẹp',
      'Chủ điểm 7: Đất nước mến yêu'
    ],
    'Tự nhiên và Xã hội': [
      'Chủ đề 1: Gia đình (Các thành viên, Ngôi nhà, An toàn ở nhà)',
      'Chủ đề 2: Trường học (Lớp học của em, Giữ vệ sinh trường lớp)',
      'Chủ đề 3: Cộng đồng địa phương',
      'Chủ đề 4: Thực vật và Động vật',
      'Chủ đề 5: Con người và Sức khỏe',
      'Chủ đề 6: Trái Đất và Bầu trời'
    ]
  },

  // LỚP 2
  'Lớp 2': {
    'Toán': [
      'Bài 1: Ôn tập các số đến 100',
      'Bài 2: Tia số, số liền trước, số liền sau',
      'Bài 3: Phép cộng (có nhớ) trong phạm vi 100',
      'Bài 4: Phép trừ (có nhớ) trong phạm vi 100',
      'Bài 5: Điểm, đoạn thẳng, đường cong, ba điểm thẳng hàng',
      'Bài 6: Phép nhân - Thừa số, tích',
      'Bài 7: Bảng nhân 2, Bảng nhân 5',
      'Bài 8: Phép chia - Số bị chia, số chia, thương',
      'Bài 9: Bảng chia 2, Bảng chia 5',
      'Bài 10: Các số trong phạm vi 1000',
      'Bài 11: Đơn vị đo Ki-lô-gam, Lít, Đề-xi-mét, Mét'
    ],
    'Tiếng Việt': [
      'Chủ điểm 1: Em lớn lên từng ngày',
      'Chủ điểm 2: Đi học vui sao',
      'Chủ điểm 3: Niềm vui tuổi thơ',
      'Chủ điểm 4: Mái ấm gia đình',
      'Chủ điểm 5: Vẻ đẹp quanh em',
      'Chủ điểm 6: Hành tinh xanh của chúng ta'
    ],
    'Tự nhiên và Xã hội': [
      'Chủ đề 1: Gia đình (Nghề nghiệp của người thân, An toàn mùa mưa lũ)',
      'Chủ đề 2: Trường học (Sự kiện ở trường, Ngày hội thể thao)',
      'Chủ đề 3: Cộng đồng địa phương (Đường giao thông, An toàn giao thông)',
      'Chủ đề 4: Thực vật và Động vật (Nơi sống, Chăm sóc vật nuôi)',
      'Chủ đề 5: Con người và Sức khỏe (Cơ quan vận động, Cơ quan hô hấp)',
      'Chủ đề 6: Trái Đất và Bầu trời (Mặt trời, Hiện tượng thời tiết)'
    ]
  },

  // LỚP 3
  'Lớp 3': {
    'Toán': [
      'Bài 1: Ôn tập về đọc, viết, so sánh các số trong phạm vi 1000',
      'Bài 2: Bảng nhân 3, 4, 6, 7, 8, 9',
      'Bài 3: Bảng chia 3, 4, 6, 7, 8, 9',
      'Bài 4: Góc vuông, góc không vuông - Tam giác, tứ giác',
      'Bài 5: Hình tròn, tâm, bán kính, đường kính',
      'Bài 6: Các số trong phạm vi 10 000, 100 000',
      'Bài 7: Phép cộng, trừ trong phạm vi 100 000',
      'Bài 8: Chu vi và diện tích hình chữ nhật, hình vuông',
      'Bài 9: Bảng số liệu và biểu đồ tranh',
      'Bài 10: Tiền Việt Nam - Đơn vị đo độ dài, khối lượng, dung tích'
    ],
    'Tiếng Việt': [
      'Chủ điểm 1: Những búp măng non',
      'Chủ điểm 2: Cổng trường mở hội',
      'Chủ điểm 3: Mái nhà yêu thương',
      'Chủ điểm 4: Đất nước ngàn năm',
      'Chủ điểm 5: Bài ca lao động',
      'Chủ điểm 6: Trái đất xanh tươi'
    ],
    'Tin học': [
      'Chủ đề 1: Máy tính và em (Thông tin và quyết định, Khám phá máy tính)',
      'Chủ đề 2: Mạng máy tính và Internet (Xem thông tin trên Internet)',
      'Chủ đề 3: Tổ chức lưu trữ và tìm kiếm thông tin (Thư mục, Tệp)',
      'Chủ đề 4: Đạo đức, pháp luật và văn hóa số',
      'Chủ đề 5: Soạn thảo văn bản cơ bản',
      'Chủ đề 6: Giải quyết vấn đề với sự trợ giúp của máy tính'
    ]
  },

  // LỚP 4
  'Lớp 4': {
    'Toán': [
      'Bài 1: Các số có nhiều chữ số (Triệu và lớp triệu)',
      'Bài 2: Làm tròn số và so sánh các số có nhiều chữ số',
      'Bài 3: Phép cộng, phép trừ các số có nhiều chữ số',
      'Bài 4: Góc nhọn, góc tù, góc bẹt - Hai đường thẳng song song, vuông góc',
      'Bài 5: Phép nhân với số có một, hai chữ số',
      'Bài 6: Phép chia cho số có một, hai chữ số',
      'Bài 7: Khái niệm phân số - Phân số bằng nhau - Rút gọn phân số',
      'Bài 8: Quy đồng mẫu số và so sánh phân số',
      'Bài 9: Phép cộng, trừ, nhân, chia phân số',
      'Bài 10: Hình bình hành, hình thoi - Diện tích hình bình hành, hình thoi'
    ],
    'Tiếng Việt': [
      'Chủ điểm 1: Mỗi người một vẻ',
      'Chủ điểm 2: Trải nghiệm và khám phá',
      'Chủ điểm 3: Niềm vui sáng tạo',
      'Chủ điểm 4: Chắp cánh ước mơ',
      'Chủ điểm 5: Sống để yêu thương',
      'Chủ điểm 6: Uống nước nhớ nguồn',
      'Chủ điểm 7: Quê hương đất nước'
    ],
    'Khoa học': [
      'Chủ đề 1: Chất (Nước, Không khí, Ánh sáng, Nhiệt độ)',
      'Chủ đề 2: Năng lượng (Âm thanh, Ánh sáng, Nhiệt)',
      'Chủ đề 3: Thực vật và Động vật (Sự trao đổi chất, Sinh sản)',
      'Chủ đề 4: Nấm (Nấm men, nấm mốc, nấm ăn)',
      'Chủ đề 5: Con người và Sức khỏe (Dinh dưỡng, Phòng bệnh)',
      'Chủ đề 6: Sinh vật và Môi trường'
    ],
    'Lịch sử và Địa lí': [
      'Chủ đề 1: Đất nước và con người Việt Nam',
      'Chủ đề 2: Vùng Trung du và Miền núi Bắc Bộ',
      'Chủ đề 3: Vùng Đồng bằng Bắc Bộ (Hà Nội, Lễ hội Cổ Loa, Đền Hùng)',
      'Chủ đề 4: Vùng Duyên hải miền Trung (Cố đô Huế, Phố cổ Hội An)',
      'Chủ đề 5: Vùng Tây Nguyên (Cồng chiêng Tây Nguyên, Rừng và Cà phê)',
      'Chủ đề 6: Vùng Nam Bộ (Thành phố Hồ Chí Minh, Địa đạo Củ Chi)'
    ]
  },

  // LỚP 5
  'Lớp 5': {
    'Toán': [
      'Bài 1: Ôn tập và bổ sung về phân số, hỗn số',
      'Bài 2: Khái niệm số thập phân - Hàng của số thập phân',
      'Bài 3: So sánh số thập phân - Làm tròn số thập phân',
      'Bài 4: Phép cộng, phép trừ số thập phân',
      'Bài 5: Phép nhân, phép chia số thập phân',
      'Bài 6: Tỉ số và tỉ số phần trăm',
      'Bài 7: Các bài toán về tỉ số phần trăm',
      'Bài 8: Hình tam giác, hình thang - Diện tích hình tam giác, hình thang',
      'Bài 9: Hình tròn - Chu vi và diện tích hình tròn',
      'Bài 10: Hình hộp chữ nhật, hình lập phương - Thể tích',
      'Bài 11: Vận tốc, quãng đường, thời gian (Toán chuyển động đều)'
    ],
    'Tiếng Việt': [
      'Chủ điểm 1: Thế giới tuổi thơ',
      'Chủ điểm 2: Tự hào người Việt Nam',
      'Chủ điểm 3: Khám phá thế giới',
      'Chủ điểm 4: Tiếp bước cha ông',
      'Chủ điểm 5: Gìn giữ hòa bình',
      'Chủ điểm 6: Vì một hành tinh xanh'
    ],
    'Khoa học': [
      'Chủ đề 1: Chất (Sự biến đổi hóa học, Dung dịch, Hỗn hợp)',
      'Chủ đề 2: Năng lượng (Năng lượng mặt trời, gió, nước chảy, điện)',
      'Chủ đề 3: Thực vật và Động vật (Sự sinh sản của thực vật có hoa, động vật)',
      'Chủ đề 4: Vi khuẩn (Vai trò và tác hại)',
      'Chủ đề 5: Con người và Sức khỏe (Tuổi dậy thì, Phòng tránh ma túy)',
      'Chủ đề 6: Sinh vật và Môi trường (Bảo vệ tài nguyên, Môi trường sống)'
    ],
    'Lịch sử và Địa lí': [
      'Chủ đề 1: Đất nước và chủ quyền biển đảo Việt Nam',
      'Chủ đề 2: Nước Đại Cồ Việt và Nước Đại Việt',
      'Chủ đề 3: Triều Lý, Triều Trần, Triều Hậu Lê và Triều Nguyễn',
      'Chủ đề 4: Cách mạng tháng Tám 1945 và Hai cuộc kháng chiến vĩ đại',
      'Chủ đề 5: Đổi mới và Hội nhập quốc tế của Việt Nam',
      'Chủ đề 6: Các châu lục trên thế giới và Biển - Đại dương'
    ]
  },

  // LỚP 6
  'Lớp 6': {
    'Toán': [
      'Chương 1: Tập hợp các số tự nhiên (Tập hợp, Luỹ thừa, Chia hết, Số nguyên tố)',
      'Chương 2: Tính chia hết trong tập hợp các số tự nhiên',
      'Chương 3: Số nguyên (Số nguyên âm, Phép cộng, trừ, nhân, chia số nguyên)',
      'Chương 4: Một số hình phẳng trong thực tiễn (Tam giác đều, Hình vuông, Lục giác đều, Hình thoi, Hình bình hành, Hình thang cân)',
      'Chương 5: Tính đối xứng của hình phẳng trong tự nhiên',
      'Chương 6: Phân số (Khái niệm, So sánh, Các phép tính với phân số)',
      'Chương 7: Số thập phân (Khái niệm, Tỉ số phần trăm, Bài toán thực tế)',
      'Chương 8: Những hình học cơ bản (Điểm, Đường thẳng, Đoạn thẳng, Góc)',
      'Chương 9: Dữ liệu và xác suất thực nghiệm'
    ],
    'Ngữ văn': [
      'Bài 1: Tôi và các bạn (Truyện đồng thoại)',
      'Bài 2: Gõ cửa trái tim (Thơ)',
      'Bài 3: Yêu thương và chia sẻ (Truyện ngụ ngôn, truyện ngắn)',
      'Bài 4: Quê hương yêu dấu (Thơ lục bát)',
      'Bài 5: Những nẻo đường xứ sở (Kí, du kí)',
      'Bài 6: Chuyện kể về những người anh hùng (Truyền thuyết)',
      'Bài 7: Thế giới cổ tích (Truyện cổ tích)',
      'Bài 8: Khác biệt và gần gũi (Văn bản nghị luận)',
      'Bài 9: Trái Đất - ngôi nhà chung (Văn bản thông tin)'
    ],
    'Khoa học tự nhiên': [
      'Bài 1: Giới thiệu về Khoa học tự nhiên',
      'Bài 2: An toàn trong phòng thực hành',
      'Bài 3: Sử dụng kính lúp',
      'Bài 4: Sử dụng kính hiển vi quang học',
      'Bài 5: Đo chiều dài',
      'Bài 6: Đo khối lượng',
      'Bài 7: Đo thời gian',
      'Bài 8: Đo nhiệt độ',
      'Bài 9: Sự đa dạng của chất',
      'Bài 10: Các thể của chất và sự chuyển thể',
      'Bài 11: Oxygen - Không khí',
      'Bài 12: Một số vật liệu',
      'Bài 13: Một số nguyên liệu',
      'Bài 14: Một số nhiên liệu',
      'Bài 15: Một số lương thực, thực phẩm',
      'Bài 16: Hỗn hợp các chất',
      'Bài 17: Tách chất khỏi hỗn hợp',
      'Bài 18: Tế bào - Đơn vị cơ bản của sự sống',
      'Bài 19: Cấu tạo và chức năng các thành phần của tế bào',
      'Bài 20: Sự lớn lên và sinh sản của tế bào',
      'Bài 21: Thực hành: Quan sát và phân biệt một số loại tế bào',
      'Bài 22: Cơ thể sinh vật',
      'Bài 23: Tổ chức cơ thể đa bào',
      'Bài 24: Thực hành: Quan sát và mô tả cơ thể đơn bào, cơ thể đa bào',
      'Bài 25: Hệ thống phân loại sinh vật',
      'Bài 26: Khoá lưỡng phân',
      'Bài 27: Vi khuẩn',
      'Bài 28: Thực hành: Làm sữa chua và quan sát vi khuẩn',
      'Bài 29: Virus',
      'Bài 30: Nguyên sinh vật',
      'Bài 31: Thực hành: Quan sát nguyên sinh vật',
      'Bài 32: Nấm',
      'Bài 33: Thực hành: Quan sát các loại nấm',
      'Bài 34: Thực vật',
      'Bài 35: Thực hành: Quan sát và phân biệt một số nhóm thực vật',
      'Bài 36: Động vật',
      'Bài 37: Thực hành: Quan sát và nhận biết một số nhóm động vật ngoài thiên nhiên',
      'Bài 38: Đa dạng sinh học',
      'Bài 39: Tìm hiểu sinh vật ngoài thiên nhiên',
      'Bài 40: Lực là gì?',
      'Bài 41: Biểu diễn lực',
      'Bài 42: Biến dạng của lò xo',
      'Bài 43: Trọng lượng, lực hấp dẫn',
      'Bài 44: Lực ma sát',
      'Bài 45: Lực cản của nước',
      'Bài 46: Năng lượng và sự truyền năng lượng',
      'Bài 47: Một số dạng năng lượng',
      'Bài 48: Sự chuyển hoá năng lượng',
      'Bài 49: Năng lượng hao phí',
      'Bài 50: Năng lượng tái tạo',
      'Bài 51: Tiết kiệm năng lượng',
      'Bài 52: Chuyển động nhìn thấy của Mặt Trời. Thiên thể',
      'Bài 53: Mặt Trăng',
      'Bài 54: Hệ Mặt Trời',
      'Bài 55: Ngân Hà'
    ],
    'Hoạt động trải nghiệm, hướng nghiệp': [
      'Chủ đề 1: Em với nhà trường - Bài 1: Lớp học mới của em',
      'Chủ đề 1: Em với nhà trường - Bài 2: Truyền thống trường em',
      'Chủ đề 1: Em với nhà trường - Bài 3: Điều chỉnh bản thân cho phù hợp với môi trường học tập mới',
      'Chủ đề 1: Em với nhà trường - Bài 4: Em và các bạn',
      'Chủ đề 2: Khám phá bản thân - Bài 1: Em đã lớn hơn',
      'Chủ đề 2: Khám phá bản thân - Bài 2: Đức tính đặc trưng của em',
      'Chủ đề 2: Khám phá bản thân - Bài 3: Sở thích và khả năng của em',
      'Chủ đề 2: Khám phá bản thân - Bài 4: Những giá trị của bản thân',
      'Chủ đề 3: Trách nhiệm với bản thân - Bài 1: Tự chăm sóc bản thân',
      'Chủ đề 3: Trách nhiệm với bản thân - Bài 2: Ứng phó với thiên tai',
      'Chủ đề 4: Rèn luyện bản thân - Bài 1: Góc học tập của em',
      'Chủ đề 4: Rèn luyện bản thân - Bài 2: Sắp xếp nơi ở của em',
      'Chủ đề 4: Rèn luyện bản thân - Bài 3: Giao tiếp phù hợp',
      'Chủ đề 4: Rèn luyện bản thân - Bài 4: Chi tiêu hợp lí',
      'Chủ đề 5: Em với gia đình - Bài 1: Động viên, chăm sóc người thân trong gia đình',
      'Chủ đề 5: Em với gia đình - Bài 2: Giải quyết một số vấn đề nảy sinh trong gia đình',
      'Chủ đề 5: Em với gia đình - Bài 3: Em làm việc nhà',
      'Chủ đề 6: Em với cộng đồng - Bài 1: Thiết lập quan hệ với cộng đồng',
      'Chủ đề 6: Em với cộng đồng - Bài 2: Em tham gia hoạt động thiện nguyện',
      'Chủ đề 6: Em với cộng đồng - Bài 3: Hành vi có văn hóa nơi công cộng',
      'Chủ đề 6: Em với cộng đồng - Bài 4: Truyền thống quê em',
      'Chủ đề 7: Em với thiên nhiên và môi trường - Bài 1: Khám phá cảnh quan thiên nhiên',
      'Chủ đề 7: Em với thiên nhiên và môi trường - Bài 2: Bảo tồn cảnh quan thiên nhiên',
      'Chủ đề 7: Em với thiên nhiên và môi trường - Bài 3: Ứng phó với biến đổi khí hậu',
      'Chủ đề 8: Khám phá thế giới nghề nghiệp - Bài 1: Thế giới nghề nghiệp quanh ta',
      'Chủ đề 8: Khám phá thế giới nghề nghiệp - Bài 2: Khám phá nghề truyền thống ở nước ta',
      'Chủ đề 8: Khám phá thế giới nghề nghiệp - Bài 3: Trải nghiệm nghề truyền thống',
      'Chủ đề 9: Hiểu bản thân - chọn đúng nghề - Bài 1: Em với nghề truyền thống',
      'Chủ đề 9: Hiểu bản thân - chọn đúng nghề - Bài 2: Em làm nghề truyền thống'
    ],
    'Lịch sử và Địa lí': [
      'Lịch sử - Chương 1: Vì sao cần học Lịch sử?',
      'Lịch sử - Chương 2: Xã hội nguyên thủy',
      'Lịch sử - Chương 3: Xã hội cổ đại (Ai Cập, Lưỡng Hà, Ấn Độ, Trung Quốc, Hy Lạp, La Mã)',
      'Lịch sử - Chương 4: Đông Nam Á từ những thế kỉ đầu Công nguyên đến thế kỉ X',
      'Lịch sử - Chương 5: Việt Nam từ thế kỉ VII TCN đến đầu thế kỉ X (Văn Lang, Âu Lạc, Thời Bắc thuộc)',
      'Địa lí - Chương 1: Bản đồ - Phương tiện thể hiện bề mặt Trái Đất',
      'Địa lí - Chương 2: Trái Đất - Hành tinh của Hệ Mặt Trời',
      'Địa lí - Chương 3: Cấu tạo của Trái Đất. Vỏ Trái Đất và tác động của nội lực, ngoại lực',
      'Địa lí - Chương 4: Khí hậu và biến đổi khí hậu',
      'Địa lí - Chương 5: Nước trên Trái Đất',
      'Địa lí - Chương 6: Đất và sinh vật trên Trái Đất',
      'Địa lí - Chương 7: Con người và thiên nhiên'
    ],
    'Tin học': [
      'Chủ đề 1: Máy tính và cộng đồng (Thông tin và dữ liệu, Biểu diễn thông tin)',
      'Chủ đề 2: Mạng máy tính và Internet',
      'Chủ đề 3: Tổ chức lưu trữ, tìm kiếm và trao đổi thông tin',
      'Chủ đề 4: Đạo đức, pháp luật và văn hóa trong môi trường số',
      'Chủ đề 5: Ứng dụng tin học (Soạn thảo văn bản, Sơ đồ tư duy)',
      'Chủ đề 6: Thuật toán và lập trình trực quan (Scratch)'
    ],
    'Tiếng Anh': [
      'Unit 1: My New School',
      'Unit 2: My House',
      'Unit 3: My Friends',
      'Unit 4: My Neighbourhood',
      'Unit 5: Natural Wonders of Viet Nam',
      'Unit 6: Our Tet Holiday',
      'Unit 7: Television',
      'Unit 8: Sports and Games',
      'Unit 9: Cities of the World',
      'Unit 10: Our Houses in the Future',
      'Unit 11: Our Greener World',
      'Unit 12: Robots'
    ]
  },

  // LỚP 7
  'Lớp 7': {
    'Toán': [
      'Chương 1: Số hữu tỉ (Cộng, trừ, nhân, chia số hữu tỉ, Luỹ thừa)',
      'Chương 2: Số thực (Căn bậc hai số học, Số vô tỉ, Giá trị tuyệt đối)',
      'Chương 3: Góc và đường thẳng song song (Hai góc đối đỉnh, Tia phân giác)',
      'Chương 4: Tam giác bằng nhau (Các trường hợp c-c-c, c-g-c, g-c-g, Tam giác cân)',
      'Chương 5: Thu thập và biểu diễn dữ liệu (Biểu đồ đoạn thẳng, Biểu đồ hình quạt tròn)',
      'Chương 6: Tỉ lệ thức và đại lượng tỉ lệ (Tỉ lệ thuận, Tỉ lệ nghịch)',
      'Chương 7: Biểu thức đại số và đa thức một biến',
      'Chương 8: Quan hệ giữa các yếu tố trong một tam giác (Bất đẳng thức tam giác, Ba đường trung tuyến, phân giác, trung trực, cao)',
      'Chương 9: Hình lăng trụ đứng tam giác, hình lăng trụ đứng tứ giác',
      'Chương 10: Xác suất của biến cố'
    ],
    'Ngữ văn': [
      'Bài 1: Bầu trời tuổi thơ (Truyện ngắn, tiểu thuyết)',
      'Bài 2: Khúc nhạc tâm hồn (Thơ bốn chữ, năm chữ)',
      'Bài 3: Hình ảnh người dũng sĩ (Truyện ký, sử thi)',
      'Bài 4: Giai điệu đất nước (Thơ lục bát, tùy bút)',
      'Bài 5: Màu sắc trăm miền (Văn bản thông tin)',
      'Bài 6: Bài học cuộc sống (Truyện ngụ ngôn)',
      'Bài 7: Thế giới viễn tưởng (Truyện khoa học viễn tưởng)',
      'Bài 8: Trải nghiệm để trưởng thành (Nghị luận xã hội)',
      'Bài 9: Hòa điệu với tự nhiên (Nghị luận văn học)'
    ],
    'Khoa học tự nhiên': [
      'Bài 1: Phương pháp và kĩ năng học tập môn Khoa học tự nhiên',
      'Bài 2: Nguyên tử',
      'Bài 3: Nguyên tố hóa học',
      'Bài 4: Sơ lược về bảng tuần hoàn các nguyên tố hóa học',
      'Bài 5: Phân tử - Đơn chất - Hợp chất',
      'Bài 6: Giới thiệu về liên kết hóa học',
      'Bài 7: Hóa trị và công thức hóa học',
      'Bài 8: Tốc độ chuyển động',
      'Bài 9: Đồ thị quãng đường - thời gian',
      'Bài 10: Đo tốc độ',
      'Bài 11: Tốc độ và an toàn giao thông',
      'Bài 12: Mô tả sóng âm',
      'Bài 13: Độ to và độ cao của âm',
      'Bài 14: Phản xạ âm',
      'Bài 15: Ánh sáng, tia sáng',
      'Bài 16: Sự phản xạ ánh sáng',
      'Bài 17: Ảnh của vật tạo bởi gương phẳng',
      'Bài 18: Nam châm',
      'Bài 19: Từ trường',
      'Bài 20: Từ trường Trái Đất - Sử dụng la bàn',
      'Bài 21: Nam châm điện',
      'Bài 22: Vai trò của trao đổi chất và chuyển hóa năng lượng ở sinh vật',
      'Bài 23: Quang hợp ở thực vật',
      'Bài 24: Thực hành: Chứng minh quang hợp ở cây xanh',
      'Bài 25: Hô hấp tế bào',
      'Bài 26: Một số yếu tố ảnh hưởng đến hô hấp tế bào',
      'Bài 27: Thực hành: Hô hấp ở thực vật',
      'Bài 28: Trao đổi khí ở sinh vật',
      'Bài 29: Vai trò của nước và chất dinh dưỡng đối với sinh vật',
      'Bài 30: Trao đổi nước và chất dinh dưỡng ở thực vật',
      'Bài 31: Trao đổi nước và chất dinh dưỡng ở động vật',
      'Bài 32: Thực hành: Chứng minh thân vận chuyển nước và lá thoát hơi nước',
      'Bài 33: Cảm ứng ở sinh vật và tập tính ở động vật',
      'Bài 34: Vận dụng hiện tượng cảm ứng ở sinh vật vào thực tiễn',
      'Bài 35: Thực hành: Cảm ứng ở sinh vật',
      'Bài 36: Khái quát về sinh trưởng và phát triển ở sinh vật',
      'Bài 37: Ứng dụng sinh trưởng và phát triển ở sinh vật vào thực tiễn',
      'Bài 38: Thực hành: Quan sát, mô tả sự sinh trưởng và phát triển ở một số sinh vật',
      'Bài 39: Sinh sản vô tính ở sinh vật',
      'Bài 40: Sinh sản hữu tính ở sinh vật',
      'Bài 41: Một số yếu tố ảnh hưởng và điều hòa, điều khiển sinh sản ở sinh vật',
      'Bài 42: Cơ thể sinh vật là một thể thống nhất'
    ],
    'Hoạt động trải nghiệm, hướng nghiệp': [
      'Chủ đề 1: Rèn luyện thói quen - Bài 1: Rèn luyện thói quen ngăn nắp, gọn gàng',
      'Chủ đề 1: Rèn luyện thói quen - Bài 2: Rèn luyện tính kiên trì, chăm chỉ',
      'Chủ đề 1: Rèn luyện thói quen - Bài 3: Rèn luyện tính tự chủ',
      'Chủ đề 1: Rèn luyện thói quen - Bài 4: Rèn luyện kĩ năng quản lí thời gian',
      'Chủ đề 2: Rèn luyện kĩ năng - Bài 1: Ứng phó với tâm lí căng thẳng',
      'Chủ đề 2: Rèn luyện kĩ năng - Bài 2: Rèn luyện kĩ năng giao tiếp',
      'Chủ đề 2: Rèn luyện kĩ năng - Bài 3: Rèn luyện kĩ năng giải quyết vấn đề',
      'Chủ đề 2: Rèn luyện kĩ năng - Bài 4: Rèn luyện kĩ năng ra quyết định',
      'Chủ đề 3: Xây dựng tình bạn, tình thầy trò - Bài 1: Xây dựng tình bạn',
      'Chủ đề 3: Xây dựng tình bạn, tình thầy trò - Bài 2: Giữ gìn tình bạn',
      'Chủ đề 3: Xây dựng tình bạn, tình thầy trò - Bài 3: Xây dựng mối quan hệ với thầy cô',
      'Chủ đề 3: Xây dựng tình bạn, tình thầy trò - Bài 4: Giải quyết mâu thuẫn trong quan hệ bạn bè',
      'Chủ đề 4: Sống có trách nhiệm - Bài 1: Trách nhiệm với bản thân',
      'Chủ đề 4: Sống có trách nhiệm - Bài 2: Trách nhiệm với gia đình',
      'Chủ đề 4: Sống có trách nhiệm - Bài 3: Trách nhiệm với cộng đồng',
      'Chủ đề 4: Sống có trách nhiệm - Bài 4: Trách nhiệm với môi trường',
      'Chủ đề 5: Em với gia đình - Bài 1: Chăm sóc người thân',
      'Chủ đề 5: Em với gia đình - Bài 2: Chia sẻ công việc gia đình',
      'Chủ đề 5: Em với gia đình - Bài 3: Giải quyết vấn đề trong gia đình',
      'Chủ đề 6: Em với cộng đồng - Bài 1: Tham gia hoạt động cộng đồng',
      'Chủ đề 6: Em với cộng đồng - Bài 2: Xây dựng văn hóa ứng xử nơi công cộng',
      'Chủ đề 6: Em với cộng đồng - Bài 3: Bảo vệ môi trường sống',
      'Chủ đề 7: Em với thiên nhiên - Bài 1: Khám phá cảnh quan thiên nhiên',
      'Chủ đề 7: Em với thiên nhiên - Bài 2: Bảo tồn cảnh quan thiên nhiên',
      'Chủ đề 7: Em với thiên nhiên - Bài 3: Tuyên truyền bảo vệ thiên nhiên',
      'Chủ đề 8: Khám phá nghề nghiệp - Bài 1: Các nhóm nghề cơ bản',
      'Chủ đề 8: Khám phá nghề nghiệp - Bài 2: Khám phá nghề em quan tâm',
      'Chủ đề 8: Khám phá nghề nghiệp - Bài 3: Rèn luyện phẩm chất, năng lực phù hợp với nghề',
      'Chủ đề 9: Hiểu bản thân - chọn đúng nghề - Bài 1: Xác định điểm mạnh, điểm yếu của bản thân',
      'Chủ đề 9: Hiểu bản thân - chọn đúng nghề - Bài 2: Xác định sở thích nghề nghiệp',
      'Chủ đề 9: Hiểu bản thân - chọn đúng nghề - Bài 3: Lập kế hoạch phát triển bản thân'
    ]
  },

  // LỚP 8
  'Lớp 8': {
    'Toán': [
      'Chương 1: Đa thức nhiều biến (Cộng, trừ, nhân, chia đơn thức, đa thức)',
      'Chương 2: Hằng đẳng thức đáng nhớ và ứng dụng',
      'Chương 3: Tứ giác (Hình thang cân, Hình bình hành, Hình chữ nhật, Hình thoi, Hình vuông)',
      'Chương 4: Định lí Thalès trong tam giác',
      'Chương 5: Dữ liệu và biểu đồ (Tần số, Biểu đồ tần số)',
      'Chương 6: Phân thức đại số',
      'Chương 7: Phương trình bậc nhất và hàm số bậc nhất',
      'Chương 8: Mở đầu về tính xác suất của biến cố',
      'Chương 9: Tam giác đồng dạng',
      'Chương 10: Một số hình khối trong thực tiễn (Hình chóp tam giác đều, tứ giác đều)'
    ],
    'Ngữ văn': [
      'Bài 1: Câu chuyện của lịch sử (Truyện lịch sử)',
      'Bài 2: Vẻ đẹp cổ điển (Thơ Đường luật)',
      'Bài 3: Lời sông núi (Văn bản nghị luận trung đại)',
      'Bài 4: Tiếng cười trào phúng trong đời sống (Hài kịch, Thơ trào phúng)',
      'Bài 5: Những gương mặt thân yêu (Truyện ngắn hiện đại)',
      'Bài 6: Chân dung cuộc sống (Truyện kí)',
      'Bài 7: Tin yêu và ước vọng (Thơ tự do)',
      'Bài 8: Nhà văn và trang viết (Văn bản nghị luận văn học)'
    ],
    'Khoa học tự nhiên': [
      'Bài 1: Sử dụng một số hóa chất, thiết bị cơ bản trong phòng thí nghiệm',
      'Bài 2: Phản ứng hóa học',
      'Bài 3: Mol và tỉ khối chất khí',
      'Bài 4: Dung dịch và nồng độ',
      'Bài 5: Định luật bảo toàn khối lượng và phương trình hóa học',
      'Bài 6: Tính theo phương trình hóa học',
      'Bài 7: Tốc độ phản ứng và chất xúc tác',
      'Bài 8: Acid',
      'Bài 9: Base. Thang pH',
      'Bài 10: Oxide',
      'Bài 11: Muối',
      'Bài 12: Phân bón hóa học',
      'Bài 13: Khối lượng riêng',
      'Bài 14: Thực hành xác định khối lượng riêng',
      'Bài 15: Áp suất trên một bề mặt',
      'Bài 16: Áp suất chất lỏng. Áp suất khí quyển',
      'Bài 17: Lực đẩy Archimedes',
      'Bài 18: Tác dụng làm quay của lực. Moment lực',
      'Bài 19: Đòn bẩy và ứng dụng',
      'Bài 20: Hiện tượng nhiễm điện do cọ xát',
      'Bài 21: Dòng điện, nguồn điện',
      'Bài 22: Mạch điện đơn giản',
      'Bài 23: Tác dụng của dòng điện',
      'Bài 24: Cường độ dòng điện và hiệu điện thế',
      'Bài 25: Thực hành đo cường độ dòng điện và hiệu điện thế',
      'Bài 26: Năng lượng nhiệt và nội năng',
      'Bài 27: Thực hành đo năng lượng nhiệt bằng Joulemeter',
      'Bài 28: Sự truyền nhiệt',
      'Bài 29: Sự nở vì nhiệt',
      'Bài 30: Khái quát về cơ thể người',
      'Bài 31: Hệ vận động ở người',
      'Bài 32: Dinh dưỡng và tiêu hóa ở người',
      'Bài 33: Máu và hệ tuần hoàn của cơ thể người',
      'Bài 34: Hệ hô hấp ở người',
      'Bài 35: Hệ bài tiết ở người',
      'Bài 36: Điều hòa môi trường trong của cơ thể người',
      'Bài 37: Hệ thần kinh và các giác quan ở người',
      'Bài 38: Hệ nội tiết ở người',
      'Bài 39: Da và điều hòa thân nhiệt ở người',
      'Bài 40: Sinh sản ở người',
      'Bài 41: Môi trường và các nhân tố sinh thái',
      'Bài 42: Quần thể sinh vật',
      'Bài 43: Quần xã sinh vật',
      'Bài 44: Hệ sinh thái',
      'Bài 45: Sinh quyển',
      'Bài 46: Cân bằng tự nhiên',
      'Bài 47: Bảo vệ môi trường'
    ],
    'Hoạt động trải nghiệm, hướng nghiệp': [
      'Chủ đề 1: Em với nhà trường - Bài 1: Xây dựng và giữ gìn tình bạn',
      'Chủ đề 1: Em với nhà trường - Bài 2: Phòng, tránh bắt nạt học đường',
      'Chủ đề 1: Em với nhà trường - Bài 3: Xây dựng truyền thống nhà trường',
      'Chủ đề 2: Khám phá bản thân - Bài 1: Tính cách và cảm xúc của tôi',
      'Chủ đề 2: Khám phá bản thân - Bài 2: Khả năng tranh biện, thương thuyết của tôi',
      'Chủ đề 3: Trách nhiệm với bản thân - Bài 1: Sống có trách nhiệm',
      'Chủ đề 3: Trách nhiệm với bản thân - Bài 2: Kĩ năng từ chối',
      'Chủ đề 4: Rèn luyện bản thân - Bài 1: Người tiêu dùng thông thái',
      'Chủ đề 4: Rèn luyện bản thân - Bài 2: Nhà kinh doanh nhỏ',
      'Chủ đề 4: Rèn luyện bản thân - Bài 3: Rèn luyện sự tự chủ',
      'Chủ đề 5: Em với gia đình - Bài 1: Tôn trọng, thuyết phục và ứng xử để người thân hài lòng',
      'Chủ đề 5: Em với gia đình - Bài 2: Tiết kiệm và thực hiện công việc gia đình',
      'Chủ đề 6: Em với cộng đồng - Bài 1: Tham gia các hoạt động giáo dục truyền thống và phát triển cộng đồng ở địa phương',
      'Chủ đề 6: Em với cộng đồng - Bài 2: Lập và thực hiện kế hoạch thiện nguyện',
      'Chủ đề 7: Em với thiên nhiên và môi trường - Bài 1: Khảo sát thực trạng môi trường tự nhiên',
      'Chủ đề 7: Em với thiên nhiên và môi trường - Bài 2: Bảo vệ môi trường tự nhiên',
      'Chủ đề 8: Khám phá thế giới nghề nghiệp - Bài 1: Nghề phổ biến trong xã hội hiện đại',
      'Chủ đề 9: Hiểu bản thân - Chọn đúng nghề - Bài 1: Hứng thú nghề nghiệp',
      'Chủ đề 9: Hiểu bản thân - Chọn đúng nghề - Bài 2: Rèn luyện, học tập theo định hướng nghề nghiệp'
    ]
  },

  // LỚP 9
  'Lớp 9': {
    'Toán': [
      'Chương 1: Phương trình và hệ hai phương trình bậc nhất hai ẩn',
      'Chương 2: Phương trình bậc hai một ẩn và Định lí Viète',
      'Chương 3: Căn thức (Căn bậc hai, Căn bậc ba)',
      'Chương 4: Hệ thức lượng trong tam giác vuông',
      'Chương 5: Đường tròn (Vị trí tương đối, Tiếp tuyến, Dây cung)',
      'Chương 6: Hàm số y = ax² (a ≠ 0)',
      'Chương 7: Tần số và tần số tương đối - Bảng tần số',
      'Chương 8: Xác suất của biến cố trong một số mô hình xác suất đơn giản',
      'Chương 9: Góc với đường tròn (Góc ở tâm, Góc nội tiếp, Tứ giác nội tiếp)',
      'Chương 10: Một số hình khối trong thực tiễn (Hình trụ, Hình nón, Hình cầu)'
    ],
    'Ngữ văn': [
      'Bài 1: Trái tim người mẹ (Truyện ngắn)',
      'Bài 2: Vẻ đẹp của thơ ca (Thơ hiện đại)',
      'Bài 3: Tiếng nói của tư tưởng (Nghị luận xã hội)',
      'Bài 4: Đố vui và trí tuệ dân gian (Văn học dân gian)',
      'Bài 5: Khát vọng hòa bình (Truyện kí lịch sử)',
      'Bài 6: Đọc - hiểu kịch bản văn học (Kịch hiện đại)',
      'Bài 7: Hồn thiêng đất nước (Thơ ca cách mạng)',
      'Bài 8: Khám phá bí ẩn tự nhiên (Văn bản thông tin)'
    ],
    'Khoa học tự nhiên': [
      'Bài 1: Nhận biết một số dụng cụ, hóa chất. Thuyết trình một vấn đề khoa học',
      'Bài 2: Động năng. Thế năng',
      'Bài 3: Cơ năng',
      'Bài 4: Công và công suất',
      'Bài 5: Khúc xạ ánh sáng',
      'Bài 6: Phản xạ toàn phần',
      'Bài 7: Lăng kính',
      'Bài 8: Thấu kính',
      'Bài 9: Thực hành đo tiêu cự của thấu kính hội tụ',
      'Bài 10: Kính lúp. Bài tập thấu kính',
      'Bài 11: Điện trở. Định luật Ohm',
      'Bài 12: Đoạn mạch nối tiếp, song song',
      'Bài 13: Năng lượng của dòng điện và công suất điện',
      'Bài 14: Cảm ứng điện từ. Nguyên tắc tạo ra dòng điện xoay chiều',
      'Bài 15: Tác dụng của dòng điện xoay chiều',
      'Bài 16: Vòng năng lượng trên Trái Đất. Năng lượng hóa thạch',
      'Bài 17: Một số dạng năng lượng tái tạo',
      'Bài 18: Tính chất chung của kim loại',
      'Bài 19: Dãy hoạt động hóa học',
      'Bài 20: Tách kim loại và việc sử dụng hợp kim',
      'Bài 21: Sự khác nhau cơ bản giữa phi kim và kim loại',
      'Bài 22: Giới thiệu về hợp chất hữu cơ',
      'Bài 23: Alkane',
      'Bài 24: Alkene',
      'Bài 25: Nguồn nhiên liệu',
      'Bài 26: Ethylic alcohol',
      'Bài 27: Acetic acid',
      'Bài 28: Lipid',
      'Bài 29: Carbohydrate. Glucose và saccharose',
      'Bài 30: Tinh bột và cellulose',
      'Bài 31: Protein',
      'Bài 32: Polymer',
      'Bài 33: Sơ lược về hóa học vỏ Trái Đất và khai thác tài nguyên từ vỏ Trái Đất',
      'Bài 34: Khai thác đá vôi. Công nghiệp silicate',
      'Bài 35: Khai thác nhiên liệu hóa thạch. Nguồn carbon. Chu trình carbon và sự ấm lên toàn cầu',
      'Bài 36: Khái quát về di truyền học',
      'Bài 37: Các quy luật di truyền của Mendel',
      'Bài 38: Nucleic acid và gene',
      'Bài 39: Tái bản DNA và phiên mã tạo RNA',
      'Bài 40: Dịch mã và mối quan hệ từ gene đến tính trạng',
      'Bài 41: Đột biến gene',
      'Bài 42: Nhiễm sắc thể và bộ nhiễm sắc thể',
      'Bài 43: Nguyên phân và giảm phân',
      'Bài 44: Nhiễm sắc thể giới tính và cơ chế xác định giới tính',
      'Bài 45: Di truyền liên kết',
      'Bài 46: Đột biến nhiễm sắc thể',
      'Bài 47: Di truyền học với con người',
      'Bài 48: Ứng dụng công nghệ di truyền vào đời sống',
      'Bài 49: Khái niệm tiến hóa và các hình thức chọn lọc',
      'Bài 50: Cơ chế tiến hóa',
      'Bài 51: Sự phát sinh và phát triển sự sống trên Trái Đất'
    ],
    'Hoạt động trải nghiệm, hướng nghiệp': [
      'Chủ đề 1: Em với nhà trường - Bài 1: Tôn trọng sự khác biệt và sống hài hòa với bạn bè, thầy cô',
      'Chủ đề 1: Em với nhà trường - Bài 2: Phòng chống bắt nạt học đường',
      'Chủ đề 1: Em với nhà trường - Bài 3: Xây dựng truyền thống nhà trường và lập kế hoạch lao động công ích',
      'Chủ đề 2: Khám phá bản thân - Bài 1: Nhận diện điểm tích cực và chưa tích cực trong hành vi giao tiếp, ứng xử của bản thân',
      'Chủ đề 2: Khám phá bản thân - Bài 2: Khám phá khả năng thích nghi của bản thân',
      'Chủ đề 3: Trách nhiệm với bản thân - Bài 1: Trách nhiệm với nhiệm vụ được giao',
      'Chủ đề 3: Trách nhiệm với bản thân - Bài 2: Ứng phó với căng thẳng và áp lực',
      'Chủ đề 4: Rèn luyện bản thân - Bài 1: Tạo động lực cho bản thân',
      'Chủ đề 4: Rèn luyện bản thân - Bài 2: Xây dựng ngân sách cá nhân hợp lí',
      'Chủ đề 5: Em với gia đình - Bài 1: Tạo bầu không khí vui vẻ, yêu thương và giải quyết bất đồng trong gia đình',
      'Chủ đề 5: Em với gia đình - Bài 2: Tổ chức, sắp xếp khoa học công việc gia đình',
      'Chủ đề 5: Em với gia đình - Bài 3: Biện pháp phát triển kinh tế gia đình',
      'Chủ đề 6: Em với cộng đồng - Bài 1: Xây dựng và phát triển cộng đồng',
      'Chủ đề 6: Em với cộng đồng - Bài 2: Khảo sát thực trạng giao tiếp của học sinh trên mạng xã hội',
      'Chủ đề 6: Em với cộng đồng - Bài 3: Truyền thông trong cộng đồng về những vấn đề học đường',
      'Chủ đề 7: Em với thiên nhiên và môi trường - Bài 1: Việt Nam – Tổ quốc tôi',
      'Chủ đề 7: Em với thiên nhiên và môi trường - Bài 2: Phòng chống ô nhiễm và bảo vệ môi trường',
      'Chủ đề 8: Khám phá thế giới nghề nghiệp - Bài 1: Nghề em quan tâm',
      'Chủ đề 9: Hiểu bản thân – Chọn đúng nghề - Bài 1: Hệ thống các cơ sở giáo dục nghề nghiệp của trung ương và địa phương',
      'Chủ đề 9: Hiểu bản thân – Chọn đúng nghề - Bài 2: Rèn luyện, phát triển bản thân theo yêu cầu của định hướng nghề nghiệp'
    ]
  },

  // LỚP 10
  'Lớp 10': {
    'Toán': [
      'Chương 1: Mệnh đề và tập hợp',
      'Chương 2: Bất phương trình và hệ bất phương trình bậc nhất hai ẩn',
      'Chương 3: Hàm số bậc hai và đồ thị',
      'Chương 4: Hệ thức lượng trong tam giác (Định lí sin, Định lí cos, Công thức diện tích)',
      'Chương 5: Vectơ (Tổng, hiệu, tích vectơ với một số, Tích vô hướng)',
      'Chương 6: Thống kê (Số đặc trưng đo xu thế trung tâm và độ phân tán)',
      'Chương 7: Phương pháp tọa độ trong mặt phẳng (Đường thẳng, Đường tròn, Ba đường conic)',
      'Chương 8: Đại số tổ hợp (Quy tắc đếm, Hoán vị, Chỉnh hợp, Tổ hợp, Nhị thức Newton)',
      'Chương 9: Tính xác suất theo định nghĩa cổ điển'
    ],
    'Ngữ văn': [
      'Bài 1: Sức sống của sử thi (Sử thi Đăm Săn, Sử thi Ô-đi-xê)',
      'Bài 2: Vẻ đẹp của thơ ca truyền thống (Thơ chữ Hán Nguyễn Du, Thơ Hồ Xuân Hương)',
      'Bài 3: Nghệ thuật thuyết phục trong văn nghị luận (Hịch tướng sĩ, Bình Ngô đại cáo)',
      'Bài 4: Sức sống của chèo và tuồng (Quan Âm Thị Kính, Tuồng Sơn Hậu)',
      'Bài 5: Tích trò sân khấu dân gian',
      'Bài 6: Bản sắc văn hóa dân tộc',
      'Bài 7: Đất nước và con người trong thơ hiện đại',
      'Bài 8: Cuộc sống qua lăng kính văn xuôi'
    ],
    'Vật lí': [
      'Chương 1: Mở đầu (Làm quen với Vật lí, Các phép đo và sai số)',
      'Chương 2: Động học (Độ dịch chuyển, Vận tốc, Gia tốc, Chuyển động thẳng biến đổi đều, Rơi tự do)',
      'Chương 3: Động lực học (Ba định luật Newton, Các loại lực: Hấp dẫn, Ma sát, Đàn hồi, Căng dây)',
      'Chương 4: Năng lượng, công, công suất (Định luật bảo toàn năng lượng, Hiệu suất)',
      'Chương 5: Động lượng (Xung lượng của lực, Định luật bảo toàn động lượng, Va chạm)',
      'Chương 6: Chuyển động tròn (Tốc độ góc, Gia tốc hướng tâm, Lực hướng tâm)',
      'Chương 7: Biến dạng của vật rắn (Định luật Hooke, Ứng suất, Biến dạng kéo, nén)'
    ],
    'Hóa học': [
      'Chương 1: Cấu tạo nguyên tử (Hạt nhân, Vỏ electron, Cấu hình electron)',
      'Chương 2: Bảng tuần hoàn các nguyên tố hóa học và Định luật tuần hoàn',
      'Chương 3: Liên kết hóa học (Liên kết ion, Liên kết cộng hóa trị, Liên kết hydrogen, Tương tác van der Waals)',
      'Chương 4: Phản ứng oxi hóa - khử (Số oxi hóa, Cân bằng phản ứng)',
      'Chương 5: Năng lượng hóa học (Enthalpy tạo thành, Biến thiên enthalpy của phản ứng)',
      'Chương 6: Tốc độ phản ứng hóa học (Các yếu tố ảnh hưởng, Biểu thức tốc độ)',
      'Chương 7: Nguyên tố nhóm VIIA (Halogen - Tính chất, Ứng dụng)'
    ],
    'Sinh học': [
      'Chương 1: Thành phần hóa học của tế bào (Nước, Carbohydrate, Lipid, Protein, Nucleic acid)',
      'Chương 2: Cấu trúc tế bào (Tế bào nhân sơ, Tế bào nhân thực, Màng sinh chất, Bào quan)',
      'Chương 3: Trao đổi chất qua màng và Chuyển hóa năng lượng (Vận chuyển thụ động, chủ động, Hô hấp tế bào, Quang hợp)',
      'Chương 4: Chu kì tế bào và Phân bào (Nguyên phân, Giảm phân, Ung thư)',
      'Chương 5: Vi sinh vật và Virus (Sinh trưởng, Các bệnh do virus, Ứng dụng công nghệ vi sinh)'
    ],
    'Lịch sử': [
      'Chương 1: Lịch sử và Sử học',
      'Chương 2: Vai trò của sử học',
      'Chương 3: Một số nền văn minh cổ - trung đại phương Đông (Ai Cập, Ấn Độ, Trung Hoa)',
      'Chương 4: Một số nền văn minh cổ - trung đại phương Tây (Hy Lạp, La Mã, Phục hưng)',
      'Chương 5: Văn minh Đông Nam Á cổ - trung đại',
      'Chương 6: Một số nền văn minh trên đất nước Việt Nam (Văn minh Văn Lang - Âu Lạc, Chăm-pa, Phù Nam, Đại Việt)'
    ],
    'Địa lí': [
      'Chương 1: Sử dụng bản đồ',
      'Chương 2: Trái Đất (Vũ trụ, Chuyển động của Trái Đất và các hệ quả)',
      'Chương 3: Thạch quyển (Nội lực, Ngoại lực, Địa hình)',
      'Chương 4: Khí quyển (Nhiệt độ, Khí áp, Gió, Mưa, Khí hậu)',
      'Chương 5: Thủy quyển (Nước ngầm, Sông ngòi, Hồ, Sóng, Thủy triều, Dòng biển)',
      'Chương 6: Thổ nhưỡng quyển và Sinh quyển',
      'Chương 7: Địa lí dân cư thế giới',
      'Chương 8: Các ngành kinh tế (Nông nghiệp, Công nghiệp, Dịch vụ)'
    ]
  },

  // LỚP 11
  'Lớp 11': {
    'Toán': [
      'Chương 1: Hàm số lượng giác và phương trình lượng giác',
      'Chương 2: Dãy số. Cấp số cộng và cấp số nhân',
      'Chương 3: Các số đặc trưng đo xu thế trung tâm của mẫu số liệu ghép nhóm',
      'Chương 4: Quan hệ song song trong không gian',
      'Chương 5: Giới hạn. Hàm số liên tục',
      'Chương 6: Hàm số mũ và hàm số lôgarit',
      'Chương 7: Đạo hàm (Khái niệm, Ý nghĩa, Quy tắc tính đạo hàm)',
      'Chương 8: Quan hệ vuông góc trong không gian (Đường thẳng ⊥ mặt phẳng, Hai mặt phẳng vuông góc, Khoảng cách, Góc)',
      'Chương 9: Xác suất (Biến cố hợp, biến cố giao, Công thức nhân xác suất)'
    ],
    'Ngữ văn': [
      'Bài 1: Câu chuyện và cách kể (Truyện ngắn hiện thực Nam Cao, Vũ Trọng Phụng)',
      'Bài 2: Cấu tứ và hình ảnh trong thơ trữ tình (Thơ mới: Xuân Diệu, Huy Cận, Hàn Mặc Tử)',
      'Bài 3: Khát vọng tự do và công lí trong văn học',
      'Bài 4: Nghệ thuật tự sự trong tiểu thuyết hiện đại',
      'Bài 5: Tiếng cười thế sự và nhân sinh',
      'Bài 6: Nguyễn Du và Truyện Kiều trong dòng chảy văn hóa',
      'Bài 7: Gương mặt văn học thế giới',
      'Bài 8: Khám phá thế giới đa chiều'
    ],
    'Vật lí': [
      'Chương 1: Dao động (Dao động điều hòa, Con lắc lò xo, Con lắc đơn, Dao động tắt dần, cộng hưởng)',
      'Chương 2: Sóng (Sóng cơ, Giao thoa sóng, Sóng dừng, Sóng âm, Sóng điện từ, Ánh sáng đơn sắc)',
      'Chương 3: Điện trường (Điện trường đều, Thế năng điện, Điện thế, Tụ điện)',
      'Chương 4: Dòng điện không đổi (Điện trở, Định luật Ohm toàn mạch, Nguồn điện, Năng lượng điện)'
    ],
    'Hóa học': [
      'Chương 1: Cân bằng hóa học (Khái niệm, Hằng số cân bằng, Sự điện li, pH)',
      'Chương 2: Nitrogen và Sulfur (Ammonia, Nitric acid, Muối ammonium, Sulfur dioxide, Sulfuric acid)',
      'Chương 3: Đại cương về Hóa học hữu cơ (Công thức phân tử, Cấu trúc phân tử, Đồng phân)',
      'Chương 4: Hydrocarbon (Alkane, Alkene, Alkyne, Arene)',
      'Chương 5: Dẫn xuất Halogen - Alcohol - Phenol',
      'Chương 6: Hợp chất Carbonyl (Aldehyde, Ketone) - Carboxylic acid'
    ],
    'Sinh học': [
      'Chương 1: Trao đổi chất và chuyển hóa năng lượng ở sinh vật (Ở thực vật: Nước, khoáng, Quang hợp, Hô hấp; Ở động vật: Tiêu hóa, Tuần hoàn, Hô hấp, Bài tiết)',
      'Chương 2: Cảm ứng ở sinh vật (Thực vật và động vật, Hệ thần kinh, Giác quan)',
      'Chương 3: Sinh trưởng và phát triển ở sinh vật (Hormone thực vật, Phát triển ở động vật)',
      'Chương 4: Sinh sản ở sinh vật (Sinh sản vô tính, hữu tính ở thực vật và động vật)'
    ]
  },

  // LỚP 12
  'Lớp 12': {
    'Toán': [
      'Chương 1: Ứng dụng đạo hàm để khảo sát và vẽ đồ thị của hàm số (Đơn điệu, Cực trị, GTLN-GTNN, Tiệm cận, Đồ thị)',
      'Chương 2: Toạ độ vectơ trong không gian (Hệ toạ độ Oxyz, Biểu thức toạ độ, Tích có hướng)',
      'Chương 3: Các số đặc trưng đo mức độ phân tán của mẫu số liệu ghép nhóm (Phương sai, Độ lệch chuẩn, Khoảng biến thiên)',
      'Chương 4: Nguyên hàm và Tích phân (Khái niệm, Tính chất, Ứng dụng tính diện tích, thể tích)',
      'Chương 5: Phương pháp toạ độ trong không gian (Phương trình mặt phẳng, Đường thẳng, Mặt cầu)',
      'Chương 6: Xác suất có điều kiện (Công thức xác suất toàn phần, Công thức Bayes)'
    ],
    'Ngữ văn': [
      'Bài 1: Khát vọng độc lập và tự do (Tuyên ngôn Độc lập, Thơ Tố Hữu)',
      'Bài 2: Thế giới thơ ca hiện đại (Tây Tiến, Đất Nước, Sóng)',
      'Bài 3: Chân dung con người Việt Nam trong kháng chiến (Vợ chồng A Phủ, Vợ nhặt, Rừng xà nu)',
      'Bài 4: Phong cách văn xuôi thời kì Đổi mới (Chiếc thuyền ngoài xa, Hồn Trương Ba da hàng thịt)',
      'Bài 5: Văn học và những bài học nhân sinh',
      'Bài 6: Vẻ đẹp phong cách tác giả văn học',
      'Bài 7: Nhìn lại lịch sử và văn hóa dân tộc',
      'Bài 8: Khám phá chân trời nghệ thuật'
    ],
    'Vật lí': [
      'Chương 1: Vật lí nhiệt (Mô hình động học phân tử chất khí, Nội năng, Định luật I Nhiệt động lực học, Nhiệt nóng chảy, nhiệt hóa hơi)',
      'Chương 2: Khí lí tưởng (Phương trình trạng thái khí lí tưởng, Định luật Boyle, Charles, Áp suất chất khí)',
      'Chương 3: Từ trường (Cảm ứng từ, Lực từ, Lực Lorentz, Hiện tượng cảm ứng điện từ, Tự cảm)',
      'Chương 4: Vật lí hạt nhân (Cấu tạo hạt nhân, Độ hụt khối, Năng lượng liên kết, Phóng xạ, Phản ứng phân hạch, nhiệt hạch)'
    ],
    'Hóa học': [
      'Chương 1: Ester - Lipid (Cấu tạo, Tính chất, Xà phòng và chất giặt rửa tổng hợp)',
      'Chương 2: Carbohydrate (Glucose, Fructose, Saccharose, Tinh bột, Cellulose)',
      'Chương 3: Hợp chất chứa Nitrogen (Amine, Amino acid, Peptide, Protein, Enzyme)',
      'Chương 4: Polymer (Cấu trúc, Tính chất, Vật liệu polymer: Chất dẻo, Tơ, Cao su, Keo dán)',
      'Chương 5: Pin điện và Điện phân (Thế điện cực chuẩn, Ăn mòn kim loại, Điện phân)',
      'Chương 6: Đại cương về kim loại (Tính chất vật lí, hóa học, Điều chế kim loại)',
      'Chương 7: Nguyên tố nhóm IA, IIA và Kim loại chuyển tiếp dãy thứ nhất (Phức chất cơ bản)'
    ],
    'Sinh học': [
      'Chương 1: Di truyền phân tử và Di truyền tế bào (Cơ chế nhân đôi DNA, Phiên mã, Dịch mã, Điều hòa hoạt động gene, Đột biến)',
      'Chương 2: Nhiễm sắc thể và Quy luật di truyền (Mendel, Morgan, Liên kết gene, Hoán vị gene, Di truyền liên kết giới tính)',
      'Chương 3: Di truyền quần thể và Ứng dụng di truyền học (Chọn giống, Liệu pháp gene)',
      'Chương 4: Tiến hóa (Thuyết tiến hóa hiện đại, Loài và hình thành loài, Lịch sử phát triển sinh giới)',
      'Chương 5: Sinh thái học và Môi trường (Cá thể, Quần thể, Quần xã, Hệ sinh thái, Sinh quyển, Phát triển bền vững)'
    ],
    'Lịch sử': [
      'Chương 1: Thế giới trong và sau Chiến tranh Lạnh (Trật tự thế giới hai cực I-an-ta, Xu thế toàn cầu hóa)',
      'Chương 2: ASEAN: Những chặng đường lịch sử (Sự ra đời, mở rộng và thành tựu của ASEAN)',
      'Chương 3: Cách mạng tháng Tám năm 1945, Chiến tranh giải phóng dân tộc và Chiến tranh bảo vệ Tổ quốc trong lịch sử Việt Nam',
      'Chương 4: Công cuộc Đổi mới ở Việt Nam từ năm 1986 đến nay',
      'Chương 5: Lịch sử đối ngoại của Việt Nam thời kì cận - hiện đại',
      'Chương 6: Hồ Chí Minh trong lịch sử Việt Nam'
    ],
    'Địa lí': [
      'Chương 1: Vị trí địa lí và phạm vi lãnh thổ Việt Nam',
      'Chương 2: Địa lí tự nhiên Việt Nam (Địa hình, Khí hậu, Thủy văn, Đất, Sinh vật, Biển đảo)',
      'Chương 3: Địa lí dân cư Việt Nam (Dân số, Lao động, Đô thị hóa)',
      'Chương 4: Địa lí các ngành kinh tế Việt Nam (Nông nghiệp, Lâm nghiệp, Thủy sản, Công nghiệp, Dịch vụ)',
      'Chương 5: Địa lí các vùng kinh tế Việt Nam (7 vùng kinh tế và Vùng kinh tế trọng điểm)',
      'Chương 6: Phát triển kinh tế biển và đảm bảo quốc phòng an ninh'
    ]
  }
};

// Danh mục 4 mức độ nhận thức chuẩn Chương trình GDPT 2018
export interface CognitiveLevelInfo {
  id: string;
  name: 'Nhận biết' | 'Thông hiểu' | 'Vận dụng' | 'Vận dụng cao';
  badgeColor: string;
  desc: string;
  actionVerbs: string[];
}

export const COGNITIVE_LEVELS_INFO: CognitiveLevelInfo[] = [
  {
    id: 'nhan_biet',
    name: 'Nhận biết',
    badgeColor: 'bg-sky-100 text-sky-800 border-sky-300',
    desc: 'Nhận diện, nhắc lại, nêu tên, phát biểu định nghĩa, công thức, số liệu, sự kiện trong SGK Kết nối tri thức.',
    actionVerbs: ['Nhận biết', 'Nêu', 'Liệt kê', 'Chỉ ra', 'Xác định', 'Phát biểu']
  },
  {
    id: 'thong_hieu',
    name: 'Thông hiểu',
    badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    desc: 'Giải thích bản chất, so sánh, phân biệt, làm rõ nguyên nhân - kết quả, tóm tắt ý nghĩa kiến thức.',
    actionVerbs: ['Giải thích', 'So sánh', 'Phân biệt', 'Minh họa', 'Chứng minh', 'Tóm tắt']
  },
  {
    id: 'van_dung',
    name: 'Vận dụng',
    badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
    desc: 'Vận dụng công thức, quy tắc đã học để giải bài tập, tính toán hoặc xử lý tình huống thực tế quen thuộc.',
    actionVerbs: ['Tính toán', 'Áp dụng', 'Giải quyết', 'Thực hiện', 'Vận dụng', 'Xử lý']
  },
  {
    id: 'van_dung_cao',
    name: 'Vận dụng cao',
    badgeColor: 'bg-purple-100 text-purple-800 border-purple-300',
    desc: 'Vận dụng tổng hợp liên môn, tư duy phản biện, đánh giá, phát hiện và giải quyết vấn đề mới trong đời sống.',
    actionVerbs: ['Phân tích', 'Đánh giá', 'Đề xuất', 'Thiết kế', 'Sáng tạo', 'Tổng hợp']
  }
];

export interface AssessmentMatrix {
  id: string;
  name: string;
  description: string;
  distribution: {
    nhan_biet: number; // percentage (e.g. 40)
    thong_hieu: number; // percentage (e.g. 30)
    van_dung: number; // percentage (e.g. 20)
    van_dung_cao: number; // percentage (e.g. 10)
  };
}

export const STANDARD_ASSESSMENT_MATRICES: AssessmentMatrix[] = [
  {
    id: 'standard',
    name: 'Chuẩn Bộ GD&ĐT (40% - 30% - 20% - 10%)',
    description: 'Ma trận chuẩn đánh giá định kì phân hóa toàn diện năng lực học sinh',
    distribution: { nhan_biet: 40, thong_hieu: 30, van_dung: 20, van_dung_cao: 10 }
  },
  {
    id: 'practice',
    name: 'Ôn tập & Củng cố (50% - 30% - 20% - 0%)',
    description: 'Tập trung củng cố kiến thức nền tảng và kĩ năng làm bài cơ bản',
    distribution: { nhan_biet: 50, thong_hieu: 30, van_dung: 20, van_dung_cao: 0 }
  },
  {
    id: 'advanced',
    name: 'Phát triển năng lực cao (20% - 30% - 30% - 20%)',
    description: 'Tăng cường câu hỏi tình huống thực tế và tư duy giải quyết vấn đề mới',
    distribution: { nhan_biet: 20, thong_hieu: 30, van_dung: 30, van_dung_cao: 20 }
  },
  {
    id: 'balanced',
    name: 'Phân bổ đều (25% - 25% - 25% - 25%)',
    description: 'Chia đều câu hỏi cho cả 4 mức độ nhận thức',
    distribution: { nhan_biet: 25, thong_hieu: 25, van_dung: 25, van_dung_cao: 25 }
  }
];

// Danh mục Năng lực đặc thù theo môn học CT GDPT 2018
export const SUBJECT_COMPETENCIES: Record<string, string[]> = {
  'Toán': [
    'Năng lực tư duy và lập luận toán học',
    'Năng lực mô hình hóa toán học',
    'Năng lực giải quyết vấn đề toán học',
    'Năng lực giao tiếp toán học',
    'Năng lực sử dụng công cụ, phương tiện học toán'
  ],
  'Ngữ văn': [
    'Năng lực ngôn ngữ (Đọc hiểu, dùng từ, viết câu chuẩn ngữ pháp)',
    'Năng lực văn học (Cảm thụ thẩm mĩ, nhận biết hình tượng, thể loại)',
    'Năng lực tiếp nhận văn bản và kết nối thông điệp đời sống'
  ],
  'Tiếng Việt': [
    'Năng lực đọc đúng, đọc hiểu và mở rộng vốn từ',
    'Năng lực viết đúng chính tả, đặt câu và diễn đạt',
    'Năng lực cảm thụ câu chuyện, bài thơ tuổi thơ'
  ],
  'Khoa học tự nhiên': [
    'Năng lực nhận thức khoa học tự nhiên',
    'Năng lực tìm hiểu tự nhiên (quan sát, thực nghiệm)',
    'Năng lực vận dụng kiến thức, kĩ năng vào đời sống'
  ],
  'Vật lí': [
    'Năng lực nhận thức vật lí (định luật, hiện tượng, đại lượng)',
    'Năng lực tìm hiểu thế giới tự nhiên dưới góc độ vật lí',
    'Năng lực vận dụng kiến thức vật lí giải quyết vấn đề thực tiễn'
  ],
  'Hóa học': [
    'Năng lực nhận thức hóa học (danh pháp IUPAC, cấu tạo chất, phản ứng)',
    'Năng lực tìm hiểu thế giới tự nhiên dưới góc độ hóa học',
    'Năng lực vận dụng kiến thức hóa học vào đời sống và sản xuất'
  ],
  'Sinh học': [
    'Năng lực nhận thức sinh học (cấu tạo tế bào, di truyền, sinh thái)',
    'Năng lực tìm hiểu thế giới sống',
    'Năng lực vận dụng kiến thức sinh học vào bảo vệ sức khỏe và môi trường'
  ],
  'Lịch sử và Địa lí': [
    'Năng lực tìm hiểu lịch sử và địa lí (sử dụng tư liệu, bản đồ, số liệu)',
    'Năng lực nhận thức và tư duy lịch sử - địa lí',
    'Năng lực vận dụng kiến thức vào thực tiễn cuộc sống và lòng yêu nước'
  ],
  'Lịch sử': [
    'Năng lực tìm hiểu lịch sử (khai thác tư liệu, chứng cứ lịch sử)',
    'Năng lực nhận thức và tư duy lịch sử (nguyên nhân, ý nghĩa, bài học)',
    'Năng lực vận dụng bài học lịch sử vào thực tiễn'
  ],
  'Địa lí': [
    'Năng lực nhận thức khoa học địa lí',
    'Năng lực tìm hiểu địa lí (bản đồ, biểu đồ, số liệu thống kê)',
    'Năng lực vận dụng kiến thức địa lí giải quyết vấn đề môi trường, kinh tế'
  ],
  'Tiếng Anh': [
    'Năng lực giao tiếp ngôn ngữ (Từ vựng, ngữ pháp theo Unit SGK Global Success)',
    'Năng lực phát âm và ngữ âm',
    'Năng lực đọc hiểu và sử dụng ngôn ngữ trong tình huống thực tế'
  ],
  'Tin học': [
    'Năng lực sử dụng và quản lý các phương tiện công nghệ thông tin',
    'Năng lực ứng xử phù hợp trong môi trường số (Đạo đức số)',
    'Năng lực giải quyết vấn đề với sự trợ giúp của máy tính và thuật toán'
  ],
  'Công nghệ': [
    'Năng lực nhận thức công nghệ (vật liệu, kĩ thuật, an toàn)',
    'Năng lực giao tiếp và thiết kế công nghệ',
    'Năng lực sử dụng công nghệ và đánh giá tác động đời sống'
  ],
  'Giáo dục công dân': [
    'Năng lực điều chỉnh hành vi và chuẩn mực đạo đức',
    'Năng lực phát triển bản thân và tư duy tích cực',
    'Năng lực tham gia hoạt động kinh tế - xã hội và pháp luật'
  ],
  'Giáo dục kinh tế và pháp luật': [
    'Năng lực điều chỉnh hành vi theo quy định pháp luật',
    'Năng lực nhận thức kinh tế (thị trường, ngân sách, tài chính)',
    'Năng lực tìm hiểu và tham gia các hoạt động kinh tế - xã hội'
  ]
};

export function getSubjectCompetencies(subject: string): string[] {
  if (!subject) return ['Năng lực giải quyết vấn đề và sáng tạo', 'Năng lực tự chủ và tự học'];
  const key = Object.keys(SUBJECT_COMPETENCIES).find(s => 
    s.toLowerCase() === subject.trim().toLowerCase() ||
    subject.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(subject.toLowerCase())
  );
  return key ? SUBJECT_COMPETENCIES[key] : [
    'Năng lực nhận thức kiến thức môn học',
    'Năng lực vận dụng kiến thức vào thực tiễn',
    'Năng lực giải quyết vấn đề và sáng tạo'
  ];
}

export function getLessonsForSubjectAndGrade(grade: string, subject: string): string[] {
  if (!grade || !subject) return [];
  
  // Normalize grade string (e.g. "Lớp 6" or "6")
  const normGrade = normalizeGrade(grade);
  const gradeKey = (GRADES.find(g => g.toLowerCase() === normGrade.toLowerCase()) || 'Lớp 7') as keyof typeof KET_NOI_TRI_THUC_CURRICULUM;
                   
  const gradeData = KET_NOI_TRI_THUC_CURRICULUM[gradeKey];
  if (!gradeData) return [];

  // Find matching subject
  const subjectKey = Object.keys(gradeData).find(s => 
    s.toLowerCase() === subject.trim().toLowerCase() ||
    subject.toLowerCase().includes(s.toLowerCase()) ||
    s.toLowerCase().includes(subject.toLowerCase())
  );

  if (subjectKey && gradeData[subjectKey]) {
    return gradeData[subjectKey];
  }

  // Generic fallback lessons if not explicitly listed
  return [
    `Chủ đề 1: Ôn tập kiến thức cơ bản môn ${subject}`,
    `Chủ đề 2: Các khái niệm và định lí trọng tâm`,
    `Chủ đề 3: Luyện tập vận dụng thực tế`,
    `Chủ đề 4: Câu hỏi trắc nghiệm tổng hợp`,
    `Chủ đề 5: Đề kiểm tra đánh giá giữa kì`,
    `Chủ đề 6: Đề kiểm tra đánh giá cuối kì`
  ];
}

// Gợi ý Yêu cầu cần đạt (YCCĐ) theo môn học & khối lớp chuẩn GDPT 2018
export function getSampleLearningOutcomes(grade: string, subject: string, topic?: string): string[] {
  const g = (grade || '').toLowerCase();
  const s = (subject || '').toLowerCase();
  const t = (topic || '').toLowerCase();

  if (s.includes('toán')) {
    if (g.includes('1') || g.includes('2') || g.includes('3') || g.includes('4') || g.includes('5')) {
      return [
        'Nhận biết và đọc, viết đúng các số, cấu tạo số và so sánh các số trong phạm vi bài học.',
        'Thực hiện thành thạo các phép tính cộng, trừ, nhân, chia theo chuẩn SGK Kết nối tri thức.',
        'Nhận biết các hình phẳng, hình khối cơ bản và tính chu vi, diện tích trong các tình huống thực tế.',
        'Vận dụng kiến thức toán học để giải quyết các bài toán có lời văn gắn liền với đời sống hàng ngày.'
      ];
    } else if (g.includes('6') || g.includes('7') || g.includes('8') || g.includes('9')) {
      return [
        'Nắm vững định nghĩa, tính chất, quy tắc và công thức toán học trọng tâm của bài.',
        'Thực hiện chính xác các phép biến đổi đại số, giải phương trình/hệ phương trình hoặc tính toán hình học.',
        'Giải thích và chứng minh các quan hệ hình học (song song, vuông góc, bằng nhau, đồng dạng).',
        'Mô hình hóa và giải quyết bài toán thực tiễn bằng kiến thức số học, đại số hoặc hình học SGK Kết nối tri thức.'
      ];
    } else {
      return [
        'Hiểu rõ bản chất toán học của các khái niệm, định lí, công thức và phương pháp giải trong SGK.',
        'Vận dụng thành thạo các thuật toán, công thức tọa độ, tích phân, hàm số, xác suất giải bài tập.',
        'Phân tích, đánh giá và lập luận logic chặt chẽ khi giải quyết các bài toán phân hóa.',
        'Giải quyết các bài toán tối ưu, bài toán thực tiễn liên môn (Vật lí, Kinh tế, Sinh học).'
      ];
    }
  }

  if (s.includes('văn') || s.includes('tiếng việt')) {
    return [
      'Nhận biết được thể loại, phương thức biểu đạt, nhân vật, đề tài, chi tiết tiêu biểu trong văn bản SGK.',
      'Hiểu và phân tích được chủ đề, tư tưởng, tình cảm của tác giả và giá trị nghệ thuật của tác phẩm.',
      'Nhận diện và vận dụng đúng các biện pháp tu từ, quy tắc ngữ pháp, chính tả và từ ngữ tiếng Việt.',
      'Liên hệ bài học, thông điệp nhân văn từ tác phẩm với thực tiễn cuộc sống và bồi dưỡng phẩm chất đạo đức.'
    ];
  }

  if (s.includes('khoa học') || s.includes('vật lí') || s.includes('hóa') || s.includes('sinh')) {
    return [
      'Nhận biết các khái niệm, định luật, hiện tượng và công thức/danh pháp khoa học chuẩn IUPAC theo SGK Kết nối tri thức.',
      'Giải thích được nguyên nhân, bản chất cơ chế của các hiện tượng tự nhiên và quá trình biến đổi chất/năng lượng/sinh học.',
      'Tính toán định lượng, viết đúng phương trình phản ứng/công thức vật lí và xử lý số liệu thực nghiệm.',
      'Vận dụng kiến thức khoa học để giải thích hiện tượng thực tế đời sống, bảo vệ môi trường và sức khỏe.'
    ];
  }

  if (s.includes('lịch sử') || s.includes('địa lí')) {
    return [
      'Trình bày đúng mốc thời gian, địa danh, diễn biến chính của sự kiện lịch sử hoặc đặc điểm địa lí tự nhiên/kinh tế.',
      'Giải thích được nguyên nhân, ý nghĩa, bài học lịch sử hoặc mối quan hệ giữa các yếu tố tự nhiên và hoạt động kinh tế.',
      'Khai thác hiệu quả tư liệu lịch sử, bản đồ, Atlat, biểu đồ và bảng số liệu thống kê.',
      'Rút ra bài học thực tiễn, bồi dưỡng lòng yêu nước, tự hào dân tộc và ý thức trách nhiệm công dân.'
    ];
  }

  if (s.includes('tiếng anh')) {
    return [
      'Nhận biết và sử dụng chuẩn xác từ vựng, ngữ âm, cấu trúc ngữ pháp theo chủ đề Unit SGK Kết nối tri thức (Global Success).',
      'Đọc hiểu và nắm bắt thông tin chi tiết, ý chính trong các đoạn văn bản giao tiếp theo chủ điểm bài học.',
      'Vận dụng cấu trúc câu phù hợp vào tình huống giao tiếp hàng ngày, hỏi đáp và miêu tả thực tế.'
    ];
  }

  if (s.includes('tin học')) {
    return [
      'Nhận biết và giải thích đúng các khái niệm, nguyên lí hoạt động của máy tính, phần mềm và mạng Internet.',
      'Thực hiện thành thạo các thao tác ứng dụng công nghệ, soạn thảo, xử lý dữ liệu và thuật toán theo SGK Kết nối tri thức.',
      'Tuân thủ chuẩn mực đạo đức, pháp luật và văn hóa ứng xử an toàn trong không gian mạng.'
    ];
  }

  return [
    `Nắm vững chuẩn kiến thức và kĩ năng cốt lõi của bài học theo SGK Kết nối tri thức.`,
    `Hiểu và giải thích được mối quan hệ bản chất giữa các nội dung trong bài.`,
    `Vận dụng kiến thức môn ${subject} để giải quyết bài tập và tình huống thực tiễn đời sống.`
  ];
}
