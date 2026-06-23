import { LayoutDashboard, Users, Shield, LogOut } from 'lucide-react';
import { User, ViewState } from '../types';
import logo from '../assets/images/regenerated_image_1781780076153.png';

interface SidebarProps {
  user: User;
  currentView: ViewState;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

export function Sidebar({ user, currentView, onNavigate, onLogout }: SidebarProps) {
  return (
    <aside className="w-72 bg-[#080B12] border-l border-white/5 flex flex-col hidden md:flex shrink-0">
      <div className="p-8 pb-4">
        <div className="flex items-center gap-4 mb-10">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src={logo} alt="AVBANK Logo" className="w-full h-full object-contain" />
          </div>
          <h2 className="text-xl font-black italic tracking-tighter text-white">AVBANK</h2>
        </div>

        <nav className="space-y-8">
          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4">الرئيسية</p>
            <ul className="space-y-2">
              <li 
                onClick={() => onNavigate('dashboard')}
                className={`p-3 rounded-lg flex items-center gap-3 cursor-pointer transition-colors ${currentView === 'dashboard' ? 'bg-white/10 text-white border border-white/10' : 'text-gray-400 hover:bg-white/5'}`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span className="text-sm">لوحة التحكم</span>
              </li>

            </ul>
          </div>

          <div>
            <p className="text-[10px] uppercase tracking-widest text-gray-500 mb-4 tracking-[0.2em]">Financial enclave</p>
            <div className="bg-white/[0.02] border border-white/5 p-4 rounded-xl">
              <div className="flex justify-between items-center mb-1">
                <span className="text-[10px] text-gray-400 font-bold">Premium Tier Status</span>
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse"></div>
              </div>
              <p className="text-[9px] text-gray-600 uppercase font-black tracking-widest">Active Member</p>
            </div>
          </div>
        </nav>
      </div>

      <div className="mt-auto p-8 border-t border-white/5">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-gray-700 to-gray-500 flex items-center justify-center text-white text-xs font-bold">
              {user.name.substring(0, 2)}
            </div>
            <div>
              <p className="text-sm font-medium text-white">{user.name}</p>
              <p className="text-xs text-gray-500 uppercase tracking-tighter">{user.role === 'admin' ? 'مدير النظام' : 'مستخدم'}</p>
            </div>
          </div>
          <button onClick={onLogout} className="text-gray-500 hover:text-white transition-colors" title="تسجيل الخروج">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
