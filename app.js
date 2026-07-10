// ================================================================
// app.js — منطق اصلی برنامه (chat, game logic, UI)
// ================================================================

// ================================================================
// VARIABLES
// ================================================================
let HopPoint = 0,
    lastHopTime = 0,
    Level = 1,
    HopCount = 0;
let PlayerName = '',
    waitingForName = false,
    waitingForNewName = false;
let changeNamePending = false,
    isAdmin = false,
    waitingForAdminPassword = false;
let clawLevel = 0,
    lastHuntTime = 0,
    huntActive = false,
    huntTimerId = null;
let hapoOwned = false,
    hapoName = '',
    hapoRank = 0,
    hapoLevel = 1;
let hapoFood = 0,
    hapoHarvest = 0,
    hapoLastUpdate = Date.now();
let waitingForHapoName = false;

// BANK
let bankOpened = false,
    bankBalance = 0,
    bankLastInterestAt = 0,
    bankLastInterestAmount = 0;
let waitingForBankDeposit = false,
    waitingForBankWithdraw = false;
let visualTheme = 'default',
    visualBackground = 'stars';

// CHAT
const chat = document.getElementById('chat');
const cmdInput = document.getElementById('cmdInput');

// ================================================================
// RENDER FUNCTIONS
// ================================================================
function renderPremiumIcons(root) {
    if (!root) return;
    const emojiRE = /([\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]\uFE0F?)/gu;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
        acceptNode: function(node) {
            if (!node.nodeValue || !emojiRE.test(node.nodeValue)) return NodeFilter.FILTER_REJECT;
            emojiRE.lastIndex = 0;
            let p = node.parentElement;
            while (p) {
                const tag = p.tagName;
                if (tag === 'SVG' || tag === 'SCRIPT' || tag === 'STYLE' || tag === 'TEXTAREA' || tag === 'INPUT') return NodeFilter.FILTER_REJECT;
                if (p.classList && p.classList.contains('premium-sticker')) return NodeFilter.FILTER_REJECT;
                p = p.parentElement;
            }
            return NodeFilter.FILTER_ACCEPT;
        }
    });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    for (const node of nodes) {
        const span = document.createElement('span');
        span.innerHTML = escapeHTMLText(node.nodeValue).replace(emojiRE, m => premiumSticker(emojiType(m)));
        node.parentNode.replaceChild(span, node);
    }
}

function enhanceMessage(div) {
    if (!div) return;
    requestAnimationFrame(() => {
        renderPremiumIcons(div);
        div.classList.add('fx-shine');
        setTimeout(() => div.classList.remove('fx-shine'), 1000);
    });
}

function setupPremiumRenderer() {
    renderPremiumIcons(document.body);
    const obs = new MutationObserver(mutations => {
        for (const m of mutations) {
            for (const node of m.addedNodes) {
                if (node.nodeType === 1) renderPremiumIcons(node);
            }
        }
    });
    obs.observe(document.body, { childList: true, subtree: true });
}

// ================================================================
// CHAT FUNCTIONS
// ================================================================
function addMessage(type, html) {
    const div = document.createElement('div');
    div.className = 'msg ' + type;
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    if (type === 'system') { div.innerHTML = html; } else { div.innerHTML = html + '<span class="msg-time">' + time + '</span>'; }
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    enhanceMessage(div);
    return div;
}

function addSystem(t) { return addMessage('system', t); }

function addUser(t) { return addMessage('user', t); }

function addBot(t) {
    const div = document.createElement('div');
    div.className = 'msg bot';
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = t + '<span class="msg-time">' + time + '</span>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    enhanceMessage(div);
    return div;
}

function addBotAndReturn(t) {
    const div = document.createElement('div');
    div.className = 'msg bot';
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = t + '<span class="msg-time">' + time + '</span>';
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    enhanceMessage(div);
    return div;
}

function editMessage(div, newHtml) {
    const timeSpan = div.querySelector('.msg-time');
    if (timeSpan) { div.innerHTML = newHtml + '<span class="msg-time">' + timeSpan.textContent + '</span>'; } else { div.innerHTML = newHtml; }
}

function addBotWithGlassButtons(html, confirmCb, cancelCb) {
    const div = document.createElement('div');
    div.className = 'msg bot';
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    const btnContainer = document.createElement('div');
    btnContainer.className = 'glass-buttons';
    const confirmBtn = document.createElement('button');
    confirmBtn.className = 'glass-btn confirm';
    confirmBtn.innerHTML = premiumSticker('check') + ' بله';
    confirmBtn.onclick = function(e) { e.stopPropagation();
        confirmCb();
        btnContainer.remove(); };
    const cancelBtn = document.createElement('button');
    cancelBtn.className = 'glass-btn cancel';
    cancelBtn.innerHTML = premiumSticker('cross') + ' نه';
    cancelBtn.onclick = function(e) { e.stopPropagation();
        cancelCb();
        btnContainer.remove(); };
    btnContainer.appendChild(confirmBtn);
    btnContainer.appendChild(cancelBtn);
    div.innerHTML = html + '<span class="msg-time">' + time + '</span>';
    div.appendChild(btnContainer);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    enhanceMessage(div);
    return div;
}

// ================================================================
// BANK FUNCTIONS (با سود پویا بر اساس موجودی)
// ================================================================
function applyBankInterest() {
    if (!bankOpened) return;
    const now = Date.now();
    if (!bankLastInterestAt) bankLastInterestAt = now;
    let next = new Date(bankLastInterestAt);
    next.setHours(BANK_INTEREST_HOUR, 0, 0, 0);
    if (next.getTime() <= bankLastInterestAt) next.setDate(next.getDate() + 1);
    let safety = 0;
    while (next.getTime() <= now && safety < 60) {
        // سود بر اساس موجودی فعلی محاسبه میشود (3% از موجودی)
        const interest = Math.min(Math.floor(bankBalance * BANK_INTEREST_RATE), BANK_MAX_DAILY_INTEREST);
        if (interest > 0) {
            bankBalance += interest;
            bankLastInterestAmount = interest;
        } else {
            bankLastInterestAmount = 0;
        }
        bankLastInterestAt = next.getTime();
        next.setDate(next.getDate() + 1);
        safety++;
    }
}

function openBankIfNeeded() {
    if (!bankOpened) {
        bankOpened = true;
        bankBalance = 0;
        bankLastInterestAt = Date.now();
        bankLastInterestAmount = 0;
        saveGame();
    }
}

// محاسبه سود لحظه‌ای بر اساس موجودی فعلی
function calculateCurrentInterest() {
    if (!bankOpened || bankBalance <= 0) return 0;
    return Math.min(Math.floor(bankBalance * BANK_INTEREST_RATE), BANK_MAX_DAILY_INTEREST);
}

// ================================================================
// HAPO PRODUCTION UPDATE
// ================================================================
function updateHapoProduction() {
    const now = Date.now();
    const elapsed = (now - hapoLastUpdate) / 1000;
    const capacity = getHapoCapacity();
    const status = getHapoFoodStatus();
    if (hapoFood > 0 && hapoHarvest < capacity) {
        const gained = getHapoProduction() * status.speed * elapsed;
        hapoHarvest = Math.min(capacity, hapoHarvest + gained);
    }
    if (hapoFood > 0) {
        const decay = Math.floor((elapsed / (12 * 3600)) * 6);
        if (decay > 0) hapoFood = Math.max(0, Math.floor(hapoFood - decay));
    }
    hapoLastUpdate = now;
}

// ================================================================
// SAVE / LOAD
// ================================================================
function saveGame() {
    try {
        localStorage.setItem(SAVE_KEY, JSON.stringify({
            HopPoint, lastHopTime, Level, HopCount, PlayerName, hasVisited: true,
            isAdmin, clawLevel, lastHuntTime,
            hapoOwned, hapoName, hapoRank, hapoLevel, hapoFood, hapoHarvest, hapoLastUpdate,
            bankOpened, bankBalance, bankLastInterestAt, bankLastInterestAmount,
            visualTheme, visualBackground
        }));
    } catch (e) {}
}

function loadGame() {
    try {
        const raw = localStorage.getItem(SAVE_KEY);
        if (!raw) return false;
        const d = JSON.parse(raw);
        HopPoint = d.HopPoint || 0;
        lastHopTime = d.lastHopTime || 0;
        Level = d.Level || 1;
        HopCount = d.HopCount || 0;
        PlayerName = d.PlayerName || '';
        isAdmin = d.isAdmin || false;
        clawLevel = d.clawLevel || 0;
        lastHuntTime = d.lastHuntTime || 0;
        hapoOwned = d.hapoOwned || false;
        hapoName = d.hapoName || '';
        hapoRank = d.hapoRank || 0;
        hapoLevel = d.hapoLevel || 1;
        hapoFood = d.hapoFood || getHapoMaxFood();
        hapoHarvest = d.hapoHarvest || 0;
        hapoLastUpdate = d.hapoLastUpdate || Date.now();
        bankOpened = d.bankOpened || false;
        bankBalance = Number(d.bankBalance || 0);
        bankLastInterestAt = Number(d.bankLastInterestAt || 0);
        bankLastInterestAmount = Number(d.bankLastInterestAmount || 0);
        visualTheme = d.visualTheme || 'default';
        visualBackground = d.visualBackground || 'stars';
        return true;
    } catch (e) { return false; }
}

