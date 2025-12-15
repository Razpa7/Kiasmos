import React, { useState, useRef, useEffect } from 'react';
import { Message, Role, SystemicAnalysisData, DeepInsight, Language } from './types';
import { MessageBubble } from './components/MessageBubble';
import { TypingIndicator } from './components/TypingIndicator';
import { sendMessageToGemini } from './services/geminiService';
import { liveService } from './services/liveService';
import { analyzeSystemicData, generateDeepInsight } from './services/analysisService';
import { getInitialGreeting, UI_TEXTS } from './constants';
import { SystemicTools } from './components/SystemicTools';

function App() {
  const [language, setLanguage] = useState<Language>('es');
  // Theme and Audio State
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isSilentMode, setIsSilentMode] = useState(false);
  
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'init-1',
      role: Role.MODEL,
      text: getInitialGreeting('es')
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  
  // New States for Systemic Analysis
  const [showTools, setShowTools] = useState(false); // Mobile toggle
  const [analysisData, setAnalysisData] = useState<SystemicAnalysisData | null>(null);
  const [insight, setInsight] = useState<DeepInsight | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isGeneratingInsight, setIsGeneratingInsight] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const uiTexts = UI_TEXTS[language];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, isLiveActive]);

  useEffect(() => {
    inputRef.current?.focus();
    return () => {
      liveService.disconnect();
    };
  }, []);

  // Trigger analysis periodically or after sufficient conversation
  useEffect(() => {
    // Analyze if we have enough messages (approx 2 exchanges)
    if (messages.length > 2 && messages.length % 2 === 0) {
        runSystemicAnalysis();
    }
  }, [messages.length]);

  const handleLanguageChange = (lang: Language) => {
    if (lang === language) return;
    setLanguage(lang);
    
    // If it's the very first message, update it to the new language
    if (messages.length === 1 && messages[0].id === 'init-1') {
        setMessages([{
            id: 'init-1',
            role: Role.MODEL,
            text: getInitialGreeting(lang)
        }]);
    }
  };

  const runSystemicAnalysis = async () => {
    setIsAnalyzing(true);
    const result = await analyzeSystemicData(messages, language);
    if (result) {
        setAnalysisData(result);
    }
    setIsAnalyzing(false);
  };

  const handleGenerateInsight = async () => {
    setIsGeneratingInsight(true);
    const result = await generateDeepInsight(messages, language);
    if (result) {
        setInsight(result);
    }
    setIsGeneratingInsight(false);
  };

  // Live Session Handler
  const toggleLiveSession = async () => {
    if (isLiveActive) {
      liveService.disconnect();
      setIsLiveActive(false);
      return;
    }

    setIsConnecting(true);
    await liveService.connect({
      language,
      onOpen: () => {
        setIsConnecting(false);
        setIsLiveActive(true);
        // Visual system message
        setMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: Role.MODEL, 
            text: uiTexts.liveInit
        }]);
      },
      onClose: () => {
        setIsLiveActive(false);
        setIsConnecting(false);
        // Trigger final analysis on close
        runSystemicAnalysis();
      },
      onError: (err) => {
        console.error(err);
        setIsConnecting(false);
        setIsLiveActive(false);
        alert(uiTexts.liveError);
      },
      onMessage: (text, role) => {
         // CRITICAL: Update state with transcribed text from Live API
         // This ensures the Systemic Analysis service can read the conversation
         setMessages(prev => [
            ...prev, 
            {
                id: Date.now().toString(),
                role: role === 'user' ? Role.USER : Role.MODEL,
                text: text
            }
         ]);
      }
    });
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isLoading || isLiveActive) return;

    const userText = inputValue.trim();
    setInputValue('');
    
    const newUserMessage: Message = {
      id: Date.now().toString(),
      role: Role.USER,
      text: userText
    };

    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setIsLoading(true);

    try {
      const responseText = await sendMessageToGemini(userText, language);
      const newModelMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: Role.MODEL,
        text: responseText
      };
      setMessages(prev => [...prev, newModelMessage]);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLiveActive) {
      handleSendMessage();
    }
  };

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-slate-100 text-slate-900'}`}>
        
      {/* LEFT: Main Chat Interface */}
      <div className={`flex flex-col h-full relative shadow-2xl transition-all duration-300 w-full lg:w-[60%] ${showTools ? 'hidden lg:flex' : 'flex'} ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
        
        {/* Header */}
        <header className={`backdrop-blur-md border-b px-6 py-4 sticky top-0 z-10 flex justify-between items-center transition-colors duration-500 ${
            isLiveActive 
            ? 'bg-red-50/90 border-red-100' 
            : isDarkMode 
                ? 'bg-slate-900/80 border-slate-700' 
                : 'bg-white/80 border-slate-200'
        }`}>
            <div className="flex items-center space-x-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition-colors duration-500 ${isLiveActive ? 'bg-red-500 animate-pulse' : 'bg-indigo-600'}`}>
                    SF
                </div>
                <div>
                    <h1 className={`font-semibold text-lg ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{uiTexts.title}</h1>
                    <p className={`text-xs font-medium transition-colors ${isLiveActive ? 'text-red-600' : 'text-slate-500'}`}>
                    {isLiveActive ? uiTexts.liveActive : uiTexts.subtitle}
                    </p>
                </div>
            </div>

            {/* Controls: Mode Toggles & Lang */}
            <div className="flex items-center space-x-2">
                {/* Silent Mode Toggle */}
                <button 
                    onClick={() => setIsSilentMode(!isSilentMode)}
                    className={`p-2 rounded-full transition-colors ${
                        isSilentMode 
                            ? 'text-red-500 bg-red-100/20' 
                            : isDarkMode ? 'text-slate-400 hover:text-slate-200' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={uiTexts.silentMode}
                >
                    {isSilentMode ? (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M5.85 3.5a.75.75 0 0 0-1.117-1 9.719 9.719 0 0 0-2.348 4.876.75.75 0 0 0 1.479.248A8.219 8.219 0 0 1 5.85 3.5ZM19.267 2.5a.75.75 0 1 0-1.118 1 8.22 8.22 0 0 1 1.987 4.124.75.75 0 0 0 1.48-.248A9.72 9.72 0 0 0 19.266 2.5Z" />
                            <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clipRule="evenodd" />
                            <path d="M3 3l18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                             <path fillRule="evenodd" d="M12 2.25A6.75 6.75 0 0 0 5.25 9v.75a8.217 8.217 0 0 1-2.119 5.52.75.75 0 0 0 .298 1.206c1.544.57 3.16.99 4.831 1.243a3.75 3.75 0 1 0 7.48 0 24.583 24.583 0 0 0 4.83-1.244.75.75 0 0 0 .298-1.205 8.217 8.217 0 0 1-2.118-5.52V9A6.75 6.75 0 0 0 12 2.25ZM9.75 18c0-.034 0-.067.002-.1a25.05 25.05 0 0 0 4.496 0l.002.1a2.25 2.25 0 1 1-4.5 0Z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                {/* Dark Mode Toggle */}
                <button 
                    onClick={() => setIsDarkMode(!isDarkMode)}
                    className={`p-2 rounded-full transition-colors ${
                        isDarkMode ? 'text-amber-400 hover:text-amber-300' : 'text-slate-400 hover:text-slate-600'
                    }`}
                    title={uiTexts.darkMode}
                >
                    {isDarkMode ? (
                         <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path d="M12 2.25a.75.75 0 0 1 .75.75v2.25a.75.75 0 0 1-1.5 0V3a.75.75 0 0 1 .75-.75ZM7.5 12a4.5 4.5 0 1 1 9 0 4.5 4.5 0 0 1-9 0ZM18.894 6.166a.75.75 0 0 0-1.06-1.06l-1.591 1.59a.75.75 0 1 0 1.06 1.061l1.591-1.59ZM21.75 12a.75.75 0 0 1-.75.75h-2.25a.75.75 0 0 1 0-1.5H21a.75.75 0 0 1 .75.75ZM17.834 18.894a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 1 0-1.061 1.06l1.59 1.591ZM12 18a.75.75 0 0 1 .75.75V21a.75.75 0 0 1-1.5 0v-2.25A.75.75 0 0 1 12 18ZM7.758 17.303a.75.75 0 0 0-1.061-1.06l-1.591 1.59a.75.75 0 0 0 1.06 1.061l1.591-1.59ZM6 12a.75.75 0 0 1-.75.75H3a.75.75 0 0 1 0-1.5h2.25A.75.75 0 0 1 6 12ZM6.697 7.757a.75.75 0 0 0 1.06-1.06l-1.59-1.591a.75.75 0 0 0-1.061 1.06l1.59 1.591Z" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                            <path fillRule="evenodd" d="M9.528 1.718a.75.75 0 0 1 .162.819A8.97 8.97 0 0 0 9 6a9 9 0 0 0 9 9 8.97 8.97 0 0 0 3.463-.69.75.75 0 0 1 .981.98 10.503 10.503 0 0 1-9.694 6.46c-5.799 0-10.5-4.7-10.5-10.5 0-4.368 2.667-8.112 6.46-9.694a.75.75 0 0 1 .818.162Z" clipRule="evenodd" />
                        </svg>
                    )}
                </button>

                <div className={`flex rounded-lg p-1 border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-100 border-slate-200'}`}>
                    <button 
                        onClick={() => handleLanguageChange('es')}
                        className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${language === 'es' ? (isDarkMode ? 'bg-slate-700 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-500'}`}
                    >
                        ES
                    </button>
                    <button 
                        onClick={() => handleLanguageChange('en')}
                        className={`px-2 py-1 text-xs font-bold rounded-md transition-all ${language === 'en' ? (isDarkMode ? 'bg-slate-700 text-indigo-400' : 'bg-white text-indigo-600 shadow-sm') : 'text-slate-400 hover:text-slate-500'}`}
                    >
                        EN
                    </button>
                </div>

                <button 
                    className="lg:hidden p-2 text-slate-500 hover:text-indigo-600"
                    onClick={() => setShowTools(true)}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6a7.5 7.5 0 1 0 7.5 7.5h-7.5V6Z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 10.5H21A7.5 7.5 0 0 0 13.5 3v7.5Z" />
                    </svg>
                </button>
            </div>
        </header>

        {/* Chat Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2 scroll-smooth">
            {messages.map((msg) => (
            <MessageBubble 
                key={msg.id} 
                message={msg} 
                language={language} 
                isDarkMode={isDarkMode}
                isSilentMode={isSilentMode}
            />
            ))}
            {isLoading && <TypingIndicator isDarkMode={isDarkMode} />}
            {isLiveActive && (
            <div className="flex justify-center mt-8 mb-4">
                <div className="flex items-center space-x-2 bg-red-50 text-red-600 px-4 py-2 rounded-full border border-red-100 animate-pulse">
                    <div className="w-2 h-2 bg-red-600 rounded-full"></div>
                    <span className="text-sm font-medium">{uiTexts.listening}</span>
                </div>
            </div>
            )}
            <div ref={messagesEndRef} className="h-4" />
        </main>

        {/* Input Area */}
        <footer className={`border-t p-4 pb-safe sticky bottom-0 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
            <div className="relative flex items-center gap-2 max-w-full">
            <button
                onClick={toggleLiveSession}
                disabled={isLoading}
                className={`p-3 rounded-full transition-all duration-300 shadow-md flex-shrink-0 ${
                isLiveActive 
                    ? 'bg-red-600 text-white ring-4 ring-red-100 scale-105' 
                    : isConnecting
                    ? 'bg-slate-200 text-slate-500 cursor-wait'
                    : isDarkMode 
                        ? 'bg-slate-800 text-indigo-400 hover:bg-slate-700'
                        : 'bg-slate-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700'
                }`}
                aria-label={isLiveActive ? "End call" : "Start call"}
            >
                {isConnecting ? (
                <svg className="animate-spin h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                ) : isLiveActive ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path fillRule="evenodd" d="M4.5 7.5a3 3 0 0 1 3-3h9a3 3 0 0 1 3 3v9a3 3 0 0 1-3 3h-9a3 3 0 0 1-3-3v-9Z" clipRule="evenodd" />
                </svg>
                ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                    <path d="M8.25 4.5a3.75 3.75 0 1 1 7.5 0v8.25a3.75 3.75 0 1 1-7.5 0V4.5Z" />
                    <path d="M6 10.5a.75.75 0 0 1 .75.75v1.5a5.25 5.25 0 1 0 10.5 0v-1.5a.75.75 0 0 1 1.5 0v1.5a6.751 6.751 0 0 1-6 6.709v2.291h3a.75.75 0 0 1 0 1.5h-7.5a.75.75 0 0 1 0-1.5h3v-2.291a6.751 6.751 0 0 1-6-6.709v-1.5A.75.75 0 0 1 6 10.5Z" />
                </svg>
                )}
            </button>
            
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={isLiveActive ? uiTexts.placeholderLive : uiTexts.placeholder}
                className={`w-full rounded-full pl-5 pr-12 py-3.5 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all shadow-inner ${
                    isLiveActive 
                    ? 'opacity-50 cursor-not-allowed bg-slate-100' 
                    : isDarkMode
                        ? 'bg-slate-800 text-slate-100 placeholder-slate-500 focus:bg-slate-700'
                        : 'bg-slate-100 text-slate-800 placeholder-slate-400 focus:bg-white'
                }`}
                disabled={isLoading || isLiveActive}
            />
            <button
                onClick={handleSendMessage}
                disabled={!inputValue.trim() || isLoading || isLiveActive}
                className="absolute right-2 p-2 bg-indigo-600 text-white rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:hover:bg-indigo-600 transition-colors shadow-sm"
            >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 translate-x-0.5">
                <path d="M3.478 2.405a.75.75 0 00-.926.94l2.432 7.905H13.5a.75.75 0 010 1.5H4.984l-2.432 7.905a.75.75 0 00.926.94 60.519 60.519 0 0018.445-8.986.75.75 0 000-1.218A60.517 60.517 0 003.478 2.405z" />
                </svg>
            </button>
            </div>
            <div className="text-center mt-2 flex justify-between items-center text-[10px] text-slate-400 px-2">
                <span>Lealtades Invisibles ©</span>
                <span className={`flex items-center ${isAnalyzing ? 'opacity-100' : 'opacity-0'} transition-opacity`}>
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping mr-1"></span>
                    {uiTexts.updating}
                </span>
            </div>
        </footer>
      </div>

      {/* RIGHT: Systemic Dashboard (Drawer on Mobile, Panel on Desktop) */}
      <div className={`
        fixed inset-0 z-20 transform transition-transform duration-300
        lg:relative lg:translate-x-0 lg:w-[40%] lg:border-l lg:block
        ${showTools ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}
        ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}
      `}>
         {/* Mobile Header for Tools */}
         <div className={`lg:hidden flex justify-between items-center p-4 border-b ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
            <h2 className={`font-semibold ${isDarkMode ? 'text-slate-100' : 'text-slate-800'}`}>{uiTexts.clinicalRecord}</h2>
            <button onClick={() => setShowTools(false)} className="p-2 text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                </svg>
            </button>
         </div>

         <SystemicTools 
            data={analysisData} 
            insight={insight}
            onGenerateInsight={handleGenerateInsight}
            isGeneratingInsight={isGeneratingInsight}
            language={language}
            isDarkMode={isDarkMode}
         />
      </div>
    </div>
  );
}

export default App;
