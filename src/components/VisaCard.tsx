import React, { useState, useRef, useEffect } from 'react';
import { Lock, Unlock, Wifi, Copy, RotateCcw } from 'lucide-react';
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react';
import { User } from '../types';
import { getTranslation } from '../i18n';
import logo from '../assets/images/regenerated_image_1781780076153.png';

interface VisaCardProps {
  user: User;
  theme: 'dark' | 'light';
}

export function VisaCard({ user, theme }: VisaCardProps) {
  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);

  const [isRevealed, setIsRevealed] = useState(false);
  const [isFlipped, setIsFlipped] = useState(false);
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    const handleFlipEvent = () => setIsFlipped(f => !f);
    window.addEventListener('toggle-card-flip', handleFlipEvent);
    return () => window.removeEventListener('toggle-card-flip', handleFlipEvent);
  }, []);
  
  const cardRef = useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  
  const springConfig = { damping: 20, stiffness: 100, mass: 1 };
  const rotateX = useSpring(useTransform(y, [-0.5, 0.5], [15, -15]), springConfig);
  const rotateY = useSpring(useTransform(x, [-0.5, 0.5], [-15, 15]), springConfig);

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!cardRef.current || isFlipped) return;
    const rect = cardRef.current.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    
    x.set(mouseX / width - 0.5);
    y.set(mouseY / height - 0.5);
  };

  const handlePointerLeave = () => {
    x.set(0);
    y.set(0);
  };

  const handleReveal = () => {
    if (password === user.pin || (!user.pin && password === '1234')) {
      setIsRevealed(true);
      setError(false);
    } else {
      setError(true);
      setIsRevealed(false);
    }
  };

  const copyToClipboard = (text: string | undefined) => {
    if (!text || !isRevealed) return;
    navigator.clipboard.writeText(text);
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300';
    toast.innerText = t.copied;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  return (
    <div className="flex flex-col items-center gap-6 w-full max-w-[420px]">
      {/* Flip Button Above Card */}
      <button 
        onClick={(e) => { e.stopPropagation(); setIsFlipped(!isFlipped); }}
        className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 border border-white/20 transition-all active:scale-95 text-white font-bold backdrop-blur-md light-mode-btn"
      >
        <RotateCcw className={`w-4 h-4 transition-transform duration-500 ${isFlipped ? 'rotate-180' : ''} light-mode-text`} />
        <span className="light-mode-text">{isFlipped ? (lang === 'ar' ? 'عرض الوجه' : 'View Front') : (lang === 'ar' ? 'عرض الظهر' : 'View Back')}</span>
      </button>

      {/* 3D Realistic Card Stage */}
      <div className="w-full aspect-[1.586] perspective-[2000px] z-10 mx-auto px-0 touch-none overflow-visible">
        <motion.div 
          ref={cardRef}
          onPointerMove={handlePointerMove}
          onPointerLeave={handlePointerLeave}
          style={{ rotateX, rotateY, transformStyle: "preserve-3d" }}
          className="relative w-full h-full"
        >
          <motion.div
            initial={false}
            animate={{ rotateY: isFlipped ? 180 : 0 }}
            transition={{ type: "spring", stiffness: 60, damping: 20 }}
            style={{ transformStyle: "preserve-3d" }}
            className="w-full h-full relative group"
          >
            {/* --- FRONT SIDE --- */}
            <div 
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
              className="absolute inset-0 w-full h-full rounded-[24px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] border border-white/20 overflow-hidden bg-gradient-to-br from-[#0a1128] via-[#1c2c5c] to-[#0d1633]"
            >
              {/* Subtle swoosh highlight */}
              <div className="absolute top-[-50%] left-[-20%] w-[120%] h-[120%] bg-gradient-to-tr from-transparent via-[#ffffff10] to-transparent rotate-[-30deg] pointer-events-none"></div>

              {/* Texture Overlay */}
              <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==")', backgroundRepeat: 'repeat' }}></div>

              <div className="absolute inset-0 p-6 sm:p-8 flex flex-col justify-between z-10" style={{ transform: "translateZ(30px)" }}>
                
                {/* Header: Chip & Visa Logo */}
                <div className="flex justify-between items-start" dir="ltr">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 flex items-center justify-center -mt-1 transition-transform hover:scale-110">
                      <img src={logo} alt="Mada Logo" className="w-full h-full object-contain light-mode-logo" />
                    </div>
                    <div className="flex flex-col gap-3">
                      <div className="w-12 h-9 bg-gradient-to-br from-[#e5c158] via-[#f9e596] to-[#b38b22] rounded-md relative overflow-hidden shadow-inner opacity-90 border border-yellow-800/80">
                        <div className="absolute top-1/2 left-0 w-full h-[1px] bg-black/20"></div>
                        <div className="absolute top-0 left-1/2 w-[1px] h-full bg-black/20"></div>
                        <div className="absolute top-1/4 left-0 w-full h-[1px] bg-black/20"></div>
                        <div className="absolute top-3/4 left-0 w-full h-[1px] bg-black/20"></div>
                        <div className="absolute top-1/2 left-1/2 w-4 h-5 border border-black/20 rounded-full -translate-x-1/2 -translate-y-1/2"></div>
                      </div>
                      <Wifi className="w-6 h-6 text-white/50 rotate-90 ml-1 drop-shadow-md" />
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <button onClick={(e) => { e.stopPropagation(); setIsFlipped(true); }} className="p-1.5 bg-white/10 hover:bg-white/20 transition-colors rounded-full text-white/80 backdrop-blur-md border border-white/10 active:scale-95" title={t.flipCard}>
                      <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="flex flex-col items-end">
                      <div className="text-right italic font-black text-2xl sm:text-3xl text-white tracking-tighter">VISA</div>
                      <div className="text-[6px] text-gray-400 font-bold tracking-[0.2em] -mt-1">PLATINUM</div>
                    </div>
                  </div>
                </div>

                {/* Numbers */}
                <div className="w-full mt-2" dir="ltr">
                  <div className="relative">
                      <motion.p 
                        animate={{ opacity: isRevealed ? 1 : 0.4, filter: isRevealed ? 'blur(0px)' : 'blur(5px)' }}
                        onClick={(e) => { e.stopPropagation(); isRevealed && copyToClipboard(user?.card?.number); }}
                        className={`text-[16px] min-[320px]:text-[18px] min-[375px]:text-[22px] sm:text-[28px] font-mono tracking-wide sm:tracking-widest flex justify-between text-white drop-shadow-[1px_1px_2px_rgba(0,0,0,0.8)] ${isRevealed ? 'cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity' : ''}`}
                      >
                        <span>{user?.card?.number?.substring(0,4)}</span>
                        <span>{isRevealed ? user?.card?.number?.substring(4,8) : '****'}</span>
                        <span>{isRevealed ? user?.card?.number?.substring(8,12) : '****'}</span>
                        <span>{user?.card?.number?.substring(12,16)}</span>
                      </motion.p>
                      
                      {/* Blurred State Message */}
                      {!isRevealed && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                          <div className="bg-black/80 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full flex items-center gap-2 shadow-xl" dir="rtl">
                            <Lock className="w-4 h-4 text-white" />
                            <span className="text-xs font-bold text-white tracking-wide">{t.secureCard}</span>
                          </div>
                        </div>
                      )}
                  </div>
                </div>

                {/* Footer Metadata */}
                <div className="flex justify-between items-end mt-4 text-white" dir="ltr">
                  <div className="flex gap-6">
                    <div onClick={(e) => { e.stopPropagation(); copyToClipboard(user?.card?.holderName); }} className={isRevealed ? 'cursor-pointer hover:opacity-80' : ''}>
                      <p className="text-[10px] text-gray-400 uppercase mb-1 tracking-widest opacity-80 font-medium">{t.cardHolder}</p>
                      <p className="text-sm font-black uppercase tracking-widest drop-shadow-md">{user?.card?.holderName}</p>
                    </div>
                    {isRevealed && (
                      <div onClick={(e) => { e.stopPropagation(); copyToClipboard(user?.card?.cvv); }} className={isRevealed ? 'cursor-pointer hover:opacity-80' : ''}>
                        <p className="text-[10px] text-gray-400 uppercase mb-1 tracking-widest opacity-80 font-medium">{t.cvv}</p>
                        <p className="text-sm font-black drop-shadow-md">{user?.card?.cvv}</p>
                      </div>
                    )}
                  </div>
                  <div className="text-right" onClick={(e) => { e.stopPropagation(); copyToClipboard(user?.card?.expiry); }}>
                    <p className="text-[10px] text-gray-400 uppercase mb-1 tracking-widest opacity-80 font-medium">{t.expires}</p>
                    <p className={`text-sm font-black tracking-widest drop-shadow-md ${isRevealed ? 'cursor-pointer hover:opacity-80' : ''}`}>{isRevealed ? user?.card?.expiry : '**/**'}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* --- BACK SIDE --- */}
            <div 
              style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
              className="absolute inset-0 w-full h-full rounded-[24px] shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] border border-white/20 overflow-hidden bg-gradient-to-br from-[#0d1633] via-[#1c2c5c] to-[#0a1128]"
            >
              {/* Texture Overlay */}
              <div className="absolute inset-0 opacity-[0.25] mix-blend-overlay" style={{ backgroundImage: 'url("data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSIvPjwvc3ZnPg==")', backgroundRepeat: 'repeat' }}></div>

              <div className="absolute top-4 sm:top-6 w-full h-8 sm:h-10 bg-black/80"></div>

              <div className="absolute top-12 sm:top-16 left-5 right-5 sm:left-6 sm:right-6 flex flex-col gap-1.5 sm:gap-2 text-white z-10" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                 <div className="relative">
                    <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5 opacity-80">{t.ibanInfo}</p>
                    <div 
                      className={`bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 font-mono tracking-wider text-[9px] sm:text-xs break-all ${isRevealed ? 'cursor-pointer hover:bg-white/20' : ''}`}
                      onClick={(e) => { e.stopPropagation(); isRevealed && copyToClipboard("AE" + user.id.slice(0, 20).padEnd(20, '0')); }}
                      style={{ opacity: isRevealed ? 1 : 0.4, filter: isRevealed ? 'blur(0px)' : 'blur(4px)' }}
                    >
                      AE{user.id.slice(0, 20).padEnd(20, '0')}
                    </div>
                 </div>

                 <div className="flex justify-between gap-2 sm:gap-3">
                    <div className="flex-1 relative">
                      <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5 opacity-80">{t.swiftCode}</p>
                      <div 
                         className={`bg-white/10 px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 font-mono tracking-wider text-[9px] sm:text-[10px] ${isRevealed ? 'cursor-pointer hover:bg-white/20' : ''}`} 
                         onClick={(e) => { e.stopPropagation(); isRevealed && copyToClipboard("CBQKAEA1"); }}
                         style={{ opacity: isRevealed ? 1 : 0.4, filter: isRevealed ? 'blur(0px)' : 'blur(4px)' }}
                      >
                        CBQKAEA1
                      </div>
                    </div>
                    <div>
                      <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider font-bold mb-0.5 opacity-80 text-right">{t.cvv}</p>
                      <div 
                        className={`bg-white px-2 sm:px-3 py-1 sm:py-1.5 rounded-lg border border-white/10 font-mono text-black font-bold tracking-wider text-[9px] sm:text-[10px] text-right italic ${isRevealed ? 'cursor-pointer hover:bg-white/80' : ''}`} 
                        onClick={(e) => { e.stopPropagation(); isRevealed && copyToClipboard(user?.card?.cvv); }}
                        style={{ opacity: isRevealed ? 1 : 0.4, filter: isRevealed ? 'blur(0px)' : 'blur(4px)' }}
                      >
                        {isRevealed ? user?.card?.cvv : '***'}
                      </div>
                    </div>
                 </div>

                  <div>
                    <p className="text-[8px] sm:text-[9px] text-gray-400 uppercase tracking-wider font-bold mt-1 mb-0.5 opacity-80">{t.bankName}</p>
                    <p className="text-[8px] sm:text-[9px] font-bold text-gray-300">Mada Financial Enclave HQ</p>
                  </div>
              </div>

               {/* Blurred State Message for Back Side */}
              {!isRevealed && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
                  <div className="bg-black/80 backdrop-blur-md border border-white/20 px-5 py-2 rounded-full flex items-center gap-2 shadow-xl mt-12" dir="rtl">
                    <Lock className="w-4 h-4 text-white" />
                    <span className="text-xs font-bold text-white tracking-wide">{t.secureCard}</span>
                  </div>
                </div>
              )}
            </div>

          </motion.div>
        </motion.div>
      </div>

      {/* Flip Button & Action Enclave */}
      <div className="w-full px-4 z-10 pb-4">
        {!isRevealed ? (
          <div className="bg-black border border-white/20 rounded-[28px] p-6 shadow-[0_10px_30px_rgba(255,255,255,0.05)] flex flex-col gap-4 light-mode-card">
            <h3 className="text-center text-sm font-bold text-gray-200 light-mode-text">{t.verifyToUnlock}</h3>
            <div className="flex flex-col gap-3">
              <input 
                type="password" 
                placeholder="****" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleReveal()}
                className="w-full bg-[#111] border border-white/10 rounded-2xl px-5 py-4 text-center text-white focus:outline-none focus:border-white/50 transition-colors placeholder:text-gray-600 font-mono text-lg tracking-widest light-mode-bg light-mode-text"
              />
              <button 
                onClick={handleReveal}
                disabled={password.length < 4}
                className="w-full bg-white text-black px-6 py-4 rounded-2xl font-black transition-all text-base disabled:opacity-40 disabled:cursor-not-allowed enabled:active:scale-[0.98] light-mode-btn"
              >
                {t.authToView}
              </button>
            </div>
            {error && <p className="text-red-400 text-xs font-bold text-center">{t.wrongPin}</p>}
          </div>
        ) : (
          <div className="bg-[#111] border border-white/30 rounded-[28px] p-6 flex flex-col items-center gap-3 shadow-2xl light-mode-card">
             <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center light-mode-btn">
               <Unlock className="w-6 h-6 text-white light-mode-text" />
             </div>
             <p className="text-sm font-black text-white light-mode-text">{t.unlockData}</p>
             <button 
               onClick={() => {
                 setIsRevealed(false);
                 setPassword('');
               }}
               className="mt-2 text-xs font-bold text-gray-400 underline hover:text-white transition-colors py-2"
             >
               {t.lockCard}
             </button>
          </div>
        )}
      </div>
    </div>
  );
}
