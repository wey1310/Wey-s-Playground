import { fetchWithAuth } from './api';
import type { Question } from '../types';
// @ts-ignore
import * as mammoth from 'mammoth';

export interface ParsingIssue {
  item: string;
  reason: string;
  suggestion?: string;
  severity?: 'error' | 'warning';
  line?: number;
}

export interface ParsingDiagnostics {
  status: 'success' | 'partial' | 'invalid';
  formatType?: 'json' | 'plaintext' | 'docx' | 'unknown';
  totalDetected: number;
  validCount: number;
  invalidCount: number;
  message: string;
  issues?: ParsingIssue[];
}

export interface ParseResult {
  questions: Question[];
  diagnostics: ParsingDiagnostics;
}

export async function parseQuestionFile(file: File): Promise<ParseResult> {
  const extension = file.name.split('.').pop()?.toLowerCase();
  
  // 1. Xử lý file JSON chuẩn
  if (extension === 'json') {
    const text = await file.text();
    const jsonResult = validateAndParseJsonString(text, file.name);
    if (jsonResult.questions.length > 0 && jsonResult.diagnostics.status === 'success') {
      return jsonResult;
    }
    // If JSON had errors, return detailed diagnostics
    if (jsonResult.diagnostics.issues && jsonResult.diagnostics.issues.length > 0) {
      return jsonResult;
    }
  }

  if (extension === 'csv') {
    const text = await file.text();
    const csvResult = parseCSVToQuestions(text);
    if (csvResult.questions.length > 0) {
      return csvResult;
    }
    // If it fails but has issues, return diagnostics
    if (csvResult.diagnostics.issues && csvResult.diagnostics.issues.length > 0) {
      return csvResult;
    }
  }

  let extractedRawText = '';

  // 2. Xử lý file Word DOCX bằng mammoth
  if (extension === 'docx') {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      extractedRawText = result.value || '';
    } catch (docxErr) {
      console.warn("Lỗi giải mã DOCX bằng mammoth, thử đọc text thô:", docxErr);
      extractedRawText = await file.text();
    }
  } else {
    // TXT, CSV, MD, TSV, v.v.
    extractedRawText = await file.text();
  }

  if (!extractedRawText.trim()) {
    return {
      questions: [],
      diagnostics: {
        status: 'invalid',
        formatType: extension === 'json' ? 'json' : 'docx',
        totalDetected: 0,
        validCount: 0,
        invalidCount: 1,
        message: `File "${file.name}" rỗng hoặc không thể đọc được nội dung văn bản.`,
        issues: [
          {
            item: file.name,
            reason: 'File không chứa nội dung văn bản hoặc bị khóa mã hóa.',
            suggestion: 'Hãy lưu lại file dưới dạng .docx hoặc .txt tiêu chuẩn có nội dung câu hỏi và thử lại.',
            severity: 'error'
          }
        ]
      }
    };
  }

  // Check if text is JSON string inside non-json file
  if (extractedRawText.trim().startsWith('[') || extractedRawText.trim().startsWith('{')) {
    const jsonResult = validateAndParseJsonString(extractedRawText, file.name);
    if (jsonResult.questions.length > 0) {
      return jsonResult;
    }
  }

  // 3. Sử dụng AI Gemini để phân tích văn bản thô chính xác và tự động nhận diện đáp án
  try {
    const data = await fetchWithAuth('/api/parse-document', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawText: extractedRawText })
    });
    
    if (data && data.success && Array.isArray(data.questions) && data.questions.length > 0) {
      const sanitized = data.questions.map((q: any, idx: number) => sanitizeParsedQuestion(q, idx));
      return {
        questions: sanitized,
        diagnostics: data.diagnostics || {
          status: 'success',
          formatType: 'plaintext',
          totalDetected: sanitized.length,
          validCount: sanitized.length,
          invalidCount: 0,
          message: `AI đã trích xuất thành công ${sanitized.length} câu hỏi từ file "${file.name}".`
        }
      };
    } else if (data && data.diagnostics) {
      // AI returned specific diagnostics on why it failed or partial
      const regexFallback = parseTextToQuestionsWithDiagnostics(extractedRawText);
      if (regexFallback.questions.length > 0) {
        return regexFallback;
      }
      return {
        questions: [],
        diagnostics: data.diagnostics
      };
    }
  } catch (err: any) {
    console.warn("AI parse failed, fallback sang regex parser cục bộ:", err);
  }

  // 4. Fallback sang bộ phân tích biểu thức chính quy (Regex) nếu AI gặp sự cố
  const regexResult = parseTextToQuestionsWithDiagnostics(extractedRawText);
  if (regexResult.questions.length > 0) {
    return regexResult;
  }

  return {
    questions: [],
    diagnostics: {
      status: 'invalid',
      formatType: 'plaintext',
      totalDetected: regexResult.diagnostics.totalDetected,
      validCount: 0,
      invalidCount: regexResult.diagnostics.invalidCount || 1,
      message: 'Không thể trích xuất câu hỏi hợp lệ từ file.',
      issues: regexResult.diagnostics.issues?.length ? regexResult.diagnostics.issues : [
        {
          item: `Tài liệu: ${file.name}`,
          reason: 'Cấu trúc câu hỏi không khớp định dạng nhận diện (Thiếu tiền tố Câu 1:, các đáp án A/B/C/D, hoặc dòng Đáp án:)',
          suggestion: 'Vui lòng kiểm tra định dạng theo mẫu: Câu 1: ... A. ... B. ... C. ... D. ... Đáp án: A',
          severity: 'error'
        }
      ]
    }
  };
}

