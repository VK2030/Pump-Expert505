import React from 'react';

/**
 * Parses user answer string into an array of individual selected options.
 * Handles delimiters:
 * 1. ||| (multi-choice delimiter)
 * 2. \n (newline)
 * 3. ., (dot-comma delimiter when options end with dot and were joined with comma)
 * 4. ; (semicolon)
 */
export const parseUserAnswer = (ans: string | undefined): string[] => {
  if (!ans) return ['(пусто)'];
  const trimmed = ans.trim();
  if (!trimmed) return ['(пусто)'];

  if (trimmed.includes('|||')) {
    return trimmed.split('|||').map(s => s.trim()).filter(Boolean);
  }

  if (trimmed.includes('\n')) {
    return trimmed.split('\n').map(s => s.trim()).filter(Boolean);
  }

  // Handle joined strings with "., " e.g. "АСПО., Коррозия., Солеотложение."
  if (trimmed.includes('., ')) {
    const parts = trimmed.split('., ').map(s => s.trim()).filter(Boolean);
    return parts.map((p, idx) => {
      if (idx < parts.length - 1 && !p.endsWith('.')) {
        return p + '.';
      }
      return p;
    });
  }

  // Handle joined strings with "; "
  if (trimmed.includes('; ')) {
    return trimmed.split('; ').map(s => s.trim()).filter(Boolean);
  }

  return [trimmed];
};

/**
 * Renders user answer lines for React UI components.
 * Each selected answer is rendered on its own line with a checkmark icon
 * scaled to the cap-height of the font.
 */
export const renderUserAnswerLines = (rawAnswer: string | undefined, isDark: boolean) => {
  const lines = parseUserAnswer(rawAnswer);
  const isNoAnswer = 
    !rawAnswer || 
    !rawAnswer.trim() || 
    lines.length === 0 || 
    (lines.length === 1 && (
      lines[0] === '(пусто)' || 
      lines[0] === 'Время истекло' || 
      lines[0] === 'Нет ответа' || 
      lines[0] === '(нет ответа)'
    ));

  if (isNoAnswer) {
    return (
      <span className={`italic text-xs ${isDark ? 'text-white/30' : 'text-slate-400'}`}>
        {lines[0] || '(пусто)'}
      </span>
    );
  }

  return (
    <span className={`flex flex-col gap-1 ${isDark ? 'text-white/60' : 'text-slate-600'}`}>
      {lines.map((line, idx) => (
        <div key={idx} className="flex items-start gap-1.5 leading-snug">
          <svg
            viewBox="0 0 12 10"
            className="w-[0.85em] h-[0.85em] shrink-0 mt-[0.2em] text-current"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <polyline points="1.5 5 4.5 8 10.5 1.5" />
          </svg>
          <span className="break-words">{line}</span>
        </div>
      ))}
    </span>
  );
};

/**
 * Formats user answers for Telegram notifications with each answer on a new line.
 */
export const formatTelegramUserAnswer = (raw: string | undefined, escapeHTMLFn?: (str: string) => string): string => {
  const escapeHTML = escapeHTMLFn || ((str: string) => str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'));
  const lines = parseUserAnswer(raw);
  if (lines.length <= 1) return escapeHTML(lines[0] || '(нет ответа)');
  return '\n   ' + lines.map(l => escapeHTML(l)).join('\n   ');
};
