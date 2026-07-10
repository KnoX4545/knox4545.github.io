// ================================================================
// core.js — هسته اصلی هاپ داگ (سیستم‌ها، متغیرها، توابع پایه)
// ================================================================

// ================================================================
// LEVEL SYSTEM
// ================================================================
const LEVEL_DATA = {
    1: { required: 0, minPoints: 5, maxPoints: 15, cooldown: 300, reward: 0, features: ['شروع ماجراجویی'] },
    2: { required: 5, minPoints: 10, maxPoints: 20, cooldown: 300, reward: 50, features: ['پنجه', 'شکار'] },
    3: { required: 15, minPoints: 15, maxPoints: 25, cooldown: 300, reward: 225, features: ['هاپو'] },
    4: { required: 40, minPoints: 20, maxPoints: 35, cooldown: 300, reward: 500, features: ['بانک هاپویی'] },
    5: { required: 75, minPoints: 25, maxPoints: 40, cooldown: 295, reward: 1000, features: ['ارتقا بیشتر'] },
    6: { required: 115, minPoints: 35, maxPoints: 50, cooldown: 295, reward: 1750, features: ['ارتقا بیشتر'] },
    7: { required: 175, minPoints: 50, maxPoints: 75, cooldown: 295, reward: 2500, features: ['ارتقا بیشتر'] },
    8: { required: 250, minPoints: 75, maxPoints: 100, cooldown: 295, reward: 3450, features: ['ارتقا بیشتر'] },
    9: { required: 350, minPoints: 100, maxPoints: 125, cooldown: 295, reward: 4625, features: ['ارتقا بیشتر'] },
    10: { required: 475, minPoints: 125, maxPoints: 175, cooldown: 290, reward: 6000, features: ['ارتقا بیشتر'] },
    11: { required: 625, minPoints: 150, maxPoints: 225, cooldown: 290, reward: 7500, features: ['ارتقا بیشتر'] },
    12: { required: 800, minPoints: 175, maxPoints: 275, cooldown: 290, reward: 9250, features: ['ارتقا بیشتر'] },
    13: { required: 975, minPoints: 200, maxPoints: 325, cooldown: 290, reward: 11250, features: ['ارتقا بیشتر'] },
    14: { required: 1175, minPoints: 225, maxPoints: 375, cooldown: 290, reward: 13400, features: ['ارتقا بیشتر'] },
    15: { required: 1400, minPoints: 250, maxPoints: 425, cooldown: 285, reward: 15750, features: ['ارتقا بیشتر'] },
    16: { required: 1650, minPoints: 275, maxPoints: 475, cooldown: 285, reward: 18250, features: ['ارتقا بیشتر'] },
    17: { required: 1925, minPoints: 300, maxPoints: 525, cooldown: 285, reward: 21000, features: ['ارتقا بیشتر'] },
    18: { required: 2225, minPoints: 325, maxPoints: 575, cooldown: 285, reward: 24000, features: ['ارتقا بیشتر'] },
    19: { required: 2550, minPoints: 350, maxPoints: 625, cooldown: 285, reward: 27250, features: ['ارتقا بیشتر'] },
    20: { required: 2900, minPoints: 375, maxPoints: 675, cooldown: 280, reward: 30500, features: ['نهایی'] },
};
const MAX_LEVEL = 20;

// ================================================================
// HAPO SYSTEM
// ================================================================
const HAPO_NAMES = ['رکس', 'لوسی', 'بارنی', 'مکس', 'بلا', 'چارلی', 'راکی', 'مولی', 'تدی', 'لونا', 'سیمبا', 'نلا', 'بادی', 'مایلو', 'کوکو', 'روبی', 'اسکار', 'جک', 'دِیزی', 'تایسون'];
const RANK_NAMES = ['تازه‌وارد', 'حرفه‌ای', 'استاد', 'افسانه', 'بی‌نهایت'];

