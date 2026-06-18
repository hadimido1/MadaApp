import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { generateUniqueVirtualCard } from '../utils';
import { getTranslation } from '../i18n';
import logo from '../assets/images/regenerated_image_1781780076153.png';

export function SetupProfile({ defaultName, onComplete }: { defaultName: string, onComplete: (profileData: any) => void }) {
  const lang = localStorage.getItem('app_lang') as 'ar' | 'en' || 'en';
  const t = getTranslation(lang);
  
  const [name, setName] = useState(defaultName || '');
  const [age, setAge] = useState('');
  const [country, setCountry] = useState('');
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !age || !country || !pin) return;
    
    setLoading(true);
    // Generate virtual card
    const virtualCard = generateUniqueVirtualCard(name);
    
    await onComplete({
      name,
      age,
      country,
      pin,
      card: virtualCard,
      balance: 0,
      role: 'user'
    });
  };

  return (
    <div className="min-h-screen w-full bg-black flex items-center justify-center p-6 relative overflow-hidden" dir={lang === 'ar' ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-sm relative z-10 flex flex-col items-center">
        <div className="w-20 h-20 mb-6 flex items-center justify-center transition-all hover:scale-110 duration-500">
          <img src={logo} alt="Mada Icon" className="w-full h-full object-contain" />
        </div>
        
        <h1 className="text-3xl font-black text-white tracking-tighter mb-1 italic">Mada</h1>
        <p className="text-gray-500 text-[10px] mb-8 text-center font-bold uppercase tracking-[0.3em]">Premium Financial Enclave</p>

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <div className="bg-white/[0.03] border border-white/10 rounded-[24px] p-2 backdrop-blur-xl shadow-2xl flex flex-col gap-2 font- Cairo">
            <div className="px-5 pt-4 pb-2">
              <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-wide">{t.fullName}</label>
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-transparent text-white font-bold text-base focus:outline-none placeholder:text-gray-700"
                placeholder={t.namePlaceholder}
                required
              />
            </div>
            <div className="h-[1px] w-full bg-white/5"></div>
            <div className="px-5 pb-2 pt-2">
              <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-wide">{t.ageLabel}</label>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(e.target.value)}
                className="w-full bg-transparent text-white font-bold text-base focus:outline-none placeholder:text-gray-700"
                placeholder={t.agePlaceholder}
                min="18"
                required
              />
            </div>
            <div className="h-[1px] w-full bg-white/5"></div>
            <div className="px-5 pb-2 pt-2">
              <label className="block text-[10px] font-black text-gray-500 mb-2 uppercase tracking-wide">{t.countryLabel}</label>
              <input 
                type="text" 
                value={country}
                onChange={(e) => setCountry(e.target.value)}
                className="w-full bg-transparent text-white font-bold text-base focus:outline-none placeholder:text-gray-700"
                placeholder={t.countryPlaceholder}
                required
              />
            </div>
            <div className="h-[1px] w-full bg-white/5"></div>
            <div className="px-5 pb-4 pt-2">
              <label className="block text-[10px] font-black text-blue-500 mb-2 uppercase tracking-wide">{t.pinLabel}</label>
              <input 
                type="password" 
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="w-full bg-transparent text-white font-mono text-xl tracking-widest focus:outline-none placeholder:text-gray-700"
                placeholder={t.pinPlaceholder}
                required
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-white text-black font-black py-4 rounded-full shadow-xl transition-all active:scale-[0.98] mt-6 flex justify-center disabled:opacity-70"
          >
            {loading ? (lang === 'ar' ? 'جاري الإصدار...' : 'Creating...') : t.createAccount}
          </button>
        </form>
      </div>
    </div>
  );
}