/**
 * Kiểm tra và phân tích chuỗi JSON với chẩn đoán lỗi logic chi tiết
 */
export function validateAndParseJsonString(rawText: string, sourceLabel: string = 'JSON'): ParseResult {
  const issues: ParsingIssue[] = [];
  const trimmed = rawText.trim();

  let parsedData: any = null;
  try {
    parsedData = JSON.parse(trimmed);
  } catch (jsonErr: any) {
    // Trích xuất vị trí lỗi cú pháp JSON nếu có
    const errMsg = jsonErr.message || 'Lỗi cú pháp JSON không hợp lệ';
    let lineHint = '';
    const posMatch = errMsg.match(/position\s+(\d+)/i);
    if (posMatch) {
      const pos = parseInt(posMatch[1], 10);
      const linesUpToPos = trimmed.slice(0, pos).split('\n');
      lineHint = ` (Khoảng dòng ${linesUpToPos.length}, cột ${linesUpToPos[linesUpToPos.length - 1].length + 1})`;
    }

    issues.push({
      item: `Cú pháp JSON${lineHint}`,
      reason: `Dữ liệu không đúng chuẩn JSON: ${errMsg}`,
      suggestion: 'Đảm bảo các chuỗi ký tự được bọc trong dấu ngoặc kép ("..."), các phần tử phân tách bằng dấu phẩy (,) và đóng mở ngoặc [] {} đầy đủ.',
      severity: 'error'
    });

    return {
      questions: [],
      diagnostics: {
        status: 'invalid',
        formatType: 'json',
        totalDetected: 0,
        validCount: 0,
        invalidCount: 1,
        message: `Lỗi cấu trúc JSON: ${errMsg}${lineHint}`,
        issues
      }
    };
  }

  // Đảm bảo dữ liệu là mảng hoặc có thuộc tính questions
  let rawList: any[] = [];
  if (Array.isArray(parsedData)) {
    rawList = parsedData;
  } else if (parsedData && typeof parsedData === 'object') {
    if (Array.isArray(parsedData.questions)) {
      rawList = parsedData.questions;
    } else {
      // Thử xem đối tượng có phải là 1 câu hỏi đơn lẻ không
      if (parsedData.content || parsedData.question) {
        rawList = [parsedData];
      } else {
        issues.push({
          item: 'Cấu trúc mảng JSON',
          reason: 'JSON phải là một danh sách các câu hỏi [ { ... }, { ... } ] hoặc đối tượng có khóa "questions": [ ... ].',
          suggestion: 'Bọc các đối tượng câu hỏi trong mảng ngoặc vuông [ ... ] theo mẫu JSON chuẩn.',
          severity: 'error'
        });

        return {
          questions: [],
          diagnostics: {
            status: 'invalid',
            formatType: 'json',
            totalDetected: 0,
            validCount: 0,
            invalidCount: 1,
            message: 'Cấu trúc JSON không phải là danh sách câu hỏi.',
            issues
          }
        };
      }
    }
  }

  if (rawList.length === 0) {
    issues.push({
      item: 'Danh sách câu hỏi',
      reason: 'Mảng JSON rỗng (không có phần tử nào).',
      suggestion: 'Thêm các câu hỏi vào mảng JSON theo mẫu.',
      severity: 'error'
    });
    return {
      questions: [],
      diagnostics: {
        status: 'invalid',
        formatType: 'json',
        totalDetected: 0,
        validCount: 0,
        invalidCount: 0,
        message: 'Mảng câu hỏi JSON rỗng.',
        issues
      }
    };
  }

  const validQuestions: Question[] = [];

  rawList.forEach((item, idx) => {
    const itemLabel = `Câu hỏi JSON #${idx + 1}`;
    if (!item || typeof item !== 'object') {
      issues.push({
        item: itemLabel,
        reason: 'Phần tử không phải là một đối tượng (Object { ... }).',
        suggestion: 'Mỗi câu hỏi phải là một object có các trường type, content, correct.',
        severity: 'error'
      });
      return;
    }

    const content = (item.content || item.question || '').trim();
    if (!content) {
      issues.push({
        item: itemLabel,
        reason: 'Thiếu trường "content" (nội dung câu hỏi) hoặc nội dung rỗng.',
        suggestion: 'Thêm trường "content": "Nội dung câu hỏi của bạn tại đây".',
        severity: 'error'
      });
      return;
    }

    const type = item.type === 'tf' ? 'tf' : item.type === 'text' ? 'text' : 'mcq';

    if (type === 'mcq') {
      if (!Array.isArray(item.options) || item.options.length < 2) {
        issues.push({
          item: `${itemLabel} ("${content.slice(0, 30)}...")`,
          reason: 'Câu trắc nghiệm (mcq) thiếu mảng "options" (cần 4 phương án A, B, C, D).',
          suggestion: 'Thêm trường "options": ["Phương án A", "Phương án B", "Phương án C", "Phương án D"].',
          severity: 'error'
        });
        return;
      }

      if (item.correct === undefined || item.correct === null) {
        issues.push({
          item: `${itemLabel} ("${content.slice(0, 30)}...")`,
          reason: 'Thiếu trường "correct" chỉ định đáp án đúng.',
          suggestion: 'Thêm "correct": 0 (chỉ số đáp án đúng từ 0 đến 3 tương ứng A, B, C, D).',
          severity: 'warning'
        });
      }
    } else if (type === 'tf') {
      if (item.correct === undefined || item.correct === null) {
        issues.push({
          item: `${itemLabel} ("${content.slice(0, 30)}...")`,
          reason: 'Câu Đúng/Sai (tf) thiếu trường "correct" (true hoặc false).',
          suggestion: 'Thêm "correct": true hoặc "correct": false.',
          severity: 'warning'
        });
      }
    } else if (type === 'text') {
      if (!item.correct && item.correct !== '') {
        issues.push({
          item: `${itemLabel} ("${content.slice(0, 30)}...")`,
          reason: 'Câu trả lời ngắn (text) thiếu trường "correct" (đáp án mẫu).',
          suggestion: 'Thêm "correct": "Đáp án chuẩn".',
          severity: 'warning'
        });
      }
    }

    validQuestions.push(sanitizeParsedQuestion(item, idx));
  });

  const validCount = validQuestions.length;
  const invalidCount = issues.filter(i => i.severity === 'error').length;
  const status = validCount === 0 ? 'invalid' : invalidCount > 0 ? 'partial' : 'success';

  return {
    questions: validQuestions,
    diagnostics: {
      status,
      formatType: 'json',
      totalDetected: rawList.length,
      validCount,
      invalidCount,
      message: status === 'success' 
        ? `Đã nhận diện thành công toàn bộ ${validCount} câu hỏi từ cấu trúc JSON chuẩn.`
        : status === 'partial'
        ? `Đã nhận diện ${validCount}/${rawList.length} câu hỏi JSON (${invalidCount} câu bị lỗi cần chỉnh sửa).`
        : 'Không tìm thấy câu hỏi JSON hợp lệ nào.',
      issues
    }
  };
}