const HAPO_CAPACITY = {
    1: 500, 2: 5000, 3: 10000, 4: 15000, 5: 20000,
    6: 25000, 7: 30000, 8: 35000, 9: 40000, 10: 50000,
    11: 70000, 12: 90000, 13: 110000, 14: 130000, 15: 150000,
    16: 170000, 17: 190000, 18: 200000, 19: 300000, 20: 400000,
    21: 450000, 22: 500000, 23: 550000, 24: 600000, 25: 650000
};
const HAPO_PRODUCTION = {
    1: 0.1, 2: 0.2, 3: 1.0, 4: 1.5, 5: 2.0,
    6: 2.5, 7: 3.0, 8: 3.5, 9: 4.0, 10: 4.5,
    11: 5.0, 12: 5.5, 13: 6.0, 14: 6.5, 15: 7.0,
    16: 7.5, 17: 8.0, 18: 8.5, 19: 9.0, 20: 9.5,
    21: 10.0, 22: 10.5, 23: 11.0, 24: 11.5, 25: 12.0
};
const HAPO_LEVEL_PRICES = {
    1: 250, 2: 500, 3: 5000, 4: 7500, 5: 15000,
    6: 25000, 7: 50000, 8: 75000, 9: 150000, 10: 300000,
    11: 500000, 12: 750000, 13: 1000000, 14: 1500000, 15: 2500000,
    16: 5000000, 17: 7500000, 18: 10000000, 19: 15000000, 20: 20000000,
    21: 25000000, 22: 30000000, 23: 35000000, 24: 40000000, 25: 50000000
};

// ================================================================
// CLAW SYSTEM
// ================================================================
const CLAW_DATA = {
    1: { cost: 500, cooldown: 60, common: 95, uncommon: 5, epic: 0, legendary: 0 },
    2: { cost: 5000, cooldown: 55, common: 80, uncommon: 15, epic: 5, legendary: 0 },
    3: { cost: 25000, cooldown: 50, common: 60, uncommon: 25, epic: 10, legendary: 5 },
    4: { cost: 75000, cooldown: 45, common: 40, uncommon: 30, epic: 20, legendary: 10 },
    5: { cost: 250000, cooldown: 40, common: 20, uncommon: 35, epic: 30, legendary: 15 },
    6: { cost: 1000000, cooldown: 35, common: 10, uncommon: 30, epic: 40, legendary: 20 },
    7: { cost: 3250000, cooldown: 30, common: 5, uncommon: 25, epic: 45, legendary: 25 },
};
const MAX_CLAW_LEVEL = 7;

// ================================================================
// HUNTING SYSTEM (with animal emojis)
// ================================================================
const ANIMALS = {
    common: [
        { name: 'خرگوش', emoji: '🐇', weightMin: 0.25, weightMax: 0.50, multiplier: 80, nutrition: 1 },
        { name: 'سنجاب', emoji: '🐿️', weightMin: 0.50, weightMax: 0.99, multiplier: 60, nutrition: 1 },
        { name: 'جوجه‌تیغی', emoji: '🦔', weightMin: 0.10, weightMax: 0.20, multiplier: 300, nutrition: 1 },
        { name: 'اردک', emoji: '🦆', weightMin: 0.75, weightMax: 1.45, multiplier: 50, nutrition: 1 },
    ],
    uncommon: [
        { name: 'روباه', emoji: '🦊', weightMin: 1.00, weightMax: 1.99, multiplier: 50, nutrition: 2 },
        { name: 'آهو', emoji: '🦌', weightMin: 1.50, weightMax: 2.50, multiplier: 40, nutrition: 2 },
        { name: 'گراز', emoji: '🐗', weightMin: 2.00, weightMax: 2.99, multiplier: 35, nutrition: 2 },
    ],
    epic: [
        { name: 'گرگ', emoji: '🐺', weightMin: 3.00, weightMax: 4.99, multiplier: 30, nutrition: 3 },
        { name: 'خرس', emoji: '🐻', weightMin: 5.00, weightMax: 7.99, multiplier: 20, nutrition: 3 },
        { name: 'پلنگ', emoji: '🐆', weightMin: 8.00, weightMax: 11.99, multiplier: 20, nutrition: 3 },
    ],
    legendary: [
        { name: 'اژدها', emoji: '🐉', weightMin: 12.00, weightMax: 17.99, multiplier: 15, nutrition: 5 },
        { name: 'یونیکورن', emoji: '🦄', weightMin: 5.00, weightMax: 7.99, multiplier: 20, nutrition: 5 },
        { name: 'فنیکس', emoji: '🔥', weightMin: 10.00, weightMax: 20.00, multiplier: 10, nutrition: 5 },
        { name: 'نهنگ بزرگ', emoji: '🐋', weightMin: 15.00, weightMax: 25.00, multiplier: 10, nutrition: 5 },
    ]
};

