import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { renderUserAnswerLines } from '../utils/formatAnswer';

function DecodingText({ text }: { text: string; key?: React.Key | any }) {
  const [displayText, setDisplayText] = useState(text);

  useEffect(() => {
    const duration = 500;
    const intervalTime = 35; // ~14 steps in 500ms
    const steps = duration / intervalTime;
    let currentStep = 0;

    const symbols = '№%@#$&*?+=~^<>!';
    const cyrillicUpper = 'АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ' + symbols;
    const cyrillicLower = 'абвгдеёжзийклмнопрстуфхцчшщъыьэюя' + symbols;
    const latinUpper = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' + symbols;
    const latinLower = 'abcdefghijklmnopqrstuvwxyz' + symbols;

    const getScrambledChar = (char: string): string => {
      if (/[А-ЯЁ]/.test(char)) {
        return cyrillicUpper.charAt(Math.floor(Math.random() * cyrillicUpper.length));
      }
      if (/[а-яё]/.test(char)) {
        return cyrillicLower.charAt(Math.floor(Math.random() * cyrillicLower.length));
      }
      if (/[A-Z]/.test(char)) {
        return latinUpper.charAt(Math.floor(Math.random() * latinUpper.length));
      }
      if (/[a-z]/.test(char)) {
        return latinLower.charAt(Math.floor(Math.random() * latinLower.length));
      }
      return char;
    };

    const scramble = () => {
      const chars = text.split('');
      for (let i = 0; i < chars.length; i++) {
        const char = chars[i];
        if (/[A-Za-zА-Яа-яЁё]/.test(char)) {
          chars[i] = getScrambledChar(char);
        }
      }
      return chars.join('');
    };

    // Scramble on start immediately
    setDisplayText(scramble());

    const interval = setInterval(() => {
      currentStep++;
      if (currentStep >= steps) {
        clearInterval(interval);
        setDisplayText(text);
      } else {
        setDisplayText(scramble());
      }
    }, intervalTime);

    return () => {
      clearInterval(interval);
    };
  }, [text]);

  return <>{displayText}</>;
}

interface FruitNinjaGameProps {
  onClose: () => void;
  isDark: boolean;
  userRole?: 'contestant' | 'contestant_operator' | 'admin' | null;
  onShowHistory?: () => void;
}

function drawVectorShape(ctx: CanvasRenderingContext2D, typeIdx: number, cx: number, cy: number, radius: number, isDark: boolean) {
  ctx.save();
  ctx.translate(cx, cy);

  if (typeIdx === 0) { // Stator
    // Base ring
    ctx.fillStyle = isDark ? '#475569' : '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Inner cutout
    ctx.fillStyle = isDark ? '#0f172a' : '#f8fafc';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.fill();

    // Copper coils (highly detailed)
    ctx.fillStyle = '#b45309'; // bronze/amber coils
    const numCoils = 12;
    for (let i = 0; i < numCoils; i++) {
        const angle = (i / numCoils) * Math.PI * 2;
        ctx.save();
        ctx.rotate(angle);
        ctx.beginPath();
        // Shape of coil segment
        ctx.moveTo(radius * 0.65, radius * 0.12);
        ctx.lineTo(radius * 0.95, radius * 0.16);
        ctx.lineTo(radius * 0.95, -radius * 0.16);
        ctx.lineTo(radius * 0.65, -radius * 0.12);
        ctx.fill();
        
        ctx.strokeStyle = '#d97706'; // copper highlight
        ctx.lineWidth = radius * 0.02;
        
        // Wrap lines
        for(let j=1; j<=4; j++){
           let xPos = radius * 0.65 + (radius * 0.3 * j / 5);
           ctx.beginPath();
           ctx.moveTo(xPos, radius * 0.13);
           ctx.lineTo(xPos, -radius * 0.13);
           ctx.stroke();
        }

        ctx.restore();
    }
    
    // Outer casing rim
    ctx.lineWidth = radius * 0.05;
    ctx.strokeStyle = '#94a3b8';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.7, 0, Math.PI * 2);
    ctx.stroke();
    
    // Bolt holes
    ctx.fillStyle = '#334155';
    for (let i = 0; i < 4; i++) {
       const angle = (i / 4) * Math.PI * 2 + Math.PI/4;
       ctx.beginPath();
       ctx.arc(Math.cos(angle)*radius*0.85, Math.sin(angle)*radius*0.85, radius*0.06, 0, Math.PI*2);
       ctx.fill();
    }
  } else if (typeIdx === 1) { // Wheel (Straight blades)
    ctx.fillStyle = '#94a3b8'; // Back plate
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring edge
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = radius * 0.04;
    ctx.beginPath();
    ctx.arc(0, 0, radius*0.98, 0, Math.PI*2);
    ctx.stroke();
    
    // Straight Blades
    ctx.fillStyle = '#e2e8f0'; 
    for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        ctx.beginPath();
        ctx.moveTo(radius * 0.1, -radius * 0.08);
        ctx.lineTo(radius * 0.95, -radius * 0.08);
        ctx.lineTo(radius * 0.95, radius * 0.08);
        ctx.lineTo(radius * 0.1, radius * 0.08);
        ctx.closePath();
        ctx.fill();
        
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = radius * 0.02;
        ctx.stroke();
        ctx.restore();
    }
    
    // Center hub cone
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bolt in center
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    // hex shape
    for(let i=0; i<6; i++) {
        const a = i * Math.PI / 3;
        const x = Math.cos(a) * radius * 0.12;
        const y = Math.sin(a) * radius * 0.12;
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
  } else if (typeIdx === 2) { // Impeller
    ctx.fillStyle = '#94a3b8'; // Back plate
    ctx.beginPath();
    ctx.arc(0, 0, radius, 0, Math.PI * 2);
    ctx.fill();

    // Outer ring edge
    ctx.strokeStyle = '#64748b';
    ctx.lineWidth = radius * 0.04;
    ctx.beginPath();
    ctx.arc(0, 0, radius*0.98, 0, Math.PI*2);
    ctx.stroke();
    
    // Blades
    ctx.fillStyle = '#e2e8f0'; 
    for (let i = 0; i < 8; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 4);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(radius * 0.4, radius * 0.6, radius * 0.95, radius * 0.1);
        ctx.quadraticCurveTo(radius * 0.5, radius * 0.2, 0, 0);
        ctx.fill();
        
        ctx.strokeStyle = '#94a3b8';
        ctx.lineWidth = radius * 0.02;
        ctx.stroke();
        ctx.restore();
    }
    
    // Center hub cone
    ctx.fillStyle = '#64748b';
    ctx.beginPath();
    ctx.arc(0, 0, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
    
    // Bolt in center
    ctx.fillStyle = '#cbd5e1';
    ctx.beginPath();
    // hex shape
    for(let i=0; i<6; i++) {
        const a = i * Math.PI / 3;
        const x = Math.cos(a) * radius * 0.12;
        const y = Math.sin(a) * radius * 0.12;
        if(i===0) ctx.moveTo(x,y);
        else ctx.lineTo(x,y);
    }
    ctx.closePath();
    ctx.fill();
  }

  ctx.restore();
}

