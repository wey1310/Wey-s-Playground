import {
  NPCVillager,
  NPCStatement,
  NightAction,
  NightResolution,
} from './werewolfTypes';

/**
 * Generate initial opening statement for an NPC at Night 0 / Start of Game
 */
export function generateInitialNPCStatement(npc: NPCVillager): NPCStatement {
  const statementsByJob: Record<string, string[]> = {
    'Trưởng Thôn': [
      'Tôi giữ chìa khóa tháp chuông làng cổ. Dân làng hãy bình tĩnh và tỉnh táo trước móng vuốt bóng đêm!',
      'Hỡi bà con, mọi quyết định của chúng ta hôm nay đều quyết định sự tồn vong của ngôi làng.'
    ],
    'Thợ Rèn Lực Lưỡng': [
      'Lò rèn của tôi đêm qua đỏ lửa đến khuya. Ai dám bén mảng tới tôi sẽ vung búa sắt trừng trị!',
      'Tôi là người bộc trực, ghét nhất kẻ giấu mặt cắn trộm trong bóng tối.'
    ],
    'Giáo Viên Làng': [
      'Tôi luôn ghi chép tỉ mỉ từng lời nói và cử chỉ bất thường của từng người vào nhật ký làng.',
      'Sự thật chỉ có một. Hãy dùng tư duy logic để bóc trần những lời ngụy biện.'
    ],
    'Thợ Săn Rừng Sâu': [
      'Khu rừng thông cấm có nhiều dấu vết móng vuốt lạ. Cung tên của tôi luôn sẵn sàng trên tay.',
      'Đừng để vẻ ngoài hiền lành đánh lừa, loài sói rất giỏi trà trộn vào dân làng.'
    ],
    'Dược Sĩ Thảo Mộc': [
      'Đêm qua tôi sắc thuốc thảo mộc trong vườn nấm. Mùi hương có thể át đi tử khí của bầy sói.',
      'Thuốc độc hay thuốc cứu người đều nằm trong tay người có tâm thiện lành.'
    ],
    'Họa Sĩ Phong Cảnh': [
      'Tôi thích vẽ tranh dưới ánh trăng. Ánh mắt của kẻ ác không bao giờ giấu được nét vẽ của tôi!',
      'Tôi quan sát thấy nhiều bóng đen di chuyển kỳ lạ quanh bìa làng khi sương mù buông xuống.'
    ],
    'Bà Chủ Tiệm Bánh': [
      'Bánh mì nóng thơm lừng cả xóm, tôi chỉ mong làng ta yên bình như bao năm qua.',
      'Tôi sống ở làng hơn 40 năm rồi, tôi tin dân làng ta sẽ tìm ra kẻ ác!'
    ],
    'Người Giữ Ngọn Hải Đăng': [
      'Từ đỉnh ngọn hải đăng, tôi nhìn thấy rõ từng chuyển động trên con đường lát đá ven biển.',
      'Sương mù đêm qua rất dày, nhưng ngọn hải đăng của tôi chưa bao giờ tắt.'
    ],
    'Người Đốn Củi': [
      'Rìu đốn củi của tôi luôn để đầu giường. Tôi nghe thấy tiếng sói tru từ phía thung lũng đá.',
      'Tôi sống một mình ở bìa rừng nên rất cảnh giác với bất kỳ tiếng động lạ nào.'
    ],
    'Thợ May Tinh Tế': [
      'Từng đường kim mũi chỉ đều cần sự tỉ mỉ. Tôi để ý thấy áo của một vài người có vết rách lạ...',
      'Tôi khâu vá suốt đêm, tai tôi nghe ngóng được rất nhiều tiếng bước chân lén lút.'
    ],
    'Ngư Dân Lão Luyện': [
      'Mặt hồ phẳng lặng nhưng dưới đáy luôn có sóng ngầm. Đêm qua hồ Lặng Sóng gợn sóng rất lạ.',
      'Kinh nghiệm đi biển dạy tôi: kẻ im lặng nhất thường là kẻ nguy hiểm nhất.'
    ],
    'Thủ Thư Thư Viện Cổ': [
      'Sách cổ có ghi chép về loài ma sói biến hình vào đêm trăng tròn. Chúng ta phải tìm ra chúng!',
      'Tôi thức đọc sách cổ cả đêm, tháp thư viện luôn khóa chặt then cài.'
    ],
    'Thiên Văn Học Gia': [
      'Bầu trời đêm qua có sao chổi quét qua chòm sao Đại Hùng. Điềm báo ma sói đang rình rập quanh làng!',
      'Kính thiên văn của tôi nhìn thấy những bóng đen di chuyển chớp nhoáng trên đồi phía Đông.'
    ],
    'Nghệ Sĩ Đàn Vĩ Cầm': [
      'Tôi chơi vĩ cầm trong đêm trăng để trấn an tâm trí. Tiếng đàn du dương nhưng lòng tôi đầy bất an.',
      'Âm nhạc phản ánh tâm hồn. Kẻ mang tâm địa loài sói không thể thưởng thức giai điệu thanh khiết.'
    ],
    'Thợ Chế Tác Đồng Hồ': [
      'Từng bánh răng thời gian không bao giờ nói dối. Lúc nửa đêm đúng 12 giờ, tôi nghe thấy tiếng tru rùng rợn.',
      'Cỗ máy đồng hồ tháp làng vẫn điểm đúng giờ, nhưng nhịp tim dân làng đang đập hoảng loạn.'
    ],
    'Thợ Gốm Mỹ Thuật': [
      'Đêm qua tôi nung mẻ gốm mới. Lửa lò rực sáng giúp tôi xua đi nỗi sợ hãi bóng đêm.',
      'Bàn xoay gốm đòi hỏi sự tĩnh lặng. Tôi cảm nhận được sự dao động bất thường của ai đó quanh xưởng gốm.'
    ],
    'Người Phân Xử Làng Cổ': [
      'Cán cân công lý cần bằng chứng xác thực. Đừng phán xét vội vàng kẻo làm hại người vô tội!',
      'Tôi đã chứng kiến bao biến cố của làng. Kẻ phạm tội dù xảo quyệt đến đâu cũng sẽ để lại sơ hở.'
    ],
    'Nhà Chiêm Tinh Trẻ': [
      'Những lá bài cổ cảnh báo: Kẻ mang hai bộ mặt đang ngồi giữa chúng ta!',
      'Khói hương trầm đêm qua cuộn lại hình móng vuốt sói hung dữ.'
    ],
    'Thợ Mỏ Địa Chất': [
      'Dưới hầm mỏ tối tăm tôi không sợ, nhưng ma sói đội lốt người thì thật sự đáng sợ!',
      'Tiếng cuốc chim đục đá đêm qua dội lại tiếng bước chân lén lút trên mặt đất.'
    ],
    'Chủ Vườn Hoa Đêm': [
      'Hoa dạ lý hương đêm qua héo rũ bất thường khi có luồng tà khí thoảng qua vườn.',
      'Tôi thức tưới hoa đêm và phát hiện vài cành hồng dại bị giẫm nát bởi bàn chân to lớn.'
    ],
    'Nhà Thám Hiểm Rừng Mây': [
      'Tôi từng đối đầu với dã thú ở rừng mây, nhưng móng vuốt ma sói xảo quyệt hơn nhiều.',
      'Bản đồ địa hình của tôi chỉ rõ những lối mòn bí mật mà bầy sói có thể lẩn trốn.'
    ],
    'Người Lái Đò Bến Đục': [
      'Sương mù trên sông dày đặc, chiếc đò của tôi đêm qua neo chặt không dám chở khách lạ.',
      'Nước sông Lặng Sóng đêm qua cuộn xoáy kỳ lạ như báo hiệu tai ương sắp giáng xuống.'
    ],
    'Người Huấn Luyện Ngựa': [
      'Đàn ngựa của tôi đêm qua hí vang và giậm chân hoảng loạn. Chúng ngửi thấy mùi dã thú!',
      'Loài ngựa có trực giác nhạy bén, chúng cự tuyệt những kẻ mang sát khí ma sói.'
    ],
    'Bà Chủ Quán Trà Đạo': [
      'Mời mọi người chén trà an thần. Hãy giữ tâm trí tĩnh lặng trước khi đưa ra quyết định phán xét.',
      'Hương trà thơm giúp thanh lọc tâm hồn, kẻ nói dối sẽ run rẩy khi cầm chén trà nóng.'
    ],
    'Chủ Cối Xay Gió Làng': [
      'Cánh cối xay gió trên đồi cao đón gió đêm, tôi nhìn bao quát được toàn bộ nóc nhà trong làng.',
      'Gió đêm mang theo tiếng hú lạnh gáy từ cánh rừng phía Bắc tràn về.'
    ],
    'Thợ Đúc Nến Thơm': [
      'Những ngọn nến sáp ong của tôi có thể tỏa sáng xua tan bóng tối tà ác.',
      'Đêm qua ngọn nến trong xưởng tôi bỗng nhiên bùng lửa xanh kỳ dị!'
    ],
    'Xạ Thủ Trẻ': [
      'Mũi tên bạc của tôi đã sẵn sàng trên dây cung. Kẻ nào lộ móng vuốt sói sẽ không kịp hối hận!',
      'Tôi đã canh gác ở cổng làng cả đêm, không ai được phép làm hại những người dân vô tội.'
    ],
    'Nghệ Nhân Đan Len': [
      'Bà già này đan áo cả đời rồi, đôi mắt tuy mờ nhưng nhìn thấu được ai thật lòng, ai giả dối.',
      'Cầu mong thần linh bảo vệ ngôi làng nhỏ bé của chúng ta qua đêm giông bão này.'
    ],
    'Người Nuôi Ong Rừng': [
      'Đàn ong rừng của tôi cực kỳ nhạy cảm. Chúng tránh xa những kẻ mang dòng máu sói hung tợn.',
      'Mùi hương của sự lừa dối không thể giấu được khứu giác của bầy ong mật.'
    ],
    'Chủ Nông Trại Lúa Mì': [
      'Vựa lúa mì là nguồn sống của làng. Chúng ta phải đoàn kết tiêu diệt lũ sói gian ác!',
      'Đêm qua tôi đi kiểm tra kho thóc và thấy bóng người lén lút lướt qua hàng rào.'
    ],
    'Nhạc Công Du Mục': [
      'Tôi đi khắp bốn phương trời, nghe bao chuyện ly kỳ về ma sói. Không ngờ hôm nay lại gặp ở đây!',
      'Giai điệu của khúc ca du mục sẽ phơi bày bộ mặt thật của kẻ thủ ác.'
    ],
    'Nhà Sử Học Làng Cổ': [
      'Biên niên sử làng từng ghi nhận đại nạn ma sói 100 năm trước. Lịch sử đang lặp lại!',
      'Muốn đánh bại bầy sói, chúng ta phải dùng trí tuệ và sự tỉnh táo của người xưa.'
    ],
    'Đầu Bếp Quán Trọ Quả Sồi': [
      'Bếp lửa quán trọ đêm qua không tắt. Ai đó đã ghé qua xin nước uống với dáng vẻ rất khả nghi...',
      'Món súp nấm của tôi nấu bằng thảo mộc làng, kẻ gian ăn vào ắt sẽ lộ sơ hở.'
    ],
    'Đội Trưởng Dân Phòng': [
      'Tôi đã tăng cường tuần tra các ngả đường làng. Hãy tin tưởng vào hàng ngũ phòng thủ!',
      'Bất kỳ kẻ nào rời khỏi nhà lúc nửa đêm đều phải giải trình rõ ràng trước dân làng.'
    ],
    'Chủ Vườn Táo Đỏ': [
      'Vườn táo của tôi đỏ mọng, tôi không để bất kỳ con quái vật nào làm vấy bẩn ngôi làng.',
      'Sáng nay nhặt táo tôi thấy cành cây bị gãy bởi một sức mạnh phi thường của loài dã thú.'
    ],
    'Nhà Giả Kim Cổ Truyền': [
      'Dung dịch thử nghiệm của tôi chuyển sang màu tím thẫm khi tiếp xúc với không khí làng đêm qua.',
      'Thuật giả kim dạy tôi rằng chân lý luôn ẩn giấu dưới lớp vỏ bọc bình thường.'
    ]
  };

  const pool = statementsByJob[npc.job] || [
    `Tôi là ${npc.name}, một cư dân lương thiện của làng. Tôi thề sẽ cùng dân làng tìm ra ma sói!`,
    `Mong các điều tra viên sáng suốt vạch trần kẻ sát nhân giấu mặt!`
  ];

  const content = pool[Math.floor(Math.random() * pool.length)];

  return {
    type: 'testimony',
    typeLabel: 'Lời khai ban đầu',
    icon: '📜',
    content,
    night: 0
  };
}