const RARITY_NAMES = { common: 'معمولی', uncommon: 'کمیاب', epic: 'حماسی', legendary: 'افسانه‌ای' };
const RARITY_COLORS = { common: 'text-secondary', uncommon: 'blue', epic: 'purple', legendary: 'gold' };
const RARITY_ICONS = {
    common: `<svg width="18" height="18" viewBox="0 0 100 100" style="display:inline-block;vertical-align:middle;margin:0 2px;"><circle cx="50" cy="50" r="40" fill="#6a6a6a" stroke="#888" stroke-width="2"/><text x="50" y="65" font-size="45" text-anchor="middle" fill="#aaa" font-weight="bold">C</text></svg>`,
    uncommon: `<svg width="18" height="18" viewBox="0 0 100 100" style="display:inline-block;vertical-align:middle;margin:0 2px;"><circle cx="50" cy="50" r="40" fill="#3b82f6" stroke="#60a5fa" stroke-width="2"/><text x="50" y="65" font-size="45" text-anchor="middle" fill="#93c5fd" font-weight="bold">U</text></svg>`,
    epic: `<svg width="18" height="18" viewBox="0 0 100 100" style="display:inline-block;vertical-align:middle;margin:0 2px;"><circle cx="50" cy="50" r="40" fill="#8b5cf6" stroke="#a78bfa" stroke-width="2"/><text x="50" y="65" font-size="45" text-anchor="middle" fill="#c4b5fd" font-weight="bold">E</text></svg>`,
    legendary: `<svg width="18" height="18" viewBox="0 0 100 100" style="display:inline-block;vertical-align:middle;margin:0 2px;"><circle cx="50" cy="50" r="40" fill="#fbbf24" stroke="#fcd34d" stroke-width="2"/><text x="50" y="65" font-size="45" text-anchor="middle" fill="#fde68a" font-weight="bold">L</text></svg>`
};

// ================================================================
// BANK CONSTANTS
// ================================================================
const BANK_REQUIRED_LEVEL = 4;
const BANK_PURCHASE_COST = 5000;
const BANK_INTEREST_RATE = 0.03;
const BANK_MAX_DAILY_INTEREST = 350000;
const BANK_INTEREST_HOUR = 6;

// ================================================================
// SAVE KEY
// ================================================================
const SAVE_KEY = 'hopdog_data';

