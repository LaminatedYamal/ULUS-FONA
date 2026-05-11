const BRANDING = {
  "Lusófona Lisboa": { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
  "Lusófona Porto":  { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
  "IPLUSO":          { hex: "#A20736", bgSub: "#780528", logo: "https://i.postimg.cc/fLR0Nksd/Logo-IPLUSO-ECIA-2.png" },
  "ISLA Gaia":       { hex: "#BB969B", bgSub: "#9C797E", logo: "https://i.postimg.cc/kGyZtjz7/Versa-o-Horizontal-Branco-2048x853.png" },
  "ISMAT":           { hex: "#7AC7CD", bgSub: "#5CA2A8", logo: "https://i.postimg.cc/0jpvXd31/logo-ISMAT-02.png" },
  "Grupo Lusófona":  { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" }
};

let courses = [];
let activeCourseId = null;

async function init() {
    initLanguage(); // Load language preference
    await checkAuth(); // Await data loading
    
    // Load cached sync info immediately for better UX
    const cachedSync = localStorage.getItem('hub_last_sync');
    if (cachedSync) {
        const infoEl = document.getElementById('last-sync-info');
        if (infoEl) infoEl.innerText = cachedSync;
    }

    const searchInput = document.getElementById('keyword-search-header');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            renderTablesFromHeader(e.target.value);
        });
    }

    const gscUpload = document.getElementById('gsc-upload');
    if (gscUpload) gscUpload.addEventListener('change', (e) => handleFileUpload(e, 'gsc'));
    
    const adsUpload = document.getElementById('ads-upload');
    if (adsUpload) adsUpload.addEventListener('change', (e) => handleFileUpload(e, 'ads'));
    
    const rankingsUpload = document.getElementById('rankings-upload');
    if (rankingsUpload) rankingsUpload.addEventListener('change', (e) => handleFileUpload(e, 'rankings'));
    
    loadData(); 
    initTheme();
    initGreeting();

    // Default View: Show Landing Hero
    const landingView = document.getElementById("landing-view");
    const dashboardView = document.getElementById("dashboard-view");
    if (landingView) landingView.style.display = "flex";
    if (dashboardView) dashboardView.style.display = "none";
}


function initGreeting(nameOverride) {
    const userName = nameOverride || localStorage.getItem('hub_user_name');
    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) {
        const t = TRANSLATIONS[currentLang || 'en'];
        const hello = t["greeting"] || (currentLang === 'pt' ? 'Olá' : 'Hello');
        if (userName) {
            greetingEl.textContent = `${hello}, ${userName}!`;
        } else {
            greetingEl.textContent = `${hello}!`;
        }
    }
}

function initTheme() {
    const saved = localStorage.getItem('antigravity_theme');
    if (saved === 'light') {
        document.body.classList.add('light-mode');
        updateThemeIcons(true);
    }
}

function toggleTheme() {
    const isLight = document.body.classList.toggle('light-mode');
    localStorage.setItem('antigravity_theme', isLight ? 'light' : 'dark');
    updateThemeIcons(isLight);
}

function updateThemeIcons(isLight) {
    document.querySelector('.sun-icon').style.display = isLight ? 'none' : 'block';
    document.querySelector('.moon-icon').style.display = isLight ? 'block' : 'none';
}

const TRANSLATIONS = {
    en: {
        "greeting": "Hello",
        "select-course": "Select a Course",
        "global-analysis": "Global SEO & Ads Keyword Analysis",
        "search-placeholder": "Search keywords...",
        "browsing": "Browsing",
        "at": "at",
        "choose-course": "Choose a Course...",
        "quick-switch": "Quick Switch...",
        "degree-mapping": {
            'TeSP': 'CTeSP',
            'Licenciatura': 'Bachelor\'s',
            'Mestrado Integrado': 'Integrated Master\'s',
            'Mestrado': 'Master\'s',
            'Doutoramento': 'Doctorate',
            'Pós-Graduação': 'Post-Graduate',
            'Formações': 'Training'
        },
        "parity": "Keyword Parity",
        "gsc-title": "GSC Keywords",
        "ads-title": "Ads Keywords",
        "organic-caps": "Organic Gaps",
        "organic-header": "Search Console (Organic)",
        "ads-header": "Google Ads (Active)",
        "rankings-header": "Organic Search Rankings",
        "keyword": "Keyword",
        "clicks": "Clicks",
        "ads-gap": "Ads Gap",
        "synergy": "Synergy",
        "rank": "Current Rank",
        "trend": "3-Month Trend",
        "url": "Ranking URL",
        "degree-mapping": {
            'TeSP': 'Vocational Training (TeSP)',
            'Licenciatura': "Bachelor's Degrees",
            'Mestrado Integrado': 'Integrated Masters',
            'Mestrado': "Master's Degrees",
            'Doutoramento': 'Doctorates',
            'Pós-Graduação': 'Post-Graduate',
            'Formações': 'Training / Other'
        },
        "sync": "Data Sync",
        "sync-team": "🚀 Sync to Team",
        "system-active": "System Active",
        "loading": "Loading sync status...",
        "search-courses": "Search courses...",
        "search-keywords": "Search keywords...",
        "welcome-subtext": "Select a degree category from the sidebar to begin",
        "premium-tools": "Premium Tools",
        "live-ads-monitor": "📊 Live Ads Monitor",
        "data-sync": "Data Sync",
        "brand-name": "Lusófona Group",
        "tip-gsc": "Upload Search Console CSV to update organic keywords.",
        "tip-sync": "Push your local changes to the global team database.",
        "tip-reset": "Reset connection and clear local cache.",
        "tip-monitor": "View real-time performance of all active campaigns.",
        "tip-lang": "Switch between English and Portuguese.",
        "tip-theme": "Switch between Dark and Light mode.",
        "tip-account": "View user details or log out."
    },
    pt: {
        "greeting": "Olá",
        "select-course": "Selecionar um Curso",
        "global-analysis": "Análise Global de Keywords SEO & Ads",
        "search-placeholder": "Procurar keywords...",
        "browsing": "A ver cursos de",
        "at": "na",
        "choose-course": "Escolher um Curso...",
        "quick-switch": "Troca Rápida...",
        "degree-mapping": {
            'TeSP': 'CTeSP',
            'Licenciatura': 'Licenciaturas',
            'Mestrado Integrado': 'Mestrados Integrados',
            'Mestrado': 'Mestrados',
            'Doutoramento': 'Doutoramentos',
            'Pós-Graduação': 'Pós-Graduações',
            'Formações': 'Formações'
        },
        "parity": "Paridade de Keywords",
        "gsc-title": "Keywords GSC",
        "ads-title": "Keywords Ads",
        "organic-caps": "Gaps Orgânicos",
        "organic-header": "Search Console (Orgânico)",
        "ads-header": "Google Ads (Ativo)",
        "rankings-header": "Rankings de Pesquisa Orgânica",
        "keyword": "Palavra-Chave",
        "clicks": "Cliques",
        "ads-gap": "Gap de Ads",
        "synergy": "Sinergia",
        "rank": "Rank Atual",
        "trend": "Tendência 3 Meses",
        "url": "URL de Ranking",
        "sync": "Sincronização Dados",
        "sync-team": "🚀 Sincronizar Equipa",
        "system-active": "Sistema Ativo",
        "loading": "A carregar status...",
        "search-courses": "Procurar cursos...",
        "search-keywords": "Procurar keywords...",
        "welcome-subtext": "Selecione uma categoria de curso na barra lateral para começar",
        "premium-tools": "Ferramentas Premium",
        "live-ads-monitor": "📊 Monitor de Ads em Direto",
        "data-sync": "Sincronização de Dados",
        "brand-name": "Grupo Lusófona",
        "tip-gsc": "Carregar CSV do Search Console para atualizar keywords orgânicas.",
        "tip-sync": "Sincronizar as suas alterações locais com a base de dados da equipa.",
        "tip-reset": "Reiniciar ligação e limpar cache local.",
        "tip-monitor": "Ver desempenho em tempo real de todas as campanhas ativas.",
        "tip-lang": "Alternar entre Inglês e Português.",
        "tip-theme": "Alternar entre modo Claro e Escuro.",
        "tip-account": "Ver detalhes do utilizador ou terminar sessão."
    }
};

function renderTablesFromHeader(q) {
    const course = courses.find(c => c.id === activeCourseId);
    if (!course) return;
    
    const term = q.toLowerCase().trim();
    const filterFn = k => k.term.toLowerCase().includes(term);
    
    renderTables(
        course.gscKeywords.filter(filterFn),
        course.adsKeywords.filter(filterFn),
        course.rankingsKeywords.filter(filterFn)
    );
}

let currentLang = 'en';

function initLanguage() {
    currentLang = (localStorage.getItem('hub_lang') || 'en').toLowerCase();
    if (currentLang !== 'en' && currentLang !== 'pt') currentLang = 'en';
    updateUILanguage();
}

function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'pt' : 'en';
    localStorage.setItem('hub_lang', currentLang);
    updateUILanguage();
    renderCourseList(); // Refresh sidebar with new labels
    if (activeCourseId) loadCourse(activeCourseId); // Refresh dashboard
}

function updateUILanguage() {
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    
    // Update simple text elements
    const elements = {
        'active-course-title': t["select-course"],
        'active-course-desc': t["global-analysis"],
        'sync-header': t["data-sync"],
        'data-sync-header': t["data-sync"],
        'sync-btn': t["sync-team"],
        'system-active-text': t["system-active"],
        'last-sync-info': t["loading"],
        'landing-subtitle': t["welcome-subtext"],
        'premium-tools-header': t["premium-tools"],
        'live-monitor-btn': t["live-ads-monitor"],
        'brand-name': t["brand-name"]
    };

    // Apply to DOM
    for (const [id, val] of Object.entries(elements)) {
        const el = document.getElementById(id);
        if (el) {
            if (val === 'placeholder') {
                el.placeholder = t["search-placeholder"];
            } else {
                el.textContent = val;
            }
        }
    }
    
    // Update Tooltips
    const tooltips = {
        'gsc-upload-btn': t["tip-gsc"],
        'sync-btn': t["tip-sync"],
        'live-monitor-btn': t["tip-monitor"],
        'lang-toggle-btn': t["tip-lang"],
        'theme-toggle-btn': t["tip-theme"],
        'account-btn': t["tip-account"]
    };

    for (const [id, val] of Object.entries(tooltips)) {
        const el = document.getElementById(id);
        if (el) el.title = val;
    }
    
    // Update Greeting (Special case)
    initGreeting(); 
    
    // Update sections with headers
    document.querySelectorAll('.stat-label').forEach(el => {
        const txt = el.textContent.trim();
        if (txt.includes('Parity') || txt.includes('Paridade')) el.textContent = t["parity"];
        if (txt.includes('GSC')) el.textContent = t["gsc-title"];
        if (txt.includes('Ads')) el.textContent = t["ads-title"];
        if (txt.includes('Gaps') || txt.includes('Caps')) el.textContent = t["organic-caps"];
    });

    document.querySelectorAll('.data-panel h2').forEach(el => {
        const txt = el.textContent.trim();
        if (txt.includes('Search Console')) el.innerHTML = `Search Console <span class="text-muted">(${currentLang === 'en' ? 'Organic' : 'Orgânico'})</span>`;
        if (txt.includes('Google Ads')) el.innerHTML = `Google Ads <span class="text-muted">(${currentLang === 'en' ? 'Active' : 'Ativo'})</span>`;
        if (txt.includes('Rankings') || txt.includes('Pesquisa')) el.textContent = t["rankings-header"];
    });

    // Update table headers
    document.querySelectorAll('th').forEach(el => {
        const txt = el.textContent.trim();
        if (txt === 'Keyword' || txt === 'Palavra-Chave') el.textContent = t["keyword"];
        if (txt === 'Clicks' || txt === 'Cliques') el.textContent = t["clicks"];
        if (txt === 'Ads Gap' || txt === 'Gap de Ads') el.textContent = t["ads-gap"];
        if (txt === 'Synergy' || txt === 'Sinergia') el.textContent = t["synergy"];
        if (txt === 'Current Rank' || txt === 'Rank Atual') el.textContent = t["rank"];
        if (txt === '3-Month Trend' || txt === 'Tendência 3 Meses') el.textContent = t["trend"];
        if (txt === 'Ranking URL' || txt === 'URL de Ranking') el.textContent = t["url"];
    });

    const langBtn = document.getElementById('lang-toggle-text');
    if (langBtn) langBtn.textContent = currentLang.toUpperCase();
}