/**
 * Generate rich, contextual NPC statement after a Night concludes
 */
export function generateNPCStatement(
  npc: NPCVillager,
  allNpcs: NPCVillager[],
  resolution: NightResolution,
  currentNight: number
): NPCStatement {
  const aliveNpcs = allNpcs.filter(n => n.isAlive && n.id !== npc.id);
  const deadNpcs = allNpcs.filter(n => !n.isAlive);
  const casualties = resolution.casualties.map(cId => allNpcs.find(n => n.id === cId)).filter(Boolean) as NPCVillager[];

  // Highest suspected alive neighbor by this NPC
  let mostSuspectedNpc: NPCVillager | undefined = undefined;
  let maxSusp = -1;
  aliveNpcs.forEach(other => {
    const susp = npc.suspicion[other.id] || 0;
    if (susp > maxSusp) {
      maxSusp = susp;
      mostSuspectedNpc = other;
    }
  });

  // Randomly determine category: testimony, defense, suspicion, speculation
  const rand = Math.random();

  // 1. Werewolf Special Statements (Lừa dối, đánh lạc hướng, tạo ngoại phạm)
  if (npc.role === 'werewolf') {
    if (rand < 0.35 && mostSuspectedNpc) {
      return {
        type: 'suspicion',
        typeLabel: 'Nghi ngờ',
        icon: '👁️',
        content: `Tôi thấy sáng nay ${mostSuspectedNpc.name} (${mostSuspectedNpc.job}) biểu cảm rất bất thường, ánh mắt lấm lét như đang che giấu điều gì đó!`,
        night: currentNight
      };
    } else if (rand < 0.7) {
      const excuses = [
        `Đêm qua tôi sợ quá nên khóa chặt cửa ở trong nhà trùm chăn suốt, nghe thấy tiếng gió rít bên ngoài mà run bắn người!`,
        `Tôi nghe tiếng bước chân rầm rập chạy về hướng tháp chuông, chắc chắn sói không ở gần nhà tôi đâu!`,
        `Tôi thề danh dự là một người làm việc chăm chỉ, sáng sớm nay tôi còn dậy sớm quét dọn sân nhà!`,
        `Tại sao mọi người lại nhìn tôi? Tôi chỉ là một cư dân vô tội muốn bảo vệ ngôi làng thân yêu này!`
      ];
      return {
        type: 'defense',
        typeLabel: 'Biện hộ',
        icon: '🛡️',
        content: excuses[Math.floor(Math.random() * excuses.length)],
        night: currentNight
      };
    } else {
      return {
        type: 'speculation',
        typeLabel: 'Suy đoán',
        icon: '💡',
        content: `Nếu bầy sói đã nhắm vào ${casualties[0]?.name || 'nạn nhân'}, ắt hẳn kẻ giấu mặt phải là người rất am hiểu địa hình ngôi làng!`,
        night: currentNight
      };
    }
  }

  // 2. Seer Special Statements (Đưa ra gợi ý thông minh nếu đã soi)
  if (npc.role === 'seer') {
    const investigated = Object.entries(npc.knownInformation.investigatedNpcs);
    const foundWolfEntry = investigated.find(([_, result]) => result === 'werewolf');
    const foundWolf = foundWolfEntry ? allNpcs.find(n => n.id === foundWolfEntry[0] && n.isAlive) : null;

    if (foundWolf) {
      return {
        type: 'suspicion',
        typeLabel: 'Nghi ngờ đanh thép',
        icon: '🔮',
        content: `Tôi có linh cảm và trực giác mãnh liệt 100% rằng ${foundWolf.name} chính là MA SÓI trà trộn! Xin hãy tin tôi và treo cổ hắn!`,
        night: currentNight
      };
    }

    if (investigated.length > 0) {
      const goodId = investigated[investigated.length - 1][0];
      const goodNpc = allNpcs.find(n => n.id === goodId);
      if (goodNpc && goodNpc.isAlive) {
        return {
          type: 'testimony',
          typeLabel: 'Lời khai',
          icon: '📜',
          content: `Theo quan sát thấu suốt của tôi, ${goodNpc.name} (${goodNpc.job}) là người hoàn toàn lương thiện, chớ nên nghi ngờ oan!`,
          night: currentNight
        };
      }
    }
  }

  // 3. Guard / Witch / Hunter Special Statements
  if (npc.role === 'guard') {
    if (resolution.savedIds.length > 0) {
      return {
        type: 'testimony',
        typeLabel: 'Lời khai',
        icon: '🛡️',
        content: `Đêm qua tôi cảm nhận được một nguồn tà khí lớn tiến đến một cánh cửa, thật may mắn là lá chắn hộ mệnh đã kịp thời ứng cứu!`,
        night: currentNight
      };
    }
  }

  if (npc.role === 'witch') {
    if (resolution.poisonedIds.length > 0) {
      return {
        type: 'speculation',
        typeLabel: 'Suy đoán',
        icon: '🧪',
        content: `Mùi độc dược thảo mộc tỏa ra đêm qua... Có vẻ như công lý vô hình đã trừng phạt kẻ xấu rồi!`,
        night: currentNight
      };
    }
  }

  // 4. Regular Villagers & General Contextual Statements
  if (casualties.length > 0 && rand < 0.35 && mostSuspectedNpc) {
    // Phóng tầm nghi ngờ
    const suspicionTemplates = [
      `Đêm qua lúc nghe tiếng hét của ${casualties[0]?.name}, tôi hé cửa nhìn ra thì thấy bóng người có dáng dấp giống ${mostSuspectedNpc.name}!`,
      `Tôi nghi ngờ ${mostSuspectedNpc.name} (${mostSuspectedNpc.job}). Tại sao đêm nào người này cũng ra ngoài trễ như vậy?`,
      `${mostSuspectedNpc.name} trả lời rất ấp úng khi tôi hỏi về lịch trình đêm qua. Mọi người hãy cẩn thận!`
    ];
    return {
      type: 'suspicion',
      typeLabel: 'Nghi ngờ',
      icon: '👁️',
      content: suspicionTemplates[Math.floor(Math.random() * suspicionTemplates.length)],
      night: currentNight
    };
  }

  if (rand < 0.65) {
    // Lời khai về những gì nghe/thấy
    const testimonies = [
      `Đêm qua tôi nghe tiếng bước chân cào sột soạt trên mái ngói, kèm theo mùi tanh nồng của thú dữ.`,
      `Tôi ở trong nhà thắp đèn dầu đọc sách, khoảng canh ba thì nghe tiếng chó sủa ran ở đầu làng.`,
      `Tôi thấy sương mù dày đặc che phủ lối đi chính, có tiếng thở gấp gáp của ai đó chạy lướt qua cửa sổ.`,
      `Đêm qua hoàn toàn yên ắng cho đến khi có tiếng nỏ vang lên xé toạc màn đêm lạnh lẽo.`
    ];
    return {
      type: 'testimony',
      typeLabel: 'Lời khai',
      icon: '📜',
      content: testimonies[Math.floor(Math.random() * testimonies.length)],
      night: currentNight
    };
  }

  if (rand < 0.85) {
    // Biện hộ
    const defenses = [
      `Tôi làm việc cống hiến cho làng bao năm qua, không bao giờ làm điều khuất tất hại ai cả!`,
      `Mọi người đừng vội nghi ngờ tôi, tôi sẵn sàng hợp tác và đối chất với bất kỳ ai để tìm ra sói!`,
      `Tôi chỉ là người dân bình thường, cả đêm tôi chỉ biết cầu nguyện cho làng được bình an.`
    ];
    return {
      type: 'defense',
      typeLabel: 'Biện hộ',
      icon: '🛡️',
      content: defenses[Math.floor(Math.random() * defenses.length)],
      night: currentNight
    };
  }

  // Suy đoán
  return {
    type: 'speculation',
    typeLabel: 'Suy đoán',
    icon: '💡',
    content: `Bầy sói đang ngày càng manh động hơn. Chúng ta phải đoàn kết và phân tích kỹ lời khai của từng người để vote chính xác!`,
    night: currentNight
  };
}

