import React from 'react';

interface TypingIndicatorProps {
  isDarkMode: boolean;
}

export const TypingIndicator: React.FC<TypingIndicatorProps> = ({ isDarkMode }) => {
  return (
    <div className="flex w-full justify-start mb-4">
      <div className={`rounded-2xl rounded-tl-none px-4 py-3 shadow-sm flex items-center space-x-1 border transition-colors duration-300 ${
        isDarkMode 
          ? 'bg-slate-800 border-slate-700' 
          : 'bg-white border-slate-100'
      }`}>
        <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-slate-500' : 'bg-slate-400'}`} style={{ animationDelay: '0ms' }}></div>
        <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-slate-500' : 'bg-slate-400'}`} style={{ animationDelay: '150ms' }}></div>
        <div className={`w-2 h-2 rounded-full animate-bounce ${isDarkMode ? 'bg-slate-500' : 'bg-slate-400'}`} style={{ animationDelay: '300ms' }}></div>
      </div>
    </div>
  );
};