function scrollToTop() {
    document.querySelector('.main-content').scrollTo({
        top: 0,
        behavior: 'smooth'
    });
}

// Show/Hide Back to Top button
document.addEventListener('DOMContentLoaded', () => {
    const mainContent = document.querySelector('.main-content');
    const bttBtn = document.getElementById('back-to-top');
    
    if (mainContent && bttBtn) {
        mainContent.addEventListener('scroll', () => {
            if (mainContent.scrollTop > 300) {
                bttBtn.classList.add('visible');
            } else {
                bttBtn.classList.remove('visible');
            }
        });
    }
});


async function fetchServerData() {
    try {
        const url = window.location.protocol === 'file:' ? 'courses.json' : 'courses.json?v=' + Date.now();
        const response = await fetch(url);
        if (!response.ok) throw new Error("Failed to load cloud data.");
        
        let data = await response.json();

        // Handle sync metadata
        const meta = data.find(d => d.type === 'metadata');
        if (meta) {
            const syncInfo = `Last synced by ${meta.last_sync_by} at ${meta.last_sync_at}`;
            const infoEl = document.getElementById('last-sync-info');
            if (infoEl) infoEl.innerText = syncInfo;
            localStorage.setItem('hub_last_sync', syncInfo);
        }
        
        // Filter out metadata and map courses
        courses = data.filter(d => d.type !== 'metadata').map((c, i) => ({
            id: i,
            ...c,
            gscKeywords: c.gscKeywords || [],
            adsKeywords: c.adsKeywords || [],
            rankingsKeywords: c.rankingsKeywords || []
        }));
    } catch (e) {
        console.error('Cloud sync failed:', e);
    }
}

async function syncToTeam() {
    let token = localStorage.getItem('github_token');
    if (!token) {
        token = prompt("Please enter your GitHub Personal Access Token (PAT) to sync with the team:");
        if (!token) return;
        localStorage.setItem('github_token', token);
    }

    const btn = document.getElementById('sync-btn');
    const status = document.getElementById('sync-status');
    
    if (!confirm("🚀 Ready to push these changes to the Team Dashboard?\n\nThis will update the live site for everyone.")) return;

    btn.disabled = true;
    btn.innerHTML = "⏳ Syncing...";
    status.style.display = "block";
    status.textContent = "Connecting to GitHub...";

    const repo = "LaminatedYamal/ULUS-FONA";
    const path = "courses.json";
    
    try {
        // 1. Get the current file SHA
        const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!getRes.ok) throw new Error("Could not find courses.json on GitHub.");
        const fileData = await getRes.json();
        const sha = fileData.sha;

        // Safety Check: Prevent syncing if memory is empty
        const hasKeywords = courses.some(c => (c.gscKeywords && c.gscKeywords.length > 0) || (c.adsKeywords && c.adsKeywords.length > 0));
        if (!hasKeywords) {
            if (!confirm("🚨 WARNING: Your dashboard appears to be EMPTY. If you sync now, you will ERASE all keywords from the team database. Are you sure?")) {
                throw new Error("Sync cancelled to prevent data loss.");
            }
        }

        // 2. Prepare the new content
        const timestamp = new Date().toLocaleString('pt-PT');
        const currentUser = localStorage.getItem('hub_user_name') || 'Team Member';
        
        const exportData = courses.map(c => ({
            id: c.id,
            name: c.name,
            degree: c.degree,
            degree_type: c.degree_type, // Persisting fixed degrees
            institution: c.institution,
            url: c.url,
            gscKeywords: c.gscKeywords || [],
            adsKeywords: c.adsKeywords || [],
            rankingsKeywords: c.rankingsKeywords || []
        }));

        // Append Sync Metadata
        exportData.push({
            type: 'metadata',
            last_sync_by: currentUser,
            last_sync_at: timestamp
        });

        const jsonStr = JSON.stringify(exportData, null, 2);
        const content = b64EncodeUnicode(jsonStr);

        // 3. Push to GitHub
        const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: `Sync by ${currentUser} at ${timestamp}`,
                content: content,
                sha: sha,
                branch: "main"
            })
        });

        if (putRes.ok) {
            status.textContent = `✅ Sync Successful at ${new Date().toLocaleTimeString('pt-PT')}! Dashboard will update for everyone in ~60s.`;
            
            // Trigger Gemini Auto-Audit
            const syncMsg = "I just synced the team data to the global dashboard. Analyze the updated fleet and the Live Ads Monitor to give me a 3-bullet point executive summary of our current status and any immediate gaps.";
            if (typeof askGemini === 'function') {
                askGemini('custom', syncMsg);
            }
            
            setTimeout(() => { status.style.display = "none"; }, 8000);
        } else {
            const err = await putRes.json();
            throw new Error(err.message || "Failed to push to GitHub.");
        }

    } catch (error) {
        console.error("Sync Error:", error);
        alert("Sync Failed: " + error.message);
        status.textContent = "❌ Sync Failed";
        
        // Help the user reset if they are stuck with a bad token
        if (confirm("Sync failed. Would you like to clear your saved GitHub Token and try again?")) {
            localStorage.removeItem('github_token');
        }
    } finally {
        btn.disabled = false;
        btn.innerHTML = "🚀 Sync to Team";
    }
}

function clearToken() {
    if (confirm("Are you sure you want to reset your GitHub connection? You will need to paste your PAT again to sync.")) {
        localStorage.removeItem('github_token');
        alert("Connection Reset! You can now paste a new token when you click Sync.");
    }
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function saveData() {
    // Save data using normalized URL as key for maximum stability
    const localData = {};
    courses.forEach(c => {
        if ((c.gscKeywords && c.gscKeywords.length > 0) || (c.adsKeywords && c.adsKeywords.length > 0)) {
            const key = normalizeUrl(c.url);
            if (key) {
                localData[key] = {
                    gsc: c.gscKeywords || [],
                    ads: c.adsKeywords || [],
                    rankings: c.rankingsKeywords || []
                };
            }
        }
    });
    localStorage.setItem('antigravity_data_v2', JSON.stringify(localData));
}

function loadData() {
    const saved = localStorage.getItem('antigravity_data_v2');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            // Handle both legacy array and new object formats for safety
            if (Array.isArray(parsed)) {
                parsed.forEach(item => {
                    const target = courses.find(c => normalizeUrl(c.url) === normalizeUrl(item.url));
                    if (target) {
                        target.gscKeywords = item.gscKeywords || item.gsc || [];
                        target.adsKeywords = item.adsKeywords || item.ads || [];
                    }
                });
            } else {
                Object.keys(parsed).forEach(urlKey => {
                    const data = parsed[urlKey];
                    const target = courses.find(c => normalizeUrl(c.url) === urlKey);
                    if (target) {
                        target.gscKeywords = data.gsc || [];
                        target.adsKeywords = data.ads || [];
                        target.rankingsKeywords = data.rankings || [];
                    }
                });
            }
            renderCourseList();
            loadCourse(activeCourseId);
        } catch (e) {
            console.error("Error loading local data:", e);
        }
    }
}

async function handleFileUpload(e, type) {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    let totalUpdated = 0;
    let coursesInFiles = 0;

    for (let file of files) {
        // Use TextDecoder for reliable UTF-8 handling
        const buffer = await file.arrayBuffer();
        const decoder = new TextDecoder('utf-8');
        const text = decoder.decode(buffer);
        let results;
        if (type === 'rankings') {
            results = parseRankingsXML(text);
        } else {
            results = file.name.toLowerCase().endsWith('.xml') ? parseSmartXML(text) : parseCSV(text);
        }
        
        console.log(`Processing ${file.name}: Found ${results.length} course groups.`);

        results.forEach(res => {
            coursesInFiles++;
            let targetCourse;
            
            if (res.url === 'current') {
                targetCourse = courses.find(c => c.id === activeCourseId);
            } else {
                // 3-STAGE SMART MATCH
                // Stage 1: Exact URL Match
                targetCourse = courses.find(c => normalizeUrl(c.url) === normalizeUrl(res.url));
                
                // Stage 2: Exact Name Match
                if (!targetCourse && res.name) {
                    targetCourse = courses.find(c => c.name.trim().toLowerCase() === res.name.trim().toLowerCase());
                }

                // Stage 3: Safe Fuzzy URL Match (only if one is a direct subpath of the other)
                if (!targetCourse) {
                    targetCourse = courses.find(c => {
                        const n1 = normalizeUrl(c.url);
                        const n2 = normalizeUrl(res.url);
                        if (n1 && n2) {
                            // Only match if one is a perfect sub-path or has a minor suffix difference
                            return n1.startsWith(n2) || n2.startsWith(n1);
                        }
                        return false;
                    });
                }

                if (targetCourse) {
                    console.log(`[Matcher] Match found: ${res.url} -> ${targetCourse.name}`);
                    
                    if (type === 'gsc') {
                        targetCourse.gscKeywords = mergeKeywords(targetCourse.gscKeywords || [], res.keywords, 'clicks');
                    } else if (type === 'ads') {
                        targetCourse.adsKeywords = mergeKeywords(targetCourse.adsKeywords || [], res.keywords, 'impressions');
                    } else if (type === 'rankings') {
                        targetCourse.rankingsKeywords = mergeRankings(targetCourse.rankingsKeywords || [], res.keywords);
                    }
                    totalUpdated++;
                } else {
                    console.warn(`[Matcher] No match found for URL: ${res.url}`);
                }           }
        });
    }

    if (totalUpdated > 0) {
        if (!localStorage.getItem('hide_sync_reminder')) {
            showSyncReminder(`🚀 Smart Bulk Sync Complete!\n\nProcessed ${coursesInFiles} courses.\nSuccessfully merged data into ${totalUpdated} courses.`);
        } else {
            console.log("Local merge complete (Reminder hidden by user preference)");
        }
        renderCourseList(); 
        loadCourse(activeCourseId); // Refresh view
        saveData();
    } else {
        alert(`No matching courses found.\n\nParsed ${coursesInFiles} courses, but none matched the database.`);
    }
}

