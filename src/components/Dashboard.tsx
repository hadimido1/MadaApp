import { User, ViewState, AppNotification } from '../types';
import { VisaCard } from './VisaCard';
import { Shield, Bell, Settings as SettingsIcon, LogOut, ArrowUpRight, ArrowDownRight, CreditCard, Settings2, X, QrCode, Reply, Trash2 } from 'lucide-react';
import { getTranslation } from '../i18n';
import { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import { doc, updateDoc, arrayUnion } from 'firebase/firestore';
import { db } from '../firebase';
import logo from '../assets/images/regenerated_image_1781780076153.png';
import { motion, AnimatePresence } from 'motion/react';

import { Scanner } from '@yudiel/react-qr-scanner';
import { QRCode } from 'react-qrcode-logo';

export function Dashboard({ user, onNavigate, onUserUpdate }: { user: User, onNavigate: (v: ViewState) => void, onUserUpdate: (u: User) => void }) {
  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);

  const [activeModal, setActiveModal] = useState<'receive' | 'transfer' | 'notifications' | null>(null);
  const [showNotification, setShowNotification] = useState(false);

  // Audio utility
  const playSound = (type: 'transaction' | 'notification') => {
    const urls = {
      notification: 'https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3',
      transaction: 'https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3'
    };
    const audio = new Audio(urls[type]);
    audio.volume = 0.4;
    audio.play().catch(e => console.log("Audio play blocked", e));
  };

  useEffect(() => {
    const hasNewNotification = user.notifications?.some(n => !n.read && n.type === 'transfer_received');
    if (hasNewNotification) {
      setShowNotification(true);
      playSound('notification');
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user.notifications]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Transfer state
  const [transferAmount, setTransferAmount] = useState('');
  const [recipientId, setRecipientId] = useState('');
  const [transferMessage, setTransferMessage] = useState('');
  const [transferError, setTransferError] = useState('');
  const [isScanning, setIsScanning] = useState(false);

  const unreadCount = (user.notifications || []).filter(n => !n.read).length;

  useEffect(() => {
    if (activeModal === 'notifications' && unreadCount > 0) {
      // Clear red dots after a small delay
      const timer = setTimeout(async () => {
        try {
          const { updateDoc, doc } = await import('firebase/firestore');
          const updatedNotifications = user.notifications?.map((n: any) => ({ ...n, read: true })) || [];
          await updateDoc(doc(db, 'users', user.id), { notifications: updatedNotifications });
          onUserUpdate({ ...user, notifications: updatedNotifications });
        } catch (e) {
          console.error(e);
        }
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [activeModal, unreadCount]);

  const removeNotification = async (notifId: string) => {
    try {
      const { updateDoc, doc } = await import('firebase/firestore');
      const updatedNotifications = user.notifications?.filter((n: any) => n.id !== notifId) || [];
      await updateDoc(doc(db, 'users', user.id), { notifications: updatedNotifications });
      onUserUpdate({ ...user, notifications: updatedNotifications });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async (recipientName: string, message: string) => {
     setActiveModal(null);
     setRecipientId(recipientName);
     setTransferMessage(message);
     setActiveModal('transfer');
  };

  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQrCode = async () => {
    if (qrRef.current === null) return;
    try {
      setLoading(true);
      const dataUrl = await toPng(qrRef.current, { cacheBust: true, pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = `mada-user-qr-${user.id.slice(0, 8)}.png`;
      link.href = dataUrl;
      link.click();
      setLoading(false);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300';
    toast.innerText = t.copied || 'Copied!';
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('animate-out', 'fade-out', 'slide-out-to-bottom-4');
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };


  const handleTransfer = async () => {
    if (!transferAmount || isNaN(Number(transferAmount)) || Number(transferAmount) <= 0 || !recipientId) return;
    
    const amountNum = Number(transferAmount);
    const commission = amountNum * 0.02; // 2% Commission
    const totalDeduction = amountNum + commission;

    if (recipientId === user.id) {
       setTransferError('لا يمكنك تحويل الأموال لنفسك / Cannot transfer to yourself');
       return;
    }

    if (totalDeduction > (user.balance || 0)) {
       setTransferError(`${t.insufficientFunds} (Total with 2% fee: $${totalDeduction.toFixed(2)})`);
       return;
    }
    
    setIsProcessing(true);
    setTransferError('');
    try {
      const { getDoc, collection, query, where, getDocs, runTransaction } = await import('firebase/firestore');
      
      let targetId = recipientId.trim();
      let recipientRef;
      let recipientEmail = "";

      if (targetId.includes('@')) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('email', '==', targetId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          targetId = querySnapshot.docs[0].id;
          recipientEmail = querySnapshot.docs[0].data().email;
          recipientRef = doc(db, 'users', targetId);
        } else {
          setTransferError(t.recipientNotFound);
          setIsProcessing(false);
          return;
        }
      } else {
        recipientRef = doc(db, 'users', targetId);
        const rDoc = await getDoc(recipientRef);
        if (rDoc.exists()) {
          const rData = rDoc.data() as any;
          recipientEmail = rData?.email || "";
        }
      }
      
      const recipientNotification: AppNotification = {
        id: Date.now().toString(),
        type: 'transfer_received',
        amount: amountNum,
        senderId: user.name || user.email || user.id,
        message: transferMessage,
        timestamp: Date.now(),
        read: false
      };

      const senderNotification: AppNotification = {
        id: (Date.now() + 1).toString(),
        type: 'transfer_sent',
        amount: amountNum,
        senderId: targetId,
        message: transferMessage,
        timestamp: Date.now(),
        read: false
      };

      await runTransaction(db, async (transaction) => {
        const senderDoc = await transaction.get(doc(db, 'users', user.id));
        const recipientDoc = await transaction.get(recipientRef);

        const senderData = senderDoc.data() as any;
        const recipientData = recipientDoc.data() as any;

        if (!senderDoc.exists() || !senderData) throw new Error("Sender account not found.");
        if (!recipientDoc.exists() || !recipientData) throw new Error("Recipient account not found.");

        const senderBal = senderData.balance || 0;
        if (senderBal < totalDeduction) throw new Error("Insufficient funds.");

        const recipientBal = recipientData.balance || 0;
        
        senderNotification.senderId = recipientData.name || recipientData.email || targetId;

        transaction.update(doc(db, 'users', user.id), { 
           balance: senderBal - totalDeduction,
           notifications: arrayUnion(senderNotification)
        });

        transaction.update(recipientRef, { 
           balance: recipientBal + amountNum,
           notifications: arrayUnion(recipientNotification)
        });
      });
      
      // Success triggers
      playSound('transaction');

      // Async email trigger
      if (recipientEmail) {
        fetch('/api/send-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            recipientEmail: recipientEmail,
            senderName: user.name,
            amount: amountNum,
            commission: commission.toFixed(2),
            transactionId: Math.random().toString(36).substr(2, 9).toUpperCase()
          })
        }).catch(err => console.error("Email fail:", err));
      }

      onUserUpdate({ 
         ...user, 
         balance: (user.balance || 0) - totalDeduction,
         notifications: [...(user.notifications || []), senderNotification]
      });
      
      setTransferAmount('');
      setRecipientId('');
      setTransferMessage('');
      setActiveModal(null);
    } catch (e: any) {
      console.error(e);
      setTransferError(e.message || 'Error processing transfer');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full overflow-y-auto overflow-x-hidden pt-safe">
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] right-[-20%] w-[60%] h-[50%] bg-blue-600/10 rounded-full blur-[140px]"></div>
      </div>

      {/* Email-style notification alert */}
      <AnimatePresence>
        {showNotification && (
          <motion.div 
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 20, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            onDragEnd={(_, info) => {
              if (Math.abs(info.offset.x) > 100) {
                setShowNotification(false);
              }
            }}
            className="fixed top-0 left-4 right-4 z-[110] flex justify-center cursor-grab active:cursor-grabbing"
          >
            <div className="bg-white text-black p-4 rounded-2xl shadow-2xl flex items-center gap-4 border border-black/5 max-w-sm w-full mx-auto relative overflow-hidden group">
              <div className="absolute inset-0 bg-blue-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col relative z-10">
                <p className="text-[10px] font-black uppercase tracking-tighter text-blue-600">Secure Notification</p>
                <p className="text-sm font-bold truncate">{(user.notifications?.filter(n => !n.read && n.type === 'transfer_received')[0] as any)?.senderId || 'Private User'} sent funds</p>
              </div>
              <div className="ml-auto w-1 h-8 bg-blue-200 rounded-full opacity-50"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-lg mx-auto px-5 pt-8 pb-40 flex flex-col items-center">
        {/* Header Dashboard Profile/Notifications */}
        <div className="flex justify-between items-center w-full mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 flex items-center justify-center transition-all hover:scale-110">
              <img src={logo} alt="Mada Logo" className="w-full h-full object-contain" />
            </div>
            <div className="flex flex-col">
               <h1 className="text-2xl font-black text-white italic tracking-tighter leading-none">Mada</h1>
               <p className="text-[9px] text-blue-400 font-bold uppercase tracking-[0.3em] mt-1 opacity-60 leading-none">Status: Secure</p>
            </div>
          </div>
          
          <button onClick={() => setActiveModal('notifications')} className={`relative p-2.5 bg-white/5 rounded-full border border-white/10 ${unreadCount > 0 ? 'animate-bell-wiggle' : ''}`}>
             <Bell className="w-5 h-5 text-white" />
             {unreadCount > 0 && <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>}
          </button>
        </div>

        {/* Balance Section - Integrated & Slimmer */}
        <div className="w-full bg-white/[0.03] border border-white/10 rounded-[28px] p-6 shadow-xl mb-8 flex items-center justify-between relative overflow-hidden group">
          <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
          <div className="flex flex-col relative z-10">
            <p className="text-gray-500 text-[10px] font-black uppercase tracking-[0.2em] mb-1">{t.balance}</p>
            <div className="text-3xl font-black text-white tracking-tighter flex items-baseline gap-1 font-mono">
               <span className="text-sm text-blue-400">$</span>
               {(user.balance || 0).toFixed(2)}
            </div>
          </div>
          <div className="flex items-center gap-2 relative z-10">
            <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center">
              <Shield className="w-4 h-4 text-blue-400" />
            </div>
          </div>
        </div>

        {/* 3D Visa Card Component */}
        <div className="w-full scale-95 sm:scale-100 transition-transform">
           <VisaCard user={user} />
        </div>
        
        {/* Quick Actions - Clean Grid */}
        <div className="w-full mt-10 mb-6 px-2">
          <div className="grid grid-cols-4 gap-4">
            {[
              { icon: ArrowUpRight, label: t.transfer, action: () => setActiveModal('transfer') },
              { icon: ArrowDownRight, label: t.receive, action: () => setActiveModal('receive') },
              { icon: QrCode, label: "Scan", action: () => { setActiveModal('transfer'); setIsScanning(true); } },
              { icon: Settings2, label: t.settings, action: () => onNavigate('settings') },
            ].map((btn, i) => (
               <button key={i} onClick={btn.action} className="flex flex-col items-center gap-2 group">
                 <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-all group-hover:bg-blue-600/20 group-hover:border-blue-500/30 group-active:scale-90">
                   <btn.icon className="w-5 h-5 text-white" />
                 </div>
                 <span className="text-[10px] font-bold text-gray-400 group-hover:text-white transition-colors">{btn.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {activeModal === 'transfer' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end px-4 pb-8 sm:justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-sm rounded-[32px] p-6 relative z-10 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 light-mode-bg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-white light-mode-text">{t.transferMoney}</h2>
              <button onClick={() => setActiveModal(null)} className="p-2 bg-white/5 rounded-full text-white light-mode-text">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">{t.recipientAccount}</label>
                <div className="flex items-center gap-2">
                  <input 
                    type="text" 
                    value={recipientId} 
                    onChange={e => setRecipientId(e.target.value)} 
                    className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-white/30 light-mode-card light-mode-text" 
                    placeholder="User ID / Email" 
                  />
                  <button onClick={() => setIsScanning(true)} className="bg-white/10 p-4 rounded-2xl border border-white/10 active:scale-95 transition-transform light-mode-btn">
                    <QrCode className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
              {isScanning && (
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black relative">
                  <Scanner 
                     onScan={(result) => {
                       if (result && result.length > 0) {
                         setRecipientId(result[0].rawValue);
                         setIsScanning(false);
                       }
                     }} 
                  />
                  <button onClick={() => setIsScanning(false)} className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}
              
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">{t.messageOptional}</label>
                <input 
                  type="text" 
                  value={transferMessage} 
                  onChange={e => setTransferMessage(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-white/30 light-mode-card light-mode-text mb-3" 
                  placeholder={t.messageOptional} 
                />
                <div className="flex gap-2 flex-wrap mb-2">
                  {t.quickMessages?.map((msg, idx) => (
                    <button key={idx} onClick={() => setTransferMessage(msg)} className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-xs px-3 py-1.5 rounded-full border border-white/5 light-mode-btn">
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">{t.enterAmount} ($)</label>
                <input 
                  type="number" 
                  value={transferAmount} 
                  onChange={e => setTransferAmount(e.target.value)} 
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-2xl font-mono text-center focus:outline-none focus:border-white/30 light-mode-card light-mode-text" 
                  placeholder="0.00" 
                />
                {transferError && <p className="text-red-400 text-xs font-bold mt-2 text-center">{transferError}</p>}
              </div>
              <button 
                onClick={handleTransfer} 
                disabled={isProcessing || !transferAmount || Number(transferAmount) <= 0 || !recipientId}
                className="w-full bg-blue-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 mt-2"
              >
                {isProcessing ? t.processing : t.confirmAdd}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Money Modal */}
      {activeModal === 'receive' && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end px-4 pb-8 sm:justify-center">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setActiveModal(null)} />
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-sm rounded-[32px] p-6 relative z-10 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 light-mode-bg shadow-2xl items-center max-h-[90vh] overflow-y-auto">
            <div className="w-full flex justify-between items-center mb-2">
               <h2 className="text-xl font-black text-white light-mode-text">{t.receiveMoney}</h2>
               <button onClick={() => setActiveModal(null)} className="p-2 bg-white/5 rounded-full text-white light-mode-text">
                 <X className="w-5 h-5" />
               </button>
            </div>

            <div className="bg-white p-5 rounded-[40px] mb-2 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <QRCode value={user.id} size={180} qrStyle="dots" eyeRadius={10} fgColor="#000000" />
            </div>

            <div className="w-full flex flex-col gap-3 bg-white/5 p-5 rounded-2xl border border-white/5 text-center">
               <span className="text-xs font-bold text-gray-400">{t.yourAccountDetails}</span>
               <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">{t.accountName}</span>
                  <span className="text-sm font-bold text-white light-mode-text">{user.name}</span>
               </div>
               <div className="flex flex-col gap-1 mt-2">
                  <span className="text-[10px] text-gray-500 uppercase tracking-widest">{t.accountNumber}</span>
                  <span 
                    onClick={() => copyToClipboard(user.id)}
                    className="text-xs font-bold text-white font-mono tracking-widest break-all px-2 cursor-pointer hover:opacity-80 active:opacity-60 transition-opacity light-mode-text"
                  >
                    {user.id}
                  </span>
               </div>
            </div>

            <div className="flex flex-col gap-3 w-full">
               <button 
                 onClick={downloadQrCode}
                 disabled={loading}
                 className="w-full bg-blue-600 text-white rounded-2xl py-4 font-black shadow-lg shadow-blue-600/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
               >
                 {loading ? t.processing : t.downloadQr}
               </button>
               <button 
                 onClick={() => setActiveModal(null)} 
                 className="w-full bg-white/5 text-gray-400 rounded-2xl py-4 font-bold active:scale-95 transition-all text-sm border border-white/5"
               >
                 {t.close}
               </button>
            </div>

            {/* Hidden QR for Download */}
            <div className="fixed top-[-9999px] left-[-9999px]">
               <div ref={qrRef} className="w-[400px] h-[600px] bg-black p-10 flex flex-col items-center justify-between relative overflow-hidden">
                  <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-600/10 rounded-full blur-[100px]"></div>
                  <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-emerald-600/5 rounded-full blur-[100px]"></div>
                  
                  <div className="flex flex-col items-center z-10">
                     <div className="w-16 h-16 mb-4">
                        <img src={logo} className="w-full h-full object-contain" />
                     </div>
                     <h1 className="text-3xl font-black text-white italic tracking-tighter">Mada</h1>
                     <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1">Premium Financial Enclave</p>
                  </div>

                  <div className="bg-white p-8 rounded-[60px] shadow-2xl z-10">
                     <QRCode value={user.id} size={240} qrStyle="dots" eyeRadius={15} fgColor="#000000" />
                  </div>

                  <div className="w-full bg-white/5 p-8 rounded-[40px] border border-white/10 z-10 flex flex-col items-center text-center">
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Account Holder</p>
                     <p className="text-xl font-black text-white mb-4">{user.name}</p>
                     
                     <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Account ID</p>
                     <p className="text-sm font-bold text-blue-400 font-mono tracking-widest break-all px-4">{user.id}</p>
                  </div>

                  <div className="absolute bottom-4 left-0 right-0 text-center opacity-10">
                     <p className="text-[8px] font-black text-white uppercase tracking-[1em]">SECURE TRANSACTION ENCLAVE</p>
                  </div>
               </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {activeModal === 'notifications' && (
        <div className="fixed inset-0 z-50 flex flex-col pt-safe bg-black light-mode-bg animate-in slide-in-from-bottom-full duration-300">
          <div className="flex justify-between items-center px-6 py-6 border-b border-white/10 z-20 relative light-mode-card">
             <h2 className="text-xl font-black text-white light-mode-text">{t.notifications}</h2>
             <button onClick={() => setActiveModal(null)} className="p-2 bg-white/5 rounded-full text-white light-mode-btn">
               <X className="w-5 h-5" />
             </button>
          </div>
          
          {user.notifications?.some(n => !n.read && n.type === 'transfer_received') && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex justify-center">
              {Array.from({length: 15}).map((_, i) => (
                <div key={i} className="absolute text-green-500/60 font-bold text-2xl opacity-0 animate-float-up" style={{ left: `${Math.random() * 100}%`, animationDelay: `${Math.random() * 2}s`, fontSize: `${Math.random() * 20 + 10}px` }}>
                  $
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 z-10">
            {(!user.notifications || user.notifications.length === 0) ? (
               <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">{t.noNotifications}</div>
            ) : (
               [...(user.notifications)].reverse().map(n => (
                 <div key={n.id} className={`p-4 rounded-2xl border transition-all relative group ${n.read ? 'bg-white/5 border-white/5 opacity-80' : 'bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]'}`}>
                   {!n.read && (
                     <div className="absolute top-4 right-4 w-2 h-2 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
                   )}
                   
                   <button 
                     onClick={() => removeNotification(n.id)}
                     className="absolute top-4 left-4 p-2 text-gray-500 hover:text-red-400 transition-all rounded-full hover:bg-white/5 z-20"
                   >
                     <Trash2 className="w-4 h-4" />
                   </button>

                   <div className="flex justify-between items-start mb-2 pl-12 pr-6">
                     <span className="font-bold text-sm text-white light-mode-text">
                       {n.type === 'transfer_received' ? (lang === 'ar' ? `تحويل من ${n.senderId}` : `Transfer from ${n.senderId}`) : 
                        n.type === 'transfer_sent' ? (lang === 'ar' ? `تحويل إلى ${n.senderId}` : `Transfer to ${n.senderId}`) : 
                        t.depositTitle}
                     </span>
                     <span className={`font-mono font-bold text-lg ${n.type === 'transfer_received' ? 'text-green-400' : 'text-red-400'}`}>
                       {n.type === 'transfer_received' ? '+' : '-'}${n.amount?.toFixed(2)}
                     </span>
                   </div>
                   
                   <div className="text-xs text-gray-400 flex flex-col gap-2">
                      {n.message && (
                        <div className="p-3 bg-black/40 rounded-xl italic border border-white/5 light-mode-bg light-mode-text">
                          "{n.message}"
                        </div>
                      )}
                      
                      {n.type === 'transfer_received' && (
                        <div className="flex flex-wrap gap-2 pt-1">
                          <button 
                            onClick={() => handleReply(n.senderId, t.thankYou)}
                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-blue-600/20 border border-white/10 text-[10px] font-bold text-white transition-all active:scale-95"
                          >
                            {t.thankYou}
                          </button>
                          <button 
                            onClick={() => handleReply(n.senderId, t.received)}
                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-blue-600/20 border border-white/10 text-[10px] font-bold text-white transition-all active:scale-95"
                          >
                            {t.received}
                          </button>
                          <button 
                            onClick={() => handleReply(n.senderId, '')}
                            className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-blue-600/20 border border-white/10 text-[10px] font-bold text-white transition-all active:scale-95 flex items-center gap-1"
                          >
                            <Reply className="w-3 h-3" />
                            {t.reply}
                          </button>
                        </div>
                      )}
                      
                      <div className="flex justify-end mt-1">
                        <span className="text-[9px] text-gray-500 font-bold">{new Date(n.timestamp).toLocaleString()}</span>
                      </div>
                   </div>
                 </div>
               ))
            )}
          </div>
          {unreadCount > 0 && (
            <div className="p-6 pb-8 z-10 bg-black/80 backdrop-blur-xl border-t border-white/5 light-mode-bg">
              <button 
                onClick={async () => {
                   const updated = (user.notifications || []).map(n => ({...n, read: true}));
                   await updateDoc(doc(db, 'users', user.id), { notifications: updated });
                   onUserUpdate({...user, notifications: updated});
                }}
                className="w-full bg-white/10 text-white rounded-2xl py-4 font-bold active:scale-95 transition-transform light-mode-btn"
              >
                {t.markAllRead}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