/**
 * Helper to get all alive NPCs
 */
export function getAliveNPCs(npcs: NPCVillager[]): NPCVillager[] {
  return npcs.filter(npc => npc.isAlive);
}

/**
 * Intelligent Wolf Pack Decision Engine
 * Wolves coordinate their attack target collectively without cheating.
 */
function decideWolfPackTarget(wolves: NPCVillager[], allNpcs: NPCVillager[], currentNight: number): { targetId: string; targetName: string; reason: string } {
  const aliveNpcs = getAliveNPCs(allNpcs);
  const wolfIds = new Set(wolves.map(w => w.id));
  const validTargets = aliveNpcs.filter(npc => !wolfIds.has(npc.id));

  if (validTargets.length === 0) {
    return { targetId: '', targetName: '', reason: 'Không còn mục tiêu hợp lệ' };
  }

  // Score each candidate target
  const scoredTargets = validTargets.map(candidate => {
    let score = 50; // base score

    // 1. If this NPC was previously revealed to be Seer or Guard, high priority threat
    if (candidate.isRevealed) {
      if (candidate.role === 'seer') score += 45;
      if (candidate.role === 'guard') score += 35;
      if (candidate.role === 'witch') score += 30;
      if (candidate.role === 'hunter') score -= 15; // Hunter is risky because of death retaliation!
    }

    // 2. Aggregate suspicion among wolves toward this candidate
    let wolfSuspicionSum = 0;
    wolves.forEach(w => {
      wolfSuspicionSum += (w.suspicion[candidate.id] || 0.3);
    });
    score += (wolfSuspicionSum / wolves.length) * 30;

    // 3. Deduction if candidate was recently guarded or likely guarded
    if (candidate.knownInformation.lastGuardedId === candidate.id) {
      score -= 25; // might be guarded again or bait
    }

    // 4. Personality modifiers of dominant wolves
    wolves.forEach(w => {
      if (w.personality === 'aggressive') {
        // Prefer targets that seem outspoken / influential
        score += candidate.age > 40 ? 10 : 5;
      } else if (w.personality === 'cautious') {
        // Cautious wolves avoid risky targets
        if (candidate.job.includes('Thợ Săn') || candidate.job.includes('Rèn')) score -= 10;
      } else if (w.personality === 'logical') {
        // Prefer targets with high memory retention
        if (candidate.personality === 'observant' || candidate.personality === 'logical') score += 15;
      }
    });

    // 5. Add small stochastic noise (0 to 10) to avoid robotic determinism
    score += Math.random() * 10;

    return {
      candidate,
      score
    };
  });

  scoredTargets.sort((a, b) => b.score - a.score);
  const best = scoredTargets[0].candidate;

  return {
    targetId: best.id,
    targetName: best.name,
    reason: `Bầy Sói thống nhất nhắm vào ${best.name} (${best.job}) vì mối đe dọa cao đối với bầy đàn.`
  };
}

