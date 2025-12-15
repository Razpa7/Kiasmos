import React from 'react';
import { Message, Role, Language } from '../types';
import { speakText } from '../services/speechService';

interface MessageBubbleProps {
  message: Message;
  language: Language;
  isDarkMode: boolean;
  isSilentMode: boolean;
}

export const MessageBubble: React.FC<MessageBubbleProps> = ({ message, language, isDarkMode, isSilentMode }) => {
  const isModel = message.role === Role.MODEL;

  const handlePlayAudio = () => {
    if (!isSilentMode) {
      speakText(message.text, language);
    }
  };

  return (
    <div className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'} mb-4 animate-fade-in-up group`}>
      <div className={`flex flex-col ${isModel ? 'items-start' : 'items-end'} max-w-[85%] sm:max-w-[75%]`}>
        <div
          className={`px-5 py-3 shadow-sm text-[15px] leading-relaxed rounded-2xl transition-colors duration-300 ${
            isModel
              ? isDarkMode 
                ? 'bg-slate-800 text-slate-100 border border-slate-700 rounded-tl-none'
                : 'bg-white text-slate-800 border border-slate-100 rounded-tl-none'
              : 'bg-indigo-600 text-white rounded-tr-none'
          }`}
        >
          {message.text}
        </div>
        
        {/* Play Button for Model messages - Only if NOT silent mode */}
        {isModel && !isSilentMode && (
          <button 
            onClick={handlePlayAudio}
            className={`mt-1 ml-1 opacity-0 group-hover:opacity-100 transition-opacity p-1 ${isDarkMode ? 'text-slate-500 hover:text-indigo-400' : 'text-slate-400 hover:text-indigo-600'}`}
            title="Escuchar mensaje"
            aria-label="Escuchar mensaje"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
              <path fillRule="evenodd" d="M19.952 1.651a.75.75 0 0 1 .298.599V16.303a3 3 0 0 1-2.176 2.884l-1.32.377a2.553 2.553 0 1 1-1.403-4.909l2.311-.66a1.5 1.5 0 0 0 .438-.935l.013-2.268a.5.5 0 0 0-.5-.525l-6.718.156a1.5 1.5 0 0 0-1.28.67l-2.072 3.108c-.902 1.353-2.457 2.158-4.08 2.158h-.057c-1.396.02-2.738.563-3.744 1.516a.75.75 0 1 1-1.03-1.092c1.378-1.305 3.197-2.015 5.09-2.008H3.89c1.07 0 2.096-.53 2.69-1.42l2.072-3.107a3.002 3.002 0 0 1 2.56-1.34l6.718-.156V2.25a.75.75 0 0 1 1.022-.599Z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};
