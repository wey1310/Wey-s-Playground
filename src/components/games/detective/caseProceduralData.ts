import { DetectiveCase, Suspect, Clue, TimelineEvent, CaseTruth } from './caseTypes';
import { validateCaseLogic } from './caseValidator';

export interface ProceduralCaseOptions {
  difficulty?: 'easy' | 'medium' | 'hard';
  avoidSignatures?: string[];
}

function xoshiro128ss(a: number, b: number, c: number, d: number) {
    return function() {
        var t = b << 9, r = a * 5; r = (r << 7 | r >>> 25) * 9;
        c ^= a; d ^= b;
        b ^= c; a ^= d; c ^= t;
        d = d << 11 | d >>> 21;
        return (r >>> 0) / 4294967296;
    }
}

function generateSeed(input?: string): number {
  if (!input) return Math.floor(Math.random() * 1000000);
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = ((hash << 5) - hash) + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

export class CaseProceduralEngine {
  private rng: () => number;
  
  constructor(seedStr?: string) {
    const seed = generateSeed(seedStr);
    this.rng = xoshiro128ss(seed, 12345, 67890, 13579);
  }

  randomItem<T>(arr: T[]): T {
    return arr[Math.floor(this.rng() * arr.length)];
  }

  generate(options: ProceduralCaseOptions = {}): DetectiveCase {
    const archetypes = ['locked_room', 'theft', 'poison'];
    
    let chosenArchetype = this.randomItem(archetypes);
    if (options.avoidSignatures && options.avoidSignatures.includes(chosenArchetype) && archetypes.length > 1) {
       const available = archetypes.filter(a => !options.avoidSignatures?.includes(a));
       if (available.length > 0) chosenArchetype = this.randomItem(available);
    }

    const baseCase = this.buildCase(chosenArchetype, options.difficulty || 'medium');
    return this.applyRandomVariations(baseCase);
  }

  private applyRandomVariations(c: DetectiveCase): DetectiveCase {
    const prefixes = ['Bí Mật', 'Hồ Sơ', 'Vụ Án', 'Chuyên Án', 'Mật Mã', 'Dấu Vết'];
    const victimNames = ['Ông Lâm Chấn', 'Bà Hoàng Tôn', 'Lê Khắc', 'Nguyễn Tài', 'Hà Bích', 'Trần Hào', 'Phạm Cương'];
    const locations = ['Biệt Thự Rừng Thông', 'Tòa Nhà X', 'Căn Hộ 404', 'Dinh Thự Cổ', 'Phòng Trưng Bày', 'Du Thuyền Đêm'];
    
    c.title = `${this.randomItem(prefixes)} ${this.randomItem(locations)}`;
    c.victim.name = this.randomItem(victimNames);
    c.crimeSceneName = `${this.randomItem(locations)} - ${this.randomItem(['Tầng 1', 'Phòng Đọc', 'Hành Lang', 'Gara'])}`;
    
    const numExtraClues = Math.floor(this.rng() * 4) + 1;
    const extraClueTypes = [
      { t: 'Vết xước trên tường', i: '🔪', l: 'Hành lang', s: 'Vết xước mới.', d: 'Không khớp với hung khí chính.' },
      { t: 'Tàn thuốc lá', i: '🚬', l: 'Góc phòng', s: 'Tàn thuốc lạ.', d: 'Của một loại xì gà đắt tiền.' },
      { t: 'Sợi tóc', i: '👱', l: 'Thảm', s: 'Sợi tóc ngắn.', d: 'Có thể là của nạn nhân hoặc người hầu.' },
      { t: 'Vết bùn', i: '🥾', l: 'Cửa sổ', s: 'Bùn đất bên ngoài.', d: 'Từ khu vườn phía tây.' },
      { t: 'Sợi chỉ đỏ', i: '🧵', l: 'Cửa ra vào', s: 'Vướng vào khe cửa.', d: 'Chỉ từ một chiếc áo khoác.' },
      { t: 'Giọt nước', i: '💧', l: 'Bàn làm việc', s: 'Chưa kịp khô.', d: 'Nước lọc tinh khiết.' }
    ];

    for (let i = 0; i < numExtraClues; i++) {
      const extra = this.randomItem(extraClueTypes);
      c.clues.push({
        id: `clue_extra_${i}_${Math.floor(this.rng() * 1000)}`,
        title: extra.t,
        type: 'scene_trace',
        icon: extra.i,
        locationFound: extra.l,
        summary: extra.s,
        detailedAnalysis: extra.d,
        isUnlockedByDefault: false,
        pointsToUnlock: 10,
        linkedSuspectIds: [],
        linkedClueIds: []
      });
    }

    const suspectFirstNames = ['Hùng', 'Cường', 'Lan', 'Bách', 'Tuấn', 'Mai', 'Hoa', 'Thành', 'Sơn'];
    c.suspects.forEach(s => {
      s.name = `${this.randomItem(['Trần', 'Nguyễn', 'Lê', 'Phạm', 'Hoàng', 'Vũ'])} ${this.randomItem(suspectFirstNames)}`;
      s.age = 25 + Math.floor(this.rng() * 30);
    });
    // Add 0 to 3 extra innocent suspects to make the list size variable
    const numExtraSuspects = Math.floor(this.rng() * 4);
    const jobs = ['Lái xe', 'Người hầu', 'Bảo vệ', 'Đầu bếp phụ', 'Khách mời', 'Kế toán', 'Hàng xóm'];
    for (let i = 0; i < numExtraSuspects; i++) {
      c.suspects.push({
        id: `suspect_extra_${i}_${Math.floor(this.rng() * 1000)}`,
        name: `${this.randomItem(['Trần', 'Nguyễn', 'Lê', 'Phạm', 'Hoàng', 'Vũ'])} ${this.randomItem(suspectFirstNames)}`,
        title: this.randomItem(jobs),
        avatar: this.randomItem(['🧔', '👩', '🧑', '👱', '👨‍💼', '👩‍💼']),
        gender: this.randomItem(['male', 'female']),
        age: 20 + Math.floor(this.rng() * 40),
        personality: 'Bình thường, hơi lo sợ',
        relationshipToVictim: 'Không thân thiết lắm',
        initialQuote: '“Tôi không biết gì cả, lúc đó tôi đang làm việc của mình.”',
        statements: [
          { id: `stmt_extra_${i}`, topic: 'Ngoại phạm', statementText: 'Tôi ở một mình, không ai làm chứng cả nhưng tôi vô tội.', isInitial: true, hasContradiction: false }
        ],
        claimedAlibi: { timeSlot: 'Không rõ', location: 'Xung quanh', claimedActivity: 'Làm việc', verified: false },
        motive: { apparent: 'Không có động cơ rõ ràng', hidden: '', isDecisive: false },
        isCulprit: false,
        isRedHerring: false
      });
    }

    
    const culprit = c.suspects.find(s => s.id === c.truth.culpritId);
    if (culprit) {
      c.truth.culpritName = culprit.name;
    }

    return c;
  }

  private buildCase(archetype: string, difficulty: 'easy' | 'medium' | 'hard'): DetectiveCase {
    const caseId = `${archetype}_${Math.floor(this.rng() * 10000)}`;

    if (archetype === 'theft') {
      return this.buildTheftCase(caseId, difficulty);
    } else if (archetype === 'poison') {
      return this.buildPoisonCase(caseId, difficulty);
    } else {
      return this.buildLockedRoomCase(caseId, difficulty);
    }
  }

  private buildLockedRoomCase(caseId: string, difficulty: 'easy' | 'medium' | 'hard'): DetectiveCase {
    const culpritId = 'suspect_gardener';
    const decisiveClueId = 'clue_muddy_boots';

    // This uses the Mansion template as a base but can be extended to randomize parts.
    return {
      id: caseId,
      title: 'Bí Mật Két Sắt Hoa Dạ Quỳnh',
      subtitle: 'Vụ trộm 500 triệu đồng trong đêm mưa gió tại Biệt Thự Rừng Thông',
      category: 'theft',
      difficulty,
      badge: 'Đột Nhập Ban Công',
      coverIcon: '🌸',
      themeColor: '#15803d',
      crimeSceneName: 'Biệt Thự Rừng Thông - Phòng Đọc Sách',
      crimeSceneDescription: 'Két sắt âm tường bị mở. Đất cát ẩm ướt và cánh hoa rụng vương vãi trên thảm.',
      victim: { name: 'Ông Lâm Chấn', title: 'Chủ biệt thự Rừng Thông', avatar: '👴', incidentType: 'Mất cắp 500 triệu đồng', lastSeen: '20:30 tại phòng khách', medicalReport: 'Không có thương tích.' },
      synopsis: 'Két sắt phòng đọc sách lầu 2 bị mở êm thấm không một tiếng động. Kẻ trộm không đi qua sảnh chính. Hắn đã đột nhập bằng cách nào?',
      suspects: [
        {
          id: culpritId,
          name: 'Trần Bách',
          title: 'Người làm vườn',
          avatar: '👨‍🌾',
          gender: 'male',
          age: 48,
          personality: 'Lầm lì, ít nói',
          relationshipToVictim: 'Bị chủ nhà dọa đuổi việc',
          initialQuote: '“Lúc 21:00 tôi ở trong nhà kho phía nam, không hề bước chân vào sảnh!”',
          statements: [
            { id: 'stmt_gardener_1', topic: 'Địa điểm lúc 21:00', statementText: 'Tôi ở nhà kho suốt từ 20:30 đến 21:30.', isInitial: true, hasContradiction: true, contradictedByClueId: decisiveClueId, contradictionExplanation: 'Đôi ủng dính phấn hoa dạ quỳnh ở ban công.' }
          ],
          claimedAlibi: { timeSlot: '20:30 - 21:30', location: 'Nhà kho', claimedActivity: 'Lau chùi', verified: false, brokenReason: 'Có mặt tại ban công.' },
          motive: { apparent: 'Muốn trộm tiền dưỡng già.', hidden: 'Trả nợ cho con trai.', isDecisive: true },
          isCulprit: true,
          isRedHerring: false
        },
        {
          id: 'suspect_butler',
          name: 'Bà Quản Gia Liên',
          title: 'Quản gia trưởng',
          avatar: '👵',
          gender: 'female',
          age: 58,
          personality: 'Cẩn thận, nguyên tắc',
          relationshipToVictim: 'Phục vụ hơn 20 năm',
          initialQuote: '“Tôi đang pha trà thảo mộc trong bếp lúc 21:00.”',
          statements: [
            { id: 'stmt_butler_1', topic: 'Pha trà', statementText: 'Tôi ở phòng bếp suốt nửa tiếng.', isInitial: true, hasContradiction: false }
          ],
          claimedAlibi: { timeSlot: '20:45 - 21:15', location: 'Phòng bếp', claimedActivity: 'Pha trà', verified: true },
          motive: { apparent: 'Bị trừ lương.', isDecisive: false },
          isCulprit: false,
          isRedHerring: true,
          redHerringExplanation: 'Bà lén đem bình trà cho người ăn xin.'
        }
      ],
      clues: [
        {
          id: 'clue_safe_box', title: 'Két Sắt Bị Mở', type: 'physical_evidence', icon: '🔒', locationFound: 'Phòng đọc sách',
          summary: 'Két sắt mở toang.', detailedAnalysis: 'Khóa được mở bằng chìa khóa phụ giấu trong chậu cây cảnh.',
          isUnlockedByDefault: true, pointsToUnlock: 0, linkedSuspectIds: [culpritId], linkedClueIds: [decisiveClueId], leadsToDeduction: 'Chỉ người chăm sóc cây mới biết!', sceneCoordinates: { x: 45, y: 40 }
        },
        {
          id: decisiveClueId, title: 'Đôi Ủng Dính Phấn Hoa', type: 'forensics', icon: '🥾', locationFound: 'Nhà kho',
          summary: 'Đôi ủng dính phấn hoa.', detailedAnalysis: 'Hoa dạ quỳnh duy nhất trồng ở ban công lầu 2, chỉ nở lúc 20:30.',
          isUnlockedByDefault: false, pointsToUnlock: 40, linkedSuspectIds: [culpritId], linkedClueIds: ['clue_safe_box'], isKeyDecisiveEvidence: true, leadsToDeduction: 'Trần Bách đã leo giàn hoa lên ban công!', contradictsStatementId: 'stmt_gardener_1'
        },
        {
          id: 'clue_ladder_scratches', title: 'Vết Trầy Xước Giàn Cây', type: 'scene_trace', icon: '🪜', locationFound: 'Giàn hoa leo',
          summary: 'Vết xước kim loại của kéo tỉa cành.', detailedAnalysis: 'Thủ phạm đã dùng giàn cây làm thang trèo lên ban công.',
          isUnlockedByDefault: false, pointsToUnlock: 20, linkedSuspectIds: [culpritId], linkedClueIds: [decisiveClueId]
        }
      ],
      timeline: [
        { id: 'tl_1', timeStr: '20:30', location: 'Ban công', description: 'Hoa dạ quỳnh nở.', involvedSuspectIds: [], isConfirmed: true, source: 'Thực vật học' },
        { id: 'tl_2', timeStr: '21:00', location: 'Phòng đọc sách', description: 'Trần Bách trèo giàn hoa mở két.', involvedSuspectIds: [culpritId], isConfirmed: false, source: 'Vết phấn hoa' }
      ],
      truth: {
        culpritId, culpritName: 'Trần Bách', decisiveClueId, decisiveContradiction: 'Ủng dính phấn hoa ở ban công.',
        realMotive: 'Lấy trộm tiền trả nợ.', realModusOperandi: 'Trèo giàn hoa lên ban công.', recreationSteps: [], howRedHerringsCleared: []
      }
    };
  }

  private buildTheftCase(caseId: string, difficulty: 'easy' | 'medium' | 'hard'): DetectiveCase {
    const culpritId = 'suspect_curator';
    const decisiveClueId = 'clue_fake_painting';
    return {
      id: caseId,
      title: 'Bức Tranh Bị Đánh Tráo',
      subtitle: 'Vụ trộm tại Bảo Tàng Nghệ Thuật Ánh Sáng',
      category: 'theft',
      difficulty,
      badge: 'Đánh Tráo',
      coverIcon: '🖼️',
      themeColor: '#b45309',
      crimeSceneName: 'Bảo Tàng Ánh Sáng - Khu Vực Triển Lãm A',
      crimeSceneDescription: 'Bức tranh "Đêm Đầy Sao" bản sao bị đặt thay thế bản gốc.',
      victim: { name: 'Bảo Tàng Ánh Sáng', title: 'Giám đốc: Viện trưởng Lê', avatar: '🏛️', incidentType: 'Mất bức tranh trị giá 2 tỷ', lastSeen: '17:00 chiều', medicalReport: '' },
      synopsis: 'Sáng nay, nhân viên phát hiện bức tranh gốc đã bị đánh tráo thành bản sao. Hệ thống an ninh không hề báo động.',
      suspects: [
        {
          id: culpritId,
          name: 'Lê Cường',
          title: 'Giám tuyển nghệ thuật',
          avatar: '👨‍🎨',
          gender: 'male',
          age: 40,
          personality: 'Uyên bác, có con mắt nghệ thuật',
          relationshipToVictim: 'Nhân viên bảo tàng',
          initialQuote: '“Tôi kiểm tra phòng tranh lúc 18:00 và mọi thứ vẫn ổn định.”',
          statements: [
            { id: 'stmt_curator_1', topic: 'Thời gian', statementText: 'Tôi rời bảo tàng lúc 18:30.', isInitial: true, hasContradiction: true, contradictedByClueId: decisiveClueId, contradictionExplanation: 'Bản sao được vẽ bằng loại sơn chỉ có trong xưởng của Lê Cường, và vết sơn chưa khô hoàn toàn lúc 19:00.' }
          ],
          claimedAlibi: { timeSlot: '18:30 - 20:00', location: 'Quán cafe', claimedActivity: 'Gặp đối tác', verified: false, brokenReason: 'Sơn trên tranh giả vẫn còn ướt.' },
          motive: { apparent: 'Kiếm lời từ việc bán tranh.', hidden: 'Bị tống tiền bởi một băng đảng.', isDecisive: true },
          isCulprit: true,
          isRedHerring: false
        },
        {
          id: 'suspect_guard',
          name: 'Bảo Vệ Hưng',
          title: 'Trực đêm bảo tàng',
          avatar: '👮',
          gender: 'male',
          age: 35,
          personality: 'Hay ngủ gật',
          relationshipToVictim: 'Bảo vệ',
          initialQuote: '“Tôi đi tuần tra liên tục, không ai vào được.”',
          statements: [
            { id: 'stmt_guard_1', topic: 'Tuần tra', statementText: 'Tôi đi tuần lúc 19:00 và 20:00.', isInitial: true, hasContradiction: false }
          ],
          claimedAlibi: { timeSlot: '19:00 - 20:00', location: 'Phòng tranh', claimedActivity: 'Tuần tra', verified: true },
          motive: { apparent: 'Có thể tiếp tay cho trộm.', isDecisive: false },
          isCulprit: false,
          isRedHerring: true,
          redHerringExplanation: 'Anh ta tắt camera 5 phút để đi hút thuốc, nhưng không lấy tranh.'
        }
      ],
      clues: [
        {
          id: 'clue_camera', title: 'Camera An Ninh Tắt 5 Phút', type: 'timeline', icon: '📹', locationFound: 'Phòng điều khiển',
          summary: 'Camera bị tắt từ 19:05 đến 19:10.', detailedAnalysis: 'Bảo vệ Hưng tắt camera để đi hút thuốc.',
          isUnlockedByDefault: true, pointsToUnlock: 0, linkedSuspectIds: ['suspect_guard'], linkedClueIds: [], leadsToDeduction: 'Hưng giấu việc lơ là nhiệm vụ.'
        },
        {
          id: decisiveClueId, title: 'Bức Tranh Giả Cầm Ướt Sơn', type: 'forensics', icon: '🎨', locationFound: 'Khung tranh',
          summary: 'Sơn ở góc bức tranh giả vẫn còn dính.', detailedAnalysis: 'Phân tích cho thấy sơn Acrylic mã X-402, loại sơn đặc chế riêng của Lê Cường.',
          isUnlockedByDefault: false, pointsToUnlock: 40, linkedSuspectIds: [culpritId], linkedClueIds: [], isKeyDecisiveEvidence: true, leadsToDeduction: 'Lê Cường tự tay vẽ và đánh tráo bức tranh!', contradictsStatementId: 'stmt_curator_1'
        },
        {
          id: 'clue_receipt', title: 'Hóa Đơn Mua Sơn', type: 'physical_evidence', icon: '🧾', locationFound: 'Thùng rác văn phòng Cường',
          summary: 'Hóa đơn mua sơn Acrylic.', detailedAnalysis: 'Mua lúc 15:00 cùng ngày.',
          isUnlockedByDefault: false, pointsToUnlock: 20, linkedSuspectIds: [culpritId], linkedClueIds: [decisiveClueId]
        }
      ],
      timeline: [
        { id: 'tl_1', timeStr: '18:00', location: 'Phòng tranh', description: 'Tranh gốc vẫn còn.', involvedSuspectIds: [], isConfirmed: true, source: 'Khách tham quan' },
        { id: 'tl_2', timeStr: '19:05', location: 'Phòng tranh', description: 'Lê Cường đánh tráo tranh trong lúc camera tắt.', involvedSuspectIds: [culpritId], isConfirmed: false, source: 'Sơn ướt' }
      ],
      truth: {
        culpritId, culpritName: 'Lê Cường', decisiveClueId, decisiveContradiction: 'Tranh giả dùng loại sơn riêng của Cường.',
        realMotive: 'Bị tống tiền.', realModusOperandi: 'Lợi dụng lúc bảo vệ tắt camera đi hút thuốc để đổi tranh giả đã chuẩn bị sẵn.', recreationSteps: [], howRedHerringsCleared: []
      }
    };
  }

  private buildPoisonCase(caseId: string, difficulty: 'easy' | 'medium' | 'hard'): DetectiveCase {
    const culpritId = 'suspect_chef';
    const decisiveClueId = 'clue_sugar_jar';
    return {
      id: caseId,
      title: 'Tách Trà Oan Nghiệt',
      subtitle: 'Vụ ngộ độc tại bữa tiệc gia đình',
      category: 'murder',
      difficulty,
      badge: 'Đầu Độc',
      coverIcon: '☕',
      themeColor: '#7e22ce',
      crimeSceneName: 'Phòng Ăn Chính',
      crimeSceneDescription: 'Nạn nhân gục xuống bàn ăn sau khi uống trà. Tách trà rơi vỡ.',
      victim: { name: 'Ông Tài', title: 'Chủ tịch tập đoàn', avatar: '🧔', incidentType: 'Ngộ độc Ricin', lastSeen: '20:00 tại bàn ăn', medicalReport: 'Tử vong do độc tố Ricin trong dạ dày.' },
      synopsis: 'Trong bữa tiệc chỉ có 3 người, ông Tài gục chết sau khi uống tách trà do chính tay vợ mình pha. Ai đã lén bỏ độc?',
      suspects: [
        {
          id: culpritId,
          name: 'Đầu Bếp Hùng',
          title: 'Đầu bếp riêng',
          avatar: '👨‍🍳',
          gender: 'male',
          age: 45,
          personality: 'Trầm tính, kỹ tính',
          relationshipToVictim: 'Làm việc 10 năm',
          initialQuote: '“Tôi chỉ lo nấu nướng trong bếp, phu nhân là người mang trà ra.”',
          statements: [
            { id: 'stmt_chef_1', topic: 'Chuẩn bị', statementText: 'Tôi không chạm vào khay trà.', isInitial: true, hasContradiction: true, contradictedByClueId: decisiveClueId, contradictionExplanation: 'Độc không nằm trong trà mà nằm trong hũ đường đặc biệt do Hùng chuẩn bị.' }
          ],
          claimedAlibi: { timeSlot: '19:45 - 20:00', location: 'Bếp', claimedActivity: 'Dọn dẹp', verified: false, brokenReason: 'Hũ đường được Hùng mang ra từ trước.' },
          motive: { apparent: 'Muốn trả thù cho em trai bị sa thải.', hidden: 'Em trai bị bức tử.', isDecisive: true },
          isCulprit: true,
          isRedHerring: false
        },
        {
          id: 'suspect_wife',
          name: 'Phu Nhân Lan',
          title: 'Vợ nạn nhân',
          avatar: '👩',
          gender: 'female',
          age: 40,
          personality: 'Sắc sảo, lạnh lùng',
          relationshipToVictim: 'Vợ',
          initialQuote: '“Chính tôi pha trà, nhưng tôi cũng uống một tách và không sao!”',
          statements: [
            { id: 'stmt_wife_1', topic: 'Pha trà', statementText: 'Tôi rót từ cùng một ấm trà.', isInitial: true, hasContradiction: false }
          ],
          claimedAlibi: { timeSlot: '20:00', location: 'Bàn ăn', claimedActivity: 'Uống trà', verified: true },
          motive: { apparent: 'Được hưởng tài sản.', isDecisive: false },
          isCulprit: false,
          isRedHerring: true,
          redHerringExplanation: 'Lan ngoại tình và muốn ly hôn, nhưng không phải người hạ độc.'
        }
      ],
      clues: [
        {
          id: 'clue_tea_pot', title: 'Ấm Trà Thảo Mộc', type: 'physical_evidence', icon: '🫖', locationFound: 'Bàn ăn',
          summary: 'Ấm trà bằng gốm.', detailedAnalysis: 'Không phát hiện độc tố trong ấm trà hay tách của phu nhân.',
          isUnlockedByDefault: true, pointsToUnlock: 0, linkedSuspectIds: ['suspect_wife'], linkedClueIds: [], leadsToDeduction: 'Độc không được bỏ vào ấm.'
        },
        {
          id: decisiveClueId, title: 'Hũ Đường Phèn', type: 'forensics', icon: '🧂', locationFound: 'Bàn ăn',
          summary: 'Hũ đường phèn nhỏ.', detailedAnalysis: 'Những viên "đường" ở trên cùng thực chất là tinh thể Ricin được tạo hình giống đường phèn. Nạn nhân có thói quen uống trà thêm 1 viên đường phèn do đầu bếp làm.',
          isUnlockedByDefault: false, pointsToUnlock: 40, linkedSuspectIds: [culpritId], linkedClueIds: [], isKeyDecisiveEvidence: true, leadsToDeduction: 'Chỉ có đầu bếp Hùng mới làm ra những viên đường phèn thủ công này!', contradictsStatementId: 'stmt_chef_1'
        },
        {
          id: 'clue_gloves', title: 'Găng Tay Cao Su', type: 'scene_trace', icon: '🧤', locationFound: 'Thùng rác nhà bếp',
          summary: 'Đôi găng tay vứt vội.', detailedAnalysis: 'Có dính vi lượng bột Ricin.',
          isUnlockedByDefault: false, pointsToUnlock: 20, linkedSuspectIds: [culpritId], linkedClueIds: [decisiveClueId]
        }
      ],
      timeline: [
        { id: 'tl_1', timeStr: '19:30', location: 'Bếp', description: 'Hùng chuẩn bị hũ đường phèn có lẫn viên độc.', involvedSuspectIds: [culpritId], isConfirmed: false, source: 'Găng tay' },
        { id: 'tl_2', timeStr: '20:00', location: 'Bàn ăn', description: 'Ông Tài cho viên "đường" vào trà và uống.', involvedSuspectIds: [], isConfirmed: true, source: 'Khám nghiệm' }
      ],
      truth: {
        culpritId, culpritName: 'Đầu Bếp Hùng', decisiveClueId, decisiveContradiction: 'Độc nằm trong viên đường thủ công của Hùng.',
        realMotive: 'Trả thù.', realModusOperandi: 'Ngụy trang độc thành viên đường phèn.', recreationSteps: [], howRedHerringsCleared: []
      }
    };
  }
}

