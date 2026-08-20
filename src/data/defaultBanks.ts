import type { QuestionBank } from "../types";

/**
 * 2 BỘ CÂU HỎI MẪU CHUẨN SGK KẾT NỐI TRI THỨC VỚI CUỘC SỐNG:
 * 1. KHTN 7 - Chương IV: Âm thanh (20 câu hỏi chuẩn)
 * 2. KHTN 8 - Chương V: Điện (20 câu hỏi chuẩn)
 */
export const DEFAULT_QUESTION_BANKS: QuestionBank[] = [
  // =========================================================================
  // 1. KHOA HỌC TỰ NHIÊN 7 - CHƯƠNG IV: ÂM THANH (20 CÂU HỎI)
  // SGK Kết nối tri thức: Bài 12 (Sóng âm), Bài 13 (Độ to & độ cao của âm), Bài 14 (Phản xạ âm, chống ô nhiễm tiếng ồn)
  // =========================================================================
  {
    id: 'bank_khtn7_chuong4_am_thanh',
    name: 'KHTN 7 - Chương IV: Âm thanh (Bài 12, 13, 14: Sóng âm, Độ to & Độ cao của âm, Phản xạ âm)',
    subject: 'Khoa học tự nhiên',
    grade: 'Lớp 7',
    topic: 'Chương IV. Âm thanh (Sóng âm, Độ cao, Độ to của âm, Phản xạ âm và Chống ô nhiễm tiếng ồn)',
    tags: ['KHTN 7', 'Kết nối tri thức', 'Chương 4', 'Âm thanh', 'Sóng âm', 'Vật lí 7'],
    isPreset: true,
    createdAt: '2026-08-16T12:00:00.000Z',
    description: 'Bộ 20 câu hỏi chuẩn SGK Kết nối tri thức: Nguồn âm, sự truyền sóng âm, tần số dao động (Hz), biên độ dao động, độ to (dB), phản xạ âm, tiếng vang và biện pháp giảm thiểu ô nhiễm tiếng ồn.',
    questions: [
      {
        id: 'khtn7_sound_01',
        type: 'mcq',
        content: 'Âm thanh (sóng âm) được tạo ra từ đâu?',
        options: [
          'Từ các vật đứng yên tuyệt đối',
          'Từ các vật dao động',
          'Từ các vật bị nung nóng',
          'Từ dòng điện chạy trong dây dẫn'
        ],
        correct: 1,
        explanation: 'Theo SGK KHTN 7 (Bài 12), mọi nguồn âm khi phát ra âm thanh đều dao động.'
      },
      {
        id: 'khtn7_sound_02',
        type: 'mcq',
        content: 'Sóng âm có thể truyền được qua các môi trường nào sau đây?',
        options: [
          'Chỉ truyền được qua chất khí',
          'Chất rắn, chất lỏng và chất khí',
          'Chất rắn và chất lỏng, không truyền qua chất khí',
          'Chất rắn, chất lỏng, chất khí và chân không'
        ],
        correct: 1,
        explanation: 'Sóng âm truyền được qua các môi trường vật chất: rắn, lỏng, khí và KHÔNG truyền được trong chân không.'
      },
      {
        id: 'khtn7_sound_03',
        type: 'mcq',
        content: 'Tốc độ truyền âm trong các môi trường được sắp xếp theo thứ tự giảm dần nào là đúng?',
        options: [
          'Chất khí > Chất lỏng > Chất rắn',
          'Chất lỏng > Chất rắn > Chất khí',
          'Chất rắn > Chất lỏng > Chất khí',
          'Chất rắn > Chất khí > Chất lỏng'
        ],
        correct: 2,
        explanation: 'Mật độ phân tử càng dày đặc thì truyền âm càng nhanh: V_rắn > V_lỏng > V_khí (ví dụ trong thép ~5000 m/s, trong nước ~1500 m/s, trong không khí ~340 m/s).'
      },
      {
        id: 'khtn7_sound_04',
        type: 'mcq',
        content: 'Số dao động của nguồn âm thực hiện được trong 1 giây được gọi là gì?',
        options: [
          'Biên độ dao động',
          'Tần số dao động',
          'Vận tốc truyền âm',
          'Độ to của âm'
        ],
        correct: 1,
        explanation: 'Tần số là số dao động thực hiện trong 1 giây, đơn vị là Héc (kí hiệu là Hz).'
      },
      {
        id: 'khtn7_sound_05',
        type: 'mcq',
        content: 'Đơn vị chuẩn dùng để đo tần số dao động là:',
        options: [
          'Mét trên giây (m/s)',
          'Đề-xi-ben (dB)',
          'Héc (Hz)',
          'Niu-tơn (N)'
        ],
        correct: 2,
        explanation: 'Đơn vị đo tần số là Héc (Hertz), viết tắt là Hz.'
      },
      {
        id: 'khtn7_sound_06',
        type: 'mcq',
        content: 'Độ cao (âm bổng hay âm trầm) của âm phát ra phụ thuộc trực tiếp vào yếu tố nào?',
        options: [
          'Biên độ dao động của nguồn âm',
          'Tần số dao động của nguồn âm',
          'Khoảng cách từ nguồn âm đến tai người',
          'Môi trường truyền âm'
        ],
        correct: 1,
        explanation: 'Tần số dao động càng lớn thì âm phát ra càng cao (càng bổng); tần số dao động càng nhỏ thì âm phát ra càng thấp (càng trầm).'
      },
      {
        id: 'khtn7_sound_07',
        type: 'mcq',
        content: 'Độ to của âm phụ thuộc trực tiếp vào yếu tố nào của nguồn âm?',
        options: [
          'Biên độ dao động của nguồn âm',
          'Tần số dao động của nguồn âm',
          'Thời gian phát ra âm thanh',
          'Hình dạng của nguồn âm'
        ],
        correct: 0,
        explanation: 'Biên độ dao động càng lớn thì âm phát ra càng to; biên độ dao động càng nhỏ thì âm phát ra càng nhỏ.'
      },
      {
        id: 'khtn7_sound_08',
        type: 'mcq',
        content: 'Đơn vị dùng để đo độ to của âm (mức cường độ âm) là:',
        options: [
          'Héc (Hz)',
          'Đề-xi-ben (dB)',
          'Mét (m)',
          'Jun (J)'
        ],
        correct: 1,
        explanation: 'Độ to của âm được đo bằng đơn vị đề-xi-ben (kí hiệu là dB).'
      },
      {
        id: 'khtn7_sound_09',
        type: 'mcq',
        content: 'Ngưỡng đau làm tổn thương màng nhĩ của tai người là mức độ to của âm khoảng bao nhiêu?',
        options: [
          '70 dB',
          '90 dB',
          '130 dB',
          '200 dB'
        ],
        correct: 2,
        explanation: 'Theo SGK KHTN 7, âm thanh có độ to từ 130 dB trở lên bắt đầu chạm ngưỡng làm đau tai và tổn thương thính giác.'
      },
      {
        id: 'khtn7_sound_10',
        type: 'mcq',
        content: 'Vật liệu nào sau đây phản xạ âm tốt (hấp thụ âm kém)?',
        options: [
          'Tấm xốp cách nhiệt',
          'Rèm nhung dày',
          'Tấm kính phẳng nhẵn',
          'Mút xốp sần sùi'
        ],
        correct: 2,
        explanation: 'Những vật cứng, bề mặt nhẵn bóng (kính, đá hoa cương, tường gạch trơn phẳng) phản xạ âm rất tốt.'
      },
      {
        id: 'khtn7_sound_11',
        type: 'mcq',
        content: 'Vật liệu nào sau đây hấp thụ âm tốt (phản xạ âm kém, thường dùng để cách âm)?',
        options: [
          'Mặt gương kính phẳng',
          'Tường bê tông mài bóng',
          'Gạch men lát nền bóng',
          'Xốp mềm, rèm nhung, mút trứng'
        ],
        correct: 3,
        explanation: 'Những vật mềm, xốp, bề mặt sần sùi gồ ghề (xốp, len, rèm dạ, mút) có khả năng hấp thụ âm tốt, dùng làm vật liệu cách âm.'
      },
      {
        id: 'khtn7_sound_12',
        type: 'mcq',
        content: 'Hiện tượng tiếng vang xảy ra khi âm phản xạ nghe được cách âm trực tiếp một khoảng thời gian ít nhất là bao nhiêu?',
        options: [
          '1/60 giây',
          '1/15 giây',
          '1 giây',
          '5 giây'
        ],
        correct: 1,
        explanation: 'Ta nghe được tiếng vang khi âm phản xạ đến tai chậm hơn âm trực tiếp ít nhất một khoảng thời gian là 1/15 giây (~0,067s).'
      },
      {
        id: 'khtn7_sound_13',
        type: 'mcq',
        content: 'Biện pháp nào sau đây giúp giảm thiểu ô nhiễm tiếng ồn tại các khu dân cư gần đường cao tốc?',
        options: [
          'Bấm còi xe liên tục để cảnh báo',
          'Trồng nhiều cây xanh và dựng tường cách âm ven đường',
          'Mở rộng lòng đường bằng bê tông bóng',
          'Phá bỏ dải cây xanh ven đường'
        ],
        correct: 1,
        explanation: 'Trồng nhiều cây xanh (lá cây phân tán âm) và xây dựng tường cách âm là các biện pháp ngăn chặn và phân tán đường truyền tiếng ồn.'
      },
      {
        id: 'khtn7_sound_14',
        type: 'mcq',
        content: 'Một con lắc thực hiện được 120 dao động trong thời gian 3 giây. Tần số dao động của con lắc là:',
        options: [
          '40 Hz',
          '120 Hz',
          '360 Hz',
          '0,025 Hz'
        ],
        correct: 0,
        explanation: 'Tần số f = Số dao động / Thời gian = 120 / 3 = 40 Hz.'
      },
      {
        id: 'khtn7_sound_15',
        type: 'tf',
        content: 'Trong môi trường chân không, sóng âm vẫn có thể truyền đi bình thường nhờ các hạt ánh sáng.',
        correct: false,
        explanation: 'Sai. Chân không không có các phần tử vật chất môi trường dao động nên sóng âm không thể truyền qua chân không.'
      },
      {
        id: 'khtn7_sound_16',
        type: 'tf',
        content: 'Khi gảy dây đàn guitar càng mạnh, biên độ dao động của dây càng lớn thì âm thanh phát ra nghe càng to.',
        correct: true,
        explanation: 'Đúng. Gảy càng mạnh làm tăng biên độ dao động của dây đàn, dẫn tới âm phát ra có độ to càng lớn.'
      },
      {
        id: 'khtn7_sound_17',
        type: 'tf',
        content: 'Giọng nói của người phụ nữ thường cao hơn giọng của nam giới vì dây thanh quản của phụ nữ dao động với tần số lớn hơn.',
        correct: true,
        explanation: 'Đúng. Tần số dao động lớn hơn làm cho âm thanh có độ cao (âm bổng) cao hơn.'
      },
      {
        id: 'khtn7_sound_18',
        type: 'tf',
        content: 'Bề mặt gồ ghề, xốp mềm phản xạ âm tốt hơn so với bề mặt cứng và nhẵn bóng.',
        correct: false,
        explanation: 'Sai. Bề mặt xốp mềm gồ ghề phản xạ âm kém và hấp thụ âm tốt; bề mặt cứng nhẵn mới phản xạ âm tốt.'
      },
      {
        id: 'khtn7_sound_19',
        type: 'text',
        content: 'Độ lệch lớn nhất của vật dao động so với vị trí cân bằng ban đầu được gọi là gì?',
        correct: 'Biên độ dao động',
        explanation: 'Biên độ dao động là độ lệch lớn nhất của vật dao động so với vị trí cân bằng.'
      },
      {
        id: 'khtn7_sound_20',
        type: 'text',
        content: 'Một vật dao động thực hiện được 300 dao động trong 10 giây. Tần số dao động của vật bằng bao nhiêu Hz? (Chỉ ghi số)',
        correct: '30',
        explanation: 'Tần số dao động f = 300 / 10 = 30 Hz.'
      }
    ]
  },

  // =========================================================================
  // 2. KHOA HỌC TỰ NHIÊN 8 - CHƯƠNG V: ĐIỆN (20 CÂU HỎI)
  // SGK Kết nối tri thức: Bài 20 (Hiện tượng nhiễm điện), Bài 21 (Dòng điện, nguồn điện), Bài 22 (Mạch điện đơn giản), Bài 23 (Tác dụng của dòng điện), Bài 24 & 25 (Cường độ dòng điện & Hiệu điện thế)
  // =========================================================================
  {
    id: 'bank_khtn8_chuong5_dien',
    name: 'KHTN 8 - Chương V: Điện (Bài 20 - 25: Nhiễm điện, Dòng điện, Mạch điện, Tác dụng dòng điện, Đo I và U)',
    subject: 'Khoa học tự nhiên',
    grade: 'Lớp 8',
    topic: 'Chương V. Điện (Hiện tượng nhiễm điện do cọ xát, Dòng điện, Nguồn điện, Mạch điện, Tác dụng dòng điện, Cường độ dòng điện và Hiệu điện thế)',
    tags: ['KHTN 8', 'Kết nối tri thức', 'Chương 5', 'Điện học', 'Dòng điện', 'Vật lí 8'],
    isPreset: true,
    createdAt: '2026-08-16T12:00:00.000Z',
    description: 'Bộ 20 câu hỏi chuẩn SGK Kết nối tri thức: Hai loại điện tích (+ và -), dòng điện, pin/nguồn điện, sơ đồ mạch điện kín, 5 tác dụng dòng điện (nhiệt, quang, từ, hóa, sinh lí), đo cường độ dòng điện (Ampe kế mắc nối tiếp) và hiệu điện thế (Vôn kế mắc song song).',
    questions: [
      {
        id: 'khtn8_elec_01',
        type: 'mcq',
        content: 'Có thể làm nhiễm điện cho một thước nhựa bằng cách nào sau đây?',
        options: [
          'Nhúng thước nhựa vào nước ấm',
          'Cọ xát thước nhựa vào mảnh vải khô hoặc len',
          'Đặt thước nhựa dưới ánh sáng Mặt Trời',
          'Thả rơi thước nhựa từ trên cao xuống'
        ],
        correct: 1,
        explanation: 'Theo SGK KHTN 8 (Bài 20), nhiều vật sau khi bị cọ xát có khả năng hút các vật nhẹ khác, đó là hiện tượng nhiễm điện do cọ xát.'
      },
      {
        id: 'khtn8_elec_02',
        type: 'mcq',
        content: 'Trong tự nhiên có bao nhiêu loại điện tích và tương tác giữa chúng diễn ra như thế nào?',
        options: [
          'Có 1 loại điện tích duy nhất',
          'Có 2 loại: điện tích dương (+) và âm (-); cùng dấu đẩy nhau, khác dấu hút nhau',
          'Có 2 loại: điện tích dương và âm; cùng dấu hút nhau, khác dấu đẩy nhau',
          'Có 3 loại điện tích khác nhau'
        ],
        correct: 1,
        explanation: 'Có hai loại điện tích là điện tích dương (+) và điện tích âm (-). Các điện tích cùng loại thì đẩy nhau, khác loại thì hút nhau.'
      },
      {
        id: 'khtn8_elec_03',
        type: 'mcq',
        content: 'Định nghĩa nào sau đây về dòng điện là chính xác nhất?',
        options: [
          'Dòng điện là dòng các nguyên tử chuyển động hỗn loạn',
          'Dòng điện là dòng các điện tích dịch chuyển có hướng',
          'Dòng điện là dòng chất lỏng tích điện chảy trong ống dẫn',
          'Dòng điện là dòng năng lượng ánh sáng truyền đi'
        ],
        correct: 1,
        explanation: 'Dòng điện là dòng chuyển dời có hướng của các hạt mang điện tích.'
      },
      {
        id: 'khtn8_elec_04',
        type: 'mcq',
        content: 'Thiết bị nào sau đây có chức năng cung cấp dòng điện lâu dài cho các thiết bị điện hoạt động?',
        options: [
          'Bóng đèn sợi đốt',
          'Công tắc điện',
          'Nguồn điện (Pin, Ắc-quy, Máy phát điện)',
          'Ampe kế'
        ],
        correct: 2,
        explanation: 'Nguồn điện (như pin, acquy) có khả năng duy trì dòng điện chạy trong mạch kín.'
      },
      {
        id: 'khtn8_elec_05',
        type: 'mcq',
        content: 'Quy ước chiều dòng điện trong mạch điện kín là chiều đi từ:',
        options: [
          'Cực âm qua dây dẫn và thiết bị điện tới cực dương của nguồn điện',
          'Cực dương qua dây dẫn và thiết bị điện tới cực âm của nguồn điện',
          'Trung điểm của dây dẫn sang hai đầu',
          'Bất kì hướng nào không cố định'
        ],
        correct: 1,
        explanation: 'Chiều dòng điện được quy ước là chiều từ cực dương qua dây dẫn và các thiết bị điện tới cực âm của nguồn điện.'
      },
      {
        id: 'khtn8_elec_06',
        type: 'mcq',
        content: 'Dòng điện chạy qua bàn là, nồi cơm điện, ấm siêu tốc thể hiện tác dụng chủ yếu nào của dòng điện?',
        options: [
          'Tác dụng từ',
          'Tác dụng nhiệt',
          'Tác dụng hóa học',
          'Tác dụng sinh lí'
        ],
        correct: 1,
        explanation: 'Dòng điện chạy qua vật dẫn làm vật dẫn nóng lên, đó là tác dụng nhiệt của dòng điện.'
      },
      {
        id: 'khtn8_elec_07',
        type: 'mcq',
        content: 'Thiết bị nào sau đây hoạt động dựa trên tác dụng từ của dòng điện?',
        options: [
          'Chuông điện và cần cẩu điện dùng nam châm điện',
          'Ấm đun nước siêu tốc',
          'Đèn đi-ốt phát quang (LED)',
          'Bình mạ điện kim loại'
        ],
        correct: 0,
        explanation: 'Dòng điện chạy qua cuộn dây quấn quanh lõi sắt non tạo thành nam châm điện có khả năng hút sắt thép (tác dụng từ).'
      },
      {
        id: 'khtn8_elec_08',
        type: 'mcq',
        content: 'Hiện tượng mạ bạc, mạ vàng, mạ đồng cho các đồ trang sức dựa trên tác dụng nào của dòng điện?',
        options: [
          'Tác dụng nhiệt',
          'Tác dụng hóa học',
          'Tác dụng sinh lí',
          'Tác dụng quang học'
        ],
        correct: 1,
        explanation: 'Dòng điện chạy qua dung dịch điện phân làm giải phóng các chất và bám kim loại lên điện cực, đó là tác dụng hóa học.'
      },
      {
        id: 'khtn8_elec_09',
        type: 'mcq',
        content: 'Nếu vô tình chạm vào nguồn điện trần bị hở, dòng điện chạy qua cơ thể người gây co giật cơ bắp. Đó là tác dụng gì?',
        options: [
          'Tác dụng sinh lí',
          'Tác dụng từ',
          'Tác dụng hóa học',
          'Tác dụng phát sáng'
        ],
        correct: 0,
        explanation: 'Dòng điện chạy qua cơ thể người và động vật làm co giật các cơ bắp, có thể làm tim ngừng đập, đó là tác dụng sinh lí.'
      },
      {
        id: 'khtn8_elec_10',
        type: 'mcq',
        content: 'Đại lượng đặc trưng cho độ mạnh, yếu của dòng điện là gì?',
        options: [
          'Hiệu điện thế',
          'Cường độ dòng điện',
          'Năng lượng điện',
          'Công suất nguồn'
        ],
        correct: 1,
        explanation: 'Cường độ dòng điện cho biết mức độ mạnh hay yếu của dòng điện chạy qua đoạn mạch.'
      },
      {
        id: 'khtn8_elec_11',
        type: 'mcq',
        content: 'Đơn vị đo cường độ dòng điện trong hệ SI là:',
        options: [
          'Vôn (kí hiệu V)',
          'Ampe (kí hiệu A)',
          'Jun (kí hiệu J)',
          'Oát (kí hiệu W)'
        ],
        correct: 1,
        explanation: 'Cường độ dòng điện kí hiệu là I, đơn vị đo là Ampe (A) hoặc miliampe (mA).'
      },
      {
        id: 'khtn8_elec_12',
        type: 'mcq',
        content: 'Dụng cụ dùng để đo cường độ dòng điện là gì và phải mắc vào mạch như thế nào?',
        options: [
          'Vôn kế, mắc song song với thiết bị điện cần đo',
          'Ampe kế, mắc nối tiếp với thiết bị điện cần đo',
          'Ampe kế, mắc song song với nguồn điện',
          'Nhiệt kế, đặt cạnh dây dẫn điện'
        ],
        correct: 1,
        explanation: 'Ampe kế dùng để đo cường độ dòng điện và phải mắc nối tiếp vào đoạn mạch cần đo (chốt + nối về phía cực dương).'
      },
      {
        id: 'khtn8_elec_13',
        type: 'mcq',
        content: 'Đơn vị đo hiệu điện thế là:',
        options: [
          'Ampe (A)',
          'Vôn (V)',
          'Niu-tơn (N)',
          'Mét trên giây (m/s)'
        ],
        correct: 1,
        explanation: 'Hiệu điện thế (kí hiệu là U) được đo bằng đơn vị Vôn (V) hoặc milivôn (mV), kilovôn (kV).'
      },
      {
        id: 'khtn8_elec_14',
        type: 'mcq',
        content: 'Dụng cụ dùng để đo hiệu điện thế là gì và phải mắc vào mạch như thế nào?',
        options: [
          'Ampe kế, mắc nối tiếp',
          'Vôn kế, mắc song song với hai đầu thiết bị điện hoặc nguồn điện cần đo',
          'Vôn kế, mắc nối tiếp vào mạch',
          'Lực kế, móc vào dây dẫn'
        ],
        correct: 1,
        explanation: 'Vôn kế dùng để đo hiệu điện thế giữa hai điểm và được mắc song song với hai điểm cần đo.'
      },
      {
        id: 'khtn8_elec_15',
        type: 'tf',
        content: 'Hai vật nhiễm điện cùng loại (cùng mang điện tích âm hoặc cùng mang điện tích dương) khi đặt gần nhau sẽ hút nhau.',
        correct: false,
        explanation: 'Sai. Các điện tích cùng loại thì đẩy nhau; chỉ các điện tích khác loại mới hút nhau.'
      },
      {
        id: 'khtn8_elec_16',
        type: 'tf',
        content: 'Mạch điện kín là mạch điện nối liền từ cực dương qua dây dẫn, công tắc đóng và thiết bị tiêu thụ điện về cực âm của nguồn điện.',
        correct: true,
        explanation: 'Đúng. Khi mạch điện kín thì có dòng điện chạy qua các thiết bị để thiết bị hoạt động.'
      },
      {
        id: 'khtn8_elec_17',
        type: 'tf',
        content: 'Khi mắc Ampe kế vào mạch điện, chốt dương (+) của ampe kế phải được nối về phía cực dương của nguồn điện.',
        correct: true,
        explanation: 'Đúng. Chốt (+) của ampe kế nối với phía cực (+), chốt (-) nối với phía cực (-) của nguồn để kim không bị quay ngược.'
      },
      {
        id: 'khtn8_elec_18',
        type: 'tf',
        content: 'Hiệu điện thế giữa hai cực của pin khi chưa mắc vào mạch kín chính là giá trị ghi trên vỏ pin (ví dụ pin con thỏ 1,5 V).',
        correct: true,
        explanation: 'Đúng. Số vôn ghi trên mỗi nguồn điện cho biết hiệu điện thế giữa hai cực của nó khi chưa mắc vào mạch.'
      },
      {
        id: 'khtn8_elec_19',
        type: 'text',
        content: 'Khi đổi đơn vị: 0,35 A tương đương bằng bao nhiêu miliampe (mA)? (Chỉ ghi số)',
        correct: '350',
        explanation: '1 A = 1000 mA, vậy 0,35 A = 0,35 x 1000 = 350 mA.'
      },
      {
        id: 'khtn8_elec_20',
        type: 'text',
        content: 'Dòng điện có 5 tác dụng chính: Tác dụng nhiệt, tác dụng phát sáng, tác dụng từ, tác dụng sinh lí và tác dụng gì nữa?',
        correct: 'Tác dụng hóa học',
        explanation: 'Năm tác dụng của dòng điện là: Nhiệt, Phát sáng (Quang), Từ, Hóa học và Sinh lí.'
      }
    ]
  }
];