function showSyncReminder(message) {
    // Create a stylish modal overlay
    const overlay = document.createElement('div');
    overlay.className = 'modal-overlay';
    
    const modal = document.createElement('div');
    modal.className = 'sync-modal';
    modal.innerHTML = `
        <script src="app.js?v=v92_ai_brain_restored"></script>
        <h2>Data Uploaded Locally</h2>
        <p>${message.replace(/\n/g, '<br>')}</p>
        <div class="modal-warning">
            <strong>IMPORTANT:</strong> These changes are currently ONLY in your browser. To save them for the whole team, you <u>MUST</u> click the <strong>Sync to Team</strong> button.
        </div>
        <div style="margin-bottom: 20px; display: flex; align-items: center; justify-content: center; gap: 8px; color: var(--text-muted); font-size: 13px;">
            <input type="checkbox" id="dont-show-sync">
            <label for="dont-show-sync">Don't show this reminder again</label>
        </div>
        <button class="modal-close-btn" onclick="closeSyncModal()">Got it!</button>
    `;
    
    overlay.appendChild(modal);
    document.body.appendChild(overlay);
}

function closeSyncModal() {
    const hide = document.getElementById('dont-show-sync').checked;
    if (hide) {
        localStorage.setItem('hide_sync_reminder', 'true');
    }
    document.querySelector('.modal-overlay').remove();
}

// TEAM AUTHENTICATION (Hashed for safety)
const TEAM_KEY_HASH = "4b2f3441839150da6ecf8de37d2298160aa3ee96e8d64159f2837a30c3b4f220";

async function checkAuth() {
    const user = localStorage.getItem('hub_user_name');
    const authed = localStorage.getItem('hub_is_authed');
    
    if (!user || authed !== 'true') {
        document.getElementById('login-overlay').style.display = 'flex';
        return false;
    } else {
        const display = document.getElementById('user-display-name');
        if (display) display.textContent = user;
        initGreeting(); // Update greeting immediately
        await fetchServerData();
        renderCourseList();
        return true;
    }
}

window.handleLogout = function() {
    if (confirm("Are you sure you want to logout?")) {
        localStorage.removeItem('hub_user_name');
        localStorage.removeItem('hub_is_authed');
        location.reload();
    }
}

async function handleLogin() {
    const name = document.getElementById('login-name').value.trim();
    const key = document.getElementById('login-key').value.trim();
    const error = document.getElementById('login-error');

    if (!name) {
        error.textContent = "Please enter your name.";
        return;
    }

    // Hash the input key
    const hashedInput = CryptoJS.SHA256(key).toString();

    if (hashedInput !== TEAM_KEY_HASH) {
        error.textContent = "Invalid Access Key.";
        return;
    }

    // Success
    localStorage.setItem('hub_user_name', name);
    localStorage.setItem('hub_is_authed', 'true');
    initGreeting(name); // Update greeting text right now with the actual name
    
    document.getElementById('login-overlay').style.opacity = '0';
    setTimeout(() => {
        document.getElementById('login-overlay').style.display = 'none';
        checkAuth();
    }, 500);
}

// Dashboard Lock Logic (No Logout Button)

function stripAccents(str) {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function mergeKeywords(existing, incoming, metricKey) {
    const map = new Map();
    // Add existing keywords to map (using exact term as key)
    existing.forEach(k => {
        const key = k.term.toLowerCase().trim();
        map.set(key, k);
    });
    // Merge incoming
    incoming.forEach(k => {
        const key = k.term.toLowerCase().trim();
        if (map.has(key)) {
            const current = map.get(key);
            // Update metric if higher
            if ((k[metricKey] || 0) > (current[metricKey] || 0)) {
                current[metricKey] = k[metricKey];
            }
        } else {
            map.set(key, k);
        }
    });
    return Array.from(map.values());
}

function parseSmartXML(xmlText) {
    const parser = new DOMParser();
    const xml = parser.parseFromString(xmlText, "text/xml");
    const allResults = [];
    
    // Get all elements in the document
    const allElements = xml.getElementsByTagName("*");
    const potentialCourseNodes = [];
    
    // Strategy: Any element that has a descendant containing 'http' is likely a course container
    // We skip the root element to avoid "Total/Summary" blocks that contain everything
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        if (el === xml.documentElement) continue; 
        
        const tagName = el.tagName.toLowerCase();
        
        // Skip common leaf/metric nodes
        if (['texto', 'filtro', 'cliques', 'impressoes', 'dimension', 'query'].includes(tagName)) continue;
        
        // Does this node contain a URL anywhere inside?
        let hasUrl = false;
        const descendants = el.querySelectorAll('*');
        for (let desc of descendants) {
            if (desc.children.length === 0 && desc.textContent.includes('http')) {
                hasUrl = true;
                break;
            }
        }
        
        // Does it contain keywords?
        let hasKeywords = el.querySelectorAll('Texto, texto, Query, query, TEXTO, QUERY').length > 0;

        if (hasUrl && hasKeywords) {
            potentialCourseNodes.push(el);
        }
    }

    // Deduplicate: If one potential node is inside another, keep the CHILD (the more specific course block)
    const specificNodes = potentialCourseNodes.filter(n => {
        // Only keep n if there is no other node inside n that is also a potential course node
        const hasChildCourse = potentialCourseNodes.some(other => other !== n && n.contains(other));
        return !hasChildCourse;
    });

    // If we found specific containers, use them
    const courseNodes = specificNodes.length > 0 ? specificNodes : 
        xml.querySelectorAll('Curso, curso, CURSO, Course, course, COURSE, Item, item, row, Row, entry, Entry');
    
    courseNodes.forEach(node => {
        const nameNode = node.querySelector('Nome, nome, NOME, Course, course, COURSE, Title, title, label, Label');
        let urlNode = node.querySelector('Filtro, filtro, FILTRO, Url, url, URL, Link, link, LINK, website, Website, Dimension_0, dimension_0, Dimension_1, dimension_1');
        
        let url = urlNode ? urlNode.textContent.trim() : '';
        
        if (!url) {
            const allChildren = node.querySelectorAll('*');
            for (let child of allChildren) {
                const text = child.textContent.trim();
                if (text.startsWith('http')) {
                    url = text;
                    break;
                }
            }
        }

        const name = nameNode ? nameNode.textContent.trim() : '';
        const keywords = parseXMLNodes(node);
        
        if ((url || name) && keywords.length > 0) {
            allResults.push({ url: url.toLowerCase(), name, keywords });
        }
    });

    console.log(`[XML Parser] Identified ${allResults.length} separate course blocks in file.`);
    if (allResults.length > 0) return allResults;
    
    // Absolute Fallback
    const rootUrlNode = xml.querySelector('Filtro, filtro, FILTRO, Url, url, URL, Link, link, LINK, website, Website, Dimension_0, dimension_0, Dimension_1, dimension_1');
    const rootUrl = rootUrlNode ? rootUrlNode.textContent.trim().toLowerCase() : 'current';
    return [{ url: rootUrl, name: 'current', keywords: parseXMLNodes(xml) }];
}

function parseRankingsXML(xmlText) {
    // 1. CLEANUP: Fix the <3Month> tags before parsing (The 'diag.ps1' fix)
    const fixedXml = xmlText.replace(/<3Month/g, '<Month3').replace(/<\/3Month/g, '</Month3');
    
    const parser = new DOMParser();
    const xml = parser.parseFromString(fixedXml, "text/xml");
    const results = [];
    
    // Look for records (PositionRecords/record)
    const records = xml.querySelectorAll('record');
    records.forEach(rec => {
        const keyword = rec.querySelector('Keyword')?.textContent.trim();
        const url = rec.querySelector('Url')?.textContent.trim();
        const rank = parseInt(rec.querySelector('Position')?.textContent || 0);
        const prevRank = parseInt(rec.querySelector('Month3')?.textContent || 0); // Normalized tag
        
        if (keyword && url) {
            results.push({
                url: url.toLowerCase(),
                name: 'current',
                keywords: [{
                    term: keyword,
                    rank: rank,
                    prevRank: prevRank,
                    url: url
                }]
            });
        }
    });

    return results;
}

function mergeRankings(existing, incoming) {
    const map = new Map();
    existing.forEach(k => map.set(k.term.toLowerCase().trim(), k));
    incoming.forEach(k => {
        map.set(k.term.toLowerCase().trim(), k); // Rankings always overwrite with latest
    });
    return Array.from(map.values());
}

function fixEncoding(str) {
    if (!str) return '';
    try {
        // Fix for "UTF-8 as Latin1" double-encoding (common in Excel/GSheet exports)
        // If it shows Ã© instead of é, this restores it.
        const encoded = escape(str);
        if (encoded.includes('%C3')) {
            return decodeURIComponent(encoded);
        }
        return str;
    } catch (e) {
        return str;
    }
}

function parseXMLNodes(parentNode) {
    const results = [];
    // Super-flexible selector for keywords from GSC, Ads, and custom XMLs
    const nodes = parentNode.querySelectorAll('Texto, texto, TEXTO, term, Term, keyword, Keyword, query, Query, Key, key, Keys, keys, Dimension_0, dimension_0, Dimension_1, dimension_1, Dimension_2, dimension_2');
    
    nodes.forEach(node => {
        let term = node.textContent.trim();
        // If the node itself has children (like <Key><Query>...</Query></Key>), we want the deepest text
        if (node.children.length > 0) return; 
        
        // Repair encoding
        term = fixEncoding(term);
        
        // Skip if it looks like a URL
        if (term.startsWith('http')) return;

        const p = node.parentNode;
        
        // Flexible selectors for metrics
        const clicks = parseInt(p.querySelector('Cliques, cliques, CLIQUES, clicks, Clicks')?.textContent || 0);
        const impressions = parseInt(p.querySelector('Impressoes, impressoes, IMPRESSOES, impressions, Impressions')?.textContent || 0);
        
        if (term) results.push({ term, clicks, impressions });
    });
    
    return results;
}

