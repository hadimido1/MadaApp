import { User, ViewState, AppNotification } from "../types";
import { VisaCard } from "./VisaCard";
import {
  Shield,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  Settings2,
  X,
  QrCode,
  Reply,
  Trash2,
  ShoppingBag,
  Sparkles,
  Lock,
} from "lucide-react";
import { getTranslation } from "../i18n";
import { useState, useEffect, useRef } from "react";
import { toPng } from "html-to-image";
import { doc, updateDoc, arrayUnion } from "firebase/firestore";
import { db } from "../firebase";
import logo from "../assets/images/regenerated_image_1781780076153.png";
import { motion, AnimatePresence } from "motion/react";

import { Scanner } from "@yudiel/react-qr-scanner";
import { QRCode } from "react-qrcode-logo";

function parseTargetId(input: string): string {
  let cleaned = input.trim();
  if (
    cleaned.startsWith("http://") ||
    cleaned.startsWith("https://") ||
    cleaned.includes("://") ||
    cleaned.includes("whish.money")
  ) {
    try {
      let urlString = cleaned;
      if (!urlString.includes("://")) {
        urlString = "https://" + urlString;
      }
      const url = new URL(urlString);
      const idParam =
        url.searchParams.get("id") ||
        url.searchParams.get("userId") ||
        url.searchParams.get("user");
      if (idParam) {
        return idParam.trim();
      }
      const segments = url.pathname.split("/").filter(Boolean);
      if (segments.length > 0) {
        return segments[segments.length - 1].trim();
      }
    } catch (e) {
      const parts = cleaned.split("/");
      const last = parts.filter(Boolean).pop();
      if (last) {
        return last.trim();
      }
    }
  }
  return cleaned;
}

