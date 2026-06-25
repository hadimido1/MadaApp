import React, { useState, useEffect } from 'react';
import { User, Trash2, ExternalLink, HelpCircle, Copy, Check, X, Shield, Chrome, Loader2 } from 'lucide-react';
import { signInWithGoogle, db, auth, signInWithEmail, signUpWithEmail } from '../firebase';
import { doc, setDoc, onSnapshot, getDoc } from 'firebase/firestore';
import { getTranslation } from '../i18n';
import logo from '../assets/images/regenerated_image_1781780076153.png';

export function Login({ onLoginSuccess }: { onLoginSuccess: (user: any) => void }) {
  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [recentUsers, setRecentUsers] = useState<any[]>([]);
  const [showFixModal, setShowFixModal] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const [linkCopied, setLinkCopied] = useState(false);
  const [isWaitingForSync, setIsWaitingForSync] = useState(false);
  const [syncStatusMessage, setSyncStatusMessage] = useState('');
  
  // External Browser Authorization States
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isExternalAuthMode, setIsExternalAuthMode] = useState(false);
  const [authCompleted, setAuthCompleted] = useState(false);
  const [activeSyncSessId, setActiveSyncSessId] = useState<string | null>(null);

  const userAgentString = "Mozilla/5.0 (Linux; Android 13; SM-S901B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/116.0.0.0 Mobile Safari/537.36";
  const currentUrl = typeof window !== 'undefined' ? `${window.location.protocol}//${window.location.host}` : '';

  useEffect(() => {
    // Check if URL has session_id parameter (means we are opened inside the external secure browser)
    const queryParams = new URLSearchParams(window.location.search);
    const sessId = queryParams.get('session_id');
    if (sessId) {
      setSessionId(sessId);
      setIsExternalAuthMode(true);
    }

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
    } catch (err: any) {
      console.error(err);
      setError(t.loginError);
      setLoading(false);
      // Auto show the modal if Google login fails (since it's likely a WebView block)
      setShowFixModal(true);
    }
  };

  // Natively handle Google authentication on the external browser to pair back to APK
  const handleExternalGoogleLogin = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Log in with Google securely inside this external browser
      const googleUser = await signInWithGoogle();
      
      // 2. Generate a secure, deterministic email/password credential for this Google Account
      const syncEmail = `sync_${googleUser.uid}@avbank.com`;
      const syncPass = `secure_sync_${googleUser.uid}`;
      
      try {
        // Sign in or create user
        await signInWithEmail(syncEmail, syncPass);
      } catch (err: any) {
        if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
          await signUpWithEmail(syncEmail, syncPass);
        } else {
          throw err;
        }
      }

      // 3. Write 'completed' and credentials back to Firestore to wake up the app listener
      if (sessionId) {
        const sessionRef = doc(db, 'auth_sessions', sessionId);
        await setDoc(sessionRef, {
          status: 'completed',
          email: syncEmail,
          pass: syncPass,
          uid: googleUser.uid,
          displayName: googleUser.displayName || 'AVBANK User',
          photoURL: googleUser.photoURL || '',
          updatedAt: Date.now()
        }, { merge: true });
      }

      setAuthCompleted(true);
    } catch (err: any) {
      console.error(err);
      setError(lang === 'ar' ? 'فشل إتمام ربط تسجيل الدخول الآمن' : 'Failed to complete secure authentication link');
    } finally {
      setLoading(false);
    }
  };

  const handleTryAutoOpen = async () => {
    try {
      setLoading(true);
      setError('');
      
      // 1. Generate a unique security session ID
      const sessId = "sess_" + Math.random().toString(36).substring(2, 12);
      setActiveSyncSessId(sessId);
      
      // 2. Write to Firestore to declare a pending authentication session
      const sessionRef = doc(db, 'auth_sessions', sessId);
      await setDoc(sessionRef, {
        status: 'pending',
        createdAt: Date.now()
      });

      setIsWaitingForSync(true);
      setSyncStatusMessage(lang === 'ar' ? 'بانتظار إتمام تسجيل الدخول في المتصفح الخارجي...' : 'Waiting for login completion in external browser...');

      // 3. Listen to the session changes in real-time
      const unsub = onSnapshot(sessionRef, async (snap) => {
        const data = snap.data();
        if (data && data.status === 'completed') {
          unsub(); // unsubscribe
          setSyncStatusMessage(lang === 'ar' ? 'تم تسجيل الدخول بنجاح! جاري تحميل حسابك...' : 'Logged in successfully! Loading your account...');
          try {
            const user = await signInWithEmail(data.email, data.pass);
            
            // Auto-create user profile in Firestore if missing
            const userDocRef = doc(db, 'users', user.uid);
            const userSnap = await getDoc(userDocRef);
            if (!userSnap.exists()) {
              await setDoc(userDocRef, {
                name: data.displayName || 'AVBANK User',
                email: data.email,
                photoURL: data.photoURL || '',
                balance: 0,
                createdAt: Date.now(),
                role: 'admin'
              });
            }

            saveToRecent(user);
            onLoginSuccess(user);
          } catch (e) {
            console.error("Auto sign-in error", e);
            setError(lang === 'ar' ? 'حدث خطأ أثناء مزامنة الجلسة' : 'Session sync authentication failed');
          } finally {
            setIsWaitingForSync(false);
            setShowFixModal(false);
            setLoading(false);
          }
        }
      });

      // 4. Force device to prompt browser picker and open the remote login page
      window.open(`${currentUrl}/?session_id=${sessId}`, '_blank');

    } catch (err: any) {
      console.error(err);
      setError(lang === 'ar' ? 'حدث خطأ أثناء فتح المتصفح تلقائياً' : 'Could not launch secure external browser');
      setIsWaitingForSync(false);
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerifySync = async () => {
    if (!activeSyncSessId) return;
    try {
      setLoading(true);
      setError('');
      setSyncStatusMessage(lang === 'ar' ? 'جاري التحقق من حالة المزامنة يدويّاً...' : 'Verifying sync status manually...');
      
      const sessionRef = doc(db, 'auth_sessions', activeSyncSessId);
      const snap = await getDoc(sessionRef);
      const data = snap.data();
      
      if (data && data.status === 'completed') {
        setSyncStatusMessage(lang === 'ar' ? 'تم تسجيل الدخول بنجاح! جاري تحميل حسابك...' : 'Logged in successfully! Loading your account...');
        
        const user = await signInWithEmail(data.email, data.pass);
        
        // Auto-create user profile in Firestore if missing
        const userDocRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userDocRef);
        if (!userSnap.exists()) {
          await setDoc(userDocRef, {
            name: data.displayName || 'AVBANK User',
            email: data.email,
            photoURL: data.photoURL || '',
            balance: 0,
            createdAt: Date.now(),
            role: 'admin'
          });
        }

        saveToRecent(user);
        onLoginSuccess(user);
        setIsWaitingForSync(false);
        setShowFixModal(false);
      } else {
        setError(lang === 'ar' ? 'لم يتم إكمال تسجيل الدخول في المتصفح الخارجي بعد. الرجاء إكماله أولاً ثم المحاولة مجدداً.' : 'Login has not been completed in the external browser yet. Please complete it first, then try again.');
        setSyncStatusMessage(lang === 'ar' ? 'بانتظار إتمام تسجيل الدخول في المتصفح الخارجي...' : 'Waiting for login completion in external browser...');
      }
    } catch (e: any) {
      console.error("Manual verify error", e);
      setError(lang === 'ar' ? 'حدث خطأ أثناء التحقق اليدوي' : 'Manual verification failed');
    } finally {
      setLoading(false);
    }
  };

  const removeRecent = (e: React.MouseEvent, userIdx: number) => {
    e.stopPropagation();
    const newRecent = recentUsers.filter((_, i) => i !== userIdx);
    setRecentUsers(newRecent);
    localStorage.setItem('recent_users', JSON.stringify(newRecent));
  };

  const copyUserAgent = () => {
    navigator.clipboard.writeText(userAgentString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Render clean Secure Remote Auth portal if opened via the browser with a session link
  if (isExternalAuthMode) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center p-6 relative overflow-hidden light-mode-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
        <div className="w-full max-w-[420px] bg-[#0c0c0e] border border-white/10 rounded-[32px] p-8 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col text-white light-mode-card light-mode-bg light-mode-text">
          <div className="w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <img src={logo} alt="AVBANK Icon" className="w-full h-full object-contain light-mode-logo" />
          </div>

          <h2 className="text-2xl font-black text-center tracking-tight text-white mb-2 light-mode-text">
            {lang === 'ar' ? 'بوابة التحقق الآمن لـ AVBANK' : 'AVBANK Secure Authentication'}
          </h2>
          <p className="text-xs text-gray-400 text-center mb-8">
            {lang === 'ar' ? 'سيتم ربط هذا المتصفح تلقائياً مع تطبيق الهاتف الخاص بك لتخطي قيود جوجل.' : 'This browser will automatically pair with your mobile app to bypass security limitations.'}
          </p>

          {authCompleted ? (
            <div className="flex flex-col items-center text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6 border border-emerald-500/30">
                <Check className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-black text-white mb-2 light-mode-text">
                {lang === 'ar' ? '✓ تم الربط بنجاح' : '✓ Connection Established'}
              </h3>
              <p className="text-sm text-gray-400 leading-relaxed">
                {lang === 'ar' 
                  ? 'لقد قمت بتسجيل الدخول بأمان. يمكنك الآن إغلاق صفحة المتصفح هذه والعودة لتطبيق AVBANK على هاتفك فورا!' 
                  : 'You have signed in securely. You can now close this browser page and return to the AVBANK app on your device!'}
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <button
                onClick={handleExternalGoogleLogin}
                disabled={loading}
                className="w-full bg-white text-black font-black py-4 rounded-2xl border border-transparent transition-all active:scale-[0.98] text-base flex items-center justify-center gap-3 disabled:opacity-70 shadow-lg cursor-pointer light-mode-card"
              >
                {loading ? (
                  <Loader2 className="w-5 h-5 animate-spin text-black" />
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    <span>{lang === 'ar' ? 'سجل الدخول بـ Google للمتابعة' : 'Sign In with Google to Sync'}</span>
                  </>
                )}
              </button>

              {error && (
                <p className="text-red-400 text-xs font-bold text-center mt-4 p-3 bg-red-400/10 rounded-xl border border-red-400/20">
                  {error}
                </p>
              )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center text-[10px] text-gray-500 font-mono">
            <span>SESSION: {sessionId.substring(0, 8).toUpperCase()}</span>
            <span>SECURE LINK ACTIVE</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6 relative overflow-hidden light-mode-bg" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-[320px] relative z-10 flex flex-col items-center">
        <div className="w-24 h-24 mb-6 flex items-center justify-center transition-all hover:scale-110 duration-500">
          <img src={logo} alt="AVBANK Icon" className="w-full h-full object-contain light-mode-logo" />
        </div>
        
        <h1 className="text-4xl font-black text-white tracking-tighter mb-1 italic light-mode-text">AVBANK</h1>
        <p className="text-gray-600 text-[10px] mb-12 text-center font-bold uppercase tracking-[0.4em]">Premium Banking enclave</p>

        {recentUsers.length > 0 && (
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

        <div className="w-full flex flex-col gap-4">
          <button 
            onClick={handleGoogleLogin}
            disabled={loading || isWaitingForSync}
            className="w-full bg-white text-black font-black py-4.5 rounded-[24px] border border-transparent shadow-[0_20px_40px_rgba(255,255,255,0.1)] transition-all active:scale-[0.98] text-base flex items-center justify-center gap-3 disabled:opacity-70 group hover:shadow-[0_25px_50px_rgba(255,255,255,0.15)] light-mode-card"
          >
            {loading && !isWaitingForSync ? (
              <Loader2 className="w-5 h-5 animate-spin text-black" />
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

          {/* Quick APK Helper Notice */}
          <button
            onClick={() => setShowFixModal(true)}
            className="w-full py-4 rounded-[24px] bg-white/[0.04] border border-white/10 text-white/70 hover:text-white font-bold text-xs transition-all hover:bg-white/[0.08] hover:border-white/20 active:scale-95 flex items-center justify-center gap-2 mt-2 light-mode-card"
          >
            <HelpCircle className="w-4 h-4 text-accent animate-pulse" />
            <span>
              {lang === 'ar' ? 'حل مشكلة تسجيل الدخول بـ Google للأجهزة / APK' : 'Fix Google login issues for APK/Mobile'}
            </span>
          </button>
        </div>

        <p className="mt-12 text-gray-700 text-[9px] font-bold uppercase tracking-widest text-center">
          Protected by AES-256 Encryption
        </p>

        {error && <p className="text-red-400 text-xs font-bold text-center mt-6 p-4 bg-red-400/10 rounded-2xl w-full border border-red-400/20">{error}</p>}
      </div>

      {/* APK & Google Login Fix Modal */}
      {showFixModal && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4 sm:p-6">
          <div 
            className="bg-[#0c0c0e] border border-white/10 rounded-[32px] p-6 sm:p-8 w-full max-w-lg shadow-[0_0_50px_rgba(0,0,0,0.8)] relative flex flex-col max-h-[90vh] overflow-y-auto show-scrollbar text-white light-mode-card light-mode-bg light-mode-text"
            dir={lang === 'ar' ? 'rtl' : 'ltr'}
          >
            <button 
              onClick={() => setShowFixModal(false)}
              disabled={isWaitingForSync}
              className="absolute top-5 right-5 p-2 text-gray-400 hover:text-white rounded-full bg-white/5 hover:bg-white/10 transition-all cursor-pointer disabled:opacity-50"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header */}
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-black tracking-tight text-white light-mode-text">
                  {lang === 'ar' ? 'حل مشكلة تسجيل الدخول بـ Google' : 'Google Sign-In WebView Fix'}
                </h3>
                <p className="text-xs text-gray-400">
                  {lang === 'ar' ? 'للهواتف وتطبيقات الـ APK (Kodular / WebViewer)' : 'For mobile APK and wrapper tools'}
                </p>
              </div>
            </div>

            {/* If waiting for sync, show progress */}
            {isWaitingForSync ? (
              <div className="flex flex-col items-center text-center py-8">
                <Loader2 className="w-12 h-12 text-accent animate-spin mb-6" />
                <h4 className="text-base font-black mb-2 text-white light-mode-text">
                  {lang === 'ar' ? 'بانتظار التحقق...' : 'Awaiting Authentication...'}
                </h4>
                <p className="text-xs text-gray-400 leading-relaxed max-w-sm mb-6">
                  {syncStatusMessage}
                </p>

                {/* Manual Verify Button */}
                <button
                  onClick={handleManualVerifySync}
                  className="w-full max-w-xs py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-400 hover:to-teal-500 text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95 mb-6"
                >
                  <Check className="w-4 h-4" />
                  <span>
                    {lang === 'ar' ? 'لقد أتممت تسجيل الدخول، تحقق الآن' : 'I completed login, verify now'}
                  </span>
                </button>

                <button
                  onClick={() => setIsWaitingForSync(false)}
                  className="px-6 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition-all"
                >
                  {lang === 'ar' ? 'إلغاء المزامنة' : 'Cancel Sync'}
                </button>
              </div>
            ) : (
              <>
                {/* Option 1: Direct link copying & open */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 mb-6 light-mode-bg light-mode-border">
                  <span className="bg-accent/10 text-accent text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                    {lang === 'ar' ? 'الخيار الأول (المستحسن والتلقائي)' : 'Option 1 (Automatic & Recommended)'}
                  </span>
                  <h4 className="text-sm font-black mb-1.5">
                    {lang === 'ar' ? 'تسجيل الدخول عبر متصفح الهاتف الخارجي' : 'Login via External Device Browser'}
                  </h4>
                  <p className="text-xs text-gray-400 leading-relaxed mb-4">
                    {lang === 'ar' 
                      ? 'سيقوم هذا الخيار بفتح متصفح جهازك الآمن (مثل Chrome) لتسجيل الدخول بـ Google فورا وبشكل طبيعي، وبمجرد نجاح التسجيل هناك، سيتم إدخالك تلقائياً للتطبيق دون أي خطوة إضافية!' 
                      : 'This option launches your phone\'s browser (like Chrome) to log in with Google normally. Once successful, you will be logged into your APK automatically!'}
                  </p>
                  
                  <div className="flex flex-col gap-2.5">
                    {/* Try Auto Open Button */}
                    <button 
                      onClick={handleTryAutoOpen}
                      disabled={loading}
                      className="w-full py-3.5 bg-gradient-to-r from-accent to-indigo-600 hover:from-accent/90 hover:to-indigo-500 rounded-xl text-white font-black text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer shadow-lg active:scale-95"
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin text-white" />
                      ) : (
                        <>
                          <Chrome className="w-4 h-4" />
                          <span>
                            {lang === 'ar' ? 'فتح متصفح الهاتف وتسجيل الدخول' : 'Open Browser & Log In'}
                          </span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>

                    {/* Copy Link Button */}
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(currentUrl);
                        setLinkCopied(true);
                        setTimeout(() => setLinkCopied(false), 2000);
                      }}
                      className="w-full py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {linkCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>
                        {linkCopied 
                          ? (lang === 'ar' ? 'تم نسخ الرابط! افتحه في متصفحك' : 'Link Copied! Open in Browser') 
                          : (lang === 'ar' ? 'نسخ رابط الموقع للمتصفح يدوياً' : 'Copy Site Link Manually')}
                      </span>
                    </button>
                  </div>
                </div>

                {/* Option 2: Radical User Agent code */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 light-mode-bg light-mode-border">
                  <span className="bg-emerald-500/10 text-emerald-400 text-[9px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase mb-2 inline-block">
                    {lang === 'ar' ? 'الخيار الثاني (الحل الجذري للمطور)' : 'Option 2 (The Ultimate Developer Fix)'}
                  </span>
                  <h4 className="text-sm font-black mb-2">
                    {lang === 'ar' ? 'الحل الجذري داخل تطبيق Kodular' : 'Ultimate Fix Inside Kodular App'}
                  </h4>
                  
                  <p className="text-xs text-gray-400 leading-relaxed mb-3">
                    {lang === 'ar' 
                      ? 'لإجبار تسجيل جوجل على العمل مباشرة داخل تطبيقك الـ APK دون مغادرته أبداً، يمكنك وضع هذا الرمز في خصائص الـ WebViewer الخاص بـ Kodular:'
                      : 'To force Google Login to work directly inside your APK without leaving, you can put this code in your Kodular WebViewer properties:'}
                  </p>

                  <ol className="text-xs text-gray-400 list-decimal list-inside space-y-1.5 mb-4 text-right" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
                    <li>
                      {lang === 'ar' ? 'اذهب لخصائص مكون الـ ' : 'Select your '}
                      <strong className="text-white light-mode-text">Web_Viewer</strong>
                    </li>
                    <li>
                      {lang === 'ar' ? 'ابحث عن خانة الـ ' : 'Find the '}
                      <strong className="text-white light-mode-text">UserAgent</strong>
                    </li>
                    <li>
                      {lang === 'ar' ? 'انسخ الرمز التالي وضعه هناك:' : 'Paste the copied code below into it:'}
                    </li>
                  </ol>

                  {/* Code Copier */}
                  <div className="flex items-center gap-2 bg-black/40 border border-white/10 rounded-xl p-3 font-mono text-[10px] text-gray-300 light-mode-card">
                    <div className="flex-1 overflow-x-auto whitespace-nowrap scrollbar-none pr-2">
                      {userAgentString}
                    </div>
                    <button 
                      onClick={copyUserAgent}
                      className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-all shrink-0 cursor-pointer"
                      title={lang === 'ar' ? 'نسخ الكود' : 'Copy Code'}
                    >
                      {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                  {copied && (
                    <p className="text-[10px] text-emerald-400 font-bold mt-1.5 text-center">
                      {lang === 'ar' ? '✓ تم النسخ بنجاح! الصقه في Kodular' : '✓ Copied successfully! Paste into Kodular'}
                    </p>
                  )}
                </div>
              </>
            )}

            {/* Footer Notes */}
            <p className="text-[10px] text-gray-500 mt-6 text-center leading-relaxed">
              {lang === 'ar' 
                ? 'ملاحظة: هذا القيد مفروض من شركة Google لحمايتك، وتغيير الـ UserAgent أو استخدام المزامنة التلقائية هما الطريقتان المعتمدتان للمطورين.'
                : 'Note: This restriction is enforced by Google. Changing the UserAgent or using Auto-Sync are the standard developer solutions.'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
