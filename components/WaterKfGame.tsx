import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { renderUserAnswerLines } from "../utils/formatAnswer";

export interface WaterKfTask {
  id: number;
  saltDeposit: string;
  mineralization: number; // мг/дм3
  co2: number;
  h2s: string | number; // 'Отсутствует' | number
  corrosionModel: string;
  temp: number; // °C
  ansC: string; // 'С0'..'С4'
  ansM: string; // 'М1'..'М2'
  ansG: string; // 'Г1'..'Г6'
  ansT: string; // 'Т1'..'Т4'
}

const SALT_DEPOSITS: Record<string, string> = {
  С0: "Отсутствует солеотложение",
  С1: "Карбонатные отложения",
  С2: "Сульфатные отложения",
  С3: "Галитные отложения",
  С4: "Совмещенные карбонатно-сульфатные отложения",
};

// Генерация структурированной базы всех 160 комбинаций кодов из 1.Варианты.csv
const generateAllWaterKfTasks = (): WaterKfTask[] => {
  const cKeys = ["С0", "С1", "С2", "С3", "С4"];
  const mKeys = ["М1", "М2"];
  
  const gConfigs: {
    g: string;
    co2Ranges: [number, number];
    h2sType: "none" | "lt1" | "gte1";
    model: string;
    tOptions: string[];
  }[] = [
    {
      g: "Г1",
      co2Ranges: [4, 19],
      h2sType: "none",
      model: "Углекислотная, среднеагрессивная",
      tOptions: ["Т1", "Т2"],
    },
    {
      g: "Г2",
      co2Ranges: [20, 36],
      h2sType: "none",
      model: "Углекислотная, сильноагрессивная",
      tOptions: ["Т1", "Т2"],
    },
    {
      g: "Г3",
      co2Ranges: [5, 19],
      h2sType: "lt1",
      model: "Углекислотная, среднеагрессивная",
      tOptions: ["Т1", "Т2"],
    },
    {
      g: "Г4",
      co2Ranges: [20, 35],
      h2sType: "lt1",
      model: "Углекислотная, сильноагрессивная",
      tOptions: ["Т1", "Т2"],
    },
    {
      g: "Г5",
      co2Ranges: [4, 18],
      h2sType: "gte1",
      model: "Сероводородная, сильноагрессивная, вызывающая растрескивание",
      tOptions: ["Т1", "Т2", "Т3", "Т4"],
    },
    {
      g: "Г6",
      co2Ranges: [20, 38],
      h2sType: "gte1",
      model: "Смешанная (H2S+CO2), сильноагрессивная, вызывающая растрескивание",
      tOptions: ["Т1", "Т2", "Т3", "Т4"],
    },
  ];

  const tasks: WaterKfTask[] = [];
  let currentId = 1;

  cKeys.forEach((cKey) => {
    mKeys.forEach((mKey) => {
      gConfigs.forEach((gConf) => {
        gConf.tOptions.forEach((tKey) => {
          // Генерация реалистичных значений параметров под условия
          const saltDeposit = SALT_DEPOSITS[cKey];

          // Минерализация воды
          let mineralization = 0;
          if (mKey === "М1") {
            // < 50000
            mineralization = Math.floor(15000 + ((currentId * 173) % 33000));
          } else {
            // >= 50000
            mineralization = Math.floor(50000 + ((currentId * 419) % 95000));
          }

          // СО2
          const [co2Min, co2Max] = gConf.co2Ranges;
          const co2Raw = co2Min + ((currentId * 7) % ((co2Max - co2Min) * 10)) / 10;
          const co2 = Number(co2Raw.toFixed(1));

          // H2S
          let h2s: string | number = "Отсутствует";
          if (gConf.h2sType === "lt1") {
            const hVal = 0.1 + ((currentId * 13) % 85) / 100;
            h2s = Number(hVal.toFixed(2));
          } else if (gConf.h2sType === "gte1") {
            const hVal = 1.0 + ((currentId * 11) % 32) / 10;
            h2s = Number(hVal.toFixed(1));
          }

          // Температура пласта
          let temp = 50;
          if (["Г1", "Г2", "Г3", "Г4"].includes(gConf.g)) {
            if (tKey === "Т1") {
              // < 65
              temp = 40 + ((currentId * 3) % 24);
            } else {
              // 65 и более
              temp = 65 + ((currentId * 5) % 45);
            }
          } else {
            // Г5, Г6
            if (tKey === "Т1") {
              // < 65
              temp = 38 + ((currentId * 3) % 26);
            } else if (tKey === "Т2") {
              // 65 - 79
              temp = 65 + ((currentId * 2) % 15);
            } else if (tKey === "Т3") {
              // 80 - 106
              temp = 80 + ((currentId * 4) % 27);
            } else {
              // 107 и более
              temp = 107 + ((currentId * 3) % 28);
            }
          }

          tasks.push({
            id: currentId++,
            saltDeposit,
            mineralization,
            co2,
            h2s,
            corrosionModel: gConf.model,
            temp,
            ansC: cKey,
            ansM: mKey,
            ansG: gConf.g,
            ansT: tKey,
          });
        });
      });
    });
  });

  return tasks;
};

