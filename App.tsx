
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AppSection, ModuleData, QuizQuestion } from './types';
import { MODULES, QUIZ_QUESTIONS } from './constants';
import GlassButton from './components/GlassButton';
import ModuleDetail from './components/ModuleDetail';
import LoginOverlay from './components/LoginOverlay';
import AnimatedContent from './components/AnimatedContent';
import SulfateGame from './components/SulfateGame';
import FruitNinjaGame from './components/FruitNinjaGame';
import AspoGame from './components/AspoGame';
import WaterKfGame from './components/WaterKfGame';
import SplitText from './components/SplitText';
import ProgressDashboard from './components/ProgressDashboard';
import { renderUserAnswerLines, formatTelegramUserAnswer } from './utils/formatAnswer';

import CloudStatus from './components/CloudStatus';

const GLOBAL_QUESTION_COUNTS: Record<string, number> = {
  'esp-selection-startup': 110,
  'failure-investigation': 100,
  'operating-factors': 96,
  'pbotos-general': 139,
  'pbotos-siz': 241,
  'pbotos-harmful': 221,
  'pbotos-firstaid': 70,
  'pbotos-a1': 211,
  'pbotos-b21': 405,
};

const PBOTOS_SUBMODULES: Record<string, string> = {
  'pbotos-general': 'Общие вопросы ОТ',
  'pbotos-siz': 'СИЗ',
  'pbotos-harmful': 'Вредные и опасные ПФ',
  'pbotos-firstaid': 'Оказание первой помощи',
  'pbotos-a1': 'А1. Основы ПБ',
  'pbotos-b21': 'Б.2.1 Для объектов нефтяной промышленности',
};

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

