export type CaseDifficulty = 'easy' | 'medium' | 'hard';
export type CaseCategory = 'murder' | 'theft' | 'sabotage' | 'disappearance';

export type ClueType = 
  | 'physical_evidence' // Vật chứng hiện trường
  | 'testimony'         // Lời khai nhân chứng/nghi phạm
  | 'forensics'         // Giám định pháp y / kỹ thuật
  | 'timeline'          // Dấu vết thời gian / camera / nhật ký
  | 'motive'            // Động cơ / tài liệu bí mật
  | 'scene_trace';      // Dấu vết hiện trường (vân tay, sợi vải, bùn đất)

export interface SuspectStatement {
  id: string;
  topic: string;
  statementText: string;
  isInitial: boolean;
  unlockedAtDeductionLevel?: number;
  revealsClueId?: string;
  hasContradiction?: boolean;
  contradictedByClueId?: string;
  contradictionExplanation?: string;
}

export interface Suspect {
  id: string;
  name: string;
  title: string;          // e.g. "Trợ lý nghiên cứu", "Chuyên gia phục chế"
  avatar: string;         // Emoji or icon representation
  gender: 'male' | 'female' | 'other';
  age: number;
  personality: string;
  relationshipToVictim: string;
  initialQuote: string;
  statements: SuspectStatement[];
  claimedAlibi: {
    timeSlot: string;     // e.g. "20:00 - 21:00"
    location: string;     // e.g. "Thư viện tầng 2"
    claimedActivity: string;
    verified: boolean;
    brokenReason?: string;
  };
  motive: {
    apparent: string;     // Động cơ bề nổi mà ai cũng thấy
    hidden?: string;      // Động cơ thật sự ẩn giấu
    isDecisive: boolean;
  };
  isCulprit: boolean;
  isRedHerring: boolean;  // Có hành vi đáng ngờ nhưng vô tội
  redHerringExplanation?: string; // Giải thích lý do có hành động lén lút (ví dụ: giấu quà tặng, trốn nợ...)
}

export interface Clue {
  id: string;
  title: string;
  type: ClueType;
  icon: string;
  locationFound: string; // e.g. "Dưới gầm bàn làm việc", "Khóa cửa sổ phòng thí nghiệm"
  summary: string;
  detailedAnalysis: string;
  isUnlockedByDefault?: boolean;
  pointsToUnlock?: number;
  linkedSuspectIds: string[];
  linkedClueIds: string[];
  leadsToDeduction?: string;
  isKeyDecisiveEvidence?: boolean; // Vật chứng cốt lõi để vạch trần thủ phạm
  contradictsStatementId?: string; // Mâu thuẫn với lời khai của nghi phạm nào
  sceneCoordinates?: { x: number; y: number }; // Relative coordinates on the crime scene map (0-100%)
}

export interface TimelineEvent {
  id: string;
  timeStr: string;        // e.g. "19:30", "20:15"
  location: string;
  description: string;
  involvedSuspectIds: string[];
  isConfirmed: boolean;
  source: string;         // e.g. "Camera sảnh", "Lời khai bảo vệ", "Nhật ký thí nghiệm"
  isContradicted?: boolean;
  contradictedByClueId?: string;
}

export interface CaseTruth {
  culpritId: string;
  culpritName: string;
  decisiveClueId: string;
  decisiveContradiction: string;
  realMotive: string;
  realModusOperandi: string; // Phương thức gây án / mánh khóe
  recreationSteps: string[];  // Từng bước tái hiện hiện trường
  howRedHerringsCleared: Array<{
    suspectId: string;
    suspectName: string;
    clearedByReason: string;
  }>;
}

export interface DetectiveCase {
  id: string;
  title: string;
  subtitle: string;
  category: CaseCategory;
  difficulty: CaseDifficulty;
  badge: string;
  coverIcon: string;
  themeColor: string;
  crimeSceneName: string;
  crimeSceneDescription: string;
  victim: {
    name: string;
    title: string;
    avatar: string;
    incidentType: string; // e.g. "Bị ngộ độc bất tỉnh & tài liệu bí mật bị đánh cắp"
    lastSeen: string;
    medicalReport: string;
  };
  synopsis: string;
  suspects: Suspect[];
  clues: Clue[];
  timeline: TimelineEvent[];
  truth: CaseTruth;
}

export interface DeductionConnection {
  id: string;
  fromId: string;
  toId: string;
  color?: string;
  note?: string;
}

export interface AccusationAttempt {
  teamId: string;
  teamName: string;
  suspectId: string;
  suspectName: string;
  chosenMotive: string;
  chosenDecisiveClueId: string;
  isCorrect: boolean;
  feedback: string;
  timestamp: number;
}

export interface TeamCaseState {
  teamId: string;
  teamName: string;
  avatar: string;
  color: string;
  score: number;
  guessesLeft: number; // starts at 2
  unlockedClueIds: string[];
  interrogatedSuspectIds: string[];
  examinedStatementIds?: string[];
  connections?: DeductionConnection[];
  solved: boolean;
  failed: boolean;
  accusations?: AccusationAttempt[];
  investigationPoints?: number; // AP to unlock clues or deep interrogation
}

export type DetectiveGamePhase = 
  | 'CASE_BRIEFING'       // Đọc hồ sơ ban đầu
  | 'TEAM_TURN_SELECT'    // Chọn lượt đội
  | 'QUESTION_CHALLENGE'  // Trả lời câu hỏi lấy điểm điều tra
  | 'ACTION_MENU'         // Chọn hành động: Soi hiện trường / Thẩm vấn / Bảng manh mối / Luận tội
  | 'CRIME_SCENE'         // Khám nghiệm hiện trường trực quan
  | 'INTERROGATION'       // Phòng thẩm vấn nghi phạm
  | 'EVIDENCE_BOARD'      // Bảng ghim manh mối & dây chỉ đỏ
  | 'TIMELINE_VIEW'       // Dòng thời gian vụ án
  | 'ACCUSATION_ROOM'     // Conan style chỉ điểm hung thủ
  | 'CASE_SOLVED'         // Phá án thành công
  | 'CASE_FAILED'         // 2 lần đoán sai -> Thất bại
  | 'CASE_REVEAL';        // Giáo viên hoặc kết thúc ván hạ màn sự thật
