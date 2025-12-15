import React from 'react';
import { SystemicAnalysisData, DeepInsight, Language } from '../types';
import { MermaidVisualizer } from './MermaidVisualizer';
import { UI_TEXTS } from '../constants';

interface SystemicToolsProps {
  data: SystemicAnalysisData | null;
  insight: DeepInsight | null;
  onGenerateInsight: () => void;
  isGeneratingInsight: boolean;
  language: Language;
  isDarkMode: boolean;
}

export const SystemicTools: React.FC<SystemicToolsProps> = ({ 
    data, 
    insight, 
    onGenerateInsight,
    isGeneratingInsight,
    language,
    isDarkMode
}) => {
  const texts = UI_TEXTS[language];

  if (!data && !insight) {
    return (
        <div className={`h-full flex flex-col items-center justify-center p-8 text-center transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/50 text-slate-500' : 'bg-slate-50/50 text-slate-400'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-12 h-12 mb-3 opacity-50">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 0 0 6 16.5h2.25M3.75 3h-1.5m1.5 0h16.5m0 0h1.5m-1.5 0v11.25A2.25 2.25 0 0 1 18 16.5h-2.25m-7.5 0h7.5m-7.5 0-1 3m8.5-3 1 3m0 0 .5 1.5m-.5-1.5h-9.5m0 0-.5 1.5M9 11.25v1.5M12 9v3.75m3-6v6" />
            </svg>
            <p className="text-sm">{texts.noData}</p>
        </div>
    );
  }

  return (
    <div className={`h-full overflow-y-auto p-4 space-y-6 transition-colors duration-300 ${isDarkMode ? 'bg-slate-900/80' : 'bg-slate-50/80'}`}>
      
      {/* 1. Genograma Generativo */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center">
            <span className="w-2 h-2 bg-indigo-500 rounded-full mr-2"></span>
            {texts.genogram}
        </h3>
        {data?.genogramMermaid ? (
            <MermaidVisualizer chart={data.genogramMermaid} isDarkMode={isDarkMode} />
        ) : (
            <div className={`h-32 rounded-xl animate-pulse flex items-center justify-center text-xs ${isDarkMode ? 'bg-slate-800 text-slate-500' : 'bg-slate-100 text-slate-400'}`}>
                {texts.loadingMap}
            </div>
        )}
      </section>

      {/* 2. Insight Profundo (Botón y Resultado) */}
      <section className="bg-gradient-to-br from-indigo-600 to-purple-700 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
        <div className="absolute top-0 right-0 p-3 opacity-10">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-24 h-24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 0 0 1.5-.45l7.682-2.56a49.532 49.532 0 0 1-1.152 4.198c-.975 3.257-3.19 6.311-6 7.483-2.81 1.172-5.025-1.926-6-7.483-.125-.712-.39-2.126-1.152-4.198l7.682 2.56c.49.163.99.314 1.5.45H12Z" />
            </svg>
        </div>

        {!insight ? (
            <div className="text-center py-2">
                <h3 className="text-lg font-semibold mb-2">{texts.insightTitle}</h3>
                <p className="text-indigo-100 text-sm mb-4">{language === 'es' ? 'Genera un resumen profundo de lealtades y deudas.' : 'Generate a deep summary of loyalties and debts.'}</p>
                <button 
                    onClick={onGenerateInsight}
                    disabled={isGeneratingInsight}
                    className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/40 rounded-lg px-4 py-2 text-sm font-medium transition-all flex items-center justify-center mx-auto"
                >
                    {isGeneratingInsight ? texts.analyzingBtn : texts.analyzeBtn}
                </button>
            </div>
        ) : (
            <div className="relative z-10 animate-fade-in-up">
                <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-bold">{texts.insightTitle}</h3>
                    <button onClick={onGenerateInsight} className="text-xs bg-white/10 hover:bg-white/20 px-2 py-1 rounded">{texts.insightUpdate}</button>
                </div>
                
                <div className="space-y-3 text-sm">
                    <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <span className="text-indigo-200 text-xs uppercase block mb-1">{texts.loyalty}</span>
                        <p>{insight.loyalty}</p>
                    </div>
                    <div className="bg-white/10 p-3 rounded-lg border border-white/10">
                        <span className="text-indigo-200 text-xs uppercase block mb-1">{texts.debt}</span>
                        <p>{insight.debt}</p>
                    </div>
                    <div className="bg-emerald-500/20 p-3 rounded-lg border border-emerald-400/30">
                        <span className="text-emerald-200 text-xs uppercase block mb-1">{texts.action}</span>
                        <p className="font-medium text-emerald-50">{insight.action}</p>
                    </div>
                </div>
            </div>
        )}
      </section>

      {/* 3. Libro Mayor (Ledger) */}
      <section>
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center">
            <span className="w-2 h-2 bg-emerald-500 rounded-full mr-2"></span>
            {texts.ledger}
        </h3>
        <div className="grid grid-cols-2 gap-3">
            <div className={`p-3 rounded-xl border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className={`text-xs font-semibold text-emerald-600 mb-2 border-b pb-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>{texts.merits}</div>
                {data?.ledger.merits.length ? (
                    <ul className="space-y-2">
                        {data.ledger.merits.map((m, i) => (
                            <li key={i} className={`text-xs flex justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                <span>{m.description}</span>
                                <span className="text-emerald-500 font-bold">+{m.value}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-xs text-slate-400 italic">{texts.noAnalysis}</p>}
            </div>
            
            <div className={`p-3 rounded-xl border shadow-sm transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
                <div className={`text-xs font-semibold text-rose-600 mb-2 border-b pb-2 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>{texts.debts}</div>
                {data?.ledger.debts.length ? (
                    <ul className="space-y-2">
                        {data.ledger.debts.map((d, i) => (
                            <li key={i} className={`text-xs flex justify-between ${isDarkMode ? 'text-slate-300' : 'text-slate-600'}`}>
                                <span>{d.description}</span>
                                <span className="text-rose-500 font-bold">-{d.value}</span>
                            </li>
                        ))}
                    </ul>
                ) : <p className="text-xs text-slate-400 italic">{texts.noAnalysis}</p>}
            </div>
        </div>
      </section>

      {/* 4. Sentimientos */}
      <section>
         <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3 flex items-center">
            <span className="w-2 h-2 bg-amber-500 rounded-full mr-2"></span>
            {texts.climate}
        </h3>
        <div className={`rounded-xl border p-4 shadow-sm space-y-3 transition-colors duration-300 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'}`}>
            {data?.sentiments.map((s, i) => (
                <div key={i} className="flex items-center text-sm">
                    <div className={`w-16 font-medium truncate ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>{s.member}</div>
                    <div className={`flex-1 h-2 rounded-full mx-3 overflow-hidden relative ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}>
                        {/* Center line */}
                        <div className={`absolute left-1/2 top-0 bottom-0 w-0.5 ${isDarkMode ? 'bg-slate-600' : 'bg-slate-300'}`}></div>
                        <div 
                            className={`h-full rounded-full transition-all duration-500 ${
                                s.score > 0 ? 'bg-emerald-400' : 'bg-rose-400'
                            }`}
                            style={{
                                width: `${Math.abs(s.score) * 50}%`,
                                marginLeft: s.score > 0 ? '50%' : `${50 - (Math.abs(s.score) * 50)}%`
                            }}
                        ></div>
                    </div>
                    <div className="w-8 text-right text-xs text-slate-400">
                        {s.score > 0 ? '🙂' : s.score < 0 ? '😔' : '😐'}
                    </div>
                </div>
            ))}
            {!data?.sentiments.length && <p className="text-xs text-slate-400 italic text-center">{texts.analyzingTone}</p>}
        </div>
      </section>
    </div>
  );
};
