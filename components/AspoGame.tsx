import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { renderUserAnswerLines } from "../utils/formatAnswer";

const ASPO_DATA = [
  {
    asfalten: 2,
    smoli: 2,
    parafin: 3,
    temp: 60,
    ansGroup: "СА",
    ansAspo: "АСПО1",
    ansType: "Тип1",
  },
  {
    asfalten: 1,
    smoli: 4,
    parafin: 4,
    temp: 80,
    ansGroup: "СА",
    ansAspo: "АСПО1",
    ansType: "Тип2",
  },
  {
    asfalten: 2.5,
    smoli: 3,
    parafin: 4.5,
    temp: 110,
    ansGroup: "СА",
    ansAspo: "АСПО1",
    ansType: "Тип3",
  },
  {
    asfalten: 2,
    smoli: 5,
    parafin: 3,
    temp: 111,
    ansGroup: "СА",
    ansAspo: "АСПО1",
    ansType: "Тип4",
  },
  {
    asfalten: 1,
    smoli: 6,
    parafin: 5,
    temp: 59,
    ansGroup: "СА",
    ansAspo: "АСПО2",
    ansType: "Тип1",
  },
  {
    asfalten: 2,
    smoli: 5,
    parafin: 6,
    temp: 79,
    ansGroup: "СА",
    ansAspo: "АСПО2",
    ansType: "Тип2",
  },
  {
    asfalten: 1.5,
    smoli: 7,
    parafin: 5,
    temp: 111,
    ansGroup: "СА",
    ansAspo: "АСПО2",
    ansType: "Тип4",
  },
  {
    asfalten: 2.5,
    smoli: 6,
    parafin: 4,
    temp: 115,
    ansGroup: "СА",
    ansAspo: "АСПО2",
    ansType: "Тип4",
  },
  {
    asfalten: 3,
    smoli: 10,
    parafin: 8,
    temp: 58,
    ansGroup: "СА",
    ansAspo: "АСПО3",
    ansType: "Тип1",
  },
  {
    asfalten: 2,
    smoli: 11,
    parafin: 9,
    temp: 78,
    ansGroup: "СА",
    ansAspo: "АСПО3",
    ansType: "Тип2",
  },
  {
    asfalten: 3.5,
    smoli: 10.5,
    parafin: 8.5,
    temp: 109,
    ansGroup: "СА",
    ansAspo: "АСПО3",
    ansType: "Тип3",
  },
  {
    asfalten: 2.5,
    smoli: 9.5,
    parafin: 9.5,
    temp: 120,
    ansGroup: "СА",
    ansAspo: "АСПО3",
    ansType: "Тип4",
  },
  {
    asfalten: 1,
    smoli: 1,
    parafin: 8,
    temp: 57,
    ansGroup: "П",
    ansAspo: "АСПО1",
    ansType: "Тип1",
  },
  {
    asfalten: 1.5,
    smoli: 0.5,
    parafin: 7.5,
    temp: 77,
    ansGroup: "П",
    ansAspo: "АСПО1",
    ansType: "Тип2",
  },
  {
    asfalten: 0.5,
    smoli: 1.5,
    parafin: 8,
    temp: 108,
    ansGroup: "П",
    ansAspo: "АСПО1",
    ansType: "Тип3",
  },
  {
    asfalten: 1.5,
    smoli: 1,
    parafin: 7.5,
    temp: 115,
    ansGroup: "П",
    ansAspo: "АСПО1",
    ansType: "Тип4",
  },
  {
    asfalten: 2,
    smoli: 2,
    parafin: 12,
    temp: 56,
    ansGroup: "П",
    ansAspo: "АСПО2",
    ansType: "Тип1",
  },
  {
    asfalten: 1,
    smoli: 3,
    parafin: 13,
    temp: 76,
    ansGroup: "П",
    ansAspo: "АСПО2",
    ansType: "Тип2",
  },
  {
    asfalten: 2.5,
    smoli: 1.5,
    parafin: 12.5,
    temp: 107,
    ansGroup: "П",
    ansAspo: "АСПО2",
    ansType: "Тип3",
  },
  {
    asfalten: 1.5,
    smoli: 2.5,
    parafin: 13.5,
    temp: 120,
    ansGroup: "П",
    ansAspo: "АСПО2",
    ansType: "Тип4",
  },
  {
    asfalten: 2,
    smoli: 3,
    parafin: 22,
    temp: 55,
    ansGroup: "П",
    ansAspo: "АСПО3",
    ansType: "Тип1",
  },
  {
    asfalten: 1,
    smoli: 4,
    parafin: 23,
    temp: 106,
    ansGroup: "П",
    ansAspo: "АСПО3",
    ansType: "Тип3",
  },
  {
    asfalten: 2.5,
    smoli: 3.5,
    parafin: 22.5,
    temp: 105,
    ansGroup: "П",
    ansAspo: "АСПО3",
    ansType: "Тип3",
  },
  {
    asfalten: 1.5,
    smoli: 2.5,
    parafin: 23.5,
    temp: 120,
    ansGroup: "П",
    ansAspo: "АСПО3",
    ansType: "Тип4",
  },
  {
    asfalten: 3,
    smoli: 4,
    parafin: 35,
    temp: 104,
    ansGroup: "П",
    ansAspo: "АСПО4",
    ansType: "Тип3",
  },
  {
    asfalten: 1,
    smoli: 3.5,
    parafin: 4.5,
    temp: 54,
    ansGroup: "С",
    ansAspo: "АСПО1",
    ansType: "Тип1",
  },
  {
    asfalten: 1.5,
    smoli: 2.5,
    parafin: 4,
    temp: 74,
    ansGroup: "С",
    ansAspo: "АСПО1",
    ansType: "Тип2",
  },
  {
    asfalten: 2,
    smoli: 3,
    parafin: 4.5,
    temp: 103,
    ansGroup: "С",
    ansAspo: "АСПО1",
    ansType: "Тип3",
  },
  {
    asfalten: 1,
    smoli: 2,
    parafin: 3,
    temp: 120,
    ansGroup: "С",
    ansAspo: "АСПО1",
    ansType: "Тип4",
  },
  {
    asfalten: 3,
    smoli: 4,
    parafin: 7,
    temp: 53,
    ansGroup: "С",
    ansAspo: "АСПО2",
    ansType: "Тип1",
  },
  {
    asfalten: 2,
    smoli: 3.5,
    parafin: 6,
    temp: 73,
    ansGroup: "С",
    ansAspo: "АСПО2",
    ansType: "Тип2",
  },
  {
    asfalten: 3,
    smoli: 3,
    parafin: 6.5,
    temp: 102,
    ansGroup: "С",
    ansAspo: "АСПО2",
    ansType: "Тип3",
  },
  {
    asfalten: 2,
    smoli: 4,
    parafin: 6,
    temp: 120,
    ansGroup: "С",
    ansAspo: "АСПО2",
    ansType: "Тип4",
  },
  {
    asfalten: 5,
    smoli: 6,
    parafin: 11,
    temp: 52,
    ansGroup: "С",
    ansAspo: "АСПО3",
    ansType: "Тип1",
  },
  {
    asfalten: 4,
    smoli: 7,
    parafin: 10.5,
    temp: 72,
    ansGroup: "С",
    ansAspo: "АСПО3",
    ansType: "Тип2",
  },
  {
    asfalten: 5.5,
    smoli: 6.5,
    parafin: 11.5,
    temp: 101,
    ansGroup: "С",
    ansAspo: "АСПО3",
    ansType: "Тип3",
  },
  {
    asfalten: 5,
    smoli: 10,
    parafin: 15,
    temp: 111,
    ansGroup: "С",
    ansAspo: "АСПО3",
    ansType: "Тип4",
  },
];

