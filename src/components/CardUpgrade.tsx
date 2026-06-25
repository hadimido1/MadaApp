import React, { useState } from 'react';
import { ArrowLeft, Lock, Check, Sparkles, Trophy, ShieldAlert, Award } from 'lucide-react';
import { User, ViewState } from '../types';
import { getTranslation } from '../i18n';
import { cardLevels, CardLevel } from '../cardLevels';
import { db } from '../firebase';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { VisaCard } from './VisaCard';
import { motion } from 'motion/react';

interface CardUpgradeProps {
  user: User;
  onNavigate: (v: ViewState) => void;
  onUserUpdate: (u: User) => void;
  theme: 'dark' | 'default';
}

export function CardUpgrade({ user, onNavigate, onUserUpdate, theme }: CardUpgradeProps) {
  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);
  
  const currentLevelNum = user.cardLevel || 1;
  const currentLvl = cardLevels.find(l => l.level === currentLevelNum) || cardLevels[0];

  const [celebrating, setCelebrating] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Find the highest level the user can actually unlock right now based on their balance
  const maxPossibleLevel = [...cardLevels]
    .reverse()
    .find(l => user.balance >= l.minBalance);

  const canUpgrade = maxPossibleLevel && maxPossibleLevel.level > currentLevelNum;

  const handleSelectLevel = async (levelNum: number) => {
    const targetLvl = cardLevels.find(l => l.level === levelNum);
    if (!targetLvl) return;

    if (user.balance < targetLvl.minBalance) {
      setErrorMsg(t.insufficientFundsUpgrade);
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    try {
      const userRef = doc(db, 'users', user.id);
      
      // If upgrading to a new level, let's trigger a celebration and send a system notification!
      if (levelNum > currentLevelNum) {
        setCelebrating(true);
        setTimeout(() => setCelebrating(false), 3000);

        // Generate a milestone system notification
        const newNotification = {
          id: 'sys_' + Date.now(),
          type: 'system' as const,
          message: lang === 'ar' 
            ? `تهانينا! لقد قمت بترقية بطاقتك إلى مستوى: ${targetLvl.nameAr}`
            : `Congratulations! You have upgraded your card to: ${targetLvl.nameEn}`,
          timestamp: Date.now(),
          read: false
        };

        await updateDoc(userRef, {
          cardLevel: levelNum,
          notifications: arrayUnion(newNotification)
        });

        onUserUpdate({
          ...user,
          cardLevel: levelNum,
          notifications: [...(user.notifications || []), newNotification]
        });
      } else {
        await updateDoc(userRef, { cardLevel: levelNum });
        onUserUpdate({ ...user, cardLevel: levelNum });
      }
    } catch (err) {
      console.error("Error updating level in Firestore", err);
    }
  };

  const handleAutoUpgrade = () => {
    if (canUpgrade && maxPossibleLevel) {
      handleSelectLevel(maxPossibleLevel.level);
    }
  };

  const formatMoney = (val: number) => {
    return val.toLocaleString(lang === 'ar' ? 'ar-EG' : 'en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    });
  };

  return (
    <div id="card-upgrade-view" className="flex-1 flex flex-col h-full overflow-hidden relative select-none">
      
      {/* Header */}
      <div className="p-4 flex items-center justify-between border-b border-white/10 sticky top-0 bg-black/60 backdrop-blur-md z-30">
        <button 
          onClick={() => onNavigate('dashboard')}
          className="p-2 hover:bg-white/10 rounded-full transition-colors"
        >
          <ArrowLeft className={`w-6 h-6 text-white ${lang === 'ar' ? 'rotate-180' : ''}`} />
        </button>
        <span className="font-black text-white text-lg tracking-tight">
          {lang === 'ar' ? 'ترقية البطاقة والجماليات' : 'Card Levels & Upgrades'}
        </span>
        <div className="w-10"></div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 min-h-0 overflow-y-auto sm:overflow-y-hidden flex flex-col sm:flex-row w-full max-w-7xl mx-auto p-2 sm:p-6 gap-4 sm:gap-6">
        
        {/* Left Column: Fixed Card live preview and upgrade summaries */}
        <div className="w-full sm:w-[45%] lg:w-[40%] sm:h-full flex flex-col gap-3 sm:gap-4 sm:overflow-y-auto show-scrollbar shrink-0 pr-0 sm:pr-2 pb-4 sm:pb-6">
             
             {/* Active Card Live Preview Frame */}
             <div className="sticky top-[58px] sm:relative sm:top-0 z-20 bg-[#0e0e11]/95 sm:bg-transparent pb-3 sm:pb-2 border-b border-white/5 sm:border-0 w-full flex justify-center py-2 relative">
               {celebrating && (
                 <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                   <motion.div 
                     initial={{ scale: 0.5, opacity: 0 }}
                     animate={{ scale: [1, 1.3, 1], opacity: [0, 1, 0] }}
                     transition={{ duration: 1.5, repeat: Infinity }}
                     className="absolute text-yellow-400 font-black text-xl flex items-center gap-1.5"
                   >
                     <Sparkles className="w-10 h-10 animate-spin" />
                     <span>LEVEL UP!</span>
                   </motion.div>
                 </div>
               )}
               <VisaCard user={user} theme={theme} />
             </div>

             {/* Upgrade Summary Dashboard Widget */}
             <div className="w-full theme-card-bg border rounded-2xl sm:rounded-3xl p-3 sm:p-5 flex flex-col gap-2.5 sm:gap-4 shadow-xl relative overflow-hidden">
               <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none"></div>
               
               <div className="flex justify-between items-start gap-1">
                 <div>
                   <p className="text-[8px] sm:text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                     {lang === 'ar' ? 'التصميم المفعل حالياً' : 'Currently Active Design'}
                   </p>
                   <h3 className="text-xs sm:text-xl font-black text-white mt-0.5 sm:mt-1">
                     {lang === 'ar' ? currentLvl.nameAr : currentLvl.nameEn}
                   </h3>
                   <p className="text-[9px] sm:text-xs text-gray-400 mt-0.5 sm:mt-1 leading-normal">
                     {lang === 'ar' ? currentLvl.descriptionAr : currentLvl.descriptionEn}
                   </p>
                 </div>
                 <div className="bg-accent/10 border border-accent/20 px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-md sm:rounded-full text-accent text-[8px] sm:text-xs font-black uppercase shrink-0">
                   LVL {currentLevelNum}
                 </div>
               </div>

               {/* Quick Upgrade Trigger */}
               {canUpgrade && maxPossibleLevel ? (
                 <button 
                   onClick={handleAutoUpgrade}
                   className="w-full py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-gradient-to-r from-accent via-indigo-600 to-purple-600 hover:from-accent hover:to-purple-500 text-white font-black text-[10px] sm:text-sm shadow-[0_4px_20px_rgba(59,130,246,0.4)] flex items-center justify-center gap-1 sm:gap-2 animate-pulse active:scale-[0.98] transition-all cursor-pointer"
                 >
                   <Sparkles className="w-3 sm:w-4 h-3 sm:h-4 text-yellow-300" />
                   <span>
                     {lang === 'ar' 
                       ? `ترقية للمستوى ${maxPossibleLevel.level}`
                       : `Upgrade to Level ${maxPossibleLevel.level}`}
                   </span>
                 </button>
               ) : (
                 <div className="w-full py-1.5 px-2 sm:py-3 sm:px-4 rounded-lg sm:rounded-xl bg-white/[0.02] border border-white/5 text-center text-[9px] sm:text-xs text-gray-500 font-semibold flex items-center justify-center gap-1 sm:gap-2">
                   <Check className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-500 shrink-0" />
                   <span>
                     {lang === 'ar' 
                       ? 'مستوى بطاقتك ممتاز لرصيدك.'
                       : 'Activated best card for balance.'}
                   </span>
                 </div>
               )}

               {/* Progress Indicator to RGB Millionaire Level */}
               <div className="mt-1 sm:mt-2 flex flex-col gap-1 sm:gap-1.5">
                 <div className="flex justify-between text-[8px] sm:text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                   <span>{lang === 'ar' ? 'التقدم للمليونير' : 'Progress to Millionaire'}</span>
                   <span>{Math.min(100, Math.floor((user.balance / 1000000) * 100))}%</span>
                 </div>
                 <div className="w-full h-1.5 sm:h-2 bg-white/5 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-gradient-to-r from-accent via-purple-500 to-pink-500 transition-all duration-1000"
                     style={{ width: `${Math.min(100, (user.balance / 1000000) * 100)}%` }}
                   ></div>
                 </div>
               </div>
             </div>

             {/* Error / Feedback Popup Alert */}
             {errorMsg && (
               <div className="w-full p-4 rounded-2xl bg-red-950/40 border border-red-500/30 flex items-center gap-3 text-red-200 text-xs font-bold shadow-lg animate-in fade-in slide-in-from-top-2">
                 <ShieldAlert className="w-5 h-5 text-red-500 flex-shrink-0" />
                 <span>{errorMsg}</span>
               </div>
             )}
        </div>

        {/* Right Column: Card Level Catalog / Tier List */}
        <div className="flex-1 flex flex-col gap-4 sm:overflow-y-auto show-scrollbar pb-28 sm:pb-6 pr-0 sm:pr-2">
             <div className="w-full text-left px-1">
               <h4 className="text-sm font-black text-white/90 uppercase tracking-widest flex items-center gap-1.5">
                 <Trophy className="w-4 h-4 text-yellow-400" />
                 <span>{lang === 'ar' ? 'كتالوج مستويات البطاقة' : 'Card Level Catalog'}</span>
               </h4>
               <p className="text-xs text-gray-500 mt-1">
                 {lang === 'ar' 
                   ? 'تعتمد الترقية على رصيدك المتاح. كلما زاد رصيدك، فُتحت مزايا وتصاميم أرقى.'
                   : 'Card designs unlock based on your balance. Keep growing your funds to open elite skins.'}
               </p>
             </div>

             {/* All 21 Levels Grid */}
             <div className="w-full flex flex-col gap-3">
               {cardLevels.map((lvl) => {
            const isUnlocked = user.balance >= lvl.minBalance;
            const isActive = lvl.level === currentLevelNum;

            return (
              <div 
                key={lvl.level}
                onClick={() => isUnlocked && handleSelectLevel(lvl.level)}
                className={`group w-full p-4 rounded-2xl border flex items-center justify-between transition-all relative overflow-hidden ${
                  isActive 
                    ? 'border-accent bg-accent/5 shadow-[0_0_15px_rgba(59,130,246,0.15)] ring-1 ring-accent/20' 
                    : isUnlocked 
                      ? 'border-white/10 bg-white/[0.02] hover:bg-white/[0.04] cursor-pointer' 
                      : 'border-white/5 bg-black/40 opacity-70'
                }`}
              >
                
                {/* Level Styling / Card representation */}
                <div className="flex items-center gap-4">
                  
                  {/* Decorative miniature gradient thumbnail of the card design */}
                  <div className={`w-12 h-8 rounded-md border border-white/20 shadow-md flex-shrink-0 flex items-center justify-center overflow-hidden ${
                    lvl.materialClass ? lvl.materialClass : `bg-gradient-to-br ${lvl.cardBg}`
                  }`}>
                    <div className="w-2 h-2 bg-yellow-500/80 rounded-sm"></div>
                  </div>

                  {/* Level Details */}
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-accent">LVL {lvl.level}</span>
                      <span className="font-extrabold text-white text-sm">
                        {lang === 'ar' ? lvl.nameAr : lvl.nameEn}
                      </span>
                      {isActive && (
                        <span className="bg-emerald-500/20 text-emerald-400 text-[8px] font-black tracking-widest px-2 py-0.5 rounded uppercase">
                          {t.activeCard}
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-gray-500 mt-0.5 font-bold uppercase tracking-wider">
                      {isUnlocked 
                        ? (lang === 'ar' ? 'جاهز للتفعيل' : 'Ready to activate') 
                        : (lang === 'ar' ? `يتطلب رصيد ${formatMoney(lvl.minBalance)}` : `Requires ${formatMoney(lvl.minBalance)}`)}
                    </span>
                  </div>
                </div>

                {/* Unlock status icons or padlocks */}
                <div className="flex items-center">
                  {isActive ? (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                      <Check className="w-4 h-4 stroke-[3px]" />
                    </div>
                  ) : isUnlocked ? (
                    <div className="w-8 h-8 rounded-full bg-white/5 group-hover:bg-accent/10 group-hover:border-accent/30 border border-white/10 flex items-center justify-center text-gray-400 group-hover:text-accent transition-colors">
                      <Award className="w-4 h-4" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center text-gray-600">
                      <Lock className="w-4 h-4" />
                    </div>
                  )}
                </div>

              </div>
            );
          })}
        </div>
        
        </div> {/* Closes right column */}
      </div> {/* Closes main split layout */}
    </div>
  );
}
