import { AiUsagePanel } from './AiUsagePanel';
import { fetchWithAuth } from '../utils/api';
import { safeAlert, safeConfirm } from "../utils/safeAlert";
import { apiManager } from '../services/apiManager';
import { ApiSelectModal } from './api/ApiSelectModal';
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  X, 
  Sparkles, 
  Loader2, 
  CheckCircle2, 
  AlertCircle, 
  AlertTriangle,
  BookOpen, 
  Upload, 
  FileText, 
  Copy, 
  Check, 
  HelpCircle, 
  Info, 
  ListOrdered, 
  CheckSquare, 
  Edit3, 
  ChevronDown, 
  ChevronUp,
  RotateCcw,
  Code2,
  FileCode,
  Layers,
  SearchCode,
  CheckCheck,
  Wrench,
  GraduationCap,
  Target,
  Award,
  BookMarked,
  Download,
  Key
} from 'lucide-react';
import type { QuestionBank, Question, AiMode } from "../types";
import { 
  GRADES, 
  getSubjectsForGrade, 
  getLessonsForSubjectAndGrade,
  COGNITIVE_LEVELS_INFO,
  STANDARD_ASSESSMENT_MATRICES,
  getSubjectCompetencies,
  getSampleLearningOutcomes
} from '../data/curriculumData';
import { 
  parseQuestionFile, 
  parseTextToQuestionsWithDiagnostics, 
  validateAndParseJsonString,
  type ParsingDiagnostics, 
  type ParsingIssue 
} from '../utils/fileParser';

interface AiQuestionModalProps {
  isOpen: boolean;
  onClose: () => void;
  banks?: QuestionBank[];
  activeBankId?: string;
  onQuestionsGenerated?: (targetBankId: string, questions: Question[]) => void;
  onSaveGeneratedQuestions?: (newBank: QuestionBank) => void;
}

// Mẫu định dạng chuẩn cho TẤT CẢ các dạng câu hỏi (Plain Text & JSON)
export const SAMPLE_TEMPLATES = {
  plaintext_mcq: `Câu 1: Theo danh pháp IUPAC mới (SGK KHTN/Hóa học GDPT 2018), công thức phân tử của khí methane là:
A. C2H6
*B. CH4
C. C3H8
D. C4H10
Đáp án: B
Giải thích: Methane là alkane đơn giản nhất với công thức phân tử CH4.

Câu 2: Số nguyên tố chẵn duy nhất trong tập hợp số tự nhiên là:
A. 0
*B. 2
C. 4
D. 6
Đáp án: B
Giải thích: Số 2 chỉ có đúng hai ước là 1 và chính nó.

Câu 3: Đơn vị đo cường độ dòng điện trong hệ SI là:
A. Vôn (V)
B. Oát (W)
C. Ôm (Ω)
*D. Ampe (A)
Đáp án: D
Giải thích: Ký hiệu của cường độ dòng điện là I, đơn vị chuẩn là Ampe (A).`,

  json_format: `[
  {
    "type": "mcq",
    "content": "Theo SGK KHTN 8 (Kết nối tri thức), oxide nào sau đây là basic oxide?",
    "options": [
      "SO2 (sulfur dioxide)",
      "CO2 (carbon dioxide)",
      "CaO (calcium oxide)",
      "P2O5 (phosphorus pentoxide)"
    ],
    "correct": 2,
    "cognitiveLevel": "Thông hiểu",
    "learningOutcome": "Phân loại được các oxide cơ bản (basic oxide, acidic oxide) theo SGK Kết nối tri thức.",
    "competency": "Năng lực nhận thức hóa học",
    "explanation": "CaO là basic oxide vì tác dụng với acid tạo thành muối và nước."
  },
  {
    "type": "tf",
    "content": "Trái Đất quay quanh Mặt Trời theo quỹ đạo elip gần tròn với chu kì khoảng 365,25 ngày.",
    "correct": true,
    "cognitiveLevel": "Nhận biết",
    "learningOutcome": "Trình bày được chuyển động của Trái Đất quanh Mặt Trời.",
    "explanation": "Trái Đất chuyển động quanh Mặt Trời theo quỹ đạo elip gần tròn theo hướng từ Tây sang Đông."
  },
  {
    "type": "text",
    "content": "Theo danh pháp hóa học mới IUPAC, tên gọi của nguyên tố O trong bảng tuần hoàn là gì?",
    "correct": "oxygen",
    "cognitiveLevel": "Nhận biết",
    "learningOutcome": "Sử dụng đúng danh pháp IUPAC cho các nguyên tố hóa học.",
    "explanation": "Nguyên tố O có tên gọi quốc tế theo chuẩn GDPT 2018 là oxygen (trước đây gọi là oxi)."
  }
]`,

  plaintext_all: `Câu 1: Trong các hành tinh sau, hành tinh nào nằm gần Mặt Trời nhất?
A. Trái Đất
*B. Sao Thủy
C. Sao Hỏa
D. Sao Kim
Đáp án: B
Giải thích: Sao Thủy là hành tinh nhỏ nhất và gần Mặt Trời nhất trong Hệ Mặt Trời.

Câu 2 [Đúng/Sai]: Nước nguyên chất sôi ở 100°C trong điều kiện áp suất tiêu chuẩn (1 atm).
Đáp án: Đúng
Giải thích: Ở áp suất khí quyển 1 atm, nhiệt độ sôi của nước nguyên chất là 100°C.

Câu 3 [Trả lời ngắn]: Điền từ còn thiếu: "Công cha như núi Thái Sơn, nghĩa mẹ như nước trong ... chảy ra."
Đáp án: nguồn
Lời giải: Ca dao Việt Nam ca ngợi công ơn trời biển của cha mẹ.

Câu 4: 25 x 4 + 50 = ?
A. 100
*B. 150
C. 200
D. 125
Đáp án: B`,

  plaintext_tf: `Câu 1: Thực vật chỉ quang hợp và giải phóng khí Oxy vào ban đêm.
Đáp án: Sai
Giải thích: Thực vật quang hợp mạnh mẽ vào ban ngày khi có ánh sáng mặt trời.

Câu 2: Số 0 là số nguyên dương nhỏ nhất.
Đáp án: Sai
Giải thích: Số 0 là số nguyên nhưng không phải là số dương cũng không phải là số âm.

Câu 3: Kim cương là dạng thù hình cứng nhất trong tự nhiên của nguyên tố Carbon.
Đáp án: Đúng
Giải thích: Cấu trúc tinh thể tứ diện bền vững khiến kim cương có độ cứng cao nhất theo thang Mohs.`,

  plaintext_text: `Câu 1: Tác giả của tác phẩm thiếu nhi nổi tiếng "Dế Mèn phiêu lưu ký" là ai?
Đáp án: Tô Hoài
Giải thích: Nhà văn Tô Hoài xuất bản tác phẩm này lần đầu tiên vào năm 1941.

Câu 2: Tên đại dương có diện tích lớn nhất trên Trái Đất là gì?
Đáp án: Thái Bình Dương
Giải thích: Thái Bình Dương chiếm hơn 30% diện tích bề mặt Trái Đất.`
};

type TemplateKey = keyof typeof SAMPLE_TEMPLATES;