function parseCSV(csvString) {
    const results = [];
    
    // Remove BOM if present and normalize line endings
    const clean = csvString.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
    const lines = clean.split('\n').filter(l => l.trim() !== '');
    
    if (lines.length < 2) return [{ url: 'current', keywords: [] }];
    
    // Check if it's the custom multi-course CSV (Instituição, Grau, Curso, Link, Keywords)
    const headerLine = lines[0].toLowerCase();
    const isCustomFormat = headerLine.includes('link') && headerLine.includes('keywords');
    
    const delimiter = detectDelimiter(lines[0]);
    const headers = splitCSVLine(lines[0], delimiter).map(h => h.toLowerCase().trim());
    const linkCol = headers.findIndex(h => h.includes('link'));
    const kwCol = headers.findIndex(h => h.includes('keywords'));
    const nameCol = headers.findIndex(h => h === 'curso' || h === 'nome' || h === 'name' || h.includes('curso'));
    
    if (linkCol >= 0 && kwCol >= 0) {
        for (let i = 1; i < lines.length; i++) {
            const cols = splitCSVLine(lines[i], delimiter);
            if (cols.length <= Math.max(linkCol, kwCol)) continue;
            
            const url = cols[linkCol] ? cols[linkCol].trim().toLowerCase() : '';
            const name = (nameCol >= 0 && cols[nameCol]) ? cols[nameCol].trim() : '';
            const rawKeywords = cols[kwCol] ? cols[kwCol].trim() : '';
            
            if ((url || name) && rawKeywords) {
                // Split the comma-separated keyword string
                const keywords = rawKeywords.split(',')
                    .map(k => k.trim())
                    .filter(k => k.length > 0)
                    .map(term => ({ term, clicks: 0, impressions: 0 }));
                
                if (keywords.length > 0) {
                    results.push({ url, name, keywords });
                }
            }
        }
        return results;
    }
    
    // Fallback: Standard Google Ads single-course export
    let headerRowIndex = 0;
    for (let i = 0; i < Math.min(lines.length, 10); i++) {
        const lower = lines[i].toLowerCase();
        if (lower.includes('keyword') || lower.includes('palavra') || lower.includes('search term') || lower.includes('consulta')) {
            headerRowIndex = i;
            break;
        }
    }
    
    const fbDelimiter = detectDelimiter(lines[headerRowIndex]);
    const fbHeaders = splitCSVLine(lines[headerRowIndex], fbDelimiter).map(h => h.toLowerCase().trim());
    const keywordColIndex = fbHeaders.findIndex(h => 
        h.includes('keyword') || h.includes('palavra-chave') || 
        h.includes('search term') || h.includes('consulta') || 
        h.includes('termo') || h === 'keyword'
    );
    
    const colIndex = keywordColIndex >= 0 ? keywordColIndex : 0;
    const keywords = [];
    
    for (let i = headerRowIndex + 1; i < lines.length; i++) {
        const cols = splitCSVLine(lines[i], delimiter);
        if (cols.length <= colIndex) continue;
        
        let term = cols[colIndex].trim();
        if (!term || term.toLowerCase().includes('total') || term.startsWith('--')) continue;
        
        // Repair encoding
        term = fixEncoding(term);
        
        keywords.push({ term, clicks: 0 });
    }
    
    return [{ url: 'current', keywords }];
}

function normalizeUrl(url) {
    if (!url) return '';
    let u = url.trim().toLowerCase();
    
    // Strip query parameters and hashes
    u = u.split('?')[0].split('#')[0];
    
    // Remove http/https and www
    u = u.replace(/^https?:\/\//, '').replace(/^www\./, '');
    
    // Remove trailing slash
    u = u.replace(/\/$/, '');
    
    return u;
}

function normalizeKeyword(term) {
    if (!term) return '';
    // ABSOLUTE ZERO: Remove accents, special chars, multiple spaces, and trim
    return term.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Strip accents
        .replace(/[^a-z0-9\s]/g, "")    // Strip special characters (strict alphanumeric)
        .replace(/\s+/g, " ")           // Collapse whitespace
        .trim();
}

function getContrastColor(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#ffffff';
    // Luma formula
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 125 ? '#000000' : '#ffffff';
}

function detectDelimiter(line) {
    if (line.includes('\t')) return '\t';
    if (line.includes(';')) return ';';
    return ',';
}

function splitCSVLine(line, delimiter) {
    const cols = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const ch = line[i];
        if (ch === '"') {
            inQuotes = !inQuotes;
        } else if (ch === delimiter && !inQuotes) {
            cols.push(current.replace(/^"|"$/g, '').trim());
            current = '';
        } else {
            current += ch;
        }
    }
    cols.push(current.replace(/^"|"$/g, '').trim());
    return cols;
}

function renderCourseList(searchQuery = '') {
    const list = document.getElementById('course-list');
    if (!list) return;
    list.innerHTML = '';
    
    if (courses.length === 0) {
        list.innerHTML = '<div class="sync-meta" style="padding: 20px; text-align: center; opacity: 0.7;">No courses found.<br><br>Please check your courses.json file or run the sync agent.</div>';
    }
    const q = searchQuery.toLowerCase().trim();

    // Grouping Logic
    const grouped = {};
    courses.forEach(course => {
        const nameMatch = course.name.toLowerCase().includes(q);
        const keywordMatch = q && (
            course.gscKeywords.some(k => k.term.toLowerCase().includes(q)) || 
            course.adsKeywords.some(k => k.term.toLowerCase().includes(q))
        );

        if (!q || nameMatch || keywordMatch) {
            if (!grouped[course.institution]) grouped[course.institution] = {};
            let degreeName = course.degree_type || 'Formações';
            if (degreeName.toLowerCase() === 'unknown' || degreeName.toLowerCase() === 'formação') degreeName = 'Formações';
            if (!grouped[course.institution][degreeName]) grouped[course.institution][degreeName] = [];
            grouped[course.institution][degreeName].push(course);
        }
    });

    const instOrder = ['Lusófona Lisboa', 'Lusófona Porto', 'IPLUSO', 'ISLA Gaia', 'ISMAT', 'Grupo Lusófona'];
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const displayMapping = t["degree-mapping"];
    
    Object.keys(grouped).sort((a, b) => {
        const indexA = instOrder.indexOf(a);
        const indexB = instOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    }).forEach(inst => {
        const brand = BRANDING[inst] || { hex: "#444444", bgSub: "#222222" };
        
        // Header
        const instHeader = document.createElement('div');
        instHeader.className = 'nav-group-header';
        instHeader.textContent = inst.toUpperCase();
        
        // Restore Bold Brand Colors
        instHeader.style.backgroundColor = brand.hex;
        const rgb = hexToRgb(brand.hex);
        instHeader.style.setProperty('--inst-color-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        instHeader.style.color = getContrastColor(brand.hex);
        instHeader.style.borderColor = `rgba(255, 255, 255, 0.2)`;
        
        // Container for degrees
        const degreeContainer = document.createElement('div');
        degreeContainer.className = 'nav-degree-container';
        
        instHeader.addEventListener('click', () => {
            const isExpanded = instHeader.classList.toggle('expanded');
            degreeContainer.classList.toggle('expanded', isExpanded);
        });

        list.appendChild(instHeader);
        list.appendChild(degreeContainer);

        const degreeOrder = ['TeSP', 'Licenciatura', 'Mestrado Integrado', 'Mestrado', 'Doutoramento', 'Pós-Graduação', 'Formações'];
        Object.keys(grouped[inst]).sort((a, b) => {
            const indexA = degreeOrder.indexOf(a);
            const indexB = degreeOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        }).forEach(degree => {
            const degreeBtn = document.createElement('div');
            degreeBtn.className = 'nav-degree-btn';
            degreeBtn.textContent = displayMapping[degree] || degree;
            degreeBtn.addEventListener('click', () => {
                document.querySelectorAll('.nav-degree-btn').forEach(b => b.classList.remove('active'));
                degreeBtn.classList.add('active');
                selectDegreeHub(inst, degree, grouped[inst][degree]);
            });
            degreeContainer.appendChild(degreeBtn);
        });

        // Auto-expand if searching
        if (q) {
            instHeader.classList.add('expanded');
            degreeContainer.classList.add('expanded');
        }
    });

    // Add Reset Buttons
    const resetContainer = document.createElement('div');
    resetContainer.className = 'reset-grid';
    resetContainer.innerHTML = `
        <button onclick="resetApp('gsc')" class="btn-reset gsc-only">Clear GSC</button>
        <button onclick="resetApp('ads')" class="btn-reset ads-only">Clear Ads</button>
        <button onclick="resetApp('all')" class="btn-reset danger">Clear All</button>
    `;
    list.appendChild(resetContainer);
}

// Make resetApp global
window.resetApp = function(mode) {
    let msg = "Are you sure? This will clear all data.";
    if (mode === 'gsc') msg = "Clear all GSC (Search Console) keywords?";
    if (mode === 'ads') msg = "Clear all Google Ads keywords?";

    if (confirm(msg)) {
        if (mode === 'all') {
            localStorage.removeItem('antigravity_data_v2');
            localStorage.removeItem('antigravity_courses'); 
            location.reload();
        } else {
            // Selective clear
            courses.forEach(c => {
                if (mode === 'gsc') c.gscKeywords = [];
                if (mode === 'ads') c.adsKeywords = [];
            });
            saveData();
            renderCourseList();
            loadCourse(activeCourseId);
            alert(`${mode.toUpperCase()} data cleared successfully.`);
        }
    }
};

window.selectDegreeHub = function(inst, degree, degreeCourses) {
    activeCourseId = null; // Enter Global AI Mode
    const landingView = document.getElementById("landing-view");
    const dashboardView = document.getElementById("dashboard-view");
    
    if (landingView) landingView.style.display = "flex";
    if (dashboardView) dashboardView.style.display = "none";
    if (document.getElementById('live-monitor-view')) {
        document.getElementById('live-monitor-view').style.display = "none";
    }
    
    const headerLeft = document.getElementById('dashboard-header-left');
    if (headerLeft) headerLeft.style.visibility = "hidden";
    
    const sidebarSearch = document.getElementById('sidebar-search-container');
    const headerSearch = document.getElementById('header-search-container');
    if (sidebarSearch) sidebarSearch.style.display = "block";
    if (headerSearch) headerSearch.style.display = "none";
    
    // Update Header Text
    document.getElementById('active-course-title').textContent = inst;
    document.getElementById('active-course-desc').textContent = degree;
    
    // Update Landing Logo
    const brand = BRANDING[inst] || { logo: "" };
    const logoEl = document.getElementById('landing-logo');
    if (logoEl) {
        logoEl.src = brand.logo;
        logoEl.style.display = brand.logo ? "block" : "none";
        if (logoEl.parentElement) {
            logoEl.parentElement.style.backgroundColor = brand.bgSub;
            logoEl.parentElement.style.padding = "10px";
            logoEl.parentElement.style.borderRadius = "12px";
            logoEl.parentElement.style.display = "inline-block";
        }
    }
    
    // Update Subtitle
    const subtitle = document.getElementById('landing-subtitle');
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const displayDegree = t["degree-mapping"][degree] || degree;
    
    if (subtitle) {
        subtitle.textContent = `${t["browsing"]} ${displayDegree} ${t["at"]} ${inst}`;
    }
    
    // Populate Hub Dropdown
    const hubDropdownContainer = document.getElementById('degree-selection-hub');
    const dropdown = document.getElementById('course-dropdown-hub');
    if (dropdown && hubDropdownContainer) {
        dropdown.innerHTML = `<option value="">${t["choose-course"]}</option>`;
        degreeCourses.sort((a, b) => a.name.localeCompare(b.name, 'pt')).forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            dropdown.appendChild(opt);
        });
        hubDropdownContainer.style.display = "block";
    }
}

