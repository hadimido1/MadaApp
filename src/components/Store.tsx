import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ShoppingBag, ChevronLeft, Search, Tag, Wallet, CheckCircle2, Copy, ExternalLink, Ticket } from 'lucide-react';
import { User, StoreProduct, StorePackage, ViewState } from '../types';
import { STORE_PRODUCTS } from '../data/store';
import { getTranslation } from '../i18n';
import { doc, updateDoc, increment } from 'firebase/firestore';
import { db } from '../firebase';

interface StoreProps {
  user: User;
  onNavigate: (v: ViewState) => void;
  onUserUpdate: (u: User) => void;
  theme: 'dark' | 'light';
}

export function Store({ user, onNavigate, onUserUpdate, theme }: StoreProps) {
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'giftcard' | 'game_topup'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<StoreProduct | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<StorePackage | null>(null);
  const [purchaseStep, setPurchaseStep] = useState<'details' | 'confirm' | 'success'>('details');
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [fakeKey, setFakeKey] = useState('');
  const [copied, setCopied] = useState(false);

  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'ar';
  const t = getTranslation(lang);

  const filteredProducts = STORE_PRODUCTS.filter(p => {
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const generateFakeKey = (brand: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    const numChars = '0123456789';
    const pickRandom = (src: string, len: number) => {
      let r = '';
      for (let i = 0; i < len; i++) {
        r += src.charAt(Math.floor(Math.random() * src.length));
      }
      return r;
    };

    switch (brand) {
      case 'google_play':
        // ABCD 1234 EFGH 5678 IJKL
        return `${pickRandom(chars, 4)} ${pickRandom(chars, 4)} ${pickRandom(chars, 4)} ${pickRandom(chars, 4)} ${pickRandom(chars, 4)}`;
      case 'playstation':
        // 46G7-M9LK-P2WQ
        return `${pickRandom(chars, 4)}-${pickRandom(chars, 4)}-${pickRandom(chars, 4)}`;
      case 'steam':
        // XXXXX-XXXXX-XXXXX
        return `${pickRandom(chars, 5)}-${pickRandom(chars, 5)}-${pickRandom(chars, 5)}`;
      case 'xbox':
        // XXXXX-XXXXX-XXXXX-XXXXX-XXXXX
        return `${pickRandom(chars, 5)}-${pickRandom(chars, 5)}-${pickRandom(chars, 5)}-${pickRandom(chars, 5)}-${pickRandom(chars, 5)}`;
      case 'amazon':
        // AMZN-XXXXX-XXXXX
        return `AMZN-${pickRandom(chars, 5)}-${pickRandom(chars, 5)}`;
      case 'pubg':
        // A1B2-C3D4-E5F6-G7H8
        return `${pickRandom(chars, 4)}-${pickRandom(chars, 4)}-${pickRandom(chars, 4)}-${pickRandom(chars, 4)}`;
      case 'free_fire':
        // FF7M-U4Y6-X9R2
        return `${pickRandom(chars, 4)}-${pickRandom(chars, 4)}-${pickRandom(chars, 4)}`;
      case 'roblox':
        // 849-302-7715 (10 digits)
        return `${pickRandom(numChars, 3)}-${pickRandom(numChars, 3)}-${pickRandom(numChars, 4)}`;
      case 'shein':
        // Card Number: 16 digits, PIN: 4 digits. Example: 6321 4589 7741 2365|4589
        const cardNum = `${pickRandom(numChars, 4)} ${pickRandom(numChars, 4)} ${pickRandom(numChars, 4)} ${pickRandom(numChars, 4)}`;
        const pinCode = `${pickRandom(numChars, 4)}`;
        return `${cardNum}|${pinCode}`;
      default:
        return `${pickRandom(chars, 4)}-${pickRandom(chars, 4)}-${pickRandom(chars, 4)}-${pickRandom(chars, 4)}`;
    }
  };

  const handlePurchase = async () => {
    if (!selectedProduct || !selectedPackage) return;
    if (user.balance < selectedPackage.discountedPrice) {
      alert(lang === 'ar' ? 'رصيد غير كافٍ في محفظتك للشراء!' : 'Insufficient balance in your wallet!');
      return;
    }

    setIsPurchasing(true);
    const generated = generateFakeKey(selectedProduct.brand);
    setFakeKey(generated);

    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, {
        balance: increment(-selectedPackage.discountedPrice)
      });
      
      // Update local state instantly
      onUserUpdate({
        ...user,
        balance: user.balance - selectedPackage.discountedPrice
      });
    } catch (err) {
      console.warn("Firestore sync failed, updating local state only:", err);
      // Fallback local update so the user experience is flawless
      onUserUpdate({
        ...user,
        balance: user.balance - selectedPackage.discountedPrice
      });
    } finally {
      setPurchaseStep('success');
      setIsPurchasing(false);
    }
  };

  const copyToClipboard = (text: string) => {
    let textToCopy = text;
    if (text.includes('|')) {
      const [card, pin] = text.split('|');
      textToCopy = `Card Number: ${card}\nPIN: ${pin}`;
    }
    navigator.clipboard.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className={`p-4 pb-28 ${theme === 'light' ? 'bg-[#f8f9fa]' : 'bg-black'} min-h-screen`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-6 sticky top-0 bg-transparent pt-2 z-20 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigate('dashboard')}
            className={`p-2.5 rounded-xl border transition-all ${theme === 'light' ? 'bg-white border-gray-200' : 'bg-white/5 border-white/10'} active:scale-95`}
          >
            <ChevronLeft className="w-5 h-5 light-mode-text" />
          </button>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter light-mode-text">Mada Store</h1>
            <p className="text-[10px] text-gray-500 font-bold tracking-widest uppercase">{lang === 'ar' ? 'الشحن الرقمي الفوري' : 'Instant Digital Delivery'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-blue-500/10 px-4 py-2 rounded-full border border-blue-500/20 shadow-sm">
          <Wallet className="w-4 h-4 text-blue-500" />
          <span className="text-sm font-black text-blue-500">${user.balance.toFixed(2)}</span>
        </div>
      </div>

      {/* Search & Categories */}
      <div className="flex flex-col gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input 
            type="text" 
            placeholder={lang === 'ar' ? 'ابحث عن بطاقة أو لعبة شحن...' : 'Search for cards or games...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none focus:border-blue-500/50 transition-all light-mode-card light-mode-text"
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
          {[
            { id: 'all', label: lang === 'ar' ? 'الأقسام' : 'All Sections' },
            { id: 'giftcard', label: lang === 'ar' ? 'بطاقات الهدايا' : 'Gift Cards' },
            { id: 'game_topup', label: lang === 'ar' ? 'شحن الألعاب' : 'Game Charging' }
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id as any)}
              className={`px-5 py-2.5 rounded-full font-bold text-xs whitespace-nowrap transition-all border ${
                selectedCategory === cat.id 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-[0_4px_14px_rgba(37,99,235,0.4)]' 
                  : `bg-white/5 border-white/10 text-gray-400 light-mode-card light-mode-text`
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid (No Prices Outside) */}
      <div className="grid grid-cols-2 gap-4">
        {filteredProducts.map((product) => (
          <motion.div
            key={product.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => { 
              setSelectedProduct(product); 
              setSelectedPackage(product.packages[0] || null);
              setPurchaseStep('details'); 
            }}
            className="group relative bg-white/5 border border-white/10 rounded-3xl overflow-hidden cursor-pointer light-mode-card shadow-md flex flex-col justify-between"
          >
            <div className="aspect-[1/1] overflow-hidden relative">
              <img 
                src={product.image} 
                alt={product.name} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              
              {/* Premium Discount Ribbon */}
              <div className="absolute top-3 right-3 bg-red-500 text-white text-[9px] font-black px-2 py-1 rounded-lg flex items-center gap-1 shadow-lg border border-red-400/30">
                <Tag className="w-2.5 h-2.5" />
                20% OFF
              </div>
            </div>

            <div className="p-4 flex flex-col gap-1.5 bg-black/40 backdrop-blur-sm border-t border-white/5 light-mode-card mt-auto">
              <h3 className="text-xs font-black tracking-tight line-clamp-1 light-mode-text">{product.name}</h3>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-gray-400 font-bold">{lang === 'ar' ? 'شحن فوري ومعتمد' : 'Instant Delivery'}</span>
                <span className="text-[9px] font-black text-rose-500 bg-rose-500/10 px-1.5 py-0.5 rounded-md border border-rose-500/10">{lang === 'ar' ? 'خصم مذهل' : 'Discounted'}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Product Detail Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/90 backdrop-blur-xl"
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className={`relative w-full max-w-md ${theme === 'light' ? 'bg-white' : 'bg-[#0a0a0a]'} rounded-t-[40px] sm:rounded-[30px] p-6 overflow-hidden border-t sm:border border-white/10 shadow-2xl max-h-[90vh] overflow-y-auto`}
            >
              {purchaseStep === 'details' && (
                <div className="flex flex-col gap-5">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-col">
                      <span className="text-rose-500 font-black text-[10px] uppercase tracking-widest mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        {selectedProduct.category === 'giftcard' ? (lang === 'ar' ? 'بطاقة رقمية' : 'Gift Card') : (lang === 'ar' ? 'شحن مباشر' : 'Game Top-up')}
                      </span>
                      <h2 className="text-2xl font-black italic tracking-tighter light-mode-text">{selectedProduct.name}</h2>
                    </div>
                    <button onClick={() => setSelectedProduct(null)} className="p-2.5 rounded-full bg-white/5 border border-white/10 light-mode-card active:scale-90">
                      <ChevronLeft className="w-5 h-5 rotate-[-90deg] light-mode-text" />
                    </button>
                  </div>

                  {/* Brand Visual Display */}
                  <div className="aspect-[21/9] rounded-2xl overflow-hidden relative border border-white/10">
                    <img src={selectedProduct.image} alt={selectedProduct.name} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                    <div className="absolute bottom-3 left-4 flex gap-2">
                      <span className="text-[10px] bg-emerald-500 text-white font-black px-2 py-0.5 rounded-md shadow-sm">{lang === 'ar' ? 'متوفر حالياً' : 'In Stock'}</span>
                    </div>
                  </div>

                  {/* Pack Selector (Selections of Prices) */}
                  <div className="flex flex-col gap-3">
                    <h3 className="font-black text-gray-500 text-xs uppercase tracking-widest flex items-center gap-2">
                      <Ticket className="w-4 h-4 text-blue-500" />
                      {lang === 'ar' ? 'اختر فئة الشحن المطلوبة' : 'Select Charging Package'}
                    </h3>
                    
                    <div className="grid grid-cols-1 gap-2.5 max-h-56 overflow-y-auto pr-1">
                      {selectedProduct.packages.map((pack) => {
                        const isSelected = selectedPackage?.id === pack.id;
                        return (
                          <button
                            key={pack.id}
                            onClick={() => setSelectedPackage(pack)}
                            className={`w-full p-3.5 rounded-2xl text-left border flex items-center justify-between transition-all ${
                              isSelected 
                                ? 'bg-blue-600/10 border-blue-500 shadow-[0_0_15px_rgba(37,99,235,0.15)] text-white' 
                                : `bg-white/5 border-white/5 text-gray-300 hover:border-white/10 light-mode-card`
                            }`}
                          >
                            <div className="flex flex-col gap-1">
                              <span className={`font-black text-sm ${isSelected ? 'text-blue-500' : 'light-mode-text'}`}>{pack.name}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 line-through font-bold">${pack.originalPrice.toFixed(2)}</span>
                                <span className="text-[10px] bg-red-500/10 text-red-500 font-bold px-1.5 rounded-md border border-red-500/10">20% OFF</span>
                              </div>
                            </div>
                            <div className="text-right flex flex-col">
                              <span className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'بالخصم' : 'With Discount'}</span>
                              <span className="text-lg font-black text-blue-500">${pack.discountedPrice.toFixed(2)}</span>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Summary Footer of Detail */}
                  {selectedPackage && (
                    <div className="border-t border-white/5 pt-4 flex flex-col gap-4">
                      <div className="flex justify-between items-center bg-blue-500/5 p-3 rounded-xl border border-blue-500/10">
                        <span className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'سعر الخصم الإجمالي' : 'Total Discounted Price'}</span>
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-[10px] text-gray-500 line-through">${selectedPackage.originalPrice.toFixed(2)}</span>
                          <span className="text-2xl font-black text-blue-500">${selectedPackage.discountedPrice.toFixed(2)}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => setPurchaseStep('confirm')}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-all shadow-[0_10px_35px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 active:scale-95"
                      >
                        <ShoppingBag className="w-5 h-5" />
                        {lang === 'ar' ? 'شراء ومتابعة' : 'Buy & Proceed'}
                      </button>
                    </div>
                  )}
                </div>
              )}

              {purchaseStep === 'confirm' && selectedPackage && (
                <div className="flex flex-col gap-6 py-2">
                  <div className="text-center flex flex-col gap-2">
                    <div className="w-16 h-16 bg-blue-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-blue-500/20">
                      <ShoppingBag className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter light-mode-text">{lang === 'ar' ? 'تأكيد الشراء' : 'Confirm Purchase'}</h2>
                    <p className="text-sm text-gray-500">{lang === 'ar' ? 'تأكيد شحن وسحب الرصيد من محفظتك' : 'Payment will be deducted from your wallet balance'}</p>
                  </div>

                  <div className="bg-white/5 border border-white/5 rounded-2xl p-5 flex flex-col gap-4 light-mode-card">
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'البوابة / القسم' : 'Brand / Store'}</span>
                      <span className="text-sm font-black text-white bg-white/5 border border-white/10 px-3 py-1 rounded-xl light-mode-text">{selectedProduct.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'الفئة المحددة' : 'Selected Denomination'}</span>
                      <span className="text-sm font-black text-rose-500 font-mono">{selectedPackage.name}</span>
                    </div>
                    <div className="h-px bg-white/5 w-full" />
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400 font-bold">{lang === 'ar' ? 'سعر البيع المعتمد' : 'Original Price'}</span>
                      <span className="text-xs text-gray-500 font-black line-through">${selectedPackage.originalPrice.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-emerald-500 flex items-center gap-1">
                        <Tag className="w-3.5 h-3.5" />
                        {lang === 'ar' ? 'السعر بعد خصم 20% المعتمد' : 'Price after 20% OFF'}
                      </span>
                      <span className="text-xl font-black text-blue-500">${selectedPackage.discountedPrice.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={handlePurchase}
                      disabled={isPurchasing}
                      className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-4.5 rounded-2xl transition-all shadow-[0_10px_30px_rgba(37,99,235,0.4)] flex items-center justify-center gap-3 disabled:opacity-50"
                    >
                      {isPurchasing ? (
                        <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                      ) : (
                        lang === 'ar' ? 'تأكيد الدفع والاستلام' : 'Confirm & Generate Key'
                      )}
                    </button>
                    <button
                      onClick={() => setPurchaseStep('details')}
                      className="w-full py-3 text-gray-500 font-bold hover:text-white transition-colors light-mode-text text-sm"
                    >
                      {lang === 'ar' ? 'الرجوع لاختيار فئة أخرى' : 'Go back to packages'}
                    </button>
                  </div>
                </div>
              )}

              {purchaseStep === 'success' && selectedPackage && (
                <div className="flex flex-col gap-6 py-2">
                  <div className="text-center flex flex-col gap-2 animate-bounce-short">
                    <div className="w-16 h-16 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-green-500/20">
                      <CheckCircle2 className="w-8 h-8 text-green-500" />
                    </div>
                    <h2 className="text-2xl font-black italic tracking-tighter text-emerald-500">{lang === 'ar' ? 'تمت عملية الشراء بنجاح!' : 'Purchase Successful!'}</h2>
                    <p className="text-sm text-gray-500">{lang === 'ar' ? 'تم توليد مفتاح الشحن بنجاح لعمليتك' : 'Your digital key has been generated'}</p>
                  </div>

                  <div className="flex flex-col gap-4">
                    {fakeKey.includes('|') ? (
                      (() => {
                        const [card, pin] = fakeKey.split('|');
                        return (
                          <div className="flex flex-col gap-4">
                            {/* Card Number field */}
                            <div className="flex flex-col gap-1.5 text-right w-full">
                              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider pr-1">
                                {lang === 'ar' ? 'رقم البطاقة (Card Number)' : 'Card Number'}
                              </span>
                              <div 
                                onClick={() => copyToClipboard(card)}
                                className="w-full bg-black/40 border-2 border-emerald-500/30 rounded-2xl p-4 text-center font-mono text-sm sm:text-base md:text-lg tracking-wider font-extrabold text-emerald-300 shadow-lg cursor-pointer hover:border-emerald-400/60 hover:bg-emerald-500/5 transition-all active:scale-[0.99] flex items-center justify-between gap-3 text-left overflow-hidden select-all"
                                title={lang === 'ar' ? 'اضغط لنسخ رقم البطاقة' : 'Click to copy Card Number'}
                              >
                                <span className="break-all flex-1 text-center pr-2 font-black">{card}</span>
                                <div className="shrink-0 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                  <Copy className="w-4 h-4 text-emerald-400" />
                                </div>
                              </div>
                            </div>

                            {/* PIN field */}
                            <div className="flex flex-col gap-1.5 text-right w-full">
                              <span className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider pr-1">
                                {lang === 'ar' ? 'الرمز السري (PIN Code)' : 'PIN Code'}
                              </span>
                              <div 
                                onClick={() => copyToClipboard(pin)}
                                className="w-full bg-black/40 border-2 border-emerald-500/30 rounded-2xl p-4 text-center font-mono text-sm sm:text-base md:text-lg tracking-widest font-extrabold text-emerald-300 shadow-lg cursor-pointer hover:border-emerald-400/60 hover:bg-emerald-500/5 transition-all active:scale-[0.99] flex items-center justify-between gap-3 text-left overflow-hidden select-all"
                                title={lang === 'ar' ? 'اضغط لنسخ الرمز السري' : 'Click to copy PIN'}
                              >
                                <span className="break-all flex-1 text-center pr-2 font-black">{pin}</span>
                                <div className="shrink-0 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                                  <Copy className="w-4 h-4 text-emerald-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })()
                    ) : (
                      <div className="flex flex-col gap-1.5 text-right w-full">
                        <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider pr-1">
                          {lang === 'ar' ? 'مفتاح الشحن / الكود الخاص بك' : 'Your Digital Code / Voucher Key'}
                        </label>
                        <div 
                          onClick={() => copyToClipboard(fakeKey)}
                          className="w-full bg-black/40 border-2 border-emerald-500/30 rounded-2xl p-4 text-center font-mono text-sm sm:text-base md:text-lg tracking-wider font-extrabold text-emerald-300 shadow-lg cursor-pointer hover:border-emerald-400/60 hover:bg-emerald-500/5 transition-all active:scale-[0.99] flex items-center justify-between gap-3 text-left overflow-hidden select-all"
                          title={lang === 'ar' ? 'اضغط لنسخ المفتاح' : 'Click to copy key'}
                        >
                          <span className="break-all flex-1 text-center pr-2 font-black">{fakeKey}</span>
                          <div className="shrink-0 p-2 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                            <Copy className="w-4 h-4 text-emerald-400" />
                          </div>
                        </div>
                      </div>
                    )}

                    {copied && (
                      <motion.div 
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold py-2 px-4 rounded-xl text-center"
                      >
                        {lang === 'ar' ? '✓ تم نسخ البيانات بنجاح!' : '✓ Data successfully copied!'}
                      </motion.div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <button
                      onClick={() => { setSelectedProduct(null); setSelectedPackage(null); setPurchaseStep('details'); }}
                      className="bg-white/5 border border-white/10 text-white font-bold py-4 rounded-xl hover:bg-white/10 transition-all light-mode-card light-mode-text text-xs"
                    >
                      {lang === 'ar' ? 'إغلاق المتجر' : 'Close Store'}
                    </button>
                    <button
                      onClick={() => copyToClipboard(fakeKey)}
                      className="bg-blue-600 text-white font-black py-4 rounded-xl hover:bg-blue-500 transition-all shadow-lg flex items-center justify-center gap-2 text-xs"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {lang === 'ar' ? 'نسخ واستخدام الكود' : 'Copy & Redeem'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
