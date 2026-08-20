import * as XLSX from 'xlsx';

export interface StudentImportResult {
  success: boolean;
  students: string[];
  totalCount: number;
  fileName: string;
  message: string;
}

// Clean and normalize student name
function cleanStudentName(rawName: any): string {
  if (rawName == null) return '';
  let str = String(rawName).trim();
  if (!str) return '';

  // Remove leading numbers, bullet points, dots, dashes (e.g. "1. Nguyễn Văn An" -> "Nguyễn Văn An", "01 - Lê Bình" -> "Lê Bình")
  str = str.replace(/^(\d+[\.\)\/\-\:\s]+|[•\*\-\#]\s*)/, '').trim();

  // Normalize multi-whitespace
  str = str.replace(/\s+/g, ' ');

  return str;
}

// Check if cell looks like a header or non-name metadata
function isHeaderOrIgnoredValue(val: string): boolean {
  const lower = val.toLowerCase().trim();
  const ignoredKeywords = [
    'stt', 'sô tt', 'số tt', 'số thứ tự', 'no', 'no.', 'id', 'mã hs', 'mã số', 'mã học sinh',
    'họ và tên', 'họ tên', 'họ & tên', 'họ tên học sinh', 'tên học sinh', 'họ lót', 'họ đệm', 'tên',
    'full name', 'fullname', 'student name', 'name', 'student',
    'ngày sinh', 'ngaysinh', 'dob', 'birth', 'giới tính', 'gioitinh', 'gender', 'nam/nữ',
    'lớp', 'lop', 'class', 'trường', 'địa chỉ', 'điện thoại', 'sđt', 'phone', 'ghi chú', 'note',
    'điểm', 'toán', 'văn', 'anh', 'khtn', 'tổng điểm', 'xếp loại', 'học lực', 'hạnh kiểm'
  ];

  return ignoredKeywords.includes(lower);
}

export async function parseStudentListFile(file: File): Promise<StudentImportResult> {
  const fileName = file.name;
  const extension = fileName.split('.').pop()?.toLowerCase() || '';

  try {
    const arrayBuffer = await file.arrayBuffer();
    const workbook = XLSX.read(arrayBuffer, { type: 'array' });

    if (!workbook.SheetNames || workbook.SheetNames.length === 0) {
      return {
        success: false,
        students: [],
        totalCount: 0,
        fileName,
        message: 'File không có trang tính (sheet) nào hợp lệ.'
      };
    }

    // Try first sheet or sheet with name containing "danh sách", "lớp", "học sinh", "students"
    let targetSheetName = workbook.SheetNames[0];
    for (const name of workbook.SheetNames) {
      const lower = name.toLowerCase();
      if (lower.includes('danh sách') || lower.includes('hoc sinh') || lower.includes('học sinh') || lower.includes('lop') || lower.includes('lớp') || lower.includes('student')) {
        targetSheetName = name;
        break;
      }
    }

    const sheet = workbook.Sheets[targetSheetName];
    if (!sheet) {
      return {
        success: false,
        students: [],
        totalCount: 0,
        fileName,
        message: 'Không đọc được dữ liệu bảng tính.'
      };
    }

    const rows: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (!rows || rows.length === 0) {
      return {
        success: false,
        students: [],
        totalCount: 0,
        fileName,
        message: 'Bảng tính trống, không có dòng dữ liệu nào.'
      };
    }

    // Identify header row and candidate columns
    let fullNameColIdx = -1;
    let hoLotColIdx = -1;
    let tenColIdx = -1;
    let headerRowIdx = -1;

    for (let r = 0; r < Math.min(rows.length, 15); r++) {
      const row = rows[r];
      if (!Array.isArray(row)) continue;

      for (let c = 0; c < row.length; c++) {
        const cell = String(row[c] || '').toLowerCase().trim();
        if (cell === 'họ và tên' || cell === 'họ tên' || cell === 'họ & tên' || cell === 'họ tên học sinh' || cell === 'tên học sinh' || cell === 'full name' || cell === 'student name') {
          fullNameColIdx = c;
          headerRowIdx = r;
        } else if (cell === 'họ lót' || cell === 'họ đệm' || cell === 'họ và tên đệm' || cell === 'họ') {
          hoLotColIdx = c;
          headerRowIdx = r;
        } else if ((cell === 'tên' || cell === 'ten' || cell === 'name') && fullNameColIdx === -1) {
          tenColIdx = c;
          headerRowIdx = r;
        }
      }

      if (fullNameColIdx !== -1 || (hoLotColIdx !== -1 && tenColIdx !== -1)) {
        break;
      }
    }

    const extractedNames: string[] = [];

    const startRow = headerRowIdx !== -1 ? headerRowIdx + 1 : 0;

    for (let r = startRow; r < rows.length; r++) {
      const row = rows[r];
      if (!Array.isArray(row) || row.length === 0) continue;

      let studentName = '';

      if (fullNameColIdx !== -1) {
        studentName = cleanStudentName(row[fullNameColIdx]);
      } else if (hoLotColIdx !== -1 && tenColIdx !== -1) {
        const hoLot = cleanStudentName(row[hoLotColIdx]);
        const ten = cleanStudentName(row[tenColIdx]);
        if (hoLot && ten) {
          studentName = `${hoLot} ${ten}`;
        } else if (ten) {
          studentName = ten;
        } else if (hoLot) {
          studentName = hoLot;
        }
      } else if (tenColIdx !== -1) {
        studentName = cleanStudentName(row[tenColIdx]);
      } else {
        // No header detected -> search columns for text with Vietnamese letters or full names
        // Check columns to find the most suitable text column
        for (let c = 0; c < row.length; c++) {
          const val = cleanStudentName(row[c]);
          if (!val || isHeaderOrIgnoredValue(val)) continue;

          // If val is not a pure number, not a date format, and length >= 2
          if (isNaN(Number(val)) && val.length >= 2 && !val.includes('202') && !val.includes('199')) {
            studentName = val;
            break;
          }
        }
      }

      if (studentName && !isHeaderOrIgnoredValue(studentName) && studentName.length >= 2) {
        // Prevent accidental numeric serial strings
        if (!/^\d+$/.test(studentName)) {
          extractedNames.push(studentName);
        }
      }
    }

    if (extractedNames.length === 0) {
      // Fallback: simple text line splitting
      const rawText = await file.text();
      const lines = rawText.split(/[\r\n]+/).map(l => cleanStudentName(l)).filter(l => l.length >= 2 && !isHeaderOrIgnoredValue(l) && !/^\d+$/.test(l));
      if (lines.length > 0) {
        return {
          success: true,
          students: lines,
          totalCount: lines.length,
          fileName,
          message: `Đã nhập thành công ${lines.length} học sinh từ file "${fileName}".`
        };
      }

      return {
        success: false,
        students: [],
        totalCount: 0,
        fileName,
        message: `Không tìm thấy cột danh sách học sinh trong file "${fileName}". Hãy đảm bảo file có cột "Họ và tên" hoặc "Tên".`
      };
    }

    return {
      success: true,
      students: extractedNames,
      totalCount: extractedNames.length,
      fileName,
      message: `Đã nhập thành công ${extractedNames.length} học sinh từ file "${fileName}".`
    };

  } catch (error: any) {
    console.error('Error parsing student file:', error);
    // Fallback to text lines parser
    try {
      const rawText = await file.text();
      const lines = rawText.split(/[\r\n]+/).map(l => cleanStudentName(l)).filter(l => l.length >= 2 && !isHeaderOrIgnoredValue(l) && !/^\d+$/.test(l));
      if (lines.length > 0) {
        return {
          success: true,
          students: lines,
          totalCount: lines.length,
          fileName,
          message: `Đã nhập thành công ${lines.length} học sinh từ file "${fileName}".`
        };
      }
    } catch {}

    return {
      success: false,
      students: [],
      totalCount: 0,
      fileName,
      message: `Lỗi đọc file: ${error?.message || 'Không thể xử lý định dạng file này.'}`
    };
  }
}