interface AspoGameProps {
  onClose: () => void;
  isDark?: boolean;
  userRole?: string;
  onShowHistory?: () => void;
}

const AspoGame: React.FC<AspoGameProps> = ({
  onClose,
  isDark = true,
  userRole = "contestant",
  onShowHistory,
}) => {
  const [gameState, setGameState] = useState<"playing" | "result" | "session_end">("playing");
  const [showLocalHistory, setShowLocalHistory] = useState(false);
  
  const [sessionTasks, setSessionTasks] = useState<number[]>([]);
  const [currentTaskInSession, setCurrentTaskInSession] = useState(0); 
  const [sessionResults, setSessionResults] = useState<any[]>([]);

  const [selectedGroup, setSelectedGroup] = useState("СА");
  const [selectedAspo, setSelectedAspo] = useState("АСПО1");
  const [selectedType, setSelectedType] = useState("Тип1");

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    startNewSession();
  }, []);

  const startNewSession = () => {
    let queue: number[] = [];
    try {
        const stored = localStorage.getItem('aspoTaskQueue');
        if (stored) queue = JSON.parse(stored);
    } catch(e) {}

    const selected: number[] = [];
    while (selected.length < 5) {
        if (queue.length === 0) {
            queue = [...Array(ASPO_DATA.length).keys()].sort(() => Math.random() - 0.5);
        }
        selected.push(queue.shift()!);
    }
    
    localStorage.setItem('aspoTaskQueue', JSON.stringify(queue));
    setSessionTasks(selected);
    setCurrentTaskInSession(0);
    setSessionResults([]);
    
    setGameState("playing");
    setIsCorrect(null);
    setSelectedGroup("СА");
    setSelectedAspo("АСПО1");
    setSelectedType("Тип1");
  };

  const currentTask = sessionTasks.length > 0 ? ASPO_DATA[sessionTasks[currentTaskInSession]] : null;

  const handleSubmit = () => {
    if (!currentTask) return;

    const correct =
      selectedGroup === currentTask.ansGroup &&
      selectedAspo === currentTask.ansAspo &&
      selectedType === currentTask.ansType;

    setIsCorrect(correct);
    
    setSessionResults(prev => [...prev, {
      task: currentTask,
      selectedGroup,
      selectedAspo,
      selectedType,
      correct
    }]);

    setGameState("result");
  };

  const handleNextTask = () => {
    if (currentTaskInSession >= 4) {
      finishSession();
    } else {
      setCurrentTaskInSession(prev => prev + 1);
      setSelectedGroup("СА");
      setSelectedAspo("АСПО1");
      setSelectedType("Тип1");
      setIsCorrect(null);
      setGameState("playing");
    }
  };

  const finishSession = () => {
    setGameState("session_end");
    try {
      const correctCount = sessionResults.length > 0 ? sessionResults.filter(r => r.correct).length : 0;
      // Also add the last answer if it wasn't captured in time but wait, it's captured in handleSubmit.
      // However, finishSession is called from handleNextTask, so sessionResults has 5 items.
      
      const realResults = sessionResults;

      const incorrectAnswersList = realResults.filter(r => !r.correct).map(r => ({
        question: `Задание по АСПО (Асфальтены: ${r.task.asfalten}%, Смолы: ${r.task.smoli}%, Парафины: ${r.task.parafin}%, Т пл: ${r.task.temp}°C)`,
        userAnswer: `${r.selectedGroup} - ${r.selectedAspo} - ${r.selectedType}`,
        correctAnswer: `${r.task.ansGroup} - ${r.task.ansAspo} - ${r.task.ansType}`,
      }));

      const savedHistory = localStorage.getItem("quizHistory");
      let history: any[] = [];
      if (savedHistory) {
        try {
          history = JSON.parse(savedHistory);
        } catch (e) {
          console.error("Failed to parse history:", e);
        }
      }

      const userName = userRole === "admin" ? "Администратор" : (userRole === "contestant_operator" ? "ContestantOperator" : (localStorage.getItem("app_user_name") || "Contestant"));
      const sessionNum = history.filter((h) => h.moduleId === "aspo-code").length + 1;

      const newEntry = {
        date: new Date().toISOString(),
        session: sessionNum,
        score: `${correctCount}/5`,
        moduleId: "aspo-code",
        user: userName,
        incorrectAnswers: incorrectAnswersList,
      };

      const updatedHistory = [newEntry, ...history];
      localStorage.setItem("quizHistory", JSON.stringify(updatedHistory));
      window.dispatchEvent(new Event("storage"));
      window.dispatchEvent(new Event("sessionCompleted"));

      if (userRole === "contestant" || userRole === "contestant_operator" || userRole === "admin") {
        fetch("/api/history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...newEntry,
            correct_answers: correctCount,
          }),
        }).catch((err) =>
          console.warn("Failed to save aspo history to cloud:", err),
        );
      }
    } catch (e) {
      console.error("Error saving history:", e);
    }
  };

  if (showLocalHistory) {
    const historyList = (() => {
      let history: any[] = [];
      const savedHistory = localStorage.getItem("quizHistory");
      if (savedHistory) {
        try {
          history = JSON.parse(savedHistory);
        } catch (e) {}
      }
      return history.filter((h) => {
        if (h.moduleId !== "aspo-code") return false;
        if (userRole === "contestant_operator") {
          return h.user === "ContestantOperator" || h.user === "Конкурсант (Оператор)";
        } else if (userRole === "admin") {
          return true;
        } else {
          return h.user !== "admin" && h.user !== "Администратор" && h.user !== "ContestantOperator" && h.user !== "Конкурсант (Оператор)";
        }
      });
    })();

    const clearGameHistory = () => {
      let history: any[] = [];
      const savedHistory = localStorage.getItem("quizHistory");
      if (savedHistory) {
        try {
          history = JSON.parse(savedHistory);
        } catch (e) {}
      }
      const filtered = history.filter((h) => h.moduleId !== "aspo-code");
      localStorage.setItem("quizHistory", JSON.stringify(filtered));
      window.dispatchEvent(new Event("storage"));
      setShowLocalHistory(false);
    };

    return (
      <div
        className="absolute inset-0 z-50 flex flex-col p-4 overflow-hidden"
        style={{ backgroundColor: isDark ? "#0f172a" : "#f8fafc" }}
      >
        <div className="w-full max-w-sm mx-auto h-full flex flex-col">
          {/* Header */}
          <div
            className={`p-4 border-b flex justify-between items-center ${isDark ? "border-white/10" : "border-slate-200"}`}
          >
            <div className="flex flex-col text-left">
              <span
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? "text-indigo-400" : "text-indigo-600"}`}
              >
                История сессий
              </span>
              <h3
                className={`font-bold text-sm truncate max-w-[200px] ${isDark ? "text-white" : "text-slate-900"}`}
              >
                Код АСПО
              </h3>
            </div>
            <button
              onClick={() => setShowLocalHistory(false)}
              className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase transition-all active:scale-[0.98]
                ${isDark ? "bg-white/5 border-white/10 text-white hover:bg-white/10" : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"}`}
            >
              Назад
            </button>
          </div>

          {/* Scrollable List */}
          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 no-scrollbar">
            {historyList.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center py-24 italic text-sm text-center ${isDark ? "text-white/20" : "text-slate-300"}`}
              >
                <svg
                  viewBox="0 0 24 24"
                  className="w-12 h-12 mb-4 opacity-10 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                Попыток еще не было
              </div>
            ) : (
              historyList.map((entry, idx) => {
                const [correct, totalVal] = entry.score.split("/").map(Number);
                const isSuccess = totalVal
                  ? correct / totalVal >= 0.8
                  : correct >= 1;
                const formattedDate = (() => {
                  try {
                    return new Date(entry.date).toLocaleString("ru-RU", {
                      day: "2-digit",
                      month: "2-digit",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } catch (e) {
                    return entry.date;
                  }
                })();

                return (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.25, delay: idx * 0.05 }}
                    className={`p-5 rounded-2xl border relative overflow-hidden text-left ${isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"}`}
                  >
                    {isSuccess && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">
                          Сессия {entry.session}
                        </span>
                        <span
                          className={`text-[10px] font-bold ${isDark ? "text-white/50" : "text-slate-400"}`}
                        >
                          {formattedDate}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-xl font-black ${isSuccess ? "text-green-500" : "text-indigo-500"}`}
                        >
                          {entry.score}
                        </span>
                        <span
                          className={`text-[8px] font-black uppercase tracking-tighter ${isSuccess ? "text-green-600/50" : "text-indigo-500/50"}`}
                        >
                          {isSuccess ? "Успешно" : "Нужна практика"}
                        </span>
                      </div>
                    </div>

                    {entry.incorrectAnswers &&
                      entry.incorrectAnswers.length > 0 && (
                        <div
                          className={`mt-4 pt-4 border-t space-y-4 ${isDark ? "border-white/5" : "border-slate-100"}`}
                        >
                          <span className="text-[9px] uppercase font-black text-red-500/60 tracking-widest">
                            Разбор ошибок ({entry.incorrectAnswers.length}):
                          </span>
                          {entry.incorrectAnswers.map((err: any, i: number) => (
                            <div
                              key={i}
                              className={`text-[11px] space-y-1 p-3 rounded-xl border text-left ${isDark ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-100"}`}
                            >
                              {err.question && err.question.includes("|") ? (
                                <div className="w-full mb-2 overflow-hidden rounded border border-slate-600 bg-slate-500/5">
                                  <table className="w-full text-left border-collapse">
                                    <tbody>
                                      {err.question
                                        .split("|")
                                        .map((row: string, rIdx: number) => (
                                          <tr
                                            key={rIdx}
                                            className="border-b border-slate-600 last:border-0 hover:bg-slate-500/10 transition-colors"
                                          >
                                            <td
                                              className={`p-2 font-medium text-xs ${isDark ? "text-white" : "text-slate-900"}`}
                                            >
                                              {row}
                                            </td>
                                          </tr>
                                        ))}
                                    </tbody>
                                  </table>
                                </div>
                              ) : (
                                <p
                                  className={`font-bold leading-tight ${isDark ? "text-white/80" : "text-slate-800"}`}
                                >
                                  «{err.question}»
                                </p>
                              )}
                              <div className="flex flex-col gap-1 mt-2">
                                <div className="flex gap-2">
                                  <span className="text-red-500/80 font-bold uppercase text-[7px] px-1 py-0.5 bg-red-500/10 rounded self-start mt-0.5">
                                    Ваш выбор
                                  </span>
                                  {renderUserAnswerLines(err.userAnswer, isDark)}
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-green-500 font-bold uppercase text-[7px] px-1 py-0.5 bg-green-500/10 rounded self-start">
                                    Верно
                                  </span>
                                  <span
                                    className={
                                      isDark
                                        ? "text-green-300/80"
                                        : "text-green-600"
                                    }
                                  >
                                    {err.correctAnswer}
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                  </motion.div>
                );
              })
            )}
          </div>

          {/* Clear History Button */}
          {userRole === "admin" && historyList.length > 0 && (
            <div className="pt-2 pb-4 mt-auto">
              <button
                onClick={clearGameHistory}
                className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${isDark ? "bg-red-500/5 border-red-500/10 text-red-500/50 hover:bg-red-500 hover:text-white" : "bg-red-50 border-red-100 text-red-500 hover:bg-red-500 hover:text-white"}`}
              >
                Удалить историю этого упражнения
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col justify-between items-center overflow-hidden
      ${isDark ? "bg-[#0B1120]" : "bg-slate-50"}`}
    >
      <div
        className={`w-full px-6 py-4 flex justify-between items-center z-10 
        ${isDark ? "bg-[#0f172a]/90" : "bg-white/90"} backdrop-blur-md border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
            <span className="text-blue-500 font-bold text-sm">A</span>
          </div>
          <h1
            className={`font-bold text-xl ${isDark ? "text-white" : "text-slate-900"}`}
          >
            Код АСПО
          </h1>
        </div>

        <button
          onClick={onClose}
          className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors
            ${isDark ? "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700" : "bg-slate-200 text-slate-600 hover:text-black hover:bg-slate-300"}`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-4">
        {gameState === "playing" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center gap-8"
          >
            <div className={`text-xl font-bold ${isDark ? "text-slate-300" : "text-slate-700"}`}>
              Упражнение №{currentTaskInSession + 1}
            </div>
            <div
              className={`w-full rounded-2xl overflow-hidden shadow-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr
                    className={`${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"} border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <th className="p-4 text-xs font-bold leading-tight">
                      Температура пласта, °C
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className={`last:border-0 ${isDark ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <td
                      className={`p-6 font-mono text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {currentTask?.temp}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div
              className={`w-full rounded-2xl overflow-hidden shadow-xl border ${isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"}`}
            >
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr
                    className={`${isDark ? "bg-slate-800 text-slate-300" : "bg-slate-100 text-slate-600"} border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <th className="p-2 sm:p-4 text-xs font-bold leading-tight w-1/3">
                      Содержание асфальтенов, %
                    </th>
                    <th className="p-2 sm:p-4 text-xs font-bold leading-tight border-l w-1/3 border-slate-700/50">
                      Содержание смол, %
                    </th>
                    <th className="p-2 sm:p-4 text-xs font-bold leading-tight border-l w-1/3 border-slate-700/50">
                      Содержание парафинов, %
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    className={`last:border-0 ${isDark ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <td
                      className={`p-4 sm:p-6 font-mono text-lg sm:text-xl font-bold ${isDark ? "text-white" : "text-slate-900"}`}
                    >
                      {currentTask?.asfalten}
                    </td>
                    <td
                      className={`p-4 sm:p-6 font-mono text-lg sm:text-xl font-bold border-l ${isDark ? "border-slate-700 text-white" : "border-slate-200 text-slate-900"}`}
                    >
                      {currentTask?.smoli}
                    </td>
                    <td
                      className={`p-4 sm:p-6 font-mono text-lg sm:text-xl font-bold border-l ${isDark ? "border-slate-700 text-white" : "border-slate-200 text-slate-900"}`}
                    >
                      {currentTask?.parafin}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="flex flex-row flex-wrap items-center justify-center gap-2 md:gap-4 w-full mt-2">
              <select
                value={selectedGroup}
                onChange={(e) => setSelectedGroup(e.target.value)}
                className={`py-3 px-6 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm
                  ${isDark ? "bg-slate-800 border-slate-600 text-white hover:bg-slate-700" : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"}`}
              >
                <option value="СА">СА</option>
                <option value="П">П</option>
                <option value="С">С</option>
              </select>
              <span
                className={`text-2xl font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                -
              </span>
              <select
                value={selectedAspo}
                onChange={(e) => setSelectedAspo(e.target.value)}
                className={`py-3 px-6 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm
                  ${isDark ? "bg-slate-800 border-slate-600 text-white hover:bg-slate-700" : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"}`}
              >
                <option value="АСПО1">АСПО1</option>
                <option value="АСПО2">АСПО2</option>
                <option value="АСПО3">АСПО3</option>
                <option value="АСПО4">АСПО4</option>
              </select>
              <span
                className={`text-2xl font-bold ${isDark ? "text-slate-600" : "text-slate-400"}`}
              >
                -
              </span>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className={`py-3 px-6 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm
                  ${isDark ? "bg-slate-800 border-slate-600 text-white hover:bg-slate-700" : "bg-white border-slate-300 text-slate-800 hover:bg-slate-50"}`}
              >
                <option value="Тип1">Тип1</option>
                <option value="Тип2">Тип2</option>
                <option value="Тип3">Тип3</option>
                <option value="Тип4">Тип4</option>
              </select>
            </div>

            <button
              onClick={handleSubmit}
              className={`mt-4 px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all
                ${isDark ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-black/40" : "bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-300"}`}
            >
              Принять ответ
            </button>
          </motion.div>
        )}
        
        {gameState === "result" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border
              ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <div
              className={`w-24 h-24 rounded-full flex items-center justify-center mb-6
              ${isCorrect ? "bg-green-500/20 text-green-500" : "bg-red-500/20 text-red-500"}`}
            >
              <svg
                width="48"
                height="48"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                {isCorrect ? (
                  <>
                    <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
                    <polyline points="22 4 12 14.01 9 11.01"></polyline>
                  </>
                ) : (
                  <>
                    <circle cx="12" cy="12" r="10"></circle>
                    <line x1="15" y1="9" x2="9" y2="15"></line>
                    <line x1="9" y1="9" x2="15" y2="15"></line>
                  </>
                )}
              </svg>
            </div>

            <h2
              className={`text-2xl font-black mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              {isCorrect ? "Верно!" : "Ошибка"}
            </h2>

            {!isCorrect && (
              <p
                className={`text-sm mb-8 ${isDark ? "text-slate-300" : "text-slate-600"}`}
              >
                Правильный ответ: <br />
                <span className="font-bold text-lg mt-2 inline-block">
                  {currentTask?.ansGroup} - {currentTask?.ansAspo} -{" "}
                  {currentTask?.ansType}
                </span>
              </p>
            )}

            <div className="flex flex-col gap-3 w-full mt-8">
              <button
                onClick={handleNextTask}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all
                  ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white border border-white/10" : "bg-slate-700 hover:bg-slate-800 text-white"}`}
              >
                Продолжить
              </button>
            </div>
          </motion.div>
        )}

        {gameState === "session_end" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border
              ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <h2
              className={`text-3xl font-black mb-2 ${isDark ? "text-white" : "text-slate-900"}`}
            >
              Итоги сессии
            </h2>
            
            <div className={`text-5xl font-black my-8 ${sessionResults.filter(r => r.correct).length >= 4 ? "text-green-500" : "text-indigo-500"}`}>
              {sessionResults.filter(r => r.correct).length} / 5
            </div>

            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={startNewSession}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all
                  ${isDark ? "bg-slate-700 hover:bg-slate-600 text-white border border-white/10" : "bg-slate-700 hover:bg-slate-800 text-white"}`}
              >
                Повторить
              </button>

              <button
                onClick={() => setShowLocalHistory(true)}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all border shadow-sm
                  ${
                    isDark
                      ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                История
              </button>

              <button
                onClick={onClose}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all border shadow-sm
                  ${
                    isDark
                      ? "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"
                      : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
              >
                В главное меню
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default AspoGame;