const TEMPLATE_DESCRIPTIONS: Record<TemplateKey, { title: string; subtitle: string; icon: any; badge: string; rules: string[] }> = {
  plaintext_mcq: {
    title: 'Trắc Nghiệm 4 Lựa Chọn (A, B, C, D)',
    subtitle: 'Định dạng phổ biến nhất: Tiền tố Câu X:, 4 lựa chọn A, B, C, D và dòng Đáp án',
    icon: ListOrdered,
    badge: 'Phổ biến nhất',
    rules: [
      'Bắt đầu mỗi câu bằng: "Câu 1:", "Câu 2:" hoặc "1.", "2."',
      '4 phương án trên 4 dòng: "A. ...", "B. ...", "C. ...", "D. ..."',
      'Chỉ định đáp án đúng bằng: dòng "Đáp án: C" hoặc đánh dấu sao "*C. Hà Nội"',
      'Có thể thêm dòng "Giải thích: ..." hoặc "Lời giải: ..."'
    ]
  },
  json_format: {
    title: 'Cấu Trúc JSON Chuẩn',
    subtitle: 'Mảng JSON chứa các object câu hỏi với đầy đủ type, content, options, correct',
    icon: Code2,
    badge: 'Lập trình viên / Chuẩn xác 100%',
    rules: [
      'Bọc toàn bộ trong mảng vuông: [ { ... }, { ... } ]',
      'Trường "type": "mcq" (trắc nghiệm), "tf" (đúng sai), "text" (tự luận)',
      'Trường "options": mảng 4 chuỗi cho mcq (VD: ["A", "B", "C", "D"])',
      'Trường "correct": chỉ số 0-3 (mcq), true/false (tf), chuỗi ký tự (text)',
      'Trường "explanation": lời giải thích chi tiết (tùy chọn)'
    ]
  },
  plaintext_all: {
    title: 'Đề Thi Hỗn Hợp (MCQ + Đúng/Sai + Điền Từ)',
    subtitle: 'Kết hợp nhiều loại câu hỏi trong cùng một văn bản hoặc file đề thi',
    icon: Layers,
    badge: 'Đa dạng câu hỏi',
    rules: [
      'Câu trắc nghiệm: Gồm nội dung câu hỏi + các lựa chọn A, B, C, D + Đáp án',
      'Câu Đúng/Sai: Ghi rõ nhãn [Đúng/Sai] hoặc Đáp án: Đúng / Sai',
      'Câu Trả lời ngắn: Ghi rõ nhãn [Trả lời ngắn] + Đáp án: [Từ khóa]'
    ]
  },
  plaintext_tf: {
    title: 'Câu Hỏi Đúng / Sai (True / False)',
    subtitle: 'Định dạng câu nhận định với 2 trạng thái Đúng hoặc Sai',
    icon: CheckSquare,
    badge: 'Nhận định đúng sai',
    rules: [
      'Ghi rõ nội dung nhận định ở dòng đầu',
      'Dòng đáp án bắt buộc ghi: "Đáp án: Đúng" hoặc "Đáp án: Sai"',
      'Có thể bổ sung dòng "Giải thích: ..."'
    ]
  },
  plaintext_text: {
    title: 'Câu Hỏi Trả Lời Ngắn / Điền Khuyết',
    subtitle: 'Hỏi đáp trực tiếp hoặc điền từ vào chỗ trống',
    icon: Edit3,
    badge: 'Tự luận ngắn',
    rules: [
      'Nội dung câu hỏi hoặc câu có dấu "..." để điền từ',
      'Dòng đáp án ghi từ khóa chuẩn: "Đáp án: [Từ/Cụm từ mẫu]"',
      'Có thể bổ sung dòng "Lời giải: ..."'
    ]
  }
};

