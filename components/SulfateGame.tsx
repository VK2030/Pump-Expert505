
import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

import CloudStatus from './CloudStatus';
import SplitText from './SplitText';

// --- Константы данных ---
const TOPICS = {
    sulfates: {
        title: 'Сульфаты',
        tasks: [
            { text: 'Найди сульфат кальция', correct: 'CaSO4' },
            { text: 'Найди сульфат бария', correct: 'BaSO4' },
            { text: 'Найди сульфат стронция', correct: 'SrSO4' }
        ],
        answers: ['CaSO4', 'BaSO4', 'SrSO4', 'CaCO3', 'MgCO3', 'FeS', 'NaCl']
    },
    carbonates: {
        title: 'Карбонаты',
        tasks: [
            { text: 'Найди карбонат кальция', correct: 'CaCO3' },
            { text: 'Найди карбонат магния', correct: 'MgCO3' }
        ],
        answers: ['CaCO3', 'MgCO3', 'CaSO4', 'BaSO4', 'SrSO4', 'FeS', 'NaCl']
    },
    sulfides: {
        title: 'Сульфиды',
        tasks: [
            { text: 'Найди сульфид железа', correct: 'FeS' }
        ],
        answers: ['FeS', 'CaSO4', 'BaSO4', 'SrSO4', 'CaCO3', 'MgCO3', 'NaCl']
    },
    halides: {
        title: 'Хлориды/галиты',
        tasks: [
            { text: 'Найди хлористый натрий', correct: 'NaCl' }
        ],
        answers: ['NaCl', 'CaSO4', 'BaSO4', 'SrSO4', 'CaCO3', 'MgCO3', 'FeS']
    }
};

const CONSTANT_SPEED = 77;
const GAME_TIME = 30;

interface SulfateGameProps {
  onClose: () => void;
  isDark?: boolean;
  syncStatus?: 'syncing' | 'synced' | 'error';
}