function loadCourse(id) {
    activeCourseId = id;
    const course = courses.find(c => c.id === id);
    if (!course) return;

    // Switch Views
    const landingView = document.getElementById("landing-view");
    const dashboardView = document.getElementById("dashboard-view");
    
    if (landingView) landingView.style.display = "none";
    if (dashboardView) dashboardView.style.display = "block";
    if (document.getElementById('live-monitor-view')) {
        document.getElementById('live-monitor-view').style.display = "none";
    }
    
    const headerLeft = document.getElementById('dashboard-header-left');
    if (headerLeft) headerLeft.style.visibility = "visible";
    
    const sidebarSearch = document.getElementById('sidebar-search-container');
    const headerSearch = document.getElementById('header-search-container');
    if (sidebarSearch) sidebarSearch.style.display = "none";
    if (headerSearch) headerSearch.style.display = "block";
    
    let instName = course.institution || "";
    if (instName.includes('Lus') && instName.includes('fona')) {
        instName = instName.includes('Porto') ? 'Lusófona Porto' : 'Lusófona Lisboa';
    }
    const brand = BRANDING[instName] || { hex: "#444444", bgSub: "#222222", logo: "" };
    
    // Quick Switcher in Header
    const switcherContainer = document.getElementById('header-switcher-container');
    const switcher = document.getElementById('header-course-switcher');
    if (switcher && switcherContainer) {
        const sameCatCourses = courses.filter(c => c.institution === course.institution && (c.degree === course.degree || c.degree_type === course.degree_type));
        if (sameCatCourses.length > 1) {
            const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
            switcher.innerHTML = `<option value="">${t["quick-switch"]}</option>`;
            sameCatCourses.sort((a,b) => a.name.localeCompare(b.name, 'pt')).forEach(c => {
                const opt = document.createElement('option');
                opt.value = c.id;
                opt.textContent = c.name;
                if (c.id === id) opt.selected = true;
                switcher.appendChild(opt);
            });
            switcherContainer.style.display = 'block';
        } else {
            switcherContainer.style.display = 'none';
        }
    }
    
    // Apply Branding
    document.documentElement.style.setProperty('--accent-primary', brand.hex);
    document.documentElement.style.setProperty('--accent-secondary', brand.bgSub);
    
    // Set RGB for gradients
    const rgb = hexToRgb(brand.hex);
    if (rgb) {
        document.documentElement.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }

    const logoContainer = document.querySelector('.logo-container');
    logoContainer.style.backgroundColor = brand.bgSub;
    logoContainer.style.borderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.2)`;

    document.getElementById('brand-logo').src = brand.logo;
    document.getElementById('brand-name').textContent = course.institution;
    
    document.getElementById('active-course-title').textContent = course.name;
    const t = TRANSLATIONS[currentLang] || TRANSLATIONS['en'];
    const degreeMap = t["degree-mapping"] || {};
    const displayDegree = degreeMap[course.degree] || degreeMap[course.degree_type] || (currentLang === 'pt' ? 'Formações' : 'Training');
    document.getElementById('active-course-desc').textContent = `${displayDegree.toUpperCase()} | ${course.institution.toUpperCase()}`;
    
    renderTables(course.gscKeywords, course.adsKeywords, course.rankingsKeywords);
    updateStats(course);
    
    // Auto-close sidebar on mobile
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) sidebar.classList.remove('mobile-active');
    if (overlay) overlay.classList.remove('active');
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function renderTables(gsc = [], ads = [], rankings = [], limit = 50) {
    const gscBody = document.getElementById('gsc-body');
    const adsBody = document.getElementById('ads-body');
    const rankingsBody = document.getElementById('rankings-body');
    
    gscBody.innerHTML = '';
    adsBody.innerHTML = '';
    rankingsBody.innerHTML = '';
    
    // Deduplicate and Sort
    const getUnique = (arr) => {
        const seen = new Set();
        return arr.filter(item => {
            const norm = normalizeKeyword(item.term);
            if (seen.has(norm)) return false;
            seen.add(norm);
            return true;
        });
    };

    const sortedGsc = getUnique([...gsc]).sort((a, b) => (b.clicks || 0) - (a.clicks || 0));
    const sortedAds = getUnique([...ads]).sort((a, b) => (b.impressions || 0) - (a.impressions || 0));
    const sortedRankings = getUnique([...rankings]).sort((a, b) => a.term.localeCompare(b.term, 'pt'));
    
    const gscNorms = gsc.map(k => normalizeKeyword(k.term));
    const adsNorms = ads.map(k => normalizeKeyword(k.term));
    const rankNorms = rankings.map(k => normalizeKeyword(k.term));
    
    const renderBatch = (data, container, type) => {
        const slice = data.slice(0, limit);
        slice.forEach(k => {
            const tr = document.createElement('tr');
            const norm = normalizeKeyword(k.term);
            const isTripleMatch = gscNorms.includes(norm) && adsNorms.includes(norm) && rankNorms.includes(norm);
            const rainbowClass = isTripleMatch ? 'rainbow-winner-badge' : '';
            
            if (type === 'gsc') {
                const isMatchAds = adsNorms.includes(norm);
                tr.className = isTripleMatch ? 'rainbow-row' : (isMatchAds ? 'synergy-aura' : 'gap-aura');
                tr.innerHTML = `<td>${k.term}</td><td>${k.clicks.toLocaleString()}</td><td>${isMatchAds ? '<span class="match-tag">✓ Active in Ads</span>' : '<span class="text-muted">Organic Only</span>'}</td>`;
            } else if (type === 'ads') {
                const isMatchGsc = gscNorms.includes(norm);
                tr.className = isTripleMatch ? 'rainbow-row' : (isMatchGsc ? 'synergy-aura' : 'gap-aura');
                tr.innerHTML = `<td>${k.term}</td><td>${isMatchGsc ? '<span class="match-tag">✓ Active in GSC</span>' : '<span class="gap-tag">⚠ Organic Gap</span>'}</td>`;
            } else if (type === 'rankings') {
                const diff = (k.prevRank || 0) - (k.rank || 0);
                const trendIcon = diff > 0 ? `<span style="color:var(--success);">▲ ${diff}</span>` : diff < 0 ? `<span style="color:var(--danger);">▼ ${Math.abs(diff)}</span>` : `<span style="color:var(--text-muted);">● Stable</span>`;
                tr.className = isTripleMatch ? 'rainbow-row' : '';
                tr.innerHTML = `
                    <td style="font-weight:700;">${k.term}</td>
                    <td style="text-align:center;"><span style="font-size:18px; font-weight:800;">#${k.rank}</span></td>
                    <td>${trendIcon}</td>
                    <td style="font-size:11px; opacity:0.8; max-width:200px; overflow:hidden; text-overflow:ellipsis;">${k.url}</td>
                `;
            }
            container.appendChild(tr);
        });

        if (data.length > limit) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="100%" style="text-align:center; padding:15px;"><button class="sync-btn" style="background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1);" onclick="this.parentElement.parentElement.remove(); renderBatchEx('${type}', ${limit + 100})">Load More (+100)</button></td>`;
            container.appendChild(row);
        }
    };

    // Global references for "Load More"
    window.currentGscData = sortedGsc;
    window.currentAdsData = sortedAds;
    window.currentRankData = sortedRankings;
    window.renderBatchEx = (type, newLimit) => {
        if (type === 'gsc') renderBatch(window.currentGscData, gscBody, 'gsc', newLimit);
        else if (type === 'ads') renderBatch(window.currentAdsData, adsBody, 'ads', newLimit);
        else if (type === 'rankings') renderBatch(window.currentRankData, rankingsBody, 'rankings', newLimit);
    };

    if (sortedGsc.length === 0) gscBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:40px; color:var(--text-muted); opacity:0.5;">📂 No GSC data</td></tr>`;
    else renderBatch(sortedGsc, gscBody, 'gsc');

    if (sortedAds.length === 0) adsBody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:40px; color:var(--text-muted); opacity:0.5;">📂 No Ads data</td></tr>`;
    else renderBatch(sortedAds, adsBody, 'ads');

    if (sortedRankings.length === 0) rankingsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted); opacity:0.5;">📂 No Rankings data</td></tr>`;
    else renderBatch(sortedRankings, rankingsBody, 'rankings');
}

async function togglePremiumTools() {
    const header = document.getElementById('premium-tools-header');
    const container = document.getElementById('premium-tools-container');
    const isExpanded = header.classList.toggle('expanded');
    container.classList.toggle('expanded', isExpanded);
}

function hideAllViews() {
    ['landing-view', 'dashboard-view', 'live-monitor-view', 'chess-view'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.style.display = 'none';
    });
}

window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) {
        const isActive = sidebar.classList.toggle('mobile-active');
        if (overlay) overlay.classList.toggle('active', isActive);
    }
};