const App: React.FC = () => {
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('app_theme');
    return (saved as 'dark' | 'light') || 'light';
  });

  const [isAuthorized, setIsAuthorized] = useState<boolean>(false);
  const [userRole, setUserRole] = useState<'contestant' | 'contestant_operator' | 'admin' | null>(null);

  const [activeTab, setActiveTab] = useState<AppSection>('home');
  const [isTasksPressed, setIsTasksPressed] = useState<boolean>(false);

  const handleTasksClick = (e: React.MouseEvent) => {
    e.preventDefault();
    if (isTasksPressed) return;
    setIsTasksPressed(true);
    setTimeout(() => {
      setIsTasksPressed(false);
      setActiveTab('tasks');
    }, 180);
  };

  const [selectedModule, setSelectedModule] = useState<ModuleData | null>(null);
  const [moduleProgress, setModuleProgress] = useState<Record<string, number>>({});
  const [moduleRecentScores, setModuleRecentScores] = useState<Record<string, number[]>>({});
  const [fullHistory, setFullHistory] = useState<QuizHistoryEntry[]>([]);
  const [activeGame, setActiveGame] = useState<string | null>(null);
  const [telegramStatus, setTelegramStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  
  const [isTimerEnabled, setIsTimerEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_timer_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [isHighlightEnabled, setIsHighlightEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_highlight_enabled');
    return saved === null ? true : saved === 'true';
  });

  const [isHistoryAnswersEnabled, setIsHistoryAnswersEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('app_history_answers_enabled');
    return saved === null ? true : saved === 'true';
  });

  useEffect(() => {
    localStorage.setItem('app_theme', theme);
    if (theme === 'light') {
      document.body.style.backgroundColor = '#F8FAFC';
      document.body.classList.add('light-theme');
    } else {
      document.body.style.backgroundColor = '#081221';
      document.body.classList.remove('light-theme');
    }
  }, [theme]);

  const [syncStatus, setSyncStatus] = useState<'syncing' | 'synced' | 'error'>('synced');
  const [adminPassword, setAdminPassword] = useState<string>(() => {
    return sessionStorage.getItem('app_admin_password') || '';
  });

  const [historyFilter, setHistoryFilter] = useState<string | 'all'>('all');
  const [isHistoryFilterOpen, setIsHistoryFilterOpen] = useState(false);
  const [accountFilter, setAccountFilter] = useState<'all' | 'contestant' | 'contestant_operator' | 'admin'>('contestant');
  const [isAccountFilterOpen, setIsAccountFilterOpen] = useState(false);
  const [isProgressAccountFilterOpen, setIsProgressAccountFilterOpen] = useState(false);

  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [clearHistoryPasswordInput, setClearHistoryPasswordInput] = useState('');
  const [clearHistoryError, setClearHistoryError] = useState('');

  // Гарантируем чистоту сессии и сброс сохраненной авторизации при каждой загрузке страницы
  useEffect(() => {
    localStorage.removeItem('app_user_role');
    localStorage.removeItem('app_remember_me');
  }, []);

  const baseHistory = useMemo(() => {
    const filtered = fullHistory.filter((h) => {
      if (userRole === 'admin') {
        if (accountFilter === 'all') return true;
        if (accountFilter === 'admin') return h.user === 'admin' || h.user === 'Администратор';
        if (accountFilter === 'contestant_operator') return h.user === 'ContestantOperator' || h.user === 'Конкурсант (Оператор)';
        if (accountFilter === 'contestant') return h.user !== 'admin' && h.user !== 'Администратор' && h.user !== 'ContestantOperator' && h.user !== 'Конкурсант (Оператор)';
        return true;
      } else if (userRole === 'contestant_operator') {
        return h.user === 'ContestantOperator' || h.user === 'Конкурсант (Оператор)';
      } else {
        // Contestant (Technologist)
        return h.user !== 'admin' && h.user !== 'Администратор' && h.user !== 'ContestantOperator' && h.user !== 'Конкурсант (Оператор)';
      }
    });

    // Dynamically calculate sequential session numbers (1, 2, 3, ...) for each unique user and module
    // to prevent any duplicates, skips, or synchronization gaps.
    const sorted = [...filtered].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const counters: Record<string, number> = {};
    const sessionMap = new Map<any, number>();

    for (const entry of sorted) {
      const userKey = entry.user || 'Contestant';
      const modKey = entry.moduleId || 'unknown';
      const key = `${userKey}::${modKey}`;
      counters[key] = (counters[key] || 0) + 1;
      sessionMap.set(entry, counters[key]);
    }

    return filtered.map((entry) => {
      const dynamicSession = sessionMap.get(entry);
      return {
        ...entry,
        session: dynamicSession || entry.session || 1,
      };
    });
  }, [fullHistory, userRole, accountFilter]);

  const sendHistoryToTelegram = async (isAuto = false) => {
    let currentHistory = fullHistory;
    let questionViews: Record<string, number> = {};
    
    // Always refresh history and question views before sending
    try {
      const [historyResp, viewsResp] = await Promise.all([
        fetch('/api/history'),
        fetch('/api/question-views')
      ]);
      if (historyResp.ok) {
        currentHistory = await historyResp.json();
      }
      if (viewsResp.ok) {
        questionViews = await viewsResp.json();
      }
    } catch(e) {
      console.warn("Failed to refresh history or question views:", e);
    }
    
    const contestantHistory = currentHistory.filter((h: any) => h.user !== 'admin' && h.user !== 'Администратор' && h.user !== 'ContestantOperator' && h.user !== 'Конкурсант (Оператор)');

    if (contestantHistory.length === 0) {
      if (!isAuto) alert("История пуста. Нечего отправлять.");
      return;
    }

    const escapeHTML = (text: string) => {
      return text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
    };

    if (!isAuto) setTelegramStatus('sending');
    try {
      // Группируем результаты по модулям
      const statsByModule: Record<string, { count: number, totalScore: number, latestEntry?: QuizHistoryEntry }> = {};
      contestantHistory.forEach(entry => {
        const modId = entry.moduleId || 'unknown';
        if (!statsByModule[modId]) {
          statsByModule[modId] = { count: 0, totalScore: 0, latestEntry: entry };
        }
        
        const scoreParts = entry.score.split('/');
        const score = parseInt(scoreParts[0]) || 0;
        statsByModule[modId].count += 1;
        statsByModule[modId].totalScore += score;
      });

      const today = new Date().toLocaleDateString('ru-RU');
      const summaries: string[] = [];
      let currentSummary = `<b>📊 Сводный отчет о результатах тестирования на ${today}</b>\n\n`;
      if (isAuto) {
        currentSummary = `Автоматическая отправка отчёта (каждые 20 сессий).\n` + currentSummary;
      }

      const getRecentScoresWithDates = (modId: string, isPbotosAggregated = false) => {
        let entries: QuizHistoryEntry[] = [];
        if (isPbotosAggregated) {
          const pbotosSubIds = Object.keys(PBOTOS_SUBMODULES);
          entries = contestantHistory.filter(h => h.moduleId === 'pbotos' || (h.moduleId && pbotosSubIds.includes(h.moduleId)));
        } else {
          entries = contestantHistory.filter(h => h.moduleId === modId);
        }
        
        if (entries.length === 0) return '';
        // fullHistory is sorted desc (newest first). last 3 entries = top 3.
        // We want to display oldest of the 3 first, so we reverse it.
        const last3 = entries.slice(0, 3).reverse();
        const scores = last3.map(h => {
          const [correct, total] = h.score.split('/').map(Number);
          if (isNaN(correct) || isNaN(total) || total === 0) return '0%';
          return Math.round((correct / total) * 100) + '%';
        });
        const dates = last3.map(h => {
          const d = new Date(h.date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const year = String(d.getFullYear()).slice(-2);
          return `${day}.${month}.${year}г.`;
        });
        return `${scores.join(', ')} (${dates.join(', ')})`;
      };

      const getRecentScoresCustom = (modId: string, isPbotosAggregated = false) => {
        let entries: QuizHistoryEntry[] = [];
        if (isPbotosAggregated) {
          const pbotosSubIds = Object.keys(PBOTOS_SUBMODULES);
          entries = contestantHistory.filter(h => h.moduleId === 'pbotos' || (h.moduleId && pbotosSubIds.includes(h.moduleId)));
        } else {
          entries = contestantHistory.filter(h => h.moduleId === modId);
        }
        if (entries.length === 0) return '';
        // We take the last 5 results (newest first) and reverse them so we display them chronological (oldest first).
        const last5 = entries.slice(0, 5).reverse();
        return last5.map(h => {
          const [correct, total] = h.score.split('/').map(Number);
          const pct = (isNaN(correct) || isNaN(total) || total === 0) ? 0 : Math.round((correct / total) * 100);
          
          const d = new Date(h.date);
          const day = String(d.getDate()).padStart(2, '0');
          const month = String(d.getMonth() + 1).padStart(2, '0');
          const dateStr = `${day}.${month}`;
          
          const numGreen = Math.min(10, Math.max(0, Math.round(pct / 10)));
          const progressBar = Array(numGreen).fill('▰').join('');
          
          return `${dateStr} ${progressBar}${pct}%`;
        }).join('\n   ');
      };

      const addSectionToSummary = (sectionToAdd: string) => {
        if (!sectionToAdd) return;
        const hasProgressBar = sectionToAdd.includes('▰') || sectionToAdd.includes('▱');
        if (currentSummary.length + sectionToAdd.length > 3900 || (hasProgressBar && currentSummary.trim().length > 0) || (currentSummary.includes('▰') && sectionToAdd.trim().length > 0)) {
          if (currentSummary.trim()) {
            summaries.push(currentSummary);
          }
          currentSummary = sectionToAdd;
        } else {
          currentSummary += sectionToAdd;
        }
      };

      // Проходим по модулям в заданном порядке (из constants.tsx)
      for (const module of MODULES) {
        const modId = module.id;
        
        if (modId === 'pbotos') {
          const hasPbotosData = statsByModule['pbotos'] || Object.keys(PBOTOS_SUBMODULES).some(subId => statsByModule[subId]);
          
          // Добавляем заголовок ПБОТОС, если есть хоть какие-то данные по нему
          if (hasPbotosData) {
            addSectionToSummary(`4. <b>ПБОТОС</b>\n\n`);
          }

          // Сначала выводим основной ПБОТОС если есть
          if (statsByModule['pbotos']) {
            let pbotosSection = '';
            const stats = statsByModule['pbotos'];
            const recentScoresStr = getRecentScoresCustom('pbotos', true);
            pbotosSection += `- <b>ПБОТОС (Сводный)</b>\n`;
            if (recentScoresStr) {
              pbotosSection += `   Последние результаты:\n   ${recentScoresStr}\n`;
            }
            pbotosSection += `\n`;
            addSectionToSummary(pbotosSection);
          }

          // Затем подразделы ПБОТОС
          for (const [subId, subTitle] of Object.entries(PBOTOS_SUBMODULES)) {
            if (statsByModule[subId]) {
              let pbotosSubSection = '';
              const stats = statsByModule[subId];
              const recentScoresStr = getRecentScoresCustom(subId);
              pbotosSubSection += `- <b>ПБОТОС/${subTitle}</b>\n`;
              if (recentScoresStr) {
                pbotosSubSection += `   Последние результаты:\n   ${recentScoresStr}\n`;
              }
              
              // Получаем количество вопросов из последнего теста
              const lastEntry = stats.latestEntry;
              if (lastEntry) {
                const scoreParts = lastEntry.score.split('/');
                const questionsInTest = parseInt(scoreParts[1]) || 0;
                const totalInDb = GLOBAL_QUESTION_COUNTS[subId] || 0;
                const questionsCompleted = questionViews[subId] !== undefined ? questionViews[subId] : questionsInTest;
                pbotosSubSection += `   Пройдено вопросов с начала подготовки: ${questionsCompleted} из ${totalInDb}\n`;
              }
              pbotosSubSection += `\n`;
              addSectionToSummary(pbotosSubSection);
            }
          }

          // Добавляем раздел "Критерии матрицы ТЗ" после ПБОТОС
          if (statsByModule['matrix-tz']) {
            let matrixSection = '';
            const stats = statsByModule['matrix-tz'];
            const recentScoresStr = getRecentScoresCustom('matrix-tz');
            matrixSection += `5. <b>Упражнение "Критерии матрицы ТЗ"</b>\n`;
            if (recentScoresStr) {
              matrixSection += `   Последние результаты:\n   ${recentScoresStr}\n`;
            }
            if (stats.latestEntry?.incorrectAnswers && stats.latestEntry.incorrectAnswers.length > 0) {
              matrixSection += `<blockquote expandable>`;
              matrixSection += `<b>Ошибки в последней сессии:</b>\n\n`;
              stats.latestEntry.incorrectAnswers.forEach((ans, idx) => {
                matrixSection += `<b>${idx + 1}. ${escapeHTML(ans.question)}</b>\n`;
                matrixSection += `❌ Ваш ответ: ${formatTelegramUserAnswer(ans.userAnswer, escapeHTML)}\n`;
                matrixSection += `✅ Правильный: ${escapeHTML(ans.correctAnswer)}\n\n`;
              });
              matrixSection += `</blockquote>`;
            }
            matrixSection += `\n`;
            addSectionToSummary(matrixSection);
          }

          // Добавляем раздел "Код АСПО" в конец уведомления
          if (statsByModule['aspo-code']) {
            let aspoSection = '';
            const stats = statsByModule['aspo-code'];
            const recentScoresStr = getRecentScoresCustom('aspo-code');
            aspoSection += `6. <b>Упражнение "Код АСПО"</b>\n`;
            if (recentScoresStr) {
              aspoSection += `   Последние результаты:\n   ${recentScoresStr}\n`;
            }
            if (stats.latestEntry?.incorrectAnswers && stats.latestEntry.incorrectAnswers.length > 0) {
              aspoSection += `<blockquote expandable>`;
              aspoSection += `<b>Ошибки в последней сессии:</b>\n\n`;
              stats.latestEntry.incorrectAnswers.forEach((ans, idx) => {
                aspoSection += `<b>${idx + 1}. ${escapeHTML(ans.question)}</b>\n`;
                aspoSection += `❌ Ваш ответ: ${formatTelegramUserAnswer(ans.userAnswer, escapeHTML)}\n`;
                aspoSection += `✅ Правильный: ${escapeHTML(ans.correctAnswer)}\n\n`;
              });
              aspoSection += `</blockquote>`;
            }
            aspoSection += `\n`;
            addSectionToSummary(aspoSection);
          }

          // Добавляем раздел "Код воды (КФ)" в конец уведомления
          if (statsByModule['water-kf']) {
            let waterKfSection = '';
            const stats = statsByModule['water-kf'];
            const recentScoresStr = getRecentScoresCustom('water-kf');
            waterKfSection += `7. <b>Упражнение "Код воды (КФ)"</b>\n`;
            if (recentScoresStr) {
              waterKfSection += `   Последние результаты:\n   ${recentScoresStr}\n`;
            }
            if (stats.latestEntry?.incorrectAnswers && stats.latestEntry.incorrectAnswers.length > 0) {
              waterKfSection += `<blockquote expandable>`;
              waterKfSection += `<b>Ошибки в последней сессии:</b>\n\n`;
              stats.latestEntry.incorrectAnswers.forEach((ans, idx) => {
                waterKfSection += `<b>${idx + 1}. ${escapeHTML(ans.question)}</b>\n`;
                waterKfSection += `❌ Ваш ответ: ${formatTelegramUserAnswer(ans.userAnswer, escapeHTML)}\n`;
                waterKfSection += `✅ Правильный: ${escapeHTML(ans.correctAnswer)}\n\n`;
              });
              waterKfSection += `</blockquote>`;
            }
            waterKfSection += `\n`;
            addSectionToSummary(waterKfSection);
          }
        } else {
          // Обычные модули
          if (statsByModule[modId]) {
            let section = '';
            const stats = statsByModule[modId];
            
            const isCustomFormat = ['esp-selection-startup', 'failure-investigation', 'operating-factors'].includes(modId);
            
            let emoji = '🔹';
            if (modId === 'esp-selection-startup') emoji = '1.';
            if (modId === 'failure-investigation') emoji = '2.';
            if (modId === 'operating-factors') emoji = '3.';
            
            section += `${emoji} <b>${module.title}</b>\n`;
            
            if (isCustomFormat) {
              const recentScoresStr = getRecentScoresCustom(modId);
              if (recentScoresStr) {
                section += `   Последние результаты:\n   ${recentScoresStr}\n`;
              }
            } else {
              const recentScoresStr = getRecentScoresWithDates(modId);
              if (recentScoresStr) {
                section += `   Последние результаты: ${recentScoresStr}\n`;
              }
            }

            // Добавляем информацию о количестве вопросов
            const lastEntry = stats.latestEntry;
            if (lastEntry) {
              const scoreParts = lastEntry.score.split('/');
              const questionsInTest = parseInt(scoreParts[1]) || 0;
              const totalInDb = GLOBAL_QUESTION_COUNTS[modId] || 0;
              if (totalInDb > 0) {
                const questionsCompleted = questionViews[modId] !== undefined ? questionViews[modId] : questionsInTest;
                section += `   Пройдено вопросов с начала подготовки: ${questionsCompleted} из ${totalInDb}\n`;
              }
            }

            if (stats.latestEntry?.incorrectAnswers && stats.latestEntry.incorrectAnswers.length > 0) {
              section += `<blockquote expandable>`;
              section += `<b>Ошибки в последнем тесте:</b>\n\n`;
              stats.latestEntry.incorrectAnswers.forEach((ans, idx) => {
                section += `<b>${idx + 1}. ${escapeHTML(ans.question)}</b>\n`;
                section += `❌ Ваш ответ: ${formatTelegramUserAnswer(ans.userAnswer, escapeHTML)}\n`;
                section += `✅ Правильный: ${escapeHTML(ans.correctAnswer)}\n\n`;
              });
              section += `</blockquote>`;
            }
            section += `\n`;
            addSectionToSummary(section);
          }
        }
      }

      if (currentSummary.trim()) {
        summaries.push(currentSummary);
      }

      for (const summaryPart of summaries) {
        if (!summaryPart.trim()) continue;
        
        const response = await fetch('/api/telegram/send-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ summary: summaryPart }),
        });

        if (!response.ok) {
          const errData = await response.json();
          throw new Error(errData.error || 'Failed to send');
        }
        
        // Небольшая пауза между отправкой сообщений
        await new Promise(resolve => setTimeout(resolve, 300));
      }
      
      if (!isAuto) {
        setTelegramStatus('success');
        setTimeout(() => setTelegramStatus('idle'), 3000);
      }
    } catch (error: any) {
      console.error(error);
      if (!isAuto) {
        alert(`Ошибка отправки: ${error.message}`);
        setTelegramStatus('error');
        setTimeout(() => setTelegramStatus('idle'), 3000);
      }
    }
  };

  const sendHistoryRef = useRef<((isAuto?: boolean) => Promise<void>) | null>(null);
  useEffect(() => {
    sendHistoryRef.current = sendHistoryToTelegram;
  });

  useEffect(() => {
    const handleSessionCompleted = () => {
      if (userRole === 'contestant_operator') return;
      let count = parseInt(localStorage.getItem('telegram_auto_report_count') || '0', 10);
      count++;
      if (count >= 20) {
        localStorage.setItem('telegram_auto_report_count', '0');
        if (sendHistoryRef.current) {
          sendHistoryRef.current(true);
        }
      } else {
        localStorage.setItem('telegram_auto_report_count', String(count));
      }
    };
    window.addEventListener('sessionCompleted', handleSessionCompleted);
    return () => window.removeEventListener('sessionCompleted', handleSessionCompleted);
  }, [userRole]);

  const loadData = async () => {
    setSyncStatus('syncing');
    const latestProgress: Record<string, number> = {};
    MODULES.forEach(m => latestProgress[m.id] = 0);

    let history: QuizHistoryEntry[] = [];
    
    try {
      // Fetch history
      const historyResponse = await fetch('/api/history');
      if (historyResponse.ok) {
        history = await historyResponse.json();
      } else {
        const savedHistory = localStorage.getItem('quizHistory');
        if (savedHistory) history = JSON.parse(savedHistory);
      }

      // Fetch global config
      const configResponse = await fetch('/api/config');
      if (configResponse.ok) {
        const config = await configResponse.json();
        if (config.isHistoryAnswersEnabled !== undefined) {
          const isEnabled = config.isHistoryAnswersEnabled === true || config.isHistoryAnswersEnabled === 'true';
          setIsHistoryAnswersEnabled(isEnabled);
          localStorage.setItem('app_history_answers_enabled', String(isEnabled));
        }
      }
    } catch (error) {
      console.warn("Error loading data from cloud:", error);
      setSyncStatus('error');
      const savedHistory = localStorage.getItem('quizHistory');
      if (savedHistory) history = JSON.parse(savedHistory);
    }

    // Enforce limits on loaded history
    if (history.length > 0) {
      if (history.length > 250) {
        history = history.slice(0, 250);
      }
      
      const userName = localStorage.getItem('app_user_name') || 'Contestant';
      // Better to group by all users and limit each user to 80
      const userCounts: Record<string, number> = {};
      const newHistory: QuizHistoryEntry[] = [];
      
      for (const h of history) {
        const u = h.user || 'Contestant';
        userCounts[u] = (userCounts[u] || 0) + 1;
        if (userCounts[u] <= 80) {
          newHistory.push(h);
        }
      }
      history = newHistory;
      
      // Update local storage if it was altered
      localStorage.setItem('quizHistory', JSON.stringify(history));
    }

    setFullHistory(history);
    setSyncStatus('synced');
    
    const recentScoresMap: Record<string, number[]> = {};
    
    const userRelevantHistory = history.filter((h: QuizHistoryEntry) => {
      if (userRole === 'contestant_operator') {
        return h.user === 'ContestantOperator' || h.user === 'Конкурсант (Оператор)';
      } else if (userRole === 'admin') {
        if (accountFilter === 'contestant_operator') {
          return h.user === 'ContestantOperator' || h.user === 'Конкурсант (Оператор)';
        } else if (accountFilter === 'admin') {
          return h.user === 'admin' || h.user === 'Администратор';
        } else if (accountFilter === 'contestant') {
          return h.user !== 'admin' && h.user !== 'Администратор' && h.user !== 'ContestantOperator' && h.user !== 'Конкурсант (Оператор)';
        }
        return true;
      } else {
        // Contestant (Technologist)
        return h.user !== 'admin' && h.user !== 'Администратор' && h.user !== 'ContestantOperator' && h.user !== 'Конкурсант (Оператор)';
      }
    });

    MODULES.forEach(module => {
      // For pbotos, we want to consider all submodules too
      let moduleEntries: QuizHistoryEntry[] = [];
      if (module.id === 'pbotos') {
        const pbotosSubIds = Object.keys(PBOTOS_SUBMODULES);
        moduleEntries = userRelevantHistory.filter((h: QuizHistoryEntry) => 
          h.moduleId === 'pbotos' || (h.moduleId && pbotosSubIds.includes(h.moduleId))
        );
      } else {
        moduleEntries = userRelevantHistory.filter((h: QuizHistoryEntry) => h.moduleId === module.id);
      }

      const lastEntry = moduleEntries[0]; // history is sorted by date desc
      
      if (lastEntry && lastEntry.score) {
        const [correct, total] = lastEntry.score.split('/').map(Number);
        if (!isNaN(correct) && !isNaN(total) && total > 0) {
          latestProgress[module.id] = Math.round((correct / total) * 100);
        }
      }
      
      // Calculate last 3 scores
      const last3 = moduleEntries.slice(0, 3).reverse().map((h: QuizHistoryEntry) => {
        const [correct, total] = h.score.split('/').map(Number);
        return Math.round((correct / total) * 100);
      });
      recentScoresMap[module.id] = last3;
    });
    
    setModuleProgress(latestProgress);
    setModuleRecentScores(recentScoresMap);
  };

  const handleLogout = () => {
    localStorage.removeItem('app_user_role');
    localStorage.removeItem('app_remember_me');
    sessionStorage.removeItem('app_admin_password');
    setUserRole(null);
    setIsAuthorized(false);
    setAdminPassword('');
    setActiveTab('home');
  };

  useEffect(() => {
    if (isAuthorized) {
      loadData();
      const handleStorageChange = () => loadData();
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [isAuthorized]);

  const totalCourseProgress = useMemo(() => {
    const sum = MODULES.reduce((acc, module) => acc + (moduleProgress[module.id] || 0), 0);
    return Math.round(sum / MODULES.length);
  }, [moduleProgress]);

  const handleAuthorize = (role: 'contestant' | 'contestant_operator' | 'admin', password?: string) => {
    setUserRole(role);
    if (role === 'contestant') {
      localStorage.setItem('app_user_name', 'Contestant');
    } else if (role === 'contestant_operator') {
      localStorage.setItem('app_user_name', 'ContestantOperator');
    } else if (role === 'admin') {
      localStorage.setItem('app_user_name', 'Администратор');
      if (password) {
        setAdminPassword(password);
        sessionStorage.setItem('app_admin_password', password);
      }
    }
    setIsAuthorized(true);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const toggleTimer = () => {
    const newValue = !isTimerEnabled;
    setIsTimerEnabled(newValue);
    localStorage.setItem('app_timer_enabled', String(newValue));
  };

  const toggleHighlight = () => {
    const newValue = !isHighlightEnabled;
    setIsHighlightEnabled(newValue);
    localStorage.setItem('app_highlight_enabled', String(newValue));
  };

  const updateConfig = async (key: string, value: any) => {
    if (userRole !== 'admin') return;
    
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-admin-password': adminPassword
        },
        body: JSON.stringify({ key, value })
      });
    } catch (error) {
      console.error(`Failed to sync global config for ${key}:`, error);
    }
  };

  const toggleHistoryAnswers = async () => {
    const newValue = !isHistoryAnswersEnabled;
    setIsHistoryAnswersEnabled(newValue);
    localStorage.setItem('app_history_answers_enabled', String(newValue));
    
    // Sync with global config if admin
    if (userRole === 'admin') {
      updateConfig('isHistoryAnswersEnabled', newValue);
    }
  };


  const handleClearGlobalHistoryClick = () => {
    if (userRole !== 'admin') {
      alert('У вас нет прав для очистки глобальной истории.');
      return;
    }
    setClearHistoryPasswordInput('');
    setClearHistoryError('');
    setShowClearHistoryModal(true);
  };

  const executeClearGlobalHistory = async () => {
    if (clearHistoryPasswordInput !== '----') {
      setClearHistoryError('Неверный пароль!');
      return;
    }

    console.log("Attempting to clear global history after correct password verification...");
    setShowClearHistoryModal(false);
    setSyncStatus('syncing');
    try {
      const response = await fetch('/api/history', { 
        method: 'DELETE',
        headers: { 'x-admin-password': adminPassword }
      });
      const result = await response.json();
      
      if (response.ok) {
        localStorage.removeItem('quizHistory');
        MODULES.forEach(m => {
          localStorage.removeItem(`quizSessionNum_${m.id}`);
        });
        
        await loadData();
        window.dispatchEvent(new Event('storage'));
        alert(`✅  База очищена. Удалено записей: ${result.deletedCount || 0}`);
      } else {
        alert('❌ Ошибка при удалении из облака: ' + (result.error || 'Неизвестная ошибка'));
        setSyncStatus('error');
      }
    } catch (error: any) {
      console.error("Clear history error:", error);
      alert('❌ Ошибка сети: ' + error.message);
      setSyncStatus('error');
    }
  };

  const isDark = theme === 'dark';

  const [showAdminOnlyAlert, setShowAdminOnlyAlert] = useState(false);

  const handleAdminOnlyClick = () => {
    setShowAdminOnlyAlert(true);
  };

  const getAccountFilterLabel = () => {
    if (accountFilter === 'all') return 'Все аккаунты';
    if (accountFilter === 'contestant') return 'Конкурсант (Технолог)';
    if (accountFilter === 'contestant_operator') return 'Конкурсант (Оператор)';
    if (accountFilter === 'admin') return 'Администратор';
    return 'Аккаунт';
  };

  const renderAccountFilter = (isOpen: boolean, setIsOpen: (open: boolean) => void) => {
    if (userRole !== 'admin') return null;
    return (
      <div className="flex-shrink-0 mb-3 relative z-50">
        <button 
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full py-3 px-4 rounded-xl flex items-center justify-between shadow-sm border transition-all active:scale-[0.98]
            ${isDark 
              ? 'bg-[#182133] border-white/5 text-white' 
              : 'bg-white border-slate-200 text-slate-800'}`}
        >
          <div className="flex items-center gap-3">
            <svg className={`w-4 h-4 opacity-70 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
            </svg>
            <div className="flex flex-col items-start gap-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'} leading-none`}>
                Фильтр по аккаунту
              </span>
              <span className="text-xs font-bold leading-none">{getAccountFilterLabel()}</span>
            </div>
          </div>
          <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="3">
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        
        <AnimatePresence>
          {isOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 right-0 mt-2 rounded-2xl shadow-xl overflow-hidden border
                ${isDark ? 'bg-[#1e293b] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <button 
                onClick={() => { setAccountFilter('all'); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                  ${accountFilter === 'all' 
                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white') 
                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
              >
                Все аккаунты
                {accountFilter === 'all' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </button>
              <button 
                onClick={() => { setAccountFilter('contestant'); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                  ${accountFilter === 'contestant' 
                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white') 
                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
              >
                Конкурсант (Технолог)
                {accountFilter === 'contestant' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </button>
              <button 
                onClick={() => { setAccountFilter('contestant_operator'); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                  ${accountFilter === 'contestant_operator' 
                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white') 
                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
              >
                Конкурсант (Оператор)
                {accountFilter === 'contestant_operator' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </button>
              <button 
                onClick={() => { setAccountFilter('admin'); setIsOpen(false); }}
                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                  ${accountFilter === 'admin' 
                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white') 
                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
              >
                Администратор
                {accountFilter === 'admin' && (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
                )}
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  const renderContent = () => {
    const key = `${activeTab}-${selectedModule ? 'modal' : 'main'}-${activeGame ? 'game' : 'none'}`;

    return (
      <AnimatePresence mode="wait">
        <motion.div 
          key={key}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="flex-1 flex flex-col overflow-hidden"
        >
          {(() => {
            switch (activeTab) {
              case 'home':
                return (
                  <div className="flex-1 flex flex-col px-4 pb-2 gap-3 overflow-hidden">
                    <div className="flex flex-col gap-2 flex-shrink-0">
                      <AnimatedContent distance={30} delay={0.1} direction="vertical">
                        <div className={`w-full p-4 rounded-3xl border backdrop-blur-md relative overflow-hidden group flex items-center justify-between transition-all shadow-md
                          ${isDark ? 'bg-slate-800 border-slate-700 shadow-black/40 text-white' : 'bg-white border-slate-200 shadow-slate-300 text-slate-900'}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors
                              ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                              <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                <path d="M9 14l2 2 4-4" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-black">Раздел</span>
                              <span className="font-bold text-sm">Тестирование</span>
                            </div>
                          </div>
                        </div>
                      </AnimatedContent>
                    </div>

                    <div className="grid grid-cols-2 gap-3 flex-1 min-h-0 overflow-y-auto px-1 -mx-1 pt-1 -mt-1 pb-8 relative z-10">
                      {MODULES.map((m, index) => (
                        <AnimatedContent
                          key={m.id}
                          distance={40}
                          delay={0.2 + index * 0.1}
                          direction="vertical"
                        >
                          <GlassButton 
                            title={m.id === 'failure-investigation' ? 'Расследование отказов' : m.title}
                            iconType={m.icon}
                            progress={moduleProgress[m.id] || 0}
                            recentScores={moduleRecentScores[m.id] || []}
                            questionCount={GLOBAL_QUESTION_COUNTS[m.id]}
                            onClick={() => setSelectedModule(m)}
                            theme={theme}
                          />
                        </AnimatedContent>
                      ))}
                    </div>

                    <div className="flex flex-col gap-2 flex-shrink-0 mt-2">
                      <AnimatedContent distance={30} delay={0.8} direction="vertical">
                        <motion.button 
                          onClick={handleTasksClick}
                          animate={{ scale: isTasksPressed ? 0.95 : 1 }}
                          transition={{ duration: 0.15, ease: "easeInOut" }}
                          className={`w-full p-4 rounded-3xl border backdrop-blur-md relative overflow-hidden group flex items-center justify-between transition-all shadow-md hover:shadow-xl hover:-translate-y-0.5
                            ${isDark ? 'bg-slate-800 border-slate-700 shadow-black/40 hover:bg-slate-700 text-white' : 'bg-white border-slate-200 shadow-slate-300 hover:bg-slate-50 text-slate-900'}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border transition-colors
                              ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                              <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <rect x="3" y="5" width="18" height="11" rx="1" />
                                <path d="M2 18h20" />
                                <circle cx="8" cy="10.5" r="2.2" />
                                <path d="M8 8.3v4.4M5.8 10.5h4.4" />
                                <path d="M6.5 9l3 3M9.5 9l-3 3" />
                                <path d="M13 14v-2M15.5 14v-4M18 14v-6" />
                                <path d="M12.5 10l3.5-3.5 3 2" />
                                <path d="M6 14h3" opacity="0.5" />
                              </svg>
                            </div>
                            <div className="flex flex-col items-start">
                              <span className="text-[9px] uppercase tracking-widest text-indigo-500 font-black">Раздел</span>
                              <span className="font-bold text-sm">Упражнения</span>
                            </div>
                          </div>
                          <svg viewBox="0 0 24 24" className={`w-5 h-5 opacity-30 group-hover:opacity-100 transition-opacity ${isDark ? 'text-white' : 'text-slate-900'}`} fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M9 5l7 7-7 7" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </motion.button>
                      </AnimatedContent>
                    </div>
                  </div>
                );
              case 'history':
                const getFilterLabel = (filterVal: string) => {
                  if (filterVal === 'all') return 'Все разделы';
                  if (filterVal === 'water-kf') return 'Код воды (КФ)';
                  if (filterVal === 'matrix-tz') return 'Матрица ТЗ';
                  if (filterVal === 'aspo-code') return 'Код АСПО';
                  if (filterVal === 'pbotos-all' || filterVal === 'pbotos') return 'ПБОТОС';
                  const matchedModule = MODULES.find(m => m.id === filterVal);
                  if (matchedModule) {
                    return matchedModule.id === 'failure-investigation' ? 'Расследование отказов' : (matchedModule.id === 'esp-selection-startup' ? 'Подбор УЭЦН и ВНР' : matchedModule.title);
                  }
                  const pbotosTitle = PBOTOS_SUBMODULES[filterVal];
                  if (pbotosTitle) {
                    return `ПБОТОС / ${filterVal === 'pbotos-b21' ? 'Б.2.1' : pbotosTitle}`;
                  }
                  return filterVal;
                };

                const filteredHistory = (() => {
                  if (historyFilter === 'all') return baseHistory;
                  if (historyFilter === 'pbotos-all' || historyFilter === 'pbotos') {
                    const pbotosSubIds = Object.keys(PBOTOS_SUBMODULES);
                    return baseHistory.filter(h => h.moduleId === 'pbotos' || (h.moduleId && pbotosSubIds.includes(h.moduleId)));
                  }
                  return baseHistory.filter(h => h.moduleId === historyFilter);
                })();

                return (
                  <div className="flex-1 flex flex-col overflow-hidden px-4">
                    {/* Account Filter Dropdown (Admin only) */}
                    {renderAccountFilter(isAccountFilterOpen, setIsAccountFilterOpen)}

                    {/* Vertical Filter Dropdown */}
                    <div className="flex-shrink-0 mb-4 relative z-40">
                      <button
                        onClick={() => setIsHistoryFilterOpen(!isHistoryFilterOpen)}
                        className={`w-full py-3 px-4 rounded-xl flex items-center justify-between shadow-sm border transition-all active:scale-[0.98]
                          ${isDark 
                            ? 'bg-[#182133] border-white/5 text-white' 
                            : 'bg-white border-slate-200 text-slate-800'}`}
                      >
                        <div className="flex items-center gap-3">
                          <svg className={`w-4 h-4 opacity-70 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                            <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3" />
                          </svg>
                          <div className="flex flex-col items-start gap-1">
                            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'} leading-none`}>
                              Фильтр по разделу
                            </span>
                            <span className="text-xs font-bold leading-none">{getFilterLabel(historyFilter)}</span>
                          </div>
                        </div>
                        <svg viewBox="0 0 24 24" className={`w-4 h-4 transition-transform ${isHistoryFilterOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" strokeWidth="3">
                          <polyline points="6 9 12 15 18 9" />
                        </svg>
                      </button>

                      <AnimatePresence>
                        {isHistoryFilterOpen && (
                          <motion.div
                            initial={{ opacity: 0, height: 0, marginTop: 0 }}
                            animate={{ opacity: 1, height: "auto", marginTop: 8 }}
                            exit={{ opacity: 0, height: 0, marginTop: 0 }}
                            transition={{ duration: 0.25, ease: "easeInOut" }}
                            className={`overflow-hidden rounded-2xl border absolute left-0 right-0 shadow-2xl max-h-80 overflow-y-auto no-scrollbar
                              ${isDark ? 'bg-slate-900 border-white/10 backdrop-blur-md' : 'bg-white border-slate-200 backdrop-blur-md'}`}
                          >
                            <div className="p-2 flex flex-col gap-1">
                              {/* Option All */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('all');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'all'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Все разделы</span>
                                {historyFilter === 'all' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Header: Раздел "Тестирование" (underlined, informative, not clickable) */}
                              <div className={`px-4 pt-3 pb-1 text-[11px] font-black uppercase tracking-wider underline
                                ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Раздел &ldquo;Тестирование&rdquo;
                              </div>

                              {/* Option: Подбор УЭЦН и ВНР */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('esp-selection-startup');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'esp-selection-startup'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Подбор УЭЦН и ВНР</span>
                                {historyFilter === 'esp-selection-startup' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Option: Расследование отказов */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('failure-investigation');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'failure-investigation'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Расследование отказов</span>
                                {historyFilter === 'failure-investigation' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Option: Осложняющие факторы */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('operating-factors');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'operating-factors'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Осложняющие факторы</span>
                                {historyFilter === 'operating-factors' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Option: ПБОТОС */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('pbotos-all');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'pbotos-all' || historyFilter === 'pbotos'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>ПБОТОС</span>
                                {(historyFilter === 'pbotos-all' || historyFilter === 'pbotos') && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              {/* Header: Раздел "Упражнения" (underlined, informative, not clickable) */}
                              <div className={`px-4 pt-3 pb-1 text-[11px] font-black uppercase tracking-wider underline
                                ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                                Раздел &ldquo;Упражнения&rdquo;
                              </div>

                              {/* Option: Матрица ТЗ */}
                              <button
                                onClick={() => {
                                  setHistoryFilter('matrix-tz');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'matrix-tz'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Матрица ТЗ</span>
                                {historyFilter === 'matrix-tz' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                              
                              <button
                                onClick={() => {
                                  setHistoryFilter('aspo-code');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'aspo-code'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Код АСПО</span>
                                {historyFilter === 'aspo-code' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>

                              <button
                                onClick={() => {
                                  setHistoryFilter('water-kf');
                                  setIsHistoryFilterOpen(false);
                                }}
                                className={`w-full text-left px-4 py-3 rounded-xl text-xs font-bold transition-all flex items-center justify-between pl-6
                                  ${historyFilter === 'water-kf'
                                    ? (isDark ? 'bg-indigo-500 text-white' : 'bg-slate-800 text-white')
                                    : (isDark ? 'hover:bg-white/5 text-slate-300' : 'hover:bg-slate-50 text-slate-700')}`}
                              >
                                <span>Код воды (КФ)</span>
                                {historyFilter === 'water-kf' && (
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="3">
                                    <polyline points="20 6 9 17 4 12" />
                                  </svg>
                                )}
                              </button>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    <div key={historyFilter} className="flex-1 overflow-y-auto space-y-3 pb-24 pr-1">
                      {filteredHistory.length === 0 ? (
                        <AnimatedContent distance={20} delay={0.2}>
                          <div className={`flex flex-col items-center justify-center py-24 italic text-sm text-center
                            ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                            <svg viewBox="0 0 24 24" className="w-12 h-12 mb-4 opacity-10" fill="none" stroke="currentColor" strokeWidth="1">
                              <circle cx="12" cy="12" r="10" />
                              <polyline points="12 6 12 12 16 14" />
                            </svg>
                            {historyFilter === 'all' ? 'История тестирований пуста' : 'В этом разделе еще нет результатов'}
                          </div>
                        </AnimatedContent>
                      ) : (
                        filteredHistory.map((entry, idx) => {
                          const LEGACY_MODULE_MAPPING: Record<string, string> = {
                            'esp-selection': 'Подбор УЭЦН и ВНР',
                            'esp-startup': 'Подбор УЭЦН и ВНР',
                            'vnr': 'Подбор УЭЦН и ВНР',
                            'esp-selection-startup': 'Подбор УЭЦН и ВНР'
                          };

                          const module = MODULES.find(m => m.id === entry.moduleId);
                          
                          let displayTitle = module?.title?.replace('\n', ' ') || entry.moduleId || 'Общий тест';
                          if (entry.moduleId === 'matrix-tz') {
                            displayTitle = 'Матрица ТЗ';
                          } else if (entry.moduleId === 'aspo-code') {
                            displayTitle = 'Код АСПО';
                          } else if (entry.moduleId === 'water-kf') {
                            displayTitle = 'Код воды (КФ)';
                          }
                          
                          if (entry.moduleId && PBOTOS_SUBMODULES[entry.moduleId]) {
                            displayTitle = `ПБОТОС / ${PBOTOS_SUBMODULES[entry.moduleId]}`;
                          } else if (entry.moduleId && LEGACY_MODULE_MAPPING[entry.moduleId]) {
                            displayTitle = LEGACY_MODULE_MAPPING[entry.moduleId];
                          } else if (entry.moduleId === 'pbotos') {
                            displayTitle = 'ПБОТОС';
                          }

                          const [correct, total] = entry.score.split('/').map(Number);
                          const isSuccess = total ? (correct / total) >= 0.8 : correct >= 8;
                          // Show answers if user is admin OR if history answers are enabled for contestants
                          const showCorrectAnswers = userRole === 'admin' || isHistoryAnswersEnabled;
                          
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
                            <AnimatedContent key={idx} distance={30} delay={idx * 0.05}>
                              <div className={`p-5 rounded-2xl border relative overflow-hidden group
                                ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                                {isSuccess && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>}
                                
                                <div className="flex justify-between items-start mb-3">
                                  <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                                      {displayTitle} • Сессия {entry.session}
                                    </span>
                                    <span className={`text-[10px] font-bold ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{formattedDate}</span>
                                  </div>
                                  <div className="flex flex-col items-end">
                                    <span className={`text-xl font-black ${isSuccess ? 'text-green-500' : 'text-indigo-500'}`}>{entry.score}</span>
                                  </div>
                                </div>
                                
                                {entry.incorrectAnswers && entry.incorrectAnswers.length > 0 && (
                                  <details className="mt-2 group/err">
                                    <summary className="list-none flex items-center gap-1 text-[9px] uppercase font-black text-red-400/60 tracking-widest cursor-pointer active:text-red-400">
                                      Разбор ошибок ({entry.incorrectAnswers.length})
                                      <svg viewBox="0 0 24 24" className="w-3 h-3 transition-transform group-open/err:rotate-180" fill="none" stroke="currentColor" strokeWidth="3">
                                        <path d="M19 9l-7 7-7-7" />
                                      </svg>
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                      {entry.incorrectAnswers.map((err, i) => {
                                        const cleanUserAnswer = entry.moduleId === 'water-kf' ? err.userAnswer.replace(/Шифр:/g, 'Код:') : err.userAnswer;
                                        const cleanCorrectAnswer = entry.moduleId === 'water-kf' ? err.correctAnswer.replace(/Шифр:/g, 'Код:') : err.correctAnswer;
                                        return (
                                          <div key={i} className={`text-[11px] space-y-1 p-3 rounded-xl border
                                            ${isDark ? 'bg-black/20 border-white/10' : 'bg-slate-50 border-slate-100'}`}>
                                            {err.question && err.question.includes('|') ? (
                                              <div className="w-full mb-2 overflow-hidden rounded border border-slate-600 bg-slate-500/5">
                                                <table className="w-full text-left border-collapse">
                                                  <tbody>
                                                    {err.question.split('|').map((row: string, rIdx: number) => (
                                                      <tr key={rIdx} className="border-b border-slate-600 last:border-0 hover:bg-slate-500/10 transition-colors">
                                                        <td className={`p-2 font-medium text-xs ${isDark ? 'text-white' : 'text-slate-900'}`}>
                                                          {row}
                                                        </td>
                                                      </tr>
                                                    ))}
                                                  </tbody>
                                                </table>
                                              </div>
                                            ) : (
                                              <p className={`font-bold leading-tight ${isDark ? 'text-white/80' : 'text-slate-800'}`}>«{err.question}»</p>
                                            )}
                                            <div className="flex flex-col gap-1 mt-2">
                                              <div className="flex gap-2">
                                                <span className="text-red-400/80 font-bold uppercase text-[7px] px-1 py-0.5 bg-red-500/10 rounded self-start mt-0.5">Ваш выбор</span>
                                                {renderUserAnswerLines(cleanUserAnswer, isDark)}
                                              </div>
                                              {showCorrectAnswers && (
                                                <div className="flex gap-2">
                                                 <span className="text-green-500 font-bold uppercase text-[7px] px-1 py-0.5 bg-green-500/10 rounded self-start mt-0.5">Верно</span>
                                                 <span className={`flex flex-col gap-1 ${isDark ? 'text-green-300/80' : 'text-green-600'}`}>
                                                   {(cleanCorrectAnswer.includes('|||') ? cleanCorrectAnswer.split('|||') : cleanCorrectAnswer.includes('\n') ? cleanCorrectAnswer.split('\n') : [cleanCorrectAnswer]).map((ans, aIdx) => (
                                                     <div key={aIdx}>+ {ans}</div>
                                                   ))}
                                                 </span>
                                               </div>
                                              )}
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </details>
                                )}
                              </div>
                            </AnimatedContent>
                          );
                        })
                      )}
                    </div>
                    {fullHistory.length > 0 && userRole === 'admin' && (
                      <AnimatedContent distance={20} delay={0.5} direction="vertical" className="p-4 pt-0">
                        <button 
                          onClick={handleClearGlobalHistoryClick}
                          className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                            ${isDark ? 'bg-red-500/5 border-red-500/10 text-red-500/50 active:bg-red-500 active:text-white' : 'bg-red-50 border-red-100 text-red-600 active:bg-red-600 active:text-white'}`}
                        >
                          Очистить всю историю (Admin)
                        </button>
                      </AnimatedContent>
                    )}
                  </div>
                );
              case 'profile':
                return (
                  <div className="flex flex-col p-4 h-full overflow-y-auto space-y-3 pb-24">
                    <AnimatedContent distance={30} delay={0.1} direction="vertical">
                      <div className={`p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Светлая тема</span>
                        <button 
                          onClick={toggleTheme}
                          className={`relative w-12 h-6 shrink-0 rounded-full transition-all duration-300 outline-none
                            ${!isDark ? 'bg-slate-800' : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
                        >
                          <div 
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                              ${!isDark ? 'left-7' : 'left-1'}`}
                          />
                        </button>
                      </div>
                    </AnimatedContent>

                    <AnimatedContent distance={20} delay={0.18} direction="vertical">
                      <p className={`text-[10px] font-black uppercase tracking-widest px-6 pt-2 pb-1 ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
                        Отображение для конкурсанта
                      </p>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.2} direction="vertical">
                      <div className={`p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Таймер ответа 30 сек.</span>
                        <button 
                          onClick={toggleTimer}
                          className={`relative w-12 h-6 shrink-0 rounded-full transition-all duration-300 outline-none
                            ${isTimerEnabled ? (isDark ? 'bg-slate-700' : 'bg-slate-800') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
                        >
                          <div 
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                              ${isTimerEnabled ? 'left-7' : 'left-1'}`}
                          />
                        </button>
                      </div>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.25} direction="vertical">
                      <div className={`p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Подсвечивать корректность после ответа</span>
                        <button 
                          onClick={toggleHighlight}
                          className={`relative w-12 h-6 shrink-0 rounded-full transition-all duration-300 outline-none
                            ${isHighlightEnabled ? (isDark ? 'bg-slate-700' : 'bg-slate-800') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
                        >
                          <div 
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                              ${isHighlightEnabled ? 'left-7' : 'left-1'}`}
                          />
                        </button>
                      </div>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.3} direction="vertical">
                      <div className={`p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <span className={`text-base font-semibold ${isDark ? 'text-white/90' : 'text-slate-900'}`}>Правильный ответ в истории</span>
                        <button 
                          onClick={toggleHistoryAnswers}
                          className={`relative w-12 h-6 shrink-0 rounded-full transition-all duration-300 outline-none
                            ${isHistoryAnswersEnabled ? (isDark ? 'bg-slate-700' : 'bg-slate-800') : (isDark ? 'bg-white/10' : 'bg-slate-200')}`}
                        >
                          <div 
                            className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-300 shadow-sm
                              ${isHistoryAnswersEnabled ? 'left-7' : 'left-1'}`}
                          />
                        </button>
                      </div>
                    </AnimatedContent>

                    {userRole !== 'contestant_operator' && (
                      <AnimatedContent distance={30} delay={0.35} direction="vertical">
                        <button 
                          onClick={() => {
                            if (sendHistoryRef.current) sendHistoryRef.current(false);
                          }}
                          disabled={telegramStatus === 'sending'}
                          className={`w-full p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md transition-all active:scale-[0.98]
                            ${isDark ? 'bg-indigo-500/10 border-indigo-500/20 text-white' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}
                            ${telegramStatus === 'sending' ? 'opacity-50 cursor-not-allowed' : ''}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center
                              ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                              {telegramStatus === 'sending' ? (
                                <svg className="animate-spin h-5 w-5 text-indigo-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                              ) : telegramStatus === 'success' ? (
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : telegramStatus === 'error' ? (
                                <svg viewBox="0 0 24 24" className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" strokeWidth="3">
                                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
                                </svg>
                              ) : (
                                <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 2L11 13M22 2L15 22L11 13M11 13L2 9L22 2" />
                                </svg>
                              )}
                            </div>
                            <span className="text-base font-semibold">
                              {telegramStatus === 'sending' ? 'Отправка...' : 
                               telegramStatus === 'success' ? 'Отправлено!' : 
                               telegramStatus === 'error' ? 'Ошибка!' : 'Отправить отчет в Telegram'}
                            </span>
                          </div>
                          <svg viewBox="0 0 24 24" className="w-5 h-5 opacity-30" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M9 18l6-6-6-6" />
                          </svg>
                        </button>
                      </AnimatedContent>
                    )}

                    <AnimatedContent distance={30} delay={0.4} direction="vertical">
                      <button 
                        onClick={handleLogout}
                        className={`w-full p-4 rounded-[2rem] border flex justify-between items-center backdrop-blur-md transition-all active:scale-[0.98]
                          ${isDark ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-red-50 border-red-100 text-red-600'}`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center
                            ${isDark ? 'bg-red-500/20' : 'bg-red-100'}`}>
                            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />
                            </svg>
                          </div>
                          <span className="text-base font-semibold">Выйти из аккаунта</span>
                        </div>
                      </button>
                    </AnimatedContent>
                  </div>
                );
              case 'progress':
                return (
                  <div className="flex-1 flex flex-col overflow-hidden px-4">
                    {renderAccountFilter(isProgressAccountFilterOpen, setIsProgressAccountFilterOpen)}
                    <ProgressDashboard history={baseHistory} isDark={isDark} />
                  </div>
                );
              case 'tasks':
                 return (
                  <div className="flex flex-col px-6 py-4 flex-1 overflow-y-auto space-y-4">
                    <AnimatedContent distance={30} delay={0.05} direction="vertical">
                      <div className={`p-6 rounded-[2.5rem] border flex flex-col backdrop-blur-md relative overflow-hidden group
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Код воды (КФ)</h3>
                        
                        <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Интерактивное упражнение
                        </p>
                        
                        <button 
                          onClick={() => setActiveGame('water_kf')}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all
                            ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-black/40' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-300'}`}
                        >
                          Запустить
                        </button>
                      </div>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.1} direction="vertical">
                      <div className={`p-6 rounded-[2.5rem] border flex flex-col backdrop-blur-md relative overflow-hidden group
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Код АСПО</h3>
                        
                        <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Интерактивное упражнение
                        </p>
                        
                        <button 
                          onClick={() => setActiveGame('aspo')}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all
                            ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-black/40' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-300'}`}
                        >
                          Запустить
                        </button>
                      </div>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.2} direction="vertical">
                      <div className={`p-6 rounded-[2.5rem] border flex flex-col backdrop-blur-md relative overflow-hidden group
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Критерии матрицы применимости технологий защиты</h3>
                        
                        <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Интерактивное упражнение
                        </p>
                        
                        <button 
                          onClick={() => setActiveGame('ninja')}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all
                            ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-black/40' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-300'}`}
                        >
                          Запустить
                        </button>
                      </div>
                    </AnimatedContent>

                    <AnimatedContent distance={30} delay={0.3} direction="vertical">
                      <div className={`p-6 rounded-[2.5rem] border flex flex-col backdrop-blur-md relative overflow-hidden group
                        ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
                        <h3 className={`text-xl font-black uppercase tracking-tight mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>Минеральные соли при эксплуатации</h3>
                        
                        <p className={`text-xs mb-6 leading-relaxed ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                        Интерактивное упражнение
                        </p>
                        
                        <button 
                          onClick={() => setActiveGame('sulfate')}
                          className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all
                            ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-black/40' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-300'}`}
                        >
                          Запустить
                        </button>
                      </div>
                    </AnimatedContent>
                  </div>
                );
            }
          })()}
        </motion.div>
      </AnimatePresence>
    );
  };

  const appBg = isDark ? 'bg-[#081221]' : 'bg-slate-50';

  return (
    <div className={`relative h-screen max-w-md mx-auto shadow-2xl flex flex-col overflow-hidden transition-all duration-500 ${appBg}`}>
      <div className="absolute top-4 right-4 z-[120]">
        <CloudStatus status={syncStatus} />
      </div>
      <AnimatePresence>
        {showAdminOnlyAlert && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-xs p-8 rounded-[2.5rem] border text-center shadow-2xl
                ${isDark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className={`w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6
                ${isDark ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-50 text-indigo-500'}`}>
                <svg viewBox="0 0 24 24" className="w-8 h-8" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
              </div>
              <h3 className={`text-lg font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Доступ ограничен
              </h3>
              <p className={`text-xs font-medium leading-relaxed mb-8 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                Доступ к настройкам у администратора
              </p>
              <button 
                onClick={() => setShowAdminOnlyAlert(false)}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all
                  ${isDark ? 'bg-indigo-500 hover:bg-indigo-600 text-white shadow-indigo-500/20' : 'bg-slate-900 hover:bg-slate-800 text-white shadow-slate-200'}`}
              >
                ОК
              </button>
            </motion.div>
          </motion.div>
        )}

        {showClearHistoryModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center px-6 bg-black/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-xs p-6 rounded-[2.5rem] border text-center shadow-2xl
                ${isDark ? 'bg-[#0f172a] border-white/10' : 'bg-white border-slate-200'}`}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4
                ${isDark ? 'bg-red-500/10 text-red-500' : 'bg-red-50 text-red-500'}`}>
                <svg viewBox="0 0 24 24" className="w-7 h-7" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>

              <h3 className={`text-base font-black uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Очистить всю историю?
              </h3>
              <p className={`text-[11px] font-medium leading-relaxed mb-4 ${isDark ? 'text-white/40' : 'text-slate-500'}`}>
                Это действие безвозвратно удалит все результаты сессий из базы данных.
              </p>

              <div className="mb-4">
                <input 
                  type="text"
                  maxLength={4}
                  autoFocus
                  placeholder="Пароль подтверждения"
                  value={clearHistoryPasswordInput}
                  onChange={(e) => {
                    setClearHistoryPasswordInput(e.target.value);
                    if (clearHistoryError) setClearHistoryError('');
                  }}
                  className={`w-full py-3 px-4 rounded-xl text-center font-mono font-bold text-sm tracking-widest outline-none border transition-all
                    ${isDark 
                      ? 'bg-black/20 border-white/10 text-white focus:border-indigo-500 focus:bg-black/40' 
                      : 'bg-slate-50 border-slate-200 text-slate-800 focus:border-indigo-500 focus:bg-white'}`}
                />
                {clearHistoryError && (
                  <p className="text-red-500 text-[10px] font-bold mt-1.5">{clearHistoryError}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <button 
                  onClick={executeClearGlobalHistory}
                  className={`w-full py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-lg active:scale-[0.98] transition-all
                    ${isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white'}`}
                >
                  Очистить базу данных
                </button>
                <button 
                  onClick={() => setShowClearHistoryModal(false)}
                  className={`w-full py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-[0.98] transition-all
                    ${isDark ? 'bg-white/5 border border-white/10 hover:bg-white/10 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'}`}
                >
                  Отмена
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {!isAuthorized ? (
          <motion.div
            key="login-overlay"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 z-[100]"
          >
            <LoginOverlay 
              theme={theme} 
              onAuthorized={(role, password) => handleAuthorize(role, password)} 
            />
          </motion.div>
        ) : (
          <motion.div
            key="main-app"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="flex flex-col h-full w-full relative"
          >
            <header className={`px-6 pt-10 flex-shrink-0 ${activeTab === 'progress' ? 'pb-3' : 'pb-4'}`}>
              <AnimatedContent
                distance={20}
                delay={0}
                direction="vertical"
              >
                <div className="flex flex-col">
                  <div className="flex items-center justify-between">
                    <span className="text-indigo-500 text-[12px] font-black uppercase tracking-[0.3em]">Обучение</span>
                  </div>
                  {activeTab === 'profile' ? (
                    <SplitText
                      key="profile-header"
                      text="Настройки"
                      className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                      delay={50}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="left"
                      tag="h1"
                    />
                  ) : activeTab === 'history' ? (
                    <SplitText
                      key="history-header"
                      text="История"
                      className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                      delay={50}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="left"
                      tag="h1"
                    />
                  ) : activeTab === 'progress' ? (
                    <div>
                      <SplitText
                        key="progress-header"
                        text="Прогресс"
                        className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                        delay={50}
                        duration={1.25}
                        ease="power3.out"
                        from={{ opacity: 0, y: 40 }}
                        to={{ opacity: 1, y: 0 }}
                        textAlign="left"
                        tag="h1"
                      />
                      <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15, duration: 0.8 }}
                        className={`text-xs mt-1 ${isDark ? 'text-white/50' : 'text-slate-500'}`}
                      >
                        Результаты последних 10 сессий
                      </motion.p>
                    </div>
                  ) : activeTab === 'tasks' ? (
                    <div className="flex items-center justify-between">
                      <SplitText
                        key="tasks-header"
                        text="Упражнения"
                        className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                        delay={50}
                        duration={1.25}
                        ease="power3.out"
                        from={{ opacity: 0, y: 40 }}
                        to={{ opacity: 1, y: 0 }}
                        textAlign="left"
                        display="inline-block"
                        tag="h1"
                      />
                      <motion.div 
                        initial={{ opacity: 0, y: 40, scale: 0.8 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{ 
                          duration: 1.25, 
                          delay: 0,
                          ease: [0.22, 1, 0.36, 1] // Smooth easeOut (similar to power3.out)
                        }}
                        className={`w-12 h-12 rounded-2xl flex-shrink-0 flex items-center justify-center border transition-colors
                        ${isDark ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-500'}`}>
                        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="5" width="18" height="11" rx="1" />
                          <path d="M2 18h20" />
                          <circle cx="8" cy="10.5" r="2.2" />
                          <path d="M8 8.3v4.4M5.8 10.5h4.4" />
                          <path d="M6.5 9l3 3M9.5 9l-3 3" />
                          <path d="M13 14v-2M15.5 14v-4M18 14v-6" />
                          <path d="M12.5 10l3.5-3.5 3 2" />
                          <path d="M6 14h3" opacity="0.5" />
                        </svg>
                      </motion.div>
                    </div>
                  ) : (
                    <SplitText
                      key="home-header"
                      text="Лучший технолог"
                      className={`${isDark ? 'text-white' : 'text-slate-900'} text-2xl font-black uppercase tracking-tighter leading-tight pt-1`}
                      delay={50}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="left"
                      tag="h1"
                    />
                  )}
                </div>
              </AnimatedContent>
            </header>

            <main className="flex-1 flex flex-col overflow-hidden">
              {renderContent()}
            </main>

            <nav className={`h-20 backdrop-blur-2xl border-t flex items-center justify-around px-2 z-40 flex-shrink-0 transition-colors duration-300
              ${isDark ? 'bg-[#0c1e3a]/80 border-white/10' : 'bg-white/90 border-slate-200 shadow-[0_-4px_10px_rgba(0,0,0,0.02)]'}`}>
              <NavButton isDark={isDark} active={activeTab === 'home'} onClick={() => setActiveTab('home')} label="Главная" 
                icon={(active) => (
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                    <path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                  </svg>
                )} 
              />
              <NavButton isDark={isDark} active={activeTab === 'tasks'} onClick={() => setActiveTab('tasks')} label="Упражнения" 
                icon={(active) => (
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill="none" stroke="currentColor" strokeWidth="1.5">
                    <rect x="3" y="5" width="18" height="11" rx="1" />
                    <path d="M2 18h20" />
                    <circle cx="8" cy="10.5" r="2.2" />
                    <path d="M8 8.3v4.4M5.8 10.5h4.4" />
                    <path d="M6.5 9l3 3M9.5 9l-3 3" />
                    <path d="M13 14v-2M15.5 14v-4M18 14v-6" />
                    <path d="M12.5 10l3.5-3.5 3 2" />
                    <path d="M6 14h3" opacity="0.5" />
                  </svg>
                )} 
              />
              <NavButton isDark={isDark} active={activeTab === 'progress'} onClick={() => setActiveTab('progress')} label="Прогресс" 
                icon={(active) => (
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="18" y1="20" x2="18" y2="10" />
                    <line x1="12" y1="20" x2="12" y2="4" />
                    <line x1="6" y1="20" x2="6" y2="14" />
                  </svg>
                )} 
              />
              <NavButton isDark={isDark} active={activeTab === 'history'} onClick={() => setActiveTab('history')} label="История" 
                icon={(active) => (
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                )} 
              />
              <NavButton isDark={isDark} active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} label="Настройки" 
                icon={(active) => (
                  <svg viewBox="0 0 24 24" className={`w-5 h-5 transition-all ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`} fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                )} 
              />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {selectedModule && (
          <motion.div
            key="module-detail"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 z-50"
          >
            <ModuleDetail 
              module={selectedModule} 
              theme={theme} 
              userRole={userRole}
              isTimerEnabled={isTimerEnabled}
              isHighlightEnabled={isHighlightEnabled}
              isHistoryAnswersEnabled={isHistoryAnswersEnabled}
              syncStatus={syncStatus}
              onClose={() => { setSelectedModule(null); loadData(); }} 
            />
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {activeGame === 'sulfate' && (
          <motion.div
            key="sulfate-game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70]"
          >
            <SulfateGame isDark={isDark} syncStatus={syncStatus} onClose={() => setActiveGame(null)} />
          </motion.div>
        )}
        {activeGame === 'ninja' && (
          <motion.div
            key="ninja-game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70]"
          >
            <FruitNinjaGame 
              isDark={isDark} 
              onClose={() => setActiveGame(null)} 
              userRole={userRole} 
              onShowHistory={() => {
                setActiveTab('history');
                setHistoryFilter('matrix-tz');
                setActiveGame(null);
              }}
            />
          </motion.div>
        )}
        {activeGame === 'water_kf' && (
          <motion.div
            key="water-kf-game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70]"
          >
            <WaterKfGame 
              isDark={isDark} 
              onClose={() => setActiveGame(null)} 
              userRole={userRole}
              onShowHistory={() => {
                setActiveTab('history');
                setHistoryFilter('water-kf');
                setActiveGame(null);
              }}
            />
          </motion.div>
        )}
        {activeGame === 'aspo' && (
          <motion.div
            key="aspo-game"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-[70]"
          >
            <AspoGame 
              isDark={isDark} 
              onClose={() => setActiveGame(null)} 
              userRole={userRole}
              onShowHistory={() => {
                setActiveTab('history');
                setHistoryFilter('aspo-code');
                setActiveGame(null);
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const NavButton: React.FC<{ isDark: boolean; active: boolean; onClick: () => void; icon: (active: boolean) => React.ReactNode; label: string }> = ({ isDark, active, onClick, icon, label }) => (
  <button onClick={onClick} className="flex flex-col items-center justify-center gap-1 min-w-[64px] relative group">
    <motion.div 
      className="flex flex-col items-center justify-center gap-1"
      animate={{ 
        scale: active ? 1.1 : 1,
        y: active ? -2 : 0
      }}
      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
    >
      <div className="relative">
        {icon(active)}
      </div>
      <span className={`text-[9px] font-bold tracking-wide uppercase transition-colors duration-300
        ${active ? (isDark ? 'text-white' : 'text-slate-800') : (isDark ? 'text-white/30' : 'text-slate-400')}`}>
        {label}
      </span>
    </motion.div>
    {active && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute -bottom-2 w-1 h-1 rounded-full bg-indigo-500"
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      />
    )}
  </button>
);

export default App;