const SulfateGame: React.FC<SulfateGameProps> = ({ onClose, isDark = true, syncStatus = 'synced' }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const particlesContainerRef = useRef<HTMLDivElement>(null);
  
  const [gameState, setGameState] = useState<'playing' | 'gameOver'>('playing');
  const [currentSessionIndex, setCurrentSessionIndex] = useState(0);
  const [currentTaskIndex, setCurrentTaskIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
  const [errors, setErrors] = useState(0);
  const [totalCompleted, setTotalCompleted] = useState(0);
  const [totalErrors, setTotalErrors] = useState(0);
  const [showWrong, setShowWrong] = useState(false);
  const [canvasShake, setCanvasShake] = useState(false);
  const [collectedAnswers, setCollectedAnswers] = useState<string[]>([]);

  const formatFormula = (formula: string) => {
    return formula.split(/([0-9]+)/).map((part, index) => {
      if (/[0-9]+/.test(part)) {
        return <sub key={index} className="text-[0.6em] relative -bottom-1">{part}</sub>;
      }
      return <span key={index}>{part}</span>;
    });
  };

  const sessions = Object.keys(TOPICS) as Array<keyof typeof TOPICS>;
  const totalTasksCount = sessions.reduce((sum, key) => sum + TOPICS[key].tasks.length, 0);

  const gameRef = useRef({
    badges: [] as any[],
    bubble: null as any,
    lastTime: performance.now(),
    frameId: 0,
    isPlaying: false
  });

  // --- Вспомогательные классы ---
  class AnswerBadge {
    text: string; x: number; y: number; vx: number; vy: number;
    radius = 24; visualRadius = 27; shake = 0; fadeOut = 0; glowIntensity = 0;
    popScale = 1;

    constructor(text: string, x: number, y: number, vx: number, vy: number) {
      this.text = text; this.x = x; this.y = y;
      const speed = Math.sqrt(vx * vx + vy * vy) || 1;
      this.vx = (vx / speed) * CONSTANT_SPEED;
      this.vy = (vy / speed) * CONSTANT_SPEED;
    }

    update(dt: number) {
      this.x += this.vx * dt;
      this.y += this.vy * dt;
      if (this.shake > 0) this.shake -= dt * 5;
      if (this.fadeOut > 0) { 
        this.fadeOut += dt * 8; 
        this.popScale += dt * 4;
        if (this.fadeOut > 1) this.fadeOut = 1; 
      }
      if (this.glowIntensity > 0) { this.glowIntensity -= dt * 2; if (this.glowIntensity < 0) this.glowIntensity = 0; }
    }

    normalizeSpeed() {
      const speed = Math.sqrt(this.vx * this.vx + this.vy * this.vy);
      if (speed > 0) { this.vx = (this.vx / speed) * CONSTANT_SPEED; this.vy = (this.vy / speed) * CONSTANT_SPEED; }
    }

    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      const opacity = 1 - this.fadeOut;
      ctx.globalAlpha = opacity;
      
      let drawX = this.x;
      let drawY = this.y;
      
      if (this.shake > 0) {
        drawX += Math.sin(this.shake * 50) * 4;
        drawY += Math.cos(this.shake * 50) * 4;
      }

      ctx.translate(drawX, drawY);
      ctx.scale(this.popScale, this.popScale);

      if (this.glowIntensity > 0) {
        ctx.shadowColor = `rgba(34, 197, 94, ${this.glowIntensity})`; 
        ctx.shadowBlur = 30 * this.glowIntensity;
      }

      const grad = ctx.createRadialGradient(-8, -8, 3, 0, 0, 27);
      if (this.shake > 0) {
        grad.addColorStop(0, '#f87171'); grad.addColorStop(1, '#ef4444');
      } else if (this.glowIntensity > 0) {
        grad.addColorStop(0, '#bbf7d0'); grad.addColorStop(1, '#22c55e'); 
      } else {
        grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)'); 
        grad.addColorStop(1, 'rgba(226, 232, 240, 0.9)');
      }

      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(0, 0, this.visualRadius, 0, Math.PI * 2); ctx.fill();
      
      ctx.strokeStyle = this.shake > 0 ? 'rgba(239, 68, 68, 0.4)' : 'rgba(99, 102, 241, 0.15)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.shadowBlur = 0;
      ctx.fillStyle = this.shake > 0 ? 'white' : '#0f172a';
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

      const parts = this.text.split(/([0-9]+)/);
      let totalW = 0;
      parts.forEach(p => {
        ctx.font = /^[0-9]+$/.test(p) ? 'bold 9px Inter' : 'bold 12px Inter';
        totalW += ctx.measureText(p).width;
      });

      let startX = -totalW / 2;
      parts.forEach(p => {
        if (!p) return;
        const isNum = /^[0-9]+$/.test(p);
        ctx.font = isNum ? 'bold 9px Inter' : 'bold 12px Inter';
        ctx.textAlign = 'left';
        ctx.fillText(p, startX, isNum ? 4 : 0);
        startX += ctx.measureText(p).width;
      });
      
      ctx.restore();
    }
  }

  class Bubble {
    x: number; y: number; radius: number;
    constructor(x: number, y: number, r: number) { this.x = x; this.y = y; this.radius = r; }
    draw(ctx: CanvasRenderingContext2D) {
      ctx.save();
      const grad = ctx.createRadialGradient(this.x, this.y, this.radius * 0.7, this.x, this.y, this.radius);
      grad.addColorStop(0, 'rgba(99, 102, 241, 0.05)');
      grad.addColorStop(1, 'rgba(99, 102, 241, 0.15)');
      ctx.fillStyle = grad;
      ctx.beginPath(); ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2); ctx.fill();
      ctx.strokeStyle = 'rgba(99, 102, 241, 0.2)'; ctx.lineWidth = 1; ctx.stroke();
      ctx.restore();
    }
    constrain(badge: any) {
      const dx = badge.x - this.x; const dy = badge.y - this.y;
      const dist = Math.sqrt(dx*dx + dy*dy);
      const maxDist = this.radius - badge.radius;
      if (dist > maxDist) {
        const angle = Math.atan2(dy, dx);
        badge.x = this.x + Math.cos(angle) * maxDist;
        badge.y = this.y + Math.sin(angle) * maxDist;
        const nx = Math.cos(angle); const ny = Math.sin(angle);
        const dot = badge.vx * nx + badge.vy * ny;
        badge.vx -= 2 * dot * nx;
        badge.vy -= 2 * dot * ny;
        badge.normalizeSpeed();
      }
    }
  }

  const createSpark = (x: number, y: number, color: string) => {
    if (!particlesContainerRef.current) return;
    
    // Create more varied particles
    const particleCount = 15;
    for (let i = 0; i < particleCount; i++) {
      const el = document.createElement('div');
      const size = 3 + Math.random() * 5;
      Object.assign(el.style, {
        position: 'absolute', left: `${x}px`, top: `${y}px`, 
        width: `${size}px`, height: `${size}px`,
        borderRadius: '50%', background: color, pointerEvents: 'none', zIndex: '100',
        boxShadow: `0 0 ${size*2}px ${color}`
      });
      
      const angle = (i / particleCount) * Math.PI * 2 + (Math.random() * 0.5);
      const velocity = 80 + Math.random() * 120;
      const dist = velocity * 0.6;
      
      el.animate([
        { transform: 'translate(0,0) scale(1)', opacity: 1 },
        { transform: `translate(${Math.cos(angle) * dist}px, ${Math.sin(angle) * dist}px) scale(0)`, opacity: 0 }
      ], { 
        duration: 400 + Math.random() * 400, 
        easing: 'cubic-bezier(0, .9, .57, 1)' 
      }).onfinish = () => el.remove();
      
      particlesContainerRef.current.appendChild(el);
    }
  };

  const createShockwave = (x: number, y: number, color: string) => {
    if (!particlesContainerRef.current) return;
    const wave = document.createElement('div');
    Object.assign(wave.style, {
      position: 'absolute', left: `${x}px`, top: `${y}px`,
      width: '10px', height: '10px', marginLeft: '-5px', marginTop: '-5px',
      borderRadius: '50%', border: `2px solid ${color}`, pointerEvents: 'none', zIndex: '90'
    });
    wave.animate([
      { transform: 'scale(1)', opacity: 0.8 },
      { transform: 'scale(8)', opacity: 0 }
    ], { duration: 400, easing: 'ease-out' }).onfinish = () => wave.remove();
    particlesContainerRef.current.appendChild(wave);
  };

  const createTrail = (x: number, y: number) => {
    if (!particlesContainerRef.current) return;
    const el = document.createElement('div');
    Object.assign(el.style, {
      position: 'absolute', left: `${x}px`, top: `${y}px`, width: '2px', height: '2px',
      background: 'rgba(99, 102, 241, 0.4)', borderRadius: '50%', pointerEvents: 'none'
    });
    el.animate([
      { transform: 'scale(2)', opacity: 0.6 },
      { transform: 'scale(0)', opacity: 0 }
    ], { duration: 400 }).onfinish = () => el.remove();
    particlesContainerRef.current.appendChild(el);
  };

  const spawn = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const topic = TOPICS[sessions[currentSessionIndex]];
    const bX = canvas.width / 2;
    const bY = canvas.height * 0.42;
    const bR = Math.min(canvas.width * 0.42, canvas.height * 0.35);
    gameRef.current.bubble = new Bubble(bX, bY, bR);
    gameRef.current.badges = topic.answers.map((text, i) => {
      const angle = (i / topic.answers.length) * Math.PI * 2;
      return new AnswerBadge(text, bX + Math.cos(angle) * bR * 0.4, bY + Math.sin(angle) * bR * 0.4, Math.random() - 0.5, Math.random() - 0.5);
    });
  };

  const resetGame = () => {
    setErrors(0);
    setTotalErrors(0);
    setTotalCompleted(0);
    setCurrentSessionIndex(0);
    setCurrentTaskIndex(0);
    setTimeLeft(GAME_TIME);
    setCollectedAnswers([]);
    setGameState('playing');
    if (currentSessionIndex === 0) {
      spawn();
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const loop = (now: number) => {
      const dt = Math.min((now - gameRef.current.lastTime) / 1000, 0.1);
      gameRef.current.lastTime = now;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      if (gameRef.current.bubble) {
        gameRef.current.bubble.draw(ctx);
        gameRef.current.badges = gameRef.current.badges.filter(b => b.fadeOut < 1);
        gameRef.current.badges.forEach((b, i) => {
          b.update(dt);
          gameRef.current.bubble.constrain(b);
          for (let j = i + 1; j < gameRef.current.badges.length; j++) {
            const b2 = gameRef.current.badges[j];
            if (b2.fadeOut > 0 || b.fadeOut > 0) continue;
            const dx = b2.x - b.x; const dy = b2.y - b.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const min = b.radius + b2.radius;
            if (dist < min && dist > 0) {
              const angle = Math.atan2(dy, dx);
              const overlap = (min - dist) / 2;
              b.x -= Math.cos(angle) * overlap; b.y -= Math.sin(angle) * overlap;
              b2.x += Math.cos(angle) * overlap; b2.y += Math.sin(angle) * overlap;
              const nx = dx / dist; const ny = dy / dist;
              const p = 2 * (b.vx * nx + b.vy * ny - b2.vx * nx - b2.vy * ny) / 2;
              b.vx -= p * nx; b.vy -= p * ny;
              b2.vx += p * nx; b2.vy += p * ny;
              b.normalizeSpeed(); b2.normalizeSpeed();
            }
          }
          if (gameRef.current.isPlaying && b.fadeOut === 0 && Math.random() > 0.8) createTrail(b.x, b.y);
          b.draw(ctx);
        });
      }
      gameRef.current.frameId = requestAnimationFrame(loop);
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      spawn();
    };

    window.addEventListener('resize', resize);
    resize();
    gameRef.current.frameId = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(gameRef.current.frameId);
    };
  }, [currentSessionIndex]);

  const handleInteraction = (e: any) => {
    if (gameState !== 'playing') return;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const clientX = e.clientX || (e.touches && e.touches[0].clientX);
    const clientY = e.clientY || (e.touches && e.touches[0].clientY);
    const x = clientX - rect.left;
    const y = clientY - rect.top;

    const topic = TOPICS[sessions[currentSessionIndex]];
    const currentTask = topic.tasks[currentTaskIndex];
    
    for (let i = gameRef.current.badges.length - 1; i >= 0; i--) {
      const b = gameRef.current.badges[i];
      if (b.fadeOut > 0) continue;
      const dist = Math.sqrt((b.x - x)**2 + (b.y - y)**2);
      if (dist < b.visualRadius) {
        if (b.text === currentTask.correct) {
          // Visual pop
          b.glowIntensity = 1; 
          b.fadeOut = 0.01;
          
          // Enhanced effects
          createSpark(b.x, b.y, '#22c55e');
          createShockwave(b.x, b.y, '#4ade80');
          setCanvasShake(true);
          setTimeout(() => setCanvasShake(false), 150);
          
          setTotalCompleted(prev => prev + 1);
          setCollectedAnswers(prev => [...prev, b.text]);
          setTimeout(() => {
            if (currentTaskIndex < topic.tasks.length - 1) {
              setCurrentTaskIndex(prev => prev + 1);
              setTimeLeft(GAME_TIME);
            } else if (currentSessionIndex < sessions.length - 1) {
              setCurrentSessionIndex(prev => prev + 1);
              setCurrentTaskIndex(0);
              setTimeLeft(GAME_TIME);
              setCollectedAnswers([]);
            } else {
              setGameState('gameOver');
            }
          }, 500);
        } else {
          b.shake = 1;
          createSpark(b.x, b.y, '#ef4444');
          createShockwave(b.x, b.y, '#f87171');
          setErrors(prev => prev + 1);
          setTotalErrors(prev => prev + 1);
          setShowWrong(true);
          setTimeout(() => setShowWrong(false), 800);
        }
        break;
      }
    }
  };

  useEffect(() => {
    gameRef.current.isPlaying = gameState === 'playing';
    let timer: any;
    if (gameState === 'playing') {
      timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) { setGameState('gameOver'); return 0; }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [gameState]);

  return (
    <div ref={containerRef} className={`fixed inset-0 z-[70] flex flex-col overflow-hidden select-none touch-none font-sans ${isDark ? 'bg-[#081221]' : 'bg-slate-50'}`}>
      <style>{`
        @keyframes shakeCanvas {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-3px, 2px); }
          50% { transform: translate(3px, -2px); }
          75% { transform: translate(-2px, -3px); }
          100% { transform: translate(0, 0); }
        }
        .canvas-shake {
          animation: shakeCanvas 0.15s ease-in-out;
        }
      `}</style>
      
      <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(99,102,241,0.1)_0%,transparent_50%)]" />
      </div>

      <div ref={particlesContainerRef} className="absolute inset-0 z-50 pointer-events-none" />

      <canvas 
        ref={canvasRef} 
        className={`absolute inset-0 block z-10 ${canvasShake ? 'canvas-shake' : ''}`}
        onMouseDown={handleInteraction}
        onTouchStart={handleInteraction}
      />

      <div className="relative z-20 flex flex-col h-full pointer-events-none">
        <header className="p-6 flex justify-between items-start pointer-events-auto">
          <div className="flex gap-3">
            <div className={`px-4 py-2 rounded-2xl border font-black text-xl backdrop-blur-md transition-all 
              ${timeLeft <= 10 ? 'bg-red-500 border-red-400 text-white shadow-lg shadow-red-500/20' : (isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-slate-200 text-slate-900')}`}>
              {timeLeft}
            </div>
            <div className={`px-4 py-2 rounded-2xl border font-black text-xl backdrop-blur-md
              ${isDark ? 'bg-white/5 border-white/10 text-red-400' : 'bg-white border-slate-200 text-red-500'}`}>
              {errors}
            </div>
          </div>
          <button onClick={onClose} className={`px-5 py-2.5 rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all border
            ${isDark ? 'bg-white/5 border-white/20 text-white' : 'bg-white border-slate-200 text-slate-900 shadow-sm'}`}>
            Выход
          </button>
        </header>



        <div className="flex-1" />

        <footer className={`p-8 pb-12 bg-gradient-to-t ${isDark ? 'from-[#081221] via-[#081221]/90 to-transparent' : 'from-slate-50 via-slate-50/90 to-transparent'} flex flex-col items-center`}>
          {collectedAnswers.length > 0 && (
            <div className="w-full max-w-2xl px-4 mb-6 flex flex-wrap justify-center items-center gap-y-2 gap-x-1.5">
              {collectedAnswers.map((answer, i) => (
                <span key={i} className="text-lg font-black text-green-500 drop-shadow-md whitespace-nowrap">
                  {formatFormula(answer)}{i < collectedAnswers.length - 1 && <span>,</span>}
                </span>
              ))}
            </div>
          )}
          <div className="max-w-xs w-full flex flex-col items-center">
            <div className="text-center mb-4">
              {sessions[currentSessionIndex] && (
                <SplitText
                  key={`topic-${currentSessionIndex}`}
                  text={TOPICS[sessions[currentSessionIndex]].title}
                  className={`text-2xl font-black uppercase tracking-tight leading-none ${isDark ? 'text-indigo-400' : 'text-indigo-600'}`}
                  delay={50}
                  duration={1.25}
                  ease="power3.out"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  textAlign="center"
                  display="inline-block"
                  tag="span"
                />
              )}
            </div>
            
            {(() => {
                const fullText = sessions[currentSessionIndex] ? TOPICS[sessions[currentSessionIndex]].tasks[currentTaskIndex]?.text : '';
                if (!fullText) return null;
                const parts = fullText.split(' ');
                const firstWord = parts[0];
                const restOfText = parts.slice(1).join(' ');
                return (
                  <div className="flex flex-col items-center text-center">
                    <SplitText
                      key={`task-first-${currentSessionIndex}-${currentTaskIndex}`}
                      text={firstWord}
                      className={`text-2xl font-black uppercase tracking-tight leading-none mb-1 ${isDark ? 'text-white' : 'text-slate-900'}`}
                      delay={100}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="center"
                      display="inline-block"
                      tag="span"
                    />
                    <SplitText
                      key={`task-rest-${currentSessionIndex}-${currentTaskIndex}`}
                      text={restOfText}
                      className={`text-2xl font-black leading-tight uppercase tracking-tight mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}
                      delay={150}
                      duration={1.25}
                      ease="power3.out"
                      from={{ opacity: 0, y: 40 }}
                      to={{ opacity: 1, y: 0 }}
                      textAlign="center"
                      display="inline-block"
                      tag="h2"
                    />
                  </div>
                );
            })()}
            
            <div className="text-indigo-500/50 text-[10px] font-black uppercase tracking-[0.3em] text-center mt-2">
              Прогресс <span className="text-indigo-500 ml-1">{totalCompleted} / {totalTasksCount}</span>
            </div>
          </div>
        </footer>
      </div>

      <AnimatePresence initial={false}>
        {showWrong && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="fixed top-1/3 left-1/2 -translate-x-1/2 px-10 py-5 bg-red-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] shadow-2xl z-[80] pointer-events-none text-xs">
            Ошибка!
          </motion.div>
        )}

        {gameState === 'gameOver' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className={`fixed inset-0 z-[100] flex flex-col items-center justify-center p-8 text-center ${isDark ? 'bg-[#081221]' : 'bg-slate-50'}`}>
             <h2 className={`text-4xl font-black uppercase tracking-tighter mb-12 ${isDark ? 'text-white' : 'text-slate-900'}`}>
               {totalCompleted >= totalTasksCount ? 'Завершено!' : 'Время вышло'}
             </h2>
             <div className="space-y-4 mb-12 w-full max-w-[240px]">
               <div className={`flex justify-between items-center p-5 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                 <span className={`text-[9px] uppercase font-black tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Прогресс</span>
                 <span className={`font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>{totalCompleted} / {totalTasksCount}</span>
               </div>
               <div className={`flex justify-between items-center p-5 rounded-3xl border ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200'}`}>
                 <span className={`text-[9px] uppercase font-black tracking-widest ${isDark ? 'text-white/30' : 'text-slate-400'}`}>Ошибки</span>
                 <span className="text-red-500 font-black">{totalErrors}</span>
               </div>
             </div>
             
             <div className="w-full max-w-[240px] flex flex-col gap-3">
               <button 
                 onClick={resetGame} 
                 className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] shadow-lg active:scale-95 transition-all
                   ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-white border border-white/10 shadow-black/20' : 'bg-slate-800 hover:bg-slate-900 text-white border border-slate-700 shadow-slate-200'}`}
               >
                 Повторить
               </button>
               <button 
                 onClick={onClose} 
                 className={`w-full py-5 rounded-3xl font-black uppercase text-xs tracking-[0.2em] transition-all active:scale-95 border
                   ${isDark ? 'bg-white/5 border-white/10 text-white/60 hover:text-white' : 'bg-white border-slate-200 text-slate-500 hover:text-slate-900 shadow-sm'}`}
               >
                 Завершить
               </button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SulfateGame;
