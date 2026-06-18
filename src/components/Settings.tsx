import { useState } from 'react';
import { Shield, Lock, CheckCircle2, User as UserIcon, Globe, Palette, LogOut, ChevronLeft, X, Moon, Sun, PlusCircle } from 'lucide-react';
import { User, ViewState } from '../types';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { getTranslation } from '../i18n';

interface SettingsProps {
  user: User;
  onLogout: () => void;
  onNavigate: (v: ViewState) => void;
  onUserUpdate: (u: User) => void;
  theme: 'dark' | 'light';
  setTheme: (t: 'dark' | 'light') => void;
}

export function Settings({ user, onLogout, onNavigate, onUserUpdate, theme, setTheme }: SettingsProps) {
  const [activeModal, setActiveModal] = useState<'privacy' | 'theme' | 'language' | 'accounts' | null>(null);
  const recentUsers = JSON.parse(localStorage.getItem('recent_users') || '[]');
  
  const [language, setLanguage] = useState<'ar' | 'en'>(localStorage.getItem('app_lang') as 'ar' | 'en' || 'en');
  const t = getTranslation(language);

  // Edit states
  const [editName, setEditName] = useState(user.name);
  const [editAge, setEditAge] = useState(user.age || '');
  const [editCountry, setEditCountry] = useState(user.country || '');
  const [editPin, setEditPin] = useState(user.pin || '');
  const [isSaving, setIsSaving] = useState(false);

  const handleThemeChange = (newTheme: 'dark' | 'light') => {
    setTheme(newTheme);
    localStorage.setItem('app_theme', newTheme);
    setActiveModal(null);
  };

  const handleLanguageChange = (newLang: 'ar' | 'en') => {
    setLanguage(newLang);
    localStorage.setItem('app_lang', newLang);
    setActiveModal(null);
    window.location.reload();
  };

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await updateDoc(doc(db, 'users', user.id), {
        name: editName,
        age: editAge,
        country: editCountry,
        pin: editPin
      });
      onUserUpdate({ ...user, name: editName, age: editAge, country: editCountry, pin: editPin });
      setActiveModal(null);
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col w-full overflow-y-auto pt-safe pb-32 px-4 bg-black touch-pan-y relative light-mode-bg">
      <div className="relative z-10 w-full max-w-lg mx-auto pt-10">
        
        <h1 className="text-3xl font-black text-white mb-8 tracking-tight light-mode-text">{t.settings}</h1>

        <div className="flex flex-col gap-6">
          {/* Account Settings */}
          <div>
            <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3 px-2">{t.account}</h2>
            <div className="bg-white/[0.03] border border-white/10 rounded-[28px] overflow-hidden flex flex-col shadow-lg light-mode-card">
              <div className="flex items-center justify-between p-5 border-b border-white/10 active:bg-blue-500/10 transition-colors cursor-pointer group" onClick={() => setActiveModal('accounts' as any)}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20 overflow-hidden">
                    {user.photoURL ? (
                      <img src={user.photoURL} alt={user.name} referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                    ) : (
                      <UserIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm light-mode-text">{user.name}</span>
                    <span className="text-gray-500 text-[10px] mt-0.5">{user.email}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 text-blue-500">
                  <span className="text-[10px] font-bold uppercase tracking-widest">{t.switchAccount || "Switch"}</span>
                  <ChevronLeft className={`w-4 h-4 transition-transform -rotate-90`} />
                </div>
              </div>
              <div className="flex items-center justify-between p-5 active:bg-blue-500/10 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Lock className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-white font-bold text-sm light-mode-text">{t.security}</span>
                    <span className="text-gray-500 text-xs mt-0.5">{t.protected}</span>
                  </div>
                </div>
                <CheckCircle2 className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </div>

          {/* App Settings */}
          <div>
            <h2 className="text-xs font-bold text-blue-500/60 uppercase tracking-widest mb-3 px-2">{t.app}</h2>
            <div className="bg-white/[0.03] border border-white/10 rounded-[28px] overflow-hidden flex flex-col shadow-lg light-mode-card">
              <button onClick={() => setActiveModal('privacy')} className="flex items-center justify-between p-5 border-b border-white/10 active:bg-blue-500/10 transition-colors text-right w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm light-mode-text">{t.privacy}</span>
                    <span className="text-gray-500 text-[10px] uppercase tracking-tighter font-black">Security Vault</span>
                  </div>
                </div>
                <ChevronLeft className={`w-5 h-5 text-gray-500 ${language === 'en' ? 'rotate-180' : ''}`} />
              </button>
              
              <button onClick={() => setActiveModal('theme')} className="flex items-center justify-between p-5 border-b border-white/10 active:bg-blue-500/10 transition-colors text-right w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Palette className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm light-mode-text">{t.theme}</span>
                    <span className="text-blue-500 text-[10px] font-black uppercase tracking-tighter">{theme === 'dark' ? t.dark : t.light}</span>
                  </div>
                </div>
                <ChevronLeft className={`w-5 h-5 text-gray-500 ${language === 'en' ? 'rotate-180' : ''}`} />
              </button>
              
              <button onClick={() => setActiveModal('language')} className="flex items-center justify-between p-5 active:bg-blue-500/10 transition-colors text-right w-full">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <div className="flex flex-col text-left">
                    <span className="text-white font-bold text-sm light-mode-text">{t.language}</span>
                    <span className="text-gray-500 text-[10px] uppercase font-black">{language === 'ar' ? 'العربية' : 'English'}</span>
                  </div>
                </div>
                <ChevronLeft className={`w-5 h-5 text-gray-500 ${language === 'en' ? 'rotate-180' : ''}`} />
              </button>
            </div>
          </div>

          {/* Logout */}
          <div className="mt-4">
            <button 
              onClick={onLogout}
              className="w-full bg-red-600 hover:bg-red-700 text-white rounded-[24px] p-5 flex items-center justify-center gap-3 active:scale-[0.98] transition-transform shadow-lg shadow-red-600/20"
            >
              <LogOut className="w-5 h-5 text-white" />
              <span className="text-white font-black text-sm uppercase tracking-widest">{t.logoutFull}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Modals */}
      {activeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#111] border border-white/10 w-full max-w-sm rounded-[32px] overflow-hidden shadow-2xl relative light-mode-modal flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                  {activeModal === 'accounts' ? <UserIcon className="w-4 h-4 text-blue-500" /> : <Shield className="w-4 h-4 text-blue-500" />}
                </div>
                <h2 className="text-base font-black text-white light-mode-text">
                  {activeModal === 'accounts' ? t.savedAccounts : t.editAccount}
                </h2>
              </div>
              <button onClick={() => setActiveModal(null)} className="p-2 bg-white/5 rounded-full text-gray-400">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6">

            {activeModal === 'accounts' && (
              <div className="flex flex-col gap-6 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <UserIcon className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-black text-white light-mode-text">{t.savedAccounts}</h2>
                </div>
                
                <div className="flex flex-col gap-3 max-h-[50vh] overflow-y-auto pr-1">
                  {recentUsers.map((u: any, i: number) => (
                    <button 
                      key={i}
                      onClick={() => {
                        if (u.email === user.email) {
                          setActiveModal(null);
                        } else {
                          localStorage.setItem('target_switch_email', u.email);
                          onLogout();
                        }
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${u.email === user.email ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5 hover:bg-white/10'}`}
                    >
                      <div className="flex items-center gap-4 text-right">
                        <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden border border-white/20">
                           {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <UserIcon className="w-5 h-5 text-gray-400 mx-auto mt-2" />}
                        </div>
                        <div className="flex flex-col">
                           <span className="text-white font-bold text-sm light-mode-text">{u.name || 'User'}</span>
                           <span className="text-gray-500 text-[10px]">{u.email}</span>
                        </div>
                      </div>
                      {u.email === user.email && <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                    </button>
                  ))}
                  
                  <button 
                    onClick={onLogout}
                    className="flex items-center gap-3 p-4 rounded-2xl border border-dashed border-white/20 text-gray-400 hover:text-white hover:border-white/40 transition-all font-bold text-sm"
                  >
                    <PlusCircle className="w-5 h-5" />
                    <span>{t.addAccount || "Add Account"}</span>
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'privacy' && (
              <div className="flex flex-col gap-6 mt-2 max-h-[70vh] overflow-y-auto hide-scrollbar">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Shield className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-black text-white light-mode-text">{t.editAccount}</h2>
                </div>
                
                <div className="flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">{t.fullName}</label>
                    <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white light-mode-text light-mode-bg focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">{t.age}</label>
                    <input type="number" value={editAge} onChange={e => setEditAge(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white light-mode-text light-mode-bg focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">{t.country}</label>
                    <input type="text" value={editCountry} onChange={e => setEditCountry(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white light-mode-text light-mode-bg focus:outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 block mb-1">PIN</label>
                    <input type="password" value={editPin} onChange={e => setEditPin(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white light-mode-text light-mode-bg focus:outline-none font-mono tracking-widest" />
                  </div>

                  <button 
                    onClick={handleSaveProfile} 
                    disabled={isSaving}
                    className="w-full mt-4 bg-blue-500 text-white rounded-xl py-4 font-bold disabled:opacity-50"
                  >
                    {t.save}
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'theme' && (
              <div className="flex flex-col gap-6 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Palette className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-black text-white light-mode-text">{t.theme}</h2>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleThemeChange('dark')} className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'dark' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5'} transition-colors`}>
                     <div className="flex items-center gap-3">
                       <Moon className={`w-5 h-5 ${theme === 'dark' ? 'text-blue-400' : 'text-gray-400'}`} />
                       <span className={`font-bold text-sm ${theme === 'dark' ? 'text-blue-400' : 'text-white light-mode-text'}`}>{t.dark}</span>
                     </div>
                     {theme === 'dark' && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                  </button>
                  <button onClick={() => handleThemeChange('light')} className={`flex items-center justify-between p-4 rounded-2xl border ${theme === 'light' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5'} transition-colors`}>
                     <div className="flex items-center gap-3">
                       <Sun className={`w-5 h-5 ${theme === 'light' ? 'text-blue-400' : 'text-gray-400'}`} />
                       <span className={`font-bold text-sm ${theme === 'light' ? 'text-blue-400' : 'text-white light-mode-text'}`}>{t.light}</span>
                     </div>
                     {theme === 'light' && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                  </button>
                </div>
              </div>
            )}

            {activeModal === 'language' && (
              <div className="flex flex-col gap-6 mt-2">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                    <Globe className="w-5 h-5 text-blue-500" />
                  </div>
                  <h2 className="text-lg font-black text-white light-mode-text">{t.language}</h2>
                </div>
                <div className="flex flex-col gap-3">
                  <button onClick={() => handleLanguageChange('ar')} className={`flex items-center justify-between p-4 rounded-2xl border ${language === 'ar' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5'} transition-colors`}>
                     <span className={`font-bold text-sm ${language === 'ar' ? 'text-blue-400' : 'text-white light-mode-text'}`}>العربية</span>
                     {language === 'ar' && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                  </button>
                  <button onClick={() => handleLanguageChange('en')} className={`flex items-center justify-between p-4 rounded-2xl border ${language === 'en' ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/5'} transition-colors`}>
                     <span className={`font-bold text-sm ${language === 'en' ? 'text-blue-400' : 'text-white light-mode-text'}`}>English</span>
                     {language === 'en' && <div className="w-3 h-3 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />}
                  </button>
                </div>
              </div>
            )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
}