function sanitizeParsedQuestion(q: any, idx: number): Question {
  let finalCorrect: number | boolean | string = 0;
  const qType = q.type === 'tf' ? 'tf' : q.type === 'text' ? 'text' : 'mcq';

  if (qType === 'mcq') {
    if (typeof q.correct === 'number') {
      finalCorrect = Math.min(3, Math.max(0, q.correct));
    } else if (typeof q.correct === 'string') {
      const parsedNum = parseInt(q.correct, 10);
      if (!isNaN(parsedNum)) {
        finalCorrect = Math.min(3, Math.max(0, parsedNum));
      } else {
        const letter = q.correct.trim().toUpperCase();
        if (letter === 'A' || letter === '0') finalCorrect = 0;
        else if (letter === 'B' || letter === '1') finalCorrect = 1;
        else if (letter === 'C' || letter === '2') finalCorrect = 2;
        else if (letter === 'D' || letter === '3') finalCorrect = 3;
        else finalCorrect = 0;
      }
    }
  } else if (qType === 'tf') {
    const s = String(q.correct).toLowerCase().trim();
    finalCorrect = s === 'true' || s === 'đúng' || s === 'đ' || s === '1';
  } else {
    finalCorrect = String(q.correct || '').trim();
  }

  let options: string[] | undefined = undefined;
  if (qType === 'mcq') {
    if (Array.isArray(q.options) && q.options.length >= 2) {
      options = q.options.slice(0, 4).map((o: any) => String(o).trim());
      while (options.length < 4) {
        options.push(`Phương án ${String.fromCharCode(65 + options.length)}`);
      }
    } else {
      options = ["Đáp án A", "Đáp án B", "Đáp án C", "Đáp án D"];
    }
  }

  return {
    id: q.id || `file_${Date.now()}_${idx}`,
    type: qType,
    content: (q.content || q.question || `Câu hỏi ${idx + 1}`).trim(),
    options,
    correct: finalCorrect,
    explanation: (q.explanation || '').trim(),
    imageUrl: q.imageUrl || undefined
  };
}

