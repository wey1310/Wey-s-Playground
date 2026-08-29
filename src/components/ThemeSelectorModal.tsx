import React from 'react';
import { X, Check, Sparkles } from 'lucide-react';
import { APP_THEMES, ThemeId, ThemeDefinition, applyThemeToDom } from '../theme/themeConfig';
import { soundFx } from '../utils/audio';

interface ThemeSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentTheme: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
}

export const ThemeSelectorModal: React.FC<ThemeSelectorModalProps> = ({
  isOpen,
  onClose,
  currentTheme,
  onSelectTheme,
}) => {
  if (!isOpen) return null;

  const handlePickTheme = (theme: ThemeDefinition) => {
    soundFx.cardFlip();
    applyThemeToDom(theme.id);
    onSelectTheme(theme.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div 
        className="w-full max-w-2xl bg-w-bg-card border-2 border-w-border rounded-[28px] shadow-2xl p-6 sm:p-7 overflow-hidden flex flex-col max-h-[90vh] transition-all"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-w-border">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-w-accent-light text-w-primary flex items-center justify-center text-2xl border border-w-accent-border shadow-xs">
              🎨
            </div>
            <div>
              <h2 className="text-xl font-[900] text-w-text-main flex items-center gap-2">
                Hệ Thống Giao Diện & Màu Sắc
              </h2>
              <p className="text-xs font-[600] text-w-text-muted mt-0.5">
                Chuyển đổi toàn diện palette màu, nút bấm, bảng biểu và khung hình
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-w-text-muted hover:text-w-text-main hover:bg-w-bg-alt transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Theme List Grid */}
        <div className="overflow-y-auto py-5 space-y-3.5 pr-1">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {APP_THEMES.map((theme) => {
              const isSelected = currentTheme === theme.id;
              const { colors } = theme;

              return (
                <div
                  key={theme.id}
                  onClick={() => handlePickTheme(theme)}
                  className={`p-4 rounded-[22px] border-2 transition-all cursor-pointer relative flex flex-col justify-between group ${
                    isSelected
                      ? 'border-w-primary shadow-md ring-2 ring-w-primary/30 scale-[1.01]'
                      : 'border-w-border hover:border-w-border-hover hover:shadow-sm'
                  }`}
                  style={{
                    backgroundColor: colors.bgCard,
                  }}
                >
                  {/* Top Bar of Theme Card */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5">
                      <span className="text-2xl">{theme.icon}</span>
                      <div>
                        <div 
                          className="font-[900] text-sm flex items-center gap-1.5"
                          style={{ color: colors.textMain }}
                        >
                          {theme.name}
                          {theme.isDark && (
                            <span className="text-[10px] font-[800] px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-200 border border-indigo-500/30">
                              Tối
                            </span>
                          )}
                        </div>
                        <p 
                          className="text-[11px] font-[600] mt-0.5 line-clamp-1"
                          style={{ color: colors.textMuted }}
                        >
                          {theme.desc}
                        </p>
                      </div>
                    </div>

                    {isSelected && (
                      <div 
                        className="w-6 h-6 rounded-full flex items-center justify-center text-white shrink-0 shadow-xs"
                        style={{ backgroundColor: colors.primary }}
                      >
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>

                  {/* Visual Palette Preview Swatches */}
                  <div 
                    className="p-2.5 rounded-xl border flex flex-col gap-2"
                    style={{ 
                      backgroundColor: colors.bgMain,
                      borderColor: colors.border,
                    }}
                  >
                    <div className="text-[10px] font-[800] uppercase tracking-wider flex items-center justify-between" style={{ color: colors.textMuted }}>
                      <span>Bảng màu mẫu</span>
                      <span 
                        className="px-1.5 py-0.2 rounded text-[9px] font-[700]"
                        style={{ backgroundColor: colors.bgTag, color: colors.textMain }}
                      >
                        Mẫu thẻ
                      </span>
                    </div>

                    {/* Color Swatch Bars */}
                    <div className="grid grid-cols-6 gap-1.5 h-6 rounded-lg overflow-hidden p-0.5 border" style={{ borderColor: colors.border }}>
                      <div className="rounded-md" title="Nền chính" style={{ backgroundColor: colors.bgMain }} />
                      <div className="rounded-md" title="Mặt phẳng thẻ" style={{ backgroundColor: colors.bgCard }} />
                      <div className="rounded-md" title="Màu chủ đạo" style={{ backgroundColor: colors.primary }} />
                      <div className="rounded-md" title="Nhấn phụ" style={{ backgroundColor: colors.accentMuted }} />
                      <div className="rounded-md" title="Viền" style={{ backgroundColor: colors.border }} />
                      <div className="rounded-md" title="Văn bản" style={{ backgroundColor: colors.textMain }} />
                    </div>

                    {/* Button preview */}
                    <div className="flex items-center gap-2 pt-1">
                      <div 
                        className="flex-1 py-1 px-2.5 rounded-lg text-center font-[800] text-[11px] shadow-2xs"
                        style={{ backgroundColor: colors.primary, color: colors.primaryText }}
                      >
                        Nút Chính
                      </div>
                      <div 
                        className="py-1 px-2 rounded-lg text-center font-[700] text-[11px] border"
                        style={{ 
                          backgroundColor: colors.bgCard, 
                          color: colors.primaryDark,
                          borderColor: colors.border,
                        }}
                      >
                        Nút Phụ
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-w-border flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs text-w-text-muted font-[600]">
            <Sparkles className="w-4 h-4 text-w-primary" />
            <span>Theme được lưu tự động cho mọi lần truy cập tiếp theo.</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2.5 wey-btn-primary text-xs sm:text-sm font-[800] cursor-pointer"
          >
            Hoàn Tất
          </button>
        </div>
      </div>
    </div>
  );
};
