import React from 'react';
import { Cpu, Layers, Sparkles, AlertCircle } from 'lucide-react';

interface HeaderProps {
  solverStatus: string;
}

export const Header: React.FC<HeaderProps> = ({ solverStatus }) => {
  const getStatusBadge = () => {
    switch (solverStatus) {
      case 'ready':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-400 bg-emerald-950/40 border border-emerald-800/60 rounded-full shadow-lg shadow-emerald-950/20 backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 animate-pulse" />
            <span>Solver Engine Ready</span>
          </div>
        );
      case 'initializing':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-purple-400 bg-purple-950/40 border border-purple-800/60 rounded-full shadow-lg shadow-purple-950/20 backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5 animate-spin" />
            <span>Warming Up Engine...</span>
          </div>
        );
      case 'error':
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-rose-400 bg-rose-950/40 border border-rose-800/60 rounded-full shadow-lg shadow-rose-950/20 backdrop-blur-md">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>Solver Off-Line</span>
          </div>
        );
      default:
        return (
          <div className="flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-400 bg-slate-900/40 border border-slate-800/60 rounded-full shadow-lg backdrop-blur-md">
            <Cpu className="w-3.5 h-3.5" />
            <span>Ready</span>
          </div>
        );
    }
  };

  return (
    <header className="w-full flex items-center justify-between px-6 py-4 border-b border-slate-800/40 bg-slate-950/40 backdrop-blur-xl z-50">
      {/* Branding */}
      <div className="flex items-center gap-3">
        <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-500/20">
          <Layers className="w-5 h-5" />
          <div className="absolute -inset-0.5 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-xl blur opacity-30 group-hover:opacity-100 transition-opacity -z-10" />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-extrabold tracking-wider bg-clip-text text-transparent bg-gradient-to-r from-white via-slate-100 to-indigo-200">
            KUBE.AI
          </span>
          <span className="text-[10px] text-slate-500 font-medium uppercase tracking-widest leading-none">
            3D Solver 
          </span>
        </div>
      </div>

      {/* Middle/Right Status Details */}
      <div className="flex items-center gap-4">
        {getStatusBadge()}
      </div>
    </header>
  );
};