/**
 * Seer Decision Engine:
 * Chooses an alive NPC that has not been investigated yet, prioritizing highest suspicion.
 */
function decideSeerTarget(seer: NPCVillager, allNpcs: NPCVillager[]): { targetId: string; targetName: string; reason: string } | null {
  const aliveNpcs = getAliveNPCs(allNpcs);
  const uninvestigated = aliveNpcs.filter(npc => npc.id !== seer.id && !seer.knownInformation.investigatedNpcs[npc.id]);

  if (uninvestigated.length === 0) {
    // If all investigated, check the most suspicious one again or anyone alive
    const candidates = aliveNpcs.filter(npc => npc.id !== seer.id);
    if (candidates.length === 0) return null;
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    return {
      targetId: target.id,
      targetName: target.name,
      reason: `Tiên tri ${seer.name} soi rọi lại nhân dạng của ${target.name}.`
    };
  }

  // Sort by Seer's suspicion
  uninvestigated.sort((a, b) => (seer.suspicion[b.id] || 0) - (seer.suspicion[a.id] || 0));
  const target = uninvestigated[0];

  return {
    targetId: target.id,
    targetName: target.name,
    reason: `Tiên tri ${seer.name} dùng quả cầu pha lê soi chiếu bóng đêm của ${target.name} do hoài nghi cao độ.`
  };
}

