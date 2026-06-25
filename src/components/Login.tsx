import React, { useState, useEffect } from 'react';
import { User, Trash2 } from 'lucide-react';
import { signInWithGoogle, signInWithEmail, signUpWithEmail } from '../firebase';
import { getTranslation } from '../i18n';
import logo from '../assets/images/regenerated_image_1781780076153.png';

export function Login({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [authMode, setAuthMode] = useState<'google' | 'email_login' | 'email_register'>('google');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  
  useEffect(() => {
    const saved = localStorage.getItem('recent_users');
    if (saved) {
      try {
        const users = JSON.parse(saved);
        setRecentUsers(users);
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  const saveToRecent = (user: any) => {
    const freshRecent = [
      { 
        email: user.email, 
        name: user.name || user.displayName || 'AVBANK User', 
        photoURL: user.photoURL || '', 
        id: user.uid || user.id
      },
      ...recentUsers.filter(u => u.email !== user.email)
    ].slice(0, 3);
    localStorage.setItem('recent_users', JSON.stringify(freshRecent));
  };

  const handleGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      const user = await signInWithGoogle();
      saveToRecent(user);
      onLoginSuccess(user);
    } catch (err) {
      setError(t.loginError);
      setLoading(false);
    }
  };

  const handleEmailAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError(lang === 'ar' ? 'يرجى ملء جميع الحقول' : 'Please fill in all fields');
      return;
    }
    try {
      setLoading(true);
      setError('');
      let user;
      if (authMode === 'email_login') {
        user = await signInWithEmail(email, password);
      } else {
        user = await signUpWithEmail(email, password);
      }
      saveToRecent(user);
      onLoginSuccess(user);
    } catch (err: any) {
      console.error(err);
      let errMsg = t.loginError;
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        errMsg = lang === 'ar' ? 'البريد الإلكتروني أو كلمة المرور غير صحيحة' : 'Incorrect email or password';
      } else if (err.code === 'auth/email-already-in-use') {
        errMsg = lang === 'ar' ? 'هذا البريد الإلكتروني مستخدم بالفعل' : 'This email is already in use';
      } else if (err.code === 'auth/weak-password') {
        errMsg = lang === 'ar' ? 'كلمة المرور ضعيفة للغاية (يجب أن تكون 6 أحرف على الأقل)' : 'Password is too weak (min 6 characters)';
      } else if (err.code === 'auth/invalid-email') {
        errMsg = lang === 'ar' ? 'صيغة البريد الإلكتروني غير صحيحة' : 'Invalid email format';
      }
      setError(errMsg);
      setLoading(false);
    }
  };

  const removeRecent = (e: React.MouseEvent, userIdx: number) => {
    e.stopPropagation();
    const newRecent = recentUsers.filter((_, i) => i !== userIdx);
    setRecentUsers(newRecent);
    localStorage.setItem('recent_users', JSON.stringify(newRecent));
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6 relative overflow-hidden light-mode-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[320px] relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 mb-6 flex items-center justify-center transition-all hover:scale-110 duration-500">
          <img src={logo} alt="AVBANK Icon" className="w-full h-full object-contain light-mode-logo" />
        </div>
        
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1 italic light-mode-text">AVBANK</h1>
        <p className="text-gray-600 text-[10px] mb-12 text-center font-bold uppercase tracking-[0.4em]">Premium Banking enclave</p>

        {recentUsers.length > 0 && authMode === 'google' && (
          <div className="w-full mb-10">
            <p className="text-white text-[10px] font-black mb-4 opacity-40 uppercase tracking-[0.2em] text-center light-mode-text">{t.quickSwitch}</p>
            <div className="flex flex-col gap-3">
              {recentUsers.map((u, i) => (
                <div 
                  key={i} 
                  onClick={() => handleGoogleLogin()}
                  className="flex items-center justify-between p-4 rounded-[28px] bg-white/[0.03] border border-white/5 hover:bg-white/10 hover:border-white/20 transition-all cursor-pointer group relative overflow-hidden light-mode-card"
                >
                  <div className={`absolute inset-0 bg-gradient-to-${lang === 'ar' ? 'l' : 'r'} from-accent/0 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity`}></div>
                  <div className={`flex items-center gap-4 relative z-10 ${lang === 'ar' ? 'flex-row' : 'flex-row-reverse'}`}>
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center overflow-hidden shadow-xl group-hover:scale-105 transition-transform light-mode-card">
                      {u.photoURL ? <img src={u.photoURL} className="w-full h-full object-cover" /> : <User className="w-6 h-6 text-accent" />}
                    </div>
                    <div className={`flex flex-col ${lang === 'ar' ? 'text-right' : 'text-left'}`}>
                      <span className="text-white text-sm font-black group-hover:text-accent transition-colors light-mode-text">{u.name || (lang === 'ar' ? 'مستخدم AVBANK' : 'AVBANK User')}</span>
                      <span className="text-gray-500 text-[9px] font-mono opacity-60">{u.email}</span>
                    </div>
                  </div>
                  <button 
                    onClick={(e) => removeRecent(e, i)}
                    className="p-2.5 text-gray-700 hover:text-red-500 transition-all rounded-full hover:bg-white/5 relative z-20"
                    title={t.remove}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {authMode === 'google' ? (
          <div className="w-full flex flex-col gap-4">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white text-black font-black py-4.5 rounded-[24px] border border-transparent shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] text-base flex items-center justify-center gap-3 disabled:opacity-70 group hover:shadow-[0_25px_50px_rgba(255,255,255,0.15)] light-mode-card"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                  <span className="tracking-tight">{t.loginWithGoogle}</span>
                </>
              )}
            </button>

            <div className="w-full flex items-center gap-3 my-2 opacity-30">
              <div className="flex-1 h-[1px] bg-white"></div>
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">{t.orDivider}</span>
              <div className="flex-1 h-[1px] bg-white"></div>
            </div>

            <button
              onClick={() => {
                setError('');
                setAuthMode('email_login');
              }}
              className="w-full py-4 rounded-[24px] bg-white/[0.04] border border-white/10 text-white font-bold text-xs transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-95 light-mode-card"
            >
              {t.toggleEmailAuth}
            </button>
          </div>
        ) : (
          <form onSubmit={handleEmailAuthSubmit} className="w-full flex flex-col gap-4">
            <div className="text-center mb-1">
              <h3 className="text-white text-lg font-black tracking-tight light-mode-text">
                {authMode === 'email_login' ? t.signInWithEmail : t.registerBtn}
              </h3>
            </div>
            
            {/* Email Input */}
            <div className="flex flex-col gap-1.5 relative text-left w-full" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{t.emailLabel}</label>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
                className="w-full bg-white/[0.03] border border-white/10 focus:border-accent rounded-2xl px-4 py-3.5 text-white font-sans text-sm focus:outline-none transition-all placeholder:text-gray-600 light-mode-bg light-mode-text light-mode-border"
              />
            </div>

            {/* Password Input */}
            <div className="flex flex-col gap-1.5 relative text-left w-full" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
              <label className="text-[10px] font-black text-gray-500 uppercase tracking-wider">{t.passwordLabel}</label>
              <input 
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t.passwordPlaceholder}
                required
                className="w-full bg-white/[0.03] border border-white/10 focus:border-accent rounded-2xl px-4 py-3.5 text-white font-sans text-sm focus:outline-none transition-all placeholder:text-gray-600 light-mode-bg light-mode-text light-mode-border"
              />
            </div>

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-white text-black font-black py-4 rounded-2xl border border-transparent transition-all active:scale-[0.98] text-sm flex items-center justify-center gap-3 disabled:opacity-70 mt-2 light-mode-card"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin"></div>
              ) : (
                authMode === 'email_login' ? t.loginBtn : t.createAccount
              )}
            </button>

            {/* Toggle Link */}
            <div className="flex justify-between items-center text-[11px] mt-2 px-1">
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthMode(authMode === 'email_login' ? 'email_register' : 'email_login');
                }}
                className="text-accent hover:underline font-bold"
              >
                {authMode === 'email_login' ? t.noAccount : t.haveAccount}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAuthMode('google');
                }}
                className="text-gray-500 hover:text-white transition-colors font-bold"
              >
                {lang === 'ar' ? '← العودة للخلف' : '← Go Back'}
              </button>
            </div>
          </form>
        )}

        <p className="mt-12 text-gray-700 text-[9px] font-bold uppercase tracking-widest text-center">
          Protected by AES-256 Encryption
        </p>

        {error && <p className="text-red-400 text-xs font-bold text-center mt-6 p-4 bg-red-400/10 rounded-2xl w-full border border-red-400/20">{error}</p>}
      </div>
    </div>
  );
}
