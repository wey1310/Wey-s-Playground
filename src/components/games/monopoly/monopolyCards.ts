import { EventCard } from './monopolyTypes';

export const EVENT_CARDS_DECK: EventCard[] = [
  {
    id: 'card_scholarship',
    title: 'Học Bổng Tài Năng Trẻ',
    type: 'money_gain',
    amount: 200,
    description: 'Đạt thành tích xuất sắc trong kỳ thi nghiên cứu! Nhận học bổng +$200 từ Ngân Hàng.',
    icon: '🎓',
    badge: 'May Mắn'
  },
  {
    id: 'card_sci_prize',
    title: 'Giải Nhất Sáng Tạo STEM',
    type: 'money_gain',
    amount: 150,
    description: 'Mô hình robot đạt huy chương vàng triển lãm! Nhận phần thưởng +$150.',
    icon: '🏆',
    badge: 'May Mắn'
  },
  {
    id: 'card_rocket_advance',
    title: 'Tên Lửa Tri Thức',
    type: 'move_forward',
    steps: 3,
    description: 'Kích hoạt động cơ phản lực tri thức! Tiến nhanh 3 ô về phía trước.',
    icon: '🚀',
    badge: 'Cơ Hội'
  },
  {
    id: 'card_free_rent_shield',
    title: 'Khiên Miễn Phí Thuê Đất',
    type: 'free_rent',
    description: 'Nhận thẻ ưu đãi VIP! Miễn phí 1 lần trả tiền thuê khi đáp vào khu đất của đối thủ.',
    icon: '🛡️',
    badge: 'Cơ Hội'
  },
  {
    id: 'card_birthday_party',
    title: 'Sinh Nhật Đội Trưởng',
    type: 'all_give_money',
    amount: 50,
    description: 'Tổ chức sinh nhật vui vẻ! Mỗi đội khác tặng bạn $50 làm quà chúc mừng.',
    icon: '🎂',
    badge: 'Cơ Hội'
  },
  {
    id: 'card_super_express',
    title: 'Chuyến Tàu Siêu Tốc Về START',
    type: 'goto_start',
    description: 'Bắt chuyến tàu cao tốc bay thẳng về ô START và nhận ngay lương thưởng!',
    icon: '🚄',
    badge: 'May Mắn'
  },
  {
    id: 'card_class_fund',
    title: 'Đóng Quỹ Hoạt Động Lớp',
    type: 'money_loss',
    amount: 80,
    description: 'Đóng góp kinh phí chuẩn bị hội thao dã ngoại. Trừ -$80 vào ngân hàng.',
    icon: '💸',
    badge: 'Rủi Ro'
  },
  {
    id: 'card_step_back',
    title: 'Dừng Lại Đọc Sách',
    type: 'move_backward',
    steps: 2,
    description: 'Ghé vào thư viện ôn lại bài học. Lùi lại 2 ô.',
    icon: '📖',
    badge: 'Thử Thách'
  },
  {
    id: 'card_maintenance',
    title: 'Bảo Trì & Sơn Lại Nhà',
    type: 'property_tax',
    amount: 30,
    description: 'Trùng tu các công trình! Đóng $30 cho mỗi ngôi nhà/bất động sản bạn đang sở hữu.',
    icon: '🛠️',
    badge: 'Rủi Ro'
  },
  {
    id: 'card_luck_donation',
    title: 'Quỹ Tài Trợ Giáo Dục',
    type: 'money_gain',
    amount: 120,
    description: 'Được doanh nghiệp tài trợ dự án học tập! Nhận +$120.',
    icon: '🍀',
    badge: 'May Mắn'
  },
  {
    id: 'card_energy_bonus',
    title: 'Tiết Kiệm Năng Lượng Xanh',
    type: 'money_gain',
    amount: 100,
    description: 'Ứng dụng năng lượng mặt trời giúp tiết kiệm ngân sách! Thưởng +$100.',
    icon: '💡',
    badge: 'Cơ Hội'
  },
  {
    id: 'card_lost_book',
    title: 'Mượn Sách Quá Hạn',
    type: 'money_loss',
    amount: 50,
    description: 'Quên trả sách thư viện đúng hẹn. Nộp phạt -$50.',
    icon: '📚',
    badge: 'Rủi Ro'
  }
];

export function getRandomEventCard(): EventCard {
  const randomIndex = Math.floor(Math.random() * EVENT_CARDS_DECK.length);
  return { ...EVENT_CARDS_DECK[randomIndex] };
}