/**
 * Guard Decision Engine:
 * Chooses an alive NPC to protect, cannot protect the same NPC two nights in a row.
 */
function decideGuardTarget(guard: NPCVillager, allNpcs: NPCVillager[], currentNight: number): { targetId: string; targetName: string; reason: string } | null {
  const aliveNpcs = getAliveNPCs(allNpcs);
  const lastGuardedId = guard.knownInformation.lastGuardedId;

  // Filter out the last guarded NPC if there are other candidates
  let validCandidates = aliveNpcs.filter(npc => npc.id !== lastGuardedId);
  if (validCandidates.length === 0) {
    validCandidates = aliveNpcs;
  }

  // Priority scoring:
  // - Protect revealed Good roles (Seer, Witch)
  // - Self-protection if fear is high and allowed
  // - High-trust allies (relationship > 0.3)
  const scored = validCandidates.map(c => {
    let score = 30;

    if (c.isRevealed && c.role !== 'werewolf') {
      score += 50; // Protect verified village roles!
    }

    if (c.id === guard.id) {
      score += guard.personality === 'cautious' ? 25 : 10;
    }

    const rel = guard.relationships[c.id] || 0;
    score += rel * 20;

    const susp = guard.suspicion[c.id] || 0.3;
    score -= susp * 30; // Guard avoids protecting people they deeply suspect

    score += Math.random() * 8;
    return { candidate: c, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const chosen = scored[0].candidate;

  return {
    targetId: chosen.id,
    targetName: chosen.name,
    reason: `Bảo vệ ${guard.name} lập khiên phong ấn canh gác cửa nhà ${chosen.name}.`
  };
}

/**
 * Witch Decision Engine:
 * Decides whether to use Heal potion (on wolf victim) or Poison potion (on a high suspicion target).
 */
function decideWitchAction(
  witch: NPCVillager,
  allNpcs: NPCVillager[],
  wolfTargetId: string,
  currentNight: number
): { healTargetId?: string; poisonTargetId?: string; healReason?: string; poisonReason?: string } {
  const result: { healTargetId?: string; poisonTargetId?: string; healReason?: string; poisonReason?: string } = {};
  const { healUsed, poisonUsed } = witch.knownInformation.witchPotions;
  const aliveNpcs = getAliveNPCs(allNpcs);

  // 1. Heal decision
  if (!healUsed && wolfTargetId) {
    const victim = allNpcs.find(n => n.id === wolfTargetId);
    if (victim) {
      // If victim is self -> always save!
      if (victim.id === witch.id) {
        result.healTargetId = victim.id;
        result.healReason = `Phù thủy ${witch.name} tự dùng bình thần dược để hồi sinh chính mình!`;
      } else {
        const susp = witch.suspicion[victim.id] || 0.3;
        // If victim is not suspicious (susp < 0.6) or revealed villager, save them!
        if (susp < 0.65 || (victim.isRevealed && victim.role !== 'werewolf')) {
          result.healTargetId = victim.id;
          result.healReason = `Phù thủy ${witch.name} cảm nhận được linh hồn vô tội của ${victim.name} và đã dùng bình cứu hộ mệnh.`;
        }
      }
    }
  }

  // 2. Poison decision (Cautious: only use if very high suspicion on night >= 2)
  if (!poisonUsed && currentNight >= 2 && !result.healTargetId) {
    const candidates = aliveNpcs.filter(npc => npc.id !== witch.id && npc.id !== wolfTargetId);
    if (candidates.length > 0) {
      // Find candidate with suspicion > 0.75
      const highestSuspicious = candidates
        .map(c => ({ candidate: c, susp: witch.suspicion[c.id] || 0.3 }))
        .sort((a, b) => b.susp - a.susp)[0];

      if (highestSuspicious && highestSuspicious.susp >= 0.78) {
        result.poisonTargetId = highestSuspicious.candidate.id;
        result.poisonReason = `Phù thủy ${witch.name} nhận thấy ${highestSuspicious.candidate.name} có dấu hiệu ma thuật hắc ám và đã bỏ bình độc!`;
      }
    }
  }

  return result;
}

/**
 * Hunter Retaliation Decision Engine:
 * When hunter dies, shoots the most suspicious alive target.
 */
function decideHunterShot(hunter: NPCVillager, allNpcs: NPCVillager[]): { targetId: string; targetName: string; reason: string } | null {
  const aliveNpcs = getAliveNPCs(allNpcs).filter(npc => npc.id !== hunter.id);
  if (aliveNpcs.length === 0) return null;

  aliveNpcs.sort((a, b) => (hunter.suspicion[b.id] || 0) - (hunter.suspicion[a.id] || 0));
  const target = aliveNpcs[0];

  return {
    targetId: target.id,
    targetName: target.name,
    reason: `Thợ săn ${hunter.name} trước khi gục ngã đã giương cây nỏ bạc bắn phát tiễn định mệnh vào ${target.name}!`
  };
}

/**
 * Master Night Simulation Engine:
 * Executes the complete hidden night actions cycle and calculates resolution.
 */
export function executeNightSimulation(allNpcs: NPCVillager[], currentNight: number): {
  updatedNpcs: NPCVillager[];
  resolution: NightResolution;
} {
  let npcs = JSON.parse(JSON.stringify(allNpcs)) as NPCVillager[];
  const actions: NightAction[] = [];
  const casualties: string[] = [];
  const savedIds: string[] = [];
  const poisonedIds: string[] = [];
  let hunterKilledId: string | undefined = undefined;
  const clues: string[] = [];
  const publicSummary: string[] = [];

  const aliveNpcs = getAliveNPCs(npcs);

  // 1. Guard Action (Priority 1)
  const guard = aliveNpcs.find(npc => npc.role === 'guard');
  let guardedTargetId: string | undefined = undefined;
  if (guard) {
    const guardDecision = decideGuardTarget(guard, npcs, currentNight);
    if (guardDecision) {
      guardedTargetId = guardDecision.targetId;
      actions.push({
        actorId: guard.id,
        actorName: guard.name,
        role: 'guard',
        actionType: 'guard_protect',
        targetId: guardDecision.targetId,
        targetName: guardDecision.targetName,
        priority: 1,
        reason: guardDecision.reason
      });

      // Update guard internal memory
      const guardNpc = npcs.find(n => n.id === guard.id);
      if (guardNpc) {
        guardNpc.knownInformation.lastGuardedId = guardedTargetId;
        guardNpc.nightActionHistory.push({
          night: currentNight,
          actionType: 'guard_protect',
          targetId: guardDecision.targetId,
          targetName: guardDecision.targetName,
          outcome: 'Đã bảo vệ'
        });
      }
    }
  }

  // 2. Seer Action (Priority 2)
  const seer = aliveNpcs.find(npc => npc.role === 'seer');
  let seerResultObj: { seerId: string; targetId: string; targetName: string; isWerewolf: boolean } | undefined = undefined;
  if (seer) {
    const seerDecision = decideSeerTarget(seer, npcs);
    if (seerDecision) {
      const targetNpc = npcs.find(n => n.id === seerDecision.targetId);
      const isWerewolf = targetNpc?.role === 'werewolf';

      actions.push({
        actorId: seer.id,
        actorName: seer.name,
        role: 'seer',
        actionType: 'seer_check',
        targetId: seerDecision.targetId,
        targetName: seerDecision.targetName,
        priority: 2,
        reason: `${seerDecision.reason} (Kết quả: ${isWerewolf ? 'SÓI 🐺' : 'DÂN LÀNG 🌿'})`
      });

      // Update Seer private knowledge & suspicion
      const seerNpc = npcs.find(n => n.id === seer.id);
      if (seerNpc && targetNpc) {
        seerNpc.knownInformation.investigatedNpcs[targetNpc.id] = isWerewolf ? 'werewolf' : 'villager';
        seerNpc.suspicion[targetNpc.id] = isWerewolf ? 1.0 : 0.05;
        seerNpc.relationships[targetNpc.id] = isWerewolf ? -1.0 : 0.8;
        seerNpc.nightActionHistory.push({
          night: currentNight,
          actionType: 'seer_check',
          targetId: targetNpc.id,
          targetName: targetNpc.name,
          outcome: isWerewolf ? 'Phát hiện Ma Sói' : 'Xác nhận Dân Làng vô tội'
        });
      }

      seerResultObj = {
        seerId: seer.id,
        targetId: seerDecision.targetId,
        targetName: seerDecision.targetName,
        isWerewolf
      };
    }
  }

  // 3. Werewolves Collective Attack (Priority 3)
  const wolves = aliveNpcs.filter(npc => npc.role === 'werewolf');
  let wolfVictimId: string = '';
  if (wolves.length > 0) {
    const wolfDecision = decideWolfPackTarget(wolves, npcs, currentNight);
    wolfVictimId = wolfDecision.targetId;

    if (wolfVictimId) {
      actions.push({
        actorId: wolves[0].id,
        actorName: 'Bầy Ma Sói',
        role: 'werewolf',
        actionType: 'wolf_kill',
        targetId: wolfDecision.targetId,
        targetName: wolfDecision.targetName,
        priority: 3,
        reason: wolfDecision.reason
      });

      wolves.forEach(w => {
        const wNpc = npcs.find(n => n.id === w.id);
        if (wNpc) {
          wNpc.nightActionHistory.push({
            night: currentNight,
            actionType: 'wolf_kill',
            targetId: wolfDecision.targetId,
            targetName: wolfDecision.targetName,
            outcome: 'Đã tấn công'
          });
        }
      });
    }
  }

  // 4. Witch Actions (Priority 4)
  const witch = aliveNpcs.find(npc => npc.role === 'witch');
  let witchHealedId: string | undefined = undefined;
  let witchPoisonedId: string | undefined = undefined;
  if (witch) {
    const witchDecisions = decideWitchAction(witch, npcs, wolfVictimId, currentNight);

    if (witchDecisions.healTargetId) {
      witchHealedId = witchDecisions.healTargetId;
      actions.push({
        actorId: witch.id,
        actorName: witch.name,
        role: 'witch',
        actionType: 'witch_save',
        targetId: witchHealedId,
        targetName: npcs.find(n => n.id === witchHealedId)?.name,
        priority: 4,
        reason: witchDecisions.healReason
      });

      const witchNpc = npcs.find(n => n.id === witch.id);
      if (witchNpc) {
        witchNpc.knownInformation.witchPotions.healUsed = true;
      }
    }

    if (witchDecisions.poisonTargetId) {
      witchPoisonedId = witchDecisions.poisonTargetId;
      actions.push({
        actorId: witch.id,
        actorName: witch.name,
        role: 'witch',
        actionType: 'witch_poison',
        targetId: witchPoisonedId,
        targetName: npcs.find(n => n.id === witchPoisonedId)?.name,
        priority: 4,
        reason: witchDecisions.poisonReason
      });

      const witchNpc = npcs.find(n => n.id === witch.id);
      if (witchNpc) {
        witchNpc.knownInformation.witchPotions.poisonUsed = true;
      }
    }
  }

  // 5. Resolution & Casualties Calculation
  if (wolfVictimId) {
    const isProtectedByGuard = guardedTargetId === wolfVictimId;
    const isSavedByWitch = witchHealedId === wolfVictimId;

    if (isProtectedByGuard || isSavedByWitch) {
      savedIds.push(wolfVictimId);
      clues.push(`Đêm qua, bóng đen hung tàn đã áp sát một ngôi nhà, nhưng một nguồn sức mạnh hộ mệnh kỳ bí đã kịp thời che chở.`);
    } else {
      casualties.push(wolfVictimId);
    }
  }

  if (witchPoisonedId && !casualties.includes(witchPoisonedId)) {
    poisonedIds.push(witchPoisonedId);
    casualties.push(witchPoisonedId);
    clues.push(`Một làn sương độc thảo mộc nồng nặc thoang thoảng trong không khí ban đêm.`);
  }

  // 6. Check Hunter Retaliation (Priority 5)
  const hunterCasualty = casualties.find(cId => {
    const victim = npcs.find(n => n.id === cId);
    return victim?.role === 'hunter';
  });

  if (hunterCasualty) {
    const hunterNpc = npcs.find(n => n.id === hunterCasualty);
    if (hunterNpc) {
      const shot = decideHunterShot(hunterNpc, npcs.filter(n => !casualties.includes(n.id)));
      if (shot) {
        hunterKilledId = shot.targetId;
        casualties.push(shot.targetId);
        actions.push({
          actorId: hunterNpc.id,
          actorName: hunterNpc.name,
          role: 'hunter',
          actionType: 'hunter_retaliate',
          targetId: shot.targetId,
          targetName: shot.targetName,
          priority: 5,
          reason: shot.reason
        });
        clues.push(`Tiếng nỏ bạc xé toạc màn đêm kèm theo một tiếng thét thất thanh.`);
      }
    }
  }

  // 7. Apply Deaths to NPC States
  npcs = npcs.map(npc => {
    if (casualties.includes(npc.id)) {
      return {
        ...npc,
        isAlive: false,
        memory: [
          ...npc.memory,
          {
            night: currentNight,
            event: `Đêm ${currentNight}: Bị loại khỏi ngôi làng bí ẩn.`,
            type: 'attacked'
          }
        ]
      };
    }

    if (savedIds.includes(npc.id)) {
      return {
        ...npc,
        memory: [
          ...npc.memory,
          {
            night: currentNight,
            event: `Đêm ${currentNight}: Đã thoát khỏi nguy hiểm nhờ bùa hộ mệnh.`,
            type: 'saved'
          }
        ]
      };
    }

    return npc;
  });

  // 8. Generate Public Dawn Summaries
  if (casualties.length === 0) {
    publicSummary.push('Bình minh ló rạng trong yên bình, đêm qua không có ai biến mất khỏi ngôi làng!');
    clues.push('Dân làng thở phào khi mọi cánh cửa nhà sáng đèn đầy đủ vào buổi sớm.');
  } else {
    casualties.forEach(cId => {
      const deadNpc = npcs.find(n => n.id === cId);
      if (deadNpc) {
        publicSummary.push(`Đêm qua, ${deadNpc.name} (${deadNpc.job}) đã biến mất trong màn đêm bí ẩn... ☠️`);
      }
    });
  }

  // 9. Update Living NPCs' suspicion matrices & memories based on public events
  const deadNpcNames = casualties.map(cId => npcs.find(n => n.id === cId)?.name).filter(Boolean);
  npcs = npcs.map(npc => {
    if (!npc.isAlive) return npc;

    const updatedSusp = { ...npc.suspicion };
    // Alive NPCs raise suspicion on neighbours or unrevealed characters
    npcs.forEach(other => {
      if (other.id !== npc.id && other.isAlive) {
        // Increase suspicion slightly if they are still alive while others died
        const delta = (Math.random() * 0.1) - 0.03;
        updatedSusp[other.id] = Math.max(0.05, Math.min(0.98, (updatedSusp[other.id] || 0.3) + delta));
      }
    });

    const newMemory = [...npc.memory];
    if (deadNpcNames.length > 0) {
      newMemory.push({
        night: currentNight,
        event: `Đêm ${currentNight}: Nghe tin ${deadNpcNames.join(', ')} đã tử nạn. Nỗi sợ hãi trong làng tăng cao.`,
        type: 'observed'
      });
    }

    return {
      ...npc,
      suspicion: updatedSusp,
      memory: newMemory,
      behaviorState: {
        ...npc.behaviorState,
        fearLevel: Math.min(1.0, npc.behaviorState.fearLevel + (casualties.length * 0.2))
      }
    };
  });

  const resolution: NightResolution = {
    night: currentNight,
    casualties,
    savedIds,
    poisonedIds,
    hunterKilledId,
    seerInvestigation: seerResultObj,
    actionsTaken: actions,
    clues: clues.slice(0, 3),
    publicSummary
  };

  // 10. Generate fresh NPC statements (Testimony, Defense, Suspicion, Speculation)
  npcs = npcs.map(npc => {
    if (!npc.isAlive) return npc;
    const newStatement = generateNPCStatement(npc, npcs, resolution, currentNight);
    return {
      ...npc,
      statement: newStatement,
      statementHistory: [...(npc.statementHistory || []), newStatement]
    };
  });

  return {
    updatedNpcs: npcs,
    resolution
  };
}
