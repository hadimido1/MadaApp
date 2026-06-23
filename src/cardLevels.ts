export interface CardLevel {
  level: number;
  nameAr: string;
  nameEn: string;
  minBalance: number;
  cardBg: string; // Tailwind bg or specific custom class
  textColor: string; 
  appBg: string; 
  themeColor: string; 
  glow: string; 
  styleType: 'color' | 'material' | 'effect';
  materialClass?: string; // Custom CSS class for metallic/materials
  descriptionAr: string;
  descriptionEn: string;
}

export const cardLevels: CardLevel[] = [
  // --- Category 1: Clean Color Gradients (Levels 1 to 5) ---
  {
    level: 1,
    nameAr: "الأردواز الكلاسيكي",
    nameEn: "Classic Slate",
    minBalance: 0,
    cardBg: "from-[#1e293b] via-[#0f172a] to-[#020617]",
    textColor: "text-slate-100",
    appBg: "linear-gradient(to bottom, #0f172a, #020617)",
    themeColor: "#64748b",
    glow: "shadow-[0_10px_30px_rgba(30,41,59,0.3)] border-white/10",
    styleType: 'color',
    descriptionAr: "بطاقة البداية الأنيقة والعملية بلون الأردواز الداكن.",
    descriptionEn: "Your elegant and practical starting dark slate card."
  },
  {
    level: 2,
    nameAr: "بحيرة منتصف الليل",
    nameEn: "Midnight Lagoon",
    minBalance: 500,
    cardBg: "from-[#0f172a] via-[#115e59] to-[#042f2e]",
    textColor: "text-teal-100",
    appBg: "linear-gradient(to bottom, #042f2e, #021e1d)",
    themeColor: "#14b8a6",
    glow: "shadow-[0_10px_30px_rgba(20,184,166,0.25)] border-teal-500/20",
    styleType: 'color',
    descriptionAr: "عالم غامض من تدرجات المياه العميقة.",
    descriptionEn: "An enigmatic world of deep marine teal gradients."
  },
  {
    level: 3,
    nameAr: "النحاس البركاني",
    nameEn: "Copper Rust",
    minBalance: 1500,
    cardBg: "from-[#7c2d12] via-[#451a03] to-[#1c0d02]",
    textColor: "text-orange-100",
    appBg: "linear-gradient(to bottom, #3c1406, #1c0d02)",
    themeColor: "#f97316",
    glow: "shadow-[0_10px_30px_rgba(249,115,22,0.25)] border-orange-500/20",
    styleType: 'color',
    descriptionAr: "فخامة ترابية متدرجة بلمسة بركانية دافئة.",
    descriptionEn: "A touch of warm, earthy volcanic copper gradient."
  },
  {
    level: 4,
    nameAr: "الياقوت الملكي",
    nameEn: "Royal Sapphire",
    minBalance: 5000,
    cardBg: "from-[#1e3a8a] via-[#172554] to-[#0b1329]",
    textColor: "text-blue-100",
    appBg: "linear-gradient(to bottom, #111e47, #0b1329)",
    themeColor: "#3b82f6",
    glow: "shadow-[0_10px_30px_rgba(59,130,246,0.3)] border-blue-500/20",
    styleType: 'color',
    descriptionAr: "تدرج ملوكي مستوحى من أعماق البحار العميقة.",
    descriptionEn: "A royal deep blue design inspired by oceanic trenches."
  },
  {
    level: 5,
    nameAr: "المخمل البنفسجي",
    nameEn: "Velvet Amethyst",
    minBalance: 10000,
    cardBg: "from-[#581c87] via-[#3b0764] to-[#1e0533]",
    textColor: "text-purple-100",
    appBg: "linear-gradient(to bottom, #311152, #150226)",
    themeColor: "#a855f7",
    glow: "shadow-[0_10px_30px_rgba(168,85,247,0.25)] border-purple-500/20",
    styleType: 'color',
    descriptionAr: "تدرجات أرجوانية ناعمة تحاكي فخامة قماش القطيفة.",
    descriptionEn: "The premium gradient of majestic purple velvet."
  },

  // --- Category 2: Authentic Physical Materials (Levels 6 to 10) ---
  {
    level: 6,
    nameAr: "البرونز المصقول",
    nameEn: "Brushed Bronze",
    minBalance: 20000,
    cardBg: "", // custom css
    textColor: "text-amber-100",
    appBg: "linear-gradient(to bottom, #2b1d12, #140d07)",
    themeColor: "#cd7f32",
    glow: "shadow-[0_15px_35px_rgba(205,127,50,0.25)] border-[#cd7f32]/30",
    styleType: 'material',
    materialClass: "material-bronze",
    descriptionAr: "تأثير برونزي غني بملمس معدني مصقول وانعكاسات ضوئية.",
    descriptionEn: "Rich bronze material with real metallic brushing and glare reflection."
  },
  {
    level: 7,
    nameAr: "الفضة الإسترلينية",
    nameEn: "Sterling Chrome",
    minBalance: 35000,
    cardBg: "", 
    textColor: "text-slate-900",
    appBg: "linear-gradient(to bottom, #1e293b, #0f172a)",
    themeColor: "#e2e8f0",
    glow: "shadow-[0_15px_35px_rgba(226,232,240,0.3)] border-white/40",
    styleType: 'material',
    materialClass: "material-silver",
    descriptionAr: "معدن الفضة المصقول اللامع مع تباين فضي فائق الجودة وانعكاس ضوئي ديناميكي.",
    descriptionEn: "Ultra-reflective liquid silver plating with chrome light refraction."
  },
  {
    level: 8,
    nameAr: "الذهب الخالص 24K",
    nameEn: "Solid 24K Gold",
    minBalance: 50000,
    cardBg: "",
    textColor: "text-amber-950 font-extrabold",
    appBg: "linear-gradient(to bottom, #382402, #120b00)",
    themeColor: "#fbbf24",
    glow: "shadow-[0_15px_40px_rgba(251,191,36,0.35)] border-[#ffd700]/50 ring-1 ring-[#ffd700]/20",
    styleType: 'material',
    materialClass: "material-gold",
    descriptionAr: "سبائك ذهب عيار 24 حقيقي بملمس ناعم، بريق ساطع وانعكاس ذهبي يتحرك مع الماوس.",
    descriptionEn: "True 24K pure gold leaf styling with realistic light reflections and dynamic gloss."
  },
  {
    level: 9,
    nameAr: "الزجاج البلوري الساحر",
    nameEn: "Frosted Obsidian Glass",
    minBalance: 75000,
    cardBg: "",
    textColor: "text-white font-medium",
    appBg: "linear-gradient(to bottom, #111827, #030712)",
    themeColor: "#38bdf8",
    glow: "shadow-[0_15px_35px_rgba(255,255,255,0.1)] border-white/30 backdrop-blur-md",
    styleType: 'material',
    materialClass: "material-glass",
    descriptionAr: "تأثير الزجاج الشفاف المطفأ المتطور، مدمج بلمعان داخلي عاكس.",
    descriptionEn: "Stunning frosted translucent glass refraction with glowing internal cyber circuits."
  },
  {
    level: 10,
    nameAr: "الماس الكريستالي",
    nameEn: "Crystalline Diamond",
    minBalance: 100000,
    cardBg: "",
    textColor: "text-slate-950 font-black",
    appBg: "linear-gradient(to bottom, #111e38, #020617)",
    themeColor: "#22d3ee",
    glow: "shadow-[0_15px_40px_rgba(255,255,255,0.4)] border-white/60",
    styleType: 'material',
    materialClass: "material-diamond",
    descriptionAr: "مادة صلبة كالماس عاكسة للضوء الأبيض وبأطياف كريستالية متلألئة عند تحريك الجهاز.",
    descriptionEn: "Extreme diamond sparkle reflecting pristine polygonal prisms and high-index dispersion."
  },

  // --- Category 3: Alive Visual Effects & Rainbows (Levels 11 to 15) ---
  {
    level: 11,
    nameAr: "الحمم المشتعلة",
    nameEn: "Flaming Magma",
    minBalance: 150000,
    cardBg: "",
    textColor: "text-red-100 font-bold",
    appBg: "linear-gradient(to bottom, #4c0505, #110000)",
    themeColor: "#f97316",
    glow: "shadow-[0_20px_45px_rgba(239,68,68,0.4)] border-red-500/40 ring-1 ring-red-500/30",
    styleType: 'effect',
    materialClass: "effect-magma",
    descriptionAr: "بطاقة نابضة بتأثير بركاني ملتهب ونيران قانية متحركة في الخلفية.",
    descriptionEn: "Dynamic breathing volcanic flame pulses and moving heat map textures."
  },
  {
    level: 12,
    nameAr: "الأمواج البحرية",
    nameEn: "Deep Hydro Wave",
    minBalance: 250000,
    cardBg: "",
    textColor: "text-sky-100 font-bold",
    appBg: "linear-gradient(to bottom, #022c22, #00100d)",
    themeColor: "#06b6d4",
    glow: "shadow-[0_20px_45px_rgba(6,182,212,0.35)] border-cyan-500/30",
    styleType: 'effect',
    materialClass: "effect-hydro",
    descriptionAr: "تموجات مائية حية وتدفقات هيدروليكية زرقاء تتدفق عند التمرير واللمس.",
    descriptionEn: "Mesmerizing interactive liquid waves that ripple fluidly upon hover."
  },
  {
    level: 13,
    nameAr: "السايبربانك النيوني",
    nameEn: "Cyber Hologram",
    minBalance: 500000,
    cardBg: "",
    textColor: "text-pink-100 font-extrabold",
    appBg: "linear-gradient(to bottom, #1f0010, #000000)",
    themeColor: "#ec4899",
    glow: "shadow-[0_20px_45px_rgba(236,72,153,0.4)] border-pink-500/40 ring-1 ring-pink-500/20",
    styleType: 'effect',
    materialClass: "effect-cyber",
    descriptionAr: "لوحة من أشعة الليزر الوردية والزرقاء المتداخلة بتأثير هولوغرافي تفاعلي.",
    descriptionEn: "Futuristic neon pink and neon cyan holographic grid overlay with glitch flares."
  },
  {
    level: 14,
    nameAr: "الشفق النجمي الكوني",
    nameEn: "Astral Nebula",
    minBalance: 750000,
    cardBg: "",
    textColor: "text-purple-100 font-black",
    appBg: "linear-gradient(to bottom, #0f052d, #000000)",
    themeColor: "#8b5cf6",
    glow: "shadow-[0_20px_45px_rgba(139,92,246,0.4)] border-purple-500/30",
    styleType: 'effect',
    materialClass: "effect-nebula",
    descriptionAr: "سديم فضائي متحرك وغبار نجمي يتوهج بألوان كونية خلابة.",
    descriptionEn: "An active cosmic nebula swirling with stardust and dark energy currents."
  },
  {
    level: 15,
    nameAr: "طيف المليونير الساطع RGB",
    nameEn: "Supreme Millionaire RGB",
    minBalance: 1000000,
    cardBg: "",
    textColor: "text-white font-black tracking-widest text-shadow-rainbow",
    appBg: "linear-gradient(to bottom, #0c0214, #000000)",
    themeColor: "#ff00ea",
    glow: "outline outline-[3.5px] outline-pink-500/80 border-none shadow-none",
    styleType: 'effect',
    materialClass: "effect-rgb",
    descriptionAr: "قوة المليونيرات النهائية! طيف RGB مشع بالكامل وبطاقة تتغير ألوانها كقوس قزح باستمرار.",
    descriptionEn: "The absolute millionaire zenith! Hypnotic cycling RGB color spectrum wave."
  }
];