window.showLiveMonitor = async function() {
    hideAllViews();
    // Auto-close sidebar on mobile after selection
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) sidebar.classList.remove('mobile-active');
    if (overlay) overlay.classList.remove('active');
    
    const view = document.getElementById('live-monitor-view');
    if (view) view.style.display = 'block';
    
    // Update Header
    const headerLeft = document.getElementById('dashboard-header-left');
    if (headerLeft) headerLeft.style.visibility = 'visible';
    const title = document.getElementById('active-course-title');
    if (title) title.textContent = "Live Ads Monitor";
    const desc = document.getElementById('active-course-desc');
    if (desc) desc.textContent = "Real-time Portfolio Performance";
    
    const body = document.getElementById('monitor-body');
    if (body) {
        body.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:40px;">⏳ Loading Live Monitor Data...</td></tr>';
    }

    try {
        const resp = await fetch('campaigns.json', { cache: 'no-cache' });
        if (resp.ok) liveAdsContext = await resp.json();
    } catch(e) {}

    try {
        const campaigns = liveAdsContext || [];

        if (body) {
            body.innerHTML = '';
            campaigns.forEach(c => {
                const tr = document.createElement('tr');
                const name = c.name || c.Name || c.Campaign || "Unknown Campaign";
                const status = (c.status || c.Status || "PAUSED").toString();
                const budget = parseFloat(c.budget || c.Budget || 0);
                const cost = parseFloat(c.cost || c.Cost || 0);
                const conv = parseFloat(c.conversions || c.Conversions || 0);
                const imps = parseInt(c.impressions || c.Impressions || 0);
                const clicks = parseInt(c.clicks || c.Clicks || 0);
                const ctr = c.ctr || c.CTR || "0.00%";
                const cpa = conv > 0 ? (cost / conv).toFixed(2) : '0.00';
                
                const statusClass = status.toLowerCase().includes('enabl') ? 'match-tag' : 'text-muted';
                
                tr.style.background = 'rgba(0, 0, 0, 0.4)';
                tr.style.borderBottom = '1px solid rgba(255, 255, 255, 0.05)';
                
                tr.innerHTML = `
                    <td style="font-weight:800; color: #ffffff; font-size: 15px; text-shadow: 0 1px 3px rgba(0,0,0,0.8);">${name}</td>
                    <td><span class="${statusClass}" style="font-weight:800; padding: 6px 12px; border-radius: 8px; background: ${status.toLowerCase().includes('enabl') ? 'rgba(52, 168, 83, 0.2)' : 'rgba(255, 255, 255, 0.05)'}; border: 1px solid currentColor; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${status}</span></td>
                    <td style="text-align:right; font-weight:700; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">€${budget.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}</td>
                    <td style="text-align:right; font-weight:700; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${imps.toLocaleString()}</td>
                    <td style="text-align:right; font-weight:700; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${clicks.toLocaleString()}</td>
                    <td style="text-align:right; color: #00f2ff; font-weight:900; font-size: 16px; text-shadow: 0 0 10px rgba(0, 242, 255, 0.3);">€${cost.toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}</td>
                    <td style="text-align:right; font-weight:900; color: #ffffff; text-shadow: 0 1px 2px rgba(0,0,0,0.8);">${conv.toFixed(0)}</td>
                    <td style="text-align:right; font-weight:900; color:${conv > 0 ? '#00ff88' : '#ffffff'}; text-shadow: 0 0 10px ${conv > 0 ? 'rgba(0, 255, 136, 0.3)' : 'none'};">€${parseFloat(cpa).toFixed(2).replace(/\d(?=(\d{3})+\.)/g, '$&,')}</td>
                    <td style="text-align:right; font-weight:700; color: #ffd700; text-shadow: 0 1px 2px rgba(0,0,0,0.5);">${ctr}</td>
                `;
                body.appendChild(tr);
            });
        }
    } catch (e) {
        if (body) body.innerHTML = `<tr><td colspan="7" style="text-align:center; color:var(--danger); padding:40px;">⚠️ ${e.message}</td></tr>`;
    }
}

window.showChess = function() {
    hideAllViews();
    // Auto-close sidebar on mobile
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    if (sidebar) sidebar.classList.remove('mobile-active');
    if (overlay) overlay.classList.remove('active');
    
    const view = document.getElementById('chess-view');
    if (view) view.style.display = 'flex';
    
    const headerLeft = document.getElementById('dashboard-header-left');
    if (headerLeft) headerLeft.style.visibility = 'visible';
    const title = document.getElementById('active-course-title');
    if (title) title.textContent = "Strategic Chess";
    const desc = document.getElementById('active-course-desc');
    if (desc) desc.textContent = "Tactical Training Suite";
    
    if (typeof Chess === 'undefined') {
        const boardEl = document.getElementById('chess-board');
        if (boardEl) boardEl.innerHTML = '<div style="color:var(--text-muted); padding:20px; text-align:center;">⏳ Loading Chess Engine...<br><small>Please check your connection</small></div>';
        return;
    }

    if (!chess) {
        chess = new Chess();
    }
    renderBoard();
}

// CHESS LOGIC
let chess = null;
let selectedSquare = null;

const PIECE_IMAGES = {
    'p': 'https://upload.wikimedia.org/wikipedia/commons/c/c7/Chess_pdt45.svg',
    'r': 'https://upload.wikimedia.org/wikipedia/commons/f/ff/Chess_rdt45.svg',
    'n': 'https://upload.wikimedia.org/wikipedia/commons/e/ef/Chess_ndt45.svg',
    'b': 'https://upload.wikimedia.org/wikipedia/commons/9/98/Chess_bdt45.svg',
    'q': 'https://upload.wikimedia.org/wikipedia/commons/4/47/Chess_qdt45.svg',
    'k': 'https://upload.wikimedia.org/wikipedia/commons/f/f0/Chess_kdt45.svg',
    'P': 'https://upload.wikimedia.org/wikipedia/commons/4/45/Chess_plt45.svg',
    'R': 'https://upload.wikimedia.org/wikipedia/commons/7/72/Chess_rlt45.svg',
    'N': 'https://upload.wikimedia.org/wikipedia/commons/7/70/Chess_nlt45.svg',
    'B': 'https://upload.wikimedia.org/wikipedia/commons/b/b1/Chess_blt45.svg',
    'Q': 'https://upload.wikimedia.org/wikipedia/commons/1/15/Chess_qlt45.svg',
    'K': 'https://upload.wikimedia.org/wikipedia/commons/4/42/Chess_klt45.svg'
};

function renderBoard() {
    const boardEl = document.getElementById('chess-board');
    if (!boardEl) return;
    boardEl.innerHTML = '';
    const board = chess.board();
    
    for (let r = 0; r < 8; r++) {
        for (let c = 0; c < 8; c++) {
            const square = document.createElement('div');
            const squareName = String.fromCharCode(97 + c) + (8 - r);
            square.className = `square ${(r + c) % 2 === 0 ? 'light' : 'dark'}`;
            square.dataset.square = squareName;
            
            const piece = board[r][c];
            if (piece) {
                const img = document.createElement('img');
                img.src = PIECE_IMAGES[piece.color === 'w' ? piece.type.toUpperCase() : piece.type];
                img.style.width = '45px';
                img.style.height = '45px';
                square.appendChild(img);
            }
            
            if (selectedSquare === squareName) square.classList.add('selected');
            
            square.onclick = () => handleSquareClick(squareName);
            boardEl.appendChild(square);
        }
    }
    
    updateChessStatus();
}

function handleSquareClick(square) {
    if (selectedSquare === square) {
        selectedSquare = null;
    } else if (selectedSquare) {
        const move = chess.move({
            from: selectedSquare,
            to: square,
            promotion: 'q'
        });
        
        if (move) {
            selectedSquare = null;
            // Trigger AI Move if it's black's turn
            if (!chess.game_over() && chess.turn() === 'b') {
                setTimeout(makeAIMove, 600);
            }
        } else {
            selectedSquare = square;
        }
    } else {
        const piece = chess.get(square);
        if (piece && piece.color === chess.turn()) {
            selectedSquare = square;
        }
    }
    renderBoard();
}

function makeAIMove() {
    if (chess.game_over()) return;
    
    const moves = chess.moves();
    const values = { p: 1, n: 3, b: 3, r: 5, q: 9, k: 0 };
    
    let bestMove = null;
    let maxVal = -Infinity;
    
    moves.forEach(m => {
        const moveObj = chess.move(m);
        let val = Math.random() * 0.5; // Randomness for personality
        if (moveObj.captured) {
            val += values[moveObj.captured] * 10;
        }
        // Basic positional bonus: favor center
        if (m.includes('d4') || m.includes('e4') || m.includes('d5') || m.includes('e5')) val += 2;
        
        chess.undo();
        if (val > maxVal) {
            maxVal = val;
            bestMove = m;
        }
    });
    
    if (bestMove) {
        chess.move(bestMove);
        renderBoard();
    }
}

function updateChessStatus() {
    const statusEl = document.getElementById('chess-status');
    const indicator = document.getElementById('chess-turn-indicator');
    
    let status = '';
    const moveColor = chess.turn() === 'w' ? 'White' : 'Black';
    
    if (chess.in_checkmate()) {
        status = `Game over, ${moveColor} is in checkmate.`;
    } else if (chess.in_draw()) {
        status = 'Game over, drawn position';
    } else {
        status = `${moveColor} to move`;
        if (chess.in_check()) status += ', in check!';
    }
    
    if (statusEl) statusEl.textContent = status;
    if (indicator) indicator.style.background = chess.turn() === 'w' ? '#fff' : '#333';
}

window.resetChess = function() {
    chess = new Chess();
    selectedSquare = null;
    renderBoard();
}

window.undoChess = function() {
    chess.undo();
    selectedSquare = null;
    renderBoard();
}


function updateStats(course) {
    const gscCount = course.gscKeywords.length;
    const adsCount = course.adsKeywords.length;
    const rankCount = course.rankingsKeywords.length;
    
    const gscNorms = course.gscKeywords.map(k => normalizeKeyword(k.term));
    const adsNorms = course.adsKeywords.map(k => normalizeKeyword(k.term));
    
    const matches = adsNorms.filter(norm => gscNorms.includes(norm)).length;
    const parity = adsCount > 0 ? Math.round((matches / adsCount) * 100) : 0;
    const gaps = adsNorms.filter(norm => !gscNorms.includes(norm)).length;
    
    document.getElementById('gsc-total').textContent = gscCount;
    document.getElementById('ads-total').textContent = adsCount;
    document.getElementById('parity-score').textContent = `${parity}%`;
    document.getElementById('organic-total').textContent = gaps;
}

function filterKeywords(query) {
    const q = query.toLowerCase();
    
    // 1. Filter currently visible tables
    const course = courses.find(c => c.id === activeCourseId);
    const filteredGsc = course.gscKeywords.filter(k => k.term.toLowerCase().includes(q));
    const filteredAds = course.adsKeywords.filter(k => k.term.toLowerCase().includes(q));
    renderTables(filteredGsc, filteredAds);

    // 2. Refresh sidebar to show which courses have matches (Global Search)
    renderCourseList(query);
}

document.addEventListener('DOMContentLoaded', init);
// --- GEMINI AI INTEGRATION ---
let pendingGeminiFile = null;
let activeAIModel = 'gemini'; // Default
let liveAdsContext = null;

const modelConfigs = {
    'gemini':   { name: 'Gemini 3',     color: '#4285F4', rgb: '66, 133, 244', grad: ['#4285F4', '#91B9FF'] },
    'gpt4o':    { name: 'GPT-5.5',       color: '#10A37F', rgb: '16, 163, 127', grad: ['#10A37F', '#19C37D'] },
    'claude':   { name: 'Claude Opus',   color: '#D97757', rgb: '217, 119, 87', grad: ['#D97757', '#F4A261'] }
};