export function parseTextToQuestionsWithDiagnostics(rawText: string): ParseResult {
  const questions: Question[] = [];
  const issues: ParsingIssue[] = [];

  if (!rawText || !rawText.trim()) {
    return {
      questions: [],
      diagnostics: {
        status: 'invalid',
        formatType: 'plaintext',
        totalDetected: 0,
        validCount: 0,
        invalidCount: 0,
        message: 'Văn bản đang trống. Vui lòng nhập nội dung hoặc dán mẫu câu hỏi.',
        issues: [{ item: 'Ô văn bản', reason: 'Chưa có nội dung nhập liệu', suggestion: 'Dán nội dung câu hỏi hoặc nhấn nút "Chèn Mẫu Thử Nghiệm"', severity: 'error' }]
      }
    };
  }

  const trimmed = rawText.trim();

  // Kiểm tra nếu nội dung bắt đầu bằng [ hoặc { (người dùng dán JSON)
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return validateAndParseJsonString(trimmed, 'Văn bản');
  }

  // Tách các khối câu hỏi dựa trên từ khóa Câu X:, Question X:, Bài X:, hoặc 2 dòng trống
  const blocks = rawText.split(/(?=\b(?:Câu|Question|Bài)\s*\d+[:.]|\n\s*\n)/i).map(b => b.trim()).filter(Boolean);

  let detectedCount = 0;

  blocks.forEach((block, idx) => {
    const lines = block.split('\n').map(l => l.trim()).filter(Boolean);
    if (lines.length === 0) return;

    detectedCount++;
    const firstLine = lines[0];
    const blockMatch = firstLine.match(/^(?:Câu|Question|Bài)\s*(\d+)[:.]?/i);
    const blockNum = blockMatch ? blockMatch[1] : `${idx + 1}`;
    const blockLabel = `Câu ${blockNum}`;

    let content = '';
    const options: string[] = [];
    let correctIndex: number | null = null;
    let isTrueFalse = false;
    let isShortText = false;
    let tfValue: boolean | null = null;
    let textAnswer = '';
    let explanation = '';

    // Check if the question explicitly states type
    if (/\[Đúng\s*\/?\s*Sai\]|\(Đúng\s*\/?\s*Sai\)/i.test(block)) {
      isTrueFalse = true;
    } else if (/\[Tự\s*luận\]|\(Tự\s*luận\)|\[Trả\s*lời\s*ngắn\]/i.test(block)) {
      isShortText = true;
    }

    lines.forEach((line) => {
      // Nhận diện lựa chọn A., B., C., D. hoặc A), B), C), D) hoặc A: hoặc *A.
      const optMatch = line.match(/^[*]?\s*([A-D])[.:\)]\s*(.*)$/i);
      const answerMatch = line.match(/^(?:Đáp án|Đáp án đúng|Correct|Key|Ans|Trả lời|Gợi ý|Đ\/A)[:.]?\s*(.*)$/i);
      const explainMatch = line.match(/^(?:Giải thích|Lời giải|Hướng dẫn|Explanation)[:.]?\s*(.*)$/i);

      if (optMatch) {
        const optLetter = optMatch[1].toUpperCase();
        const optionText = optMatch[2].trim();
        options.push(optionText || `Lựa chọn ${optLetter}`);
        if (line.startsWith('*') || line.includes('(đúng)') || line.includes('(correct)')) {
          correctIndex = options.length - 1;
        }
      } else if (answerMatch) {
        const ansRaw = answerMatch[1].trim();
        if (/^[A-D]$/i.test(ansRaw)) {
          const letter = ansRaw.toUpperCase();
          correctIndex = letter.charCodeAt(0) - 65;
        } else if (/^(Đúng|True|Đ|1)$/i.test(ansRaw)) {
          isTrueFalse = true;
          tfValue = true;
        } else if (/^(Sai|False|S|0)$/i.test(ansRaw)) {
          isTrueFalse = true;
          tfValue = false;
        } else {
          isShortText = true;
          textAnswer = ansRaw;
        }
      } else if (explainMatch) {
        explanation = explainMatch[1].trim();
      } else if (!content) {
        content = line.replace(/^(?:Câu|Question|Bài)\s*\d+[:.]?\s*/i, '').trim();
      } else {
        if (options.length === 0 && !answerMatch && !explainMatch) {
          content += ' ' + line;
        }
      }
    });

    if (!content) {
      issues.push({
        item: blockLabel,
        reason: 'Không tìm thấy nội dung câu hỏi (dòng đầu tiên bị rỗng hoặc không có chữ).',
        suggestion: `Bổ sung nội dung câu hỏi sau tiền tố "${blockLabel}: ...".`,
        severity: 'error'
      });
      return;
    }

    // Determine type & validate logic
    if (isTrueFalse || tfValue !== null) {
      if (tfValue === null) {
        issues.push({
          item: `${blockLabel} ("${content.slice(0, 25)}...")`,
          reason: 'Câu hỏi Đúng/Sai thiếu chỉ định đáp án (Đúng hay Sai).',
          suggestion: 'Thêm dòng "Đáp án: Đúng" hoặc "Đáp án: Sai".',
          severity: 'warning'
        });
      }
      questions.push({
        id: `imp_${Date.now()}_${idx}`,
        type: 'tf',
        content,
        correct: tfValue ?? true,
        explanation
      });
    } else if (options.length >= 2) {
      const paddedOptions = [...options];
      while (paddedOptions.length < 4) {
        paddedOptions.push(`Phương án ${String.fromCharCode(65 + paddedOptions.length)}`);
      }
      if (options.length < 4) {
        issues.push({
          item: `${blockLabel} ("${content.slice(0, 25)}...")`,
          reason: `Chỉ phát hiện ${options.length}/4 phương án lựa chọn (A, B, C, D).`,
          suggestion: 'Bổ sung đầy đủ cả 4 phương án: A. ..., B. ..., C. ..., D. ...',
          severity: 'warning'
        });
      }
      if (correctIndex === null) {
        issues.push({
          item: `${blockLabel} ("${content.slice(0, 25)}...")`,
          reason: 'Không tìm thấy dòng "Đáp án:" hoặc dấu sao (*) trước đáp án đúng (Hệ thống tạm mặc định là A).',
          suggestion: 'Thêm dòng "Đáp án: A" (hoặc B, C, D), hoặc đánh dấu sao "*A. Nội dung..."',
          severity: 'warning'
        });
      }
      questions.push({
        id: `imp_${Date.now()}_${idx}`,
        type: 'mcq',
        content,
        options: paddedOptions.slice(0, 4),
        correct: correctIndex !== null ? Math.min(3, Math.max(0, correctIndex)) : 0,
        explanation
      });
    } else if (isShortText || textAnswer) {
      if (!textAnswer) {
        issues.push({
          item: `${blockLabel} ("${content.slice(0, 25)}...")`,
          reason: 'Câu hỏi tự luận/trả lời ngắn chưa có nội dung đáp án mẫu.',
          suggestion: 'Thêm dòng "Đáp án: [Từ khóa hoặc câu trả lời mẫu]".',
          severity: 'warning'
        });
      }
      questions.push({
        id: `imp_${Date.now()}_${idx}`,
        type: 'text',
        content,
        correct: textAnswer || 'Đáp án mẫu',
        explanation
      });
    } else {
      // Malformed question: has content but neither options nor answer
      issues.push({
        item: `${blockLabel} ("${content.slice(0, 25)}...")`,
        reason: 'Không phát hiện các phương án lựa chọn A, B, C, D hoặc dòng "Đáp án:".',
        suggestion: 'Nếu là trắc nghiệm, hãy thêm các dòng A. B. C. D. Nếu là câu hỏi ngắn, thêm dòng "Đáp án: ..."',
        severity: 'error'
      });
    }
  });

  const validCount = questions.length;
  const invalidCount = issues.filter(i => i.severity === 'error').length;
  let status: 'success' | 'partial' | 'invalid' = 'success';
  let message = '';

  if (validCount === 0) {
    status = 'invalid';
    message = 'Không tìm thấy câu hỏi trắc nghiệm hoặc tự luận hợp lệ nào trong văn bản.';
    if (issues.length === 0) {
      issues.push({
        item: 'Toàn bộ nội dung văn bản',
        reason: 'Văn bản không khớp cấu trúc nhận diện câu hỏi (Thiếu "Câu 1:", "A. ...", "B. ...", "Đáp án: ...").',
        suggestion: 'Hãy định dạng câu hỏi theo mẫu: Câu 1: [Nội dung] A. [Opt1] B. [Opt2] C. [Opt3] D. [Opt4] Đáp án: A (Xem các ví dụ mẫu ở trên).',
        severity: 'error'
      });
    }
  } else if (invalidCount > 0 || issues.length > 0) {
    status = invalidCount > 0 ? 'partial' : 'success';
    message = `Đã nhận diện thành công ${validCount} câu hỏi (${issues.length} lưu ý / cảnh báo logic).`;
  } else {
    status = 'success';
    message = `Đã nhận diện hoàn hảo ${validCount} câu hỏi chuẩn format!`;
  }

  return {
    questions,
    diagnostics: {
      status,
      formatType: 'plaintext',
      totalDetected: detectedCount,
      validCount,
      invalidCount,
      message,
      issues
    }
  };
}