const WATER_KF_DATA: WaterKfTask[] = generateAllWaterKfTasks();

const CORROSION_OPTIONS = [
  "Углекислотная, среднеагрессивная",
  "Углекислотная, сильноагрессивная",
  "Сероводородная, сильноагрессивная, вызывающая растрескивание",
  "Смешанная (H2S+CO2), сильноагрессивная, вызывающая растрескивание",
];

interface WaterKfGameProps {
  onClose: () => void;
  isDark?: boolean;
  userRole?: string | null;
  onShowHistory?: () => void;
}

const WaterKfGame: React.FC<WaterKfGameProps> = ({
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

  // Текущий выбор пользователя
  const [selectedC, setSelectedC] = useState("С0");
  const [selectedM, setSelectedM] = useState("М1");
  const [selectedG, setSelectedG] = useState("Г1");
  const [selectedT, setSelectedT] = useState("Т1");
  const [selectedCorrosion, setSelectedCorrosion] = useState(CORROSION_OPTIONS[0]);

  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  useEffect(() => {
    startNewSession();
  }, []);

  const startNewSession = () => {
    let queue: number[] = [];
    try {
      const stored = localStorage.getItem("waterKfTaskQueue");
      if (stored) queue = JSON.parse(stored);
    } catch (e) {}

    const selected: number[] = [];
    while (selected.length < 5) {
      if (queue.length === 0) {
        queue = [...Array(WATER_KF_DATA.length).keys()].sort(() => Math.random() - 0.5);
      }
      selected.push(queue.shift()!);
    }

    localStorage.setItem("waterKfTaskQueue", JSON.stringify(queue));
    setSessionTasks(selected);
    setCurrentTaskInSession(0);
    setSessionResults([]);

    setGameState("playing");
    setIsCorrect(null);
    setSelectedC("С0");
    setSelectedM("М1");
    setSelectedG("Г1");
    setSelectedT("Т1");
    setSelectedCorrosion(CORROSION_OPTIONS[0]);
  };

  const currentTask = sessionTasks.length > 0 ? WATER_KF_DATA[sessionTasks[currentTaskInSession]] : null;

  const handleSubmit = () => {
    if (!currentTask) return;

    const isCipherCorrect =
      selectedC === currentTask.ansC &&
      selectedM === currentTask.ansM &&
      selectedG === currentTask.ansG &&
      selectedT === currentTask.ansT;

    const isCorrosionCorrect = selectedCorrosion === currentTask.corrosionModel;

    const correct = isCipherCorrect && isCorrosionCorrect;

    setIsCorrect(correct);

    setSessionResults((prev) => [
      ...prev,
      {
        task: currentTask,
        selectedC,
        selectedM,
        selectedG,
        selectedT,
        selectedCorrosion,
        isCipherCorrect,
        isCorrosionCorrect,
        correct,
      },
    ]);

    setGameState("result");
  };

  const handleNextTask = () => {
    if (currentTaskInSession >= 4) {
      finishSession();
    } else {
      setCurrentTaskInSession((prev) => prev + 1);
      setSelectedC("С0");
      setSelectedM("М1");
      setSelectedG("Г1");
      setSelectedT("Т1");
      setSelectedCorrosion(CORROSION_OPTIONS[0]);
      setIsCorrect(null);
      setGameState("playing");
    }
  };

  const finishSession = () => {
    setGameState("session_end");
    try {
      const correctCount = sessionResults.length > 0 ? sessionResults.filter((r) => r.correct).length : 0;
      const realResults = sessionResults;

      const incorrectAnswersList = realResults
        .filter((r) => !r.correct)
        .map((r) => ({
          question: `Задание по Коду воды (КФ) (Солеотложение: ${r.task.saltDeposit}, Минерализация: ${r.task.mineralization.toLocaleString("ru-RU")} мг/дм³, Концентрация в ГЖС: СО₂: ${r.task.co2}%, H₂S: ${r.task.h2s === "Отсутствует" ? "отсутствует" : r.task.h2s + "%"}, Т пл: ${r.task.temp}°C)`,
          userAnswer: `Код: ${r.selectedC}-${r.selectedM}-${r.selectedG}-${r.selectedT}\nКоррозия: ${r.selectedCorrosion}`,
          correctAnswer: `Код: ${r.task.ansC}-${r.task.ansM}-${r.task.ansG}-${r.task.ansT}\nКоррозия: ${r.task.corrosionModel}`,
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

      const userName =
        userRole === "admin"
          ? "Администратор"
          : userRole === "contestant_operator"
          ? "ContestantOperator"
          : localStorage.getItem("app_user_name") || "Contestant";

      const sessionNum = history.filter((h) => h.moduleId === "water-kf").length + 1;

      const newEntry = {
        date: new Date().toISOString(),
        session: sessionNum,
        score: `${correctCount}/5`,
        moduleId: "water-kf",
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
        }).catch((err) => console.warn("Failed to save water-kf history to cloud:", err));
      }
    } catch (e) {
      console.error("Error saving water-kf history:", e);
    }
  };

  // Просмотр локальной истории сессий данного упражнения
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
        if (h.moduleId !== "water-kf") return false;
        if (userRole === "contestant_operator") {
          return h.user === "ContestantOperator" || h.user === "Конкурсант (Оператор)";
        } else if (userRole === "admin") {
          return true;
        } else {
          return (
            h.user !== "admin" &&
            h.user !== "Администратор" &&
            h.user !== "ContestantOperator" &&
            h.user !== "Конкурсант (Оператор)"
          );
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
      const filtered = history.filter((h) => h.moduleId !== "water-kf");
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
          <div
            className={`p-4 border-b flex justify-between items-center ${
              isDark ? "border-white/10" : "border-slate-200"
            }`}
          >
            <div className="flex flex-col text-left">
              <span
                className={`text-[10px] font-black uppercase tracking-widest mb-1 ${
                  isDark ? "text-cyan-400" : "text-cyan-600"
                }`}
              >
                История сессий
              </span>
              <h3
                className={`font-bold text-sm truncate max-w-[200px] ${
                  isDark ? "text-white" : "text-slate-900"
                }`}
              >
                Код воды (КФ)
              </h3>
            </div>
            <button
              onClick={() => setShowLocalHistory(false)}
              className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase transition-all active:scale-[0.98]
                ${
                  isDark
                    ? "bg-white/5 border-white/10 text-white hover:bg-white/10"
                    : "bg-white border-slate-200 text-slate-900 hover:bg-slate-50"
                }`}
            >
              Назад
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 no-scrollbar">
            {historyList.length === 0 ? (
              <div
                className={`flex flex-col items-center justify-center py-24 italic text-sm text-center ${
                  isDark ? "text-white/20" : "text-slate-300"
                }`}
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
                const isSuccess = totalVal ? correct / totalVal >= 0.8 : correct >= 1;
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
                    className={`p-5 rounded-2xl border relative overflow-hidden text-left ${
                      isDark ? "bg-white/5 border-white/10" : "bg-white border-slate-200 shadow-sm"
                    }`}
                  >
                    {isSuccess && (
                      <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/10 rounded-full blur-2xl"></div>
                    )}
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">
                          Сессия {entry.session}
                        </span>
                        <span className={`text-[10px] font-bold ${isDark ? "text-white/50" : "text-slate-400"}`}>
                          {formattedDate}
                        </span>
                      </div>
                      <div className="flex flex-col items-end">
                        <span
                          className={`text-xl font-black ${
                            isSuccess ? "text-green-500" : "text-cyan-500"
                          }`}
                        >
                          {entry.score}
                        </span>
                        <span
                          className={`text-[8px] font-black uppercase tracking-tighter ${
                            isSuccess ? "text-green-600/50" : "text-cyan-500/50"
                          }`}
                        >
                          {isSuccess ? "Успешно" : "Нужна практика"}
                        </span>
                      </div>
                    </div>

                    {entry.incorrectAnswers && entry.incorrectAnswers.length > 0 && (
                      <div
                        className={`mt-4 pt-4 border-t space-y-4 ${
                          isDark ? "border-white/5" : "border-slate-100"
                        }`}
                      >
                        <span className="text-[9px] uppercase font-black text-red-500/60 tracking-widest">
                          Разбор ошибок ({entry.incorrectAnswers.length}):
                        </span>
                        {entry.incorrectAnswers.map((err: any, i: number) => (
                          <div
                            key={i}
                            className={`text-[11px] space-y-1 p-3 rounded-xl border text-left ${
                              isDark ? "bg-black/20 border-white/5" : "bg-slate-50 border-slate-100"
                            }`}
                          >
                            <p
                              className={`font-bold leading-tight ${
                                isDark ? "text-white/80" : "text-slate-800"
                              }`}
                            >
                              «{err.question}»
                            </p>
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
                                <div className={`${isDark ? "text-green-300/80 font-mono font-bold" : "text-green-600 font-mono font-bold"} whitespace-pre-line leading-relaxed`}>
                                  {err.correctAnswer}
                                </div>
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

          {userRole === "admin" && historyList.length > 0 && (
            <div className="pt-2 pb-4 mt-auto">
              <button
                onClick={clearGameHistory}
                className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                  ${
                    isDark
                      ? "bg-red-500/5 border-red-500/10 text-red-500/50 hover:bg-red-500 hover:text-white"
                      : "bg-red-50 border-red-100 text-red-500 hover:bg-red-500 hover:text-white"
                  }`}
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
      className={`fixed inset-0 z-[70] flex flex-col justify-between items-center overflow-hidden ${
        isDark ? "bg-[#0B1120]" : "bg-slate-50"
      }`}
    >
      {/* Шапка */}
      <div
        className={`w-full px-6 py-4 flex justify-between items-center z-10 ${
          isDark ? "bg-[#0f172a]/90" : "bg-white/90"
        } backdrop-blur-md border-b ${isDark ? "border-slate-800" : "border-slate-200"}`}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center">
            <span className="text-cyan-400 font-bold text-sm">КФ</span>
          </div>
          <div className="flex flex-col text-left">
            <h1 className={`font-bold text-lg md:text-xl leading-tight ${isDark ? "text-white" : "text-slate-900"}`}>
              Код воды (КФ)
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className={`w-8 h-8 flex items-center justify-center rounded-full transition-colors
              ${
                isDark
                  ? "bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700"
                  : "bg-slate-200 text-slate-600 hover:text-black hover:bg-slate-300"
              }`}
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
      </div>

      {/* Основная рабочая область */}
      <div className="flex-1 w-full max-w-2xl mx-auto flex flex-col items-center justify-center p-4 overflow-y-auto">
        {gameState === "playing" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full flex flex-col items-center gap-4 md:gap-5"
          >
            <div className="flex items-center justify-between w-full px-2">
              <span className={`text-base md:text-lg font-bold ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                Упражнение №{currentTaskInSession + 1} из 5
              </span>
            </div>

            {/* Блок 1: Солеотложение и Минерализация */}
            <div
              className={`w-full rounded-2xl overflow-hidden shadow-lg border ${
                isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"
              }`}
            >
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr
                    className={`${
                      isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-700"
                    } border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <th className="p-3 text-xs font-bold leading-tight w-1/2">
                      Солеотложение
                    </th>
                    <th className="p-3 text-xs font-bold leading-tight border-l w-1/2 border-slate-700/50">
                      Минерализация воды, мг/дм³
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`last:border-0 ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                    <td className={`p-4 text-sm md:text-base font-semibold ${isDark ? "text-slate-300" : "text-slate-800"}`}>
                      {currentTask?.saltDeposit}
                    </td>
                    <td
                      className={`p-4 font-mono text-base md:text-lg font-bold border-l ${
                        isDark ? "border-slate-700 text-blue-400" : "border-slate-200 text-blue-900"
                      }`}
                    >
                      {currentTask?.mineralization.toLocaleString("ru-RU")}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Блок 2: Состав газа и температура пласта */}
            <div
              className={`w-full rounded-2xl overflow-hidden shadow-lg border ${
                isDark ? "bg-slate-800/50 border-slate-700" : "bg-white border-slate-200"
              }`}
            >
              <table className="w-full text-center border-collapse">
                <thead>
                  <tr
                    className={`${
                      isDark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-700"
                    } border-b ${isDark ? "border-slate-700" : "border-slate-200"}`}
                  >
                    <th className="p-2.5 sm:p-3 text-[11px] sm:text-xs font-bold leading-tight w-1/3">
                      Концентрация в ГЖС: СО₂
                    </th>
                    <th className="p-2.5 sm:p-3 text-[11px] sm:text-xs font-bold leading-tight border-l w-1/3 border-slate-700/50">
                      Концентрация в ГЖС: H₂S
                    </th>
                    <th className="p-2.5 sm:p-3 text-[11px] sm:text-xs font-bold leading-tight border-l w-1/3 border-slate-700/50">
                      Температура пласта, °C
                    </th>
                  </tr>
                </thead>
                <tbody>
                  <tr className={`last:border-0 ${isDark ? "border-slate-700" : "border-slate-200"}`}>
                    <td
                      className={`p-3 sm:p-4 font-mono text-sm sm:text-base font-bold ${
                        isDark ? "text-slate-400" : "text-slate-600"
                      }`}
                    >
                      {currentTask?.co2}
                    </td>
                    <td
                      className={`p-3 sm:p-4 font-mono text-sm sm:text-base font-bold border-l ${
                        isDark ? "border-slate-700 text-amber-400" : "border-slate-200 text-amber-700"
                      }`}
                    >
                      {currentTask?.h2s}
                    </td>
                    <td
                      className={`p-3 sm:p-4 font-mono text-sm sm:text-base font-bold border-l ${
                        isDark ? "border-slate-700 text-red-400" : "border-slate-200 text-red-800"
                      }`}
                    >
                      {currentTask?.temp} °C
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Блок выбора шифра */}
            <div className="flex flex-col items-center justify-center gap-1.5 w-full mt-2">
              <span
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider text-center leading-snug ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Составьте код модельной воды
              </span>

              <div className="flex flex-row flex-wrap items-center justify-center gap-2 sm:gap-3 w-full">
                {/* Сектор C */}
                <div className="flex flex-col items-center">
                  <select
                    value={selectedC}
                    onChange={(e) => setSelectedC(e.target.value)}
                    className={`py-3 px-4 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm text-sm sm:text-base text-indigo-500
                      ${
                        isDark
                          ? "bg-slate-800 border-slate-600 hover:bg-slate-700"
                          : "bg-white border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <option className="text-indigo-500" value="С0">С0</option>
                    <option className="text-indigo-500" value="С1">С1</option>
                    <option className="text-indigo-500" value="С2">С2</option>
                    <option className="text-indigo-500" value="С3">С3</option>
                    <option className="text-indigo-500" value="С4">С4</option>
                  </select>
                </div>

                <span className={`text-2xl font-bold self-center ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                  -
                </span>

                {/* Сектор M */}
                <div className="flex flex-col items-center">
                  <select
                    value={selectedM}
                    onChange={(e) => setSelectedM(e.target.value)}
                    className={`py-3 px-4 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm text-sm sm:text-base text-indigo-500
                      ${
                        isDark
                          ? "bg-slate-800 border-slate-600 hover:bg-slate-700"
                          : "bg-white border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <option className="text-indigo-500" value="М1">М1</option>
                    <option className="text-indigo-500" value="М2">М2</option>
                  </select>
                </div>

                <span className={`text-2xl font-bold self-center ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                  -
                </span>

                {/* Сектор G */}
                <div className="flex flex-col items-center">
                  <select
                    value={selectedG}
                    onChange={(e) => setSelectedG(e.target.value)}
                    className={`py-3 px-4 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm text-sm sm:text-base text-indigo-500
                      ${
                        isDark
                          ? "bg-slate-800 border-slate-600 hover:bg-slate-700"
                          : "bg-white border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <option className="text-indigo-500" value="Г1">Г1</option>
                    <option className="text-indigo-500" value="Г2">Г2</option>
                    <option className="text-indigo-500" value="Г3">Г3</option>
                    <option className="text-indigo-500" value="Г4">Г4</option>
                    <option className="text-indigo-500" value="Г5">Г5</option>
                    <option className="text-indigo-500" value="Г6">Г6</option>
                  </select>
                </div>

                <span className={`text-2xl font-bold self-center ${isDark ? "text-slate-600" : "text-slate-400"}`}>
                  -
                </span>

                {/* Сектор T */}
                <div className="flex flex-col items-center">
                  <select
                    value={selectedT}
                    onChange={(e) => setSelectedT(e.target.value)}
                    className={`py-3 px-4 rounded-xl outline-none font-bold text-center appearance-none cursor-pointer border shadow-sm text-sm sm:text-base text-indigo-500
                      ${
                        isDark
                          ? "bg-slate-800 border-slate-600 hover:bg-slate-700"
                          : "bg-white border-slate-300 hover:bg-slate-50"
                      }`}
                  >
                    <option className="text-indigo-500" value="Т1">Т1</option>
                    <option className="text-indigo-500" value="Т2">Т2</option>
                    <option className="text-indigo-500" value="Т3">Т3</option>
                    <option className="text-indigo-500" value="Т4">Т4</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Выпадающий список: Коррозия по типу влияния газа / степень агрессивности среды */}
            <div className="flex flex-col items-center w-full max-w-md mt-3 px-1">
              <span
                className={`text-[10px] sm:text-xs font-bold uppercase tracking-wider mb-1.5 text-center leading-snug ${
                  isDark ? "text-slate-400" : "text-slate-500"
                }`}
              >
                Коррозия по типу влияния газа / степень агрессивности среды
              </span>
              <div className="relative w-full">
                <select
                  value={selectedCorrosion}
                  onChange={(e) => setSelectedCorrosion(e.target.value)}
                  className={`w-full py-3 px-3.5 pr-8 rounded-xl outline-none font-semibold text-xs sm:text-sm appearance-none cursor-pointer border shadow-sm transition-colors text-center text-indigo-500
                    ${
                      isDark
                        ? "bg-slate-800 border-slate-600 hover:bg-slate-700 focus:border-cyan-400"
                        : "bg-white border-slate-300 hover:bg-slate-50 focus:border-cyan-600"
                    }`}
                >
                  {CORROSION_OPTIONS.map((opt) => (
                    <option key={opt} value={opt} className="text-indigo-500">
                      {opt}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-slate-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Кнопка отправки ответа */}
            <button
              onClick={handleSubmit}
              className={`mt-4 px-12 py-4 rounded-2xl font-black uppercase tracking-widest text-xs shadow-xl hover:shadow-2xl hover:-translate-y-0.5 active:scale-[0.98] transition-all
                ${
                  isDark
                    ? "bg-slate-800 hover:bg-slate-700 text-white border border-slate-600 shadow-black/40"
                    : "bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-300"
                }`}
            >
              Принять ответ
            </button>
          </motion.div>
        )}

        {/* Экран результата текущего шага */}
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

            <h2 className={`text-2xl font-black mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              {isCorrect ? "Верно!" : "Ошибка"}
            </h2>

            {isCorrect && (
              <div className="mb-6 text-center">
                <div className={`font-mono font-black text-2xl ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                  {currentTask?.ansC}-{currentTask?.ansM}-{currentTask?.ansG}-{currentTask?.ansT}
                </div>
                <div className={`text-xs mt-1.5 font-medium ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                  {currentTask?.corrosionModel}
                </div>
              </div>
            )}

            {!isCorrect && (
              <div className="text-sm mb-6 w-full">
                <div className={`mb-3 text-left p-3 rounded-xl border ${
                  isDark ? "bg-red-500/10 border-red-500/20" : "bg-red-50 border-red-200"
                }`}>
                  <p className="text-[10px] uppercase font-bold text-red-500 mb-1">
                    Ваш ответ:
                  </p>
                  <div className={`font-mono font-bold text-base ${isDark ? "text-slate-200" : "text-slate-800"}`}>
                    Код: {selectedC}-{selectedM}-{selectedG}-{selectedT}
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {selectedCorrosion}
                  </div>
                </div>

                <div className={`text-left p-3 rounded-xl border ${
                  isDark ? "bg-green-500/10 border-green-500/20" : "bg-green-50 border-green-200"
                }`}>
                  <p className="text-[10px] uppercase font-bold text-green-600 mb-1">
                    Правильный ответ:
                  </p>
                  <div className={`font-mono font-bold text-base ${isDark ? "text-slate-100" : "text-slate-800"}`}>
                    Код: {currentTask?.ansC}-{currentTask?.ansM}-{currentTask?.ansG}-{currentTask?.ansT}
                  </div>
                  <div className={`text-xs mt-1 ${isDark ? "text-slate-300" : "text-slate-700"}`}>
                    {currentTask?.corrosionModel}
                  </div>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-3 w-full mt-4">
              <button
                onClick={handleNextTask}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all
                  ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                      : "bg-slate-800 hover:bg-slate-900 text-white border border-slate-700"
                  }`}
              >
                Продолжить
              </button>
            </div>
          </motion.div>
        )}

        {/* Экран завершения сессии */}
        {gameState === "session_end" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className={`w-full max-w-sm rounded-3xl p-8 flex flex-col items-center justify-center text-center shadow-2xl border
              ${isDark ? "bg-slate-800 border-slate-700" : "bg-white border-slate-200"}`}
          >
            <h2 className={`text-3xl font-black mb-2 ${isDark ? "text-white" : "text-slate-900"}`}>
              Итоги сессии
            </h2>

            <div
              className={`text-5xl font-black my-8 ${
                sessionResults.filter((r) => r.correct).length >= 4 ? "text-green-500" : "text-indigo-500"
              }`}
            >
              {sessionResults.filter((r) => r.correct).length} / 5
            </div>

            <div className="flex flex-col gap-3 w-full mt-2">
              <button
                onClick={startNewSession}
                className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all
                  ${
                    isDark
                      ? "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                      : "bg-slate-800 hover:bg-slate-900 text-white border border-slate-700"
                  }`}
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

export default WaterKfGame;
