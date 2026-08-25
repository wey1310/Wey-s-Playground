import { MonopolyTile } from './monopolyTypes';

export function createMonopolyBoard(
  theme: 'vietnam' | 'school' | 'science' | 'city' | 'fantasy' = 'vietnam',
  customOverrides?: Array<{
    id: number;
    name?: string;
    subtitle?: string;
    price?: number;
    baseRent?: number;
    upgradeCost?: number;
    groupName?: string;
    icon?: string;
  }>
): MonopolyTile[] {
  let board: MonopolyTile[];

  if (theme === 'science') {
    board = [
      // Bottom Row (0 -> 6)
      {
        id: 0,
        index: 0,
        name: 'START',
        subtitle: 'Trạm Vũ Trụ',
        type: 'start',
        icon: '🚀',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      {
        id: 1,
        index: 1,
        name: 'Hệ Mặt Trời',
        subtitle: 'Hành tinh xanh',
        type: 'property',
        group: 'purple',
        groupName: 'Thiên Văn Học',
        groupColor: '#9333ea',
        icon: '🪐',
        price: 100,
        baseRent: 15,
        level: 0,
        upgradeCost: 50,
        rentLevels: [15, 45, 90, 180],
        ownerTeamId: null
      },
      {
        id: 2,
        index: 2,
        name: 'Dải Ngân Hà',
        subtitle: 'Ngôi sao rực rỡ',
        type: 'property',
        group: 'purple',
        groupName: 'Thiên Văn Học',
        groupColor: '#9333ea',
        icon: '🌌',
        price: 120,
        baseRent: 20,
        level: 0,
        upgradeCost: 60,
        rentLevels: [20, 60, 120, 240],
        ownerTeamId: null
      },
      {
        id: 3,
        index: 3,
        name: 'CƠ HỘI',
        subtitle: 'Thẻ Sự Kiện',
        type: 'event',
        icon: '🎴',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      {
        id: 4,
        index: 4,
        name: 'Nguyên Tử & Hạt',
        subtitle: 'Vi mô kỳ thú',
        type: 'property',
        group: 'blue',
        groupName: 'Vật Lý Hạt',
        groupColor: '#2563eb',
        icon: '⚛️',
        price: 140,
        baseRent: 25,
        level: 0,
        upgradeCost: 70,
        rentLevels: [25, 75, 150, 300],
        ownerTeamId: null
      },
      {
        id: 5,
        index: 5,
        name: 'Năng Lượng Sóng',
        subtitle: 'Trường điện từ',
        type: 'property',
        group: 'blue',
        groupName: 'Vật Lý Hạt',
        groupColor: '#2563eb',
        icon: '⚡',
        price: 160,
        baseRent: 30,
        level: 0,
        upgradeCost: 80,
        rentLevels: [30, 90, 180, 360],
        ownerTeamId: null
      },

      // Corner 1: Left Bottom/Top (6)
      {
        id: 6,
        index: 6,
        name: 'PHÒNG THÍ NGHIỆM',
        subtitle: 'Trạm Cách Ly',
        type: 'jail',
        icon: '🧪',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },

      // Left Column (7 -> 11)
      {
        id: 7,
        index: 7,
        name: 'Phản Ứng Hóa Học',
        subtitle: 'Liên kết phân tử',
        type: 'property',
        group: 'green',
        groupName: 'Hóa Học',
        groupColor: '#16a34a',
        icon: '🧫',
        price: 180,
        baseRent: 35,
        level: 0,
        upgradeCost: 90,
        rentLevels: [35, 105, 210, 420],
        ownerTeamId: null
      },
      {
        id: 8,
        index: 8,
        name: 'Bảng Tuần Hoàn',
        subtitle: 'Nguyên tố quý',
        type: 'property',
        group: 'green',
        groupName: 'Hóa Học',
        groupColor: '#16a34a',
        icon: '📊',
        price: 200,
        baseRent: 40,
        level: 0,
        upgradeCost: 100,
        rentLevels: [40, 120, 240, 480],
        ownerTeamId: null
      },
      {
        id: 9,
        index: 9,
        name: 'DNA & Di Truyền',
        subtitle: 'Mã số sinh học',
        type: 'property',
        group: 'green',
        groupName: 'Hóa Học',
        groupColor: '#16a34a',
        icon: '🧬',
        price: 220,
        baseRent: 45,
        level: 0,
        upgradeCost: 110,
        rentLevels: [45, 135, 270, 540],
        ownerTeamId: null
      },
      {
        id: 10,
        index: 10,
        name: 'KHO BÁU MAY MẮN',
        subtitle: 'Quà Tài Trợ',
        type: 'luck',
        icon: '🍀',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      {
        id: 11,
        index: 11,
        name: 'Hệ Sinh Thái',
        subtitle: 'Rừng nhiệt đới',
        type: 'property',
        group: 'yellow',
        groupName: 'Sinh Thái Học',
        groupColor: '#ca8a04',
        icon: '🌿',
        price: 240,
        baseRent: 50,
        level: 0,
        upgradeCost: 120,
        rentLevels: [50, 150, 300, 600],
        ownerTeamId: null
      },

      // Corner 2: Top-Left (12)
      {
        id: 12,
        index: 12,
        name: 'TRẠM NGHỈ DƯỠNG',
        subtitle: 'Khu Bảo Tồn',
        type: 'rest',
        icon: '🏞️',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },

      // Top Row (13 -> 17)
      {
        id: 13,
        index: 13,
        name: 'Địa Cầu & Khí Hậu',
        subtitle: 'Khí quyển trái đất',
        type: 'property',
        group: 'yellow',
        groupName: 'Sinh Thái Học',
        groupColor: '#ca8a04',
        icon: '🌍',
        price: 260,
        baseRent: 55,
        level: 0,
        upgradeCost: 130,
        rentLevels: [55, 165, 330, 660],
        ownerTeamId: null
      },
      {
        id: 14,
        index: 14,
        name: 'Năng Lượng Tái Tạo',
        subtitle: 'Gió & Mặt trời',
        type: 'property',
        group: 'yellow',
        groupName: 'Sinh Thái Học',
        groupColor: '#ca8a04',
        icon: '☀️',
        price: 280,
        baseRent: 60,
        level: 0,
        upgradeCost: 140,
        rentLevels: [60, 180, 360, 720],
        ownerTeamId: null
      },
      {
        id: 15,
        index: 15,
        name: 'PHÍ NGHIÊN CỨU',
        subtitle: 'Bảo trì thiết bị',
        type: 'tax',
        icon: '🏛️',
        price: 80,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      {
        id: 16,
        index: 16,
        name: 'Trí Tuệ Nhân Tạo',
        subtitle: 'Học sâu & Thuật toán',
        type: 'property',
        group: 'orange',
        groupName: 'Công Nghệ Cao',
        groupColor: '#ea580c',
        icon: '🤖',
        price: 300,
        baseRent: 65,
        level: 0,
        upgradeCost: 150,
        rentLevels: [65, 195, 390, 780],
        ownerTeamId: null
      },
      {
        id: 17,
        index: 17,
        name: 'Điện Toán Lượng Tử',
        subtitle: 'Siêu máy tính',
        type: 'property',
        group: 'orange',
        groupName: 'Công Nghệ Cao',
        groupColor: '#ea580c',
        icon: '💻',
        price: 320,
        baseRent: 70,
        level: 0,
        upgradeCost: 160,
        rentLevels: [70, 210, 420, 840],
        ownerTeamId: null
      },

      // Corner 3: Top-Right (18)
      {
        id: 18,
        index: 18,
        name: 'VÀO PHÒNG CÁCH LY',
        subtitle: 'Sự cố thí nghiệm',
        type: 'goto_jail',
        icon: '🚨',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },

      // Right Column (19 -> 23)
      {
        id: 19,
        index: 19,
        name: 'Hàng Không Vũ Trụ',
        subtitle: 'Trạm không gian',
        type: 'property',
        group: 'red',
        groupName: 'Tương Lai',
        groupColor: '#dc2626',
        icon: '🛰️',
        price: 340,
        baseRent: 75,
        level: 0,
        upgradeCost: 170,
        rentLevels: [75, 225, 450, 900],
        ownerTeamId: null
      },
      {
        id: 20,
        index: 20,
        name: 'Khai Phá Sao Hỏa',
        subtitle: 'Thành phố tương lai',
        type: 'property',
        group: 'red',
        groupName: 'Tương Lai',
        groupColor: '#dc2626',
        icon: '🔴',
        price: 360,
        baseRent: 80,
        level: 0,
        upgradeCost: 180,
        rentLevels: [80, 240, 480, 960],
        ownerTeamId: null
      },
      {
        id: 21,
        index: 21,
        name: 'CƠ HỘI ĐỘT PHÁ',
        subtitle: 'Thẻ Sự Kiện',
        type: 'event',
        icon: '🎴',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      {
        id: 22,
        index: 22,
        name: 'Lỗ Sâu Không Gian',
        subtitle: 'Du hành thời gian',
        type: 'property',
        group: 'brown',
        groupName: 'Vũ Trụ Học',
        groupColor: '#78350f',
        icon: '🌀',
        price: 380,
        baseRent: 85,
        level: 0,
        upgradeCost: 190,
        rentLevels: [85, 255, 510, 1020],
        ownerTeamId: null
      },
      {
        id: 23,
        index: 23,
        name: 'Đại Hợp Nhất Vũ Trụ',
        subtitle: 'Kỳ quan khoa học',
        type: 'property',
        group: 'brown',
        groupName: 'Vũ Trụ Học',
        groupColor: '#78350f',
        icon: '👑',
        price: 400,
        baseRent: 90,
        level: 0,
        upgradeCost: 200,
        rentLevels: [90, 270, 540, 1080],
        ownerTeamId: null
      }
    ];
  } else {
    // Flagship Default Board: VIETNAMESE CITIES & ICONIC LANDMARKS (Bàn Cờ Tỷ Phú Việt Nam)
    board = [
      // 0: START (Điểm Khởi Hành)
      {
        id: 0,
        index: 0,
        name: 'XUẤT PHÁT',
        subtitle: 'Sân Bay Quốc Tế',
        type: 'start',
        icon: '✈️',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      // 1: Purple 1 - Cần Thơ
      {
        id: 1,
        index: 1,
        name: 'Cần Thơ',
        subtitle: 'Bến Ninh Kiều & Chợ Nổi',
        type: 'property',
        group: 'purple',
        groupName: 'Miền Tây Nam Bộ',
        groupColor: '#9333ea',
        icon: '⛵',
        price: 100,
        baseRent: 15,
        level: 0,
        upgradeCost: 50,
        rentLevels: [15, 45, 90, 180],
        ownerTeamId: null
      },
      // 2: Purple 2 - Phú Quốc
      {
        id: 2,
        index: 2,
        name: 'Phú Quốc',
        subtitle: 'Đảo Ngọc Thiên Đường',
        type: 'property',
        group: 'purple',
        groupName: 'Miền Tây Nam Bộ',
        groupColor: '#9333ea',
        icon: '🏝️',
        price: 120,
        baseRent: 20,
        level: 0,
        upgradeCost: 60,
        rentLevels: [20, 60, 120, 240],
        ownerTeamId: null
      },
      // 3: Event
      {
        id: 3,
        index: 3,
        name: 'CƠ HỘI',
        subtitle: 'Khám Phá Việt Nam',
        type: 'event',
        icon: '🎴',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      // 4: Blue 1 - Vũng Tàu
      {
        id: 4,
        index: 4,
        name: 'Vũng Tàu',
        subtitle: 'Bãi Sau & Mũi Nghinh Phong',
        type: 'property',
        group: 'blue',
        groupName: 'Đông Nam Bộ',
        groupColor: '#2563eb',
        icon: '🌊',
        price: 140,
        baseRent: 25,
        level: 0,
        upgradeCost: 70,
        rentLevels: [25, 75, 150, 300],
        ownerTeamId: null
      },
      // 5: Blue 2 - TP. Hồ Chí Minh
      {
        id: 5,
        index: 5,
        name: 'TP. Hồ Chí Minh',
        subtitle: 'Chợ Bến Thành & Landmark 81',
        type: 'property',
        group: 'blue',
        groupName: 'Đông Nam Bộ',
        groupColor: '#2563eb',
        icon: '🏙️',
        price: 160,
        baseRent: 30,
        level: 0,
        upgradeCost: 80,
        rentLevels: [30, 90, 180, 360],
        ownerTeamId: null
      },

      // Corner 6: Jail (Trạm Dừng Kiểm Tra / Vào Tù)
      {
        id: 6,
        index: 6,
        name: 'TRẠM NGHỈ TẠM',
        subtitle: 'Thăm / Bị Phạt',
        type: 'jail',
        icon: '🏛️',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },

      // 7: Green 1 - Đà Lạt
      {
        id: 7,
        index: 7,
        name: 'Đà Lạt',
        subtitle: 'Hồ Xuân Hương & Ngàn Hoa',
        type: 'property',
        group: 'green',
        groupName: 'Tây Nguyên & Nam Trung Bộ',
        groupColor: '#16a34a',
        icon: '🌲',
        price: 180,
        baseRent: 35,
        level: 0,
        upgradeCost: 90,
        rentLevels: [35, 105, 210, 420],
        ownerTeamId: null
      },
      // 8: Green 2 - Nha Trang
      {
        id: 8,
        index: 8,
        name: 'Nha Trang',
        subtitle: 'Tháp Bà Ponagar & Vịnh Biển',
        type: 'property',
        group: 'green',
        groupName: 'Tây Nguyên & Nam Trung Bộ',
        groupColor: '#16a34a',
        icon: '🏖️',
        price: 200,
        baseRent: 40,
        level: 0,
        upgradeCost: 100,
        rentLevels: [40, 120, 240, 480],
        ownerTeamId: null
      },
      // 9: Green 3 - Quy Nhơn
      {
        id: 9,
        index: 9,
        name: 'Quy Nhơn',
        subtitle: 'Eo Gió & Kỳ Co Tuyệt Đẹp',
        type: 'property',
        group: 'green',
        groupName: 'Tây Nguyên & Nam Trung Bộ',
        groupColor: '#16a34a',
        icon: '🌅',
        price: 220,
        baseRent: 45,
        level: 0,
        upgradeCost: 110,
        rentLevels: [45, 135, 270, 540],
        ownerTeamId: null
      },
      // 10: Luck
      {
        id: 10,
        index: 10,
        name: 'KHO BÁU DU LỊCH',
        subtitle: 'May Mắn Bất Ngờ',
        type: 'luck',
        icon: '🍀',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      // 11: Yellow 1 - Quảng Bình
      {
        id: 11,
        index: 11,
        name: 'Quảng Bình',
        subtitle: 'Hang Sơn Đoòng & Phong Nha',
        type: 'property',
        group: 'yellow',
        groupName: 'Di Sản Miền Trung',
        groupColor: '#ca8a04',
        icon: '⛰️',
        price: 240,
        baseRent: 50,
        level: 0,
        upgradeCost: 120,
        rentLevels: [50, 150, 300, 600],
        ownerTeamId: null
      },

      // Corner 12: Rest / Free Parking
      {
        id: 12,
        index: 12,
        name: 'KHU NGHỈ DƯỠNG',
        subtitle: 'Trạm Dừng Chân Sinh Thái',
        type: 'rest',
        icon: '🏞️',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },

      // 13: Yellow 2 - Huế
      {
        id: 13,
        index: 13,
        name: 'Cố Đô Huế',
        subtitle: 'Đại Nội & Chùa Thiên Mụ',
        type: 'property',
        group: 'yellow',
        groupName: 'Di Sản Miền Trung',
        groupColor: '#ca8a04',
        icon: '🏯',
        price: 260,
        baseRent: 55,
        level: 0,
        upgradeCost: 130,
        rentLevels: [55, 165, 330, 660],
        ownerTeamId: null
      },
      // 14: Yellow 3 - Hội An
      {
        id: 14,
        index: 14,
        name: 'Phố Cổ Hội An',
        subtitle: 'Chùa Cầu & Đèn Lồng Cổ',
        type: 'property',
        group: 'yellow',
        groupName: 'Di Sản Miền Trung',
        groupColor: '#ca8a04',
        icon: '🏮',
        price: 280,
        baseRent: 60,
        level: 0,
        upgradeCost: 140,
        rentLevels: [60, 180, 360, 720],
        ownerTeamId: null
      },
      // 15: Tax
      {
        id: 15,
        index: 15,
        name: 'PHÍ CAO TỐC BẮC - NAM',
        subtitle: 'Trạm Thu Phí BOT',
        type: 'tax',
        icon: '🛣️',
        price: 100,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      // 16: Orange 1 - Đà Nẵng
      {
        id: 16,
        index: 16,
        name: 'Đà Nẵng',
        subtitle: 'Cầu Rồng & Bà Nà Hills',
        type: 'property',
        group: 'orange',
        groupName: 'Đô Thị Đáng Sống',
        groupColor: '#ea580c',
        icon: '🌉',
        price: 300,
        baseRent: 65,
        level: 0,
        upgradeCost: 150,
        rentLevels: [65, 195, 390, 780],
        ownerTeamId: null
      },
      // 17: Orange 2 - Hải Phòng
      {
        id: 17,
        index: 17,
        name: 'Hải Phòng',
        subtitle: 'Hoa Phượng Đỏ & Quần Đảo Cát Bà',
        type: 'property',
        group: 'orange',
        groupName: 'Đô Thị Đáng Sống',
        groupColor: '#ea580c',
        icon: '⚓',
        price: 320,
        baseRent: 70,
        level: 0,
        upgradeCost: 160,
        rentLevels: [70, 210, 420, 840],
        ownerTeamId: null
      },

      // Corner 18: Go to Jail
      {
        id: 18,
        index: 18,
        name: 'VÀO TRẠM KIỂM SOÁT',
        subtitle: 'Vi Phạm Giao Thông',
        type: 'goto_jail',
        icon: '🚨',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },

      // 19: Red 1 - Sa Pa
      {
        id: 19,
        index: 19,
        name: 'Sa Pa',
        subtitle: 'Đỉnh Fansipan Nóc Nhà Đông Dương',
        type: 'property',
        group: 'red',
        groupName: 'Kỳ Quan Bắc Bộ',
        groupColor: '#dc2626',
        icon: '🏔️',
        price: 340,
        baseRent: 75,
        level: 0,
        upgradeCost: 170,
        rentLevels: [75, 225, 450, 900],
        ownerTeamId: null
      },
      // 20: Red 2 - Hạ Long
      {
        id: 20,
        index: 20,
        name: 'Vịnh Hạ Long',
        subtitle: 'Kỳ Quan Thiên Nhiên Thế Giới',
        type: 'property',
        group: 'red',
        groupName: 'Kỳ Quan Bắc Bộ',
        groupColor: '#dc2626',
        icon: '⛵',
        price: 360,
        baseRent: 80,
        level: 0,
        upgradeCost: 180,
        rentLevels: [80, 240, 480, 960],
        ownerTeamId: null
      },
      // 21: Event 2
      {
        id: 21,
        index: 21,
        name: 'CƠ HỘI ĐỘT PHÁ',
        subtitle: 'Thẻ Sự Kiện',
        type: 'event',
        icon: '🎴',
        price: 0,
        baseRent: 0,
        level: 0,
        upgradeCost: 0,
        rentLevels: [0, 0, 0, 0],
        ownerTeamId: null
      },
      // 22: Brown 1 - Hà Nội (Hồ Gươm)
      {
        id: 22,
        index: 22,
        name: 'Hà Nội - Hồ Gươm',
        subtitle: 'Tháp Rùa & 36 Phố Phường',
        type: 'property',
        group: 'brown',
        groupName: 'Thủ Đô Ngàn Năm Văn Hiến',
        groupColor: '#78350f',
        icon: '🐢',
        price: 380,
        baseRent: 85,
        level: 0,
        upgradeCost: 190,
        rentLevels: [85, 255, 510, 1020],
        ownerTeamId: null
      },
      // 23: Brown 2 - Hà Nội (Hoàng Thành & Ba Đình)
      {
        id: 23,
        index: 23,
        name: 'Hà Nội - Ba Đình',
        subtitle: 'Quảng Trường & Văn Miếu',
        type: 'property',
        group: 'brown',
        groupName: 'Thủ Đô Ngàn Năm Văn Hiến',
        groupColor: '#78350f',
        icon: '⭐',
        price: 400,
        baseRent: 90,
        level: 0,
        upgradeCost: 200,
        rentLevels: [90, 270, 540, 1080],
        ownerTeamId: null
      }
    ];
  }

  if (customOverrides && customOverrides.length > 0) {
    const overrideMap = new Map<number, typeof customOverrides[0]>();
    customOverrides.forEach(item => {
      overrideMap.set(item.id, item);
    });

    board = board.map(tile => {
      const override = overrideMap.get(tile.id);
      if (!override) return tile;

      const newPrice = override.price !== undefined ? override.price : tile.price;
      const newBaseRent = override.baseRent !== undefined ? override.baseRent : tile.baseRent;
      const newUpgradeCost = override.upgradeCost !== undefined ? override.upgradeCost : tile.upgradeCost;

      return {
        ...tile,
        name: override.name || tile.name,
        subtitle: override.subtitle !== undefined ? override.subtitle : tile.subtitle,
        groupName: override.groupName !== undefined ? override.groupName : tile.groupName,
        icon: override.icon || tile.icon,
        price: newPrice,
        baseRent: newBaseRent,
        upgradeCost: newUpgradeCost,
        rentLevels: [
          newBaseRent,
          Math.round(newBaseRent * 3),
          Math.round(newBaseRent * 6),
          Math.round(newBaseRent * 12)
        ]
      };
    });
  }

  return board;
}