// ================================================================
// LEVEL UP ANIMATION
// ================================================================
function triggerLevelUpAnimation(level) {
    const flash = document.createElement('div');
    flash.className = 'levelup-flash';
    document.body.appendChild(flash);
    setTimeout(() => flash.remove(), 1200);

    const title = document.createElement('div');
    title.className = 'levelup-title';
    title.innerHTML = S.sparkle + '<br/>سطح ' + level + '!';
    enhanceMessage(title);
    document.body.appendChild(title);
    setTimeout(() => title.remove(), 1400);

    const container = document.createElement('div');
    container.className = 'confetti-container';
    document.body.appendChild(container);
    const colors = ['#fbbf24', '#f59e0b', '#ec4899', '#3b82f6', '#22c55e', '#8b5cf6', '#f87171', '#67e8f9'];
    for (let i = 0; i < 40; i++) {
        const el = document.createElement('div');
        el.className = 'confetti';
        el.style.left = Math.random() * 100 + '%';
        el.style.background = colors[Math.floor(Math.random() * colors.length)];
        el.style.width = (Math.random() * 8 + 4) + 'px';
        el.style.height = (Math.random() * 8 + 4) + 'px';
        el.style.borderRadius = Math.random() > 0.5 ? '50%' : '2px';
        el.style.animationDuration = (Math.random() * 2 + 1.5) + 's';
        el.style.animationDelay = (Math.random() * 0.4) + 's';
        container.appendChild(el);
    }
    setTimeout(() => container.remove(), 3200);
}

function triggerHapoJump() {
    const el = document.querySelector('.hapo-jump');
    if (el) { el.classList.remove('hapo-jump');
        void el.offsetWidth;
        el.classList.add('hapo-jump'); }
}

// ================================================================
// VISUAL STYLE
// ================================================================
function applyVisualState() {
    const themes = ['theme-night', 'theme-amber', 'theme-emerald'];
    const bgs = ['bg-calm', 'bg-stars', 'bg-grid', 'bg-nebula'];
    document.body.classList.remove(...themes, ...bgs);
    if (visualTheme && visualTheme !== 'default') document.body.classList.add('theme-' + visualTheme);
    if (visualBackground) document.body.classList.add('bg-' + visualBackground);
}

function visualThemeName(theme) {
    return ({ default: 'اصلی هاپویی', night: 'شب نئونی', amber: 'طلایی گرم', emerald: 'زمردی' })[theme] || theme;
}

function visualBgName(bg) {
    return ({ calm: 'آرام', stars: 'ذره‌های نورانی', grid: 'شبکه‌ای', nebula: 'مه‌آلود' })[bg] || bg;
}

// ================================================================
// WELCOME
// ================================================================
function showWelcome() {
    addSystem(S.welcome + ' به هاپ داگ خوش اومدی');
    addBot(S.game + ' ربات سرگرمی هاپ داگ<br/>' + S.dog + ' یه هاپوی بامزه<br/>کافیه <span class="hop-text">هاپ هاپ</span> کنی تا ' + S.hopoCoin + ' بگیری');
    addBot(S.paw + ' اسمت چیه (یک اسم برایه خودت انتخاب کن)؟');
    waitingForName = true;
}

// ================================================================
// ACADEMY FUNCTIONS
// ================================================================
let academyPage = 1;
const ACADEMY_ITEMS_PER_PAGE = 5;

function showAcademySystemPage(page) {
    academyPage = page || 1;
    const totalPages = Math.ceil(MAX_LEVEL / ACADEMY_ITEMS_PER_PAGE);
    const start = (academyPage - 1) * ACADEMY_ITEMS_PER_PAGE + 1;
    const end = Math.min(academyPage * ACADEMY_ITEMS_PER_PAGE, MAX_LEVEL);
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : سیستم هاپویی ⚙️<br/>┘─ 📚 مطلب : سطح کاربران 🐾<br/><br/>✨ لیست سطح های موجود کاربران ⬇️<br/><br/>';
    for (let i = start; i <= end; i++) {
        const data = getLevelData(i);
        msg += '〰️〰️〰️〰️〰️〰️〰️<br/>⭐️ سطح ' + i + '<br/>';
        if (i === 1) {
            msg += '┘─ 💰 پوینت : ' + data.minPoints + ' - ' + data.maxPoints + ' ' + S.hopoCoin + '<br/>┘─ ⏳ زمان : 5:00<br/>';
        } else {
            msg += '┘─ 🐾 هاپ مورد نیاز : ' + data.required + '<br/>┘─ 💰 پوینت : ' + data.minPoints + ' - ' + data.maxPoints + ' ' + S.hopoCoin + '<br/>┘─ ⏳ زمان : ' + Math.floor(data.cooldown / 60) + ':00<br/>';
            if (data.reward > 0) msg += '┘─ 💝 جایزه ارتقا : ' + data.reward + ' ' + S.hopoCoin + '<br/>';
        }
        if (i === 1) msg += '┘─ 🔓 قابلیت ها : شروع<br/>';
        else {
            const features = data.features || [];
            if (features.length > 0 && !(features.length === 1 && features[0] === 'ارتقا بیشتر')) {
                msg += '┘─ 🔓 قابلیت ها : ' + features.join('، ') + '<br/>';
            }
        }
    }
    msg += '〰️〰️〰️〰️〰️〰️〰️<br/>';
    if (totalPages > 1) {
        msg += '<div class="academy-nav-btns">';
        if (academyPage > 1) msg += '<button class="academy-nav-btn" onclick="showAcademySystemPage(' + (academyPage - 1) + ')">◀ قبلی</button>';
        msg += '<span style="font-size:11px;color:var(--text-muted);opacity:0.5;padding:4px 12px;">صفحه ' + academyPage + '/' + totalPages + '</span>';
        if (academyPage < totalPages) msg += '<button class="academy-nav-btn" onclick="showAcademySystemPage(' + (academyPage + 1) + ')">بعدی ▶</button>';
        msg += '</div>';
    }
    addBot(msg);
}

let academyAnimalPage = 1;
const ACADEMY_ANIMALS_PER_PAGE = 3;

function showAcademyAnimalsPage(page) {
    academyAnimalPage = page || 1;
    const allAnimals = [];
    for (const [rarity, animals] of Object.entries(ANIMALS)) {
        for (const animal of animals) {
            allAnimals.push({ ...animal, rarity });
        }
    }
    const totalPages = Math.ceil(allAnimals.length / ACADEMY_ANIMALS_PER_PAGE);
    const start = (academyAnimalPage - 1) * ACADEMY_ANIMALS_PER_PAGE;
    const end = Math.min(start + ACADEMY_ANIMALS_PER_PAGE, allAnimals.length);
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : سیستم هاپویی ⚙️<br/>┘─ 📚 مطلب : حیوانات 🐾<br/><br/>✨ لیست حیوانات موجود ⬇️<br/><br/>';
    for (let i = start; i < end; i++) {
        const a = allAnimals[i];
        const rarityName = RARITY_NAMES[a.rarity] || 'نامشخص';
        const rarityColor = RARITY_COLORS[a.rarity] || 'gold';
        const avgWeight = Math.round((a.weightMin + a.weightMax) / 2 * 10) / 10;
        msg += '〰️〰️〰️〰️〰️〰️〰️<br/>';
        msg += a.emoji + ' <span class="gold">' + a.name + '</span><br/>';
        msg += '⭐ سطح : <span class="' + rarityColor + '">' + rarityName + '</span><br/>';
        msg += '⚖️ وزن : ' + a.weightMin + ' - ' + a.weightMax + ' کیلو<br/>';
        msg += '💰 ارزش : ~' + Math.round(avgWeight * a.multiplier) + ' ' + S.hopoCoin + '<br/>';
        msg += '🥩 ارزش غذایی : ' + a.nutrition + ' کالری<br/>';
    }
    msg += '〰️〰️〰️〰️〰️〰️〰️<br/>';
    if (totalPages > 1) {
        msg += '<div class="academy-nav-btns">';
        if (academyAnimalPage > 1) msg += '<button class="academy-nav-btn" onclick="showAcademyAnimalsPage(' + (academyAnimalPage - 1) + ')">◀ قبلی</button>';
        msg += '<span style="font-size:11px;color:var(--text-muted);opacity:0.5;padding:4px 12px;">صفحه ' + academyAnimalPage + '/' + totalPages + '</span>';
        if (academyAnimalPage < totalPages) msg += '<button class="academy-nav-btn" onclick="showAcademyAnimalsPage(' + (academyAnimalPage + 1) + ')">بعدی ▶</button>';
        msg += '</div>';
    }
    addBot(msg);
}

let academyClawPage = 1;
const ACADEMY_CLAW_PER_PAGE = 3;

