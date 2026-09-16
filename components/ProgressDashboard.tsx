import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import AnimatedContent from './AnimatedContent';
import { MODULES } from '../constants';

interface QuizHistoryEntry {
  date: string;
  session: number;
  score: string;
  moduleId?: string;
  user?: string;
}

interface ProgressDashboardProps {
  history: QuizHistoryEntry[];
  isDark: boolean;
}

const PBOTOS_SUBMODULES: Record<string, string> = {
  'pbotos-general': 'Общие вопросы ОТ',
  'pbotos-siz': 'СИЗ',
  'pbotos-harmful': 'Вредные и опасные ПФ',
  'pbotos-firstaid': 'Оказание первой помощи',
  'pbotos-a1': 'А1. Основы ПБ',
  'pbotos-b21': 'Б.2.1 Для нефтяной промышленности',
};

const LEGACY_MODULE_MAPPING: Record<string, string> = {
  'esp-selection': 'Подбор УЭЦН и ВНР',
  'esp-startup': 'Подбор УЭЦН и ВНР',
  'vnr': 'Подбор УЭЦН и ВНР',
  'esp-selection-startup': 'Подбор УЭЦН и ВНР',
  'operating-factors': 'Осложняющие факторы',
  'failure-investigation': 'Расследование отказов',
  'matrix-tz': 'Матрица ТЗ (Упражнение)',
  'aspo-code': 'Код АСПО (Упражнение)',
  'water-kf': 'Код воды (КФ) (Упражнение)',
};

export default function ProgressDashboard({ history, isDark }: ProgressDashboardProps) {

  // Group history by normalized module ID
  const chartsData = useMemo(() => {
    const modulesData: Record<string, { title: string; data: { name: string; percentage: number; score: string; dateStr: string; user?: string }[] }> = {};

    // Sort chronologically
    const sortedHistory = [...history].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    sortedHistory.forEach((entry, idx) => {
      let modId = entry.moduleId || 'unknown';
      
      if (['esp-selection', 'esp-startup', 'vnr', 'esp-selection-startup'].includes(modId)) {
        modId = 'esp-selection-startup';
      }

      let title = LEGACY_MODULE_MAPPING[modId] || PBOTOS_SUBMODULES[modId];
      if (!title) {
        const m = MODULES.find(mod => mod.id === modId);
        if (m) title = m.title;
        else title = modId === 'unknown' ? 'Общий тест' : modId;
      }

      if (modId.startsWith('pbotos-')) {
        const cleanTitle = modId === 'pbotos-b21' ? 'Б.2.1' : (PBOTOS_SUBMODULES[modId] || title);
        title = `ПБОТОС / ${cleanTitle}`;
      }

      if (!modulesData[modId]) {
        modulesData[modId] = { title, data: [] };
      }

      const scoreParts = (entry.score || '').split('/');
      const correct = Number(scoreParts[0] || 0);
      let percentage = 0;
      if (scoreParts.length > 1) {
        const total = Number(scoreParts[1] || 1);
        percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
      } else {
        percentage = correct > 0 ? 100 : 0;
      }

      const dateStr = new Date(entry.date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit' });

      modulesData[modId].data.push({
        name: `С${entry.session || modulesData[modId].data.length + 1}`,
        percentage,
        score: entry.score,
        dateStr,
        user: entry.user
      });
    });

    const result = Object.values(modulesData).filter(m => m.data.length > 0);
    // Limit to the last 10 sessions for each module
    result.forEach(chart => {
      chart.data = chart.data.slice(-10);
    });
    return result;
  }, [history]);

  if (chartsData.length === 0) {
    return (
      <div className="flex flex-col px-0 py-4 flex-1 h-full items-center justify-center">
        <div className={`flex flex-col items-center justify-center p-8 rounded-[2.5rem] border backdrop-blur-md text-center max-w-sm w-full
          ${isDark ? 'bg-white/5 border-white/10 text-white/30' : 'bg-white border-slate-200 shadow-sm text-slate-400'}`}>
          <svg viewBox="0 0 24 24" className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" strokeWidth="1">
            <line x1="18" y1="20" x2="18" y2="10" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="6" y1="20" x2="6" y2="14" />
          </svg>
          <span className="font-medium">Графики прогресса появятся после прохождения тестирований</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col px-0 pb-24 pt-0 flex-1 overflow-y-auto space-y-3 pr-1">
      {chartsData.map((chart, index) => (
        <AnimatedContent key={index} distance={30} delay={index * 0.1} direction="vertical">
          <div className={`p-4 rounded-[2rem] border flex flex-col backdrop-blur-md relative overflow-hidden group h-[164px] justify-between
            ${isDark ? 'bg-white/5 border-white/10' : 'bg-white border-slate-200 shadow-sm'}`}>
            <h3 className={`text-sm font-black uppercase tracking-tight truncate ${isDark ? 'text-slate-300' : 'text-slate-800'}`}>
              {chart.title}
            </h3>
            
            <div className="h-24 w-full -ml-4 mt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chart.data} margin={{ top: 22, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'} vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                    fontSize={10}
                    tickMargin={10}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke={isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'}
                    fontSize={10}
                    domain={[0, 120]}
                    ticks={[0, 100]}
                    tickFormatter={(val) => `${val}%`}
                    tickLine={false}
                    axisLine={false}
                    width={40}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.9)', 
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                      borderRadius: '12px',
                      fontSize: '11px',
                      color: isDark ? '#fff' : '#000',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                    }}
                    itemStyle={{ color: '#6366f1', fontWeight: 'bold' }}
                    labelStyle={{ color: isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)', marginBottom: '4px', fontSize: '9px', textTransform: 'uppercase' }}
                    formatter={(val: number, name: string, props: any) => [
                      `${props.payload.score} (${val}%)`, 
                      'Результат'
                    ]}
                    labelFormatter={(label, payload) => payload?.[0]?.payload?.dateStr || label}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="percentage" 
                    stroke="#6366f1" 
                    strokeWidth={3}
                    dot={{ r: 4, strokeWidth: 2, fill: isDark ? '#0f172a' : '#fff' }}
                    activeDot={{ r: 6, strokeWidth: 0, fill: '#6366f1' }}
                    animationDuration={800}
                    label={(props: any) => {
                      const { x, y, index } = props;
                      if (chart.data && chart.data[index] !== undefined) {
                        return (
                          <motion.text
                            x={x}
                            initial={{ opacity: 0, y: y }}
                            animate={{ opacity: 1, y: y - 10 }}
                            transition={{ delay: 0.3, duration: 0.5, ease: "easeOut" }}
                            fill="#6366f1"
                            fontSize={10}
                            textAnchor="middle"
                            fontWeight="bold"
                          >
                            {chart.data[index].percentage}%
                          </motion.text>
                        );
                      }
                      return null;
                    }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </AnimatedContent>
      ))}
    </div>
  );
}
