import { DetectiveCase } from './caseTypes';

export const CASE_PRESETS: DetectiveCase[] = [
  // =========================================================================
  // CASE 1: BÍ ẨN PHÒNG THÍ NGHIỆM KHÓA KÍN
  // =========================================================================
  {
    id: 'preset_lab',
    title: 'Bí Ẩn Phòng Thí Nghiệm Khóa Kín',
    subtitle: 'Vụ đánh cắp công thức Polymer siêu dẫn & đầu độc khí mê',
    category: 'sabotage',
    difficulty: 'medium',
    badge: 'Phòng Kín',
    coverIcon: '🧪',
    themeColor: '#0284c7',
    crimeSceneName: 'Viện Nghiên Cứu Vật Liệu Tiên Tiến - Phòng Lab 402',
    crimeSceneDescription: 'Phòng thí nghiệm áp suất âm trên tầng 4 được khóa trái từ bên trong bằng chốt then cài. Giáo sư Minh nằm bất tỉnh trên sàn gần bàn làm việc, ổ cứng chứa công thức polymer biến mất.',
    victim: {
      name: 'GS. Hoàng Minh',
      title: 'Viện trưởng Viện Nghiên Cứu',
      avatar: '👨‍🔬',
      incidentType: 'Hít phải khí gây mê Isoflurane dạng bốc hơi, bất tỉnh sâu & mất USB chứa công thức gốc',
      lastSeen: '19:40 tại phòng Lab 402 khi đang nạp dữ liệu vào máy chủ',
      medicalReport: 'Không có chấn thương ngoại lực. Nồng độ khí mê trong máu cao, bắt đầu hít phải vào khoảng 20:10 - 20:20.'
    },
    synopsis: 'Lúc 20:30 tối thứ Sáu, chuông báo động rò rỉ khí phòng 402 vang lên. Khi bảo vệ phá cửa, cửa sổ khóa kín, chốt trong gài chặt. Làm sao kẻ gian có thể đánh cắp USB và gây mê giáo sư trong một căn phòng kín hoàn hảo?',
    suspects: [
      {
        id: 'suspect_tuan',
        name: 'Lê Tuấn',
        title: 'Trợ lý nghiên cứu cao cấp',
        avatar: '👨‍💼',
        gender: 'male',
        age: 27,
        personality: 'Thông minh, điềm tĩnh, luôn đeo kính và găng tay len mỏng',
        relationshipToVictim: 'Học trò xuất sắc 4 năm của GS Minh, nhưng vừa bị gạt tên khỏi bằng sáng chế',
        initialQuote: '“Tôi ở suốt phòng rửa dụng cụ tầng 3 để tiệt trùng ống nghiệm từ 20:00 đến 20:45, tiếng máy hấp ồn lắm tôi không nghe thấy gì cả!”',
        statements: [
          {
            id: 'stmt_tuan_1',
            topic: 'Nơi ở lúc 20:15',
            statementText: 'Tôi ở phòng rửa tiệt trùng tầng 3 suốt 45 phút, không hề bước chân lên tầng 4 sau 19:00.',
            isInitial: true,
            hasContradiction: true,
            contradictedByClueId: 'clue_lab_watch',
            contradictionExplanation: 'Đồng hồ đeo tay cơ của Tuấn bị kẹt đứng đúng 20:15 do dính dung môi bay hơi chỉ có ở phòng Lab 402 tầng 4!'
          },
          {
            id: 'stmt_tuan_2',
            topic: 'Găng tay và vết thương ở ngón tay',
            statementText: 'Tay tôi bị trầy do mảnh thủy tinh vỡ từ sáng, găng tay nhung xanh là tôi đeo giữ ấm vì phòng lab lạnh.',
            isInitial: false,
            hasContradiction: true,
            contradictedByClueId: 'clue_lab_fiber',
            contradictionExplanation: 'Sợi len nhung xanh dính trên nẹp thông gió trần phòng 402 trùng khớp 100% sợi từ găng tay của Tuấn!'
          }
        ],
        claimedAlibi: {
          timeSlot: '20:00 - 20:45',
          location: 'Phòng rửa dụng cụ tầng 3',
          claimedActivity: 'Tiệt trùng lốc ống nghiệm bằng máy hấp nhiệt',
          verified: false,
          brokenReason: 'Đồng hồ cơ dính hóa chất dừng lúc 20:15 và sợi găng tay dính ở cửa thông gió tầng 4.'
        },
        motive: {
          apparent: 'Uất ức vì bị GS Minh chiếm đoạt công trình nghiên cứu và bán cho tập đoàn nước ngoài.',
          hidden: 'Đã nhận trước 2 tỷ đồng tiền cọc từ công ty đối thủ để tuồn USB ra ngoài trước 21:00.',
          isDecisive: true
        },
        isCulprit: true,
        isRedHerring: false
      },
      {
        id: 'suspect_lan',
        name: 'TS. Mai Lan',
        title: 'Trưởng nhóm Sinh Hóa đối lập',
        avatar: '👩‍🔬',
        gender: 'female',
        age: 38,
        personality: 'Sắc sảo, thẳng thắn, có mâu thuẫn học thuật gay gắt với GS Minh',
        relationshipToVictim: 'Đối thủ cạnh tranh trực tiếp ghế Viện trưởng nhiệm kỳ tới',
        initialQuote: '“Tôi không ưa gì ông Minh, nhưng tôi là nhà khoa học chân chính, không làm trò hèn hạ!”',
        statements: [
          {
            id: 'stmt_lan_1',
            topic: 'Sự hiện diện buổi tối',
            statementText: 'Tôi nán lại văn phòng tầng 4 đến 19:40 để lấy tài liệu tham khảo rồi lái xe về thẳng nhà lúc 19:45.',
            isInitial: true,
            hasContradiction: false
          }
        ],
        claimedAlibi: {
          timeSlot: '19:45 - 21:00',
          location: 'Trên đường lái xe về nhà & tại nhà riêng',
          claimedActivity: 'Lái xe về ăn tối cùng gia đình',
          verified: true
        },
        motive: {
          apparent: 'Muốn hạ bệ GS Minh để độc chiếm vị trí Viện trưởng.',
          isDecisive: false
        },
        isCulprit: false,
        isRedHerring: true,
        redHerringExplanation: 'Bảo vệ thấy bà Lan lén chụp ảnh tủ hồ sơ lúc 19:35, nhưng bà chỉ chụp danh mục đề tài để khiếu nại hội đồng khoa học chứ không hề đụng vào USB hay phòng 402.'
      },
      {
        id: 'suspect_ba',
        name: 'Bác Ba',
        title: 'Nhân viên bảo vệ ca đêm',
        avatar: '👮‍♂️',
        gender: 'male',
        age: 56,
        personality: 'Thật thà nhưng hơi đãng trí, nghiện thuốc lá',
        relationshipToVictim: 'Làm việc tại viện 10 năm, được GS Minh giúp đỡ nhiều',
        initialQuote: '“Lúc 20:00 tôi đi tuần một vòng thấy tầng 4 vẫn bình thường, sau đó hệ thống camera bị nhiễu sóng chứ tôi không hề chợp mắt!”',
        statements: [
          {
            id: 'stmt_ba_1',
            topic: 'Camera hành lang tầng 4 bị tắt',
            statementText: 'Camera bị mất tín hiệu từ 20:05 đến 20:30 do nguồn điện chập chờn.',
            isInitial: true,
            hasContradiction: true,
            contradictedByClueId: 'clue_lab_log',
            contradictionExplanation: 'Bác Ba tắt camera để lén xuống góc sân hút thuốc và ngủ gật 15 phút, chứ không hề có lỗi chập điện kỹ thuật.'
          }
        ],
        claimedAlibi: {
          timeSlot: '20:05 - 20:30',
          location: 'Phòng trực ban bảo vệ',
          claimedActivity: 'Theo dõi màn hình an ninh',
          verified: false,
          brokenReason: 'Ngủ gật và hút thuốc ở góc cầu thang trốn camera, hoàn toàn vô tội về vụ cướp USB.'
        },
        motive: {
          apparent: 'Nợ cờ bạc ngoài xã hội, cần tiền gấp.',
          isDecisive: false
        },
        isCulprit: false,
        isRedHerring: true,
        redHerringExplanation: 'Khai báo gian dối về camera chỉ vì sợ bị đuổi việc do ngủ gật trong ca trực.'
      },
      {
        id: 'suspect_phong',
        name: 'Vũ Phong',
        title: 'Đại diện Tập Đoàn Dược Apex',
        avatar: '👔',
        gender: 'male',
        age: 42,
        personality: 'Lịch thiệp, sắc sảo, thực dụng',
        relationshipToVictim: 'Từng đề nghị mua độc quyền công thức với giá 10 triệu USD nhưng bị từ chối thẳng thừng',
        initialQuote: '“Tôi đến gặp giáo sư lúc 19:15, ông ấy từ chối nên tôi rời đi ngay lúc 19:30 sang quán trà đối diện ngồi uống một mình.”',
        statements: [
          {
            id: 'stmt_phong_1',
            topic: 'Hóa đơn quán trà',
            statementText: 'Tôi ở quán trà StarTea đối diện cổng viện từ 19:35 đến 21:00, có hóa đơn thanh toán thẻ lúc 19:38 và nhân viên phục vụ nhớ mặt tôi.',
            isInitial: true,
            hasContradiction: false
          }
        ],
        claimedAlibi: {
          timeSlot: '19:35 - 21:00',
          location: 'Quán StarTea đối diện viện',
          claimedActivity: 'Uống trà và gọi điện thoại làm việc',
          verified: true
        },
        motive: {
          apparent: 'Bị từ chối hợp đồng lớn, nguy cơ bị sa thải nếu không có công thức.',
          isDecisive: false
        },
        isCulprit: false,
        isRedHerring: true,
        redHerringExplanation: 'Đúng là rất thèm muốn công thức, nhưng có chứng cứ ngoại phạm bất di bất dịch tại quán trà đối diện.'
      }
    ],
    clues: [
      {
        id: 'clue_lab_door',
        title: 'Khóa Chốt Cửa Phòng 402',
        type: 'physical_evidence',
        icon: '🚪',
        locationFound: 'Cửa ra vào chính phòng 402',
        summary: 'Chốt trượt kim loại bên trong đã được gài chặt. Không có dấu vết cạy phá khóa cửa.',
        detailedAnalysis: 'Khóa then cài phía trong có một đoạn dây cước câu cá siêu mảnh dài 15cm bị đứt kẹt lại ở khe then, luồn qua khe thoáng phía trên cửa.',
        isUnlockedByDefault: true,
        pointsToUnlock: 0,
        linkedSuspectIds: ['suspect_tuan'],
        linkedClueIds: ['clue_lab_string', 'clue_lab_vent'],
        leadsToDeduction: 'Thủ phạm đã dùng mánh khóe dây cước để giật then cài từ bên ngoài sau khi rời phòng!',
        sceneCoordinates: { x: 15, y: 50 }
      },
      {
        id: 'clue_lab_vent',
        title: 'Cửa Thông Gió Áp Suất Trần Nhà',
        type: 'scene_trace',
        icon: '💨',
        locationFound: 'Ống thông gió trần nối phòng 402 với hành lang kỹ thuật tầng 4',
        summary: 'Tấm lưới lọc bụi bị mở hé ốc vít ở góc trái, có vết trầy xước kim loại còn rất mới.',
        detailedAnalysis: 'Bên trong ống thông gió có một bình xịt chứa khí Isoflurane rỗng, kết nối với ống truyền dịch silicon nhỏ giọt xuống gần quạt hút phòng lab.',
        isUnlockedByDefault: true,
        pointsToUnlock: 0,
        linkedSuspectIds: ['suspect_tuan'],
        linkedClueIds: ['clue_lab_fiber', 'clue_lab_flask'],
        leadsToDeduction: 'Khí mê không phải được phun trực tiếp mặt đối mặt, mà được xả từ đường ống thông gió vào phòng!',
        sceneCoordinates: { x: 50, y: 15 }
      },
      {
        id: 'clue_lab_fiber',
        title: 'Sợi Vải Nhung Xanh Lá Bí Ẩn',
        type: 'forensics',
        icon: '🧶',
        locationFound: 'Dính trên cạnh sắc ốc vít ống thông gió trần',
        summary: 'Sợi len nhung xanh cao cấp dính xơ vải do cọ xát mạnh khi vặn ốc.',
        detailedAnalysis: 'Giám định vi mô: Sợi len Cashmere dệt thủ công màu xanh lục bảo. Chỉ có Lê Tuấn sở hữu đôi găng tay đặc chế từ chất liệu này.',
        isUnlockedByDefault: false,
        pointsToUnlock: 30,
        linkedSuspectIds: ['suspect_tuan'],
        linkedClueIds: ['clue_lab_vent'],
        leadsToDeduction: 'Lê Tuấn chính là người đã tháo ốc vít ống thông gió trần phòng 402!',
        contradictsStatementId: 'stmt_tuan_2'
      },
      {
        id: 'clue_lab_watch',
        title: 'Chiếc Đồng Hồ Cơ Bị Dừng Lúc 20:15',
        type: 'timeline',
        icon: '⌚',
        locationFound: 'Cổ tay của Lê Tuấn khi bị thẩm vấn',
        summary: 'Đồng hồ cơ Thụy Sĩ của Lê Tuấn bị chết kim đúng vào lúc 20 giờ 15 phút.',
        detailedAnalysis: 'Mặt kính bên trong có vết mờ đục do hơi dung môi hữu cơ Acetonitril (chất dung môi đặc thù chỉ đang được GS Minh dùng chưng cất tại phòng 402 lúc 20:10).',
        isUnlockedByDefault: false,
        pointsToUnlock: 50,
        linkedSuspectIds: ['suspect_tuan'],
        linkedClueIds: ['clue_lab_flask'],
        isKeyDecisiveEvidence: true,
        leadsToDeduction: 'Lê Tuấn có mặt tại phòng 402 đúng 20:15 khi Acetonitril đang bốc hơi, đập tan hoàn toàn chứng cứ ngoại phạm ở tầng 3!',
        contradictsStatementId: 'stmt_tuan_1'
      },
      {
        id: 'clue_lab_flask',
        title: 'Bình Hóa Chất Acetonitril Đang Đun',
        type: 'physical_evidence',
        icon: '⚗️',
        locationFound: 'Trên bếp gia nhiệt góc phòng Lab 402',
        summary: 'Bình cầu chứa Acetonitril bắt đầu được gia nhiệt từ 20:00 theo chu trình tự động của GS Minh.',
        detailedAnalysis: 'Hơi chất này phản ứng làm mờ lớp chống lóa của mặt kính đồng hồ cơ nếu tiếp xúc trong phạm vi 1 mét.',
        isUnlockedByDefault: false,
        pointsToUnlock: 20,
        linkedSuspectIds: ['suspect_tuan'],
        linkedClueIds: ['clue_lab_watch'],
        sceneCoordinates: { x: 75, y: 65 }
      },
      {
        id: 'clue_lab_string',
        title: 'Cuộn Dây Cước Câu Cá Trong Tủ Cá Nhân',
        type: 'physical_evidence',
        icon: '🧵',
        locationFound: 'Tủ cá nhân số 07 của Lê Tuấn tại phòng thay đồ',
        summary: 'Một cuộn cước câu cá carbon siêu dai 0.15mm, đầu dây bị cắt một đoạn khoảng 15cm.',
        detailedAnalysis: 'Vết cắt ở đầu dây cước trùng khớp hoàn hảo với đoạn dây cước dính ở chốt then cài phòng 402.',
        isUnlockedByDefault: false,
        pointsToUnlock: 40,
        linkedSuspectIds: ['suspect_tuan'],
        linkedClueIds: ['clue_lab_door'],
        leadsToDeduction: 'Lê Tuấn đã chuẩn bị sẵn dây cước để tạo mánh khóe phòng kín.'
      },
      {
        id: 'clue_lab_log',
        title: 'Nhật Ký Nguồn Điện & Mẩu Thuốc Lá',
        type: 'timeline',
        icon: '📋',
        locationFound: 'Bốt bảo vệ và góc ban công cầu thang thoát hiểm',
        summary: 'Nhật ký trạm biến áp cho thấy điện lưới ổn định 100%. Tìm thấy 2 mẩu thuốc lá 555 còn ấm dưới chân cầu thang.',
        detailedAnalysis: 'Bác Ba thừa nhận đã tắt camera và xuống hút thuốc lúc 20:05 đến 20:25, chứng minh bảo vệ chỉ thiếu trách nhiệm chứ không đồng lõa.',
        isUnlockedByDefault: false,
        pointsToUnlock: 20,
        linkedSuspectIds: ['suspect_ba'],
        linkedClueIds: [],
        leadsToDeduction: 'Loại bỏ nghi vấn bảo vệ cấu kết đánh cắp dữ liệu.'
      },
      {
        id: 'clue_lab_tea',
        title: 'Hóa Đơn & Camera Quán Trà StarTea',
        type: 'timeline',
        icon: '☕',
        locationFound: 'Quán StarTea đối diện cổng viện',
        summary: 'Vũ Phong ngồi tại bàn số 4 từ 19:35 đến 20:55, gọi 2 ấm trà và liên tục gọi điện thoại.',
        detailedAnalysis: 'Camera quán trà ghi lại rõ ràng hình ảnh Vũ Phong không rời khỏi ghế suốt khoảng thời gian xảy ra vụ án.',
        isUnlockedByDefault: false,
        pointsToUnlock: 20,
        linkedSuspectIds: ['suspect_phong'],
        linkedClueIds: [],
        leadsToDeduction: 'Vũ Phong hoàn toàn vô can trong thời điểm gây án.'
      }
    ],
    timeline: [
      {
        id: 'tl_1',
        timeStr: '19:15',
        location: 'Văn phòng GS Minh',
        description: 'Vũ Phong đến chào mời hợp đồng mua công thức nhưng bị GS Minh kiên quyết từ chối.',
        involvedSuspectIds: ['suspect_phong'],
        isConfirmed: true,
        source: 'Lời khai nạn nhân & sổ đăng ký khách'
      },
      {
        id: 'tl_2',
        timeStr: '19:35',
        location: 'Cổng viện & Quán StarTea',
        description: 'Vũ Phong rời viện sang quán StarTea ngồi uống trà.',
        involvedSuspectIds: ['suspect_phong'],
        isConfirmed: true,
        source: 'Camera quán trà & hóa đơn'
      },
      {
        id: 'tl_3',
        timeStr: '19:40',
        location: 'Phòng Lab 402',
        description: 'GS Minh bắt đầu nạp công thức vào USB và khởi động bếp gia nhiệt Acetonitril.',
        involvedSuspectIds: [],
        isConfirmed: true,
        source: 'Nhật ký máy chủ thí nghiệm'
      },
      {
        id: 'tl_4',
        timeStr: '20:05',
        location: 'Bốt bảo vệ & Ống thông gió',
        description: 'Bác Ba tắt camera đi hút thuốc. Khí Isoflurane bắt đầu được kích hoạt xả qua ống thông gió.',
        involvedSuspectIds: ['suspect_ba', 'suspect_tuan'],
        isConfirmed: true,
        source: 'Cảm biến nồng độ khí & lời khai Bác Ba'
      },
      {
        id: 'tl_5',
        timeStr: '20:15',
        location: 'Phòng Lab 402 (Hiện trường)',
        description: 'Lê Tuấn lẻn vào phòng 402, lấy trộm USB khi GS Minh vừa ngất. Đồng hồ Tuấn dính hơi Acetonitril dừng đúng lúc này.',
        involvedSuspectIds: ['suspect_tuan'],
        isConfirmed: false,
        source: 'Dấu vết đồng hồ & sợi vải'
      },
      {
        id: 'tl_6',
        timeStr: '20:20',
        location: 'Cửa phòng 402',
        description: 'Lê Tuấn khép cửa, dùng dây cước luồn qua khe thoáng giật chốt trong rồi cắt dây, tạo hiện trường phòng kín hoàn hảo.',
        involvedSuspectIds: ['suspect_tuan'],
        isConfirmed: false,
        source: 'Vết dây cước khe cửa'
      },
      {
        id: 'tl_7',
        timeStr: '20:30',
        location: 'Hành lang tầng 4',
        description: 'Còi báo rò rỉ khí vang lên. Bảo vệ và mọi người phá cửa xông vào.',
        involvedSuspectIds: ['suspect_ba'],
        isConfirmed: true,
        source: 'Hệ thống báo cháy trung tâm'
      }
    ],
    truth: {
      culpritId: 'suspect_tuan',
      culpritName: 'Lê Tuấn',
      decisiveClueId: 'clue_lab_watch',
      decisiveContradiction: 'Lê Tuấn khai ở tầng 3 tiệt trùng đồ nhưng đồng hồ cơ của anh ta bị dừng đúng 20:15 bởi Acetonitril chỉ có tại phòng Lab 402 tầng 4, đồng thời sợi găng tay len xanh của anh ta dính trên ống thông gió xả khí mê.',
      realMotive: 'Trả thù GS Minh vì bị gạt tên khỏi đề tài và nhận 2 tỷ đồng tiền hối lộ từ công ty đối thủ để đánh cắp USB công thức gốc.',
      realModusOperandi: 'Lợi dụng đường ống thông gió để xả trước khí mê Isoflurane. Chờ GS Minh ngất, Tuấn mở cửa vào lấy USB, sau đó bước ra ngoài dùng sợi cước luồn qua khe cửa kéo sập then cài bên trong, biến hiện trường thành phòng kín tuyệt đối.',
      recreationSteps: [
        '1. Từ chiều, Lê Tuấn nới lỏng ốc vít thông gió và đặt sẵn bình khí Isoflurane nhỏ giọt.',
        '2. Lúc 20:05 khi bảo vệ tắt camera, khí mê bắt đầu tràn vào phòng khiến GS Minh ngất lịm.',
        '3. Lúc 20:15, Tuấn đeo găng tay len nhung xanh vào phòng lấy trộm USB, đồng hồ cơ của anh ta tiếp xúc hơi Acetonitril và bị kẹt kim dừng lại.',
        '4. Tuấn ra ngoài, móc dây cước vào then cài, đóng cửa lại và giật mạnh sợi dây từ khe thoáng trên để then trượt vào ổ khóa trong.',
        '5. Giật đứt đoạn cước phi tang, quay về phòng rửa tầng 3 vờ tiệt trùng dụng cụ.'
      ],
      howRedHerringsCleared: [
        {
          suspectId: 'suspect_lan',
          suspectName: 'TS. Mai Lan',
          clearedByReason: 'Rời viện từ 19:45 về ăn tối cùng gia đình, việc chụp ảnh chỉ để khiếu nại học thuật.'
        },
        {
          suspectId: 'suspect_ba',
          suspectName: 'Bác Ba',
          clearedByReason: 'Chỉ tắt camera để lén hút thuốc và ngủ gật, sợ trách nhiệm nên khai báo quanh co.'
        },
        {
          suspectId: 'suspect_phong',
          suspectName: 'Vũ Phong',
          clearedByReason: 'Có camera và hóa đơn xác nhận ngồi liên tục tại quán StarTea đối diện suốt thời gian xảy ra án mạng.'
        }
      ]
    }
  },

  // =========================================================================
  // CASE 2: BỨC TRANH VƯƠNG MIỆN CỔ MẤT TÍCH
  // =========================================================================
  {
    id: 'preset_gallery',
    title: 'Bí Mật Bức Tranh Vương Miện Cổ',
    subtitle: 'Vụ đánh tráo kiệt tác 5 triệu USD trong 5 phút mất điện',
    category: 'theft',
    difficulty: 'medium',
    badge: 'Trộm Nghệ Thuật',
    coverIcon: '🖼️',
    themeColor: '#d97706',
    crimeSceneName: 'Bảo Tàng Nghệ Thuật Hoàng Gia - Gian Phòng Vàng',
    crimeSceneDescription: 'Bức tranh sơn dầu thế kỷ 18 "Vương Miện Ánh Dương" bị đánh tráo bằng một bản sao chép tinh vi ngay trong đêm gala triển lãm, khi toàn bộ tòa nhà bị sập nguồn điện 5 phút.',
    victim: {
      name: 'Bảo Tàng Hoàng Gia & Giám Đốc Trần Cảnh',
      title: 'Chủ sở hữu & Đại diện bảo tàng',
      avatar: '🏛️',
      incidentType: 'Bức tranh gốc trị giá 5 triệu USD bị tráo thành tranh chép bằng sơn acrylic công nghiệp',
      lastSeen: '20:55 trước khi đèn tắt, bức tranh thật vẫn nằm trên giá treo bảo vệ',
      medicalReport: 'Không có thiệt hại nhân mạng. Hệ thống laser bảo vệ bị ngắt 5 phút từ 21:00 đến 21:05.'
    },
    synopsis: 'Trong đêm dạ tiệc bảo tàng, đúng 21:00 cúp điện toàn khu. Đến 21:05 đèn bật lại, bức tranh vẫn treo đó. Nhưng đến sáng hôm sau, chuyên gia soi kính hiển vi mới bàng hoàng phát hiện lớp sơn dạ quang trên tranh đã bị biến mất — đó là một bức tranh giả!',
    suspects: [
      {
        id: 'suspect_duy',
        name: 'Cố Duy',
        title: 'Chuyên gia phục chế tranh cổ',
        avatar: '🎨',
        gender: 'male',
        age: 34,
        personality: 'Khép kín, tỉ mỉ, đôi bàn tay luôn thơm mùi tinh dầu thông và sáp ong',
        relationshipToVictim: 'Người được thuê thẩm định và vệ sinh bức tranh gốc 1 tuần trước',
        initialQuote: '“Lúc cúp điện tôi đang ở nhà vệ sinh tầng hầm rửa tay vì bị đổ rượu vang, bóng tối mịt mù tôi chẳng thấy đường đi!”',
        statements: [
          {
            id: 'stmt_duy_1',
            topic: 'Nơi ở lúc mất điện 21:00',
            statementText: 'Tôi ở dưới toilet tầng hầm suốt 10 phút, không hề lên tầng 2 nơi treo bức tranh.',
            isInitial: true,
            hasContradiction: true,
            contradictedByClueId: 'clue_gallery_dust',
            contradictionExplanation: 'Dưới móng tay của Cố Duy dính bột dạ quang phát sáng đặc chủng của dây niêm phong chỉ gắn ở tầng 2!'
          }
        ],
        claimedAlibi: {
          timeSlot: '21:00 - 21:10',
          location: 'Nhà vệ sinh tầng hầm',
          claimedActivity: 'Rửa vết rượu vang đổ lên áo sơ mi',
          verified: false,
          brokenReason: 'Vết bột dạ quang niêm phong và keo khô nhanh dính trên tay.'
        },
        motive: {
          apparent: 'Mê đắm vẻ đẹp của bức tranh, muốn sở hữu kiệt tác độc nhất vô nhị.',
          hidden: 'Đã sao chép sẵn bản sao suốt 3 tháng và nhận hợp đồng xuất lậu tranh sang Châu Âu.',
          isDecisive: true
        },
        isCulprit: true,
        isRedHerring: false
      },
      {
        id: 'suspect_ngoc',
        name: 'Bích Ngọc',
        title: 'Quản lý hiện vật bảo tàng',
        avatar: '👩‍💼',
        gender: 'female',
        age: 29,
        personality: 'Nhanh nhẹn, cẩn trọng nhưng hay lo lắng thái quá',
        relationshipToVictim: 'Chịu trách nhiệm trực tiếp giữ chùm chìa khóa tủ kính bảo vệ',
        initialQuote: '“Tôi làm mất chùm chìa khóa phụ từ chiều, tôi đã rất sợ hãi và đi tìm khắp nơi lúc đèn tắt!”',
        statements: [
          {
            id: 'stmt_ngoc_1',
            topic: 'Chùm chìa khóa phụ bị mất',
            statementText: 'Tôi đánh rơi chìa khóa ở cầu thang lúc 17:00, không dám báo giám đốc.',
            isInitial: true,
            hasContradiction: false
          }
        ],
        claimedAlibi: {
          timeSlot: '21:00 - 21:05',
          location: 'Cầu thang thoát hiểm phía sau',
          claimedActivity: 'Dùng đèn pin điện thoại tìm chùm chìa khóa',
          verified: true
        },
        motive: {
          apparent: 'Cần tiền bồi thường bình gốm vỡ tuần trước.',
          isDecisive: false
        },
        isCulprit: false,
        isRedHerring: true,
        redHerringExplanation: 'Chìa khóa Ngọc làm rơi thực sự nằm kẹt dưới gầm cầu thang, không liên quan đến ổ khóa điện tử của tranh.'
      },
      {
        id: 'suspect_lam',
        name: 'Trọng Lâm',
        title: 'Đội trưởng An Ninh Bảo Tàng',
        avatar: '👮',
        gender: 'male',
        age: 45,
        personality: 'Nghiêm khắc, cứng nhắc, am hiểu hệ thống điện',
        relationshipToVictim: 'Phụ trách an ninh toàn bộ tòa nhà',
        initialQuote: '“Cầu dao bị ngắt do nhảy rơ-le quá tải máy lạnh, tôi phải chạy xuống trạm điện khởi động lại máy phát.”',
        statements: [
          {
            id: 'stmt_lam_1',
            topic: 'Sự cố sập điện',
            statementText: 'Tôi ở phòng máy biến áp tầng trệt cùng 1 bảo vệ khác gạt lại cầu dao.',
            isInitial: true,
            hasContradiction: false
          }
        ],
        claimedAlibi: {
          timeSlot: '21:00 - 21:05',
          location: 'Phòng máy biến áp tầng trệt',
          claimedActivity: 'Khởi động máy phát điện dự phòng',
          verified: true
        },
        motive: {
          apparent: 'Bị ban giám đốc cắt giảm 30% ngân sách an ninh.',
          isDecisive: false
        },
        isCulprit: false,
        isRedHerring: true,
        redHerringExplanation: 'Sự cố ngắt điện thực chất do chính Cố Duy gài rơ-le hẹn giờ ở tủ điện phụ, Lâm chỉ là người chạy đi khắc phục.'
      },
      {
        id: 'suspect_david',
        name: 'David Phan',
        title: 'Nhà sưu tầm tranh tư nhân',
        avatar: '🧐',
        gender: 'male',
        age: 50,
        personality: 'Giàu có, ngạo mạn, luôn mang theo gậy batoong',
        relationshipToVictim: 'Từng trả giá 4 triệu USD mua tranh nhưng bị bảo tàng từ chối bán',
        initialQuote: '“Tôi đứng ở ban công tầng 2 ngắm trăng lúc mất điện, tôi đâu rỗi hơi đi mò mẫm trong bóng tối!”',
        statements: [
          {
            id: 'stmt_david_1',
            topic: 'Ban công tầng 2',
            statementText: 'Tôi hút xì gà ở ban công cùng 2 vị khách thương gia người Pháp.',
            isInitial: true,
            hasContradiction: false
          }
        ],
        claimedAlibi: {
          timeSlot: '20:50 - 21:15',
          location: 'Ban công tầng 2',
          claimedActivity: 'Hút xì gà và trò chuyện với khách quốc tế',
          verified: true
        },
        motive: {
          apparent: 'Muốn có được bức tranh bằng mọi giá.',
          isDecisive: false
        },
        isCulprit: false,
        isRedHerring: true,
        redHerringExplanation: '2 vị khách Pháp làm chứng David Phan ở cùng họ suốt từ 20:50 đến 21:15.'
      }
    ],
    clues: [
      {
        id: 'clue_gallery_frame',
        title: 'Khung Tranh Sơn Mài & Lớp Keo Dính',
        type: 'physical_evidence',
        icon: '🖼️',
        locationFound: 'Mặt sau khung tranh treo tại Gian Phòng Vàng',
        summary: 'Bức tranh giả được gắn vào khung gỗ thật bằng một lớp keo dán cao su khô nhanh.',
        detailedAnalysis: 'Lớp keo này là loại keo dán chuyên dụng của ngành phục chế tranh cổ, mới khô được khoảng vài tiếng.',
        isUnlockedByDefault: true,
        pointsToUnlock: 0,
        linkedSuspectIds: ['suspect_duy'],
        linkedClueIds: ['clue_gallery_tube', 'clue_gallery_dust'],
        sceneCoordinates: { x: 50, y: 35 }
      },
      {
        id: 'clue_gallery_dust',
        title: 'Bột Dạ Quang Niêm Phong Dưới Móng Tay',
        type: 'forensics',
        icon: '✨',
        locationFound: 'Bàn tay phải của Cố Duy khi kiểm tra dưới đèn cực tím',
        summary: 'Bột phát quang màu xanh lục bám dày đặc ở kẽ móng tay trỏ và ngón cái của Cố Duy.',
        detailedAnalysis: 'Đây là bột đánh dấu an ninh chỉ quét trên sợi dây cước niêm phong bảo tàng bọc quanh giá tranh tầng 2 lúc 20:00.',
        isUnlockedByDefault: false,
        pointsToUnlock: 50,
        linkedSuspectIds: ['suspect_duy'],
        linkedClueIds: ['clue_gallery_frame'],
        isKeyDecisiveEvidence: true,
        leadsToDeduction: 'Cố Duy trực tiếp cắt dây niêm phong bức tranh ở tầng 2 lúc cúp điện, hoàn toàn nói dối việc ở dưới toilet!',
        contradictsStatementId: 'stmt_duy_1'
      },
      {
        id: 'clue_gallery_tube',
        title: 'Ống Đựng Giấy Vẽ Trục Rỗng 2 Lớp',
        type: 'physical_evidence',
        icon: '📜',
        locationFound: 'Trong túi đựng dụng cụ vẽ của Cố Duy gửi tại quầy lễ tân',
        summary: 'Ống da đựng bản vẽ khổ A0 có ngăn bí mật ở lõi giữa.',
        detailedAnalysis: 'Bên trong ngăn bí mật tìm thấy bức tranh thật "Vương Miện Ánh Dương" đã được cuộn tròn khéo léo bọc vải nhung.',
        isUnlockedByDefault: false,
        pointsToUnlock: 40,
        linkedSuspectIds: ['suspect_duy'],
        linkedClueIds: ['clue_gallery_frame'],
        leadsToDeduction: 'Vật chứng không thể chối cãi: Bức tranh thật đang nằm trong ống vẽ của Cố Duy!'
      },
      {
        id: 'clue_gallery_relay',
        title: 'Rơ-le Hẹn Giờ Gắn Trong Tủ Điện Phụ',
        type: 'scene_trace',
        icon: '⏱️',
        locationFound: 'Tủ điện tầng 2 giấu sau tấm rèm nhung',
        summary: 'Một rơ-le điện tử mini được đấu nối vào mạch chiếu sáng chính, hẹn giờ kích hoạt ngắn mạch lúc đúng 21:00.',
        detailedAnalysis: 'Dấu vân tay trên vỏ rơ-le trùng khớp với ngón út bàn tay trái của Cố Duy.',
        isUnlockedByDefault: false,
        pointsToUnlock: 30,
        linkedSuspectIds: ['suspect_duy'],
        linkedClueIds: [],
        leadsToDeduction: 'Vụ cúp điện là âm mưu được chuẩn bị sẵn từ trước bằng rơ-le hẹn giờ.'
      }
    ],
    timeline: [
      {
        id: 'tl_g1',
        timeStr: '17:00',
        location: 'Gian Phòng Vàng',
        description: 'Cố Duy mang đồ nghề thẩm định vào kiểm tra tranh lần cuối trước giờ dạ tiệc.',
        involvedSuspectIds: ['suspect_duy'],
        isConfirmed: true,
        source: 'Camera lễ tân'
      },
      {
        id: 'tl_g2',
        timeStr: '20:00',
        location: 'Gian Phòng Vàng',
        description: 'Bảo tàng quét bột dạ quang lên dây niêm phong giá tranh.',
        involvedSuspectIds: ['suspect_ngoc'],
        isConfirmed: true,
        source: 'Quy trình an ninh bảo tàng'
      },
      {
        id: 'tl_g3',
        timeStr: '21:00',
        location: 'Toàn bộ tòa nhà',
        description: 'Rơ-le kích hoạt sập điện. Toàn bộ đèn và laser an ninh tắt ngúm.',
        involvedSuspectIds: ['suspect_duy'],
        isConfirmed: true,
        source: 'Nhật ký trạm điện'
      },
      {
        id: 'tl_g4',
        timeStr: '21:01 - 21:03',
        location: 'Gian Phòng Vàng',
        description: 'Cố Duy đeo kính nhìn đêm, cắt dây niêm phong, gỡ tranh thật nhét vào ống vẽ và dán tranh giả lên giá.',
        involvedSuspectIds: ['suspect_duy'],
        isConfirmed: false,
        source: 'Bột dạ quang & keo phục chế'
      },
      {
        id: 'tl_g5',
        timeStr: '21:05',
        location: 'Toàn tòa nhà',
        description: 'Điện được bật lại. Bức tranh giả trông y như thật dưới ánh đèn vàng mờ.',
        involvedSuspectIds: ['suspect_lam'],
        isConfirmed: true,
        source: 'Lời khai nhân chứng'
      }
    ],
    truth: {
      culpritId: 'suspect_duy',
      culpritName: 'Cố Duy',
      decisiveClueId: 'clue_gallery_dust',
      decisiveContradiction: 'Cố Duy khai ở dưới nhà vệ sinh tầng hầm suốt thời gian cúp điện, nhưng dưới móng tay anh ta bám đầy bột dạ quang chỉ có trên dây niêm phong bọc quanh tranh ở tầng 2, và bức tranh thật được giấu trong ống vẽ của chính anh ta.',
      realMotive: 'Đã vẽ bản sao suốt 3 tháng để tráo lấy bức tranh gốc 5 triệu USD bán cho đường dây buôn lậu cổ vật xuyên quốc gia.',
      realModusOperandi: 'Lợi dụng vị trí chuyên gia phục chế, Cố Duy gắn sẵn rơ-le hẹn giờ gây chập điện lúc 21:00. Trong 5 phút bóng tối, anh ta cắt dây niêm phong, tháo tranh thật cuộn vào ống vẽ 2 đáy, dán tranh giả bằng keo cao su nhanh khô rồi thản nhiên hòa vào dòng người.',
      recreationSteps: [
        '1. Cố Duy vẽ sẵn bản sao bức tranh tinh xảo từ phòng tranh cá nhân.',
        '2. Chiều hôm đó, anh ta gắn rơ-le hẹn giờ sập điện lúc 21:00 trong tủ điện tầng 2.',
        '3. Đúng 21:00 khi đèn tắt, anh ta cắt dây niêm phong (khiến bột dạ quang dính vào kẽ móng tay).',
        '4. Tháo tranh thật nhét vào ống vẽ hai đáy, gắn bức tranh giả đã phết sẵn keo cao su lên khung.',
        '5. Khi đèn sáng lại, gửi ống vẽ tại quầy lễ tân để chuẩn bị tẩu tán vào sáng hôm sau.'
      ],
      howRedHerringsCleared: [
        {
          suspectId: 'suspect_ngoc',
          suspectName: 'Bích Ngọc',
          clearedByReason: 'Chỉ làm rơi chìa khóa ở cầu thang vì bất cẩn, không hề đụng vào tranh.'
        },
        {
          suspectId: 'suspect_lam',
          suspectName: 'Trọng Lâm',
          clearedByReason: 'Có mặt ở phòng máy biến áp tầng trệt cùng đồng đội khắc phục sự cố điện.'
        },
        {
          suspectId: 'suspect_david',
          suspectName: 'David Phan',
          clearedByReason: 'Được 2 thương gia người Pháp xác nhận đứng trò chuyện ở ban công suốt thời gian xảy ra vụ án.'
        }
      ]
    }
  },

  // =========================================================================
  // CASE 3: BÓNG MA NHÀ HÁT ÁNH TRĂNG
  // =========================================================================
  {
    id: 'preset_theatre',
    title: 'Bóng Ma Nhà Hát Ánh Trăng',
    subtitle: 'Vụ mưu sát danh ca opera bằng chùm đèn pha lê 500kg',
    category: 'murder',
    difficulty: 'hard',
    badge: 'Mưu Sát Sân Khấu',
    coverIcon: '🎭',
    themeColor: '#7c3aed',
    crimeSceneName: 'Nhà Hát Lớn Thành Phố - Sân Khấu Chính & Giàn Treo Tầng Thượng',
    crimeSceneDescription: 'Trong buổi tổng duyệt vở opera "Bóng Ma Sông Seine", chùm đèn pha lê khổng lồ nặng nửa tấn bất ngờ đứt cáp rơi thẳng xuống vị trí nữ chính Tuyết Băng đang đứng hát.',
    victim: {
      name: 'Tuyết Băng',
      title: 'Nữ danh ca Opera số 1',
      avatar: '💃',
      incidentType: 'Suýt bị chùm đèn 500kg đè trúng, bị chấn thương vai do nhảy tránh kịp trong tích tắc',
      lastSeen: '20:30 đứng tại dấu X màu đỏ giữa sân khấu cất giọng nốt cao',
      medicalReport: 'Trầy xước phần mềm vai trái và ngất do hoảng loạn. Vết cắt trên dây cáp chịu lực là vết cưa kim loại ngọt lịm.'
    },
    synopsis: 'Lúc 20:30, khi Tuyết Băng cất tiếng hát nốt cao trào, chùm đèn pha lê rơi tự do từ độ cao 15 mét. Kỳ lạ ở chỗ, dây cáp đã bị cưa đứt 90% từ trước, nhưng lại được gài một cơ chế hẹn giờ bằng đá khô để rơi đúng vào khoảnh khắc cô đứng vào vị trí!',
    suspects: [
      {
        id: 'suspect_huy',
        name: 'Đức Huy',
        title: 'Nhạc trưởng dàn nhạc giao hưởng',
        avatar: '🎼',
        gender: 'male',
        age: 40,
        personality: 'Cầu toàn đến mức cực đoan, luôn mang găng tay trắng khi chỉ huy',
        relationshipToVictim: 'Bị Tuyết Băng dọa hủy hợp đồng diễn nếu không tăng thù lao cho cô gấp đôi',
        initialQuote: '“Lúc 20:20 tôi đang ngồi chỉnh dây đàn piano ở cánh gà phía đông, có rất nhiều nhạc công nhìn thấy!”',
        statements: [
          {
            id: 'stmt_huy_1',
            topic: 'Nơi ở trước lúc đèn rơi',
            statementText: 'Tôi ở cánh gà phía đông suốt từ 20:10 đến khi tai nạn xảy ra, không hề lên giàn treo phía tây.',
            isInitial: true,
            hasContradiction: true,
            contradictedByClueId: 'clue_theatre_shoes',
            contradictionExplanation: 'Đế giày da của Huy dính dầu bôi trơn đặc chủng và mạt cưa sắt chỉ có trên sàn giàn treo phía tây!'
          }
        ],
        claimedAlibi: {
          timeSlot: '20:10 - 20:30',
          location: 'Cánh gà phía đông',
          claimedActivity: 'Chỉnh dây đàn piano',
          verified: false,
          brokenReason: 'Vết dầu bôi trơn ròng rọc giàn treo dính dưới đế giày da và mạt đá khô trong túi xách.'
        },
        motive: {
          apparent: 'Mâu thuẫn tài chính gay gắt với nạn nhân.',
          hidden: 'Bị Tuyết Băng nắm giữ bằng chứng ông đạo nhạc từ một nhà soạn nhạc quá cố.',
          isDecisive: true
        },
        isCulprit: true,
        isRedHerring: false
      },
      {
        id: 'suspect_uyen',
        name: 'Mỹ Uyên',
        title: 'Ca sĩ hát lót (Understudy)',
        avatar: '🎤',
        gender: 'female',
        age: 24,
        personality: 'Tham vọng, xinh đẹp, luôn khao khát được đứng trên sân khấu chính',
        relationshipToVictim: 'Người thay thế trực tiếp nếu Tuyết Băng không thể biểu diễn',
        initialQuote: '“Tôi ở trong phòng thay đồ livestream giao lưu cùng người hâm mộ từ 20:15 đến 20:35, các bạn có thể kiểm tra video phát trực tiếp!”',
        statements: [
          {
            id: 'stmt_uyen_1',
            topic: 'Livestream trên mạng',
            statementText: 'Tôi phát trực tiếp trên trang cá nhân liên tục 20 phút không rời khỏi ống kính máy ảnh.',
            isInitial: true,
            hasContradiction: false
          }
        ],
        claimedAlibi: {
          timeSlot: '20:15 - 20:35',
          location: 'Phòng thay đồ số 2',
          claimedActivity: 'Livestream trên mạng xã hội',
          verified: true
        },
        motive: {
          apparent: 'Muốn chiếm vai chính đêm khai màn.',
          isDecisive: false
        },
        isCulprit: false,
        isRedHerring: true,
        redHerringExplanation: 'Uyên lén giấu trang phục diễn của Tuyết Băng vì đố kỵ, nhưng có video livestream chứng minh không có mặt ở giàn treo.'
      },
      {
        id: 'suspect_thanh',
        name: 'Văn Thành',
        title: 'Kỹ thuật viên ánh sáng',
        avatar: '👷‍♂️',
        gender: 'male',
        age: 32,
        personality: 'Cẩu thả, mê rượu, thường xuyên đi làm muộn',
        relationshipToVictim: 'Từng bị Tuyết Băng mắng chửi thậm tệ vì rọi sai đèn sân khấu',
        initialQuote: '“Tôi ngồi ở buồng điều khiển tầng 3, lúc đó tôi hoa mắt nên nhìn thấy một bóng đen lướt qua giàn treo!”',
        statements: [
          {
            id: 'stmt_thanh_1',
            topic: 'Bóng đen trên giàn treo',
            statementText: 'Tôi thấy bóng người mặc áo choàng đen lúc 20:15 trên giàn treo.',
            isInitial: true,
            hasContradiction: true,
            contradictedByClueId: 'clue_theatre_flask',
            contradictionExplanation: 'Thành say rượu ngủ gật ở buồng điều khiển, khai bịa bóng đen để trốn tội tắc trách!'
          }
        ],
        claimedAlibi: {
          timeSlot: '20:10 - 20:30',
          location: 'Buồng điều khiển ánh sáng tầng 3',
          claimedActivity: 'Điều khiển bảng đèn theo kịch bản',
          verified: false,
          brokenReason: 'Uống rượu say ngủ gật, hoàn toàn không liên quan đến vụ cắt cáp.'
        },
        motive: {
          apparent: 'Hận thù cá nhân vì bị làm nhục trước mặt đoàn kịch.',
          isDecisive: false
        },
        isCulprit: false,
        isRedHerring: true,
        redHerringExplanation: 'Khai báo dối trá chỉ để che đậy việc say xỉn trong giờ làm việc.'
      }
    ],
    clues: [
      {
        id: 'clue_theatre_cable',
        title: 'Đoạn Dây Cáp Ròng Rọc & Khối Đá Khô',
        type: 'physical_evidence',
        icon: '🪢',
        locationFound: 'Trục ròng rọc số 4 trên giàn treo trần nhà hát',
        summary: 'Cáp thép 12mm bị cưa gần đứt, có vết nước đọng lạnh và bọt khí CO2.',
        detailedAnalysis: 'Thủ phạm đã cưa sẵn 90% sợi cáp, dùng một khối đá khô (CO2 rắn) chèn giữ chốt khóa. Khi đá khô thăng hoa hết sau 20 phút, chốt bật ra làm chùm đèn rơi!',
        isUnlockedByDefault: true,
        pointsToUnlock: 0,
        linkedSuspectIds: ['suspect_huy'],
        linkedClueIds: ['clue_theatre_shoes', 'clue_theatre_box'],
        sceneCoordinates: { x: 50, y: 10 }
      },
      {
        id: 'clue_theatre_shoes',
        title: 'Vết Dầu Bôi Trơn & Mạt Kim Loại Trên Giày',
        type: 'forensics',
        icon: '👞',
        locationFound: 'Đế đôi giày da hiệu Oxford của Nhạc Trưởng Huy',
        summary: 'Dưới rãnh đế giày dính dầu máy đặc chủng màu đen xám pha bột sắt.',
        detailedAnalysis: 'Dầu mỡ này có pha phẩm nhuộm chống gỉ độc quyền của giàn treo ròng rọc tầng thượng phía tây, chứng minh Huy đã trèo lên đó trước 20:15.',
        isUnlockedByDefault: false,
        pointsToUnlock: 50,
        linkedSuspectIds: ['suspect_huy'],
        linkedClueIds: ['clue_theatre_cable'],
        isKeyDecisiveEvidence: true,
        leadsToDeduction: 'Đức Huy trực tiếp trèo lên giàn treo cưa cáp và đặt bẫy đá khô!',
        contradictsStatementId: 'stmt_huy_1'
      },
      {
        id: 'clue_theatre_box',
        title: 'Hộp Giữ Nhiệt Chứa Đá Khô Dưới Ghế Chỉ Huy',
        type: 'physical_evidence',
        icon: '🧊',
        locationFound: 'Giấu dưới bục chỉ huy dàn nhạc của Đức Huy',
        summary: 'Một bình giữ nhiệt mini còn sót lại vụn đá khô và lưỡi cưa sắt mini.',
        detailedAnalysis: 'Dấu vân tay trên cán cưa khớp hoàn toàn với ngón trỏ của Đức Huy.',
        isUnlockedByDefault: false,
        pointsToUnlock: 40,
        linkedSuspectIds: ['suspect_huy'],
        linkedClueIds: ['clue_theatre_cable'],
        leadsToDeduction: 'Vật chứng hung khí trực tiếp thuộc quyền sở hữu của Đức Huy!'
      },
      {
        id: 'clue_theatre_flask',
        title: 'Bình Rượu Nửa Chừng Trong Buồng Đèn',
        type: 'scene_trace',
        icon: '🍾',
        locationFound: 'Dưới gầm bàn điều khiển ánh sáng',
        summary: 'Bình rượu Vodka uống dở của Văn Thành.',
        detailedAnalysis: 'Nồng độ cồn trong hơi thở Thành đo được 0.8mg/lít, chứng minh anh ta ngủ say như chết lúc xảy ra tai nạn.',
        isUnlockedByDefault: false,
        pointsToUnlock: 20,
        linkedSuspectIds: ['suspect_thanh'],
        linkedClueIds: [],
        leadsToDeduction: 'Loại bỏ lời khai hoang đường về "bóng đen bí ẩn".'
      }
    ],
    timeline: [
      {
        id: 'tl_t1',
        timeStr: '19:45',
        location: 'Sân thượng nhà hát',
        description: 'Đức Huy trèo lên giàn treo phía tây, cưa 90% dây cáp và chèn khối đá khô giữ chốt.',
        involvedSuspectIds: ['suspect_huy'],
        isConfirmed: false,
        source: 'Dấu vết giày da & hộp giữ nhiệt'
      },
      {
        id: 'tl_t2',
        timeStr: '20:15',
        location: 'Phòng thay đồ & Cánh gà',
        description: 'Mỹ Uyên bắt đầu livestream. Đức Huy xuống cánh gà vờ chỉnh đàn piano.',
        involvedSuspectIds: ['suspect_uyen', 'suspect_huy'],
        isConfirmed: true,
        source: 'Video phát trực tiếp'
      },
      {
        id: 'tl_t3',
        timeStr: '20:30',
        location: 'Sân khấu chính',
        description: 'Tuyết Băng bước ra vị trí nốt cao trào. Đá khô tan hết, chùm đèn 500kg đứt cáp lao xuống.',
        involvedSuspectIds: [],
        isConfirmed: true,
        source: 'Toàn bộ đoàn kịch chứng kiến'
      }
    ],
    truth: {
      culpritId: 'suspect_huy',
      culpritName: 'Đức Huy',
      decisiveClueId: 'clue_theatre_shoes',
      decisiveContradiction: 'Đức Huy khai ở cánh gà phía đông chỉnh đàn piano, nhưng đế giày da của ông ta dính đầy dầu mỡ đặc chủng giàn treo phía tây và trong bục chỉ huy giấu bình giữ nhiệt chứa đá khô cùng lưỡi cưa sắt.',
      realMotive: 'Bị Tuyết Băng tống tiền và đe dọa phanh phui việc đạo nhạc, muốn dàn dựng tai nạn sân khấu để bịt miệng cô vĩnh viễn.',
      realModusOperandi: 'Lợi dụng hiểu biết về giàn treo sân khấu, Huy cưa gần đứt dây cáp chịu lực rồi dùng đá khô chèn đòn bẩy. Thời gian đá khô thăng hoa chính xác là 30 phút, đúng vào thời điểm Tuyết Băng bước ra giữa sân khấu hát nốt cao trào.',
      recreationSteps: [
        '1. Đức Huy mua đá khô và lưỡi cưa giấu trong bình giữ nhiệt mang vào nhà hát.',
        '2. Lúc 19:45, ông ta trèo lên giàn treo phía tây cưa 90% dây cáp và nêm khối đá khô vào chốt an toàn.',
        '3. Đi xuống cánh gà lúc 20:15 làm chứng cứ ngoại phạm vờ chỉnh dây đàn piano.',
        '4. Khi đá khô bốc hơi hết sau 30 phút, lực căng làm cáp đứt phựt khiến chùm đèn lao tự do.',
        '5. Giấu lưỡi cưa dưới bục chỉ huy trước khi công an phong tỏa hiện trường.'
      ],
      howRedHerringsCleared: [
        {
          suspectId: 'suspect_uyen',
          suspectName: 'Mỹ Uyên',
          clearedByReason: 'Livestream liên tục trên mạng xã hội 20 phút trước hàng trăm khán giả.'
        },
        {
          suspectId: 'suspect_thanh',
          suspectName: 'Văn Thành',
          clearedByReason: 'Say rượu ngủ gật tại buồng điều khiển, hoàn toàn bịa chuyện bóng đen để lấp liếm lỗi lầm.'
        }
      ]
    }
  }
];
