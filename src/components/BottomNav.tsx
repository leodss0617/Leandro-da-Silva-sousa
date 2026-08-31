import React from 'react';
import { Home, History, Gamepad2, Brain, Wallet, Layers, Settings } from 'lucide-react';
import { ScreenTab } from '../types';

interface BottomNavProps {
  currentTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ currentTab, onTabChange }) => {
  const tabs: Array<{ id: ScreenTab; label: string; icon: React.ReactNode }> = [
    { id: 'home', label: 'Início', icon: <Home className="w-5 h-5" /> },
    { id: 'history', label: 'Histórico', icon: <History className="w-5 h-5" /> },
    { id: 'blaze', label: 'Blaze', icon: <Gamepad2 className="w-5 h-5" /> },
    { id: 'brain', label: 'Cérebro', icon: <Brain className="w-5 h-5" /> },
    { id: 'bankroll', label: 'Banca', icon: <Wallet className="w-5 h-5" /> },
    { id: 'mega', label: 'Mega', icon: <Layers className="w-5 h-5" /> },
    { id: 'config', label: 'Config', icon: <Settings className="w-5 h-5" /> },
  ];

  return (
    <nav className="h-[60px] pb-[env(safe-area-inset-bottom,0px)] bg-[#141417]/95 backdrop-blur-md border-t border-white/10 flex items-center justify-around z-30 shrink-0 select-none">
      {tabs.map(tab => {
        const isActive = currentTab === tab.id;
        return (
          <button
            key={tab.id}
            id={`nav-btn-${tab.id}`}
            type="button"
            onClick={() => onTabChange(tab.id)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 transition-all cursor-pointer ${
              isActive ? 'text-[#FF2442] scale-105' : 'text-[#A1A1AA] hover:text-white'
            }`}
          >
            {tab.icon}
            <span className="text-[10px] font-semibold tracking-tight">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
};