let activePersona = 'marketeer';
const PERSONA_CONFIGS = {
    'seo': {
        name: 'SEO Strategist',
        instructions: "You are the Antigravity Technical SEO Strategist. Focus on organic rankings, technical metadata, and GSC deltas. Be analytical and professional. Identify drops and suggest technical fixes."
    },
    'ads': {
        name: 'Ads Specialist',
        instructions: "You are the Antigravity Performance Ads Specialist. Focus on ROI, CPC, and paid/organic synergy. Be results-oriented and urgent. Suggest budget moves to capture synergy gaps."
    },
    'marketeer': {
        name: 'General Marketeer',
        instructions: "You are the Antigravity Master Marketeer. Focus on branding, holistic strategy, and messaging. Be conversational, visionary, and creative. Help the user tell a story with the data."
    }
};

window.switchPersona = function(p) {
    activePersona = p;
    document.querySelectorAll('.persona-card').forEach(c => c.classList.remove('active'));
    document.getElementById(`persona-${p}`).classList.add('active');
    
    const introEl = document.getElementById('gemini-intro');
    if (introEl) {
        const config = PERSONA_CONFIGS[p];
        introEl.textContent = `I am now operating as your ${config.name}. How can I assist your ${p.toUpperCase()} strategy today?`;
    }
    console.log(`[Antigravity] Persona switched to: ${PERSONA_CONFIGS[p].name}`);
};

// Add Paste Support for Screenshots
document.addEventListener('paste', function(e) {
    const input = document.getElementById('gemini-user-input');
    if (document.activeElement !== input) return;
    
    const items = (e.clipboardData || e.originalEvent.clipboardData).items;
    for (let index in items) {
        const item = items[index];
        if (item.kind === 'file' && item.type.startsWith('image/')) {
            const blob = item.getAsFile();
            processGeminiFile(blob);
        }
    }
});

window.toggleGeminiSidebar = function() {
    const sidebar = document.getElementById('gemini-sidebar');
    sidebar.classList.toggle('open');
    
    // Personalize & Translate Greeting
    const user = localStorage.getItem('hub_user_name') || 'Team Member';
    const greetEl = document.getElementById('gemini-greeting');
    const introEl = document.getElementById('gemini-intro');
    const inputEl = document.getElementById('gemini-user-input');
    
    const t = TRANSLATIONS[currentLang || 'en'];
    if (greetEl) {
        const hello = t["greeting"] || (currentLang === 'pt' ? 'Olá' : 'Hello');
        greetEl.textContent = `${hello}, ${user}! 👋`;
    }
    
    updateAISidebarText();

    // Load key if exists
    const key = localStorage.getItem(`api_key_${activeAIModel}`);
    const keyInput = document.getElementById('active-api-key');
    if (keyInput) keyInput.value = key || '';
}

window.saveGeminiKey = function(key) {
    localStorage.setItem('gemini_api_key', key);
}

window.handleGeminiFileUpload = function(event) {
    const file = event.target.files[0];
    if (file) processGeminiFile(file);
}

function processGeminiFile(file) {
    const reader = new FileReader();
    const isImage = file.type.startsWith('image/');

    reader.onload = function(e) {
        pendingGeminiFile = {
            name: file.name || `pasted_image_${Date.now()}.png`,
            type: file.type || 'image/png',
            data: e.target.result.split(',')[1], // base64 without prefix
            isImage: isImage
        };
        
        const preview = document.getElementById('gemini-file-preview');
        const nameDisplay = document.getElementById('file-name-display');
        preview.classList.add('active');
        nameDisplay.textContent = isImage ? `📸 ${pendingGeminiFile.name}` : `📄 ${file.name}`;
    };

    if (isImage) {
        reader.readAsDataURL(file);
    } else {
        const textReader = new FileReader();
        textReader.onload = (e) => {
            pendingGeminiFile = {
                name: file.name,
                type: 'text/plain',
                content: e.target.result,
                isImage: false
            };
            const preview = document.getElementById('gemini-file-preview');
            const nameDisplay = document.getElementById('file-name-display');
            preview.classList.add('active');
            nameDisplay.textContent = `📄 ${file.name}`;
        };
        textReader.readAsText(file);
    }
}

window.clearGeminiFile = function() {
    pendingGeminiFile = null;
    document.getElementById('gemini-file-preview').classList.remove('active');
    document.getElementById('gemini-file-upload').value = '';
}

window.sendGeminiChat = function() {
    const input = document.getElementById('gemini-user-input');
    const msg = input.value.trim();
    if (!msg && !pendingGeminiFile) return;

    const chat = document.getElementById('gemini-chat');
    const userDiv = document.createElement('div');
    userDiv.className = 'ai-response';
    userDiv.style.background = 'rgba(66, 133, 244, 0.1)';
    userDiv.style.borderColor = 'rgba(66, 133, 244, 0.2)';
    
    let userHtml = `<strong>You:</strong> ${msg || '(Uploaded File)'}`;
    if (pendingGeminiFile) {
        userHtml += `<br><span style="font-size:10px; opacity:0.7;">📎 attached: ${pendingGeminiFile.name}</span>`;
    }
    userDiv.innerHTML = userHtml;
    
    chat.appendChild(userDiv);
    chat.scrollTop = chat.scrollHeight;

    const currentMsg = msg;
    const currentFile = pendingGeminiFile;

    input.value = '';
    clearGeminiFile();
    
    askGemini('custom', currentMsg, currentFile);
}


window.saveActiveModelKey = function(val) {
    localStorage.setItem(`api_key_${activeAIModel}`, val);
    console.log(`[Antigravity] API Key for ${activeAIModel} Saved.`);
}

window.showKeysWallet = function() {
    const modal = document.getElementById('wallet-modal');
    if (modal) {
        modal.style.display = 'flex';
        // Load current keys & ids
        Object.keys(modelConfigs).forEach(m => {
            const keyInput = document.getElementById(`wallet-key-${m}`);
            if (keyInput) keyInput.value = localStorage.getItem(`api_key_${m}`) || '';
            
            const agentInput = document.getElementById(`wallet-agent-${m}`);
            if (agentInput) agentInput.value = localStorage.getItem(`agent_id_${m}`) || '';
            
            const channelInput = document.getElementById(`wallet-channel-${m}`);
            if (channelInput) channelInput.value = localStorage.getItem(`channel_id_${m}`) || '';
        });
        // Load proxy
        const proxyInput = document.getElementById('wallet-proxy-url');
        if (proxyInput) proxyInput.value = localStorage.getItem('antigravity_api_proxy') || '';
    }
}

window.hideKeysWallet = function() {
    const modal = document.getElementById('wallet-modal');
    if (modal) modal.style.display = 'none';
}

window.saveWalletKeys = function() {
    Object.keys(modelConfigs).forEach(m => {
        const keyInput = document.getElementById(`wallet-key-${m}`);
        if (keyInput) localStorage.setItem(`api_key_${m}`, keyInput.value);
        
        const agentInput = document.getElementById(`wallet-agent-${m}`);
        if (agentInput) localStorage.setItem(`agent_id_${m}`, agentInput.value);
        
        const channelInput = document.getElementById(`wallet-channel-${m}`);
        if (channelInput) localStorage.setItem(`channel_id_${m}`, channelInput.value);
    });
    
    // Save proxy
    const proxyInput = document.getElementById('wallet-proxy-url');
    if (proxyInput) localStorage.setItem('antigravity_api_proxy', proxyInput.value);
    
    // Update active input in sidebar if it exists
    const activeKeyInput = document.getElementById('active-api-key');
    if (activeKeyInput) {
        activeKeyInput.value = localStorage.getItem(`api_key_${activeAIModel}`) || '';
    }
    
    hideKeysWallet();
    console.log("[Antigravity] All API Keys & Proxy Updated in Wallet.");
}

window.switchAIModel = function(model) {
    console.log(`[Antigravity] switchAIModel triggered for: ${model}`);
    
    // Check if we need to switch or just open sidebar
    if (activeAIModel === model) {
        const sidebar = document.getElementById('gemini-sidebar');
        if (!sidebar.classList.contains('open')) toggleGeminiSidebar();
        return;
    }
    
    activeAIModel = model;
    const config = modelConfigs[model];

    // Clear Chat for new model context
    const chat = document.getElementById('gemini-chat');
    if (chat) chat.innerHTML = '';

    // Update Tower Items Active State
    document.querySelectorAll('.tower-item').forEach(item => item.classList.remove('active'));
    const selector = `.${model === 'gpt4o' ? 'gpt' : model}-orb`;
    const activeItem = document.querySelector(selector);
    if (activeItem) activeItem.classList.add('active');

    // Update Main Button Appearance & Logo
    const btn = document.getElementById('gemini-btn');
    btn.title = `${config.name} (Active Pulse)`;
    
    // Swap Logo on Main Button
    if (activeItem) {
        const logoSvg = activeItem.querySelector('svg').cloneNode(true);
        logoSvg.style.width = "22px";
        logoSvg.style.height = "22px";
        btn.innerHTML = '';
        btn.appendChild(logoSvg);

        // ALSO SWAP SIDEBAR ICON
        const sidebarIcon = document.getElementById('sidebar-model-icon');
        if (sidebarIcon) {
            sidebarIcon.innerHTML = '';
            const sidebarLogoSvg = activeItem.querySelector('svg').cloneNode(true);
            sidebarLogoSvg.setAttribute('width', '24');
            sidebarLogoSvg.setAttribute('height', '24');
            // Apply model color to paths
            sidebarLogoSvg.querySelectorAll('path').forEach(p => p.setAttribute('fill', config.color));
            sidebarIcon.appendChild(sidebarLogoSvg);
        }
    }
    
    // Update API Key Input for specific model
    const keyInput = document.getElementById('active-api-key');
    if (keyInput) {
        keyInput.placeholder = `${config.name} API Key`;
        keyInput.value = localStorage.getItem(`api_key_${model}`) || '';
    }

    // Update CSS Variables for Aura
    document.documentElement.style.setProperty('--active-orb-rgb', config.rgb);
    document.documentElement.style.setProperty('--orb-color-1', config.grad[0]);
    document.documentElement.style.setProperty('--orb-color-2', config.grad[1]);
    document.documentElement.style.setProperty('--orb-color-3', config.grad[0]);
    document.documentElement.style.setProperty('--orb-color-4', config.grad[1]);

    // Update Sidebar Header
    const header = document.querySelector('.gemini-header h2');
    if (header) {
        header.textContent = config.name;
        header.style.background = `linear-gradient(90deg, ${config.grad[0]}, ${config.grad[1]})`;
        header.style.webkitBackgroundClip = 'text';
    }

    // Update Placeholder & Intro Text
    updateAISidebarText();

    // Visual feedback toast
    console.log(`%c [Antigravity] Switched to ${config.name}`, `color: ${config.color}; font-weight: bold;`);

    // AUTO-OPEN SIDEBAR ON SELECTION
    const sidebar = document.getElementById('gemini-sidebar');
    if (!sidebar.classList.contains('open')) toggleGeminiSidebar();
}