function showAcademyClawPage(page) {
    academyClawPage = page || 1;
    const totalPages = Math.ceil(MAX_CLAW_LEVEL / ACADEMY_CLAW_PER_PAGE);
    const start = (academyClawPage - 1) * ACADEMY_CLAW_PER_PAGE + 1;
    const end = Math.min(academyClawPage * ACADEMY_CLAW_PER_PAGE, MAX_CLAW_LEVEL);
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : سیستم هاپویی ⚙️<br/>┘─ 📚 مطلب : سطح پنجه 🐾<br/><br/>✨ لیست سطح های موجود پنجه ⬇️<br/><br/>';
    for (let i = start; i <= end; i++) {
        const d = getClawData(i);
        if (!d) continue;
        msg += '〰️〰️〰️〰️〰️〰️〰️<br/>⭐️ سطح ' + i + '<br/>';
        msg += '┘─ 💰 هزینه : ' + d.cost + ' ' + S.hopoCoin + '<br/>';
        msg += '┘─ ⏳ زمان : ' + d.cooldown + ':00<br/>';
        msg += '┘─ 🍀 شانس :<br/>  ┘─ معمولی : ' + d.common + '%<br/>  ┘─ کمیاب : ' + d.uncommon + '%<br/>';
        if (d.epic > 0) msg += '  ┘─ حماسی : ' + d.epic + '%<br/>';
        if (d.legendary > 0) msg += '  ┘─ افسانه‌ای : ' + d.legendary + '%<br/>';
    }
    msg += '〰️〰️〰️〰️〰️〰️〰️<br/>';
    if (totalPages > 1) {
        msg += '<div class="academy-nav-btns">';
        if (academyClawPage > 1) msg += '<button class="academy-nav-btn" onclick="showAcademyClawPage(' + (academyClawPage - 1) + ')">◀ قبلی</button>';
        msg += '<span style="font-size:11px;color:var(--text-muted);opacity:0.5;padding:4px 12px;">صفحه ' + academyClawPage + '/' + totalPages + '</span>';
        if (academyClawPage < totalPages) msg += '<button class="academy-nav-btn" onclick="showAcademyClawPage(' + (academyClawPage + 1) + ')">بعدی ▶</button>';
        msg += '</div>';
    }
    addBot(msg);
}

function showAcademy() {
    const academyMsg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/><br/>' + S.dog + ' جایی که هاپوهای کنجکاو جواب سوال‌هاشون رو پیدا میکنن 🐾<br/><br/>لطفا بخش مورد نظر را انتخاب کنید ⬇️';
    const div = document.createElement('div');
    div.className = 'msg bot';
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = academyMsg + '<span class="msg-time">' + time + '</span>';
    const btnContainer = document.createElement('div');
    btnContainer.className = 'glass-buttons';
    const btn1 = document.createElement('button');
    btn1.className = 'glass-btn';
    btn1.innerHTML = '📚 سیستم هاپویی';
    btn1.onclick = function(e) { e.stopPropagation();
        showAcademySubMenu(); };
    const btn2 = document.createElement('button');
    btn2.className = 'glass-btn';
    btn2.innerHTML = '🔓 قابلیت ها';
    btn2.onclick = function(e) { e.stopPropagation();
        showAcademyFeaturesMenu(); };
    const btn3 = document.createElement('button');
    btn3.className = 'glass-btn';
    btn3.innerHTML = '🚀 شروع ماجراجویی';
    btn3.onclick = function(e) { e.stopPropagation();
        showAcademyAdventure(); };
    btnContainer.appendChild(btn1);
    btnContainer.appendChild(btn2);
    btnContainer.appendChild(btn3);
    div.appendChild(btnContainer);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    enhanceMessage(div);
}