// ================================================================
// PREMIUM SVG STICKER SYSTEM
// ================================================================
const PREMIUM_SVG = {
    sparkle: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps1" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7ad"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs><path d="M50 5 L61 38 L95 50 L61 62 L50 95 L39 62 L5 50 L39 38 Z" fill="url(#ps1)"/><circle cx="50" cy="50" r="10" fill="#fff7ad" opacity=".5"/></svg>`,
    paw: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps2" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fde68a"/><stop offset=".55" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs><ellipse cx="50" cy="65" rx="24" ry="21" fill="url(#ps2)" stroke="#92400e" stroke-width="2"/><ellipse cx="28" cy="40" rx="12" ry="15" fill="url(#ps2)" stroke="#92400e" stroke-width="2" transform="rotate(-22 28 40)"/><ellipse cx="50" cy="31" rx="13" ry="16" fill="url(#ps2)" stroke="#92400e" stroke-width="2"/><ellipse cx="72" cy="40" rx="12" ry="15" fill="url(#ps2)" stroke="#92400e" stroke-width="2" transform="rotate(22 72 40)"/><path d="M39 63 Q50 74 61 63" fill="none" stroke="#fff7ad" stroke-width="4" stroke-linecap="round" opacity=".45"/></svg>`,
    coin: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps3" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fff7ad"/><stop offset=".45" stop-color="#fbbf24"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs><circle cx="50" cy="50" r="43" fill="url(#ps3)" stroke="#92400e" stroke-width="3"/><circle cx="50" cy="50" r="31" fill="none" stroke="#fff7ad" stroke-width="5" opacity=".5"/><path d="M34 59 H66 M38 43 H62 M43 28 V72 M57 28 V72" stroke="#7c2d12" stroke-width="6" stroke-linecap="round" opacity=".8"/></svg>`,
    bank: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps4" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#dbeafe"/><stop offset=".4" stop-color="#60a5fa"/><stop offset="1" stop-color="#1d4ed8"/></linearGradient></defs><path d="M12 40 L50 14 L88 40 Z" fill="url(#ps4)" stroke="#93c5fd" stroke-width="2"/><rect x="18" y="42" width="64" height="9" rx="3" fill="#bfdbfe" opacity=".75"/><rect x="22" y="52" width="10" height="28" rx="3" fill="#60a5fa"/><rect x="45" y="52" width="10" height="28" rx="3" fill="#60a5fa"/><rect x="68" y="52" width="10" height="28" rx="3" fill="#60a5fa"/><rect x="14" y="82" width="72" height="8" rx="4" fill="#1d4ed8"/><circle cx="50" cy="35" r="7" fill="#fff7ad"/></svg>`,
    dog: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps5" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fde68a"/><stop offset=".55" stop-color="#f59e0b"/><stop offset="1" stop-color="#b45309"/></linearGradient></defs><path d="M24 38 C17 20 31 15 39 29" fill="#92400e"/><path d="M76 38 C83 20 69 15 61 29" fill="#92400e"/><ellipse cx="50" cy="54" rx="31" ry="28" fill="url(#ps5)" stroke="#92400e" stroke-width="3"/><circle cx="39" cy="49" r="4" fill="#111827"/><circle cx="61" cy="49" r="4" fill="#111827"/><ellipse cx="50" cy="58" rx="8" ry="6" fill="#111827"/><path d="M50 63 Q43 70 36 64 M50 63 Q57 70 64 64" fill="none" stroke="#7c2d12" stroke-width="3" stroke-linecap="round"/></svg>`,
    hunt: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps6" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fef3c7"/><stop offset="1" stop-color="#f59e0b"/></linearGradient></defs><path d="M25 15 C70 35 70 65 25 85" fill="none" stroke="url(#ps6)" stroke-width="8" stroke-linecap="round"/><line x1="25" y1="15" x2="25" y2="85" stroke="#fde68a" stroke-width="3"/><line x1="19" y1="51" x2="82" y2="28" stroke="#93c5fd" stroke-width="5" stroke-linecap="round"/><path d="M82 28 L70 25 L76 37 Z" fill="#dbeafe"/><circle cx="24" cy="51" r="6" fill="#fbbf24"/></svg>`,
    shield: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps7" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#bfdbfe"/><stop offset=".5" stop-color="#3b82f6"/><stop offset="1" stop-color="#1e3a8a"/></linearGradient></defs><path d="M50 8 L84 22 V45 C84 68 69 84 50 93 C31 84 16 68 16 45 V22 Z" fill="url(#ps7)" stroke="#93c5fd" stroke-width="3"/><path d="M34 51 L45 62 L68 36" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    food: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps8" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fecaca"/><stop offset=".5" stop-color="#f87171"/><stop offset="1" stop-color="#991b1b"/></linearGradient></defs><path d="M31 45 C18 42 14 24 28 18 C37 14 45 19 47 29 C55 17 72 17 78 30 C84 44 72 55 61 52 L41 84 C37 91 24 84 29 75 L48 45 Z" fill="url(#ps8)" stroke="#7f1d1d" stroke-width="3"/><circle cx="31" cy="31" r="7" fill="#fee2e2" opacity=".55"/></svg>`,
    check: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#22c55e" opacity=".15" stroke="#4ade80" stroke-width="4"/><path d="M28 51 L43 66 L73 35" fill="none" stroke="#86efac" stroke-width="9" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
    cross: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="42" fill="#ef4444" opacity=".14" stroke="#f87171" stroke-width="4"/><path d="M34 34 L66 66 M66 34 L34 66" stroke="#fecaca" stroke-width="9" stroke-linecap="round"/></svg>`,
    clock: `<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="41" fill="#111827" stroke="#fbbf24" stroke-width="5"/><circle cx="50" cy="50" r="5" fill="#fbbf24"/><path d="M50 50 V24 M50 50 H68" stroke="#fde68a" stroke-width="6" stroke-linecap="round"/></svg>`,
    book: `<svg viewBox="0 0 100 100"><path d="M18 17 H45 C52 17 55 22 55 30 V83 C52 78 48 76 41 76 H18 Z" fill="#60a5fa" stroke="#1e40af" stroke-width="3"/><path d="M82 17 H55 C48 17 45 22 45 30 V83 C48 78 52 76 59 76 H82 Z" fill="#fbbf24" stroke="#92400e" stroke-width="3"/><path d="M28 32 H40 M28 45 H42 M61 32 H73 M59 45 H73" stroke="#fff" stroke-width="4" stroke-linecap="round" opacity=".6"/></svg>`,
    level: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps9" x1="0" y1="1" x2="1" y2="0"><stop stop-color="#f59e0b"/><stop offset="1" stop-color="#fef3c7"/></linearGradient></defs><path d="M16 68 L42 42 L56 56 L84 24" fill="none" stroke="url(#ps9)" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/><path d="M67 24 H84 V41" fill="none" stroke="#fef3c7" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/><circle cx="22" cy="72" r="8" fill="#fbbf24"/></svg>`,
    heart: `<svg viewBox="0 0 100 100"><defs><linearGradient id="psHeart" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fca5a5"/><stop offset=".6" stop-color="#ef4444"/><stop offset="1" stop-color="#991b1b"/></linearGradient></defs><path d="M50 88 C20 65 5 45 15 25 C25 8 45 15 50 28 C55 15 75 8 85 25 C95 45 80 65 50 88Z" fill="url(#psHeart)" stroke="#7f1d1d" stroke-width="2"/></svg>`,
    default: `<svg viewBox="0 0 100 100"><defs><linearGradient id="ps0" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#fef3c7"/><stop offset=".55" stop-color="#fbbf24"/><stop offset="1" stop-color="#d97706"/></linearGradient></defs><circle cx="50" cy="50" r="42" fill="url(#ps0)" stroke="#92400e" stroke-width="3"/><circle cx="38" cy="42" r="5" fill="#1f2937"/><circle cx="62" cy="42" r="5" fill="#1f2937"/><path d="M36 62 Q50 74 64 62" fill="none" stroke="#7c2d12" stroke-width="5" stroke-linecap="round"/></svg>`
};

