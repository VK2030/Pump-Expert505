
import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QUIZ_QUESTIONS, MODULES } from '../constants';
import { QuizQuestion } from '../types';
import AnimatedContent from './AnimatedContent';
import { renderUserAnswerLines } from '../utils/formatAnswer';

import CloudStatus from './CloudStatus';

interface QuizModuleProps {
  moduleId?: string;
  theme?: 'dark' | 'light';
  userRole?: 'contestant' | 'contestant_operator' | 'admin' | null;
  isTimerEnabled: boolean;
  isHighlightEnabled: boolean;
  isHistoryAnswersEnabled: boolean;
  syncStatus?: 'syncing' | 'synced' | 'error';
  onClose: () => void;
  onExitToApp?: () => void;
}

interface QuizHistoryEntry {
  date: string;
  session: number;
  score: string;
  moduleId?: string;
  user?: string;
  incorrectAnswers: {
    question: string;
    userAnswer: string;
    correctAnswer: string;
  }[];
}

const QuizModule: React.FC<QuizModuleProps> = ({ 
  moduleId, 
  theme = 'dark', 
  userRole,
  isTimerEnabled, 
  isHighlightEnabled, 
  isHistoryAnswersEnabled,
  syncStatus = 'synced',
  onClose, 
  onExitToApp 
}) => {
  const isDark = theme === 'dark';
  const [screen, setScreen] = useState<'menu' | 'quiz' | 'results' | 'history'>('menu');
  const [activeSubModuleId, setActiveSubModuleId] = useState<string | null>(null);
  const [pressedSubId, setPressedSubId] = useState<string | null>(null);
  const [sessionQuestions, setSessionQuestions] = useState<QuizQuestion[]>([]);
  const [isMistakesMode, setIsMistakesMode] = useState(false);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [correctAnswersCount, setCorrectAnswersCount] = useState(0);
  const [currentSession, setCurrentSession] = useState(1);
  const [selectedOptions, setSelectedOptions] = useState<number[]>([]);
  const [shuffledOptions, setShuffledOptions] = useState<string[]>([]);
  const [isAnswerConfirmed, setIsAnswerConfirmed] = useState(false);
  const [incorrectAnswers, setIncorrectAnswers] = useState<QuizHistoryEntry['incorrectAnswers']>([]);
  const [history, setHistory] = useState<QuizHistoryEntry[]>([]);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [showMistakesIntro, setShowMistakesIntro] = useState(false);
  const [isMistakesOkPressed, setIsMistakesOkPressed] = useState(false);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [correctIndicesForCurrentQuestion, setCorrectIndicesForCurrentQuestion] = useState<number[] | null>(null);

  const [isBack1Pressed, setIsBack1Pressed] = useState(false);
  const [isBack2Pressed, setIsBack2Pressed] = useState(false);
  const [isHistory1Pressed, setIsHistory1Pressed] = useState(false);
  const [isHistory2Pressed, setIsHistory2Pressed] = useState(false);
  const [isHistoryBackPressed, setIsHistoryBackPressed] = useState(false);
  
  const [timeLeft, setTimeLeft] = useState(30);
  const timerRef = useRef<any | null>(null);
  const handleTimeOutRef = useRef<() => void>(() => {});

  const currentModule = MODULES.find(m => m.id === moduleId);
  const PBOTOS_SUBMODULES = [
    { id: 'pbotos-general', title: 'Общие вопросы ОТ', questionCount: 139 },
    { id: 'pbotos-siz', title: 'СИЗ', questionCount: 241 },
    { id: 'pbotos-harmful', title: 'Вредные и опасные ПФ', questionCount: 221 },
    { id: 'pbotos-firstaid', title: 'Оказание первой помощи', questionCount: 70 },
    { id: 'pbotos-a1', title: 'А1. Основы ПБ', questionCount: 211 },
    { id: 'pbotos-b21', title: 'Б.2.1 Для объектов нефтяной промышленности', questionCount: 405 },
  ];
  const currentSubModule = PBOTOS_SUBMODULES.find(s => s.id === activeSubModuleId);
  const moduleTitle = activeSubModuleId ? currentSubModule?.title : (currentModule?.title || 'Тестирование');
  
  useEffect(() => {
    console.log("QuizModule: moduleTitle =", JSON.stringify(moduleTitle));
  }, [moduleTitle]);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const response = await fetch('/api/history');
        let data: QuizHistoryEntry[] = [];
        if (response.ok) {
          data = await response.json();
        } else {
          const savedHistory = localStorage.getItem('quizHistory');
          if (savedHistory) data = JSON.parse(savedHistory);
        }
        
        // Fetch global config for history visibility
        const configResponse = await fetch('/api/config');
        if (configResponse.ok) {
          const config = await configResponse.json();
          if (config.isHistoryAnswersEnabled !== undefined) {
             // We don't have a direct setter here, but the parent App.tsx 
             // will pass the updated prop. However, for immediate local use:
             localStorage.setItem('app_history_answers_enabled', String(config.isHistoryAnswersEnabled));
          }
        }

        setHistory(data);
        
        // Calculate next session number based on history (cloud-synced)
        const targetId = activeSubModuleId || moduleId;
        const moduleHistory = data.filter(h => h.moduleId === targetId);
        if (moduleHistory.length > 0) {
          const maxSession = Math.max(...moduleHistory.map(h => h.session || 0));
          setCurrentSession(maxSession + 1);
        } else {
          setCurrentSession(1);
        }
      } catch (error) {
        console.warn("Error fetching history:", error);
        const savedHistory = localStorage.getItem('quizHistory');
        if (savedHistory) {
          const data = JSON.parse(savedHistory);
          setHistory(data);
          const targetId = activeSubModuleId || moduleId;
          const moduleHistory = data.filter((h: any) => h.moduleId === targetId);
          if (moduleHistory.length > 0) {
            const maxSession = Math.max(...moduleHistory.map((h: any) => h.session || 0));
            setCurrentSession(maxSession + 1);
          }
        }
      }
    };
    
    fetchHistory();

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [moduleId, activeSubModuleId]);

  const shuffleArray = <T,>(array: T[]): T[] => {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const startQuiz = async (mistakesOnly = false) => {
    const targetId = activeSubModuleId || moduleId;
    console.log("Starting quiz for module:", targetId, "mistakesOnly:", mistakesOnly);
    if (!targetId) return;
    finishQuizRef.current = false;
    setIsLoadingQuestions(true);
    setIsMistakesMode(mistakesOnly);
    
    const userName = localStorage.getItem('app_user_name') || 'Contestant';

    try {
      const response = await fetch(`/api/quiz/questions/${targetId}?userName=${encodeURIComponent(userName)}`);
      if (!response.ok) {
        const errText = await response.text();
        let errMsg = 'Failed to fetch questions';
        try {
          const errJson = JSON.parse(errText);
          errMsg = errJson.error || errMsg;
        } catch (e) {
          errMsg = errText || errMsg;
        }
        throw new Error(`${response.status}: ${errMsg}`);
      }
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text();
        console.error("Expected JSON but got:", text.substring(0, 100));
        throw new Error(`Server returned non-JSON response (${contentType || 'unknown'}). This usually means the API route is not found or falling back to HTML.`);
      }

      const questionsForModule = await response.json();
      
      if (questionsForModule.length === 0) {
        alert('В этом модуле пока нет вопросов.');
        setIsLoadingQuestions(false);
        return;
      }

      let finalSelected: any[] = [];

      if (mistakesOnly) {
        const mistakesKey = `app_mistakes_v2_${userName}_${targetId}`;
        const mistakesStr = localStorage.getItem(mistakesKey);
        const mistakes: Record<string, number> = mistakesStr ? JSON.parse(mistakesStr) : {};
        
        // --- Sync historical mistakes ---
        const syncKey = `${mistakesKey}_synced_v2`;
        if (!localStorage.getItem(syncKey)) {
          // Only sync the very last session to avoid overwhelming the user with old mistakes or merged contestant mistakes
          const userHistory = history.filter(h => h.moduleId === targetId && h.user === userName);
          if (userHistory.length > 0) {
            const lastSession = userHistory[0]; // history is sorted by date descending
            lastSession.incorrectAnswers?.forEach(inc => {
              const qObj = questionsForModule.find((q: any) => q.text === inc.question);
              if (qObj && mistakes[qObj.id] === undefined) {
                mistakes[qObj.id] = 0;
              }
            });
          }
          localStorage.setItem(mistakesKey, JSON.stringify(mistakes));
          localStorage.setItem(syncKey, 'true');
        }
        // --------------------------------
        
        const mistakesQuestions = questionsForModule.filter((q: any) => mistakes[q.id] !== undefined);
        if (mistakesQuestions.length === 0) {
          alert('У вас нет нерешенных ошибок в этом разделе!');
          setIsLoadingQuestions(false);
          return;
        }
        
        finalSelected = shuffleArray(mistakesQuestions).slice(0, 10);
      } else {
        // Умная выборка: группируем по количеству просмотров
        const groupedByViews: Record<number, any[]> = {};
        questionsForModule.forEach((q: any) => {
          const views = q.viewCount || 0;
          if (!groupedByViews[views]) groupedByViews[views] = [];
          groupedByViews[views].push(q);
        });

        // Сортируем ключи (количества просмотров) по возрастанию
        const sortedViewCounts = Object.keys(groupedByViews).map(Number).sort((a, b) => a - b);
        
        let selected: any[] = [];
        for (const count of sortedViewCounts) {
          const group = shuffleArray(groupedByViews[count]);
          selected = [...selected, ...group];
          if (selected.length >= 10) break;
        }

        // Берем первые 10 (или сколько есть)
        finalSelected = selected.slice(0, Math.min(10, questionsForModule.length));
      }
      
      // Инкрементируем просмотры для выбранных вопросов
      fetch('/api/quiz/views/increment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userName,
          questionIds: finalSelected.map(q => q.id)
        })
      }).catch(err => console.error("Failed to increment views:", err));

      setSessionQuestions(finalSelected);
      setCurrentQuestionIdx(0);
      setCorrectAnswersCount(0);
      setIncorrectAnswers([]);
      setScreen('quiz');
    } catch (error: any) {
      console.error("Error starting quiz:", error);
      alert(`Ошибка при загрузке вопросов: ${error.message}`);
    } finally {
      setIsLoadingQuestions(false);
    }
  };

  const handleTimeOut = () => { confirmAnswer(true); };

  useEffect(() => {
    handleTimeOutRef.current = handleTimeOut;
  }, [handleTimeOut]);

  useEffect(() => {
    if (screen === 'quiz' && !isAnswerConfirmed && isTimerEnabled && !showExitConfirm) {
      setTimeLeft(30);
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            handleTimeOutRef.current();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [currentQuestionIdx, screen, isAnswerConfirmed, isTimerEnabled, showExitConfirm]);

  useEffect(() => {
    if (screen === 'quiz' && sessionQuestions.length > 0) {
      setShuffledOptions(shuffleArray(sessionQuestions[currentQuestionIdx].options));
      setSelectedOptions([]);
      setIsAnswerConfirmed(false);
      setCorrectIndicesForCurrentQuestion(null);
    }
  }, [currentQuestionIdx, sessionQuestions, screen]);

  const toggleOption = (idx: number) => {
    if (isAnswerConfirmed) return;
    setSelectedOptions(prev => prev.includes(idx) ? prev.filter(i => i !== idx) : [...prev, idx]);
  };

  const [isCheckingAnswer, setIsCheckingAnswer] = useState(false);

  const confirmAnswer = async (isTimeout = false) => {
    if (isAnswerConfirmed || isCheckingAnswer) return;
    if (!isTimeout && selectedOptions.length === 0) return;
    if (timerRef.current) clearInterval(timerRef.current);
    
    setIsCheckingAnswer(true);
    const q = sessionQuestions[currentQuestionIdx];
    
    // Находим оригинальные индексы выбранных вариантов
    const originalSelectedIndices = selectedOptions.map(idx => {
      const selectedText = shuffledOptions[idx];
      return q.options.indexOf(selectedText);
    }).filter(idx => idx !== -1);
    
    try {
      const response = await fetch('/api/quiz/check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionId: q.id,
          selectedOptions: originalSelectedIndices
        })
      });
      
      if (!response.ok) throw new Error('Failed to check answer');
      const { isCorrect, correctIndices } = await response.json();

      setCorrectIndicesForCurrentQuestion(correctIndices);
      setIsAnswerConfirmed(true);
      
      let finalCorrectCount = correctAnswersCount;
      let finalIncorrectAnswers = [...incorrectAnswers];

      // Track mistakes
      const userName = localStorage.getItem('app_user_name') || 'Contestant';
      const targetId = activeSubModuleId || moduleId;
      const mistakesKey = `app_mistakes_v2_${userName}_${targetId}`;
      const mistakesStr = localStorage.getItem(mistakesKey);
      const mistakes: Record<string, number> = mistakesStr ? JSON.parse(mistakesStr) : {};

      if (isCorrect) {
        finalCorrectCount += 1;
        setCorrectAnswersCount(finalCorrectCount);
        
        if (mistakes[q.id!] !== undefined) {
          mistakes[q.id!] += 1;
          if (mistakes[q.id!] >= 2) {
            delete mistakes[q.id!];
          }
        }
      } else {
        mistakes[q.id!] = 0; // Reset / add to mistakes if answered incorrectly
        const correctOptionTexts = correctIndices ? correctIndices.map((idx: number) => q.options[idx]) : ["(Скрыто)"];
        const selectedOptionTexts = selectedOptions.map(idx => shuffledOptions[idx]);
        
        const newIncorrect = { 
          question: q.text, 
          userAnswer: selectedOptionTexts.length > 0 ? selectedOptionTexts.join('|||') : (isTimeout ? "Время истекло" : "Нет ответа"), 
          correctAnswer: correctOptionTexts.join('|||') 
        };
        finalIncorrectAnswers.push(newIncorrect);
        setIncorrectAnswers(finalIncorrectAnswers);
      }
      
      localStorage.setItem(mistakesKey, JSON.stringify(mistakes));

      setTimeout(() => {
        if (currentQuestionIdx < sessionQuestions.length - 1) {
          setCurrentQuestionIdx(prev => prev + 1);
        } else {
          finishQuiz(finalCorrectCount, finalIncorrectAnswers);
        }
        setIsCheckingAnswer(false);
      }, 1500);
    } catch (error) {
      console.error("Error checking answer:", error);
      alert('Ошибка связи с сервером при проверке ответа.');
      setIsCheckingAnswer(false);
    }
  };

  const finishQuizRef = useRef(false);

  const finishQuiz = async (countOverride?: number, incorrectOverride?: QuizHistoryEntry['incorrectAnswers']) => {
    if (finishQuizRef.current) return;
    finishQuizRef.current = true;
    
    const finalCount = countOverride !== undefined ? countOverride : correctAnswersCount;
    const finalIncorrect = incorrectOverride !== undefined ? incorrectOverride : incorrectAnswers;

    if (isMistakesMode) {
      setScreen('results');
      setSaveStatus('success');
      return;
    }

    const targetId = activeSubModuleId || moduleId;
    const resolvedUser = userRole === 'admin' 
      ? 'Администратор' 
      : userRole === 'contestant_operator' 
        ? 'ContestantOperator' 
        : (localStorage.getItem('app_user_name') || 'Contestant');
    
    const newEntry: QuizHistoryEntry = {
      date: new Date().toISOString(),
      session: currentSession, 
      score: `${finalCount}/${sessionQuestions.length}`, 
      moduleId: targetId, 
      incorrectAnswers: finalIncorrect,
      user: resolvedUser
    };
    
    let allHistory: QuizHistoryEntry[] = JSON.parse(localStorage.getItem('quizHistory') || '[]');
    if (!Array.isArray(allHistory)) allHistory = history || [];
    
    let updatedHistory = [newEntry, ...allHistory];
    
    // 1) Ограничение по количеству записей для пользователя - 80 сессий
    const userEntries = updatedHistory.filter(h => (h.user || 'Contestant') === resolvedUser);
    if (userEntries.length > 80) {
      const oldestUserEntries = userEntries.slice(80);
      updatedHistory = updatedHistory.filter(h => !oldestUserEntries.includes(h));
    }
    
    // 2) Лимит на локальное хранение - не более 250 записей
    if (updatedHistory.length > 250) {
      updatedHistory = updatedHistory.slice(0, 250);
    }

    setHistory(updatedHistory);
    localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
    setCurrentSession(prev => prev + 1);
    window.dispatchEvent(new Event('storage'));
    window.dispatchEvent(new Event('sessionCompleted'));
    setScreen('results');

    if (userRole === 'contestant' || userRole === 'contestant_operator' || userRole === 'admin') {
      setSaveStatus('saving');
      try {
        const response = await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...newEntry,
            correct_answers: finalCount
          })
        });
        if (response.ok) {
          setSaveStatus('success');
        } else {
          let errMsg = 'Неизвестная ошибка';
          try {
            const contentType = response.headers.get("content-type");
            if (contentType && contentType.includes("application/json")) {
              const errData = await response.json();
              errMsg = errData.error || errData.message || errMsg;
              console.error("Server error during save:", errData);
            } else {
              const text = await response.text();
              console.error("Server returned non-JSON error:", text.substring(0, 200));
              errMsg = `Ошибка сервера (${response.status})`;
            }
          } catch (e) {
            console.error("Failed to parse error response:", e);
          }
          // Removing alert to prevent annoyance, gracefully degrading
          setSaveStatus('error');
        }
      } catch (error: any) {
        console.warn("Failed to save history to cloud:", error);
        // Removing alert to prevent annoyance, gracefully degrading
        setSaveStatus('error');
      }
    } else {
      setSaveStatus('success'); 
    }
  };

  const clearModuleHistory = () => {
    const targetId = activeSubModuleId || moduleId;
    const filteredHistory = history.filter(h => h.moduleId !== targetId);
    setHistory(filteredHistory);
    localStorage.setItem('quizHistory', JSON.stringify(filteredHistory));
    setCurrentSession(1);
    localStorage.setItem(`quizSessionNum_${targetId || 'global'}`, '1');
    window.dispatchEvent(new Event('storage'));
  };

  const targetId = activeSubModuleId || moduleId;
  const moduleHistory = history.filter(h => {
    if (h.moduleId !== targetId) return false;
    if (userRole === 'contestant_operator') {
      return h.user === 'ContestantOperator' || h.user === 'Конкурсант (Оператор)';
    } else if (userRole === 'admin') {
      return true;
    } else {
      return h.user !== 'admin' && h.user !== 'Администратор' && h.user !== 'ContestantOperator' && h.user !== 'Конкурсант (Оператор)';
    }
  });

  const handleAbortTest = () => {
    setShowExitConfirm(false);
    setScreen('menu');
  };

  const renderModuleIcon = () => {
    const iconType = currentModule?.icon;
    const containerClass = `w-20 h-20 relative mb-8 flex items-center justify-center rounded-3xl border overflow-hidden group shadow-2xl ${isDark ? 'bg-white/5 border-slate-500/20 shadow-slate-500/10' : 'bg-white border-slate-100 shadow-slate-200/50'}`;
    const iconClass = `w-10 h-10 ${isDark ? 'text-slate-100' : 'text-slate-600'} transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`;

    switch (iconType) {
      case 'calc': return ( 
        <div className={containerClass}> 
          <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/10' : 'bg-slate-400/5'} blur-xl`}></div> 
          <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> 
            <circle cx="12" cy="12" r="10" />
            <circle cx="12" cy="12" r="4.5" />
            <path d="M11 9.17A3 3 0 1 0 13 9.17L13 8h-2z" />
            {[0, 60, 120, 180, 240, 300].map(angle => (
              <path key={angle} d="M12 7.5 C16 7.5, 21.5 10, 20.66 17" transform={`rotate(${angle} 12 12)`} />
            ))}
          </svg> 
        </div> 
      );
      case 'pump': return ( 
        <div className={containerClass}> 
          <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/10' : 'bg-slate-300/10'} blur-lg`}></div> 
          <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> 
            <rect x="3" y="4" width="18" height="16" strokeLinejoin="miter" />
            <line x1="3" y1="8" x2="21" y2="8" strokeLinecap="square" />
            <line x1="9" y1="4" x2="9" y2="20" strokeLinecap="square" />
            <line x1="15" y1="4" x2="15" y2="20" strokeLinecap="square" />
            <line x1="3" y1="12" x2="21" y2="12" strokeLinecap="square" opacity="0.7" />
            <line x1="3" y1="16" x2="21" y2="16" strokeLinecap="square" opacity="0.7" />
            <path d="M5 6h2" strokeWidth="1" />
            <circle cx="6" cy="10" r="0.5" fill="currentColor" stroke="none" />
            <path d="M5 14h3" strokeWidth="1" opacity="0.5" />
            <path d="M5 18h2" strokeWidth="1" opacity="0.5" />
            <path d="M11 6h2.5" strokeWidth="1" />
            <path d="M10.5 10l1.5 1.5 2-2.5" strokeWidth="1" />
            <path d="M11 14h2" strokeWidth="1" opacity="0.5" />
            <circle cx="12" cy="18" r="0.5" fill="currentColor" stroke="none" />
            <path d="M17 6h2" strokeWidth="1" />
            <path d="M16.5 10.5h3" strokeWidth="1" opacity="0.5" />
            <path d="M17.5 14l1.5-1.5" strokeWidth="1" opacity="0.5" />
            <path d="M16.5 18h3" strokeWidth="1" opacity="0.5" />
          </svg> 
        </div> 
      );
      case 'search': return ( <div className={containerClass}> <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/10' : 'bg-slate-400/5'} blur-xl`}></div> <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> <circle cx="11" cy="11" r="8" /> <path d="m21 21-4.3-4.3" /> </svg> </div> );
      case 'corrosion': return ( 
        <div className={containerClass}> 
          <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/20' : 'bg-slate-400/5'} blur-xl`}></div> 
          <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> 
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg> 
        </div> 
      );
      case 'shield': return (
        <div className={containerClass}>
          <div className={`absolute inset-0 ${isDark ? 'bg-indigo-500/20' : 'bg-slate-400/10'} blur-2xl`}></div>
          <svg viewBox="0 0 24 24" className={`w-10 h-10 ${isDark ? 'text-indigo-400' : 'text-indigo-500'} drop-shadow-[0_0_12px_rgba(99,102,241,0.4)] transition-all duration-500 group-hover:scale-110 group-hover:rotate-3`} fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      );
      default: return ( <div className={containerClass}> <svg viewBox="0 0 24 24" className={iconClass} fill="none" stroke="currentColor" strokeWidth="1.5"> <path d="M12 2v20M2 12h20" /> </svg> </div> );
    }
  };

  const renderMenu = () => {
    if (moduleId === 'pbotos' && !activeSubModuleId) {
      return (
        <div className="flex flex-col h-full p-6 overflow-hidden">
          <div className="flex items-center gap-4 mb-8">
             <button onClick={onClose} className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all active:scale-90
               ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400'}`}>
               <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
                 <path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
               </svg>
             </button>
             <div className="flex items-center gap-3">
               <div className={`w-10 h-10 rounded-xl flex items-center justify-center border
                 ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                 <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                   <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" strokeLinecap="round" strokeLinejoin="round" />
                 </svg>
               </div>
               <h2 className={`text-2xl font-black uppercase tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                 ПБОТОС
               </h2>
             </div>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-1 space-y-3 pb-8 no-scrollbar">
            {PBOTOS_SUBMODULES.map((sub, idx) => {
              const subModuleHistory = history.filter(h => h.moduleId === sub.id);
              const recentScores = subModuleHistory.slice(0, 3).reverse().map(h => {
                const [correct, total] = h.score.split('/').map(Number);
                return Math.round((correct / total) * 100);
              });

              const handleSubClick = (e: React.MouseEvent) => {
                e.preventDefault();
                if (pressedSubId) return;
                setPressedSubId(sub.id);
                setTimeout(() => {
                  setPressedSubId(null);
                  setActiveSubModuleId(sub.id);
                }, 180);
              };

              const isPressed = pressedSubId === sub.id;

              return (
                <AnimatedContent key={sub.id} distance={30} delay={idx * 0.05} direction="vertical">
                  <motion.button 
                    onClick={handleSubClick}
                    animate={{ scale: isPressed ? 0.92 : 1 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    className={`w-full p-5 rounded-2xl border text-left transition-all group relative overflow-hidden
                      ${isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-slate-200 hover:border-indigo-200 shadow-sm'}`}
                  >
                    <div className={`absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-3xl -mr-8 -mt-8 transition-opacity group-hover:opacity-100 opacity-0`}></div>
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex flex-col gap-1 flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <span className={`text-sm font-bold leading-tight ${isDark ? 'text-white/90' : 'text-slate-800'}`}>{sub.title}</span>
                        </div>
                        {recentScores.length > 0 && (
                          <div className="flex flex-col gap-0.5 items-start mt-1">
                            <span className={`text-[8px] uppercase font-black tracking-wider ${isDark ? 'text-white/20' : 'text-slate-400'}`}>
                              Последние результаты:
                            </span>
                            <div className={`text-[9px] font-black ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                              {recentScores.map(s => `${s}%`).join(' / ')}
                            </div>
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-medium whitespace-nowrap shrink-0 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                        ({sub.questionCount} {sub.questionCount % 10 === 1 && sub.questionCount % 100 !== 11 ? 'вопрос' : (sub.questionCount % 10 >= 2 && sub.questionCount % 10 <= 4 && (sub.questionCount % 100 < 10 || sub.questionCount % 100 >= 20) ? 'вопроса' : 'вопросов')})
                      </span>
                      <div className={`w-8 h-8 shrink-0 rounded-lg flex items-center justify-center border transition-colors
                        ${isDark ? 'bg-white/5 border-white/10 text-white/20' : 'bg-slate-50 border-slate-100 text-slate-300'}`}>
                        <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="3">
                          <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </div>
                    </div>
                  </motion.button>
                </AnimatedContent>
              );
            })}

            <AnimatedContent distance={30} delay={PBOTOS_SUBMODULES.length * 0.05} direction="vertical">
              <div className="pt-2">
                <motion.button 
                  onClick={(e) => {
                    e.preventDefault();
                    if (isBack1Pressed) return;
                    setIsBack1Pressed(true);
                    setTimeout(() => {
                      setIsBack1Pressed(false);
                      onClose();
                    }, 180);
                  }}
                  animate={{ scale: isBack1Pressed ? 0.92 : 1 }}
                  transition={{ duration: 0.15, ease: "easeInOut" }}
                  className={`w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all border
                  ${isDark ? 'bg-white/5 border-white/10 text-white/40 active:text-white' : 'bg-white border-slate-200 text-slate-400 active:text-slate-900'}`}>
                  <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  Вернуться назад
                </motion.button>
              </div>
            </AnimatedContent>
          </div>
        </div>
      );
    }

    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center overflow-hidden">
        <AnimatedContent distance={60} delay={0.1}>
          {renderModuleIcon()}
        </AnimatedContent>
        <AnimatedContent distance={30} delay={0.3}>
          <h2 className={`text-3xl font-black mb-2 uppercase tracking-tight leading-none drop-shadow-lg whitespace-pre-line ${isDark ? 'text-white' : 'text-slate-900'}`}>{moduleTitle}</h2>
        </AnimatedContent>
        <AnimatedContent distance={20} delay={0.4}>
          <p className={`mb-10 text-sm leading-relaxed max-w-[280px] mx-auto ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
            Может быть несколько вариантов ответа.<br/>
            1 сессия - 10 вопросов
          </p>
        </AnimatedContent>
        <div className="w-full space-y-3">
          <AnimatedContent distance={30} delay={0.5} direction="vertical">
            <button 
              onClick={() => startQuiz(false)} 
              disabled={isLoadingQuestions}
              className={`w-full py-4 rounded-2xl font-bold text-lg active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 border flex items-center justify-center gap-2
              ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600 shadow-black/40' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700 shadow-slate-300'}`}
            >
              {isLoadingQuestions && !isMistakesMode ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Загрузка...
                </>
              ) : 'Начать тест'}
            </button>
          </AnimatedContent>
          <AnimatedContent distance={30} delay={0.55} direction="vertical">
            <button 
              onClick={() => setShowMistakesIntro(true)} 
              disabled={isLoadingQuestions}
              className={`w-full py-4 rounded-2xl font-bold active:scale-[0.98] transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border flex items-center justify-center gap-2
              ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 shadow-black/30 text-indigo-100' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-slate-200/50 text-slate-700'}`}
            >
              {isLoadingQuestions && isMistakesMode ? (
                <>
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Загрузка...
                </>
              ) : 'Работа над ошибками'}
            </button>
          </AnimatedContent>
          <AnimatedContent distance={30} delay={0.6} direction="vertical">
            <motion.button 
              onClick={(e) => {
                e.preventDefault();
                if (isHistory1Pressed) return;
                setIsHistory1Pressed(true);
                setTimeout(() => {
                  setIsHistory1Pressed(false);
                  setScreen('history');
                }, 180);
              }}
              animate={{ scale: isHistory1Pressed ? 0.92 : 1 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border
              ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 shadow-black/30 text-indigo-100' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-slate-200/50 text-slate-700'}`}>
              История тестирования
            </motion.button>
          </AnimatedContent>
          <AnimatedContent distance={30} delay={0.7} direction="vertical">
            <div className="pt-4">
              <motion.button 
                onClick={(e) => {
                  e.preventDefault();
                  if (isBack2Pressed) return;
                  setIsBack2Pressed(true);
                  setTimeout(() => {
                    setIsBack2Pressed(false);
                    if (activeSubModuleId) {
                      setActiveSubModuleId(null);
                    } else {
                      onClose();
                    }
                  }, 180);
                }}
                animate={{ scale: isBack2Pressed ? 0.92 : 1 }}
                transition={{ duration: 0.15, ease: "easeInOut" }}
                className={`w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-bold text-xs uppercase tracking-[0.15em] transition-all border
                ${isDark ? 'bg-white/5 border-white/10 text-white/40 active:text-white' : 'bg-white border-slate-200 text-slate-400 active:text-slate-900'}`}>
                <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M15 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" /></svg>
                {activeSubModuleId ? 'К подразделам' : 'Вернуться назад'}
              </motion.button>
            </div>
          </AnimatedContent>
        </div>
      </div>
    );
  };

  const renderQuiz = () => {
    const q = sessionQuestions[currentQuestionIdx];
    const isCriticalTime = timeLeft <= 10;
    // Calculate progress as remaining time percentage (30s max)
    const timerProgress = isTimerEnabled ? (timeLeft / 30) * 100 : 100;
    
    return (
      <div className="flex flex-col h-full overflow-hidden">
        <header className={`p-4 pt-10 border-b relative overflow-hidden flex-shrink-0 ${isDark ? 'bg-[#0c1e3a] border-white/10' : 'bg-white border-slate-200'}`}>
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
               <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-white' : 'text-slate-900'}`}>Вопрос {currentQuestionIdx + 1} / {sessionQuestions.length}</span>
               {isTimerEnabled && (
                <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full border transition-colors duration-300
                  ${isCriticalTime ? 'bg-red-500/20 border-red-500/50 text-red-500' : (isDark ? 'bg-white/10 border-white/30 text-white' : 'bg-slate-100 border-slate-200 text-slate-600')}`}>
                  <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  <span className="text-[10px] font-black">{timeLeft}с</span>
                </div>
               )}
            </div>
            <div className={`px-2 py-0.5 rounded-md border text-[9px] font-bold uppercase ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>
              {activeSubModuleId === 'pbotos-b21' ? 'Б.2.1' : moduleTitle}
            </div>
          </div>
          
          <div className={`w-full h-[2px] rounded-full overflow-hidden mb-1 ${isDark ? 'bg-white/10' : 'bg-slate-100'}`}>
            <div 
              className={`h-full transition-all duration-1000 linear ${isCriticalTime ? 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]' : (isDark ? 'bg-white shadow-[0_0_10px_rgba(255,255,255,0.4)]' : 'bg-indigo-600 shadow-[0_0_10px_rgba(79,70,229,0.2)]')}`} 
              style={{ width: `${timerProgress}%` }}
            ></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-48">
          <AnimatedContent key={`q-${currentQuestionIdx}`} distance={30} delay={0.1}>
            <div className={`p-5 rounded-2xl border shadow-inner ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
               <p className={`text-base leading-snug font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{q?.text}</p>
            </div>
          </AnimatedContent>
          <div className="space-y-2">
            <AnimatedContent key={`hint-${currentQuestionIdx}`} distance={20} delay={0.2}>
              <p className={`text-[9px] uppercase font-black tracking-widest pl-2 ${isDark ? 'text-white/40' : 'text-slate-400'}`}>Может быть несколько вариантов ответа</p>
            </AnimatedContent>
            <div className="grid grid-cols-1 gap-2">
              {shuffledOptions.map((opt, i) => {
                const isSelected = selectedOptions.includes(i);
                
                // Проверяем корректность опции, если ответ уже подтвержден
                let isCorrect = false;
                if (isAnswerConfirmed && correctIndicesForCurrentQuestion) {
                  const originalIdx = q.options.indexOf(opt);
                  isCorrect = correctIndicesForCurrentQuestion.includes(originalIdx);
                }

                let btnClass = "w-full p-3.5 rounded-xl text-left transition-all duration-200 border flex items-center gap-3 ";
                if (!isAnswerConfirmed) {
                  btnClass += isSelected 
                    ? "bg-[#383838] border-white text-white shadow-lg scale-[1.01]" 
                    : (isDark 
                        ? "bg-white/5 border-white/10 text-white/80 active:bg-white/10" 
                        : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300");
                } else {
                  if (isHighlightEnabled) {
                    if (isSelected) {
                      btnClass += isCorrect ? "bg-green-500 border-green-400 text-white shadow-lg" : "bg-red-500 border-red-400 text-white shadow-lg";
                    } else {
                      if (isCorrect) {
                        btnClass += isDark 
                          ? "bg-green-950/40 border-green-500/30 text-green-300" 
                          : "bg-green-50 border-green-200 text-green-700 shadow-sm";
                      } else {
                        btnClass += isDark ? "bg-white/5 border-white/5 text-white/20 opacity-50" : "bg-slate-50 border-slate-100 text-slate-300 opacity-50";
                      }
                    }
                  } else {
                    if (isSelected) btnClass += "bg-[#383838] border-white text-white opacity-90";
                    else btnClass += (isDark ? "bg-white/5 border-white/5 text-white/10 opacity-30" : "bg-slate-50 border-slate-50 text-slate-200 opacity-30");
                  }
                }
                return (
                  <AnimatedContent key={`opt-${currentQuestionIdx}-${i}`} distance={20} delay={0.3 + i * 0.05}>
                    <button onClick={() => toggleOption(i)} className={btnClass} disabled={isAnswerConfirmed}> <div className={`w-6 h-6 rounded-lg border flex items-center justify-center flex-shrink-0 text-[10px] font-black transition-colors ${isSelected ? 'border-current bg-current/10' : 'border-current/20'}`}> {isSelected ? ( <svg viewBox="0 0 24 24" className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg> ) : ( String.fromCharCode(65 + i) )} </div> <span className="flex-1 text-sm font-medium leading-tight">{opt}</span> </button>
                  </AnimatedContent>
                );
              })}
            </div>
          </div>
        </div>

        <div className={`absolute bottom-0 left-0 right-0 p-4 pb-8 flex flex-col gap-6 z-50 ${isDark ? 'bg-gradient-to-t from-[#081221] via-[#081221] to-transparent' : 'bg-gradient-to-t from-white via-white to-transparent'}`}>
          <AnimatePresence mode="wait">
            {!isAnswerConfirmed ? (
              <motion.div
                key={`confirm-btn-${currentQuestionIdx}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3, delay: 0.1 }}
                className="w-full"
              >
                <button 
                  onClick={() => confirmAnswer()} 
                  disabled={selectedOptions.length === 0 || isCheckingAnswer} 
                  className={`w-full py-4 rounded-xl font-bold text-lg transition-all duration-300 shadow-xl flex items-center justify-center gap-2
                    ${selectedOptions.length > 0 && !isCheckingAnswer
                      ? (isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-white/10 shadow-black/20' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700 shadow-slate-200') 
                      : (isDark ? 'bg-white/5 text-white/20 border-white/20' : 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed')
                    }`}
                >
                  {isCheckingAnswer ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Проверка...
                    </>
                  ) : 'Принять ответ'}
                </button>
              </motion.div>
            ) : (
              <motion.div 
                key="loading-msg"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full h-14 flex items-center justify-center"
              >
                <span className={`text-[10px] uppercase font-black tracking-widest animate-pulse ${isDark ? 'text-white/40' : 'text-slate-400'}`}>
                  Переход к следующему вопросу...
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <button 
            onClick={() => setShowExitConfirm(true)} 
            className={`w-full py-2 bg-transparent font-bold uppercase text-[10px] tracking-[0.2em] transition-all opacity-40 active:opacity-100 hover:opacity-100 ${isDark ? 'text-white' : 'text-slate-600'}`}
          >
            Прервать тест
          </button>
        </div>

        <AnimatePresence>
          {showExitConfirm && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 backdrop-blur-md bg-black/40"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className={`w-full max-w-[320px] p-8 rounded-[2.5rem] border shadow-2xl relative overflow-hidden
                  ${isDark ? 'bg-slate-900 border-white/10' : 'bg-white border-slate-200'}`}
              >
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 mx-auto
                  ${isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-500'}`}>
                  <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                
                <h3 className={`text-xl font-black text-center mb-3 uppercase tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Прервать тест?
                </h3>
                
                <p className={`text-sm text-center mb-8 font-medium leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                  Ваш прогресс в текущей сессии не будет сохранен в истории.
                </p>
                
                <div className="flex flex-col gap-3">
                  <button 
                    onClick={handleAbortTest}
                    className="w-full py-4 rounded-2xl bg-red-500 text-white font-black uppercase text-xs tracking-widest shadow-lg shadow-red-500/20 active:scale-[0.98] transition-all"
                  >
                    Прервать
                  </button>
                  <button 
                    onClick={() => setShowExitConfirm(false)}
                    className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all border
                      ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-slate-100 border-slate-200 text-slate-700'}`}
                  >
                    Продолжить тест
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderResults = () => {
    const total = sessionQuestions.length;
    const percentage = total > 0 ? (correctAnswersCount / total) * 100 : 0;
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center overflow-hidden">
        <AnimatedContent distance={50} scale={0.8}>
          <div className="relative w-48 h-48 mb-8">
            <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
              <circle cx="50" cy="50" r="44" className={`${isDark ? 'stroke-white/5' : 'stroke-slate-100'} fill-none`} strokeWidth="6" />
              <motion.circle 
                cx="50" 
                cy="50" 
                r="44" 
                className="stroke-indigo-500 fill-none" 
                strokeWidth="8" 
                initial={{ strokeDasharray: "0 276" }}
                animate={{ strokeDasharray: `${total > 0 ? (correctAnswersCount / total) * 276 : 0} 276` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
                strokeLinecap="round" 
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.span 
                className={`text-5xl font-black tracking-tighter ${isDark ? 'text-white' : 'text-slate-900'}`}
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {Math.round(percentage)}%
              </motion.span>
              <motion.span 
                className="text-[10px] text-indigo-500 uppercase font-black tracking-[0.2em] mt-1"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.7 }}
              >
                Уровень
              </motion.span>
            </div>
          </div>
        </AnimatedContent>
        <AnimatedContent distance={20} delay={0.3}>
          <h2 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Сессия #{currentSession - 1}</h2>
          <p className={`mb-10 font-medium ${isDark ? 'text-white/40' : 'text-slate-500'}`}>Верных ответов: <span className={isDark ? 'text-white' : 'text-slate-900'}>{correctAnswersCount}</span> из {total}</p>
        </AnimatedContent>
        <div className="w-full space-y-3">
          <AnimatedContent distance={30} delay={0.4} direction="vertical">
            <button onClick={() => startQuiz(isMistakesMode)} className={`w-full py-4 rounded-2xl text-white font-bold active:scale-[0.98] transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 border ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600 shadow-black/40' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700 shadow-slate-300'}`}>Повторить тест</button>
          </AnimatedContent>
          <AnimatedContent distance={30} delay={0.5} direction="vertical">
            <motion.button 
              onClick={(e) => {
                e.preventDefault();
                if (isHistory2Pressed) return;
                setIsHistory2Pressed(true);
                setTimeout(() => {
                  setIsHistory2Pressed(false);
                  setScreen('history');
                }, 180);
              }}
              animate={{ scale: isHistory2Pressed ? 0.92 : 1 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 border ${isDark ? 'bg-slate-800/50 hover:bg-slate-700/50 border-slate-600 shadow-black/30 text-indigo-100' : 'bg-white hover:bg-slate-50 border-slate-200 shadow-slate-200/50 text-slate-700'}`}>
              История тестирования
            </motion.button>
          </AnimatedContent>
          <AnimatedContent distance={30} delay={0.6} direction="vertical">
            <button 
              onClick={() => {
                if (activeSubModuleId) {
                  setActiveSubModuleId(null);
                  setScreen('menu');
                } else {
                  if (onExitToApp) onExitToApp();
                  else onClose();
                }
              }} 
              className={`w-full py-4 rounded-2xl font-bold active:scale-[0.98] transition-all opacity-60 border ${isDark ? 'bg-white/5 border-white/10 text-white/40' : 'bg-white border-slate-200 text-slate-400'}`}
            >
              {activeSubModuleId ? 'К подразделам' : 'В главное меню'}
            </button>
          </AnimatedContent>
        </div>
      </div>
    );
  };

  const renderHistory = () => {
    // Determine if we should show correct answers based on userRole and historyAnswersEnabled setting
    const showCorrectAnswers = userRole === 'admin' || isHistoryAnswersEnabled;

    return (
      <div className="flex flex-col h-full overflow-hidden">
        <AnimatedContent distance={-20} direction="vertical">
          <header className={`p-6 pt-10 border-b flex justify-between items-center ${isDark ? 'bg-[#0c1e3a] border-white/10' : 'bg-white border-slate-200'}`}>
            <div className="flex flex-col">
              <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}>История тестирования</span>
              <h3 className={`font-bold text-sm truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-900'}`}>{moduleTitle}</h3>
            </div>
            <motion.button 
              onClick={(e) => {
                e.preventDefault();
                if (isHistoryBackPressed) return;
                setIsHistoryBackPressed(true);
                setTimeout(() => {
                  setIsHistoryBackPressed(false);
                  setScreen('menu');
                }, 180);
              }}
              animate={{ scale: isHistoryBackPressed ? 0.92 : 1 }}
              transition={{ duration: 0.15, ease: "easeInOut" }}
              className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase ${isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              Назад
            </motion.button>
          </header>
        </AnimatedContent>
        <div className="flex-1 overflow-y-auto p-4 space-y-3 pb-24">
          {moduleHistory.length === 0 ? ( <div className={`flex flex-col items-center justify-center py-24 italic text-sm ${isDark ? 'text-white/20' : 'text-slate-300'}`}> <svg viewBox="0 0 24 24" className="w-12 h-12 mb-4 opacity-10" fill="none" stroke="currentColor" strokeWidth="1"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg> Попыток еще не было </div> ) : (
            moduleHistory.map((entry, idx) => {
               const [correct] = entry.score.split('/').map(Number);
               const isSuccess = correct >= 8;
               const formattedDate = (() => {
                 try {
                   return new Date(entry.date).toLocaleString('ru-RU', { 
                     day: '2-digit', month: '2-digit', year: 'numeric', 
                     hour: '2-digit', minute: '2-digit' 
                   });
                 } catch (e) {
                   return entry.date;
                 }
               })();

               return (
                 <AnimatedContent key={idx} distance={30} delay={idx * 0.1}>
                   <div className={`p-5 rounded-2xl border relative overflow-hidden group ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}> {isSuccess && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>} <div className="flex justify-between items-start mb-3"> <div className="flex flex-col"> <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Сессия {entry.session}</span> <span className={`text-[10px] font-bold ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{formattedDate}</span> </div> <div className="flex flex-col items-end"> <span className={`text-xl font-black ${isSuccess ? 'text-green-500' : 'text-indigo-500'}`}>{entry.score}</span> <span className={`text-[8px] font-black uppercase tracking-tighter ${isSuccess ? 'text-green-600/50' : 'text-indigo-500/50'}`}> {isSuccess ? 'Успешно' : 'Нужна практика'} </span> </div> </div> {entry.incorrectAnswers.length > 0 && ( <div className={`mt-4 pt-4 border-t space-y-4 ${isDark ? 'border-white/5' : 'border-slate-100'}`}> <span className="text-[9px] uppercase font-black text-red-500/60 tracking-widest">Разбор ошибок ({entry.incorrectAnswers.length}):</span> {entry.incorrectAnswers.map((err, i) => ( <div key={i} className={`text-[11px] space-y-1 p-3 rounded-xl border ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}> <p className={`font-bold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>«{err.question}»</p> <div className="flex flex-col gap-1 mt-2"> <div className="flex gap-2"> <span className="text-red-500/80 font-bold uppercase text-[7px] px-1 py-0.5 bg-red-500/10 rounded self-start mt-0.5">Ваш выбор</span> {renderUserAnswerLines(err.userAnswer, isDark)} </div> {showCorrectAnswers && ( <div className="flex gap-2"> <span className="text-green-500 font-bold uppercase text-[7px] px-1 py-0.5 bg-green-500/10 rounded self-start mt-0.5">Верно</span> <span className={`flex flex-col gap-1 ${isDark ? 'text-green-300/80' : 'text-green-600'}`}>{(err.correctAnswer.includes('|||') ? err.correctAnswer.split('|||') : [err.correctAnswer]).map((ans, aIdx) => (<div key={aIdx}>+ {ans}</div>))}</span> </div> )} </div> </div> ))} </div> )} </div>
                 </AnimatedContent>
               );
            })
          )}
        </div>
        <div className={`absolute bottom-0 left-0 right-0 p-6 ${isDark ? 'bg-gradient-to-t from-[#081221] via-[#081221]/90 to-transparent' : 'bg-gradient-to-t from-white via-white/90 to-transparent'}`}>
          <AnimatedContent distance={20} delay={0.5} direction="vertical">
            {userRole === 'admin' && (
              <button 
                onClick={clearModuleHistory} 
                className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${isDark ? 'bg-red-500/5 border-red-500/10 text-red-500/50 active:bg-red-500 active:text-white' : 'bg-red-50 border-red-100 text-red-500 active:bg-red-500 active:text-white'}`}
              >
                Удалить историю этого модуля
              </button>
            )}
          </AnimatedContent>
        </div>
      </div>
    );
  };

  const renderMistakesIntro = () => {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center overflow-hidden">
        <AnimatedContent distance={30} delay={0.1} direction="vertical">
          <div className={`w-20 h-20 mx-auto mb-6 flex items-center justify-center rounded-3xl border shadow-2xl ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400 shadow-indigo-500/10' : 'bg-indigo-50 border-indigo-100 text-indigo-500 shadow-indigo-200/50'}`}>
            <svg viewBox="0 0 24 24" className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
        </AnimatedContent>
        <AnimatedContent distance={30} delay={0.2} direction="vertical">
          <h2 className={`text-2xl font-black uppercase tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Работа над ошибками
          </h2>
        </AnimatedContent>
        <AnimatedContent distance={30} delay={0.3} direction="vertical">
          <p className={`text-[15px] mb-12 max-w-[280px] mx-auto leading-relaxed font-medium ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
            Здесь собраны только вопросы с ошибками. Чтобы вопрос был исключен из тестирования, ответьте на него верно <span className="text-red-500 underline" style={{ textDecorationSkipInk: 'none' }}>дважды</span>.
          </p>
        </AnimatedContent>
        <AnimatedContent distance={30} delay={0.4} direction="vertical" className="w-full">
          <motion.button 
            onClick={(e) => {
              e.preventDefault();
              if (isMistakesOkPressed) return;
              setIsMistakesOkPressed(true);
              setTimeout(() => {
                setIsMistakesOkPressed(false);
                setShowMistakesIntro(false);
                startQuiz(true);
              }, 180);
            }}
            animate={{ scale: isMistakesOkPressed ? 0.92 : 1 }}
            transition={{ duration: 0.15, ease: "easeInOut" }}
            disabled={isLoadingQuestions}
            className={`w-full py-4 flex items-center justify-center gap-2 rounded-2xl font-black uppercase text-[13px] tracking-widest transition-all shadow-xl hover:shadow-2xl hover:-translate-y-0.5 border
            ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border-slate-600 shadow-black/40' : 'bg-slate-800 hover:bg-slate-900 text-white border-slate-700 shadow-slate-300'}`}
          >
            {isLoadingQuestions ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Загрузка...
              </>
            ) : 'ОК'}
          </motion.button>
        </AnimatedContent>
        <AnimatedContent distance={30} delay={0.5} direction="vertical" className="w-full mt-4">
          <button 
            onClick={() => setShowMistakesIntro(false)}
            className={`w-full py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest active:scale-[0.98] transition-all opacity-80 border ${isDark ? 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50 shadow-sm'}`}
          >
            Отмена
          </button>
        </AnimatedContent>
      </div>
    );
  };

  const mainBg = isDark ? 'bg-[#081221]' : 'bg-slate-50';
  return ( 
    <div className={`fixed inset-0 z-[60] flex flex-col ${mainBg}`}> 
      {screen === 'menu' && !showMistakesIntro && renderMenu()} 
      {screen === 'menu' && showMistakesIntro && renderMistakesIntro()} 
      {screen === 'quiz' && renderQuiz()} 
      {screen === 'results' && renderResults()} 
      {screen === 'history' && renderHistory()} 
    </div> 
  );
};

export default QuizModule;