export const AiQuestionModal: React.FC<AiQuestionModalProps> = ({
  isOpen,
  onClose,
  banks = [],
  activeBankId = '',
  onQuestionsGenerated,
  onSaveGeneratedQuestions,
}) => {
  const [activeTab, setActiveTab] = useState<'curriculum' | 'file'>('curriculum');
  const [grade, setGrade] = useState<string>('Lớp 5');
  const [subject, setSubject] = useState<string>('Toán');
  const [topic, setTopic] = useState('');
  const [count, setCount] = useState(10);
  const [selectedTypes, setSelectedTypes] = useState<string[]>(['mcq', 'tf', 'text']);
  const [targetBankId, setTargetBankId] = useState(activeBankId || (banks[0]?.id ?? 'NEW_BANK'));

  // File upload & paste text state
  const [fileImporting, setFileImporting] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [pastedRawText, setPastedRawText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [loading, setLoading] = useState(false);
  const [aiMode, setAiMode] = useState<AiMode>('balanced');
  const [error, setError] = useState<string | null>(null);

  // Gemini API Selection & Manager State
  const [isApiSelectOpen, setIsApiSelectOpen] = useState(false);
  const [activeApi, setActiveApi] = useState(() => apiManager.getActiveApi());
  const pendingAiActionRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    setActiveApi(apiManager.getActiveApi());
    return apiManager.subscribe(() => {
      setActiveApi(apiManager.getActiveApi());
    });
  }, []);

  const ensureApiAndExecute = (action: () => void) => {
    if (!apiManager.hasActiveApi()) {
      pendingAiActionRef.current = action;
      setIsApiSelectOpen(true);
      return;
    }
    action();
  };
  
  // Chi tiết chẩn đoán lỗi logic từ AI / parser
  const [diagnostics, setDiagnostics] = useState<ParsingDiagnostics | null>(null);
  const [validationSuccessMsg, setValidationSuccessMsg] = useState<string | null>(null);
  
  // CT GDPT 2018 & SGK Kết nối tri thức - Các thông số sư phạm
  const [selectedMatrix, setSelectedMatrix] = useState<string>('standard');
  const [selectedCognitiveLevels, setSelectedCognitiveLevels] = useState<string[]>(['Nhận biết', 'Thông hiểu', 'Vận dụng', 'Vận dụng cao']);
  const [learningOutcome, setLearningOutcome] = useState<string>('');
  const [competencyFocus, setCompetencyFocus] = useState<string>('');
  const [showPedagogySettings, setShowPedagogySettings] = useState<boolean>(true);

  // Guide state
  const [showFormatGuide, setShowFormatGuide] = useState(true);
  const [selectedGuideTab, setSelectedGuideTab] = useState<TemplateKey>('plaintext_mcq');
  const [copiedType, setCopiedType] = useState<string | null>(null);

  // Môn học động theo khối lớp
  const availableSubjects = useMemo(() => {
    return getSubjectsForGrade(grade);
  }, [grade]);

  // Bài học SGK Kết nối tri thức gợi ý theo Khối + Môn
  const suggestedLessons = useMemo(() => {
    return getLessonsForSubjectAndGrade(grade, subject);
  }, [grade, subject]);

  // Gợi ý Yêu cầu cần đạt (YCCĐ) chuẩn CT GDPT 2018
  const suggestedOutcomes = useMemo(() => {
    return getSampleLearningOutcomes(grade, subject, topic);
  }, [grade, subject, topic]);

  // Danh mục năng lực đặc thù của môn học
  const subjectCompetencies = useMemo(() => {
    return getSubjectCompetencies(subject);
  }, [subject]);

  if (!isOpen) return null;

  const currentTypes = selectedTypes || [];

  const handleTypeToggle = (type: string) => {
    if (currentTypes.includes(type)) {
      if (currentTypes.length === 1) return; 
      setSelectedTypes(currentTypes.filter(t => t !== type));
    } else {
      setSelectedTypes([...currentTypes, type]);
    }
  };

  const handleCognitiveLevelToggle = (levelName: string) => {
    if (selectedCognitiveLevels.includes(levelName)) {
      if (selectedCognitiveLevels.length === 1) return;
      setSelectedCognitiveLevels(selectedCognitiveLevels.filter(l => l !== levelName));
    } else {
      setSelectedCognitiveLevels([...selectedCognitiveLevels, levelName]);
    }
  };

  const handleGradeChange = (newGrade: string) => {
    setGrade(newGrade);
    const newSubjects = getSubjectsForGrade(newGrade);
    if (!newSubjects.includes(subject)) {
      setSubject(newSubjects[0] || 'Toán');
    }
    setTopic('');
    setLearningOutcome('');
  };

  const copyTemplateToClipboard = (type: TemplateKey) => {
    navigator.clipboard.writeText(SAMPLE_TEMPLATES[type]);
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2000);
  };

  const insertSampleTextToInput = (type?: TemplateKey) => {
    const key = type || selectedGuideTab;
    setPastedRawText(SAMPLE_TEMPLATES[key]);
    setDiagnostics(null);
    setError(null);
    setValidationSuccessMsg(null);
  };

  // Kiểm tra cú pháp và logic trực tiếp tại Client
  const handleValidateInputSyntax = () => {
    setError(null);
    setValidationSuccessMsg(null);
    setDiagnostics(null);

    const trimmed = pastedRawText.trim();
    if (!trimmed) {
      setError('Vui lòng nhập hoặc dán nội dung vào ô văn bản trước khi kiểm tra.');
      setDiagnostics({
        status: 'invalid',
        formatType: 'plaintext',
        totalDetected: 0,
        validCount: 0,
        invalidCount: 1,
        message: 'Ô văn bản đang để trống.',
        issues: [
          {
            item: 'Ô nhập liệu',
            reason: 'Chưa có nội dung văn bản hoặc JSON',
            suggestion: 'Hãy nhấn "Chèn vào ô nhập" ở phần mẫu phía trên hoặc dán nội dung câu hỏi của bạn',
            severity: 'error'
          }
        ]
      });
      return;
    }

    // Nếu bắt đầu bằng [ hoặc { -> Validate JSON
    let parseRes: any;
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      parseRes = validateAndParseJsonString(trimmed, 'Kiểm tra cú pháp');
    } else {
      parseRes = parseTextToQuestionsWithDiagnostics(trimmed);
    }

    setDiagnostics(parseRes.diagnostics);

    if (parseRes.diagnostics.status === 'success' && parseRes.questions.length > 0) {
      setValidationSuccessMsg(`✅ Định dạng hoàn hảo! Phát hiện ${parseRes.questions.length} câu hỏi hợp lệ sẵn sàng nạp.`);
    } else if (parseRes.diagnostics.status === 'partial') {
      setError(`⚠️ Định dạng có ${parseRes.diagnostics.invalidCount} câu chưa chuẩn. Vui lòng xem chi tiết bên dưới.`);
    } else {
      setError(`❌ Lỗi định dạng: ${parseRes.diagnostics.message}`);
    }
  };

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) {
      setError('Vui lòng chọn hoặc nhập tên chủ đề bài học!');
      return;
    }
    ensureApiAndExecute(() => executeGenerate());
  };

  const executeGenerate = async () => {
    setLoading(true);
    setError(null);
    setDiagnostics(null);
    setValidationSuccessMsg(null);

    try {
      const data = await fetchWithAuth('/api/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject,
          grade,
          topic: topic.trim(),
          types: currentTypes,
          aiMode,
          count,
          learningOutcome: learningOutcome.trim() || undefined,
          cognitiveLevels: selectedCognitiveLevels,
          matrix: selectedMatrix,
          competencyFocus: competencyFocus.trim() || undefined,
          textbookEdition: 'Kết nối tri thức với cuộc sống'
        }),
      });

      if (!data.success) {
        throw new Error(data.error || 'Lỗi khi tạo câu hỏi tự động');
      }

      const generatedQs: Question[] = data.questions || [];
      saveAndFinish(generatedQs, 'AI tạo', 'ai', `${subject} ${grade} - ${topic.trim()} [KNTT]`);
    } catch (err: any) {
      setError(err.message || 'Không thể tạo câu hỏi tự động. Vui lòng kiểm tra kết nối!');
    } finally {
      setLoading(false);
    }
  };

  // Quét từ File upload
  const handleScanFromFile = async (file: File) => {
    setFileImporting(true);
    setError(null);
    setDiagnostics(null);
    setValidationSuccessMsg(null);
    setUploadedFileName(file.name);
    try {
      const parseResult = await parseQuestionFile(file);
      const parsedQuestions = parseResult.questions || [];
      
      if (parseResult.diagnostics) {
        setDiagnostics(parseResult.diagnostics);
      }

      if (parsedQuestions.length === 0) {
        const diagMsg = parseResult.diagnostics?.message || 'Không tìm thấy câu hỏi hợp lệ trong file!';
        setError(diagMsg);
        return;
      }

      saveAndFinish(parsedQuestions, `file "${file.name}"`, 'file', `Đề thi từ ${file.name.replace(/\.[^/.]+$/, "")}`);
    } catch (err: any) {
      setError(err.message || 'Lỗi xử lý file');
    } finally {
      setFileImporting(false);
    }
  };

  // Quét từ văn bản dán
  const handleScanFromRawText = async () => {
    const trimmed = pastedRawText.trim();
    if (!trimmed) {
      setError('Vui lòng dán nội dung đề thi / câu hỏi vào ô văn bản!');
      setDiagnostics({
        status: 'invalid',
        formatType: 'plaintext',
        totalDetected: 0,
        validCount: 0,
        invalidCount: 1,
        message: 'Văn bản đang trống. Vui lòng nhập nội dung hoặc nhấn "Chèn vào ô nhập" từ mẫu chuẩn.',
        issues: [{ item: 'Ô văn bản', reason: 'Chưa có nội dung nhập liệu', suggestion: 'Dán câu hỏi hoặc bấm dùng mẫu bên trên', severity: 'error' }]
      });
      return;
    }

    setLoading(true);
    setError(null);
    setDiagnostics(null);
    setValidationSuccessMsg(null);

    // Kiểm tra trực tiếp nếu là JSON
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      const jsonRes = validateAndParseJsonString(trimmed);
      setDiagnostics(jsonRes.diagnostics);
      if (jsonRes.questions.length > 0 && jsonRes.diagnostics.status === 'success') {
        setLoading(false);
        saveAndFinish(jsonRes.questions, 'cấu trúc JSON');
        return;
      }
      // If JSON is invalid, stop and show detailed error
      if (jsonRes.questions.length === 0) {
        setLoading(false);
        setError(jsonRes.diagnostics.message || 'Cấu trúc JSON không hợp lệ.');
        return;
      }
    }

    try {
      const data = await fetchWithAuth('/api/parse-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rawText: pastedRawText, aiMode })
      });

      if (data && data.diagnostics) {
        setDiagnostics(data.diagnostics);
      }

      if (!data.success || !Array.isArray(data.questions) || data.questions.length === 0) {
        // Fallback local regex parsing
        const localResult = parseTextToQuestionsWithDiagnostics(pastedRawText);
        if (localResult.questions.length > 0) {
          const questions = localResult.questions;
          saveAndFinish(questions, 'văn bản');
          return;
        }

        const diagMsg = data.diagnostics?.message || data.error || 'AI không nhận diện được câu hỏi trong văn bản';
        setError(diagMsg);
        if (!data.diagnostics) {
          setDiagnostics(localResult.diagnostics);
        }
        return;
      }

      const questions: Question[] = data.questions;
      saveAndFinish(questions, 'văn bản');
    } catch (err: any) {
      // Local fallback
      const localResult = parseTextToQuestionsWithDiagnostics(pastedRawText);
      if (localResult.questions.length > 0) {
        saveAndFinish(localResult.questions, 'văn bản (cục bộ)');
        return;
      }
      setDiagnostics(localResult.diagnostics);
      setError(err.message || 'Lỗi trích xuất câu hỏi từ văn bản');
    } finally {
      setLoading(false);
    }
  };

  const saveAndFinish = (questions: Question[], sourceLabel: string, bankPrefix: string = 'text', bankNamePrefix: string = 'Đề trích xuất AI') => {
    let targetQuestions: Question[] = [];
    if (targetBankId && targetBankId !== 'NEW_BANK') {
      const tb = banks?.find(b => b.id === targetBankId);
      if (tb) {
        targetQuestions = tb.questions;
      }
    }

    if (targetQuestions.length > 0) {
      const existingContents = new Set(targetQuestions.map(q => q.content.trim().toLowerCase()));
      const duplicates = questions.filter(q => existingContents.has(q.content.trim().toLowerCase()));
      
      if (duplicates.length > 0) {
        if (safeConfirm(`⚠️ Cảnh báo: Phát hiện ${duplicates.length} câu hỏi đã tồn tại trong bộ đề (bị trùng lặp nội dung). Bạn có muốn lọc và bỏ qua các câu trùng lặp này không?`)) {
          questions = questions.filter(q => !existingContents.has(q.content.trim().toLowerCase()));
          if (questions.length === 0) {
            safeAlert('❌ Tất cả câu hỏi đều bị trùng lặp. Không có câu hỏi nào được nạp thêm.');
            setLoading(false);
            setFileImporting(false);
            return;
          }
        }
      }
    }

    if (targetBankId === 'NEW_BANK' || !targetBankId) {
      const newBank: QuestionBank = {
        id: `bank_${bankPrefix}_${Date.now()}`,
        name: `${bankNamePrefix} (${subject} ${grade})`,
        subject,
        grade,
        topic: topic.trim() || 'Chưa phân loại',
        questions,
        isPreset: false,
        createdAt: new Date().toISOString(),
      };
      if (onSaveGeneratedQuestions) {
        onSaveGeneratedQuestions(newBank);
      } else if (onQuestionsGenerated) {
        onQuestionsGenerated(newBank.id, questions);
      }
    } else {
      if (onQuestionsGenerated) {
        onQuestionsGenerated(targetBankId, questions);
      } else if (onSaveGeneratedQuestions) {
        const targetBank = banks.find(b => b.id === targetBankId);
        if (targetBank) {
          onSaveGeneratedQuestions({
            ...targetBank,
            questions: [...targetBank.questions, ...questions],
          });
        }
      }
    }

    safeAlert(`🎉 Đã tạo / trích xuất thành công ${questions.length} câu hỏi từ ${sourceLabel}!`);
    onClose();
  };

  return (
    <div id="ai-question-modal-container" className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-[#35452E]/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#FFFDF5] border border-[#DED5B8] w-full max-w-4xl rounded-[24px] shadow-[0_16px_40px_rgba(79,104,60,0.2)] flex flex-col max-h-[94vh] overflow-hidden my-auto wey-paper-card">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-[#F8F3E5] border-b border-[#DED5B8] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#E9F0D9] text-[#4F683C] rounded-[14px] shadow-sm border border-[#B9CDA0]">
              <Sparkles className="w-5 h-5 animate-pulse text-[#4F683C]" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-[800] text-[#35452E]">Soạn Câu Hỏi Tự Động Với AI</h2>
              <p className="text-xs text-[#74806B] font-[600]">Hỗ trợ SGK Kết nối tri thức, Quét văn bản A,B,C,D & Chuẩn JSON</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setIsApiSelectOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-[#E9F0D9] hover:bg-[#D4E4C1] text-xs font-[700] text-[#3D522B] rounded-[12px] border border-[#B9CDA0] transition shadow-xs cursor-pointer"
              title="Chọn và kiểm tra cấu hình Gemini API"
            >
              <Key className="w-3.5 h-3.5 text-[#4F683C]" />
              <span className="max-w-[130px] sm:max-w-[180px] truncate">
                {activeApi ? `API: ${activeApi.name}` : '⚙️ Chọn API'}
              </span>
              {activeApi?.status === 'ACTIVE' && (
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              )}
            </button>

            <button
              id="close-ai-modal-btn"
              onClick={onClose}
              className="p-1.5 rounded-[12px] text-[#74806B] hover:text-[#35452E] hover:bg-[#E9F0D9] transition cursor-pointer"
              title="Đóng cửa sổ"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* AI Mode Selector */}
        <div className="px-4 sm:px-6 pt-3 pb-1 shrink-0 bg-[#FFFDF5]">
          <AiUsagePanel onModeChange={setAiMode} selectedMode={aiMode} disabled={loading || fileImporting} />
        </div>

        {/* Tab Toggle: SGK vs Quét File/Văn bản */}
        <div className="px-4 sm:px-6 pt-2 pb-2 shrink-0 flex gap-2 border-b border-[#DED5B8]/60 bg-[#FFFDF5]">
          <button
            id="tab-curriculum-btn"
            type="button"
            onClick={() => {
              setActiveTab('curriculum');
              setError(null);
              setDiagnostics(null);
              setValidationSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-[14px] text-xs font-[700] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'curriculum'
                ? 'bg-[#6F8F55] text-white shadow-sm'
                : 'bg-[#F8F3E5] text-[#74806B] hover:text-[#35452E] border border-[#DED5B8]'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            <span>Tạo theo Bài học SGK (1-12)</span>
          </button>
          <button
            id="tab-file-scan-btn"
            type="button"
            onClick={() => {
              setActiveTab('file');
              setError(null);
              setDiagnostics(null);
              setValidationSuccessMsg(null);
            }}
            className={`flex-1 py-2 px-3 rounded-[14px] text-xs font-[700] flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'file'
                ? 'bg-[#6F8F55] text-white shadow-sm'
                : 'bg-[#F8F3E5] text-[#74806B] hover:text-[#35452E] border border-[#DED5B8]'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Quét File / Dán Đề & Format Chuẩn</span>
          </button>
        </div>

        {/* Modal Body with full scroll */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          
          {/* API Status Notice if Not Active */}
          {(!activeApi || activeApi.status !== 'ACTIVE') && (
            <div id="ai-api-warning-banner" className="p-3.5 bg-amber-50/95 border-2 border-amber-300 text-amber-900 rounded-[20px] text-xs flex items-center justify-between gap-3 shadow-sm animate-fade-in">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <span className="font-[800] text-amber-950 block text-xs sm:text-sm">Chưa có API Gemini đang hoạt động</span>
                  <span className="text-[11px] text-amber-800 font-[600] leading-tight block mt-0.5">
                    {activeApi ? `API "${activeApi.name}" hiện có trạng thái: ${activeApi.status}.` : 'Hệ thống chưa chọn API Key khả dụng.'} Thầy/Cô hãy chọn hoặc chuyển sang API khác để tạo câu hỏi bằng AI.
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsApiSelectOpen(true)}
                className="px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl font-bold text-xs shrink-0 shadow-xs transition cursor-pointer flex items-center gap-1.5"
              >
                <Key className="w-3.5 h-3.5" />
                <span>Chọn API</span>
              </button>
            </div>
          )}

          {/* Validation Success Box */}
          {validationSuccessMsg && (
            <div id="ai-validation-success-box" className="p-3.5 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-[18px] text-xs flex items-center justify-between gap-3 shadow-xs animate-fade-in">
              <div className="flex items-center gap-2">
                <CheckCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <span className="font-[700] text-emerald-800">{validationSuccessMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setValidationSuccessMsg(null)}
                className="text-emerald-600 hover:text-emerald-900 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Detailed Logical Error & Diagnostics Alert Box */}
          {(error || (diagnostics && diagnostics.status === 'invalid') || (diagnostics && diagnostics.issues && diagnostics.issues.length > 0)) && (
            <div id="ai-diagnostics-alert-box" className="p-4 bg-rose-50/95 border-2 border-rose-300 text-rose-900 rounded-[20px] text-xs space-y-3 shadow-sm animate-fade-in">
              
              {/* Header with status badge */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2.5">
                  <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-[800] text-rose-950 text-sm">
                        {diagnostics?.status === 'invalid' 
                          ? 'Phát hiện lỗi logic cấu trúc câu hỏi' 
                          : diagnostics?.status === 'partial'
                          ? 'Cảnh báo logic một số câu hỏi'
                          : 'Thông báo lỗi xử lý'}
                      </p>
                      {diagnostics?.formatType && (
                        <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-rose-200/80 text-rose-800 rounded-[6px] font-[700]">
                          Định dạng: {diagnostics.formatType === 'json' ? 'JSON' : diagnostics.formatType === 'docx' ? 'Word DOCX' : 'Plain Text'}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-rose-800 leading-relaxed font-[600]">
                      {error || diagnostics?.message || 'Nội dung nhập vào không đúng format chuẩn. Hãy xem chi tiết lỗi và hướng dẫn khắc phục bên dưới.'}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setDiagnostics(null);
                  }}
                  className="text-rose-400 hover:text-rose-700 p-1 rounded-[8px] transition cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chi tiết từng lỗi cụ thể (Itemized Logic Issues List) */}
              {diagnostics?.issues && diagnostics.issues.length > 0 && (
                <div className="pt-2 border-t border-rose-200/90 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="font-[800] text-[11.5px] text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                      <Wrench className="w-3.5 h-3.5 text-rose-600" />
                      <span>Danh sách lỗi logic cụ thể ({diagnostics.issues.length}):</span>
                    </p>
                    <span className="text-[11px] text-rose-700 font-[600]">
                      Hợp lệ: <b className="text-emerald-700">{diagnostics.validCount || 0}</b> | Lỗi: <b className="text-rose-700">{diagnostics.invalidCount || diagnostics.issues.length}</b>
                    </span>
                  </div>

                  <div className="max-h-44 overflow-y-auto space-y-1.5 pr-1">
                    {diagnostics.issues.map((iss, idx) => (
                      <div key={idx} className={`p-2.5 rounded-[12px] border text-[11px] ${
                        iss.severity === 'warning' 
                          ? 'bg-amber-50/90 border-amber-300 text-amber-900' 
                          : 'bg-white/95 border-rose-200 text-rose-900 shadow-xs'
                      }`}>
                        <div className="flex items-start justify-between gap-2 font-[700]">
                          <span className="flex items-center gap-1 text-rose-950 font-[800]">
                            {iss.severity === 'warning' ? (
                              <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                            ) : (
                              <AlertCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                            )}
                            <span>{iss.item}</span>
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-[6px] font-[700] ${
                            iss.severity === 'warning'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-rose-100 text-rose-700'
                          }`}>
                            {iss.reason}
                          </span>
                        </div>
                        {iss.suggestion && (
                          <div className="text-[#415433] mt-1.5 text-[11px] font-[600] bg-[#E9F0D9]/40 p-1.5 rounded-[8px] border border-[#B9CDA0]/50 flex items-start gap-1.5">
                            <span className="shrink-0">👉</span>
                            <span><b>Cách sửa:</b> {iss.suggestion}</span>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Action to open Format Guide & Insert Samples */}
              <div className="pt-2 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setShowFormatGuide(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-rose-300 text-rose-800 hover:bg-rose-100/50 rounded-[10px] font-[700] text-[11px] transition cursor-pointer shadow-xs"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Xem ví dụ format nhập liệu chuẩn</span>
                  </button>
                </div>

                {activeTab === 'file' && (
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => insertSampleTextToInput('plaintext_mcq')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-[#B9CDA0] text-[#35452E] hover:bg-[#E9F0D9] rounded-[10px] font-[700] text-[11px] transition cursor-pointer shadow-xs"
                    >
                      <ListOrdered className="w-3.5 h-3.5 text-[#4F683C]" />
                      <span>Dán mẫu trắc nghiệm (A,B,C,D)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => insertSampleTextToInput('json_format')}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#4F683C] text-white hover:bg-[#35452E] rounded-[10px] font-[700] text-[11px] transition cursor-pointer shadow-xs"
                    >
                      <Code2 className="w-3.5 h-3.5 text-amber-300" />
                      <span>Dán mẫu JSON</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'curriculum' ? (
            <form onSubmit={handleGenerate} className="space-y-4">
              {/* CT GDPT 2018 & SGK KNTT Banner */}
              <div className="p-3 bg-gradient-to-r from-[#4F683C]/10 via-[#6F8F55]/10 to-[#DED5B8]/30 border border-[#B9CDA0] rounded-[16px] flex items-start gap-2.5">
                <div className="p-1.5 bg-[#4F683C] text-white rounded-[10px] shrink-0 mt-0.5 shadow-xs">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-xs font-[800] text-[#35452E]">
                      Chuẩn Chương Trình GDPT 2018
                    </span>
                    <span className="text-[10px] font-[700] px-2 py-0.5 bg-[#4F683C] text-white rounded-full">
                      SGK Kết Nối Tri Thức
                    </span>
                  </div>
                  <p className="text-[11px] text-[#4F683C] font-[500] mt-0.5 leading-relaxed">
                    AI tự động liên kết Yêu cầu cần đạt (YCCĐ), phân hóa 4 mức độ nhận thức và áp dụng thuật ngữ khoa học/danh pháp IUPAC mới.
                  </p>
                </div>
              </div>

              {/* Grade & Subject Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-[700] text-[#74806B] mb-1">
                    Khối / Lớp:
                  </label>
                  <select
                    id="grade-select"
                    value={grade}
                    onChange={(e) => handleGradeChange(e.target.value)}
                    className="w-full bg-white border border-[#DED5B8] text-[#35452E] rounded-[14px] px-3 py-2 text-xs font-[700] focus:outline-none focus:border-[#6F8F55] cursor-pointer"
                  >
                    {GRADES.map((g) => (
                      <option key={g} value={g}>{g}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-[700] text-[#74806B] mb-1">
                    Môn Học (GDPT 2018):
                  </label>
                  <select
                    id="subject-select"
                    value={subject}
                    onChange={(e) => {
                      setSubject(e.target.value);
                      setTopic('');
                      setLearningOutcome('');
                    }}
                    className="w-full bg-white border border-[#DED5B8] text-[#35452E] rounded-[14px] px-3 py-2 text-xs font-[700] focus:outline-none focus:border-[#6F8F55] cursor-pointer"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Topic Input with Datalist Suggestions */}
              <div>
                <label className="block text-xs font-[700] text-[#74806B] mb-1">
                  Chủ Đề / Tên Bài Học SGK Kết Nối Tri Thức <span className="text-rose-500">*</span>:
                </label>
                <input
                  id="topic-input"
                  type="text"
                  list="curriculum-lessons"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="Chọn từ gợi ý hoặc nhập tên bài học..."
                  className="w-full bg-white border border-[#DED5B8] text-[#35452E] rounded-[14px] px-3 py-2.5 text-xs sm:text-sm font-[600] focus:outline-none focus:border-[#6F8F55] focus:ring-2 focus:ring-[#6F8F55]/20 shadow-sm"
                  required
                />
                <datalist id="curriculum-lessons">
                  {suggestedLessons.map((lesson, idx) => (
                    <option key={idx} value={lesson} />
                  ))}
                </datalist>
              </div>

              {/* Quick Select suggested chips from SGK */}
              {suggestedLessons.length > 0 && (
                <div>
                  <label className="block text-[11px] font-[700] text-[#74806B] mb-1.5 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5 text-[#6F8F55]" />
                    <span>Bài học tiêu biểu trong SGK Kết nối tri thức (nhấp để chọn nhanh):</span>
                  </label>
                  <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1.5 bg-[#F8F3E5]/60 rounded-[14px] border border-[#DED5B8]/60">
                    {suggestedLessons.slice(0, 8).map((lesson, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTopic(lesson)}
                        className={`text-[11px] px-2.5 py-1 rounded-[10px] text-left transition cursor-pointer font-[600] border ${
                          topic === lesson
                            ? 'bg-[#6F8F55] text-white border-[#6F8F55]'
                            : 'bg-white text-[#35452E] border-[#DED5B8] hover:bg-[#E9F0D9]'
                        }`}
                      >
                        {lesson}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Pedagogical Settings (YCCĐ & Mức độ nhận thức) */}
              <div className="border border-[#DED5B8] rounded-[16px] bg-[#FFFDF5] overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowPedagogySettings(!showPedagogySettings)}
                  className="w-full px-3.5 py-2.5 bg-[#F8F3E5] flex items-center justify-between text-left hover:bg-[#E9F0D9] transition cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-[#4F683C]" />
                    <span className="text-xs font-[800] text-[#35452E]">
                      Thiết Lập Sư Phạm: YCCĐ & Mức Độ Nhận Thức
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#4F683C]/15 text-[#4F683C] font-[700]">
                      Chuẩn GDPT 2018
                    </span>
                  </div>
                  {showPedagogySettings ? (
                    <ChevronUp className="w-4 h-4 text-[#74806B]" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-[#74806B]" />
                  )}
                </button>

                {showPedagogySettings && (
                  <div className="p-3.5 space-y-3.5 border-t border-[#DED5B8]/80 text-xs">
                    {/* Ma trận nhận thức */}
                    <div>
                      <label className="block text-xs font-[700] text-[#35452E] mb-1.5 flex items-center justify-between">
                        <span>Ma trận phân bổ nhận thức:</span>
                        <span className="text-[11px] font-[500] text-[#74806B]">
                          {STANDARD_ASSESSMENT_MATRICES.find(m => m.id === selectedMatrix)?.description}
                        </span>
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {STANDARD_ASSESSMENT_MATRICES.map((mat) => (
                          <button
                            key={mat.id}
                            type="button"
                            onClick={() => setSelectedMatrix(mat.id)}
                            className={`p-2 rounded-[12px] border text-left transition cursor-pointer ${
                              selectedMatrix === mat.id
                                ? 'bg-[#E9F0D9] border-[#4F683C] text-[#35452E] font-[700] ring-1 ring-[#4F683C]'
                                : 'bg-white border-[#DED5B8] text-[#74806B] hover:bg-[#F8F3E5]'
                            }`}
                          >
                            <div className="text-[11px] font-[800] leading-tight mb-0.5">{mat.name.split('(')[0]}</div>
                            <div className="text-[10px] text-[#74806B] font-mono">
                              {mat.distribution.nhan_biet}%NB - {mat.distribution.thong_hieu}%TH - {mat.distribution.van_dung}%VD
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Mức độ nhận thức chi tiết */}
                    <div>
                      <label className="block text-xs font-[700] text-[#35452E] mb-1.5">
                        Lọc theo mức độ nhận thức:
                      </label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                        {COGNITIVE_LEVELS_INFO.map((level) => {
                          const isSelected = selectedCognitiveLevels.includes(level.name);
                          return (
                            <button
                              key={level.id}
                              type="button"
                              onClick={() => handleCognitiveLevelToggle(level.name)}
                              className={`p-2 rounded-[12px] border text-left transition cursor-pointer flex flex-col justify-between ${
                                isSelected
                                  ? 'bg-[#E9F0D9] border-[#4F683C] text-[#35452E]'
                                  : 'bg-white border-[#DED5B8] text-slate-400 opacity-60'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <span className="font-[800] text-[11px]">{level.name}</span>
                                {isSelected && <Check className="w-3.5 h-3.5 text-[#4F683C]" />}
                              </div>
                              <p className="text-[10px] text-[#74806B] line-clamp-2 mt-1 leading-snug">
                                {level.desc}
                              </p>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Yêu cầu cần đạt (YCCĐ) */}
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-xs font-[700] text-[#35452E] flex items-center gap-1">
                          <Award className="w-3.5 h-3.5 text-[#4F683C]" />
                          <span>Yêu cầu cần đạt (YCCĐ) mục tiêu (tùy chọn):</span>
                        </label>
                      </div>
                      <input
                        type="text"
                        value={learningOutcome}
                        onChange={(e) => setLearningOutcome(e.target.value)}
                        placeholder="Chọn từ gợi ý bên dưới hoặc nhập YCCĐ của bài học..."
                        className="w-full bg-white border border-[#DED5B8] text-[#35452E] rounded-[12px] px-3 py-2 text-xs font-[600] focus:outline-none focus:border-[#6F8F55]"
                      />
                      {suggestedOutcomes.length > 0 && (
                        <div className="mt-1.5 flex flex-wrap gap-1">
                          {suggestedOutcomes.map((outcome, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setLearningOutcome(outcome)}
                              className={`text-[10px] px-2 py-1 rounded-[8px] border text-left transition cursor-pointer leading-tight ${
                                learningOutcome === outcome
                                  ? 'bg-[#4F683C] text-white border-[#4F683C] font-[700]'
                                  : 'bg-white text-[#4F683C] border-[#B9CDA0] hover:bg-[#E9F0D9]'
                              }`}
                            >
                              💡 {outcome.length > 70 ? outcome.slice(0, 70) + '...' : outcome}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Năng lực đặc thù */}
                    {subjectCompetencies.length > 0 && (
                      <div>
                        <label className="block text-xs font-[700] text-[#35452E] mb-1 flex items-center gap-1">
                          <BookMarked className="w-3.5 h-3.5 text-[#4F683C]" />
                          <span>Năng lực đặc thù môn {subject}:</span>
                        </label>
                        <div className="flex flex-wrap gap-1">
                          {subjectCompetencies.map((comp, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setCompetencyFocus(competencyFocus === comp ? '' : comp)}
                              className={`text-[10px] px-2 py-1 rounded-[8px] border transition cursor-pointer font-[600] ${
                                competencyFocus === comp
                                  ? 'bg-[#4F683C] text-white border-[#4F683C]'
                                  : 'bg-white text-[#35452E] border-[#DED5B8] hover:bg-[#E9F0D9]'
                              }`}
                            >
                              {comp}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Question Types */}
              <div>
                <label className="block text-xs font-[700] text-[#74806B] mb-1.5">
                  Dạng Câu Hỏi Muốn Tạo:
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => handleTypeToggle('mcq')}
                    className={`py-2 px-2 text-xs font-[700] rounded-[12px] border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      currentTypes.includes('mcq')
                        ? 'bg-[#E9F0D9] border-[#B9CDA0] text-[#35452E]'
                        : 'bg-white border-[#DED5B8] text-[#74806B] hover:bg-[#F8F3E5]'
                    }`}
                  >
                    {currentTypes.includes('mcq') && <CheckCircle2 className="w-3.5 h-3.5 text-[#6F8F55] shrink-0" />}
                    <span>Trắc nghiệm (4 opt)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeToggle('tf')}
                    className={`py-2 px-2 text-xs font-[700] rounded-[12px] border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      currentTypes.includes('tf')
                        ? 'bg-[#E9F0D9] border-[#B9CDA0] text-[#35452E]'
                        : 'bg-white border-[#DED5B8] text-[#74806B] hover:bg-[#F8F3E5]'
                    }`}
                  >
                    {currentTypes.includes('tf') && <CheckCircle2 className="w-3.5 h-3.5 text-[#6F8F55] shrink-0" />}
                    <span>Đúng / Sai</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleTypeToggle('text')}
                    className={`py-2 px-2 text-xs font-[700] rounded-[12px] border transition flex items-center justify-center gap-1.5 cursor-pointer ${
                      currentTypes.includes('text')
                        ? 'bg-[#E9F0D9] border-[#B9CDA0] text-[#35452E]'
                        : 'bg-white border-[#DED5B8] text-[#74806B] hover:bg-[#F8F3E5]'
                    }`}
                  >
                    {currentTypes.includes('text') && <CheckCircle2 className="w-3.5 h-3.5 text-[#6F8F55] shrink-0" />}
                    <span>Trả lời ngắn</span>
                  </button>
                </div>
              </div>

              {/* Quantity & Target Bank */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-[700] text-[#74806B] mb-1">
                    Số Lượng Câu Hỏi:
                  </label>
                  <select
                    value={count}
                    onChange={(e) => setCount(Number(e.target.value))}
                    className="w-full bg-white border border-[#DED5B8] text-[#35452E] rounded-[14px] px-3 py-2 text-xs font-[700] focus:outline-none focus:border-[#6F8F55] cursor-pointer"
                  >
                    <option value={5}>5 câu hỏi</option>
                    <option value={10}>10 câu hỏi</option>
                    <option value={15}>15 câu hỏi</option>
                    <option value={20}>20 câu hỏi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-[700] text-[#74806B] mb-1">
                    Lưu Vào Bộ Câu Hỏi:
                  </label>
                  <select
                    value={targetBankId}
                    onChange={(e) => setTargetBankId(e.target.value)}
                    className="w-full bg-white border border-[#DED5B8] text-[#35452E] rounded-[14px] px-3 py-2 text-xs font-[700] focus:outline-none focus:border-[#6F8F55] cursor-pointer"
                  >
                    <option value="NEW_BANK">➕ Tạo Bộ Mới</option>
                    {(banks || []).map((b) => (
                      <option key={b.id} value={b.id}>
                        📚 {b.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Submit button */}
              <div className="pt-3 flex justify-end gap-2.5">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 bg-white border border-[#DED5B8] hover:bg-[#F8F3E5] text-[#74806B] font-[700] text-xs rounded-[14px] transition cursor-pointer"
                >
                  Hủy
                </button>
                <button
                  id="submit-ai-generate-btn"
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-[800] text-xs sm:text-sm rounded-[14px] shadow-sm transition disabled:opacity-50 cursor-pointer"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Gemini Đang Tạo Câu Hỏi...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-[#FFFDF5]" />
                      <span>Bắt Đầu Tạo Với AI</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            /* Tab: Quét từ File / Dán Đề Thi (Mọi Dạng) & Hiển thị format mẫu chuẩn */
            <div className="space-y-4">
              
              {/* Prominent Format Guide Section Directly on UI */}
              <div id="format-guide-card" className="bg-[#F8F3E5] border-2 border-[#DED5B8] rounded-[22px] p-3.5 sm:p-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-[#E9F0D9] text-[#4F683C] rounded-[12px] border border-[#B9CDA0] shadow-xs">
                      <FileCode className="w-4 h-4 text-[#4F683C]" />
                    </div>
                    <div>
                      <h3 className="text-xs sm:text-sm font-[800] text-[#35452E] flex items-center gap-2 flex-wrap">
                        <span>Ví Dụ Format Nhập Liệu Chuẩn</span>
                        <span className="bg-[#4F683C] text-white text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-xs">
                          JSON & Plain Text (A,B,C,D)
                        </span>
                      </h3>
                      <p className="text-[11px] text-[#74806B] font-[600] mt-0.5">
                        Chọn định dạng bên dưới để xem mẫu, sao chép hoặc nhấn chèn trực tiếp vào ô nhập
                      </p>
                    </div>
                  </div>
                  <button
                    id="toggle-format-guide-btn"
                    type="button"
                    onClick={() => setShowFormatGuide(!showFormatGuide)}
                    className="text-[11px] font-[700] text-[#4F683C] hover:text-[#35452E] flex items-center gap-1 cursor-pointer bg-white px-3 py-1.5 rounded-[12px] border border-[#DED5B8] shadow-xs"
                  >
                    <span>{showFormatGuide ? 'Thu gọn' : 'Xem mẫu'}</span>
                    {showFormatGuide ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>
                </div>

                {/* Interactive Format Guide with Tabs */}
                {showFormatGuide && (
                  <div className="mt-3.5 pt-3 border-t border-[#DED5B8] space-y-3 animate-fade-in">
                    
                    {/* Format Tabs Selection */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5">
                      <button
                        type="button"
                        onClick={() => setSelectedGuideTab('plaintext_mcq')}
                        className={`text-[11px] px-2.5 py-2 rounded-[12px] font-[700] transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer border ${
                          selectedGuideTab === 'plaintext_mcq'
                            ? 'bg-[#4F683C] text-white border-[#35452E] shadow-xs'
                            : 'bg-white text-[#35452E] border-[#DED5B8] hover:bg-[#E9F0D9]'
                        }`}
                      >
                        <ListOrdered className="w-4 h-4" />
                        <span className="leading-tight">Trắc nghiệm (A,B,C,D)</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGuideTab('json_format')}
                        className={`text-[11px] px-2.5 py-2 rounded-[12px] font-[700] transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer border ${
                          selectedGuideTab === 'json_format'
                            ? 'bg-[#4F683C] text-white border-[#35452E] shadow-xs'
                            : 'bg-white text-[#35452E] border-[#DED5B8] hover:bg-[#E9F0D9]'
                        }`}
                      >
                        <Code2 className="w-4 h-4 text-amber-500" />
                        <span className="leading-tight font-mono">JSON Chuẩn</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGuideTab('plaintext_all')}
                        className={`text-[11px] px-2.5 py-2 rounded-[12px] font-[700] transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer border ${
                          selectedGuideTab === 'plaintext_all'
                            ? 'bg-[#4F683C] text-white border-[#35452E] shadow-xs'
                            : 'bg-white text-[#35452E] border-[#DED5B8] hover:bg-[#E9F0D9]'
                        }`}
                      >
                        <Layers className="w-4 h-4" />
                        <span className="leading-tight">Đề Hỗn Hợp</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGuideTab('plaintext_tf')}
                        className={`text-[11px] px-2.5 py-2 rounded-[12px] font-[700] transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer border ${
                          selectedGuideTab === 'plaintext_tf'
                            ? 'bg-[#4F683C] text-white border-[#35452E] shadow-xs'
                            : 'bg-white text-[#35452E] border-[#DED5B8] hover:bg-[#E9F0D9]'
                        }`}
                      >
                        <CheckSquare className="w-4 h-4" />
                        <span className="leading-tight">Đúng / Sai</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedGuideTab('plaintext_text')}
                        className={`text-[11px] px-2.5 py-2 rounded-[12px] font-[700] transition flex flex-col items-center justify-center gap-1 text-center cursor-pointer border ${
                          selectedGuideTab === 'plaintext_text'
                            ? 'bg-[#4F683C] text-white border-[#35452E] shadow-xs'
                            : 'bg-white text-[#35452E] border-[#DED5B8] hover:bg-[#E9F0D9]'
                        }`}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span className="leading-tight">Điền Từ / Tự Luận</span>
                      </button>
                    </div>

                    {/* Active Template Explanation Box */}
                    <div className="bg-white/90 border border-[#DED5B8] rounded-[14px] p-3 text-xs space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-[800] text-[#35452E] text-xs sm:text-sm">
                          📌 {TEMPLATE_DESCRIPTIONS[selectedGuideTab].title}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E9F0D9] text-[#4F683C] border border-[#B9CDA0]">
                          {TEMPLATE_DESCRIPTIONS[selectedGuideTab].badge}
                        </span>
                      </div>
                      <p className="text-[#74806B] font-[600] text-[11px]">
                        {TEMPLATE_DESCRIPTIONS[selectedGuideTab].subtitle}
                      </p>
                      
                      {/* Rules Checklist */}
                      <div className="pt-1.5 grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-[#415433]">
                        {TEMPLATE_DESCRIPTIONS[selectedGuideTab].rules.map((rule, idx) => (
                          <div key={idx} className="flex items-start gap-1 font-[600]">
                            <span className="text-[#6F8F55] shrink-0">✔</span>
                            <span>{rule}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Preview Code Box */}
                    <div className="relative group">
                      <div className="bg-[#1E293B] border border-slate-700 rounded-[14px] p-3 text-[11px] font-mono text-slate-100 leading-relaxed max-h-48 overflow-y-auto whitespace-pre-wrap shadow-inner selection:bg-emerald-500 selection:text-white">
                        {SAMPLE_TEMPLATES[selectedGuideTab]}
                      </div>
                      
                      {/* Floating Format Type Indicator */}
                      <div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-90 group-hover:opacity-100 transition">
                        <span className="text-[10px] font-mono uppercase bg-slate-800 text-slate-300 border border-slate-600 px-2 py-0.5 rounded-[6px]">
                          {selectedGuideTab === 'json_format' ? 'application/json' : 'text/plain'}
                        </span>
                      </div>
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <div className="text-[11px] text-[#74806B] font-[600] flex items-center gap-1">
                        <Info className="w-3.5 h-3.5 text-[#4F683C] shrink-0" />
                        <span>Nhấn <b>"Chèn vào ô nhập"</b> để kiểm tra hoặc chỉnh sửa trực tiếp nội dung đề.</span>
                      </div>

                      <div className="flex gap-2">
                        <button
                          id="copy-template-btn"
                          type="button"
                          onClick={() => copyTemplateToClipboard(selectedGuideTab)}
                          className="px-3 py-1.5 bg-white border border-[#DED5B8] text-[#35452E] hover:bg-[#E9F0D9] rounded-[10px] text-[11px] font-[700] flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                        >
                          {copiedType === selectedGuideTab ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-600" />
                              <span className="text-emerald-700">Đã chép!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-[#4F683C]" />
                              <span>Sao chép mẫu</span>
                            </>
                          )}
                        </button>

                        <button
                          id="insert-template-btn"
                          type="button"
                          onClick={() => insertSampleTextToInput(selectedGuideTab)}
                          className="px-3 py-1.5 bg-[#4F683C] text-white hover:bg-[#35452E] rounded-[10px] text-[11px] font-[700] flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                        >
                          <Sparkles className="w-3.5 h-3.5 text-[#E9F0D9]" />
                          <span>Chèn vào ô nhập</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* File Upload Box */}
              <div>
                <div 
                  id="file-upload-dropzone"
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-[#B9CDA0] bg-[#E9F0D9]/30 hover:bg-[#E9F0D9]/60 p-4 rounded-[18px] text-center cursor-pointer transition flex flex-col items-center justify-center gap-1.5"
                >
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) handleScanFromFile(f);
                    }}
                    accept=".docx,.doc,.txt,.json,.csv,.md,.tsv"
                    className="hidden" 
                  />
                  <div className="p-2.5 bg-white rounded-full shadow-sm text-[#4F683C] border border-[#B9CDA0]">
                    {fileImporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm font-[700] text-[#35452E]">
                      {fileImporting ? 'AI Đang đọc & phân tích đề...' : 'Tải file đề thi: Word (.docx), TXT, JSON, CSV'}
                    </p>
                    <p className="text-[11px] text-[#74806B] font-[600]">
                      Hệ thống sẽ tự động quét và kiểm tra cấu trúc câu hỏi theo các chuẩn ở trên
                    </p>
                  </div>
                </div>
                
                <div className="mt-2.5 p-3 bg-white border border-[#DED5B8] rounded-[14px]">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                    <p className="text-[11px] font-[700] text-[#35452E] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-blue-600" />
                      Cấu trúc file CSV chuẩn:
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        const csvContent = "\uFEFFQuestion,OptionA,OptionB,OptionC,OptionD,CorrectAnswer,Explanation\nThủ đô của Việt Nam là gì?,Hà Nội,Hồ Chí Minh,Đà Nẵng,Huế,A,Hà Nội là thủ đô của Việt Nam.\n2 + 2 = 4 đúng không?,,,,true,Phép tính cơ bản\nNêu khái niệm Trái Đất,,,,Hành tinh thứ 3,Trái Đất là một hành tinh xanh.\n";
                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const url = URL.createObjectURL(blob);
                        const link = document.createElement("a");
                        link.setAttribute("href", url);
                        link.setAttribute("download", "question_template.csv");
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      className="text-[11px] bg-blue-50 hover:bg-blue-100 text-blue-700 px-3 py-1.5 rounded-[10px] font-[700] cursor-pointer flex items-center gap-1.5 shadow-xs border border-blue-200 transition"
                    >
                      <Download className="w-3.5 h-3.5" />
                      Download Template CSV
                    </button>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[10px] text-[#74806B] font-[600]">
                    <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">1. <span className="text-[#35452E] font-[800]">Question</span> (Bắt buộc)</div>
                    <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">2. <span className="text-[#35452E] font-[800]">CorrectAnswer</span> (Bắt buộc)</div>
                    <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">3. <span className="text-[#35452E] font-[800]">Explanation</span> (Tùy chọn)</div>
                    <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">4. <span className="text-[#35452E] font-[800]">OptionA</span> (Cho MCQ)</div>
                    <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">5. <span className="text-[#35452E] font-[800]">OptionB</span> (Cho MCQ)</div>
                    <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">6. <span className="text-[#35452E] font-[800]">OptionC</span> (Cho MCQ)</div>
                    <div className="bg-slate-50 p-1.5 rounded-md border border-slate-100">7. <span className="text-[#35452E] font-[800]">OptionD</span> (Cho MCQ)</div>
                  </div>
                </div>
              </div>

              {/* Paste Raw Text Box */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-[700] text-[#74806B] flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-[#6F8F55]" />
                    <span>Dán nội dung câu hỏi hoặc cấu trúc JSON vào đây:</span>
                  </label>
                  
                  <div className="flex items-center gap-2">
                    <button
                      id="validate-syntax-btn"
                      type="button"
                      onClick={handleValidateInputSyntax}
                      className="text-[11px] px-2.5 py-1 bg-white border border-[#B9CDA0] hover:bg-[#E9F0D9] text-[#4F683C] font-[700] rounded-[8px] flex items-center gap-1 cursor-pointer transition shadow-2xs"
                      title="Kiểm tra xem nội dung đã đúng format chuẩn chưa trước khi quét"
                    >
                      <SearchCode className="w-3.5 h-3.5" />
                      <span>Kiểm tra format ô nhập</span>
                    </button>
                  </div>
                </div>

                <textarea
                  id="raw-text-textarea"
                  value={pastedRawText}
                  onChange={(e) => {
                    setPastedRawText(e.target.value);
                    if (error) setError(null);
                    if (validationSuccessMsg) setValidationSuccessMsg(null);
                  }}
                  placeholder="Dán nội dung câu hỏi dạng văn bản hoặc JSON tại đây...&#10;&#10;Ví dụ Trắc nghiệm chuẩn:&#10;Câu 1: Thủ đô của Việt Nam là gì?&#10;A. Hà Nội&#10;B. Đà Nẵng&#10;C. TP.HCM&#10;D. Cần Thơ&#10;Đáp án: A&#10;Giải thích: Hà Nội là thủ đô của Việt Nam."
                  className="w-full bg-white border border-[#DED5B8] text-[#35452E] rounded-[16px] p-3 text-xs sm:text-sm font-mono min-h-[160px] focus:outline-none focus:border-[#6F8F55] focus:ring-2 focus:ring-[#6F8F55]/20 shadow-sm"
                />
              </div>

              {/* Target Bank Selection */}
              <div>
                <label className="block text-xs font-[700] text-[#74806B] mb-1">
                  Lưu Vào Bộ Câu Hỏi:
                </label>
                <select
                  id="target-bank-select"
                  value={targetBankId}
                  onChange={(e) => setTargetBankId(e.target.value)}
                  className="w-full bg-white border border-[#DED5B8] text-[#35452E] rounded-[14px] px-3 py-2 text-xs font-[700] focus:outline-none focus:border-[#6F8F55] cursor-pointer"
                >
                  <option value="NEW_BANK">➕ Tạo Bộ Mới Từ Nội Dung Này</option>
                  {(banks || []).map((b) => (
                    <option key={b.id} value={b.id}>
                      📚 {b.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Scan Button & Action buttons */}
              <div className="pt-2 flex items-center justify-between gap-2.5 flex-wrap">
                <button
                  type="button"
                  onClick={handleValidateInputSyntax}
                  className="px-3.5 py-2 bg-white border border-[#DED5B8] hover:bg-[#E9F0D9] text-[#35452E] font-[700] text-xs rounded-[14px] transition flex items-center gap-1.5 cursor-pointer"
                >
                  <SearchCode className="w-3.5 h-3.5 text-[#4F683C]" />
                  <span>Kiểm tra lỗi logic trước</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-4 py-2.5 bg-white border border-[#DED5B8] hover:bg-[#F8F3E5] text-[#74806B] font-[700] text-xs rounded-[14px] transition cursor-pointer"
                  >
                    Hủy
                  </button>
                  <button
                    id="scan-raw-text-btn"
                    type="button"
                    onClick={handleScanFromRawText}
                    disabled={loading || !pastedRawText.trim()}
                    className="flex items-center justify-center gap-2 px-5 py-2.5 bg-[#6F8F55] hover:bg-[#5F7E4B] text-white font-[800] text-xs sm:text-sm rounded-[14px] shadow-sm transition disabled:opacity-50 cursor-pointer"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Đang Phân Tích & Quét Đề...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4 text-[#FFFDF5]" />
                        <span>Quét & Nạp Câu Hỏi</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Global API Selector Modal */}
      <ApiSelectModal
        isOpen={isApiSelectOpen}
        onClose={() => setIsApiSelectOpen(false)}
        featureTitle="Tạo Câu Hỏi Bằng AI"
        onSelectAndProceed={() => {
          setIsApiSelectOpen(false);
          if (pendingAiActionRef.current) {
            const action = pendingAiActionRef.current;
            pendingAiActionRef.current = null;
            action();
          }
        }}
      />
    </div>
  );
};