function updateAISidebarText() {
    const config = modelConfigs[activeAIModel];
    const introEl = document.getElementById('gemini-intro');
    const inputEl = document.getElementById('gemini-user-input');
    const sendBtn = document.querySelector('.gemini-send-btn svg path');
    
    if (introEl) {
        introEl.textContent = currentLang === 'pt' ? 
            `Eu sou o seu Estrategista ${config.name}. Pergunte-me qualquer coisa sobre as suas keywords ou use as ações rápidas abaixo.` :
            `I am your ${config.name} Strategist. Ask me anything about your institutional keywords or use the quick actions below.`;
    }
    if (inputEl) {
        inputEl.placeholder = currentLang === 'pt' ? `Pergunte ao ${config.name}...` : `Ask ${config.name} anything...`;
    }
}

window.askGemini = async function(action, customPrompt = "", attachedFile = null) {
    let promptText = customPrompt;
    if (action === 'seo') promptText = "Identify the biggest organic drops and gains in the fleet. Be specific about course names and click deltas.";
    if (action === 'ads') promptText = "Identify high-volume keywords currently missing from Ads but present in GSC or Rankings. Suggest budget shifts.";
    if (action === 'strategy') promptText = "Provide 3 high-impact strategic recommendations for the institutional fleet based on current performance and trends.";

    const isIAedu = activeAIModel !== 'gemini';
    const apiKey = localStorage.getItem(`api_key_${activeAIModel}`);
    
    if (!apiKey) {
        alert(`Please enter your ${activeAIModel.toUpperCase()} API Key first!`);
        return;
    }

    const chat = document.getElementById('gemini-chat');
    const course = activeCourseId !== null ? courses.find(c => c.id === activeCourseId) : null;
    
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'ai-response';
    const config = modelConfigs[activeAIModel];
    const targetName = course ? course.name : 'the institutional fleet';
    loadingDiv.innerHTML = `
        <div class="ai-thinking">
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
            <div class="thinking-dot"></div>
            <span style="margin-left: 10px;">${config.name} is thinking...</span>
        </div>
    `;
    chat.appendChild(loadingDiv);
    chat.scrollTop = chat.scrollHeight;

    document.title = 'SEO Keyword Hub | Antigravity v97 (Stable)';
    
    let context = `You are the Antigravity Master Strategist, currently operating as a ${PERSONA_CONFIGS[activePersona].name}. `;
    context += `PERSONA INSTRUCTIONS: ${PERSONA_CONFIGS[activePersona].instructions} `;
    context += "GENERAL RULES: Do NOT be stiff or scripted. Act like a real strategic partner. ";
    context += "Analyze the data deeply; don't just repeat it. Look for trends, outliers, and opportunities. ";
    context += "Use natural, fluid language. If asked about a person, check if they are leadership/faculty at ULP. ";
    context += "If you cannot find specific data, hypothesize based on market trends but stay grounded in the database provided. ";
    context += "NEVER say 'As an AI...'. Be direct, bold, and helpful. ";
    context += "LANGUAGE RULE: You MUST always respond in the same language the user uses. Se falarem em Português, responde em Português. If they speak English, respond in English. This is mandatory. ";
    context += "NO META-LABELS: Do not label your sections like 'Observation:', 'Insight:', or 'Closing the loop:'. Weave these naturally into your response. Do not tell the user what you are about to do; just do it. ";




    let dataPayload = {
        meta: { version: "v97", agent: "Antigravity Master Strategist" }
    };
    if (liveAdsContext) dataPayload.live_campaign_monitor = liveAdsContext;

    if (course) {
        dataPayload = {
            ...dataPayload,
            target: "Course Deep Dive",
            course_identity: { name: course.name, institution: course.institution, coordinator: course.coordinator || "Unknown" },
            performance_metrics: {
                search_console: course.gscKeywords.slice(0, 100).map(k => ({ term: k.term, clicks: k.clicks, click_delta: k.clickDelta })),
                rank_tracker: course.rankingsKeywords.slice(0, 100).map(k => ({ term: k.term, current_rank: k.rank, rank_delta: k.rankDelta || 0 }))
            }
        };
    } else {
        const allKeywords = courses.flatMap(c => (c.gscKeywords || []).map(k => ({ ...k, course: c.name })));
        
        // Filter and sort for actual movers to avoid identical lists
        const gainers = allKeywords.filter(k => (k.clickDelta || 0) > 0).sort((a,b) => (b.clickDelta || 0) - (a.clickDelta || 0)).slice(0, 30);
        const losers = allKeywords.filter(k => (k.clickDelta || 0) < 0).sort((a,b) => (a.clickDelta || 0) - (b.clickDelta || 0)).slice(0, 30);
        
        // Fallback if no delta data is present
        const trendData = (gainers.length > 0 || losers.length > 0) ? {
            biggest_gainers: gainers.map(k => ({ term: k.term, delta: k.clickDelta, course: k.course })),
            biggest_losers: losers.map(k => ({ term: k.term, delta: k.clickDelta, course: k.course }))
        } : {
            note: "No click-delta (trend) data found in the current sync. Showing top keywords by absolute volume instead.",
            top_keywords: allKeywords.sort((a,b) => (b.clicks || 0) - (a.clicks || 0)).slice(0, 30).map(k => ({ term: k.term, clicks: k.clicks, course: k.course }))
        };

        dataPayload = {
            ...dataPayload,
            target: "Fleet Commander View",
            total_courses: courses.length,
            representative_sample: courses.slice(0, 10).map(c => ({ name: c.name, inst: c.institution, coordinator: c.coordinator })),
            organic_movers: trendData
        };
    }

    const systemPrompt = context + "SYSTEM DATA: " + JSON.stringify(dataPayload);
    
    try {
        let text = "";
        if (isIAedu) {
            const agentId = localStorage.getItem(`agent_id_${activeAIModel}`) || 'cmor5objoex9gfp01vm7p95jh';
            const channelId = localStorage.getItem(`channel_id_${activeAIModel}`) || 'cmp19u43ta5pelx01jckgsqvl';
            const customProxy = localStorage.getItem('antigravity_api_proxy');
            
            if (!customProxy) {
                throw new Error("Proxy Required. Please set up your Cloudflare Worker in the Wallet.");
            }

            console.log(`[Antigravity] Calling AI via Proxy...`);
            
            const response = await fetch(customProxy, {
                method: 'POST',
                mode: 'cors',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    agent_id: agentId,
                    api_key: apiKey.trim(),
                    channel_id: channelId,
                    thread_id: "antigravity_" + activeAIModel + "_" + (activeCourseId || "global"),
                    message: systemPrompt + "\n\nUser Question: " + customPrompt
                })
            });

            const rawText = await response.text();
            console.log("[Antigravity] Raw AI Response:", rawText);
            
            if (!response.ok) throw new Error(`Agent API Failed: ${response.status}\n${rawText}`);
            
            try {
                // Deep-Brace Balancer Parser
                // Manually extracts JSON objects even if they have nested braces
                let fullResponse = "";
                let foundComplete = false;
                
                for (let i = 0; i < rawText.length; i++) {
                    if (rawText[i] === '{') {
                        let braceCount = 1;
                        let j = i + 1;
                        while (j < rawText.length && braceCount > 0) {
                            if (rawText[j] === '{') braceCount++;
                            else if (rawText[j] === '}') braceCount--;
                            j++;
                        }
                        if (braceCount === 0) {
                            const objStr = rawText.substring(i, j);
                            try {
                                const parsed = JSON.parse(objStr);
                                if (parsed.type === "message" && parsed.content && typeof parsed.content === 'object' && parsed.content.content) {
                                    text = parsed.content.content;
                                    foundComplete = true;
                                } else if (!foundComplete && parsed.type === "token" && typeof parsed.content === 'string') {
                                    fullResponse += parsed.content;
                                }
                            } catch(e) {}
                            i = j - 1; 
                        }
                    }
                }
                
                if (!foundComplete) text = fullResponse || rawText;
                
                // Final formatting cleanup
                text = text.replace(/<br\s*\/?>/gi, '\n').trim();
            } catch (e) {
                text = rawText;
            }
        } else {
            const parts = [{ text: systemPrompt + "\n\nUser Question: " + customPrompt }];
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: parts }] })
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error ? data.error.message : "API Failed");
            text = data.candidates[0].content.parts[0].text;
        }

        loadingDiv.remove();
        const resDiv = document.createElement('div');
        resDiv.className = 'ai-response';
        chat.appendChild(resDiv);
        
        const formatted = formatAIResponse(text);
        if (formatted.includes('<') && formatted.includes('>')) {
            resDiv.innerHTML = formatted;
        } else {
            typeWriter(resDiv, formatted);
        }
        chat.scrollTop = chat.scrollHeight;

    } catch (e) {
        console.error(`[Antigravity] ${config.name} Fetch Error:`, e);
        let errorMsg = e.message;
        if (errorMsg === "Failed to fetch") {
            errorMsg = "Network Error / CORS Blocked. Please check your internet connection or if the API proxy is down.";
        }
        loadingDiv.innerHTML = `<p style="color:var(--danger); font-size: 12px;">❌ <strong>${config.name} Error:</strong> ${errorMsg}</p>`;
    }
}

function typeWriter(element, text, speed = 10) {
    // Fix: If text contains HTML, render immediately to avoid showing tags as code
    if (text.includes('<') && text.includes('>')) {
        element.innerHTML = text;
        return;
    }
    
    let i = 0;
    element.innerHTML = '';
    function type() {
        if (i < text.length) {
            element.innerHTML += text.charAt(i);
            i++;
            setTimeout(type, speed);
        }
    }
    type();
}

function formatAIResponse(text) {
    if (!text) return "";
    
    let html = text;

    // 1. Headers (Handle before line breaks)
    html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');

    // 2. Bold/Italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // 3. Tables (Strategic Parsing)
    const tableRegex = /\|(.+)\|.*\n\|(?:\s*[:\-]+\s*\|?)+\n((?:\|.+\|.*\n?)*)/g;
    html = html.replace(tableRegex, (match, header, body) => {
        const headerCols = header.split('|').map(c => c.trim()).filter(c => c);
        const rows = body.trim().split('\n').map(row => {
            const cols = row.split('|').map(c => c.trim()).filter(c => c);
            if (cols.length === 0) return '';
            return `<tr>${cols.map(c => `<td>${c}</td>`).join('')}</tr>`;
        });
        
        return `<table><thead><tr>${headerCols.map(c => `<th>${c}</th>`).join('')}</tr></thead><tbody>${rows.join('')}</tbody></table>`;
    });

    // 4. Horizontal Rules
    html = html.replace(/^---$/gim, '<hr style="opacity: 0.1; margin: 20px 0;">');

    // 5. Lists
    html = html.replace(/^\s*[-*]\s+(.*$)/gim, '<li>$1</li>');
    
    // 6. Blockquotes
    html = html.replace(/^\>\s+(.*$)/gim, '<blockquote>$1</blockquote>');

    // 7. Line breaks
    html = html.replace(/\n/g, '<br>');

    return html;
}