export function Dashboard({
  user,
  onNavigate,
  onUserUpdate,
  theme,
}: {
  user: User;
  onNavigate: (v: ViewState) => void;
  onUserUpdate: (u: User) => void;
  theme: "dark" | "light" | "default";
}) {
  const lang = (localStorage.getItem("app_lang") as "ar" | "en") || "en";
  const t = getTranslation(lang);

  const isMobileAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  const isSmallScreen = window.screen.width < 1024;
  const isMobileDevice = isMobileAgent || isSmallScreen;

  const [activeModal, setActiveModal] = useState<
    "receive" | "transfer" | "notifications" | null
  >(null);
  const [showNotification, setShowNotification] = useState(false);

  // Audio utility with preloading
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement }>({});

  useEffect(() => {
    // Preload sounds
    audioRefs.current = {
      notification: document.createElement("audio"),
      transaction: document.createElement("audio"),
    };
    audioRefs.current.notification.src =
      "https://assets.mixkit.co/active_storage/sfx/2857/2857-preview.mp3";
    audioRefs.current.transaction.src =
      "https://assets.mixkit.co/active_storage/sfx/2358/2358-preview.mp3";
    Object.values(audioRefs.current).forEach((a) => {
      const audio = a as HTMLAudioElement;
      audio.load();
      audio.volume = 0.4;
    });
  }, []);

  const playSound = (type: "transaction" | "notification") => {
    const audio = audioRefs.current[type];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch((e) => console.log("Audio play blocked", e));
    }
  };

  useEffect(() => {
    const hasNewNotification = user.notifications?.some(
      (n) => !n.read && n.type === "transfer_received",
    );
    if (hasNewNotification) {
      setShowNotification(true);
      playSound("notification");
      const timer = setTimeout(() => {
        setShowNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [user.notifications]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [loading, setLoading] = useState(false);

  // Transfer state
  const [transferAmount, setTransferAmount] = useState("");
  const [recipientId, setRecipientId] = useState("");
  const [transferMessage, setTransferMessage] = useState("");
  const [transferError, setTransferError] = useState("");
  const [isScanning, setIsScanning] = useState(false);

  const unreadCount = (user.notifications || []).filter((n) => !n.read).length;

  useEffect(() => {
    if (activeModal === "notifications" && unreadCount > 0) {
      // Clear red dots after a small delay
      const timer = setTimeout(async () => {
        try {
          const { updateDoc, doc } = await import("firebase/firestore");
          const updatedNotifications =
            user.notifications?.map((n: any) => ({ ...n, read: true })) || [];
          await updateDoc(doc(db, "users", user.id), {
            notifications: updatedNotifications,
          });
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
      const { updateDoc, doc } = await import("firebase/firestore");
      const updatedNotifications =
        user.notifications?.filter((n: any) => n.id !== notifId) || [];
      await updateDoc(doc(db, "users", user.id), {
        notifications: updatedNotifications,
      });
      onUserUpdate({ ...user, notifications: updatedNotifications });
    } catch (e) {
      console.error(e);
    }
  };

  const handleReply = async (recipientName: string, message: string) => {
    setActiveModal(null);
    setRecipientId(recipientName);
    setTransferMessage(message);
    setActiveModal("transfer");
  };

  const qrRef = useRef<HTMLDivElement>(null);

  const downloadQrCode = async () => {
    if (qrRef.current === null) return;
    try {
      setLoading(true);
      const dataUrl = await toPng(qrRef.current, {
        cacheBust: true,
        pixelRatio: 3,
      });
      const link = document.createElement("a");
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
    const toast = document.createElement("div");
    toast.className =
      "fixed bottom-24 left-1/2 -translate-x-1/2 bg-white text-black px-6 py-3 rounded-full font-bold shadow-2xl z-50 animate-in fade-in slide-in-from-bottom-4 duration-300";
    toast.innerText = t.copied || "Copied!";
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.classList.add("animate-out", "fade-out", "slide-out-to-bottom-4");
      setTimeout(() => toast.remove(), 300);
    }, 2000);
  };

  const handleTransfer = async () => {
    if (
      !transferAmount ||
      isNaN(Number(transferAmount)) ||
      Number(transferAmount) <= 0 ||
      !recipientId
    )
      return;

    // Parse targetId safely to handle URLs, Whish Money links, etc.
    const targetId = parseTargetId(recipientId);

    const amountNum = Number(transferAmount);
    if (amountNum < 2) {
      setTransferError(
        lang === "ar"
          ? "الحد الأدنى للتحويل هو 2$"
          : "Minimum transfer amount is $2",
      );
      return;
    }

    const commission = amountNum * 0.02; // 2% Commission
    const totalDeduction = amountNum + commission;

    if (targetId === user.id) {
      setTransferError(
        "لا يمكنك تحويل الأموال لنفسك / Cannot transfer to yourself",
      );
      return;
    }

    if (totalDeduction > (user.balance || 0)) {
      setTransferError(
        `${t.insufficientFunds} (Total with 2% fee: $${totalDeduction.toFixed(2)})`,
      );
      return;
    }

    setIsProcessing(true);
    setTransferError("");
    try {
      const { getDoc, collection, query, where, getDocs, runTransaction } =
        await import("firebase/firestore");

      let finalTargetId = targetId;
      let recipientRef;
      let recipientEmail = "";

      if (finalTargetId.includes("@")) {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", finalTargetId));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          finalTargetId = querySnapshot.docs[0].id;
          recipientEmail = querySnapshot.docs[0].data().email;
          recipientRef = doc(db, "users", finalTargetId);
        } else {
          setTransferError(t.recipientNotFound);
          setIsProcessing(false);
          return;
        }
      } else {
        recipientRef = doc(db, "users", finalTargetId);
        const rDoc = await getDoc(recipientRef);
        if (rDoc.exists()) {
          const rData = rDoc.data() as any;
          recipientEmail = rData?.email || "";
        }
      }

      const recipientNotification: AppNotification = {
        id: Date.now().toString(),
        type: "transfer_received",
        amount: amountNum,
        senderId: user.name || user.email || user.id,
        message: transferMessage,
        timestamp: Date.now(),
        read: false,
      };

      const senderNotification: AppNotification = {
        id: (Date.now() + 1).toString(),
        type: "transfer_sent",
        amount: amountNum,
        senderId: targetId,
        message: transferMessage,
        timestamp: Date.now(),
        read: false,
      };

      await runTransaction(db, async (transaction) => {
        const senderDoc = await transaction.get(doc(db, "users", user.id));
        const recipientDoc = await transaction.get(recipientRef);

        const senderData = senderDoc.data() as any;
        const recipientExists = recipientDoc.exists();
        const recipientData = recipientExists
          ? (recipientDoc.data() as any)
          : {
              name: `User (${finalTargetId})`,
              email: "",
              balance: 0,
              role: "user",
              age: 20,
              country: "AVBANK Code",
              notifications: [],
            };

        if (!senderDoc.exists() || !senderData)
          throw new Error("Sender account not found.");

        const senderBal = senderData.balance || 0;
        if (senderBal < totalDeduction) throw new Error("Insufficient funds.");

        const recipientBal = recipientData.balance || 0;

        senderNotification.senderId =
          recipientData.name || recipientData.email || targetId;

        transaction.update(doc(db, "users", user.id), {
          balance: senderBal - totalDeduction,
          notifications: arrayUnion(senderNotification),
        });

        if (recipientExists) {
          transaction.update(recipientRef, {
            balance: recipientBal + amountNum,
            notifications: arrayUnion(recipientNotification),
          });
        } else {
          transaction.set(recipientRef, {
            ...recipientData,
            balance: recipientBal + amountNum,
            notifications: [recipientNotification],
          });
        }
      });

      // Success triggers
      playSound("transaction");

      // Async email trigger
      if (recipientEmail) {
        fetch("/api/send-receipt", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            recipientEmail: recipientEmail,
            senderName: user.name,
            amount: amountNum,
            commission: commission.toFixed(2),
            transactionId: Math.random()
              .toString(36)
              .substr(2, 9)
              .toUpperCase(),
          }),
        }).catch((err) => console.error("Email fail:", err));
      }

      onUserUpdate({
        ...user,
        balance: (user.balance || 0) - totalDeduction,
        notifications: [...(user.notifications || []), senderNotification],
      });

      setTransferAmount("");
      setRecipientId("");
      setTransferMessage("");
      setActiveModal(null);
    } catch (e: any) {
      console.error(e);
      setTransferError(e.message || "Error processing transfer");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col relative w-full overflow-y-auto overflow-x-hidden pt-safe">
      <div className="fixed inset-0 pointer-events-none opacity-20 z-0">
        <div className="absolute top-[-10%] right-[-20%] w-[60%] h-[50%] bg-accent/10 rounded-full blur-[140px]"></div>
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
              <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
              <div className="w-10 h-10 bg-accent rounded-full flex items-center justify-center shrink-0">
                <Bell className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col relative z-10">
                <p className="text-[10px] font-black uppercase tracking-tighter text-accent">
                  Secure Notification
                </p>
                <p className="text-sm font-bold truncate">
                  {(
                    user.notifications?.filter(
                      (n) => !n.read && n.type === "transfer_received",
                    )[0] as any
                  )?.senderId || "Private User"}{" "}
                  sent funds
                </p>
              </div>
              <div className="ml-auto w-1 h-8 bg-blue-200 rounded-full opacity-50"></div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative z-10 w-full max-w-lg md:max-w-6xl 2xl:max-w-[1800px] mx-auto px-5 pt-8 pb-40 md:pb-8 md:px-8 2xl:px-12 min-h-full flex flex-col">
        {/* Header Dashboard Profile/Notifications for screens < 1024px (Mobile/Tablet, both portrait and landscape) */}
        <div className="flex lg:hidden justify-between items-center w-full mb-6 px-1" dir="ltr">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 flex items-center justify-center transition-all hover:scale-110">
              <img
                src={logo}
                alt="AVBANK Logo"
                className="w-full h-full object-contain light-mode-logo"
              />
            </div>
            <div className="flex flex-col text-left">
              <h1 className="text-xl font-black text-white italic tracking-tighter leading-none light-mode-text">
                AVBANK
              </h1>
              <p className="text-[10px] text-accent font-black uppercase tracking-[0.15em] mt-1.5 opacity-80 leading-none">
                {lang === "ar" ? "أحدث العمليات" : "Recent Transactions"}
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveModal("notifications")}
            className={`relative p-2.5 bg-white/5 rounded-full border border-white/10 ${unreadCount > 0 ? "animate-bell-wiggle" : ""} light-mode-btn`}
          >
            <Bell className="w-5 h-5 text-white light-mode-text" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
            )}
          </button>
        </div>

        {/* Main Dashboard Layout: Top Section (Balance & Card), Bottom Section (Actions) */}
        <div className="dashboard-grid mt-2">
          {/* Balance Widget */}
          <div className="area-balance w-full bg-white/[0.03] border border-white/10 rounded-[32px] p-6 sm:p-8 shadow-2xl flex flex-col items-center justify-center relative overflow-hidden group light-mode-card h-full min-h-[160px] md:min-h-[220px]">
            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>

            <p className="text-gray-400 text-[10px] sm:text-xs font-black uppercase tracking-[0.3em] mb-2 sm:mb-4">
              {t.balance}
            </p>
            <div className="text-3xl sm:text-4xl md:text-5xl font-black text-white tracking-tighter flex items-baseline gap-1 sm:gap-2 font-mono light-mode-text drop-shadow-lg max-w-full px-2 break-all text-center">
              <span className="text-xl sm:text-2xl text-accent shrink-0">
                $
              </span>
              <span className="leading-none flex-1">
                {(user.balance || 0).toFixed(2)}
              </span>
            </div>

            {/* Subtle trend graph placeholder */}
            <div className="w-full mt-6 flex items-end justify-center gap-1.5 opacity-30 h-10">
              {[40, 60, 30, 80, 50, 90, 70, 85, 45, 65, 95, 55, 75].map(
                (h, i) => (
                  <div
                    key={i}
                    className="w-1.5 md:w-2 bg-accent rounded-t-sm transition-all duration-500 hover:h-full"
                    style={{ height: `${h}%` }}
                  />
                ),
              )}
            </div>

            <div className="absolute top-4 right-4 sm:top-6 sm:right-6 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
              <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-accent" />
            </div>
          </div>

          {/* Visa Card Display */}
          <div className="area-card flex flex-col items-center justify-center w-full bg-white/[0.01] md:bg-white/[0.02] md:backdrop-blur-xl md:border md:border-white/5 p-4 sm:p-6 rounded-[32px] light-mode-card h-full">
            <div className="w-full transition-transform origin-center flex flex-col items-center relative">
              <VisaCard user={user} theme={theme} />

              {/* Card Level Badge & Upgrade Link */}
              <div className="w-full max-w-[420px] flex justify-between items-center mt-6 px-2">
                <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                  <span>
                    {lang === "ar" ? "مستوى البطاقة:" : "Card Level:"}
                  </span>
                  <span className="bg-accent/10 border border-accent/25 text-accent px-3 py-1 rounded-full font-black text-[11px] shadow-sm">
                    LVL {user.cardLevel || 1}
                  </span>
                </div>

                <button
                  onClick={() => onNavigate("upgrade")}
                  className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-extrabold text-[11px] tracking-wider uppercase flex items-center gap-2 transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4 text-accent" />
                  <span>{lang === "ar" ? "ترقية" : "Upgrade"}</span>
                </button>
              </div>
            </div>
          </div>

          {/* Transactions Feed */}
          <div className="area-transactions w-full bg-white/[0.02] md:backdrop-blur-xl md:border md:border-white/5 p-6 rounded-[32px] light-mode-card shadow-lg h-full overflow-hidden flex flex-col">
            <div className="flex justify-between items-center mb-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-gray-500">
                {lang === "ar" ? "أحدث العمليات" : "Recent Transactions"}
              </p>

              <button
                onClick={() => setActiveModal("notifications")}
                className={`relative p-2.5 bg-white/5 rounded-full border border-white/10 ${isMobileDevice ? 'flex' : 'hidden landscape:flex md:flex'} ${unreadCount > 0 ? "animate-bell-wiggle" : ""} light-mode-btn`}
              >
                <Bell className="w-4 h-4 text-white light-mode-text" />
                {unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-black animate-pulse"></span>
                )}
              </button>
            </div>

            <div className="flex flex-col gap-3 flex-1 overflow-y-auto pr-1">
              {(!user.notifications || user.notifications.length === 0) ? (
                <div className="flex-1 flex flex-col items-center justify-center text-gray-500 text-xs gap-2">
                  <Shield className="w-8 h-8 opacity-20" />
                  {lang === 'ar' ? 'لا توجد عمليات سابقة' : 'No recent transactions'}
                </div>
              ) : (
                [...user.notifications]
                  .sort((a, b) => b.timestamp - a.timestamp)
                  .slice(0, 8)
                  .map((n, i) => {
                    const isReceived = n.type === 'transfer_received';
                    const isSystem = n.type === 'system';
                    const IconComp = isSystem ? Shield : isReceived ? ArrowDownRight : ArrowUpRight;
                    const amountColor = isSystem ? "text-accent" : isReceived ? "text-green-400" : "text-white";
                    const amountPrefix = isReceived ? "+" : isSystem ? "" : "-";
                    
                    let title = n.message || "Transfer";
                    if (!isSystem && n.senderId) {
                      title = isReceived ? `From: ${n.senderId.slice(0,8)}...` : `To: ${n.senderId.slice(0,8)}...`;
                    }
                    if (isSystem) title = "AVBANK System";

                    return (
                      <div
                        key={i}
                        className="flex items-center justify-between p-3.5 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/5 group-hover:scale-110 transition-transform shadow-inner">
                            <IconComp className="w-4 h-4 text-gray-300" />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-bold text-white tracking-tight line-clamp-1 max-w-[120px] md:max-w-[150px]">
                              {title}
                            </span>
                            <span className="text-[10px] text-gray-500 font-medium">
                              {new Date(n.timestamp).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                        {n.amount ? (
                          <span className={`text-sm font-black font-mono ${amountColor}`}>
                            {amountPrefix}${n.amount.toLocaleString()}
                          </span>
                        ) : null}
                      </div>
                    );
                  })
              )}
            </div>
          </div>

          {/* Quick Actions & Card Management */}
          <div className="area-actions w-full bg-white/[0.02] md:backdrop-blur-xl md:border md:border-white/5 p-6 md:p-8 rounded-[32px] light-mode-card shadow-lg h-full flex flex-col justify-center">
            <p className="text-xs font-black uppercase tracking-[0.2em] mb-6 text-gray-500 text-center md:text-left">
              {lang === "ar" ? "إدارة البطاقة" : "Card Management"}
            </p>
            <div className="grid grid-cols-2 gap-3 md:gap-4">
              {[
                {
                  icon: ArrowUpRight,
                  label: t.transfer,
                  action: () => setActiveModal("transfer"),
                },
                {
                  icon: ArrowDownRight,
                  label: t.receive,
                  action: () => setActiveModal("receive"),
                },
                {
                  icon: Lock,
                  label: lang === "ar" ? "قفل البطاقة" : "Lock Card",
                  action: () =>
                    alert(
                      lang === "ar"
                        ? "تم قفل البطاقة للأمان."
                        : "Card locked securely.",
                    ),
                },
                {
                  icon: ShoppingBag,
                  label: t.store,
                  action: () => onNavigate("store"),
                },
              ].map((btn, i) => (
                <button
                  key={i}
                  onClick={btn.action}
                  className="flex flex-col items-center justify-center gap-3 p-4 rounded-[20px] bg-white/5 border border-white/10 transition-all hover:bg-accent/20 hover:border-accent/30 hover:shadow-[0_0_20px_rgba(59,130,246,0.2)] active:scale-95 group light-mode-btn"
                >
                  <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform border border-white/5">
                    <btn.icon className="w-5 h-5 text-white light-mode-text" />
                  </div>
                  <span className="text-[10px] md:text-xs font-extrabold text-gray-400 group-hover:text-white transition-colors light-mode-text uppercase tracking-wider text-center">
                    {btn.label}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {activeModal === "transfer" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end px-4 pb-8 sm:justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          />
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-sm rounded-[32px] p-6 relative z-10 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 light-mode-bg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-black text-white light-mode-text">
                {t.transferMoney}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 bg-white/5 rounded-full text-white light-mode-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="flex flex-col gap-4">
              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">
                  {t.recipientAccount}
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={recipientId}
                    onChange={(e) => setRecipientId(e.target.value)}
                    className="flex-1 bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-white/30 light-mode-card light-mode-text"
                    placeholder="User ID / Email"
                  />
                  <button
                    onClick={() => setIsScanning(true)}
                    className="bg-white/10 p-4 rounded-2xl border border-white/10 active:scale-95 transition-transform light-mode-btn"
                  >
                    <QrCode className="w-5 h-5 text-white light-mode-text" />
                  </button>
                </div>
              </div>
              {isScanning && (
                <div className="w-full aspect-square rounded-2xl overflow-hidden bg-black relative">
                  <Scanner
                    onScan={(result) => {
                      if (result && result.length > 0) {
                        const cleanId = parseTargetId(result[0].rawValue);
                        setRecipientId(cleanId);
                        setIsScanning(false);
                      }
                    }}
                  />
                  <button
                    onClick={() => setIsScanning(false)}
                    className="absolute top-2 right-2 bg-black/50 p-2 rounded-full text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">
                  {t.messageOptional}
                </label>
                <input
                  type="text"
                  value={transferMessage}
                  onChange={(e) => setTransferMessage(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-sm focus:outline-none focus:border-white/30 light-mode-card light-mode-text mb-3"
                  placeholder={t.messageOptional}
                />
                <div className="flex gap-2 flex-wrap mb-2">
                  {t.quickMessages?.map((msg, idx) => (
                    <button
                      key={idx}
                      onClick={() => setTransferMessage(msg)}
                      className="bg-white/10 hover:bg-white/20 active:scale-95 transition-all text-white text-xs px-3 py-1.5 rounded-full border border-white/5 light-mode-btn"
                    >
                      {msg}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-gray-500 block mb-2">
                  {t.enterAmount} ($)
                </label>
                <input
                  type="number"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded-2xl px-5 py-4 text-white text-2xl font-mono text-center focus:outline-none focus:border-white/30 light-mode-card light-mode-text"
                  placeholder="0.00"
                />
                {transferError && (
                  <p className="text-red-400 text-xs font-bold mt-2 text-center">
                    {transferError}
                  </p>
                )}
              </div>
              <button
                onClick={handleTransfer}
                disabled={
                  isProcessing ||
                  !transferAmount ||
                  Number(transferAmount) <= 0 ||
                  !recipientId
                }
                className="w-full bg-accent text-white rounded-2xl py-4 font-bold disabled:opacity-50 mt-2"
              >
                {isProcessing ? t.processing : t.confirmAdd}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Receive Money Modal */}
      {activeModal === "receive" && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-end px-4 pb-8 sm:justify-center">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setActiveModal(null)}
          />
          <div className="bg-[#1a1a1a] border border-white/10 w-full max-w-sm rounded-[32px] p-6 relative z-10 flex flex-col gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300 light-mode-bg shadow-2xl items-center max-h-[90vh] overflow-y-auto">
            <div className="w-full flex justify-between items-center mb-2">
              <h2 className="text-xl font-black text-white light-mode-text">
                {t.receiveMoney}
              </h2>
              <button
                onClick={() => setActiveModal(null)}
                className="p-2 bg-white/5 rounded-full text-white light-mode-text"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-white p-5 rounded-[40px] mb-2 shadow-[0_0_50px_rgba(255,255,255,0.1)]">
              <QRCode
                value={user.id}
                size={180}
                qrStyle="dots"
                eyeRadius={10}
                fgColor={theme === "light" ? "#000000" : "#000000"}
              />
            </div>

            <div className="w-full flex flex-col gap-3 bg-white/5 p-5 rounded-2xl border border-white/5 text-center">
              <span className="text-xs font-bold text-gray-400">
                {t.yourAccountDetails}
              </span>
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {t.accountName}
                </span>
                <span className="text-sm font-bold text-white light-mode-text">
                  {user.name}
                </span>
              </div>
              <div className="flex flex-col gap-1 mt-2">
                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                  {t.accountNumber}
                </span>
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
                className="w-full bg-accent text-white rounded-2xl py-4 font-black shadow-lg shadow-accent/20 active:scale-95 transition-all text-sm flex items-center justify-center gap-2"
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
              <div
                ref={qrRef}
                className="w-[400px] h-[600px] bg-black p-10 flex flex-col items-center justify-between relative overflow-hidden"
              >
                <div className="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-accent/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-10%] w-[60%] h-[40%] bg-emerald-600/5 rounded-full blur-[100px]"></div>

                <div className="flex flex-col items-center z-10">
                  <div className="w-16 h-16 mb-4">
                    <img src={logo} className="w-full h-full object-contain" />
                  </div>
                  <h1 className="text-3xl font-black text-white italic tracking-tighter">
                    AVBANK
                  </h1>
                  <p className="text-[8px] text-gray-500 font-bold uppercase tracking-[0.4em] mt-1">
                    Premium Banking Enclave
                  </p>
                </div>

                <div className="bg-white p-8 rounded-[60px] shadow-2xl z-10">
                  <QRCode
                    value={user.id}
                    size={240}
                    qrStyle="dots"
                    eyeRadius={15}
                    fgColor={theme === "light" ? "#000000" : "#000000"}
                  />
                </div>

                <div className="w-full bg-white/5 p-8 rounded-[40px] border border-white/10 z-10 flex flex-col items-center text-center">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                    Account Holder
                  </p>
                  <p className="text-xl font-black text-white mb-4">
                    {user.name}
                  </p>

                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">
                    Account ID
                  </p>
                  <p className="text-sm font-bold text-accent font-mono tracking-widest break-all px-4">
                    {user.id}
                  </p>
                </div>

                <div className="absolute bottom-4 left-0 right-0 text-center opacity-10">
                  <p className="text-[8px] font-black text-white uppercase tracking-[1em]">
                    SECURE TRANSACTION ENCLAVE
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notifications Modal */}
      {activeModal === "notifications" && (
        <div className="fixed inset-0 z-50 flex flex-col pt-safe bg-black light-mode-bg animate-in slide-in-from-bottom-full duration-300">
          <div className="flex justify-between items-center px-6 py-6 border-b border-white/10 z-20 relative light-mode-card">
            <h2 className="text-xl font-black text-white light-mode-text">
              {t.notifications}
            </h2>
            <button
              onClick={() => setActiveModal(null)}
              className="p-2 bg-white/5 rounded-full text-white light-mode-btn"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {user.notifications?.some(
            (n) => !n.read && n.type === "transfer_received",
          ) && (
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-0 flex justify-center">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute text-green-500/30 font-bold opacity-0 animate-float-up"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animationDelay: `${Math.random() * 2}s`,
                    fontSize: `${Math.random() * 15 + 10}px`,
                  }}
                >
                  $
                </div>
              ))}
            </div>
          )}

          <div className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3 z-10">
            {!user.notifications || user.notifications.length === 0 ? (
              <div className="flex-1 flex items-center justify-center text-gray-500 font-bold">
                {t.noNotifications}
              </div>
            ) : (
              [...user.notifications].reverse().map((n) => (
                <div
                  key={n.id}
                  className={`p-4 rounded-2xl border transition-all relative group ${n.read ? "bg-white/5 border-white/5 opacity-80" : "bg-red-500/10 border-red-500/20 shadow-[0_0_20px_rgba(239,68,68,0.05)]"}`}
                >
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
                      {n.type === "transfer_received"
                        ? lang === "ar"
                          ? `تحويل من ${n.senderId}`
                          : `Transfer from ${n.senderId}`
                        : n.type === "transfer_sent"
                          ? lang === "ar"
                            ? `تحويل إلى ${n.senderId}`
                            : `Transfer to ${n.senderId}`
                          : t.depositTitle}
                    </span>
                    <span
                      className={`font-mono font-bold text-lg ${n.type === "transfer_received" ? "text-green-400" : "text-red-400"}`}
                    >
                      {n.type === "transfer_received" ? "+" : "-"}$
                      {n.amount?.toFixed(2)}
                    </span>
                  </div>

                  <div className="text-xs text-gray-400 flex flex-col gap-2">
                    {n.message && (
                      <div className="p-3 bg-black/40 rounded-xl italic border border-white/5 light-mode-bg light-mode-text">
                        "{n.message}"
                      </div>
                    )}

                    {n.type === "transfer_received" && (
                      <div className="flex flex-wrap gap-2 pt-1">
                        <button
                          onClick={() => handleReply(n.senderId, t.thankYou)}
                          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-accent/20 border border-white/10 text-[10px] font-bold text-white transition-all active:scale-95"
                        >
                          {t.thankYou}
                        </button>
                        <button
                          onClick={() => handleReply(n.senderId, t.received)}
                          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-accent/20 border border-white/10 text-[10px] font-bold text-white transition-all active:scale-95"
                        >
                          {t.received}
                        </button>
                        <button
                          onClick={() => handleReply(n.senderId, "")}
                          className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-accent/20 border border-white/10 text-[10px] font-bold text-white transition-all active:scale-95 flex items-center gap-1"
                        >
                          <Reply className="w-3 h-3" />
                          {t.reply}
                        </button>
                      </div>
                    )}

                    <div className="flex justify-end mt-1">
                      <span className="text-[9px] text-gray-500 font-bold">
                        {new Date(n.timestamp).toLocaleString()}
                      </span>
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
                  const updated = (user.notifications || []).map((n) => ({
                    ...n,
                    read: true,
                  }));
                  await updateDoc(doc(db, "users", user.id), {
                    notifications: updated,
                  });
                  onUserUpdate({ ...user, notifications: updated });
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
