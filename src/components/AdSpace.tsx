import React from 'react';
import { ExternalLink } from 'lucide-react';

interface AdSpaceProps {
  type: 'sidebar' | 'horizontal';
  className?: string;
}

export const AdSpace: React.FC<AdSpaceProps> = ({ type, className = '' }) => {
  return (
    <div 
      className={`bg-slate-50 border border-dashed border-border-base rounded-xl overflow-hidden flex flex-col items-center justify-center p-4 group transition-all hover:bg-slate-100/80 ${
        type === 'sidebar' ? 'min-h-[600px] w-full' : 'w-full min-h-[100px]'
      } ${className}`}
    >
      <div className="flex flex-col items-center gap-3 text-center">
        <div className="w-10 h-10 rounded-full bg-primary/5 flex items-center justify-center text-primary/40">
          <ExternalLink className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-text-muted uppercase tracking-widest block mb-1">Publicidad</span>
          <p className="text-xs text-text-muted leading-tight max-w-[140px]">
            Espacio disponible para banners o promociones de servicios financieros
          </p>
        </div>
        <button className="mt-2 px-4 py-1.5 bg-white border border-border-base rounded-full text-[10px] font-bold text-text-base shadow-sm group-hover:border-primary/20 transition-all">
          SABER MÁS
        </button>
      </div>
      
      {/* Indicador de placeholder visual */}
      <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/10 to-transparent" />
    </div>
  );
};