const QUESTIONS = [
  {
    "text": "СФ / КФ / АСПО / ВВЭ|ЭЦН / ШГН|Постоянное дозирование реагента (ингибитор солеотложений, ингибитор коррозии, бактерицид, ингибитор АСПО, деэмульгатор) в затруб скважины через СУДР|Минимальное допустимое погружение насоса под Ндин? (метров)",
    "options": [
      "30",
      "50",
      "100",
      "150"
    ],
    "correct": "50"
  },
  {
    "text": "СФ / КФ / АСПО / ВВЭ|ЭЦН, ШГН|Постоянное дозирование реагента (ингибитор солеотложений, ингибитор коррозии, бактерицид, ингибитор АСПО, деэмульгатор) в затруб скважины через СУДР по импульсной трубке|Минимальное допустимое погружение насоса под Ндин? (метров)",
    "options": [
      "нет",
      "50",
      "100",
      "150"
    ],
    "correct": "нет"
  },
  {
    "text": "СФ / КФ / АСПО / ГГО / ВВЭ|ЭЦН / ШГН|Постоянное дозировании реагента (ингибитор солеотложений, ингибитор коррозии, бактерицид, ингибитор АСПО, деэмульгатор) в затруб скважины через СУДР|Максимально допустимый перепад давления (Рзат-Рлин) при открытой затрубной задвижке? (атм)",
    "options": [
      "3",
      "5",
      "10",
      "50"
    ],
    "correct": "3"
  },
  {
    "text": "СФ / КФ / АСПО / ГГО / ВВЭ|ЭЦН / ШГН|Постоянное дозировании реагента (ингибитор солеотложений, ингибитор коррозии, бактерицид, ингибитор АСПО, деэмульгатор) в затруб скважины через СУДР по импульсной трубке|Максимально допустимый перепад давления (Рзат-Рлин) при открытой затрубной задвижке? (атм)",
    "options": [
      "нет",
      "3",
      "5",
      "10"
    ],
    "correct": "нет"
  },
  {
    "text": "СФ / КФ / АСПО / ВВЭ|ЭЦН / ШГН|Постоянное дозировании реагентов в товарной форме (ингибиторов солеотложений, ингибиторов коррозии, бактерицида) в затруб скважины через СУДР|Ограничение по минимальному Qжидкости? (м3/сут)",
    "options": [
      "5",
      "10",
      "50",
      "100"
    ],
    "correct": "50"
  },
  {
    "text": "КФ|ЭЦН / ШГН|Постоянное дозирование ингибиторов коррозии в затруб скважины через СУДР|Ограничение по максимальному Qжидкости ЭЦН? (м3/сут)",
    "options": [
      "100",
      "300",
      "500",
      "800"
    ],
    "correct": "500"
  },
  {
    "text": "КФ|ЭЦН / ШГН|Постоянное дозирование ингибиторов коррозии в затруб скважины через СУДР|Ограничение по максимальному КВЧ? (мг/л)",
    "options": [
      "100",
      "300",
      "500",
      "1000"
    ],
    "correct": "1000"
  },
  {
    "text": "КФ|ЭЦН / ШГН|Постоянное дозирование ингибиторов коррозии в затруб скважины через СУДР|Ограничение по максимальной Т пласта? (гр. Цельсия)",
    "options": [
      "60",
      "70",
      "80",
      "90"
    ],
    "correct": "90"
  },
  {
    "text": "СФ / КФ / АСПО / ВВЭ|ЭЦН / ШГН|Периодическое дозирование реагентов (ингибиторов солеотложений, ингибиторов коррозии, бактерицидов, ингибиторов АСПО, деэмульгаторов) в затруб скважины через СУДР|Минимальное допустимое погружение насоса под Ндин? (метров)",
    "options": [
      "30",
      "50",
      "100",
      "150"
    ],
    "correct": "100"
  },
  {
    "text": "СФ / КФ / АСПО / ВВЭ|ЭЦН / ШГН|Периодическое дозирование реагентов (ингибиторов солеотложений, ингибиторов коррозии, бактерицидов, ингибиторов АСПО, деэмульгаторов) в затруб скважины через СУДР|Максимально допустимый перепад давления (Рзат-Рлин) при открытой затрубной задвижке? (атм)",
    "options": [
      "3",
      "5",
      "8",
      "10"
    ],
    "correct": "3"
  },
  {
    "text": "КФ|ЭЦН / ШГН|Периодическое дозирование ингибиторов коррозии в затруб скважины|Ограничение по максимальному Qжидкости? (м3/сут)",
    "options": [
      "100",
      "300",
      "500",
      "800"
    ],
    "correct": "500"
  },
  {
    "text": "КФ|ЭЦН / ШГН|Периодическое дозирование ингибиторов коррозии в затруб скважины|Ограничение по максимальному КВЧ? (мг/л)",
    "options": [
      "100",
      "300",
      "500",
      "1000"
    ],
    "correct": "1000"
  },
  {
    "text": "КФ|ЭЦН / ШГН|Периодическое дозирование ингибиторов коррозии в затруб скважины|Ограничение по максимальному Т пласта? (гр. Цельсия)",
    "options": [
      "60",
      "70",
      "80",
      "90"
    ],
    "correct": "90"
  },
  {
    "text": "СФ / КФ / АСПО|ЭЦН / ШГН|Неуправляемый внутрискважинный контейнер с ингибитором (ИС, ИК, ИАСПО)|Ограничение по максимальному Qжидкости?  (м3/сут)",
    "options": [
      "50",
      "75",
      "100",
      "125"
    ],
    "correct": "125"
  },
  {
    "text": "СФ / КФ / АСПО|ЭЦН / ШГН|Неуправляемый внутрискважинный контейнер с ингибитором (ИС, ИК, ИАСПО)|Максимальный период защиты? (суток)",
    "options": [
      "60",
      "90",
      "180",
      "365"
    ],
    "correct": "365"
  },
  {
    "text": "СФ / КФ / АСПО|ЭЦН|Управляемый внутрискважинный контейнер с ингибитором (ИС, ИК, ИАСПО)|Ограничение по максимальной Т пласта?",
    "options": [
      "60",
      "75",
      "80",
      "90"
    ],
    "correct": "75"
  },
  {
    "text": "СФ / КФ / АСПО|ЭЦН|Управляемый внутрискважинный контейнер с ингибитором (ИС, ИК, ИАСПО)|Максимальный период защиты? (суток)",
    "options": [
      "60",
      "90",
      "180",
      "365"
    ],
    "correct": "365"
  },
  {
    "text": "СФ / КФ / АСПО|ЭЦН|Управляемый внутрискважинный контейнер с ингибитором (ИС, ИК, ИАСПО)|Ограничение по максимальному Qжидкости? (м3/сут)",
    "options": [
      "50",
      "75",
      "100",
      "125"
    ],
    "correct": "125"
  },
  {
    "text": "МП, ЭрФ|ЭЦН|Фильтр модульный гр. Ф-2, Ф-3, Ф-4|Ограничение по максимальному Qжидкости ЭЦН ?  (м3/сут)",
    "options": [
      "200",
      "300",
      "400",
      "500"
    ],
    "correct": "400"
  },
  {
    "text": "МП, ЭрФ|ЭЦН|Сепаратор мех.примесей для ГНО гр.Ф-5|Ограничение по максимальному Qжидкости? (м3/сут)",
    "options": [
      "500",
      "700",
      "900",
      "950"
    ],
    "correct": "950"
  },
  {
    "text": "МП, ЭрФ|ЭЦН|Сепаратор мех.примесей для ГНО гр.Ф-5|Ограничение по минимальному Qжидкости? (м3/сут)",
    "options": [
      "5",
      "10",
      "25",
      "35"
    ],
    "correct": "5"
  },
  {
    "text": "МП, ЭрФ|ЭЦН|Сепаратор мех.примесей для ГНО гр.Ф-5|Ограничение по максимальному уголу наклона в месте размещения ГНО? (градусов)",
    "options": [
      "40",
      "60",
      "70",
      "90"
    ],
    "correct": "70"
  },
  {
    "text": "КФ / ЭрФ / АСПО / ГГО|Все СЭ|НКТ с внутренним покрытием Тип 1|Ограничение по максимальной Т пласта? (гр. Цельсия)",
    "options": [
      "60",
      "80",
      "110",
      "130"
    ],
    "correct": "60"
  },
  {
    "text": "КФ / ЭрФ / АСПО / ГГО|Все СЭ|НКТ с внутренним покрытием Тип 2|Ограничение по максимальной Т пласта? (гр. Цельсия)",
    "options": [
      "60",
      "80",
      "110",
      "130"
    ],
    "correct": "80"
  },
  {
    "text": "КФ / ЭрФ / АСПО / ГГО|Все СЭ|НКТ с внутренним покрытием Тип 3|Ограничение по максимальной Т пласта? (гр. Цельсия)",
    "options": [
      "60",
      "80",
      "110",
      "130"
    ],
    "correct": "110"
  },
  {
    "text": "СФ / КФ|Все СЭ|Капсулированный ИС, размещённый в ЗУМПФ скважины|Минимальный ЗУМПФ для применения технологии? (метр)",
    "options": [
      "10",
      "15",
      "20",
      "25"
    ],
    "correct": "15"
  },
  {
    "text": "СФ / КФ|Все СЭ|Капсулированный ИС, размещённый в ЗУМПФ скважины|Максимальная Т пласта для применения технологии? (гр. Цельсия)",
    "options": [
      "50",
      "60",
      "80",
      "90"
    ],
    "correct": "50"
  },
  {
    "text": "АСПО / ГГО / ВВН|ЭЦН|Греющий кабель (с наружным креплением на НКТ или с внутренним расположением в НКТ)|Максимальная Т пласта для применения греющего кабеля? (гр. Цельсия)",
    "options": [
      "110",
      "120",
      "130",
      "140"
    ],
    "correct": "140"
  },
  {
    "text": "КФ / АСПО|ЭЦН|НКТ из стеклопластика вся подвеска|Максимальная Т пласта для применения? (гр. Цельсия)",
    "options": [
      "60",
      "70",
      "80",
      "90"
    ],
    "correct": "90"
  },
  {
    "text": "ВГФ|ЭЦН|Конический УЭЦН|Ограничение по максимальному содержанию свободного газа (%) в насосе?",
    "options": [
      "25",
      "30",
      "35",
      "40"
    ],
    "correct": "35"
  },
  {
    "text": "ВГФ|ЭЦН|Мультифазный УЭЦН|Ограничение по максимальному содержанию свободного газа (%) в насосе?",
    "options": [
      "75",
      "80",
      "85",
      "90"
    ],
    "correct": "80"
  }
];