function showAcademySubMenu() {
    const msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/><br/>🐾 لطفا بخش مورد نظر را انتخاب کنید ⬇️';
    const div = document.createElement('div');
    div.className = 'msg bot';
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = msg + '<span class="msg-time">' + time + '</span>';
    const btnContainer = document.createElement('div');
    btnContainer.className = 'glass-buttons';
    const btn1 = document.createElement('button');
    btn1.className = 'glass-btn';
    btn1.innerHTML = '⭐ سطح کاربران';
    btn1.onclick = function(e) { e.stopPropagation();
        showAcademySystemPage(1); };
    const btn2 = document.createElement('button');
    btn2.className = 'glass-btn';
    btn2.innerHTML = '🐾 حیوانات';
    btn2.onclick = function(e) { e.stopPropagation();
        showAcademyAnimalsPage(1); };
    const btn3 = document.createElement('button');
    btn3.className = 'glass-btn';
    btn3.innerHTML = '🐾 سطح پنجه';
    btn3.onclick = function(e) { e.stopPropagation();
        showAcademyClawPage(1); };
    btnContainer.appendChild(btn1);
    btnContainer.appendChild(btn2);
    btnContainer.appendChild(btn3);
    div.appendChild(btnContainer);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function showAcademyFeaturesMenu() {
    const msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/><br/>🐾 لطفا بخش مورد نظر را انتخاب کنید ⬇️';
    const div = document.createElement('div');
    div.className = 'msg bot';
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = msg + '<span class="msg-time">' + time + '</span>';
    const btnContainer = document.createElement('div');
    btnContainer.className = 'glass-buttons';
    const btn1 = document.createElement('button');
    btn1.className = 'glass-btn';
    btn1.innerHTML = '🐕 هاپو';
    btn1.onclick = function(e) { e.stopPropagation();
        showAcademyFeaturesHapo(); };
    const btn2 = document.createElement('button');
    btn2.className = 'glass-btn';
    btn2.innerHTML = '🏹 شکار';
    btn2.onclick = function(e) { e.stopPropagation();
        showAcademyFeaturesHunt(); };
    const btn3 = document.createElement('button');
    btn3.className = 'glass-btn';
    btn3.innerHTML = '🏦 بانک';
    btn3.onclick = function(e) { e.stopPropagation();
        showAcademyFeaturesBank(); };
    btnContainer.appendChild(btn1);
    btnContainer.appendChild(btn2);
    btnContainer.appendChild(btn3);
    div.appendChild(btnContainer);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function showAcademyFeaturesHapo() {
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : قابلیت ها 🔓<br/>┘─ 📚 مطلب : هاپو 🐕<br/><br/>🌘 در میان سایه‌های این دنیای مرموز، هیچ‌چیز دلگرم‌کننده‌تر از صدای خُرخُر یک همدم کوچک نیست…<br/><br/>🐕 وقت آن رسیده که صاحب یک <span class="gold">هاپو</span> اختصاصی بشی !<br/>😻 برای اینکه همراه ملوس خودت رو به خونه بیاری، کافیه بگی <span class="gold">هاپو</span><br/><br/>💫 از اون لحظه به بعد، هاپو تو شروع میکنه به تولید جادوییِ ' + S.hopoCoin + ' هاپو پوینت ! حتی وقتی تو خوابی، اون هر ثانیه براشون زحمت میکشه<br/>┘─ 🔺 مثلاً یک هاپو سطح 1 در هر ثانیه 0.1 ' + S.hopoCoin + ' هاپو پوینت تولید میکنه<br/><br/>❗️ اما نگهداری از این موجودات ناز، مسئولیت‌هایی هم داره ⬇️<br/><br/>- 🍖 شکم گرسنه، هاپ هاپ نمیکنه<br/>┘─ ⚡️ هاپو تو برای کار کردن به انرژی نیاز داره. اگه شکمش خالی بشه، تولید پوینت رو متوقف میکنه.<br/>  ┘─ 😋 چطوری سیرش کنی ؟ با همون حیواناتی که از جنگل شکار کردی ! 🐾 هر وعده غذا، هاپو تو رو تا 2 ساعت سرحال و پرانرژی نگه میداره.<br/><br/>- 📦 ظرفیت محدود<br/>┘─ 💰 هاپوها جعبه کوچیکی برای جمع‌آوری پوینت‌ها دارن. اگه <span class="gold">ظرفیت</span> هاپوت پر بشه، دیگه پوینتی اضافه نمیشه تا زمانی که سر بزنی و پوینت‌های جمع‌شده رو از توی جعبه برداری. 🐾<br/><br/>✨ رشد و فراتر از آن<br/>- ⭐️ با بالاتر بردن سطح هاپو، سرعت تولید پوینت و ظرفیت نگهداری اون بیشتر میشه.<br/>- 🌟 اما هر 5 سطح، هاپو تو به یک تحول بزرگ نیاز داره : <span class="gold">ارتقا مقام</span> !<br/>┘─ ❗️ وقتی مقام هاپوت رو بالا میبری، سطح و پوینت‌های داخل جعبش صفر میشه، اما در عوض ⬇️<br/>  ┘─ 1️⃣ سقف سطح‌های بعدی 5 تا بیشتر میشه (مثلاً تا سطح 10 باز میشه)<br/>  ┘─ 2️⃣ حجم شکم هاپوت بزرگتر میشه و میتونه غذای بیشتری رو برای مدت طولانی‌تر ذخیره کنه<br/><br/>💕 یک اسم، یک هویت<br/>- 😺 هاپو تو لایق یک نامِ زیباست. میتونی براش اسم انتخاب کنی و از اون به بعد، به جای کلمه عمومی، با اسم خودش صداش بزنی !<br/><br/>✨ همین حالا هاپو خودت رو بخر، براش حیوان شکار کن و شاهد رشد سرمایه ' + S.hopoCoin + ' خودت باش<br/><br/>❗️ سطح مورد نیاز جهت خرید هاپو : 3';
    addBot(msg);
}

function showAcademyFeaturesHunt() {
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : قابلیت ها 🔓<br/>┘─ 📚 مطلب : شکار هاپویی 🏹<br/><br/>✨ در کنار جنگل‌های اسرارآمیز این جهان، هاپوهای گرسنه و ماجراجو به چیزی بیشتر از یک صدا نیاز دارن…<br/><br/>😻 وقتشه مهارت جدیدی رو امتحان کنی : <span class="gold">شکار</span><br/><br/>😽 برای شروع این ماجراجویی، اول از همه باید بگی <span class="gold">پنجه</span> تا یک پنجه سطح 1 برای خودت بخری<br/>🐾 بعد از اون، کافیه بگی <span class="gold">شکار</span> تا پنجه‌ات رو بندازی توی جنگل تا ببینی چه صید شگفت‌انگیزی انتظارت رو میکشه !<br/><br/>⌛️ وقتی حیوان رو شکار کردی، فقط 60 ثانیه فرصت داری تا یک تصمیم مهم بگیری ⬇️<br/>- 🪙 میتونی اون رو بفروشی و جیبت رو پر از ' + S.hopoCoin + ' هاپو پوینت کنی<br/>- 🍖 یا اگه یک هاپوی ملوس داری، اون رو به عنوان غذا به هاپوت بدی تا شکمش پر شه !<br/><br/>' + S.claw + ' هر زمان که دوباره بگی <span class="gold">پنجه</span>، میتونی سطح پنجه‌ات رو ببینی و اگه خواستی اون رو ارتقا بدی و قوی‌ترش کنی.<br/><br/>⭐️ هر حیوان برای خودش <span class="gold">سطح</span> و همچنین <span class="gold">وزن</span> ⚖️ خاص داره. اگه شانس باهات یار باشه و یه حیوان کمیاب و حسابی سنگین به تور بندازی، قیمت فروشش سر به فلک میکشه<br/><br/>⌛️ ولی خب، شکارچی بودن کار خسته‌کننده‌ای‌ست و بعد از هر بار شکار، به کمی <span class="gold">استراحت</span> ⚡️ نیاز داری تا دوباره انرژی بگیری.<br/><br/>😺 خبر خوب اینجاست که برای کم کردن زمان استراحت و سریع‌تر شکار کردن، یه راه عالی داری ⬇️<br/>1️⃣ پنجه‌ات رو به سطح‌های بالاتر ارتقا بدی 🌟<br/><br/>😼 پس منتظر چی هستی شکارچی ؟<br/>✨ همین حالا پنجه‌ات رو بخر و بزرگترین حیوان دنیای هاپوها رو صید کن<br/><br/>❗️ سطح مورد نیاز جهت شکار : 2';
    addBot(msg);
}

function showAcademyFeaturesBank() {
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : قابلیت ها 🔓<br/>┘─ 📚 مطلب : بانک هاپویی 🏦<br/><br/>🌘 در قلب پر هیاهوی شهر هاپوها، ساختمانی امن و باشکوه وجود داره؛ جایی که میتونی ثروتت رو از خرج شدن بی‌موقع دور نگه داری و بذاری آروم‌آروم رشد کنه.<br/><br/>🏦 به <span class="gold">بانک هاپویی</span> خوش اومدی.<br/>✨ اگر میخوای وارد سیستم بانکی بشی، کافیه بنویسی: <span class="gold">بانک هاپویی</span> یا <span class="gold">هاپو بانک</span><br/><br/>┘─ ❗️ برای استفاده از بانک، باید حداقل سطح 4 باشی و همچنین باید بانک رو با هزینه 5,000 ' + S.hopoCoin + ' خریداری کنی.<br/>┘─ 💰 پولی که واریز میکنی از هاپو پوینت‌های قابل استفاده‌ات کم میشه و تا وقتی برداشت نکنی قابل خرج کردن نیست.<br/><br/>🤑 سود بانکی<br/>┘─ 🛍 هر روز ساعت 06:00، معادل 3٪ از موجودی بانک به حساب بانکی‌ات اضافه میشه.<br/>┘─ 📥 حداکثر سود روزانه 350,000 هاپو پوینت هست؛ حتی اگر موجودی بانک خیلی بیشتر بشه.<br/>┘─ 💰 هرچقدر موجودی بانک بیشتر باشه، سود دریافتی بیشتر خواهد بود.<br/><br/>🐾 با بانک هاپویی، هاپو پوینت‌هات رو امن نگه دار و بذار خودشون رشد کنن.';
    addBot(msg);
}

function showAcademyAdventure() {
    const adventureMsg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/><br/>🐾 لطفا بخش مورد نظر را انتخاب کنید ⬇️';
    const div = document.createElement('div');
    div.className = 'msg bot';
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = adventureMsg + '<span class="msg-time">' + time + '</span>';
    const btnContainer = document.createElement('div');
    btnContainer.className = 'glass-buttons';
    const btn1 = document.createElement('button');
    btn1.className = 'glass-btn';
    btn1.innerHTML = '🐾 هاپ هاپ';
    btn1.onclick = function(e) { e.stopPropagation();
        showAcademyHop(); };
    const btn2 = document.createElement('button');
    btn2.className = 'glass-btn';
    btn2.innerHTML = '🪙 هاپو پوینت';
    btn2.onclick = function(e) { e.stopPropagation();
        showAcademyPoints(); };
    const btn3 = document.createElement('button');
    btn3.className = 'glass-btn';
    btn3.innerHTML = '⭐ تجربه و سطح';
    btn3.onclick = function(e) { e.stopPropagation();
        showAcademyExp(); };
    const btn4 = document.createElement('button');
    btn4.className = 'glass-btn';
    btn4.innerHTML = '🪪 پروفایل';
    btn4.onclick = function(e) { e.stopPropagation();
        showAcademyProfile(); };
    btnContainer.appendChild(btn1);
    btnContainer.appendChild(btn2);
    btnContainer.appendChild(btn3);
    btnContainer.appendChild(btn4);
    div.appendChild(btnContainer);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
}

function showAcademyHop() {
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : شروع ماجراجویی 🐾<br/>┘─ 📚 مطلب : هاپ هاپ 🐾<br/><br/>🌘 در این دنیای بزرگ ، هر هاپوی نازی برای زنده موندن باید اول از همه یک کار مهم انجام بده…<br/>🐾 باید <span class="gold">هاپ هاپ</span> کنه !<br/><br/>هر بار که یک هاپو توی این جهان <span class="gold">هاپ هاپ</span> کنه ، مقداری ' + S.hopoCoin + ' هاپو پوینت دریافت میکنه.<br/>💰 هاپو پوینت همون ارز ارزشمند دنیای هاپوهاست که با اون میتونی قوی‌تر بشی و در مسیر رشد قدم برداری. ✨<br/><br/>اما حواست باشه…<br/>هر هاپو بعد از هر بار هاپ کردن ، به کمی استراحت نیاز داره ⌛️<br/>چون حتی نازترین هاپوها هم برای ادامه ماجراجویی باید نفسی تازه کنن.<br/><br/>خبر خوب اینجاست که اگه خودت سطح بیشتری داشته باشی ، نیاز به استراحت کمتری داری ⌛️<br/>و میتونی خیلی سریعتر دوباره <span class="gold">هاپ هاپ</span> کنی ⚡️<br/><br/>از طرفی اگه میخای با هر بار هاپ کردن ، هاپو پوینت بیشتری به دست بیاری ،<br/>باید سطح خودت رو بالاتر ببری 🌟<br/>هرچی قوی‌تر بشی ، پاداش بیشتری هم دریافت میکنی.<br/><br/>پس منتظر چی هستی ؟ 😼<br/>✨ همین حالا <span class="gold">هاپ هاپ</span> کن و قدم به دنیای شگفت‌انگیز هاپوها بزار 🐾';
    addBot(msg);
}

function showAcademyPoints() {
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : شروع ماجراجویی 🐾<br/>┘─ 📚 مطلب : هاپو پوینت ' + S.hopoCoin + '<br/><br/>' + S.hopoCoin + ' <span class="gold">هاپو پوینت</span> ارز با ارزش دنیای هاپوهاست 🐾<br/>🐈 هرچی بیشتر ازین ارز داشته باشی بیشتر بهت احترام گذاشته میشه و قدرت بیشتری توی دنیای هاپوها داری !<br/><br/>💫 راه های زیادی برای به دست آوردن این ارز وجود داره از جمله ابتدایی ترینشون یعنی <span class="gold">هاپ هاپ</span> کردن 🐾<br/>😽 ولی از طرفی هم راه های زیادی برای خرج کردنشون وجود داره مثلا خرید اولین هاپوی گوگولی خودت و...<br/><br/>📚 مطمئن شو قبل از استفاده ازین ارز با ارزش با زدن <span class="gold">آکادمی</span> تمامی قوانین مهم دنیای هاپوها رو مطالعه کنی ' + S.heart;
    addBot(msg);
}

function showAcademyExp() {
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : شروع ماجراجویی 🐾<br/>┘─ 📚 مطلب : تجربه و سطح ⭐️<br/><br/>💫 همه ی هاپوها از سطح 1 شروع میکنن و به مرور زمان , با کسب تجربه سطح خودشون رو ارتقا میدن ✨<br/><br/>⭐️ برای کسب تجربه و رسیدن به سطح بعدی (ارتقا سطح) باید مقدار مشخصی <span class="gold">هاپ هاپ</span> کنی 🐾<br/>🐾 هر هاپ هاپ ثبت شده برای شما , یک تجربه به حساب میاد<br/><br/>💝 هربار که سطحت ارتقا پیدا کنه , جوایز خفن مانند ' + S.hopoCoin + ' هاپو پوینت دریافت میکنی…<br/>✨ و همچنین با رسیدن به سطح های بالاتر , قابلیت ها و امکانات تازه ای برات باز میشه<br/><br/>🐾 میتونی با نوشتن <span class="gold">هاپویی</span> پروفایل هاپویی خودت رو مشاهده کنی و سطح کنونی خودت و همچنین تعداد باقی مونده هاپ هات تا رسیدن به سطح بعدی رو ببینی';
    addBot(msg);
}

function showAcademyProfile() {
    let msg = S.academy + ' <span class="gold">آکادمی هاپویی</span> ✨<br/>┘─ 🐾 بخش : شروع ماجراجویی 🐾<br/>┘─ 📚 مطلب : پروفایل هاپویی 🪪<br/><br/>🐈 هر هاپوی ناز و گوگولی یه هویت خاص برای خودش داره ✨<br/><br/>🪪 توی پروفایل هاپویی میتونی اطلاعات دقیق خودت رو مشاهده کنی !<br/>🐾 مثلا تعداد هاپ هاپ هاتون یا ' + S.hopoCoin + ' هاپو پوینت هاتون و یا ⭐️ سطحتون و...<br/><br/>🐱 برای مشاهده پروفایل هاپویی خودت بنویس <span class="gold">هاپویی</span>';
    addBot(msg);
}

// ================================================================
// HAPO BANK MENU (با نمایش سود پویا)
// ================================================================
function showHapoBankMenu() {
    if (Level < BANK_REQUIRED_LEVEL) {
        addBot('🏦 <span class="gold">بانک هاپویی از سطح 4 باز میشود</span><br/>⭐ سطح فعلی شما : <span class="gold">' + Level + '</span>');
        return;
    }
    if (!bankOpened) {
        if (HopPoint < BANK_PURCHASE_COST) {
            addBot('🏦 <span class="gold">برای خرید بانک به ' + BANK_PURCHASE_COST + ' ' + S.hopoCoin + ' نیاز داری</span><br/>💰 موجودی شما : ' + Math.round(HopPoint) + ' ' + S.hopoCoin);
            return;
        }
        addBotWithGlassButtons(
            '🏦 <span class="gold">خرید بانک هاپویی</span><br/>💰 هزینه : <span class="gold">' + BANK_PURCHASE_COST + '</span> ' + S.hopoCoin + '<br/>آیا میخوای بانک رو بخری؟',
            function() {
                if (HopPoint < BANK_PURCHASE_COST) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست'); return; }
                HopPoint -= BANK_PURCHASE_COST;
                openBankIfNeeded();
                saveGame();
                addBot('🏦 ✅ <span class="gold">بانک هاپویی خریداری شد</span>');
                showHapoBankMenu();
            },
            function() { addBot('❌ خرید بانک لغو شد'); }
        );
        return;
    }
    applyBankInterest();
    saveGame();
    // محاسبه سود بر اساس موجودی فعلی
    const currentInterest = calculateCurrentInterest();
    let msg = '🏦👤 <span class="gold">بانک هاپویی</span><br/>┘─ 👤 به نام : <span class="gold">' + (PlayerName || 'ناشناس') + '</span><br/>┘─ 💰 موجودی حساب : <span class="gold">' + formatHP(bankBalance) + '</span> ' + S.hopoCoin + '<br/><br/>🤑 سود بانکی<br/>┘─ 🛍 درصد سود : <span class="gold">3%</span><br/>┘─ 📥 سود قابل دریافت : <span class="gold">' + formatHP(currentInterest) + '</span> ' + S.hopoCoin + '<br/>┘─ ⏳ زمان واریز : <span class="gold">' + formatBankDate(getNextBankInterestTime()) + '</span><br/><br/>💡 هرچقدر موجودی بانک بیشتر باشه، سود بیشتری دریافت میکنی<br/><br/>❗️ برای مدیریت حساب بانکی از گزینه های زیر استفاده کنید ⬇️';
    const div = addBotAndReturn(msg);
    const btnContainer = document.createElement('div');
    btnContainer.className = 'glass-buttons';
    const depositBtn = document.createElement('button');
    depositBtn.className = 'glass-btn hapo-btn';
    depositBtn.innerHTML = '➕ واریز';
    depositBtn.onclick = function(e) {
        e.stopPropagation();
        addBot('💰 مبلغ واریزی را وارد کن<br/>موجودی قابل استفاده : <span class="gold">' + formatHP(HopPoint) + '</span> ' + S.hopoCoin);
        waitingForBankDeposit = true;
        waitingForBankWithdraw = false;
    };
    const withdrawBtn = document.createElement('button');
    withdrawBtn.className = 'glass-btn hapo-btn';
    withdrawBtn.innerHTML = '➖ برداشت';
    withdrawBtn.onclick = function(e) {
        e.stopPropagation();
        addBot('💳 مبلغ برداشت را وارد کن<br/>موجودی بانک : <span class="gold">' + formatHP(bankBalance) + '</span> ' + S.hopoCoin);
        waitingForBankWithdraw = true;
        waitingForBankDeposit = false;
    };
    btnContainer.appendChild(depositBtn);
    btnContainer.appendChild(withdrawBtn);
    div.appendChild(btnContainer);
}

// ================================================================
// HAPO MENU
// ================================================================
function showHapoMenu() {
    if (!hapoOwned) {
        if (Level < 3) { addBot(S.hapo + ' <span class="gold">هاپو از سطح 3 باز میشود</span>'); return; }
        const cost = 300;
        if (HopPoint < cost) { addBot(S.hapo + ' <span class="gold">برای خرید هاپو به 300 ' + S.hopoCoin + ' نیاز داری</span>'); return; }
        addBotWithGlassButtons(
            S.hapo + ' <span class="gold">خرید هاپو</span><br/>💰 هزینه : <span class="gold">' + cost + '</span> ' + S.hopoCoin + '<br/>آیا میخوای هاپو بخری؟',
            function() {
                if (HopPoint < 300) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست'); return; }
                HopPoint -= 300;
                hapoOwned = true;
                hapoName = HAPO_NAMES[Math.floor(Math.random() * HAPO_NAMES.length)];
                hapoRank = 0;
                hapoLevel = 1;
                hapoFood = getHapoMaxFood();
                hapoHarvest = 0;
                hapoLastUpdate = Date.now();
                saveGame();
                addBot(S.hapo + ' ✅ <span class="gold">هاپو خریداری شد</span><br/>اسم هاپو : <span class="gold">' + hapoName + '</span>');
                triggerHapoJump();
                showHapoMenu();
            },
            function() { addBot('❌ خرید هاپو لغو شد'); }
        );
        return;
    }
    updateHapoProduction();
    const total = getHapoTotalLevel();
    const maxFood = getHapoMaxFood();
    const capacity = getHapoCapacity();
    const status = getHapoFoodStatus();
    const prod = getHapoProduction();
    const price = getHapoUpgradePrice();
    const isMaxLevel = total >= 25;
    let msg = S.hapo + ' <span class="gold">' + hapoName + '</span><br/>💕 نام : ' + hapoName + '<br/>' + S.food + ' شکم : ' + status.text + ' (' + Math.floor(hapoFood) + '/' + maxFood + ')<br/>🌟 مقام : ' + RANK_NAMES[hapoRank] + ' (' + hapoRank + ')<br/>⭐️ سطح : ' + hapoLevel + '/5<br/>' + S.hopoCoin + ' هاپو پوینت های تولید شده : ' + Math.floor(hapoHarvest) + '<br/>💫 تولید در ثانیه : ' + prod.toFixed(2) + '<br/>📦 ظرفیت : ' + capacity.toLocaleString() + '<br/>';
    if (!isMaxLevel) msg += '💰 هزینه ارتقا : ' + price.toLocaleString();
    else msg += '🏆 مقام نهایی';
    const btnContainer = document.createElement('div');
    btnContainer.className = 'glass-buttons';
    const harvestBtn = document.createElement('button');
    harvestBtn.className = 'glass-btn hapo-btn';
    harvestBtn.innerHTML = S.harvest + ' برداشت';
    harvestBtn.onclick = function(e) {
        e.stopPropagation();
        const amount = Math.floor(hapoHarvest);
        if (amount > 0) { HopPoint += amount;
            hapoHarvest = 0;
            saveGame();
            addBot(S.hopoCoin + ' ✅ <span class="gold">' + amount.toLocaleString() + '</span> هاپو پوینت برداشت شد'); } else { addBot('❌ هیچ هاپو پوینتی برای برداشت نیست'); }
    };
    const upgradeBtn = document.createElement('button');
    upgradeBtn.className = 'glass-btn hapo-btn';
    if (isMaxLevel) {
        upgradeBtn.innerHTML = '🏆 نهایی';
        upgradeBtn.style.opacity = '0.5';
        upgradeBtn.onclick = function() { addBot('🏆 هاپو در بالاترین سطح است'); };
    } else if (hapoLevel >= 5 && hapoRank < 4) {
        upgradeBtn.innerHTML = S.upgrade + ' ارتقا مقام';
        upgradeBtn.onclick = function(e) {
            e.stopPropagation();
            if (HopPoint < price) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست (نیاز به ' + price.toLocaleString() + ' ' + S.hopoCoin + ')'); return; }
            addBotWithGlassButtons(
                '⚠️ <span class="gold">هشدار ارتقا مقام</span><br/>⭐ مقام فعلی : ' + RANK_NAMES[hapoRank] + ' (' + hapoRank + ')<br/>⭐ مقام بعدی : ' + RANK_NAMES[hapoRank + 1] + ' (' + (hapoRank + 1) + ')<br/>📌 سطح فعلی : ' + hapoLevel + '/5<br/>📌 بعد از ارتقا سطح به 1 برمیگردد و همه چیز ریست میشود<br/>💰 هزینه : ' + price.toLocaleString() + ' ' + S.hopoCoin + '<br/>آیا مطمئنی میخوای مقام هاپو رو ارتقا بدی؟',
                function() {
                    if (HopPoint < price) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست'); return; }
                    HopPoint -= price;
                    hapoRank++;
                    hapoLevel = 1;
                    hapoFood = getHapoMaxFood();
                    hapoHarvest = 0;
                    saveGame();
                    addBot(S.sparkle + ' ✅ <span class="gold">مقام هاپو به ' + RANK_NAMES[hapoRank] + ' ارتقا یافت</span>');
                    triggerHapoJump();
                    showHapoMenu();
                },
                function() { addBot('❌ ارتقا مقام لغو شد'); }
            );
        };
    } else {
        upgradeBtn.innerHTML = S.upgrade + ' ارتقا سطح';
        upgradeBtn.onclick = function(e) {
            e.stopPropagation();
            if (HopPoint < price) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست (نیاز به ' + price.toLocaleString() + ' ' + S.hopoCoin + ')'); return; }
            addBotWithGlassButtons(
                S.upgrade + ' آیا مطمئنی میخوای سطح هاپو رو ارتقا بدی؟<br/>💰 هزینه : ' + price.toLocaleString() + ' ' + S.hopoCoin,
                function() {
                    if (HopPoint < price) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست'); return; }
                    HopPoint -= price;
                    hapoLevel++;
                    hapoFood = Math.min(getHapoMaxFood(), Math.floor(hapoFood + 2));
                    saveGame();
                    addBot(S.sparkle + ' ✅ <span class="gold">سطح هاپو به ' + hapoLevel + ' ارتقا یافت</span>');
                    triggerHapoJump();
                    showHapoMenu();
                },
                function() { addBot('❌ ارتقا سطح لغو شد'); }
            );
        };
    }
    const nameBtn = document.createElement('button');
    nameBtn.className = 'glass-btn hapo-btn';
    nameBtn.innerHTML = S.namechange + ' تغییر اسم';
    nameBtn.onclick = function(e) {
        e.stopPropagation();
        if (HopPoint < 750) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست (نیاز به 750 ' + S.hopoCoin + ')'); return; }
        addBotWithGlassButtons(
            S.namechange + ' آیا مطمئنی میخوای اسم هاپو رو عوض کنی؟<br/>💰 هزینه : 750 ' + S.hopoCoin,
            function() {
                if (HopPoint < 750) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست'); return; }
                HopPoint -= 750;
                addBot('✏️ اسم جدید هاپو را وارد کن');
                waitingForHapoName = true;
            },
            function() { addBot('❌ تغییر اسم لغو شد'); }
        );
    };
    btnContainer.appendChild(harvestBtn);
    btnContainer.appendChild(upgradeBtn);
    btnContainer.appendChild(nameBtn);
    const div = addBotAndReturn(msg);
    div.appendChild(btnContainer);
}

// ================================================================
// CLAW MENU
// ================================================================
function showClawMenu() {
    if (Level < 2) { addBot(S.error + ' قابلیت پنجه از سطح 2 باز میشود'); return; }
    if (clawLevel === 0) {
        const cost = getClawCost(1);
        const msg = S.claw + ' <span class="gold">شما پنجه ندارید</span><br/>برای شروع شکار باید پنجه بخرید<br/>💰 هزینه خرید سطح 1 : <span class="gold">' + cost + '</span> ' + S.hopoCoin + '<br/>' + S.clock + ' زمان استراحت : 60:00<br/>🍀 شانس شکار :<br/>  ' + getRarityIcon('common') + ' معمولی : 95%<br/>  ' + getRarityIcon('uncommon') + ' کمیاب : 5%';
        addBotWithGlassButtons(msg, function() { buyClawAction(); }, function() { addBot('❌ خرید پنجه لغو شد'); });
        return;
    }
    const data = getClawData(clawLevel);
    const nextLevel = clawLevel + 1;
    const nextData = getClawData(nextLevel);
    let msg = S.claw + ' <span class="gold">پنجه شما</span><br/>⭐ سطح : <span class="gold">' + clawLevel + '</span><br/>' + S.clock + ' زمان استراحت : ' + String(data.cooldown).padStart(2, '0') + ':00<br/>🍀 شانس شکار :<br/>  ' + getRarityIcon('common') + ' معمولی : ' + data.common + '%<br/>  ' + getRarityIcon('uncommon') + ' کمیاب : ' + data.uncommon + '%<br/>';
    if (data.epic > 0) msg += '  ' + getRarityIcon('epic') + ' حماسی : ' + data.epic + '%<br/>';
    if (data.legendary > 0) msg += '  ' + getRarityIcon('legendary') + ' افسانه‌ای : ' + data.legendary + '%<br/>';
    if (nextData) {
        msg += '〰️〰️〰️〰️〰️〰️〰️<br/>' + S.upgrade + ' ارتقا به سطح ' + nextLevel + '<br/>💰 هزینه : <span class="gold">' + nextData.cost + '</span> ' + S.hopoCoin;
        addBotWithGlassButtons(msg, function() { upgradeClawAction(nextLevel, nextData.cost); }, function() { addBot('❌ ارتقا پنجه لغو شد'); });
    } else {
        msg += '〰️〰️〰️〰️〰️〰️〰️<br/>🏆 سطح نهایی';
        addBot(msg);
    }
}

function buyClawAction() {
    const cost = getClawCost(1);
    if (HopPoint < cost) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست (نیاز به ' + cost + ' ' + S.hopoCoin + ')'); return; }
    HopPoint -= cost;
    clawLevel = 1;
    saveGame();
    addBot(S.claw + ' ✅ <span class="gold">پنجه خریداری شد</span><br/>اکنون میتونی با زدن <span class="gold">شکار</span> به شکار بری<br/>برای ارتقا پنجه، دوباره <span class="gold">پنجه</span> بزن');
}

function upgradeClawAction(nextLevel, cost) {
    if (HopPoint < cost) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست (نیاز به ' + cost + ' ' + S.hopoCoin + ')'); return; }
    HopPoint -= cost;
    clawLevel = nextLevel;
    saveGame();
    addBot(S.upgrade + ' ✅ <span class="gold">پنجه به سطح ' + clawLevel + ' ارتقا یافت</span> ' + S.sparkle);
}

// ================================================================
// HUNTING
// ================================================================
function getRandomAnimal() {
    if (clawLevel === 0) return null;
    const chances = getClawChances(clawLevel);
    const rand = Math.random() * 100;
    let rarity;
    if (rand < chances.common) rarity = 'common';
    else if (rand < chances.common + chances.uncommon) rarity = 'uncommon';
    else if (rand < chances.common + chances.uncommon + chances.epic) rarity = 'epic';
    else rarity = 'legendary';
    const animals = ANIMALS[rarity];
    const animal = animals[Math.floor(Math.random() * animals.length)];
    const weight = Math.round((animal.weightMin + Math.random() * (animal.weightMax - animal.weightMin)) * 10) / 10;
    const value = Math.round(weight * animal.multiplier);
    return { ...animal, rarity, rarityName: RARITY_NAMES[rarity], rarityIcon: getRarityIcon(rarity), weight, value: Math.round(value) };
}

function doHunt() {
    if (Level < 2) { addBot(S.error + ' قابلیت شکار از سطح 2 باز میشود'); return; }
    if (clawLevel === 0) {
        addBot(S.claw + ' <span class="gold">شما پنجه ندارید</span><br/>برای شکار باید پنجه بخرید<br/>💰 هزینه خرید سطح 1 : <span class="gold">' + getClawCost(1) + '</span> ' + S.hopoCoin + '<br/>با زدن <span class="gold">پنجه</span> اطلاعات بیشتری ببین');
        return;
    }
    if (huntActive) { addBot(S.clock + ' در حال شکار هستی صبر کن'); return; }
    const cooldown = getClawCooldown(clawLevel) * 60 * 1000;
    const now = Date.now();
    if (lastHuntTime > 0 && (now - lastHuntTime) < cooldown) {
        const remaining = cooldown - (now - lastHuntTime);
        const minutes = Math.floor(remaining / 60000);
        const seconds = Math.floor((remaining % 60000) / 1000);
        const timeStr = String(minutes).padStart(2, '0') + ':' + String(seconds).padStart(2, '0');
        addBot(S.clock + ' تا شکار بعدی ' + timeStr + ' مونده');
        return;
    }
    huntActive = true;
    lastHuntTime = now;
    const animMsg = addBotAndReturn(S.huntAnim + ' <span class="gold">در حال شکار</span> <span class="hunt-dots">...</span>');
    setTimeout(() => {
        const animal = getRandomAnimal();
        if (!animal) { editMessage(animMsg, S.error + ' خطا در شکار');
            huntActive = false; return; }
        const rarityColor = RARITY_COLORS[animal.rarity] || 'gold';
        const resultHtml = S.hunt + ' <span class="gold">شما موفق به شکار شدید</span><br/>' + animal.emoji + ' <span class="gold">' + animal.name + '</span><br/>⭐ سطح : <span class="' + rarityColor + '">' + animal.rarityName + ' ' + animal.rarityIcon + '</span><br/>⚖️ وزن : <span class="gold">' + animal.weight + '</span> کیلو<br/>' + S.hopoCoin + ' ارزش : <span class="gold">' + animal.value + '</span> ' + S.hopoCoin + '<br/>' + S.food + ' ارزش غذایی : <span class="gold">' + animal.nutrition + '</span> کالری<br/>' + S.clock + ' 60 ثانیه فرصت انتخاب دارید';
        editMessage(animMsg, resultHtml);
        const btnContainer = document.createElement('div');
        btnContainer.className = 'glass-buttons';
        const sellBtn = document.createElement('button');
        sellBtn.className = 'glass-btn sell';
        sellBtn.innerHTML = S.hopoCoin + ' فروش';
        sellBtn.onclick = function(e) {
            e.stopPropagation();
            if (huntTimerId) { clearTimeout(huntTimerId);
                huntTimerId = null; }
            const confirmDiv = addBotAndReturn(S.hopoCoin + ' آیا مطمئنی میخوای <span class="gold">' + animal.name + '</span> رو به قیمت <span class="gold">' + animal.value + '</span> ' + S.hopoCoin + ' بفروشی؟');
            const confirmContainer = document.createElement('div');
            confirmContainer.className = 'glass-buttons';
            const confirmBtn = document.createElement('button');
            confirmBtn.className = 'glass-btn confirm';
            confirmBtn.innerHTML = premiumSticker('check') + ' بله';
            confirmBtn.onclick = function(e2) {
                e2.stopPropagation();
                HopPoint = Math.round((HopPoint + animal.value) * 100) / 100;
                const soldName = animal.name,
                    soldValue = animal.value;
                saveGame();
                editMessage(confirmDiv, S.hopoCoin + ' ✅ <span class="gold">' + soldName + '</span> فروخته شد 💰 <span class="gold">' + soldValue + '</span> ' + S.hopoCoin);
                addBot(S.hopoCoin + ' هاپو پوینت هات : <span class="gold">' + Math.round(HopPoint) + '</span> ' + S.hopoCoin);
                btnContainer.remove();
                huntActive = false;
            };
            const cancelBtn = document.createElement('button');
            cancelBtn.className = 'glass-btn cancel';
            cancelBtn.innerHTML = premiumSticker('cross') + ' نه';
            cancelBtn.onclick = function(e2) {
                e2.stopPropagation();
                editMessage(confirmDiv, '❌ فروش لغو شد');
                btnContainer.remove();
                huntActive = false;
            };
            confirmContainer.appendChild(confirmBtn);
            confirmContainer.appendChild(cancelBtn);
            confirmDiv.appendChild(confirmContainer);
            btnContainer.remove();
        };
        const feedBtn = document.createElement('button');
        feedBtn.className = 'glass-btn hapo-btn';
        feedBtn.innerHTML = S.food + ' بده به هاپو';
        feedBtn.onclick = function(e) {
            e.stopPropagation();
            if (!hapoOwned) { addBot(S.error + ' شما هاپو ندارید'); return; }
            const maxFood = getHapoMaxFood();
            if (hapoFood >= maxFood) { addBot(S.food + ' هاپو سیر است'); return; }
            const feedAmount = animal.nutrition;
            const newFood = Math.min(maxFood, Math.floor(hapoFood + feedAmount));
            const actual = newFood - Math.floor(hapoFood);
            hapoFood = newFood;
            saveGame();
            addBot(S.food + ' ✅ <span class="gold">' + actual + '</span> غذا به هاپو داده شد');
            triggerHapoJump();
            btnContainer.remove();
            huntActive = false;
        };
        btnContainer.appendChild(sellBtn);
        btnContainer.appendChild(feedBtn);
        animMsg.appendChild(btnContainer);
        huntTimerId = setTimeout(() => {
            if (huntActive) {
                editMessage(animMsg, S.error + ' <span class="red">حیوان فرار کرد</span>');
                const btns = animMsg.querySelector('.glass-buttons');
                if (btns) btns.remove();
                huntActive = false;
                huntTimerId = null;
            }
        }, 60000);
        saveGame();
    }, 2000);
}

// ================================================================
// HOPUI
// ================================================================
function showHopUI() {
    const required = getRequiredForLevel(Level);
    let msg = '📊 <span class="bold">وضعیت هاپویی شما</span><br/>👤 کاربر: <span class="gold">' + (PlayerName || 'ناشناس') + '</span>';
    if (isAdmin) msg += ' ' + S.admin + ' <span class="gold">[ادمین]</span>';
    msg += '<br/>' + S.star + ' سطح : <span class="gold">' + Level + '</span><br/>';
    if (Level < MAX_LEVEL) msg += '🐾 هاپ شمار : <span class="gold">' + HopCount + '</span>/<span class="gold">' + required + '</span><br/>';
    else msg += '🐾 هاپ شمار : <span class="gold">' + HopCount + '</span> (سطح نهایی) 🏆<br/>';
    msg += S.hopoCoin + ' هاپو پوینت هات : <span class="gold">' + Math.round(HopPoint) + '</span>';
    addBot(msg);
}

// ================================================================
// HOP
// ================================================================
function doHop() {
    const now = Date.now();
    const cooldown = getCooldownForLevel(Level);
    if (lastHopTime > 0 && (now - lastHopTime) / 1000 < cooldown) {
        const remaining = cooldown - ((now - lastHopTime) / 1000);
        const minutes = Math.floor(remaining / 60);
        const seconds = Math.floor(remaining % 60);
        const timeMsg = minutes > 0 ? minutes + ':' + (seconds < 10 ? '0' : '') + seconds : seconds + ' ثانیه';
        addBot(S.clock + ' هنوز هاپت نمیاد ...<br/>باید ' + timeMsg + ' صبر کنی');
        return;
    }
    const levelData = getLevelData(Level);
    const earned = Math.floor(Math.random() * (levelData.maxPoints - levelData.minPoints + 1)) + levelData.minPoints;
    HopPoint += earned;
    lastHopTime = now;
    HopCount += 1;
    const colors = ['gold', 'pink', 'blue', 'green', 'purple', 'red', 'cyan'];
    const c1 = colors[Math.floor(Math.random() * colors.length)];
    addBot(S.paw + ' <span class="' + c1 + '">' + earned + '</span> هاپو پوینت گرفتی ' + S.sparkle + '<br/>' + S.hopoCoin + ' هاپو پوینت هات : <span class="' + c1 + '">' + Math.round(HopPoint) + '</span><br/>' + S.clock + ' بعد از ' + Math.floor(cooldown / 60) + ':00 میتونی دوباره <span class="hop-text">هاپ هاپ</span> کنی');
    const required = getRequiredForLevel(Level);
    if (Level < MAX_LEVEL && HopCount >= required) { HopCount = 0;
        Level += 1;
        doLevelUp(); }
    saveGame();
}

// ================================================================
// LEVEL UP
// ================================================================
function doLevelUp() {
    const reward = getLevelData(Level).reward;
    HopPoint += reward;
    const features = getLevelData(Level).features || [];
    let msg = S.levelup + ' <span class="gold">تبریک سطح شما به ' + Level + ' ارتقا یافت</span> ' + S.crown + '<br/>〰️〰️〰️〰️〰️〰️〰️<br/>🔓 قابلیت های باز شده ⬇️<br/>';
    if (features.length > 0 && !(features.length === 1 && features[0] === 'ارتقا بیشتر')) {
        msg += features.map(f => '• ' + f).join('<br/>');
    } else if (features.length === 0 || (features.length === 1 && features[0] === 'ارتقا بیشتر')) {
        msg += '• رشد و ارتقا بیشتر';
    }
    msg += '<br/>〰️〰️〰️〰️〰️〰️〰️<br/>' + S.hopoCoin + ' جایزه ارتقا سطح : <span class="gold">' + reward + '</span> ' + S.hopoCoin + '<br/>' + S.hopoCoin + ' هاپو پوینت هات : <span class="gold">' + Math.round(HopPoint) + '</span> ' + S.hopoCoin;
    addBot(msg);
    triggerLevelUpAnimation(Level);
    saveGame();
}

// ================================================================
// ADMIN
// ================================================================
let waitingForAdminCommand = false,
    adminCommandType = '';

function adminSetLevel() { if (!isAdmin) { addBot(S.error + ' شما ادمین نیستید'); return; }
    addBot('سطح جدید را وارد کن (1 تا 20):');
    waitingForAdminCommand = true;
    adminCommandType = 'setlevel'; }

function adminSetPoint() { if (!isAdmin) { addBot(S.error + ' شما ادمین نیستید'); return; }
    addBot(S.hopoCoin + ' جدید را وارد کن:');
    waitingForAdminCommand = true;
    adminCommandType = 'setpoint'; }

function startAdminLogin() { addBot(S.shield + ' رمز ادمین را وارد کن');
    waitingForAdminPassword = true; }

// ================================================================
// CHANGE NAME
// ================================================================
function startChangeName() {
    if (HopPoint < 750) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست برای تغییر اسم (نیاز به 750 ' + S.hopoCoin + ')'); return; }
    changeNamePending = true;
    addBotWithGlassButtons(S.namechange + ' <span class="gold">تغییر اسم</span><br/>💰 هزینه : <span class="gold">750</span> ' + S.hopoCoin + '<br/>آیا مطمئنی میخوای اسمت رو عوض کنی؟',
        function() {
            if (HopPoint < 750) { addBot(S.error + ' ' + S.hopoCoin + ' کافی نیست (نیاز به 750 ' + S.hopoCoin + ')');
                changeNamePending = false; return; }
            HopPoint -= 750;
            saveGame();
            addBot('✏️ اسم جدید خود را وارد کن');
            waitingForNewName = true;
            changeNamePending = false;
        },
        function() { addBot('❌ تغییر اسم لغو شد');
            changeNamePending = false; }
    );
}

// ================================================================
// VISUAL MENU
// ================================================================
function setVisualTheme(theme) {
    visualTheme = theme || 'default';
    applyVisualState();
    saveGame();
    addBot(S.sparkle + ' تم روی <span class="gold">' + visualThemeName(visualTheme) + '</span> تنظیم شد');
}

function setVisualBackground(bg) {
    visualBackground = bg || 'stars';
    applyVisualState();
    saveGame();
    addBot(S.sparkle + ' بکگراند روی <span class="gold">' + visualBgName(visualBackground) + '</span> تنظیم شد');
}

function showVisualMenu() {
    const div = document.createElement('div');
    div.className = 'msg bot';
    const time = new Date().toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    div.innerHTML = S.sparkle + ' <span class="gold">تنظیمات ظاهر هاپویی</span><br/>از گزینه‌های زیر برای تغییر تم و بکگراند استفاده کن.<span class="msg-time">' + time + '</span>';
    const box = document.createElement('div');
    box.className = 'glass-buttons';
    const items = [
        ['تم اصلی', function() { setVisualTheme('default'); }],
        ['تم شب', function() { setVisualTheme('night'); }],
        ['تم طلایی', function() { setVisualTheme('amber'); }],
        ['تم زمردی', function() { setVisualTheme('emerald'); }],
        ['بکگراند آرام', function() { setVisualBackground('calm'); }],
        ['بکگراند ستاره‌ای', function() { setVisualBackground('stars'); }],
        ['بکگراند شبکه‌ای', function() { setVisualBackground('grid'); }],
        ['بکگراند مه‌آلود', function() { setVisualBackground('nebula'); }]
    ];
    for (const [label, cb] of items) {
        const btn = document.createElement('button');
        btn.className = 'glass-btn hapo-btn';
        btn.innerHTML = S.sparkle + ' ' + label;
        btn.onclick = function(e) { e.stopPropagation();
            cb(); };
        box.appendChild(btn);
    }
    div.appendChild(box);
    chat.appendChild(div);
    chat.scrollTop = chat.scrollHeight;
    enhanceMessage(div);
}

// ================================================================
// PROCESS COMMAND
// ================================================================
function processCommand(cmd) {
    addUser(cmd);
    const t = cmd.trim();

    // Waiting states
    if (waitingForName) { PlayerName = t;
        waitingForName = false;
        saveGame();
        addBot('اسم شما ثبت شد ' + S.paw + ' <span class="gold">' + PlayerName + '</span>'); return; }
    if (waitingForNewName) {
        if (t.length > 0) { const old = PlayerName;
            PlayerName = t;
            waitingForNewName = false;
            saveGame();
            addBot('✅ اسم شما از <span class="gold">' + old + '</span> به <span class="gold">' + PlayerName + '</span> تغییر یافت ' + S.paw); } else { addBot('❌ اسم نمی‌تواند خالی باشد'); }
        return;
    }
    if (waitingForHapoName) {
        if (t.length > 0) { hapoName = t;
            waitingForHapoName = false;
            saveGame();
            addBot('✅ اسم هاپو به <span class="gold">' + hapoName + '</span> تغییر یافت ' + S.hapo);
            triggerHapoJump();
            showHapoMenu(); } else { addBot('❌ اسم نمی‌تواند خالی باشد'); }
        return;
    }
    if (waitingForBankDeposit || waitingForBankWithdraw) {
        const amount = parseInt(t.replace(/[,،\s]/g, ''), 10);
        if (isNaN(amount) || amount <= 0) {
            addBot(S.error + ' لطفاً یک مبلغ معتبر وارد کن');
            waitingForBankDeposit = false;
            waitingForBankWithdraw = false;
            return;
        }
        if (!bankOpened) {
            addBot(S.error + ' ابتدا باید بانک را خریداری کنید');
            waitingForBankDeposit = false;
            waitingForBankWithdraw = false;
            return;
        }
        applyBankInterest();
        if (waitingForBankDeposit) {
            if (HopPoint < amount) { addBot(S.error + ' موجودی قابل استفاده کافی نیست'); } else { HopPoint -= amount;
                bankBalance += amount;
                addBot('🏦 ✅ <span class="gold">' + formatHP(amount) + '</span> ' + S.hopoCoin + ' به بانک واریز شد<br/>💰 موجودی بانک : <span class="gold">' + formatHP(bankBalance) + '</span>'); }
        } else if (waitingForBankWithdraw) {
            if (bankBalance < amount) { addBot(S.error + ' موجودی بانک کافی نیست'); } else { bankBalance -= amount;
                HopPoint += amount;
                addBot('🏦 ✅ <span class="gold">' + formatHP(amount) + '</span> ' + S.hopoCoin + ' از بانک برداشت شد<br/>💰 موجودی قابل استفاده : <span class="gold">' + formatHP(HopPoint) + '</span>'); }
        }
        waitingForBankDeposit = false;
        waitingForBankWithdraw = false;
        saveGame();
        return;
    }
    if (waitingForAdminPassword) {
        if (t === '9061') { isAdmin = true;
            saveGame();
            addBot(S.admin + ' <span class="gold">تبریک! شما ادمین شدید</span> 🛡️'); } else { addBot(S.error + ' رمز اشتباه است'); }
        waitingForAdminPassword = false;
        return;
    }
    if (waitingForAdminCommand) {
        const val = parseInt(t);
        if (isNaN(val) || val < 0) { addBot(S.error + ' لطفاً یک عدد معتبر وارد کن');
            waitingForAdminCommand = false;
            adminCommandType = ''; return; }
        if (adminCommandType === 'setlevel') {
            if (val >= 1 && val <= MAX_LEVEL) { Level = val;
                saveGame();
                addBot('✅ سطح شما به <span class="gold">' + Level + '</span> تغییر یافت'); } else { addBot(S.error + ' سطح باید بین 1 تا ' + MAX_LEVEL + ' باشد'); }
        } else if (adminCommandType === 'setpoint') {
            HopPoint = val;
            saveGame();
            addBot('✅ ' + S.hopoCoin + ' شما به <span class="gold">' + HopPoint + '</span> تغییر یافت');
        }
        waitingForAdminCommand = false;
        adminCommandType = '';
        return;
    }

    // Command matching using commands.js
    const lower = t.toLowerCase();
    const cmdInfo = getCommandInfo(lower);

    if (cmdInfo) {
        switch (cmdInfo.key) {
            case 'hop':
                doHop();
                break;
            case 'hapui':
                showHopUI();
                break;
            case 'changename':
                startChangeName();
                break;
            case 'academy':
                showAcademy();
                break;
            case 'hapo':
                showHapoMenu();
                break;
            case 'claw':
                showClawMenu();
                break;
            case 'hunt':
                doHunt();
                break;
            case 'bank':
                showHapoBankMenu();
                break;
            case 'theme':
                showVisualMenu();
                break;
            case 'admin_login':
                startAdminLogin();
                break;
            case 'setlevel':
                adminSetLevel();
                break;
            case 'setpoint':
                adminSetPoint();
                break;
            default:
                addBot(S.error + ' دستور اشتباه است');
        }
    } else {
        // Check if it's a hapo name (dynamic)
        if (hapoOwned && lower === hapoName.toLowerCase()) {
            showHapoMenu();
        } else {
            addBot(S.error + ' دستور اشتباه است');
        }
    }
}

function sendCmd() {
    const text = cmdInput.value.trim();
    if (!text) return;
    cmdInput.value = '';
    processCommand(text);
    cmdInput.focus();
}

// ================================================================
// INIT
// ================================================================
const hasSavedData = loadGame();
applyVisualState();
setupPremiumRenderer();
if (!hasSavedData || !PlayerName) showWelcome();
cmdInput.focus();
setInterval(saveGame, 3000);
window.addEventListener('beforeunload', saveGame);
setInterval(function() {
    if (hapoOwned) updateHapoProduction();
    if (bankOpened) applyBankInterest();
    saveGame();
}, 10000);