// ================================================================
// STICKER HELPER FUNCTIONS
// ================================================================
function premiumSticker(type) {
    const svg = PREMIUM_SVG[type] || PREMIUM_SVG.default;
    return '<span class="premium-sticker" aria-hidden="true">' + svg + '</span>';
}

function emojiType(ch) {
    const e = (ch || '').replace(/\uFE0F/g, '');
    if ('🏦💳🏛️'.includes(e)) return 'bank';
    if ('👤👥🧑'.includes(e)) return 'user';
    if ('🐕🐶🐩'.includes(e)) return 'dog';
    if ('🐾'.includes(e)) return 'paw';
    if ('💰🪙💵🤑🛍'.includes(e)) return 'coin';
    if ('🏹🎯'.includes(e)) return 'hunt';
    if ('🛡'.includes(e)) return 'shield';
    if ('🍖🍗🥩😋'.includes(e)) return 'food';
    if ('✅✔'.includes(e)) return 'check';
    if ('❌✖'.includes(e)) return 'cross';
    if ('⏳⌛⏰🕒'.includes(e)) return 'clock';
    if ('📚📖🏫'.includes(e)) return 'book';
    if ('⭐🌟⬆🔓'.includes(e)) return 'level';
    if ('✨✦🎊💫🌘'.includes(e)) return 'sparkle';
    if ('❤💖♥️'.includes(e)) return 'heart';
    return 'default';
}