interface Circle {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  text: string;
  sliced: boolean;
  imageIdx: number;
  isCorrect: boolean;
  rotation: number;
  vRot: number;
  sliceAngle?: number;
  sliceProgress?: number;
}

interface Spark {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  color: string;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  alpha: number;
  color: string;
}


export default function FruitNinjaGame({ onClose, isDark, userRole, onShowHistory }: FruitNinjaGameProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const generateNewSessionQuestions = () => {
    let lastSessionIndices: number[] = [];
    try {
      const saved = localStorage.getItem('fn_last_session_indices');
      if (saved) {
        lastSessionIndices = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    if (!Array.isArray(lastSessionIndices)) {
      lastSessionIndices = [];
    }

    let lifetimeCounts: number[] = [];
    try {
      const saved = localStorage.getItem('fn_lifetime_counts');
      if (saved) {
        lifetimeCounts = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }

    if (!Array.isArray(lifetimeCounts) || lifetimeCounts.length !== QUESTIONS.length) {
      lifetimeCounts = new Array(QUESTIONS.length).fill(0);
    }

    const allIndices = QUESTIONS.map((_, i) => i);
    let availableIndices = allIndices.filter(idx => !lastSessionIndices.includes(idx));

    if (availableIndices.length < 10) {
      availableIndices = allIndices;
    }

    const shuffledAvailable = availableIndices.slice().sort(() => Math.random() - 0.5);
    shuffledAvailable.sort((a, b) => (lifetimeCounts[a] || 0) - (lifetimeCounts[b] || 0));

    const selectedIndices = shuffledAvailable.slice(0, 10);
    const sessionIndices = selectedIndices.sort(() => Math.random() - 0.5);

    sessionIndices.forEach(idx => {
      lifetimeCounts[idx] = (lifetimeCounts[idx] || 0) + 1;
    });

    try {
      localStorage.setItem('fn_lifetime_counts', JSON.stringify(lifetimeCounts));
      localStorage.setItem('fn_last_session_indices', JSON.stringify(sessionIndices));
    } catch (e) {
      console.error(e);
    }

    return sessionIndices.map(idx => ({
      ...QUESTIONS[idx],
      originalIdx: idx
    }));
  };

  const [sessionQuestions, setSessionQuestions] = useState<any[]>(() => generateNewSessionQuestions());

  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const [circles, setCircles] = useState<Circle[]>([]);
  const circlesRef = useRef<Circle[]>([]);
  const [sparks, setSparks] = useState<Spark[]>([]);
  const sparksRef = useRef<Spark[]>([]);
  const [pointerTrail, setPointerTrail] = useState<{x: number, y: number}[]>([]);
  const pointerTrailRef = useRef<{x: number, y: number}[]>([]);
  const shockwavesRef = useRef<Shockwave[]>([]);
  const shakeRef = useRef({ time: 0, intensity: 0, x: 0, y: 0 });
  const isSlicing = useRef(false);
  const pointerDown = useRef(false);
  const [isDone, setIsDone] = useState(false);
  const [canSlice, setCanSlice] = useState(true);
  const [showLocalHistory, setShowLocalHistory] = useState(false);

  const [incorrectAnswersList, setIncorrectAnswersList] = useState<{question: string, userAnswer: string, correctAnswer: string}[]>([]);

  const handleRestart = () => {
    const newQs = generateNewSessionQuestions();
    setSessionQuestions(newQs);
    setCurrentQuestionIdx(0);
    setCorrectCount(0);
    setIncorrectAnswersList([]);
    setIsDone(false);
    setShowLocalHistory(false);
  };

  // Auto-save history once isDone becomes true
  useEffect(() => {
    if (isDone) {
      const saveGameHistory = async () => {
        let history: any[] = [];
        const savedHistory = localStorage.getItem('quizHistory');
        if (savedHistory) {
          try {
            history = JSON.parse(savedHistory);
          } catch (e) {}
        }
        
        // Calculate session number for 'matrix-tz'
        const sessionNum = history.filter(h => h.moduleId === 'matrix-tz').length + 1;
        
        const newEntry = {
          date: new Date().toISOString(),
          session: sessionNum,
          score: `${correctCount}/${sessionQuestions.length}`,
          moduleId: 'matrix-tz',
          incorrectAnswers: incorrectAnswersList
        };
        
        const updatedHistory = [newEntry, ...history];
        localStorage.setItem('quizHistory', JSON.stringify(updatedHistory));
        window.dispatchEvent(new Event('storage'));
        window.dispatchEvent(new Event('sessionCompleted'));
        
        // Post to cloud if they are logged in as contestant, contestant operator or admin
        if (userRole === 'contestant' || userRole === 'contestant_operator' || userRole === 'admin') {
          try {
            await fetch('/api/history', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                ...newEntry,
                user: userRole === 'admin' ? 'Администратор' : (userRole === 'contestant_operator' ? 'ContestantOperator' : (localStorage.getItem('app_user_name') || 'Contestant')),
                correct_answers: correctCount
              })
            });
          } catch (error) {
            console.warn("Failed to save fruit ninja history to cloud:", error);
          }
        }
      };

      saveGameHistory();
    }
  }, [isDone, correctCount, sessionQuestions, incorrectAnswersList, userRole]);

  // Initialize circles for a question
  useEffect(() => {
    if (isDone || !containerRef.current) return;
    
    // setTimeout to ensure dimensions are ready if it just mounted
    const init = () => {
      if (!containerRef.current) return;
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      
      if (w === 0 || h === 0) {
        setTimeout(init, 50);
        return;
      }
      
      const r = Math.min(w, h) * 0.12 * 0.8; // Circle radius decreased by 20%
      
      const currentQ = sessionQuestions[currentQuestionIdx];
      if (!currentQ) return;
      
      const gravity = Math.max(h * 1.5, 800) * 0.64;
      
      const newCircles: Circle[] = currentQ.options.map((opt, i) => {
        // Base X to distribute somewhat across the screen, with slight random offset
        const xOffset = w * 0.6 / (currentQ.options.length - 1 || 1);
        const baseX = w * 0.2 + (i * xOffset);
        let x = baseX + (Math.random() - 0.5) * (xOffset * 0.3);
        x = Math.max(r, Math.min(w - r, x)); // keep within bounds

        // Start them at varied depths below the screen so they appear sequentially and chaotically
        const startYDepth = Math.random() * (h * 0.5); 
        
        // Target peak height (randomized between 15% and 25% from top)
        const peakHeightTop = h * 0.15 + (Math.random() * h * 0.1);
        const distanceToPeak = (h + r + 10 + startYDepth) - peakHeightTop;

        return {
          id: `c-${i}`,
          x,
          y: h + r + 10 + startYDepth, // start below bottom at different depths
          vx: (Math.random() - 0.5) * (w * 0.1), // Predominantly vertical trajectory
          vy: -Math.sqrt(2 * gravity * distanceToPeak), // Calculate velocity to reach target peak
          radius: r,
          text: opt,
          sliced: false,
          imageIdx: [2, 0, 1, 0][i % 4], // order: impeller - stator - wheel - stator
          isCorrect: opt === currentQ.correct,
          rotation: Math.random() * Math.PI * 2,
          vRot: 2 + Math.random() * 3, // initial speed 2-5 radians per second
        };
      });
      circlesRef.current = newCircles;
      setCanSlice(true);
    };
    init();
  }, [currentQuestionIdx, isDone, sessionQuestions]);

  // Main game loop
  useEffect(() => {
    let animationFrameId: number;
    let lastTime = performance.now();
    
    const loop = (time: number) => {
      if (!containerRef.current || !canvasRef.current) {
        animationFrameId = requestAnimationFrame(loop);
        return;
      }
      
      // limit max dt to avoid jumps if tab was inactive, reduce speed by 20% further (from 0.68 to 0.54) at user request
      const dt = Math.min((time - lastTime) / 1000, 0.1) * 0.544;
      lastTime = time;
      
      const w = containerRef.current.clientWidth;
      const h = containerRef.current.clientHeight;
      const gravity = Math.max(h * 1.5, 800) * 0.64; // Gravity in px/sec^2
      
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      
      if (canvas.width !== w || canvas.height !== h) {
        canvas.width = w;
        canvas.height = h;
      }
      
      // Update Physics
      const currentCircles = circlesRef.current;
      let allFallen = true;
      let anyNotSliced = false;
      
      for (let i = 0; i < currentCircles.length; i++) {
        const c = currentCircles[i];
        
        c.vy += gravity * dt;
        c.x += c.vx * dt;
        c.y += c.vy * dt;
        c.rotation += c.vRot * dt;
        c.vRot *= Math.max(0.1, 1 - 0.4 * dt); // damp angular velocity
        
        if (!c.sliced) {
          anyNotSliced = true;
          // Walls
          if (c.x < c.radius) { c.x = c.radius; c.vx = Math.abs(c.vx); }
          if (c.x > w - c.radius) { c.x = w - c.radius; c.vx = -Math.abs(c.vx); }
          
          if (c.y <= h + c.radius) {
            allFallen = false;
          } else {
            // Wait at bottom
            c.y = h + c.radius + 5;
            c.vy = 0;
            c.vx = 0;
          }
        } else {
          // Sliced parts separate slowly
          c.sliceProgress = (c.sliceProgress || 0) + dt * 2;
        }
      }

      // Throw all together if they have all fallen
      if (allFallen && anyNotSliced) {
        currentCircles.forEach(c => {
          if (!c.sliced) {
            const peakHeightTop = h * 0.15 + (Math.random() * h * 0.25);
            const distanceToPeak = (h + c.radius) - peakHeightTop;
            c.vy = -Math.sqrt(2 * gravity * distanceToPeak);
            c.vx = (Math.random() - 0.5) * (w * 0.1);
            c.vRot = 2 + Math.random() * 3;
          }
        });
      }
      
      // Circle collisions
      for (let i = 0; i < currentCircles.length; i++) {
        for (let j = i + 1; j < currentCircles.length; j++) {
          const c1 = currentCircles[i];
          const c2 = currentCircles[j];
          if (c1.sliced || c2.sliced) continue;
          
          const dx = c2.x - c1.x;
          const dy = c2.y - c1.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const minDist = c1.radius + c2.radius;
          
          if (dist < minDist) {
            // Collision resolution
            const angle = Math.atan2(dy, dx);
            const moveDist = (minDist - dist) / 2;
            c1.x -= Math.cos(angle) * moveDist;
            c1.y -= Math.sin(angle) * moveDist;
            c2.x += Math.cos(angle) * moveDist;
            c2.y += Math.sin(angle) * moveDist;
            
            // Simple velocity exchange along normal with slight dampening for less explosive chaos
            const nx = dx / dist;
            const ny = dy / dist;
            const p = 1.5 * (c1.vx * nx + c1.vy * ny - c2.vx * nx - c2.vy * ny) / 2;
            c1.vx -= p * nx;
            c1.vy -= p * ny;
            c2.vx += p * nx;
            c2.vy += p * ny;
          }
        }
      }
      
      // Update Sparks
      const currentSparks = sparksRef.current;
      for (let i = currentSparks.length - 1; i >= 0; i--) {
        const s = currentSparks[i];
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        s.vy += gravity * 0.5 * dt; // less gravity for sparks
        s.life -= dt;
        if (s.life < 0) {
          currentSparks.splice(i, 1);
        }
      }
      
      // Update Shake
      const shake = shakeRef.current;
      if (shake.time > 0) {
        shake.time -= dt;
        const currentIntensity = shake.intensity * (shake.time / 0.4); // fade out over 0.4s
        shake.x = (Math.random() - 0.5) * currentIntensity * 2;
        shake.y = (Math.random() - 0.5) * currentIntensity * 2;
        if (shake.time <= 0) {
          shake.x = 0;
          shake.y = 0;
        }
      } else {
        shake.x = 0;
        shake.y = 0;
      }

      // Update Shockwaves
      const currentShockwaves = shockwavesRef.current;
      for (let i = currentShockwaves.length - 1; i >= 0; i--) {
        const sw = currentShockwaves[i];
        sw.radius += dt * 500; // expand rapidly
        sw.alpha = Math.max(0, 1 - (sw.radius / sw.maxRadius));
        if (sw.radius >= sw.maxRadius || sw.alpha <= 0) {
          currentShockwaves.splice(i, 1);
        }
      }

      // Update trail
      const trail = pointerTrailRef.current;
      if (!pointerDown.current && trail.length > 0) {
         trail.shift();
         if (trail.length > 0) trail.shift(); // fade out faster
      }
      
      // Draw everything
      ctx.clearRect(0, 0, w, h);
      
      // Start Shake
      ctx.save();
      ctx.translate(shake.x, shake.y);
      
      // Draw circles
      currentCircles.forEach(c => {
        ctx.save();
        ctx.translate(c.x, c.y);
        ctx.rotate(c.rotation);
        ctx.translate(-c.x, -c.y);
        
        if (!c.sliced) {
          ctx.save();
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
          ctx.clip();
          
          drawVectorShape(ctx, c.imageIdx, c.x, c.y, c.radius, isDark);
          
          ctx.restore();
          
          // outline
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius, 0, Math.PI * 2);
          ctx.lineWidth = 4;
          ctx.strokeStyle = isDark ? '#334155' : '#e2e8f0';
          ctx.stroke();
          
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(-c.rotation);
          ctx.translate(-c.x, -c.y);
          
          // Text styling with shadow for readability
          let fontSize = Math.floor(c.radius * 0.5);
          ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let textWidth = ctx.measureText(c.text).width;
          const maxAllowedWidth = c.radius * 0.75;
          if (textWidth > maxAllowedWidth) {
            fontSize = Math.floor(fontSize * (maxAllowedWidth / textWidth));
            ctx.font = `bold ${fontSize}px Inter, sans-serif`;
          }
          
          // Draw a subtle dark semi-transparent band behind the text so it's readable over images
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';

          ctx.fillText(c.text, c.x, c.y);
          
          ctx.restore();
  
        } else {
          // Draw sliced
          const splitDist = (c.sliceProgress || 0) * 50;
          const angle = c.sliceAngle || 0;
          const dx = Math.cos(angle + Math.PI/2) * splitDist;
          const dy = Math.sin(angle + Math.PI/2) * splitDist;
          
          ctx.save();
          
          // Half 1
          ctx.beginPath();
          ctx.arc(c.x - dx, c.y - dy, c.radius, angle, angle + Math.PI);
          ctx.closePath();
          ctx.save();
          ctx.clip();
          drawVectorShape(ctx, c.imageIdx, c.x - dx, c.y - dy, c.radius, isDark);
          ctx.restore();

          // Sliced fading boundary glow
          const glowOpacity = Math.max(0, 1 - (c.sliceProgress || 0) * 0.8);
          if (glowOpacity > 0) {
            ctx.save();
            const rgb = c.isCorrect ? '34, 197, 94' : '239, 68, 68';
            for (let j = 8; j >= 1; j--) {
              ctx.beginPath();
              ctx.arc(c.x - dx, c.y - dy, c.radius, angle, angle + Math.PI);
              ctx.closePath();
              ctx.lineWidth = 4 + j * 18;
              ctx.strokeStyle = `rgba(${rgb}, ${glowOpacity * 0.22 * (1 - j / 9)})`;
              ctx.stroke();
            }
            ctx.restore();
          }

          ctx.lineWidth = 4;
          ctx.strokeStyle = c.isCorrect ? '#22c55e' : '#ef4444'; // Green if correct, red if incorrect
          ctx.beginPath();
          ctx.arc(c.x - dx, c.y - dy, c.radius, angle, angle + Math.PI);
          ctx.closePath();
          ctx.stroke();
          
          // Text half 1
          ctx.save();
          ctx.rect(c.x - dx - c.radius, c.y - dy - c.radius, c.radius * 2, c.radius * 2);
          ctx.clip();
          ctx.translate(-dx, -dy);
          
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(-c.rotation);
          ctx.translate(-c.x, -c.y);
          
          // Text styling with shadow for readability
          let fontSize1 = Math.floor(c.radius * 0.5);
          ctx.font = `bold ${fontSize1}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let textWidth1 = ctx.measureText(c.text).width;
          const maxAllowedWidth1 = c.radius * 0.75;
          if (textWidth1 > maxAllowedWidth1) {
            fontSize1 = Math.floor(fontSize1 * (maxAllowedWidth1 / textWidth1));
            ctx.font = `bold ${fontSize1}px Inter, sans-serif`;
          }
          
          // Draw a subtle dark semi-transparent band behind the text so it's readable over images
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';

          ctx.fillText(c.text, c.x, c.y);
  
          ctx.restore();
          ctx.restore();
          
          // Half 2
          ctx.beginPath();
          ctx.arc(c.x + dx, c.y + dy, c.radius, angle + Math.PI, angle + Math.PI * 2);
          ctx.closePath();
          ctx.save();
          ctx.clip();
          drawVectorShape(ctx, c.imageIdx, c.x + dx, c.y + dy, c.radius, isDark);
          ctx.restore();

          // Sliced fading boundary glow
          if (glowOpacity > 0) {
            ctx.save();
            const rgb = c.isCorrect ? '34, 197, 94' : '239, 68, 68';
            for (let j = 8; j >= 1; j--) {
              ctx.beginPath();
              ctx.arc(c.x + dx, c.y + dy, c.radius, angle + Math.PI, angle + Math.PI * 2);
              ctx.closePath();
              ctx.lineWidth = 4 + j * 18;
              ctx.strokeStyle = `rgba(${rgb}, ${glowOpacity * 0.22 * (1 - j / 9)})`;
              ctx.stroke();
            }
            ctx.restore();
          }

          ctx.lineWidth = 4;
          ctx.strokeStyle = c.isCorrect ? '#22c55e' : '#ef4444'; // Green if correct, red if incorrect
          ctx.beginPath();
          ctx.arc(c.x + dx, c.y + dy, c.radius, angle + Math.PI, angle + Math.PI * 2);
          ctx.closePath();
          ctx.stroke();
          
          // Text half 2
          ctx.save();
          ctx.rect(c.x + dx - c.radius, c.y + dy - c.radius, c.radius * 2, c.radius * 2);
          ctx.clip();
          ctx.translate(dx, dy);
          
          ctx.save();
          ctx.translate(c.x, c.y);
          ctx.rotate(-c.rotation);
          ctx.translate(-c.x, -c.y);
          
          // Text styling with shadow for readability
          let fontSize2 = Math.floor(c.radius * 0.5);
          ctx.font = `bold ${fontSize2}px Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          
          let textWidth2 = ctx.measureText(c.text).width;
          const maxAllowedWidth2 = c.radius * 0.75;
          if (textWidth2 > maxAllowedWidth2) {
            fontSize2 = Math.floor(fontSize2 * (maxAllowedWidth2 / textWidth2));
            ctx.font = `bold ${fontSize2}px Inter, sans-serif`;
          }
          
          // Draw a subtle dark semi-transparent band behind the text so it's readable over images
          ctx.fillStyle = 'rgba(0,0,0,0.6)';
          ctx.beginPath();
          ctx.arc(c.x, c.y, c.radius * 0.45, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = '#ffffff';

          ctx.fillText(c.text, c.x, c.y);
  
          ctx.restore();
          ctx.restore();
          
          ctx.restore();
        }
        
        ctx.restore(); // Restore rotation transform
      });
      
      // Draw sparks
      currentSparks.forEach(s => {
        ctx.beginPath();
        const a = Math.max(0, s.life * 2); // fade out
        ctx.fillStyle = `rgba(252, 211, 77, ${a})`; // yellowish sparks
        ctx.arc(s.x, s.y, 2 + Math.random() * 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw shockwaves
      currentShockwaves.forEach(sw => {
        ctx.save();
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        ctx.lineWidth = 14 * sw.alpha; // thicker and more beautiful, tapering down
        ctx.strokeStyle = `rgba(${sw.color}, ${sw.alpha})`;
        ctx.shadowBlur = 20;
        ctx.shadowColor = `rgba(${sw.color}, ${sw.alpha * 0.7})`;
        ctx.stroke();
        
        // Dynamic radial inner glow
        ctx.beginPath();
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
        const grad = ctx.createRadialGradient(sw.x, sw.y, sw.radius * 0.4, sw.x, sw.y, sw.radius);
        grad.addColorStop(0, `rgba(${sw.color}, 0)`);
        grad.addColorStop(1, `rgba(${sw.color}, ${sw.alpha * 0.25})`);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.restore();
      });

      // Draw trail
      if (trail.length > 1) {
        ctx.beginPath();
        ctx.moveTo(trail[0].x, trail[0].y);
        for(let i=1; i<trail.length; i++) {
          ctx.lineTo(trail[i].x, trail[i].y);
        }
        
        ctx.lineWidth = 6;
        ctx.lineCap = "round";
        ctx.lineJoin = "round";
        ctx.strokeStyle = isDark ? "rgba(148, 163, 184, 0.5)" : "rgba(100, 116, 139, 0.3)";
        ctx.stroke();
        
        ctx.lineWidth = 3;
        ctx.strokeStyle = isDark ? "rgba(226, 232, 240, 1)" : "rgba(30, 41, 59, 1)"; // graphite color (slate-800)
        ctx.stroke();
      }
      
      // Restore Shake
      ctx.restore();
      
      // Check for slicing
      if (canSlice && trail.length >= 2) {
        const last = trail[trail.length - 1];
        const prev = trail[trail.length - 2];
        
        currentCircles.forEach((c) => {
          if (c.sliced) return;
          
          // check line intersection with circle
          const dist = distToSegment(c, prev, last);
          if (dist < c.radius) {
            // Slice it!
            setCanSlice(false);
            
            const currentQ = sessionQuestions[currentQuestionIdx];
            if (c.text === currentQ.correct) {
              setCorrectCount(prev => prev + 1);
            } else {
              setIncorrectAnswersList(prevList => [
                ...prevList,
                {
                  question: currentQ.text,
                  userAnswer: c.text,
                  correctAnswer: currentQ.correct
                }
              ]);
            }

            c.sliced = true;
            c.vy = -10; // pop up slightly when sliced
            c.sliceAngle = Math.atan2(last.y - prev.y, last.x - prev.x);
            c.sliceProgress = 0;

            // Trigger screen shake
            shakeRef.current = {
              time: 0.4,
              intensity: 18,
              x: 0,
              y: 0
            };

            // Spawn shockwaves
            const swColor = c.isCorrect ? '34, 197, 94' : '239, 68, 68';
            shockwavesRef.current.push({
              x: c.x,
              y: c.y,
              radius: c.radius * 0.4,
              maxRadius: c.radius * 3.5,
              alpha: 1.0,
              color: swColor
            });
            // A second slightly delayed / outer shockwave ring for richer impact
            shockwavesRef.current.push({
              x: c.x,
              y: c.y,
              radius: c.radius * 0.1,
              maxRadius: c.radius * 2.5,
              alpha: 0.8,
              color: swColor
            });
            
            // Generate sparks
            for(let i=0; i<30; i++) {
              currentSparks.push({
                id: Math.random(),
                x: c.x + (Math.random() - 0.5) * c.radius,
                y: c.y + (Math.random() - 0.5) * c.radius,
                vx: (Math.random() - 0.5) * 800 + (last.x - prev.x) * 10,
                vy: (Math.random() - 0.5) * 800 + (last.y - prev.y) * 10,
                life: 0.5 + Math.random() * 0.5,
                color: ''
              });
            }
            
            // Advance to next question after delay
            setTimeout(() => {
              if (currentQuestionIdx < sessionQuestions.length - 1) {
                setCurrentQuestionIdx(idx => idx + 1);
              } else {
                setIsDone(true);
              }
            }, 1500);
          }
        });
      }
      
      animationFrameId = requestAnimationFrame(loop);
    };
    
    animationFrameId = requestAnimationFrame(loop);
    
    return () => cancelAnimationFrame(animationFrameId);
  }, [currentQuestionIdx, isDone, canSlice, isDark, sessionQuestions]);
  
  // Helpers for line segment distance
  const distToSegmentSquared = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
    const l2 = (w.x - v.x)*(w.x - v.x) + (w.y - v.y)*(w.y - v.y);
    if (l2 === 0) return (p.x - v.x)*(p.x - v.x) + (p.y - v.y)*(p.y - v.y);
    let t = ((p.x - v.x) * (w.x - v.x) + (p.y - v.y) * (w.y - v.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    return (p.x - (v.x + t * (w.x - v.x)))**2 + (p.y - (v.y + t * (w.y - v.y)))**2;
  }
  const distToSegment = (p: {x: number, y: number}, v: {x: number, y: number}, w: {x: number, y: number}) => {
    return Math.sqrt(distToSegmentSquared(p, v, w));
  }

  const handlePointerDown = (e: React.PointerEvent) => {
    pointerDown.current = true;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      pointerTrailRef.current = [{x: e.clientX - rect.left, y: e.clientY - rect.top}];
    }
  };
  
  const handlePointerMove = (e: React.PointerEvent) => {
    if (!pointerDown.current) return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (rect) {
      pointerTrailRef.current.push({x: e.clientX - rect.left, y: e.clientY - rect.top});
      if (pointerTrailRef.current.length > 20) {
        pointerTrailRef.current.shift();
      }
    }
  };
  
  const handlePointerUp = () => {
    pointerDown.current = false;
  };

  if (isDone) {
    if (showLocalHistory) {
      const historyList = (() => {
        let history: any[] = [];
        const savedHistory = localStorage.getItem('quizHistory');
        if (savedHistory) {
          try {
            history = JSON.parse(savedHistory);
          } catch (e) {}
        }
        return history.filter(h => {
          if (h.moduleId !== 'matrix-tz') return false;
          if (userRole === 'contestant_operator') {
            return h.user === 'ContestantOperator' || h.user === 'Конкурсант (Оператор)';
          } else if (userRole === 'admin') {
            return true;
          } else {
            return h.user !== 'admin' && h.user !== 'Администратор' && h.user !== 'ContestantOperator' && h.user !== 'Конкурсант (Оператор)';
          }
        });
      })();

      const clearGameHistory = () => {
        let history: any[] = [];
        const savedHistory = localStorage.getItem('quizHistory');
        if (savedHistory) {
          try {
            history = JSON.parse(savedHistory);
          } catch (e) {}
        }
        const filtered = history.filter(h => h.moduleId !== 'matrix-tz');
        localStorage.setItem('quizHistory', JSON.stringify(filtered));
        window.dispatchEvent(new Event('storage'));
        setShowLocalHistory(false);
      };

      return (
        <div className="absolute inset-0 z-50 flex flex-col p-4 overflow-hidden" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
          <div className="w-full max-w-sm mx-auto h-full flex flex-col">
            {/* Header */}
            <div className={`p-4 border-b flex justify-between items-center ${isDark ? 'border-white/10' : 'border-slate-200'}`}>
              <div className="flex flex-col text-left">
                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}>История сессий</span>
                <h3 className={`font-bold text-sm truncate max-w-[200px] ${isDark ? 'text-white' : 'text-slate-900'}`}>Матрица ТЗ</h3>
              </div>
              <button 
                onClick={() => setShowLocalHistory(false)}
                className={`px-4 py-2 rounded-xl border font-bold text-xs uppercase transition-all active:scale-[0.98]
                  ${isDark ? 'bg-white/5 border-white/10 text-white hover:bg-white/10' : 'bg-white border-slate-200 text-slate-900 hover:bg-slate-50'}`}
              >
                Назад
              </button>
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1 no-scrollbar">
              {historyList.length === 0 ? (
                <div className={`flex flex-col items-center justify-center py-24 italic text-sm text-center ${isDark ? 'text-white/20' : 'text-slate-300'}`}>
                  <svg viewBox="0 0 24 24" className="w-12 h-12 mb-4 opacity-10 mx-auto" fill="none" stroke="currentColor" strokeWidth="1">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Попыток еще не было
                </div>
              ) : (
                historyList.map((entry, idx) => {
                  const [correct, totalVal] = entry.score.split('/').map(Number);
                  const isSuccess = correct >= Math.ceil(totalVal * 0.8);
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
                    <motion.div 
                      key={idx}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: idx * 0.05 }}
                      className={`p-5 rounded-2xl border relative overflow-hidden text-left ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}
                    >
                      {isSuccess && <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-500/10 rounded-full blur-2xl"></div>}
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1">Сессия {entry.session}</span>
                          <span className={`text-[10px] font-bold ${isDark ? 'text-white/50' : 'text-slate-400'}`}>{formattedDate}</span>
                        </div>
                        <div className="flex flex-col items-end">
                          <span className={`text-xl font-black ${isSuccess ? 'text-green-500' : 'text-indigo-500'}`}>{entry.score}</span>
                          <span className={`text-[8px] font-black uppercase tracking-tighter ${isSuccess ? 'text-green-600/50' : 'text-indigo-500/50'}`}>
                            {isSuccess ? 'Успешно' : 'Нужна практика'}
                          </span>
                        </div>
                      </div>

                      {entry.incorrectAnswers && entry.incorrectAnswers.length > 0 && (
                        <div className={`mt-4 pt-4 border-t space-y-4 ${isDark ? 'border-white/5' : 'border-slate-100'}`}>
                          <span className="text-[9px] uppercase font-black text-red-500/60 tracking-widest">Разбор ошибок ({entry.incorrectAnswers.length}):</span>
                          {entry.incorrectAnswers.map((err: any, i: number) => (
                            <div key={i} className={`text-[11px] space-y-1 p-3 rounded-xl border text-left ${isDark ? 'bg-black/20 border-white/5' : 'bg-slate-50 border-slate-100'}`}>
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
                                  <span className="text-red-500/80 font-bold uppercase text-[7px] px-1 py-0.5 bg-red-500/10 rounded self-start mt-0.5">Ваш выбор</span>
                                  {renderUserAnswerLines(err.userAnswer, isDark)}
                                </div>
                                <div className="flex gap-2">
                                  <span className="text-green-500 font-bold uppercase text-[7px] px-1 py-0.5 bg-green-500/10 rounded self-start">Верно</span>
                                  <span className={isDark ? 'text-green-300/80' : 'text-green-600'}>{err.correctAnswer}</span>
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
            {userRole === 'admin' && historyList.length > 0 && (
              <div className="pt-2 pb-4 mt-auto">
                <button 
                  onClick={clearGameHistory}
                  className={`w-full py-3 border rounded-xl text-[10px] font-black uppercase tracking-widest transition-all
                    ${isDark ? 'bg-red-500/5 border-red-500/10 text-red-500/50 hover:bg-red-500 hover:text-white' : 'bg-red-50 border-red-100 text-red-500 hover:bg-red-500 hover:text-white'}`}
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
      <div className="absolute inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: isDark ? '#0f172a' : '#f8fafc' }}>
        <div className="text-center w-full max-w-sm">
          <h2 className={`text-4xl font-black mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Итоги</h2>
          
          <div className={`p-8 rounded-[2.5rem] mt-8 mb-8 border backdrop-blur-md relative overflow-hidden group
            ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <p className={`text-sm uppercase tracking-widest font-bold mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>Верных ответов</p>
            <div className={`text-8xl font-black mb-4 ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              <span className="text-6xl">{correctCount}</span>
              <span className={`text-2xl text-slate-500 ml-1`}>/ {sessionQuestions.length}</span>
            </div>
          </div>

          <div className="flex flex-col gap-3 w-full">
            <button 
              onClick={handleRestart}
              className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-lg active:scale-[0.98] transition-all
                ${isDark ? 'bg-slate-700 hover:bg-slate-600 text-white border border-white/10' : 'bg-slate-700 hover:bg-slate-800 text-white'}`}
            >
              Продолжить
            </button>

            <button 
              onClick={() => setShowLocalHistory(true)}
              className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all border shadow-sm
                ${isDark 
                  ? 'bg-white text-slate-800 border-white/10 hover:bg-slate-100' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              История
            </button>

            <button 
              onClick={onClose}
              className={`w-full py-4 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-[0.98] transition-all border shadow-sm
                ${isDark 
                  ? 'bg-white text-slate-800 border-white/10 hover:bg-slate-100' 
                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-800'}`}
            >
              В главное меню
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="absolute inset-0 z-50 overflow-hidden" 
      style={{ 
        backgroundColor: isDark ? '#0f172a' : '#f8fafc',
        touchAction: 'none'
      }}
    >
      <div className="absolute top-8 left-0 right-0 flex justify-center px-4 pointer-events-none z-10">
         <div className={`p-4 rounded-xl max-w-lg w-full text-center shadow-lg border backdrop-blur-sm
           ${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-white/80 border-slate-200/50'}`}>
            <span className={`text-[10px] font-black uppercase tracking-widest ${isDark ? 'text-indigo-400' : 'text-indigo-600'} block mb-2`}>
              Вопрос {currentQuestionIdx + 1} из {sessionQuestions.length}
            </span>
            {sessionQuestions[currentQuestionIdx]?.text && sessionQuestions[currentQuestionIdx].text.includes('|') ? (
              <div className="w-full mt-2 overflow-hidden rounded border border-slate-600 bg-white/20">
                <table className="w-full text-left border-collapse">
                  <tbody>
                    {sessionQuestions[currentQuestionIdx].text.split('|').map((row: string, idx: number) => (
                      <tr key={idx} className="border-b border-slate-600 last:border-0 hover:bg-slate-500/10 transition-colors">
                        <td className={`p-2 font-medium text-sm ${isDark ? 'text-white' : 'text-slate-900'}`}>
                          <DecodingText key={`${currentQuestionIdx}-${idx}`} text={row} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <h2 className={`text-[17px] font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {sessionQuestions[currentQuestionIdx]?.text && <DecodingText key={currentQuestionIdx} text={sessionQuestions[currentQuestionIdx].text} />}
              </h2>
            )}
         </div>
      </div>
      
      <button 
        onClick={onClose}
        className="absolute top-6 right-6 w-12 h-12 rounded-full bg-black/20 flex items-center justify-center z-20 text-white backdrop-blur-md"
      >
        <svg viewBox="0 0 24 24" className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 18L18 6M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      <div 
        ref={containerRef} 
        className="w-full h-full cursor-crosshair"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
      >
        <canvas 
          ref={canvasRef} 
          className="w-full h-full block touch-none"
        />
      </div>
    </div>
  );
}
