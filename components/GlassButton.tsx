
import React from 'react';
import { motion } from 'framer-motion';

interface GlassButtonProps {
  title: string;
  iconType: string;
  progress?: number;
  recentScores?: number[];
  questionCount?: number;
  onClick: () => void;
  theme?: 'dark' | 'light';
}

const GlassButton: React.FC<GlassButtonProps> = ({ title, iconType, progress = 0, recentScores = [], questionCount, onClick, theme = 'dark' }) => {
  const isDark = theme === 'dark';

  const renderIcon = () => {
    const iconWrapperClass = "relative w-10 h-10 mb-2 transition-transform duration-500 group-hover:-translate-y-1 group-hover:scale-105";
    const iconColor = isDark ? "text-slate-200" : "text-slate-600";
    const glowColor = isDark ? "bg-indigo-500/20" : "bg-slate-400/10";
    
    switch (iconType) {
      case 'calc':
        return (
          <div className={iconWrapperClass}>
             <div className={`absolute inset-0 ${glowColor} rounded-full blur-xl group-hover:opacity-100 transition-opacity`}></div>
              <svg viewBox="0 0 24 24" className={`w-full h-full ${iconColor} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`} fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="10" />
                <circle cx="12" cy="12" r="4.5" />
                <path d="M11 9.17A3 3 0 1 0 13 9.17L13 8h-2z" />
                {[0, 60, 120, 180, 240, 300].map(angle => (
                  <path key={angle} d="M12 7.5 C16 7.5, 21.5 10, 20.66 17" transform={`rotate(${angle} 12 12)`} />
                ))}
             </svg>
          </div>
        );
      case 'pump':
        return (
          <div className={iconWrapperClass}>
            <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/10' : 'bg-slate-300/10'} rounded-full blur-lg`}></div>
            <svg viewBox="0 0 24 24" className={`w-full h-full ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="1.5">
              {/* Строгая таблица с данными (Data Table / Startup Map) */}
              {/* Внешняя рамка без скруглений */}
              <rect x="3" y="4" width="18" height="16" strokeLinejoin="miter" />
              
              {/* Заголовок (Header row) */}
              <line x1="3" y1="8" x2="21" y2="8" strokeLinecap="square" />
              
              {/* Вертикальные разделители */}
              <line x1="9" y1="4" x2="9" y2="20" strokeLinecap="square" />
              <line x1="15" y1="4" x2="15" y2="20" strokeLinecap="square" />
              
              {/* Горизонтальные разделители ячеек */}
              <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="square" opacity="0.7" />
              <line x1="3" y1="16" x2="21" y2="16" strokeLinecap="square" opacity="0.7" />
              
              {/* Схематичные индикаторы данных в ячейках */}
              {/* Первая колонка */}
              <path d="M5 6h2" strokeWidth="1" />
              <circle cx="6" cy="10" r="0.5" fill="currentColor" stroke="none" />
              <path d="M5 14h3" strokeWidth="1" opacity="0.5" />
              <path d="M5 18h2" strokeWidth="1" opacity="0.5" />
              
              {/* Вторая колонка */}
              <path d="M11 6h2.5" strokeWidth="1" />
              <path d="M10.5 10l1.5 1.5 2-2.5" strokeWidth="1" />
              <path d="M11 14h2" strokeWidth="1" opacity="0.5" />
              <circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="none" />
              
              {/* Третья колонка */}
              <path d="M17 6h2" strokeWidth="1" />
              <path d="M16.5 10.5h3" strokeWidth="1" opacity="0.5" />
              <path d="M17.5 14l1.5-1.5" strokeWidth="1" opacity="0.5" />
              <path d="M16.5 18h3" strokeWidth="1" opacity="0.5" />
            </svg>
          </div>
        );
      case 'search':
        return (
          <div className={iconWrapperClass}>
            <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/10' : 'bg-slate-400/10'} rounded-full blur-lg`}></div>
            <svg viewBox="0 0 24 24" className={`w-full h-full ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="1.5">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
          </div>
        );
      case 'corrosion':
        return (
          <div className={iconWrapperClass}>
            <div className={`absolute inset-0 ${isDark ? 'bg-indigo-400/20' : 'bg-slate-400/10'} rounded-full blur-lg`}></div>
            <svg viewBox="0 0 24 24" className={`w-full h-full ${isDark ? 'text-slate-100' : 'text-slate-700'} drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]`} fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="9" x2="12" y2="13" strokeLinecap="round" strokeLinejoin="round" />
              <line x1="12" y1="17" x2="12.01" y2="17" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        );
      case 'shield':
        return (
          <div className={iconWrapperClass}>
            <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/10' : 'bg-slate-400/10'} rounded-full blur-lg`}></div>
            <svg viewBox="0 0 24 24" className={`w-full h-full ${iconColor}`} fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
          </div>
        );
      default:
        return null;
    }
  };

  const [isPressed, setIsPressed] = React.useState(false);
  const isMounted = React.useRef(true);

  React.useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isPressed) return;
    setIsPressed(true);
    setTimeout(() => {
      if (isMounted.current) {
        setIsPressed(false);
      }
      onClick();
    }, 180);
  };

  return (
    <motion.button 
      onClick={handleClick}
      animate={{ scale: isPressed ? 0.92 : 1 }}
      transition={{ duration: 0.15, ease: "easeInOut" }}
      className={`flex flex-col items-start p-3 pb-8 rounded-2xl border backdrop-blur-md relative overflow-hidden group w-full h-full transition-all duration-300 shadow-md hover:shadow-xl hover:-translate-y-0.5
        ${isDark 
          ? 'bg-slate-800 border-slate-700 shadow-black/40 hover:bg-slate-700' 
          : 'bg-white border-slate-200 shadow-slate-300 hover:bg-slate-50'}`}
    >
      <div className={`absolute top-0 left-0 w-full h-full pointer-events-none
        ${isDark ? 'bg-gradient-to-br from-white/5 to-transparent' : 'bg-gradient-to-br from-slate-50/10 to-transparent'}`}></div>
      
      {renderIcon()}
      
      <div className="text-left flex-1 relative z-10 w-full">
        <h3 className={`text-[12px] font-bold leading-tight transition-colors line-clamp-2 whitespace-pre-line
          ${isDark ? 'text-white/90' : 'text-slate-900'}`}>
          {title}
        </h3>
        {questionCount !== undefined && (
          <span className={`text-[10px] font-medium leading-none mt-1 block
            ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
            {questionCount} {questionCount % 10 === 1 && questionCount % 100 !== 11 ? 'вопрос' : (questionCount % 10 >= 2 && questionCount % 10 <= 4 && (questionCount % 100 < 10 || questionCount % 100 >= 20) ? 'вопроса' : 'вопросов')}
          </span>
        )}
      </div>
      
      <div className="absolute bottom-2 left-4 right-4 z-10 text-left">
        {recentScores.length > 0 && (
          <div className="flex flex-col gap-0.5 items-start">
            <span className={`text-[8px] uppercase font-black tracking-wider ${isDark ? 'text-white/20' : 'text-slate-400'}`}>
              Последние результаты:
            </span>
            <div className={`text-[9px] font-black ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
              {recentScores.map(s => `${s}%`).join(' / ')}
            </div>
          </div>
        )}
      </div>
    </motion.button>
  );
};

export default GlassButton;
