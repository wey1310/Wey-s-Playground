import { EventCard } from './monopolyTypes';

export const EVENT_CARDS_DECK: EventCard[] = [
  {
    id: 'card_tourism_prize',
    title: 'Giải Thưởng Đại Sứ Du Lịch Việt Nam',
    type: 'money_gain',
    amount: 200,
    description: 'Quảng bá xuất sắc danh lam thắng cảnh Việt Nam! Nhận tài trợ +$200 từ Tổng cục Du lịch.',
    icon: '🏆',
    badge: 'May Mắn'
  },
  {
    id: 'card_fest_bonus',
    title: 'Lễ Hội Pháo Hoa Quốc Tế Đà Nẵng',
    type: 'money_gain',
    amount: 150,
    description: 'Khách sạn kín phòng mùa lễ hội pháo hoa! Thu về lợi nhuận du lịch +$150.',
    icon: '🎆',
    badge: 'May Mắn'
  },
  {
    id: 'card_cable_car',
    title: 'Vé Cáp Treo Fansipan Siêu Tốc',
    type: 'move_forward',
    steps: 3,
    description: 'Chinh phục nóc nhà Đông Dương bằng cáp treo hiện đại! Tiến nhanh 3 ô về phía trước.',
    icon: '🚠',
    badge: 'Cơ Hội'
  },
  {
    id: 'card_free_rent_shield',
    title: 'Thẻ Khách Quen VIP Khách Sạn',
    type: 'free_rent',
    description: 'Nhận thẻ ưu đãi VIP nghỉ dưỡng! Miễn phí 1 lần trả tiền thuê khi đáp vào khu đất của đối thủ.',
    icon: '🛡️',
    badge: 'Cơ Hội'
  },
  {
    id: 'card_birthday_party',
    title: 'Tiệc Nướng Ẩm Thực Ba Miền',
    type: 'all_give_money',
    amount: 50,
    description: 'Mời bạn bè thưởng thức đặc sản Phở Hà Nội, Bánh Xèo Miền Tây! Mỗi đội tặng bạn $50 làm quà.',
    icon: '🍲',
    badge: 'Cơ Hội'
  },
  {
    id: 'card_super_express',
    title: 'Chuyến Bay Thẳng Về Sân Bay Xuất Phát',
    type: 'goto_start',
    description: 'Bắt chuyến bay thẳng hạ cánh tại ô XUẤT PHÁT và nhận ngay lương thưởng vòng mới!',
    icon: '✈️',
    badge: 'May Mắn'
  },
  {
    id: 'card_eco_fund',
    title: 'Đóng Quỹ Bảo Tồn Rừng & Biển Đảo',
    type: 'money_loss',
    amount: 80,
    description: 'Chung tay ủng hộ quỹ trồng rừng và dọn sạch bãi biển quê hương. Trừ -$80 vào ngân hàng.',
    icon: '🌿',
    badge: 'Rủi Ro'
  },
  {
    id: 'card_step_back',
    title: 'Dừng Chân Ngắm Hoàng Hôn Eo Gió',
    type: 'move_backward',
    steps: 2,
    description: 'Cảnh đẹp Quy Nhơn níu chân du khách! Chậm lại 2 ô để chụp ảnh check-in.',
    icon: '📸',
    badge: 'Thử Thách'
  },
  {
    id: 'card_maintenance',
    title: 'Trùng Tu & Tôn Tạo Khu Nghỉ Dưỡng',
    type: 'property_tax',
    amount: 30,
    description: 'Bảo trì các bất động sản và khách sạn! Đóng $30 cho mỗi khu đất bạn đang sở hữu.',
    icon: '🛠️',
    badge: 'Rủi Ro'
  },
  {
    id: 'card_luck_heritage',
    title: 'Di Sản Văn Hóa Thế Giới UNESCO',
    type: 'money_gain',
    amount: 120,
    description: 'Công trình kiến trúc được vinh danh di sản quốc tế! Nhận thưởng bảo tồn +$120.',
    icon: '🏛️',
    badge: 'May Mắn'
  },
  {
    id: 'card_coffee_export',
    title: 'Mùa Vụ Cà Phê Buôn Ma Thuột',
    type: 'money_gain',
    amount: 100,
    description: 'Cà phê Tây Nguyên được mùa xuất khẩu ra thế giới! Thưởng nóng +$100.',
    icon: '☕',
    badge: 'Cơ Hội'
  },
  {
    id: 'card_speed_fine',
    title: 'Phạt Vi Phạm Tốc Độ Cao Tốc',
    type: 'money_loss',
    amount: 50,
    description: 'Chạy quá tốc độ quy định trên cao tốc Bắc - Nam. Nộp phạt kho bạc -$50.',
    icon: '🚓',
    badge: 'Rủi Ro'
  }
];

export function getRandomEventCard(): EventCard {
  const randomIndex = Math.floor(Math.random() * EVENT_CARDS_DECK.length);
  return { ...EVENT_CARDS_DECK[randomIndex] };
}

