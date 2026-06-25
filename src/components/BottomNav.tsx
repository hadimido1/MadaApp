import { LayoutDashboard, Settings, ShoppingBag, Sparkles } from 'lucide-react';
import { ViewState } from '../types';
import { getTranslation } from '../i18n';

interface BottomNavProps {
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  isAdmin: boolean;
}

export function BottomNav({ currentView, onNavigate, isAdmin }: BottomNavProps) {
  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'ar';
  const t = getTranslation(lang);

  return (
    <div className="absolute bottom-0 left-0 right-0 bg-black/95 backdrop-blur-3xl border-t border-white/5 z-50 pb-safe light-mode-card shadow-[0_-10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-around px-2 py-4">
        <button 
          onClick={() => onNavigate('dashboard')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'dashboard' ? 'text-accent' : 'text-gray-500 hover:text-white'}`}
        >
          <LayoutDashboard className="w-6 h-6" />
          <span className="text-[10px] font-bold">{t.dashboard}</span>
        </button>

        <button 
          onClick={() => onNavigate('upgrade')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'upgrade' ? 'text-accent' : 'text-gray-500 hover:text-white'}`}
        >
          <Sparkles className="w-6 h-6 text-yellow-400 animate-pulse" />
          <span className="text-[10px] font-bold">{lang === 'ar' ? 'الترقية' : 'Upgrade'}</span>
        </button>

        <button 
          onClick={() => onNavigate('store')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'store' ? 'text-accent' : 'text-gray-500 hover:text-white'}`}
        >
          <ShoppingBag className="w-6 h-6" />
          <span className="text-[10px] font-bold">{t.store}</span>
        </button>

        <button 
          onClick={() => onNavigate('settings')}
          className={`flex flex-col items-center gap-1.5 transition-colors ${currentView === 'settings' ? 'text-accent' : 'text-gray-500 hover:text-white'}`}
        >
          <Settings className="w-6 h-6" />
          <span className="text-[10px] font-bold">{t.settings}</span>
        </button>
      </div>
    </div>
  );
}
