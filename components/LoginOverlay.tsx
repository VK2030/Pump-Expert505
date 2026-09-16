
import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import AnimatedContent from './AnimatedContent';
import SplitText from './SplitText';
import CloudStatus from './CloudStatus';

interface LoginOverlayProps {
  onAuthorized: (role: 'contestant' | 'contestant_operator' | 'admin', password?: string) => void;
  theme?: 'dark' | 'light';
}

type LoginStage = 'selection' | 'pin';
type AccountType = 'contestant' | 'contestant_operator' | 'admin';

const LoginOverlay: React.FC<LoginOverlayProps> = ({ onAuthorized, theme = 'dark' }) => {
  const [stage, setStage] = useState<LoginStage>('selection');
  const [selectedAccount, setSelectedAccount] = useState<AccountType | null>(null);
  const [pin, setPin] = useState<string>('');
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const isDark = theme === 'dark';

  const [isContestantPressed, setIsContestantPressed] = useState(false);
  const [isOperatorPressed, setIsOperatorPressed] = useState(false);
  const [isAdminPressed, setIsAdminPressed] = useState(false);

  useEffect(() => {
    if (stage === 'pin') {
      const focusInput = () => inputRef.current?.focus();
      focusInput();
      window.addEventListener('click', focusInput);
      return () => window.removeEventListener('click', focusInput);
    }
  }, [stage]);

  const handleAccountSelect = (type: AccountType) => {
    setSelectedAccount(type);
    setStage('pin');
  };

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isLoading) return;
    const value = e.target.value.replace(/[^0-9]/g, '').slice(0, 4);
    setPin(value);
    setIsError(false);
    
    if (value.length === 4 && selectedAccount) {
      setIsLoading(true);
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: selectedAccount, password: value })
        });
        
        const result = await response.json();
        
        if (response.ok && result.success) {
          onAuthorized(selectedAccount, value);
        } else {
          setIsError(true);
          setTimeout(() => { 
            setPin(''); 
            setIsError(false); 
          }, 600);
        }
      } catch (error) {
        console.error("Login error:", error);
        setIsError(true);
        setTimeout(() => { 
          setPin(''); 
          setIsError(false); 
        }, 600);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (isLoading) return;
    setStage('selection');
    setSelectedAccount(null);
    setPin('');
  };

  return (
    <div className={`fixed inset-0 z-[100] flex items-center justify-center backdrop-blur-2xl animate-in fade-in duration-500
      ${isDark ? 'bg-[#081221]/40' : 'bg-white/60'}`}>
      
      <div className="absolute top-4 right-4 z-[120]">
        <CloudStatus status="synced" />
      </div>
      
      {stage === 'selection' ? (
        <AnimatedContent distance={40} scale={0.95} duration={0.6} className="w-full flex flex-col items-center">
          <div className="w-full max-w-[300px] p-8 flex flex-col items-center">
            <div className={`w-16 h-16 mb-8 rounded-2xl flex items-center justify-center border shadow-[0_0_30px_rgba(99,102,241,0.2)]
              ${isDark ? 'bg-indigo-500/20 border-indigo-400/30' : 'bg-indigo-50 border-indigo-100'}`}>
              <svg viewBox="0 0 24 24" className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 11c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zM12 13c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>

            <SplitText
              text="Выберите аккаунт"
              className={`text-xl font-black mb-10 uppercase tracking-tighter text-center ${isDark ? 'text-white' : 'text-slate-900'}`}
              delay={50}
              duration={1.25}
              ease="power3.out"
              from={{ opacity: 0, y: 40 }}
              to={{ opacity: 1, y: 0 }}
              textAlign="center"
              tag="h2"
            />

            <div className="w-full space-y-4">
              <motion.button 
                onClick={(e) => {
                  e.preventDefault();
                  if (isContestantPressed) return;
                  setIsContestantPressed(true);
                  setTimeout(() => {
                    setIsContestantPressed(false);
                    handleAccountSelect('contestant');
                  }, 180);
                }}
                animate={{ scale: isContestantPressed ? 0.92 : 1 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className={`w-full h-16 rounded-[2rem] border backdrop-blur-md flex flex-col items-center justify-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5
                  ${isDark ? 'bg-slate-800/80 border-slate-700 shadow-black/40 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300 hover:bg-slate-50'}`}
              >
                <span className="text-[13px] font-black uppercase tracking-widest leading-none">Конкурсант</span>
                <span className="text-[11px] font-black uppercase tracking-widest leading-none mt-1">(ТЕХНОЛОГ)</span>
              </motion.button>

              <motion.button 
                onClick={(e) => {
                  e.preventDefault();
                  if (isOperatorPressed) return;
                  setIsOperatorPressed(true);
                  setTimeout(() => {
                    setIsOperatorPressed(false);
                    handleAccountSelect('contestant_operator');
                  }, 180);
                }}
                animate={{ scale: isOperatorPressed ? 0.92 : 1 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className={`w-full h-16 rounded-[2rem] border backdrop-blur-md flex flex-col items-center justify-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5
                  ${isDark ? 'bg-slate-800/80 border-slate-700 shadow-black/40 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300 hover:bg-slate-50'}`}
              >
                <span className="text-[13px] font-black uppercase tracking-widest leading-none">Конкурсант</span>
                <span className="text-[11px] font-black uppercase tracking-widest leading-none mt-1">(ОПЕРАТОР)</span>
              </motion.button>

              <motion.button 
                onClick={(e) => {
                  e.preventDefault();
                  if (isAdminPressed) return;
                  setIsAdminPressed(true);
                  setTimeout(() => {
                    setIsAdminPressed(false);
                    handleAccountSelect('admin');
                  }, 180);
                }}
                animate={{ scale: isAdminPressed ? 0.92 : 1 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className={`w-full h-16 rounded-[2rem] border backdrop-blur-md flex items-center justify-center transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5
                  ${isDark ? 'bg-slate-800/80 border-slate-700 shadow-black/40 text-white hover:bg-slate-700' : 'bg-white border-slate-200 text-slate-900 shadow-slate-300 hover:bg-slate-50'}`}
              >
                <span className="text-[13px] font-black uppercase tracking-widest">Администратор</span>
              </motion.button>
            </div>
          </div>
        </AnimatedContent>
      ) : (
        <AnimatedContent distance={40} scale={0.95} duration={0.6}>
          <div className={`w-full max-w-[280px] p-8 flex flex-col items-center transition-transform duration-300 ${isError ? 'animate-shake' : ''}`} onClick={() => inputRef.current?.focus()}>
            <style>{` @keyframes shake { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-10px); } 75% { transform: translateX(10px); } } .animate-shake { animation: shake 0.4s ease-in-out; } `}</style>
            
            <div className={`w-16 h-16 mb-8 rounded-2xl flex items-center justify-center border shadow-[0_0_30px_rgba(59,130,246,0.2)]
              ${isDark ? 'bg-blue-500/20 border-blue-400/30' : 'bg-blue-50 border-blue-100 shadow-blue-100'}`}>
              {isLoading ? (
                <div className="w-8 h-8 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin"></div>
              ) : (
                <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-500" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2" ry="2" /><path d="M7 11V7a5 5 0 0 1 10 0v4" /></svg>
              )}
            </div>

            <h2 className={`text-lg font-bold mb-2 uppercase tracking-widest ${isDark ? 'text-white' : 'text-slate-900'}`}>Код доступа</h2>
            <p className={`text-[10px] font-medium mb-8 text-center leading-relaxed ${isDark ? 'text-blue-100/40' : 'text-slate-400'}`}>
              Вход как {selectedAccount === 'admin' ? 'администратор' : selectedAccount === 'contestant_operator' ? 'конкурсант (оператор)' : 'конкурсант (технолог)'}
            </p>

            <div className="relative flex gap-3 mb-6">
              <input ref={inputRef} type="tel" pattern="[0-9]*" inputMode="numeric" value={pin} onChange={handleChange} className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-default" autoFocus disabled={isLoading} />
              {[0, 1, 2, 3].map((index) => (
                <div key={index} className={`w-12 h-16 rounded-xl border-2 flex items-center justify-center transition-all duration-300 
                    ${pin.length > index ? 'border-blue-500 bg-blue-500/10 shadow-[0_0_15px_rgba(59,130,246,0.3)]' : (isDark ? 'border-white/10 bg-white/5' : 'border-slate-100 bg-slate-50')}
                    ${isError ? 'border-red-500 bg-red-500/10 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : ''}`}>
                  {pin.length > index && <div className={`w-2 h-2 rounded-full animate-in zoom-in duration-200 ${isDark ? 'bg-white' : 'bg-blue-600'}`}></div>}
                </div>
              ))}
            </div>
            
            {isError ? (
              <p className="text-red-500 text-[10px] font-bold uppercase tracking-widest mt-4 animate-in fade-in duration-300">Неверный код доступа</p>
            ) : isLoading ? (
              <p className={`text-[10px] font-bold uppercase tracking-widest mt-4 animate-pulse ${isDark ? 'text-blue-100/40' : 'text-slate-400'}`}>Проверка...</p>
            ) : (
              <div className="flex flex-col items-center gap-2 mt-4">
                <button 
                  onClick={handleBack}
                  className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 border
                    ${isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-slate-100 border-slate-200 text-slate-400'}`}
                >
                  Вернуться к выбору
                </button>
              </div>
            )}
          </div>
        </AnimatedContent>
      )}
    </div>
  );
};

export default LoginOverlay;