export function parseCSVToQuestions(csvText: string): ParseResult {
  const issues: ParsingIssue[] = [];
  const questions: Question[] = [];

  const lines = parseCSVRows(csvText);
  if (lines.length < 2) {
    issues.push({ item: 'CSV File', reason: 'File CSV không có đủ dữ liệu (cần ít nhất dòng tiêu đề và 1 dòng dữ liệu)', severity: 'error' });
    return {
      questions: [],
      diagnostics: { status: 'invalid', formatType: 'plaintext', totalDetected: 0, validCount: 0, invalidCount: 1, message: 'File rỗng hoặc không đúng định dạng', issues }
    };
  }

  // Tiêu đề chuẩn cần thiết: Question, OptionA, OptionB, OptionC, OptionD, CorrectAnswer, Explanation (hoặc tiếng Việt tương đương)
  const header = lines[0].map(h => h.trim().toLowerCase());
  const contentIdx = header.findIndex(h => h.includes('nội dung') || h.includes('content') || h.includes('câu hỏi') || h.includes('question'));
  const typeIdx = header.findIndex(h => h.includes('loại') || h.includes('type'));
  const correctIdx = header.findIndex(h => h.includes('đáp án đúng') || h.includes('correct'));
  const explanationIdx = header.findIndex(h => h.includes('giải thích') || h.includes('explanation'));
  const optAIdx = header.findIndex(h => h === 'lựa chọn a' || h === 'option a' || h === 'optiona');
  const optBIdx = header.findIndex(h => h === 'lựa chọn b' || h === 'option b' || h === 'optionb');
  const optCIdx = header.findIndex(h => h === 'lựa chọn c' || h === 'option c' || h === 'optionc');
  const optDIdx = header.findIndex(h => h === 'lựa chọn d' || h === 'option d' || h === 'optiond');

  if (contentIdx === -1 || correctIdx === -1) {
    issues.push({
      item: 'CSV Header',
      reason: 'Thiếu các cột bắt buộc: "Question" hoặc "CorrectAnswer".',
      suggestion: 'Tải và kiểm tra file mẫu CSV.',
      severity: 'error'
    });
    return {
      questions: [],
      diagnostics: { status: 'invalid', formatType: 'plaintext', totalDetected: 0, validCount: 0, invalidCount: 1, message: 'File CSV thiếu cột bắt buộc', issues }
    };
  }

  for (let i = 1; i < lines.length; i++) {
    const row = lines[i];
    if (row.every(c => !c.trim())) continue; // Bỏ qua dòng trống

    const content = row[contentIdx]?.trim();
    if (!content) {
      issues.push({ item: `Dòng ${i + 1}`, reason: 'Cột Nội dung bị trống', severity: 'warning' });
      continue;
    }

    const typeRaw = typeIdx !== -1 ? row[typeIdx]?.trim().toLowerCase() : 'mcq';
    const type = (typeRaw === 'text' || typeRaw === 'trả lời ngắn') ? 'text' : (typeRaw === 'tf' || typeRaw === 'đúng/sai') ? 'tf' : 'mcq';
    
    const correctRaw = row[correctIdx]?.trim();
    const explanation = explanationIdx !== -1 ? row[explanationIdx]?.trim() || '' : '';

    if (type === 'mcq') {
      const optA = optAIdx !== -1 ? row[optAIdx]?.trim() || '' : '';
      const optB = optBIdx !== -1 ? row[optBIdx]?.trim() || '' : '';
      const optC = optCIdx !== -1 ? row[optCIdx]?.trim() || '' : '';
      const optD = optDIdx !== -1 ? row[optDIdx]?.trim() || '' : '';
      
      const options = [optA, optB, optC, optD].filter(Boolean);
      if (options.length < 2) {
        issues.push({ item: `Dòng ${i + 1}`, reason: 'Câu hỏi trắc nghiệm cần ít nhất 2 lựa chọn', severity: 'warning' });
        continue;
      }
      
      // Pad to 4
      while (options.length < 4) options.push('');

      let correctIndex = 0;
      const cUpper = correctRaw.toUpperCase();
      if (cUpper === 'A' || cUpper === optA.toUpperCase()) correctIndex = 0;
      else if (cUpper === 'B' || cUpper === optB.toUpperCase()) correctIndex = 1;
      else if (cUpper === 'C' || cUpper === optC.toUpperCase()) correctIndex = 2;
      else if (cUpper === 'D' || cUpper === optD.toUpperCase()) correctIndex = 3;
      else if (parseInt(correctRaw) >= 0 && parseInt(correctRaw) <= 3) correctIndex = parseInt(correctRaw);
      
      questions.push({
        id: `csv_${Date.now()}_${i}`,
        type: 'mcq',
        content,
        options,
        correct: correctIndex,
        explanation
      });
    } else if (type === 'tf') {
      const isTrue = correctRaw.toLowerCase() === 'true' || correctRaw.toLowerCase() === 'đúng' || correctRaw === '1';
      questions.push({
        id: `csv_${Date.now()}_${i}`,
        type: 'tf',
        content,
        correct: isTrue,
        explanation
      });
    } else {
      questions.push({
        id: `csv_${Date.now()}_${i}`,
        type: 'text',
        content,
        correct: correctRaw || 'Chưa có đáp án',
        explanation
      });
    }
  }

  return {
    questions,
    diagnostics: {
      status: issues.length > 0 ? 'partial' : 'success',
      formatType: 'plaintext',
      totalDetected: lines.length - 1,
      validCount: questions.length,
      invalidCount: issues.length,
      message: `Đã xử lý ${questions.length} câu hỏi từ CSV`,
      issues
    }
  };
}

function parseCSVRows(text: string): string[][] {
  const result: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let inQuotes = false;
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < text.length && text[i + 1] === '"') {
          cell += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        cell += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        row.push(cell);
        cell = "";
      } else if (char === '\n' || char === '\r') {
        row.push(cell);
        result.push(row);
        row = [];
        cell = "";
        if (char === '\r' && i + 1 < text.length && text[i + 1] === '\n') {
          i++;
        }
      } else {
        cell += char;
      }
    }
  }
  if (cell !== "" || row.length > 0) {
    row.push(cell);
    if (cell !== "" || result[result.length-1]?.length !== row.length) {
      result.push(row);
    }
  }
  return result;
}

export function parseTextToQuestions(rawText: string): Question[] {
  return parseTextToQuestionsWithDiagnostics(rawText).questions;
}

