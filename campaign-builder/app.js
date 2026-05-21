/**
 * 🎯 Ads Campaign Builder JavaScript Core
 * Integrates with GitHub API for bidirectional JSON sync & Google Ads
 */

const BRANDING = {
  "Lusófona Lisboa": { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
  "Lusófona Porto":  { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
  "IPLUSO":          { hex: "#A20736", bgSub: "#780528", logo: "https://i.postimg.cc/fLR0Nksd/Logo-IPLUSO-ECIA-2.png" },
  "ISLA Gaia":       { hex: "#BB969B", bgSub: "#9C797E", logo: "https://i.postimg.cc/kGyZtjz7/Versa-o-Horizontal-Branco-2048x853.png" },
  "ISMAT":           { hex: "#7AC7CD", bgSub: "#5CA2A8", logo: "https://i.postimg.cc/0jpvXd31/logo-ISMAT-02.png" },
  "Grupo Lusófona":  { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" }
};

const TRANSLATIONS = {
    en: {
        "greeting": "Welcome to Ads Builder",
        "select-course": "Select a campaign from the sidebar to begin editing and Google Ads sync.",
        "brand-name": "Lusófona Group",
        "system-online": "Ads Engine Online",
        "headline-label": "Headline",
        "description-label": "Description",
        "sitelink-label": "Sitelink",
        "snippet-label": "Structured Snippet",
        "keywords-label": "Keywords Pool",
        "save-deploy": "Save & Deploy Campaign",
        "status-active": "ACTIVE",
        "status-paused": "PAUSED",
        "status-deployed": "DEPLOYED",
        "status-draft": "DRAFT",
        "placeholder-search": "Search campaigns...",
        "path-label": "Display Path",
        "url-label": "Final URL",
        "mobile-btn": "📱 Mobile",
        "desktop-btn": "💻 Desktop",
        "degree-mapping": {
            'TeSP': 'Vocational Training (TeSP)',
            'Licenciatura': "Bachelor's Degrees",
            'Mestrado Integrado': 'Integrated Masters',
            'Mestrado': "Master's Degrees",
            'Doutoramento': 'Doctorates',
            'Pós-Graduação': 'Post-Graduate',
            'Formações': 'Training / Other'
        }
    },
    pt: {
        "greeting": "Bem-vindo ao Ads Builder",
        "select-course": "Selecione uma campanha na barra lateral para começar a editar e sincronizar com o Google Ads.",
        "brand-name": "Grupo Lusófona",
        "system-online": "Motor de Ads Ativo",
        "headline-label": "Título",
        "description-label": "Descrição",
        "sitelink-label": "Sitelink",
        "snippet-label": "Snippet Estruturado",
        "keywords-label": "Pool de Palavras-Chave",
        "save-deploy": "Salvar & Publicar Campanha",
        "status-active": "ATIVO",
        "status-paused": "PAUSADO",
        "status-deployed": "PUBLICADO",
        "status-draft": "RASCUNHO",
        "placeholder-search": "Procurar campanhas...",
        "path-label": "Caminho de Exibição",
        "url-label": "URL Final",
        "mobile-btn": "📱 Telemóvel",
        "desktop-btn": "💻 Computador",
        "degree-mapping": {
            'TeSP': 'CTeSP',
            'Licenciatura': 'Licenciaturas',
            'Mestrado Integrado': 'Mestrados Integrados',
            'Mestrado': 'Mestrados',
            'Doutoramento': 'Doutoramentos',
            'Pós-Graduação': 'Pós-Graduações',
            'Formações': 'Formações'
        }
    }
};

let currentLang = 'pt';
let courses = [];
let adsConfig = {};
let adsConfigSha = null;
let activeCourseName = null;
let activeCourseObj = null;
let previewDevice = 'mobile';

// Sync auth and credentials via URL query parameters (important for file:/// and cross-origin sandboxing)
function syncUrlCredentials() {
    const urlParams = new URLSearchParams(window.location.search);
    const urlUser = urlParams.get('user');
    const urlToken = urlParams.get('token');
    
    if (urlUser) {
        localStorage.setItem('hub_user_name', urlUser);
        localStorage.setItem('hub_is_authed', 'true');
    }
    if (urlToken) {
        localStorage.setItem('github_token', urlToken);
    }
    
    const activeUser = localStorage.getItem('hub_user_name');
    const activeToken = localStorage.getItem('github_token');
    
    if (activeUser) {
        const queryParams = new URLSearchParams();
        queryParams.set('user', activeUser);
        if (activeToken) queryParams.set('token', activeToken);
        const queryStr = queryParams.toString();
        
        // Update all sidebar links
        document.querySelectorAll('.nav-degree-container a, aside.sidebar a').forEach(el => {
            let href = el.getAttribute('href');
            if (href && href !== '#' && !href.startsWith('javascript:')) {
                const baseUrl = href.split('?')[0];
                el.setAttribute('href', `${baseUrl}?${queryStr}`);
            }
        });
    }
}

// Initialize the application
async function init() {
    syncUrlCredentials();

    // Auth guard: redirect to main dashboard login if not authenticated
    const isAuthed = localStorage.getItem('hub_is_authed') === 'true';
    const userName = localStorage.getItem('hub_user_name');
    if (!isAuthed || !userName) {
        // Preserve current destination so after login they can come back
        window.location.href = '../index.html';
        return;
    }

    initLanguage();
    initTheme();
    await loadCourses();
    await loadAdsConfig();
    renderCourseList();
    initGlobalListeners();
}

function initLanguage() {
    const savedLang = localStorage.getItem('antigravity_language');
    if (savedLang) {
        currentLang = savedLang;
    } else {
        localStorage.setItem('antigravity_language', currentLang);
    }
    document.getElementById('lang-toggle-text').textContent = currentLang.toUpperCase();
    
    // Set UI language text
    const t = TRANSLATIONS[currentLang];
    document.getElementById('brand-name').textContent = t["brand-name"];
    document.getElementById('system-active-text').textContent = t["system-online"];
    document.getElementById('landing-subtitle').textContent = t["select-course"];
    document.getElementById('course-search-sidebar').placeholder = t["placeholder-search"];
    document.getElementById('btn-device-mobile').textContent = t["mobile-btn"];
    document.getElementById('btn-device-desktop').textContent = t["desktop-btn"];
}

function toggleLanguage() {
    currentLang = currentLang === 'pt' ? 'en' : 'pt';
    localStorage.setItem('antigravity_language', currentLang);
    document.getElementById('lang-toggle-text').textContent = currentLang.toUpperCase();
    initLanguage();
    renderCourseList();
    if (activeCourseName) {
        const descEl = document.getElementById('active-course-desc');
        const t = TRANSLATIONS[currentLang];
        const displayDegree = t["degree-mapping"][activeCourseObj.degree_type] || activeCourseObj.degree_type;
        descEl.textContent = `${activeCourseObj.institution} • ${displayDegree}`;
    }
}

function initTheme() {
    const savedTheme = localStorage.getItem('antigravity_theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }
}

// Retrieve github token
async function getGitHubToken() {
    let token = localStorage.getItem('github_token');
    if (!token) {
        try {
            const response = await fetch('../github_config.json');
            if (response.ok) {
                const config = await response.json();
                token = config.github_token;
                if (token) {
                    localStorage.setItem('github_token', token);
                }
            }
        } catch (e) {
            console.error("Failed to load github_config.json:", e);
        }
    }
    return token;
}

// Load courses from courses.json
async function loadCourses() {
    try {
        const url = window.location.protocol === 'file:' ? '../courses.json' : '../courses.json?v=' + Date.now();
        const response = await fetch(url);
        if (response.ok) {
            const data = await response.json();
            courses = data.filter(c => c.type !== 'metadata');
        } else {
            console.error("Failed to load courses.json");
        }
    } catch (e) {
        console.error("Error loading courses.json:", e);
    }
}

// Load ads_config.json (GitHub with local fallback)
async function loadAdsConfig() {
    const token = await getGitHubToken();
    if (token) {
        try {
            // Fetch from GitHub
            const response = await fetch('https://api.github.com/repos/LaminatedYamal/ULUS-FONA/contents/ads_config.json', {
                headers: {
                    'Authorization': `token ${token}`,
                    'Accept': 'application/vnd.github.v3+json'
                }
            });
            if (response.ok) {
                const data = await response.json();
                adsConfigSha = data.sha;
                const rawContent = atob(data.content.replace(/\s/g, ''));
                const utf8Content = decodeURIComponent(escape(rawContent));
                adsConfig = JSON.parse(utf8Content);
                console.log("Successfully loaded ads_config.json from GitHub!");
                
                // Set username display from stored credentials
                const user = localStorage.getItem('hub_user_name') || 'Ads Admin';
                document.getElementById('user-display-name').textContent = user;
                return;
            }
        } catch (e) {
            console.error("GitHub API load failed. Falling back to local file...", e);
        }
    }
    
    // Local fallback
    try {
        const response = await fetch('../ads_config.json');
        if (response.ok) {
            adsConfig = await response.json();
            console.log("Loaded ads_config.json from local fallback.");
        }
    } catch (e) {
        console.error("Failed to load ads_config.json locally:", e);
    }
    // Always use the authenticated user's name (auth guard above ensures they're logged in)
    const user = localStorage.getItem('hub_user_name') || 'Ads Admin';
    document.getElementById('user-display-name').textContent = user;
}

function stripAccents(str) {
    return (str || '').normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function cleanKeywordForMatch(kwText) {
    let text = (kwText || '').trim().toLowerCase();
    if (text.startsWith('[') && text.endsWith(']')) {
        text = text.substring(1, text.length - 1);
    } else if (text.startsWith('"') && text.endsWith('"')) {
        text = text.substring(1, text.length - 1);
    }
    return stripAccents(text.trim());
}

function checkKeywordMatch(inputText, activeKeywords) {
    if (!inputText) return false;
    const cleanInput = stripAccents(inputText.toLowerCase());
    for (const kw of activeKeywords) {
        const cleanKwText = cleanKeywordForMatch(kw.text);
        if (cleanKwText && cleanInput.includes(cleanKwText)) {
            return true;
        }
    }
    return false;
}

function normalizeCourseCampaign(obj, courseRawObj) {
    if (!obj) obj = {};
    if (!obj.id) obj.id = (courseRawObj && courseRawObj.id) ? courseRawObj.id : Date.now();
    if (!obj.institution) obj.institution = (courseRawObj && courseRawObj.institution) ? courseRawObj.institution : 'Grupo Lusófona';
    if (!obj.degree) obj.degree = (courseRawObj && courseRawObj.degree_type) ? (courseRawObj.degree_type === 'Licenciatura' ? 'Licenciaturas' : courseRawObj.degree_type) : 'Licenciaturas';
    if (!obj.degree_type) obj.degree_type = (courseRawObj && courseRawObj.degree_type) ? courseRawObj.degree_type : 'Licenciatura';
    if (!obj.status) obj.status = 'PAUSED';
    if (!Array.isArray(obj.headlines)) obj.headlines = [];
    if (!Array.isArray(obj.descriptions)) obj.descriptions = [];
    if (obj.finalUrl === undefined || obj.finalUrl === null) obj.finalUrl = '';
    if (obj.path1 === undefined || obj.path1 === null) obj.path1 = '';
    if (obj.path2 === undefined || obj.path2 === null) obj.path2 = '';
    if (!Array.isArray(obj.sitelinks)) obj.sitelinks = [];
    if (!obj.snippets || typeof obj.snippets !== 'object') {
        obj.snippets = { header: 'Cursos', values: [] };
    } else {
        if (!obj.snippets.header) obj.snippets.header = 'Cursos';
        if (!Array.isArray(obj.snippets.values)) obj.snippets.values = [];
    }
    if (!Array.isArray(obj.keywords)) obj.keywords = [];
    if (!Array.isArray(obj.keywordPool)) obj.keywordPool = [];
    if (!obj.livePulse || typeof obj.livePulse !== 'object') {
        obj.livePulse = {
            budget: '-- €',
            clicks: 0,
            impressions: 0,
            cost: '-- €',
            conversions: 0,
            costPerConv: '-- €',
            period: 'Últimos 30 Dias'
        };
    } else {
        const lp = obj.livePulse;
        if (lp.budget === undefined) lp.budget = '-- €';
        if (lp.clicks === undefined) lp.clicks = 0;
        if (lp.impressions === undefined) lp.impressions = 0;
        if (lp.cost === undefined) lp.cost = '-- €';
        if (lp.conversions === undefined) lp.conversions = 0;
        if (lp.costPerConv === undefined) lp.costPerConv = '-- €';
        if (lp.period === undefined) lp.period = 'Últimos 30 Dias';
    }
    if (obj.lastUpdated === undefined || obj.lastUpdated === null) obj.lastUpdated = '';
    if (obj.lastSynced === undefined || obj.lastSynced === null) obj.lastSynced = '';
    return obj;
}

window.runSmartValidation = function() {
    if (!activeCourseObj) return;
    const activeKeywords = (activeCourseObj.keywords || []).filter(k => k.status === 'ENABLED' && k.text);

    function getDuplicates(selector) {
        const fields = document.querySelectorAll(selector);
        const seen = new Set();
        const duplicates = new Set();
        fields.forEach(f => {
            const text = f.value.trim().toLowerCase();
            if (text) {
                if (seen.has(text)) {
                    duplicates.add(text);
                }
                seen.add(text);
            }
        });
        return duplicates;
    }

    const duplicateHeadlines = getDuplicates('.headline-field');
    const duplicateDescriptions = getDuplicates('.description-field');

    const specs = [
        { selector: '.headline-field', limit: 30, duplicates: duplicateHeadlines, counterPrefix: 'headline-counter-', hasIndexBadge: true },
        { selector: '.description-field', limit: 90, duplicates: duplicateDescriptions, counterPrefix: 'desc-counter-', hasIndexBadge: true },
        { selector: '.sl-headline-input', limit: 25, counterClass: 'sl-headline-counter' },
        { selector: '.sl-desc1-input', limit: 35, counterClass: 'sl-desc1-counter' },
        { selector: '.sl-desc2-input', limit: 35, counterClass: 'sl-desc2-counter' },
        { selector: '.snippet-val-input', limit: 25, counterClass: 'snippet-val-counter' },
        { selector: '#path1-input', limit: 15, counterId: 'path1-counter' },
        { selector: '#path2-input', limit: 15, counterId: 'path2-counter' }
    ];

    specs.forEach(spec => {
        const fields = document.querySelectorAll(spec.selector);
        fields.forEach((input, idx) => {
            const val = input.value;
            const rawLen = val.length;
            const trimmed = val.trim();
            const lowerTrimmed = trimmed.toLowerCase();
            const isDuplicate = spec.duplicates && trimmed && spec.duplicates.has(lowerTrimmed);
            const isExceeded = rawLen > spec.limit;
            const isKwMatch = checkKeywordMatch(val, activeKeywords);
            const isInvalid = isExceeded || isDuplicate;

            input.classList.remove('invalid-limit', 'keyword-match');
            if (isInvalid) {
                input.classList.add('invalid-limit');
            } else if (isKwMatch) {
                input.classList.add('keyword-match');
            }

            let counterEl = null;
            if (spec.counterId) {
                counterEl = document.getElementById(spec.counterId);
            } else if (spec.counterPrefix) {
                counterEl = document.getElementById(`${spec.counterPrefix}${idx}`);
            } else if (spec.counterClass) {
                const parent = input.closest('.input-counter-wrapper');
                if (parent) {
                    counterEl = parent.querySelector(`.${spec.counterClass}`);
                }
            }

            if (counterEl) {
                counterEl.textContent = `${rawLen}/${spec.limit}`;
                counterEl.classList.remove('limit-exceeded');
                if (isExceeded) {
                    counterEl.classList.add('limit-exceeded');
                }
            }

            if (spec.hasIndexBadge) {
                const rowItem = input.closest('.row-input-item');
                if (rowItem) {
                    const badge = rowItem.querySelector('.row-index-badge');
                    if (badge) {
                        if (trimmed) {
                            badge.classList.add('active-filled');
                        } else {
                            badge.classList.remove('active-filled');
                        }
                    }
                }
            }

            if (spec.duplicates) {
                const wrapper = input.parentElement;
                if (wrapper) {
                    let dupMarker = wrapper.querySelector('.duplicate-marker');
                    if (isDuplicate) {
                        if (!dupMarker) {
                            dupMarker = document.createElement('span');
                            dupMarker.className = 'duplicate-marker';
                            dupMarker.textContent = '⚠️ Duplicate';
                            wrapper.appendChild(dupMarker);
                        }
                    } else {
                        if (dupMarker) dupMarker.remove();
                    }
                }
            }
        });
    });

    updateTotalInputCounts();
};

// Helper: Convert hex to rgb
function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

// Helper: Get contrast color (black or white)
function getContrastColor(hex) {
    const rgb = hexToRgb(hex);
    if (!rgb) return '#ffffff';
    const brightness = (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    return brightness > 130 ? '#000000' : '#ffffff';
}

// Render course nav list
function renderCourseList(searchQuery = '') {
    const nav = document.getElementById('course-list');
    if (!nav) return;
    nav.innerHTML = '';

    const q = searchQuery.toLowerCase().trim();

    // Group courses by institution and degree type
    const grouped = {};
    courses.forEach(c => {
        const cleanName = c.name.replace(/[^\w\s]/gi, '');
        const nameMatch = c.name.toLowerCase().includes(q) || cleanName.toLowerCase().includes(q);
        
        if (!q || nameMatch) {
            if (!grouped[c.institution]) grouped[c.institution] = {};
            let degree = c.degree_type || 'Formações';
            if (degree.toLowerCase() === 'unknown') degree = 'Formações';
            if (!grouped[c.institution][degree]) grouped[c.institution][degree] = [];
            grouped[c.institution][degree].push(c);
        }
    });

    const instOrder = ['Lusófona Lisboa', 'Lusófona Porto', 'IPLUSO', 'ISLA Gaia', 'ISMAT', 'Grupo Lusófona'];
    const t = TRANSLATIONS[currentLang];

    Object.keys(grouped).sort((a, b) => {
        const indexA = instOrder.indexOf(a);
        const indexB = instOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    }).forEach(inst => {
        const brand = BRANDING[inst] || { hex: "#002D62", bgSub: "#001b3b" };
        
        // Institution Accordion Header
        const instHeader = document.createElement('div');
        instHeader.className = 'nav-group-header';
        instHeader.textContent = inst.toUpperCase();
        
        // Custom styling for branding
        instHeader.style.backgroundColor = brand.hex;
        instHeader.style.color = getContrastColor(brand.hex);
        instHeader.style.borderColor = `rgba(255, 255, 255, 0.15)`;
        
        const degreeContainer = document.createElement('div');
        degreeContainer.className = 'nav-degree-container';
        
        instHeader.addEventListener('click', () => {
            const isExpanded = instHeader.classList.toggle('expanded');
            degreeContainer.classList.toggle('expanded', isExpanded);
            // Close other accordions
            document.querySelectorAll('.nav-group-header').forEach(hdr => {
                if (hdr !== instHeader) {
                    hdr.classList.remove('expanded');
                    const container = hdr.nextElementSibling;
                    if (container) container.classList.remove('expanded');
                }
            });
        });

        nav.appendChild(instHeader);
        nav.appendChild(degreeContainer);

        const degreeOrder = ['TeSP', 'Licenciatura', 'Mestrado Integrado', 'Mestrado', 'Doutoramento', 'Pós-Graduação', 'Formações'];
        
        Object.keys(grouped[inst]).sort((a, b) => {
            const indexA = degreeOrder.indexOf(a);
            const indexB = degreeOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        }).forEach(degree => {
            // Degree header inside institution
            const degreeHdr = document.createElement('div');
            degreeHdr.className = 'nav-degree-btn';
            degreeHdr.textContent = t["degree-mapping"][degree] || degree;
            degreeHdr.style.fontWeight = 'bold';
            degreeHdr.style.borderBottom = '1px solid rgba(255,255,255,0.05)';
            
            const coursesListContainer = document.createElement('div');
            coursesListContainer.style.padding = '0 0 10px 12px';
            coursesListContainer.style.display = 'none';
            coursesListContainer.style.flexDirection = 'column';
            coursesListContainer.style.gap = '4px';

            degreeHdr.addEventListener('click', (e) => {
                e.stopPropagation();
                const isShowing = coursesListContainer.style.display === 'flex';
                coursesListContainer.style.display = isShowing ? 'none' : 'flex';
                degreeHdr.classList.toggle('active', !isShowing);
            });

            degreeContainer.appendChild(degreeHdr);
            degreeContainer.appendChild(coursesListContainer);

            // Sort courses by name
            grouped[inst][degree].sort((a, b) => a.name.localeCompare(b.name)).forEach(course => {
                const courseLink = document.createElement('div');
                courseLink.className = 'nav-degree-btn';
                courseLink.style.fontSize = '12px';
                courseLink.style.padding = '8px 12px';
                courseLink.style.borderRadius = '8px';
                courseLink.style.background = 'rgba(255,255,255,0.02)';
                courseLink.style.border = '1px solid rgba(255,255,255,0.04)';
                courseLink.textContent = course.name;

                if (activeCourseName === course.name) {
                    courseLink.style.borderColor = brand.hex;
                    courseLink.style.background = `rgba(${hexToRgb(brand.hex).r}, ${hexToRgb(brand.hex).g}, ${hexToRgb(brand.hex).b}, 0.15)`;
                    courseLink.style.color = '#ffffff';
                }

                courseLink.addEventListener('click', (e) => {
                    e.stopPropagation();
                    document.querySelectorAll('#course-list .nav-degree-btn').forEach(btn => {
                        btn.style.background = '';
                        btn.style.borderColor = '';
                        btn.style.color = '';
                    });
                    courseLink.style.borderColor = brand.hex;
                    courseLink.style.background = `rgba(${hexToRgb(brand.hex).r}, ${hexToRgb(brand.hex).g}, ${hexToRgb(brand.hex).b}, 0.15)`;
                    courseLink.style.color = '#ffffff';
                    
                    loadCourseCampaign(course.name, course);
                });

                coursesListContainer.appendChild(courseLink);
            });

            // Expand if search query matches
            if (q) {
                instHeader.classList.add('expanded');
                degreeContainer.classList.add('expanded');
                coursesListContainer.style.display = 'flex';
                degreeHdr.classList.add('active');
            }
        });
    });
}

// Load selected course's campaign configuration
function loadCourseCampaign(courseName, courseRawObj) {
    activeCourseName = courseName;
    
    // Normalize campaign properties on load (handles missing/empty fields)
    adsConfig[courseName] = normalizeCourseCampaign(adsConfig[courseName], courseRawObj);
    activeCourseObj = adsConfig[courseName];
    
    // Apply branding color dynamics
    const brand = BRANDING[activeCourseObj.institution] || { hex: "#00f2ff", bgSub: "#001b3b", logo: "" };
    document.documentElement.style.setProperty('--accent-primary', brand.hex);
    const rgb = hexToRgb(brand.hex);
    if (rgb) {
        document.documentElement.style.setProperty('--accent-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
        document.documentElement.style.setProperty('--blob-gradient', `radial-gradient(circle, rgba(${rgb.r},${rgb.g},${rgb.b},0.15) 0%, rgba(10,12,16,0) 70%)`);
    }
    
    // Update logo in header
    const logoImg = document.getElementById('brand-logo');
    if (logoImg && brand.logo) {
        logoImg.src = brand.logo;
    }
    document.getElementById('brand-name').textContent = activeCourseObj.institution;
    
    // Show top-bar and forms workspace
    document.getElementById('dashboard-header-left').style.visibility = 'visible';
    document.getElementById('active-course-title').textContent = activeCourseName;
    
    const t = TRANSLATIONS[currentLang];
    const displayDegree = t["degree-mapping"][activeCourseObj.degree_type] || activeCourseObj.degree_type;
    document.getElementById('active-course-desc').textContent = `${activeCourseObj.institution} • ${displayDegree}`;
    
    document.getElementById('landing-view').style.display = 'none';
    document.getElementById('workspace-view').style.display = 'block';
    
    // Populate form data
    populateForms();
}

// Populate forms with loaded course config
function populateForms() {
    const obj = activeCourseObj;
    
    // 1. Status Toggle Remote Control
    const statusCheckbox = document.getElementById('campaign-status-checkbox');
    const statusLabel = document.getElementById('campaign-status-label');
    
    const isLive = obj.status === 'START' || obj.status === 'ACTIVE' || obj.status === 'DEPLOYED';
    statusCheckbox.checked = isLive;
    
    if (isLive) {
        statusLabel.textContent = obj.status === 'DEPLOYED' ? 'DEPLOYED' : 'ACTIVE';
        statusLabel.className = 'status-badge active';
        if (obj.status === 'DEPLOYED') {
            statusLabel.className = 'status-badge deployed';
        }
    } else {
        statusLabel.textContent = 'PAUSED';
        statusLabel.className = 'status-badge paused';
    }
    
    // Sync badge
    const syncBadge = document.getElementById('copy-sync-badge');
    if (obj.status === 'DEPLOYED') {
        syncBadge.textContent = 'Synced';
        syncBadge.className = 'sync-status-indicator status-active-badge';
    } else {
        syncBadge.textContent = 'Draft';
        syncBadge.className = 'sync-status-indicator status-paused-badge';
    }
    
    // 2. Performance Metrics
    const pulse = obj.livePulse || {};
    document.getElementById('pulse-budget').textContent = pulse.budget || '-- €';
    document.getElementById('pulse-clicks').textContent = pulse.clicks !== undefined ? pulse.clicks : '--';
    document.getElementById('pulse-impressions').textContent = pulse.impressions !== undefined ? pulse.impressions : '--';
    document.getElementById('pulse-cost').textContent = pulse.cost || '-- €';
    document.getElementById('pulse-conversions').textContent = pulse.conversions !== undefined ? pulse.conversions : '--';
    document.getElementById('pulse-cpa').textContent = pulse.costPerConv || '-- €';
    
    // 3. Final URL & Display Paths
    document.getElementById('final-url-input').value = obj.finalUrl || '';
    
    const p1Input = document.getElementById('path1-input');
    const p2Input = document.getElementById('path2-input');
    p1Input.value = obj.path1 || '';
    p2Input.value = obj.path2 || '';
    
    document.getElementById('path1-counter').textContent = `${p1Input.value.length}/15`;
    document.getElementById('path2-counter').textContent = `${p2Input.value.length}/15`;
    
    // 4. Headlines & Descriptions Dynamic Input Fields
    generateHeadlineInputs();
    generateDescriptionInputs();
    
    // 5. Sitelinks dynamic input fields
    generateSitelinkInputs();
    
    // 6. Snippets dynamic fields
    populateSnippetFields();
    
    // 7. Active keywords + keyword pool tables
    populateActiveKeywordsTable();
    populateKeywordsTable();
    
    // 8. Run smart validation
    runSmartValidation();
    
    // 9. Trigger real-time mockup preview update
    updateAdPreview();
}

// Generate Headlines Inputs (Exactly 15 rows)
function generateHeadlineInputs() {
    const container = document.getElementById('headlines-inputs-container');
    container.innerHTML = '';
    
    const headlinesList = objHeadlinesList();
    let totalCount = 0;
    
    for (let i = 0; i < 15; i++) {
        const val = headlinesList[i] || '';
        if (val.trim()) totalCount++;
        
        const row = document.createElement('div');
        row.className = 'row-input-item';
        
        const badge = document.createElement('div');
        badge.className = `row-index-badge ${val.trim() ? 'active-filled' : ''}`;
        badge.textContent = i + 1;
        
        const wrap = document.createElement('div');
        wrap.className = 'input-counter-wrapper';
        wrap.style.flex = '1';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sleek-input headline-field';
        input.dataset.index = i;
        input.maxLength = 100; // Allow typing past the 30 chars limit
        input.value = val;
        input.placeholder = `Add headline ${i+1}...`;
        
        const counter = document.createElement('span');
        counter.className = 'char-counter';
        counter.id = `headline-counter-${i}`;
        counter.textContent = `${val.length}/30`;
        
        wrap.appendChild(input);
        wrap.appendChild(counter);
        row.appendChild(badge);
        row.appendChild(wrap);
        container.appendChild(row);
        
        // Input Listener using centralized validation
        input.addEventListener('input', () => {
            runSmartValidation();
            updateAdPreview();
        });
    }
    
    document.getElementById('headlines-total-count').textContent = `${totalCount} / 15`;
}

// Generate Descriptions Inputs (Exactly 4 rows)
function generateDescriptionInputs() {
    const container = document.getElementById('descriptions-inputs-container');
    container.innerHTML = '';
    
    const descList = objDescriptionsList();
    let totalCount = 0;
    
    for (let i = 0; i < 4; i++) {
        const val = descList[i] || '';
        if (val.trim()) totalCount++;
        
        const row = document.createElement('div');
        row.className = 'row-input-item';
        
        const badge = document.createElement('div');
        badge.className = `row-index-badge ${val.trim() ? 'active-filled' : ''}`;
        badge.textContent = i + 1;
        
        const wrap = document.createElement('div');
        wrap.className = 'input-counter-wrapper';
        wrap.style.flex = '1';
        
        const input = document.createElement('input');
        input.type = 'text';
        input.className = 'sleek-input description-field';
        input.dataset.index = i;
        input.maxLength = 250; // Allow typing past the 90 chars limit
        input.value = val;
        input.placeholder = `Add description ${i+1}...`;
        
        const counter = document.createElement('span');
        counter.className = 'char-counter';
        counter.id = `desc-counter-${i}`;
        counter.textContent = `${val.length}/90`;
        
        wrap.appendChild(input);
        wrap.appendChild(counter);
        row.appendChild(badge);
        row.appendChild(wrap);
        container.appendChild(row);
        
        // Input Listener using centralized validation
        input.addEventListener('input', () => {
            runSmartValidation();
            updateAdPreview();
        });
    }
    
    document.getElementById('descriptions-total-count').textContent = `${totalCount} / 4`;
}

// Generate Sitelink Editor Panels (Exactly 8 panels)
function generateSitelinkInputs() {
    const container = document.getElementById('sitelinks-inputs-container');
    container.innerHTML = '';
    
    const sitelinks = activeCourseObj.sitelinks || [];
    
    for (let i = 0; i < 8; i++) {
        const sl = sitelinks[i] || { headline: '', desc1: '', desc2: '', url: '' };
        
        const card = document.createElement('div');
        card.className = 'sitelink-editor-card';
        
        card.innerHTML = `
            <div class="sitelink-card-header">Sitelink #${i + 1}</div>
            
            <div class="form-group">
                <label>Link Text</label>
                <div class="input-counter-wrapper">
                    <input type="text" class="sleek-input sl-headline-input" dataset-index="${i}" maxlength="100" placeholder="Headline text (max 25)" value="${sl.headline || ''}">
                    <span class="char-counter sl-headline-counter">0/25</span>
                </div>
            </div>
            
            <div class="path-group">
                <div class="form-group">
                    <label>Description Line 1</label>
                    <div class="input-counter-wrapper">
                        <input type="text" class="sleek-input sl-desc1-input" dataset-index="${i}" maxlength="150" placeholder="Description line 1 (max 35)" value="${sl.desc1 || ''}">
                        <span class="char-counter sl-desc1-counter">0/35</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description Line 2</label>
                    <div class="input-counter-wrapper">
                        <input type="text" class="sleek-input sl-desc2-input" dataset-index="${i}" maxlength="150" placeholder="Description line 2 (max 35)" value="${sl.desc2 || ''}">
                        <span class="char-counter sl-desc2-counter">0/35</span>
                    </div>
                </div>
            </div>
            
            <div class="form-group" style="margin-bottom:0;">
                <label>Final URL</label>
                <input type="url" class="sleek-input sl-url-input" dataset-index="${i}" placeholder="https://example.com/sitelink-target" value="${sl.url || ''}">
            </div>
        `;
        
        container.appendChild(card);
        
        const hInp = card.querySelector('.sl-headline-input');
        const d1Inp = card.querySelector('.sl-desc1-input');
        const d2Inp = card.querySelector('.sl-desc2-input');
        const uInp = card.querySelector('.sl-url-input');
        
        [hInp, d1Inp, d2Inp].forEach(inp => {
            inp.addEventListener('input', () => {
                runSmartValidation();
                updateAdPreview();
            });
        });
        
        uInp.addEventListener('input', updateAdPreview);
    }
}

// Populate snippets controls
function populateSnippetFields() {
    const snips = activeCourseObj.snippets || { header: 'Cursos', values: [] };
    const select = document.getElementById('snippet-header');
    
    if (snips.header) {
        select.value = snips.header;
    } else {
        select.value = 'Cursos';
    }
    
    const container = document.getElementById('snippets-values-container');
    container.innerHTML = '';
    
    const values = snips.values || [];
    values.forEach((v, idx) => {
        addSnippetValueRow(v);
    });
    
    // Pad to at least 3 rows if empty
    if (container.children.length === 0) {
        for (let i = 0; i < 3; i++) {
            addSnippetValueRow('');
        }
    }
}

function addSnippetValueRow(val) {
    const container = document.getElementById('snippets-values-container');
    const row = document.createElement('div');
    row.className = 'snippet-value-row';
    
    row.innerHTML = `
        <div class="input-counter-wrapper" style="flex:1;">
            <input type="text" class="sleek-input snippet-val-input" maxlength="100" placeholder="Value (e.g. Design)" value="${val}">
            <span class="char-counter snippet-val-counter">0/25</span>
        </div>
        <button class="snippet-delete-btn" onclick="deleteSnippetRow(this)">🗑️</button>
    `;
    
    container.appendChild(row);
    
    const inp = row.querySelector('.snippet-val-input');
    
    inp.addEventListener('input', () => {
        runSmartValidation();
        updateAdPreview();
    });
}

function addSnippetValueField() {
    const container = document.getElementById('snippets-values-container');
    if (container.children.length >= 10) {
        alert("Maximum 10 Structured Snippet values allowed.");
        return;
    }
    addSnippetValueRow('');
    updateAdPreview();
}

window.deleteSnippetRow = function(btn) {
    const container = document.getElementById('snippets-values-container');
    if (container.children.length <= 3) {
        alert("Structured Snippets require at least 3 values.");
        return;
    }
    btn.parentElement.remove();
    updateAdPreview();
};

// Active Ad Keywords table
function populateActiveKeywordsTable() {
    const tbody = document.getElementById('active-keywords-table-body');
    tbody.innerHTML = '';
    
    const kws = activeCourseObj.keywords || [];
    
    if (kws.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; opacity:0.5; padding: 20px;">No active ad keywords yet. Add one above or promote from the Keyword Pool below.</td></tr>`;
        return;
    }
    
    kws.forEach((k, idx) => {
        const row = document.createElement('tr');
        
        let matchType = 'Broad';
        let badgeClass = 'badge-broad';
        const txt = (k.text || '').trim();
        
        if (txt.startsWith('[') && txt.endsWith(']')) {
            matchType = 'Exact';
            badgeClass = 'badge-exact';
        } else if (txt.startsWith('"') && txt.endsWith('"')) {
            matchType = 'Phrase';
            badgeClass = 'badge-phrase';
        }
        
        const status = k.status === 'ENABLED' ? 'ENABLED' : 'PAUSED';
        const statusClass = status === 'ENABLED' ? 'status-indicator-badge status-active-badge' : 'status-indicator-badge status-paused-badge';
        const vol = k.volume ? `<span style="opacity:0.7;font-size:11px;">${escapeHtml(k.volume)}</span>` : '<span style="opacity:0.3;">--</span>';
        const bids = (k.minBid || k.maxBid) ? `<span style="opacity:0.7;font-size:11px;">${escapeHtml(k.minBid||'')}–${escapeHtml(k.maxBid||'')} €</span>` : '<span style="opacity:0.3;">--</span>';
        
        row.innerHTML = `
            <td style="font-weight: 600;">${escapeHtml(txt)}</td>
            <td><span class="badge-type ${badgeClass}">${matchType}</span></td>
            <td>${vol}</td>
            <td>${bids}</td>
            <td><span class="${statusClass}" onclick="toggleActiveKeywordStatus(${idx})" style="cursor:pointer;">${status}</span></td>
            <td><button class="action-delete-btn" onclick="deleteActiveKeyword(${idx})">🗑️ Remove</button></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Keyword Pool (research/consideration) table
function populateKeywordsTable() {
    const tbody = document.getElementById('keywords-table-body');
    tbody.innerHTML = '';
    
    const kws = activeCourseObj.keywordPool || [];
    
    if (kws.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; opacity:0.5; padding: 20px;">No keywords in research pool for this campaign.</td></tr>`;
        return;
    }
    
    kws.forEach((k, idx) => {
        const row = document.createElement('tr');
        
        let matchType = 'Broad';
        let badgeClass = 'badge-broad';
        const txt = (k.text || '').trim();
        
        if (txt.startsWith('[') && txt.endsWith(']')) {
            matchType = 'Exact';
            badgeClass = 'badge-exact';
        } else if (txt.startsWith('"') && txt.endsWith('"')) {
            matchType = 'Phrase';
            badgeClass = 'badge-phrase';
        }
        
        const vol = k.volume ? `<span style="opacity:0.7;font-size:11px;">${escapeHtml(k.volume)}</span>` : '<span style="opacity:0.3;">--</span>';
        const comp = k.competition ? `<span style="opacity:0.7;font-size:11px;">${escapeHtml(k.competition)}</span>` : '<span style="opacity:0.3;">--</span>';
        const bids = k.bids ? `<span style="opacity:0.7;font-size:11px;">${escapeHtml(k.bids)}</span>` : '<span style="opacity:0.3;">--</span>';
        
        row.innerHTML = `
            <td style="font-weight: 600; opacity: 0.85;">${escapeHtml(txt)}</td>
            <td><span class="badge-type ${badgeClass}">${matchType}</span></td>
            <td>${vol}</td>
            <td>${comp}</td>
            <td>${bids}</td>
            <td><button class="add-kw-btn" style="padding: 4px 10px; font-size: 11px;" onclick="promoteKeyword(${idx})">▶ Promote</button></td>
        `;
        
        tbody.appendChild(row);
    });
}

// Active keyword action handlers
window.toggleActiveKeywordStatus = function(idx) {
    const kws = activeCourseObj.keywords || [];
    if (kws[idx]) {
        kws[idx].status = kws[idx].status === 'ENABLED' ? 'PAUSED' : 'ENABLED';
        populateActiveKeywordsTable();
        runSmartValidation();
        markAsDraft();
    }
};

window.deleteActiveKeyword = function(idx) {
    const kws = activeCourseObj.keywords || [];
    kws.splice(idx, 1);
    populateActiveKeywordsTable();
    runSmartValidation();
    markAsDraft();
};

window.addActiveKeyword = function() {
    const input = document.getElementById('new-active-kw-input');
    const val = input.value.trim();
    if (!val) return;
    
    if (!activeCourseObj.keywords) activeCourseObj.keywords = [];
    
    const exists = activeCourseObj.keywords.some(k => k.text.toLowerCase() === val.toLowerCase());
    if (exists) {
        alert('This keyword is already in the active ad keywords list.');
        return;
    }
    
    activeCourseObj.keywords.push({
        text: val,
        status: 'ENABLED',
        volume: '',
        minBid: '',
        maxBid: ''
    });
    
    input.value = '';
    populateActiveKeywordsTable();
    runSmartValidation();
    markAsDraft();
};

// Promote a keyword from the research pool to the active ad keywords
window.promoteKeyword = function(poolIdx) {
    const pool = activeCourseObj.keywordPool || [];
    const kw = pool[poolIdx];
    if (!kw) return;
    
    if (!activeCourseObj.keywords) activeCourseObj.keywords = [];
    
    const exists = activeCourseObj.keywords.some(k => k.text.toLowerCase() === kw.text.toLowerCase());
    if (exists) {
        alert(`"${kw.text}" is already in the Active Ad Keywords list.`);
        return;
    }
    
    activeCourseObj.keywords.push({
        text: kw.text,
        status: 'ENABLED',
        volume: kw.volume || '',
        minBid: '',
        maxBid: ''
    });
    
    populateActiveKeywordsTable();
    runSmartValidation();
    markAsDraft();
};

// Helper lists
function objHeadlinesList() {
    return activeCourseObj.headlines || [];
}

function objDescriptionsList() {
    return activeCourseObj.descriptions || [];
}

function updateTotalInputCounts() {
    let hlCount = 0;
    document.querySelectorAll('.headline-field').forEach(input => {
        if (input.value.trim()) hlCount++;
    });
    document.getElementById('headlines-total-count').textContent = `${hlCount} / 15`;
    
    let descCount = 0;
    document.querySelectorAll('.description-field').forEach(input => {
        if (input.value.trim()) descCount++;
    });
    document.getElementById('descriptions-total-count').textContent = `${descCount} / 4`;
}

// Check for duplicates within lists
function checkDuplicateTexts(selector) {
    const fields = document.querySelectorAll(selector);
    const seen = new Set();
    const duplicates = new Set();
    
    fields.forEach(f => {
        const text = f.value.trim().toLowerCase();
        if (text) {
            if (seen.has(text)) {
                duplicates.add(text);
            }
            seen.add(text);
        }
    });
    
    fields.forEach(f => {
        const text = f.value.trim().toLowerCase();
        const wrapper = f.parentElement;
        let dupMarker = wrapper.querySelector('.duplicate-marker');
        
        if (text && duplicates.has(text)) {
            f.classList.add('invalid-limit'); // highlight orange/red
            if (!dupMarker) {
                dupMarker = document.createElement('span');
                dupMarker.className = 'duplicate-marker';
                dupMarker.textContent = '⚠️ Duplicate';
                wrapper.appendChild(dupMarker);
            }
        } else {
            if (f.value.length <= parseInt(f.maxLength)) {
                f.classList.remove('invalid-limit');
            }
            if (dupMarker) dupMarker.remove();
        }
    });
}

// Real-time Mockup Ad Preview Generator
function updateAdPreview() {
    if (!activeCourseObj) return;
    
    // 1. URL Display
    const finalUrl = document.getElementById('final-url-input').value.trim();
    const p1 = document.getElementById('path1-input').value.trim();
    const p2 = document.getElementById('path2-input').value.trim();
    
    let domain = 'www.ulusofona.pt';
    if (finalUrl) {
        try {
            const urlObj = new URL(finalUrl);
            domain = urlObj.hostname;
        } catch(e) {
            // invalid URL, keep default
        }
    }
    
    let urlDisplay = domain;
    if (p1) urlDisplay += ' > ' + p1;
    if (p2) urlDisplay += ' > ' + p2;
    document.getElementById('preview-url-display').textContent = urlDisplay;
    
    // 2. Headlines Preview
    const headlineFields = document.querySelectorAll('.headline-field');
    const filledHls = [];
    headlineFields.forEach(f => {
        if (f.value.trim()) filledHls.push(f.value.trim());
    });
    
    let headlineText = 'Ad Headline 1 | Ad Headline 2 | Ad Headline 3';
    if (filledHls.length > 0) {
        headlineText = filledHls.slice(0, 3).join(' | ');
    }
    document.getElementById('preview-headline-display').textContent = headlineText;
    
    // 3. Descriptions Preview
    const descFields = document.querySelectorAll('.description-field');
    const filledDescs = [];
    descFields.forEach(f => {
        if (f.value.trim()) filledDescs.push(f.value.trim());
    });
    
    let descText = 'Enter descriptions to preview your Google responsive search advertisement text here.';
    if (filledDescs.length > 0) {
        descText = filledDescs.slice(0, 2).join(' ');
    }
    document.getElementById('preview-description-display').textContent = descText;
    
    // 4. Structured Snippets Preview
    const header = document.getElementById('snippet-header').value;
    const snippetInps = document.querySelectorAll('.snippet-val-input');
    const snippetValues = [];
    snippetInps.forEach(inp => {
        if (inp.value.trim()) snippetValues.push(inp.value.trim());
    });
    
    const snipEl = document.getElementById('preview-snippets-display');
    if (snippetValues.length > 0) {
        snipEl.innerHTML = `<strong>${header}:</strong> ${snippetValues.join(', ')}`;
        snipEl.style.display = 'block';
    } else {
        snipEl.style.display = 'none';
    }
    
    // 5. Sitelinks Preview
    const sitelinkBlocks = document.querySelectorAll('.sitelink-editor-card');
    const filledSitelinks = [];
    
    sitelinkBlocks.forEach(block => {
        const headline = block.querySelector('.sl-headline-input').value.trim();
        const url = block.querySelector('.sl-url-input').value.trim();
        const d1 = block.querySelector('.sl-desc1-input').value.trim();
        const d2 = block.querySelector('.sl-desc2-input').value.trim();
        
        if (headline && url) {
            filledSitelinks.push({ headline, url, d1, d2 });
        }
    });
    
    const slContainer = document.getElementById('preview-sitelinks-display');
    slContainer.innerHTML = '';
    
    if (filledSitelinks.length > 0) {
        slContainer.style.display = previewDevice === 'mobile' ? 'grid' : 'grid';
        filledSitelinks.slice(0, 4).forEach(sl => {
            const item = document.createElement('div');
            item.className = 'sitelink-mockup-item';
            
            if (previewDevice === 'mobile') {
                item.innerHTML = `<span class="sitelink-mockup-title">${escapeHtml(sl.headline)}</span>`;
            } else {
                item.innerHTML = `
                    <span class="sitelink-mockup-title">${escapeHtml(sl.headline)}</span>
                    <span class="sitelink-mockup-desc">${escapeHtml(sl.d1)}</span>
                    <span class="sitelink-mockup-desc">${escapeHtml(sl.d2)}</span>
                `;
            }
            slContainer.appendChild(item);
        });
    } else {
        slContainer.style.display = 'none';
    }
    
    markAsDraft();
}

function markAsDraft() {
    if (!activeCourseObj) return;
    if (activeCourseObj.status === 'DEPLOYED') {
        activeCourseObj.status = 'ACTIVE';
        const syncBadge = document.getElementById('copy-sync-badge');
        syncBadge.textContent = 'Draft';
        syncBadge.className = 'sync-status-indicator status-paused-badge';
        
        const label = document.getElementById('campaign-status-label');
        if (document.getElementById('campaign-status-checkbox').checked) {
            label.textContent = 'ACTIVE';
            label.className = 'status-badge active';
        }
    }
}

// Global UI Listeners Setup
function initGlobalListeners() {
    // Top toggle changes
    const checkbox = document.getElementById('campaign-status-checkbox');
    const label = document.getElementById('campaign-status-label');
    
    checkbox.addEventListener('change', () => {
        const isLive = checkbox.checked;
        if (isLive) {
            activeCourseObj.status = 'START';
            label.textContent = 'ACTIVE';
            label.className = 'status-badge active';
        } else {
            activeCourseObj.status = 'PAUSED';
            label.textContent = 'PAUSED';
            label.className = 'status-badge paused';
        }
        markAsDraft();
    });
    
    // Final URL changed
    document.getElementById('final-url-input').addEventListener('input', () => {
        updateAdPreview();
    });
    
    // Display paths change
    const p1 = document.getElementById('path1-input');
    const p2 = document.getElementById('path2-input');
    
    p1.addEventListener('input', () => {
        runSmartValidation();
        updateAdPreview();
    });
    
    p2.addEventListener('input', () => {
        runSmartValidation();
        updateAdPreview();
    });
    
    // Snippet Header Dropdown changed
    document.getElementById('snippet-header').addEventListener('change', () => {
        updateAdPreview();
    });
}

// Collapsible panels accordion logic
window.toggleSectionCollapse = function(id) {
    const el = document.getElementById(id);
    const icon = document.getElementById(id + '-icon');
    const isExpanded = el.classList.toggle('expanded');
    
    if (isExpanded) {
        el.style.maxHeight = '2000px';
        el.style.opacity = '1';
        icon.textContent = '▼';
    } else {
        el.style.maxHeight = '0';
        el.style.opacity = '0';
        icon.textContent = '▲';
    }
};

// Toggle Device Previews
window.setPreviewDevice = function(device) {
    previewDevice = device;
    document.getElementById('btn-device-mobile').classList.toggle('active', device === 'mobile');
    document.getElementById('btn-device-desktop').classList.toggle('active', device === 'desktop');
    
    const frame = document.getElementById('ad-preview-frame');
    frame.className = `device-frame ${device}`;
    
    updateAdPreview();
};

// Global landing returns
window.returnToGlobalLanding = function() {
    activeCourseName = null;
    activeCourseObj = null;
    document.getElementById('dashboard-header-left').style.visibility = 'hidden';
    document.getElementById('workspace-view').style.display = 'none';
    document.getElementById('landing-view').style.display = 'flex';
    document.documentElement.style.setProperty('--accent-primary', '#00f2ff');
    document.documentElement.style.setProperty('--accent-primary-rgb', '0, 242, 255');
    document.documentElement.style.setProperty('--blob-gradient', 'radial-gradient(circle, rgba(0, 242, 255, 0.08) 0%, rgba(10,12,16,0) 70%)');
    
    // Reset logo
    document.getElementById('brand-logo').src = "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png";
    document.getElementById('brand-name').textContent = "Grupo Lusófona";
    
    renderCourseList();
};

window.toggleSidebar = function() {
    const sidebar = document.querySelector('.sidebar');
    const overlay = document.getElementById('mobile-overlay');
    const topBarBtn = document.getElementById('mobile-menu-toggle');
    
    const active = sidebar.classList.toggle('mobile-active');
    overlay.classList.toggle('active', active);
};

// Save and Deploy Campaign logic
window.deployCampaign = async function() {
    if (!activeCourseObj || !activeCourseName) return;
    
    const deployBtn = document.getElementById('deploy-btn');
    const originalText = deployBtn.textContent;
    deployBtn.disabled = true;
    deployBtn.textContent = '⏳ Deploying...';
    
    // 1. Validation Checks
    
    // Final URL Check
    const finalUrl = document.getElementById('final-url-input').value.trim();
    if (!finalUrl) {
        alert("Final URL is required.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }
    
    try {
        new URL(finalUrl);
    } catch(e) {
        alert("Please enter a valid Final URL (including https://).");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }

    // Force run validation on all inputs (this sets the invalid-limit class dynamically on raw lengths)
    runSmartValidation();
    if (document.querySelectorAll('.sleek-input.invalid-limit').length > 0) {
        alert("Alguns campos excedem o limite de caracteres ou contêm valores duplicados (assinalados a vermelho). Por favor, corrija-os antes de publicar.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }

    // Headlines validation (Min 3 filled)
    const hlInps = document.querySelectorAll('.headline-field');
    const headlines = [];
    hlInps.forEach(inp => {
        const val = inp.value.trim();
        if (val) {
            headlines.push(val);
        }
    });
    if (headlines.length < 3) {
        alert("A minimum of 3 Headlines are required for Google Ads RSA.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }

    // Descriptions validation (Min 2 filled)
    const descInps = document.querySelectorAll('.description-field');
    const descriptions = [];
    descInps.forEach(inp => {
        const val = inp.value.trim();
        if (val) {
            descriptions.push(val);
        }
    });
    if (descriptions.length < 2) {
        alert("A minimum of 2 Descriptions are required for Google Ads RSA.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }

    // Sitelinks validation (Min requirements: Link Text and Final URL must both be present if any field is filled)
    const sitelinkBlocks = document.querySelectorAll('.sitelink-editor-card');
    const sitelinksList = [];
    let slErr = false;
    sitelinkBlocks.forEach((block, idx) => {
        const h = block.querySelector('.sl-headline-input').value.trim();
        const d1 = block.querySelector('.sl-desc1-input').value.trim();
        const d2 = block.querySelector('.sl-desc2-input').value.trim();
        const u = block.querySelector('.sl-url-input').value.trim();
        
        if (h || d1 || d2 || u) {
            if (!h || !u) {
                alert(`Sitelink #${idx+1} requires both Link Text and Final URL.`);
                slErr = true;
                return;
            }
            try {
                new URL(u);
            } catch(e) {
                alert(`Sitelink #${idx+1} has an invalid Final URL.`);
                slErr = true;
                return;
            }
            sitelinksList.push({ headline: h, desc1: d1, desc2: d2, url: u });
        }
    });
    if (slErr) {
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }

    // Snippets validation (Min 3 values required if any snippet value is present)
    const snippetHeader = document.getElementById('snippet-header').value;
    const snippetInps = document.querySelectorAll('.snippet-val-input');
    const snippetValues = [];
    snippetInps.forEach(inp => {
        const val = inp.value.trim();
        if (val) {
            snippetValues.push(val);
        }
    });
    if (snippetValues.length > 0 && snippetValues.length < 3) {
        alert("Structured Snippets require at least 3 values.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }
    
    // Serialize data back into activeCourseObj
    activeCourseObj.headlines = headlines;
    activeCourseObj.descriptions = descriptions;
    activeCourseObj.finalUrl = finalUrl;
    activeCourseObj.path1 = p1;
    activeCourseObj.path2 = p2;
    activeCourseObj.sitelinks = sitelinksList;
    activeCourseObj.snippets = {
        header: snippetHeader,
        values: snippetValues
    };
    // keywords and keywordPool are modified in-place via toggle/add/delete/promote, no extra serialization needed here
    
    // Set status
    const isChecked = document.getElementById('campaign-status-checkbox').checked;
    activeCourseObj.status = isChecked ? 'START' : 'PAUSED';
    activeCourseObj.lastUpdated = new Date().toISOString();
    
    // 2. Deploy to GitHub via contents API
    const token = await getGitHubToken();
    if (!token) {
        // Save locally in window scope, alert offline mode
        adsConfig[activeCourseName] = activeCourseObj;
        alert("⚠️ No GitHub Token found. Changes saved locally in memory only. Please check github_config.json or set token in localStorage.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        populateForms(); // Refresh UI
        return;
    }
    
    try {
        // Always retrieve the latest contents to prevent race conditions or merge conflicts
        const getResponse = await fetch('https://api.github.com/repos/LaminatedYamal/ULUS-FONA/contents/ads_config.json', {
            headers: {
                'Authorization': `token ${token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });
        
        let dbConfig = {};
        let dbSha = null;
        
        if (getResponse.ok) {
            const getResObj = await getResponse.json();
            dbSha = getResObj.sha;
            const rawContent = atob(getResObj.content.replace(/\s/g, ''));
            const utf8Content = decodeURIComponent(escape(rawContent));
            dbConfig = JSON.parse(utf8Content);
        } else {
            throw new Error(`Could not fetch database configuration file from GitHub (HTTP ${getResponse.status})`);
        }
        
        // Merge activeCourseObj into current database representation
        dbConfig[activeCourseName] = activeCourseObj;
        
        // UTF-8 base64 encoding helper
        const jsonString = JSON.stringify(dbConfig, null, 2);
        const base64Content = btoa(unescape(encodeURIComponent(jsonString)));
        
        const putPayload = {
            message: `Deploy campaign configuration for course: ${activeCourseName} [skip ci]`,
            content: base64Content,
            sha: dbSha,
            branch: 'main'
        };
        
        const putResponse = await fetch('https://api.github.com/repos/LaminatedYamal/ULUS-FONA/contents/ads_config.json', {
            method: 'PUT',
            headers: {
                'Authorization': `token ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(putPayload)
        });
        
        if (putResponse.ok) {
            const putResObj = await putResponse.json();
            adsConfigSha = putResObj.content.sha; // update internal SHA
            adsConfig = dbConfig;
            activeCourseObj = adsConfig[activeCourseName];
            
            // Mark activeCourseObj status as DEPLOYED (since push succeeded)
            activeCourseObj.status = 'DEPLOYED';
            
            alert(`🚀 Sincronização Concluída! Campanha "${activeCourseName}" guardada com sucesso no GitHub e agendada para sincronização no Google Ads.`);
            populateForms(); // Refresh forms to show Deployed status
        } else {
            const errInfo = await putResponse.text();
            throw new Error(errInfo || `HTTP ${putResponse.status}`);
        }
        
    } catch (e) {
        console.error("Failed to sync/deploy campaign on GitHub:", e);
        alert(`❌ Erro de Sincronização: Não foi possível salvar no GitHub.\nDetalhes: ${e.message}`);
    } finally {
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
    }
};

// Utility function to escape HTML
function escapeHtml(unsafe) {
    return (unsafe || '')
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;");
}

// Start everything
window.addEventListener('DOMContentLoaded', init);
