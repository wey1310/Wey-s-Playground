import React, { useRef, useState } from 'react';
import { FileSpreadsheet, Upload, Check, AlertCircle, Loader2 } from 'lucide-react';
import { parseStudentListFile, StudentImportResult } from '../utils/studentFileParser';
import { soundFx } from '../utils/audio';

interface StudentImportButtonProps {
  onImport: (students: string[], message?: string) => void;
  className?: string;
  buttonText?: string;
  variant?: 'primary' | 'secondary' | 'compact';
  existingCount?: number;
}

export const StudentImportButton: React.FC<StudentImportButtonProps> = ({
  onImport,
  className = '',
  buttonText = 'Tải file Excel/CSV',
  variant = 'secondary',
  existingCount = 0,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    type: 'success' | 'error';
    message: string;
  } | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setIsLoading(true);
    setImportStatus(null);

    try {
      const result: StudentImportResult = await parseStudentListFile(file);
      if (result.success && result.students.length > 0) {
        soundFx.correct();
        setImportStatus({
          type: 'success',
          message: result.message || `Đã nhập ${result.totalCount} học sinh!`
        });
        onImport(result.students, result.message);
      } else {
        soundFx.wrong();
        setImportStatus({
          type: 'error',
          message: result.message || 'Không tìm thấy danh sách học sinh hợp lệ.'
        });
      }
    } catch (err: any) {
      soundFx.wrong();
      setImportStatus({
        type: 'error',
        message: err?.message || 'Có lỗi xảy ra khi đọc file.'
      });
    } finally {
      setIsLoading(false);
      // Reset input value so same file can be re-selected if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      // Auto clear status after 4 seconds
      setTimeout(() => {
        setImportStatus(null);
      }, 4000);
    }
  };

  const getButtonStyles = () => {
    if (variant === 'primary') {
      return "bg-[#4F683C] hover:bg-[#3D522B] text-white border-[#3D522B] shadow-sm";
    }
    if (variant === 'compact') {
      return "px-2.5 py-1 bg-[#E9F0D9] hover:bg-[#D4E4C1] text-[#3D522B] text-xs font-bold rounded-lg border border-[#B9CDA0] shadow-2xs";
    }
    return "bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300 shadow-2xs";
  };

  return (
    <div className="relative inline-flex items-center">
      <input
        ref={fileInputRef}
        type="file"
        accept=".xlsx, .xls, .csv, .tsv, .txt, .ods, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel, text/csv, text/plain"
        onChange={handleFileChange}
        className="hidden"
        id="student-excel-upload-input"
      />

      <button
        type="button"
        disabled={isLoading}
        onClick={() => {
          soundFx.buttonClick();
          fileInputRef.current?.click();
        }}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-extrabold border transition cursor-pointer hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:cursor-not-allowed ${getButtonStyles()} ${className}`}
        title="Nhập danh sách học sinh tự động từ file Excel (.xlsx, .xls) hoặc CSV/TXT"
      >
        {isLoading ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
        ) : (
          <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
        )}
        <span>{isLoading ? 'Đang đọc file...' : buttonText}</span>
      </button>

      {/* Popover / Status badge */}
      {importStatus && (
        <div className={`absolute top-full left-0 mt-1.5 z-50 whitespace-nowrap px-3 py-1.5 rounded-lg text-xs font-bold shadow-lg border animate-fade-in flex items-center gap-1.5 ${
          importStatus.type === 'success'
            ? 'bg-emerald-600 text-white border-emerald-700'
            : 'bg-rose-600 text-white border-rose-700'
        }`}>
          {importStatus.type === 'success' ? (
            <Check className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5" />
          )}
          <span>{importStatus.message}</span>
        </div>
      )}
    </div>
  );
};