// ================================================================
// S (STICKERS OBJECT)
// ================================================================
const S = {
    paw: premiumSticker('paw'),
    hopoCoin: premiumSticker('coin'),
    sparkle: premiumSticker('sparkle'),
    welcome: premiumSticker('paw'),
    clock: premiumSticker('clock'),
    error: premiumSticker('cross'),
    game: premiumSticker('book'),
    dog: premiumSticker('dog'),
    star: premiumSticker('level'),
    crown: premiumSticker('level'),
    levelup: premiumSticker('level'),
    namechange: premiumSticker('book'),
    admin: premiumSticker('shield'),
    shield: premiumSticker('shield'),
    hunt: premiumSticker('hunt'),
    claw: premiumSticker('paw'),
    hapo: premiumSticker('dog'),
    food: premiumSticker('food'),
    harvest: premiumSticker('check'),
    upgrade: premiumSticker('level'),
    bank: premiumSticker('bank'),
    user: premiumSticker('user'),
    coin: premiumSticker('coin'),
    clockPremium: premiumSticker('clock'),
    academy: premiumSticker('book'),
    heart: premiumSticker('heart'),
    huntAnim: '<span style="display:inline-block;animation:huntPulse .6s ease-in-out infinite alternate;">' + premiumSticker('hunt') + '</span>'
};

// ================================================================
// HELPERS
// ================================================================
function getHapoTotalLevel() { return hapoRank * 5 + hapoLevel; }

function getHapoMaxFood() { return (hapoRank + 1) * 4; }

function getHapoCapacity() { return HAPO_CAPACITY[getHapoTotalLevel()] || 500; }

function getHapoProduction() { return HAPO_PRODUCTION[getHapoTotalLevel()] || 0.1; }

function getHapoUpgradePrice() {
    const total = getHapoTotalLevel();
    if (total >= 25) return Infinity;
    return HAPO_LEVEL_PRICES[total + 1] || 10000000;
}

function getHapoFoodStatus() {
    const max = getHapoMaxFood();
    if (hapoFood === 0) return { text: 'دیگه کار نمیکنم', speed: 0 };
    if (hapoFood / max < 0.25) return { text: 'من گشنمه', speed: 0.5 };
    if (hapoFood / max < 0.75) return { text: 'شکمم پره', speed: 1.0 };
    return { text: 'عاشقتم', speed: 1.5 };
}

function getLevelData(l) { return LEVEL_DATA[l] || LEVEL_DATA[1]; }

function getRequiredForLevel(l) { return l >= MAX_LEVEL ? Infinity : getLevelData(l + 1).required; }

function getCooldownForLevel(l) { return getLevelData(l).cooldown; }

function getClawData(l) { return CLAW_DATA[l] || null; }

function getClawCost(l) { const d = getClawData(l); return d ? d.cost : Infinity; }

function getClawCooldown(l) { const d = getClawData(l); return d ? d.cooldown : Infinity; }

function getClawChances(l) {
    const d = getClawData(l);
    return d ? { common: d.common, uncommon: d.uncommon, epic: d.epic || 0, legendary: d.legendary || 0 } : { common: 0, uncommon: 0, epic: 0, legendary: 0 };
}

function getRarityIcon(r) { return RARITY_ICONS[r] || ''; }

function formatHP(n) { return Math.floor(Number(n) || 0).toLocaleString('fa-IR'); }

function formatBankDate(ts) {
    const d = new Date(ts);
    return d.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit', hour12: false }) + ' ' + d.toLocaleDateString('fa-IR');
}

function getNextBankInterestTime() {
    const now = Date.now();
    const d = new Date(now);
    d.setHours(BANK_INTEREST_HOUR, 0, 0, 0);
    if (d.getTime() <= now) d.setDate(d.getDate() + 1);
    return d.getTime();
}

function escapeHTMLText(s) {
    return s.replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
}
