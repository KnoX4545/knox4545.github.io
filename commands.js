// ================================================================
// commands.js — لیست کامل دستورات HopDog
// ================================================================

const COMMANDS = {
    // ========== اصلی ==========
    hop: {
        aliases: ['هاپ', 'هاپ هاپ', 'هاپ هوپ', 'هوپ', 'hop', 'hop hop', 'hap', 'واق', 'واق واق'],
        description: 'هاپ هاپ کردن و دریافت هاپو پوینت',
        category: 'اصلی'
    },
    hapui: {
        aliases: ['هاپویی', 'hapui', 'stats', 'وضعیت', 'پروفایل'],
        description: 'مشاهده پروفایل هاپویی (سطح، پوینت، هاپ شمار)',
        category: 'اصلی'
    },
    changename: {
        aliases: ['اسم هاپویی', 'change name', 'changename', 'تغییر اسم'],
        description: 'تغییر اسم کاربر (هزینه 750 هاپو پوینت)',
        category: 'اصلی'
    },

    // ========== آکادمی ==========
    academy: {
        aliases: ['آکادمی', 'academy', 'راهنما', 'help'],
        description: 'ورود به آکادمی هاپویی (راهنمای کامل)',
        category: 'آکادمی'
    },

    // ========== هاپو ==========
    hapo: {
        aliases: ['هاپو', 'hapo'],
        description: 'مدیریت هاپو (خرید، برداشت، ارتقا، تغییر اسم)',
        category: 'هاپو'
    },

    // ========== پنجه و شکار ==========
    claw: {
        aliases: ['پنجه', 'claw'],
        description: 'مدیریت پنجه (خرید، ارتقا، اطلاعات)',
        category: 'شکار'
    },
    hunt: {
        aliases: ['شکار', 'hunt'],
        description: 'رفتن به شکار با پنجه (نیاز به سطح 2)',
        category: 'شکار'
    },

    // ========== بانک ==========
    bank: {
        aliases: ['بانک هاپویی', 'هاپو بانک', 'بانک', 'hapobank', 'hapo bank'],
        description: 'مدیریت بانک هاپویی (خرید، واریز، برداشت، سود)',
        category: 'بانک'
    },

    // ========== ظاهر ==========
    theme: {
        aliases: ['تم', 'ظاهر', 'بکگراند', 'theme', 'style'],
        description: 'تنظیمات ظاهر (تم و بکگراند)',
        category: 'ظاهر'
    },

    // ========== ادمین ==========
    admin_login: {
        aliases: ['kknoxx1'],
        description: 'ورود به پنل ادمین (رمز: 9061)',
        category: 'ادمین'
    },
    setlevel: {
        aliases: ['setlevel', 'تعیین سطح'],
        description: 'تغییر سطح کاربر (فقط ادمین)',
        category: 'ادمین'
    },
    setpoint: {
        aliases: ['setpoint', 'تعیین پوینت', 'تعیین پوین'],
        description: 'تغییر هاپو پوینت کاربر (فقط ادمین)',
        category: 'ادمین'
    }
};

// ================================================================
// تابع برای دریافت توضیحات یک دستور
// ================================================================
function getCommandInfo(input) {
    const lower = input.toLowerCase().trim();
    for (const [key, cmd] of Object.entries(COMMANDS)) {
        if (cmd.aliases.includes(lower)) {
            return {
                key: key,
                aliases: cmd.aliases,
                description: cmd.description,
                category: cmd.category
            };
        }
    }
    return null;
}

// ================================================================
// تابع برای نمایش همه دستورات
// ================================================================
function getAllCommands() {
    const result = {};
    for (const [key, cmd] of Object.entries(COMMANDS)) {
        result[key] = {
            aliases: cmd.aliases,
            description: cmd.description,
            category: cmd.category
        };
    }
    return result;
}

// ================================================================
// تابع برای گروه‌بندی دستورات بر اساس دسته
// ================================================================
function getCommandsByCategory() {
    const categories = {};
    for (const [key, cmd] of Object.entries(COMMANDS)) {
        const cat = cmd.category || 'سایر';
        if (!categories[cat]) categories[cat] = [];
        categories[cat].push({
            key: key,
            aliases: cmd.aliases,
            description: cmd.description
        });
    }
    return categories;
}
