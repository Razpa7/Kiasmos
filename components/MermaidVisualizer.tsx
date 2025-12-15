import React, { useEffect, useRef } from 'react';
import mermaid from 'mermaid';

interface MermaidVisualizerProps {
  chart: string;
  isDarkMode: boolean;
}

export const MermaidVisualizer: React.FC<MermaidVisualizerProps> = ({ chart, isDarkMode }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Re-initialize mermaid when theme changes is tricky, usually requires re-render.
    // However, mermaid.render allows overriding theme variables per render call or config.
    mermaid.initialize({ 
        startOnLoad: true, 
        theme: isDarkMode ? 'dark' : 'base',
        themeVariables: isDarkMode ? {
            primaryColor: '#3730a3', // Dark Indigo
            primaryTextColor: '#e2e8f0', // Slate 200
            primaryBorderColor: '#6366f1',
            lineColor: '#94a3b8',
            secondaryColor: '#7f1d1d', // Dark Red
            tertiaryColor: '#1e293b' // Slate 800
        } : {
            primaryColor: '#e0e7ff',
            primaryTextColor: '#1e293b',
            primaryBorderColor: '#6366f1',
            lineColor: '#64748b',
            secondaryColor: '#fee2e2',
            tertiaryColor: '#fff'
        }
    });
  }, [isDarkMode]);

  useEffect(() => {
    if (containerRef.current && chart) {
      containerRef.current.removeAttribute('data-processed');
      
      const renderChart = async () => {
        try {
            // Unique ID for multiple renders
            const id = `mermaid-${Date.now()}`;
            // We need to clear previous content
            if (containerRef.current) containerRef.current.innerHTML = '';
            
            const { svg } = await mermaid.render(id, chart);
            if (containerRef.current) {
                containerRef.current.innerHTML = svg;
            }
        } catch (error) {
            console.error("Mermaid render error", error);
            if (containerRef.current) {
                containerRef.current.innerHTML = `<div class="text-xs ${isDarkMode ? 'text-red-300' : 'text-red-400'} p-2">No se pudo visualizar el gráfico complejo aún.</div>`;
            }
        }
      };
      
      renderChart();
    }
  }, [chart, isDarkMode]);

  return (
    <div className={`w-full overflow-x-auto flex justify-center p-4 rounded-xl border shadow-sm min-h-[200px] transition-colors duration-300 ${
        isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-100'
    }`}>
      <div ref={containerRef} className={`w-full h-full flex items-center justify-center text-sm ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>
        {/* SVG will be injected here */}
        Cargando mapa familiar...
      </div>
    </div>
  );
};
