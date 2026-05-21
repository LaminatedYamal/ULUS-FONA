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
    
    // Check if campaign exists in config, otherwise initialize a new one
    if (!adsConfig[courseName]) {
        adsConfig[courseName] = {
            id: courseRawObj.id || Date.now(),
            institution: courseRawObj.institution,
            degree: courseRawObj.degree_type || 'Licenciaturas',
            degree_type: courseRawObj.degree_type || 'Licenciatura',
            status: 'PAUSED',
            headlines: [],
            descriptions: [],
            finalUrl: '',
            path1: '',
            path2: '',
            sitelinks: [],
            snippets: { header: 'Cursos', values: [] },
            keywords: [],
            livePulse: {
                budget: '-- €',
                clicks: 0,
                impressions: 0,
                cost: '-- €',
                conversions: 0,
                costPerConv: '-- €',
                period: 'Últimos 30 Dias'
            },
            lastUpdated: '',
            lastSynced: ''
        };
    }
    
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
    
    // 7. Keywords table populate
    populateKeywordsTable();
    
    // 8. Trigger real-time mockup preview update
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
        input.maxLength = 30;
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
        
        // Input Listener
        input.addEventListener('input', () => {
            const currentLen = input.value.length;
            counter.textContent = `${currentLen}/30`;
            
            // Mark badge as active if text is entered
            if (input.value.trim()) {
                badge.classList.add('active-filled');
            } else {
                badge.classList.remove('active-filled');
            }
            
            // Limit warning style
            if (currentLen > 30) {
                counter.classList.add('limit-exceeded');
                input.classList.add('invalid-limit');
            } else {
                counter.classList.remove('limit-exceeded');
                input.classList.remove('invalid-limit');
            }
            
            checkDuplicateTexts('.headline-field');
            updateAdPreview();
            updateTotalInputCounts();
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
        input.maxLength = 90;
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
        
        // Input Listener
        input.addEventListener('input', () => {
            const currentLen = input.value.length;
            counter.textContent = `${currentLen}/90`;
            
            if (input.value.trim()) {
                badge.classList.add('active-filled');
            } else {
                badge.classList.remove('active-filled');
            }
            
            if (currentLen > 90) {
                counter.classList.add('limit-exceeded');
                input.classList.add('invalid-limit');
            } else {
                counter.classList.remove('limit-exceeded');
                input.classList.remove('invalid-limit');
            }
            
            checkDuplicateTexts('.description-field');
            updateAdPreview();
            updateTotalInputCounts();
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
                    <input type="text" class="sleek-input sl-headline-input" dataset-index="${i}" maxlength="25" placeholder="Headline text (max 25)" value="${sl.headline || ''}">
                    <span class="char-counter sl-headline-counter">0/25</span>
                </div>
            </div>
            
            <div class="path-group">
                <div class="form-group">
                    <label>Description Line 1</label>
                    <div class="input-counter-wrapper">
                        <input type="text" class="sleek-input sl-desc1-input" dataset-index="${i}" maxlength="35" placeholder="Description line 1 (max 35)" value="${sl.desc1 || ''}">
                        <span class="char-counter sl-desc1-counter">0/35</span>
                    </div>
                </div>
                <div class="form-group">
                    <label>Description Line 2</label>
                    <div class="input-counter-wrapper">
                        <input type="text" class="sleek-input sl-desc2-input" dataset-index="${i}" maxlength="35" placeholder="Description line 2 (max 35)" value="${sl.desc2 || ''}">
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
        
        // Listeners for characters and preview updates
        const hInp = card.querySelector('.sl-headline-input');
        const hCnt = card.querySelector('.sl-headline-counter');
        const d1Inp = card.querySelector('.sl-desc1-input');
        const d1Cnt = card.querySelector('.sl-desc1-counter');
        const d2Inp = card.querySelector('.sl-desc2-input');
        const d2Cnt = card.querySelector('.sl-desc2-counter');
        const uInp = card.querySelector('.sl-url-input');
        
        // Init counter displays
        hCnt.textContent = `${hInp.value.length}/25`;
        d1Cnt.textContent = `${d1Inp.value.length}/35`;
        d2Cnt.textContent = `${d2Inp.value.length}/35`;
        
        const inputs = [
            { inp: hInp, cnt: hCnt, max: 25 },
            { inp: d1Inp, cnt: d1Cnt, max: 35 },
            { inp: d2Inp, cnt: d2Cnt, max: 35 }
        ];
        
        inputs.forEach(item => {
            item.inp.addEventListener('input', () => {
                const len = item.inp.value.length;
                item.cnt.textContent = `${len}/${item.max}`;
                
                if (len > item.max) {
                    item.cnt.classList.add('limit-exceeded');
                    item.inp.classList.add('invalid-limit');
                } else {
                    item.cnt.classList.remove('limit-exceeded');
                    item.inp.classList.remove('invalid-limit');
                }
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
            <input type="text" class="sleek-input snippet-val-input" maxlength="25" placeholder="Value (e.g. Design)" value="${val}">
            <span class="char-counter snippet-val-counter">${val.length}/25</span>
        </div>
        <button class="snippet-delete-btn" onclick="deleteSnippetRow(this)">🗑️</button>
    `;
    
    container.appendChild(row);
    
    const inp = row.querySelector('.snippet-val-input');
    const cnt = row.querySelector('.snippet-val-counter');
    
    inp.addEventListener('input', () => {
        const len = inp.value.length;
        cnt.textContent = `${len}/25`;
        
        if (len > 25) {
            cnt.classList.add('limit-exceeded');
            inp.classList.add('invalid-limit');
        } else {
            cnt.classList.remove('limit-exceeded');
            inp.classList.remove('invalid-limit');
        }
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

// Keywords Table Pool Operations
function populateKeywordsTable() {
    const tbody = document.getElementById('keywords-table-body');
    tbody.innerHTML = '';
    
    const kws = activeCourseObj.keywords || [];
    
    if (kws.length === 0) {
        tbody.innerHTML = `<tr><td colspan="4" style="text-align:center; opacity:0.5; padding: 20px;">No keywords defined in pool. Add keywords above!</td></tr>`;
        return;
    }
    
    kws.forEach((k, idx) => {
        const row = document.createElement('tr');
        
        // Match Type Detection
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
        
        // Status Toggle Badge
        const status = k.status === 'ENABLED' ? 'ENABLED' : 'PAUSED';
        const statusClass = status === 'ENABLED' ? 'status-indicator-badge status-active-badge' : 'status-indicator-badge status-paused-badge';
        
        row.innerHTML = `
            <td style="font-weight: 600;">${escapeHtml(txt)}</td>
            <td><span class="badge-type ${badgeClass}">${matchType}</span></td>
            <td><span class="${statusClass}" onclick="toggleKeywordStatus(${idx})">${status}</span></td>
            <td><button class="action-delete-btn" onclick="deleteKeyword(${idx})">🗑️ Remove</button></td>
        `;
        
        tbody.appendChild(row);
    });
}

window.toggleKeywordStatus = function(idx) {
    const kws = activeCourseObj.keywords || [];
    if (kws[idx]) {
        kws[idx].status = kws[idx].status === 'ENABLED' ? 'PAUSED' : 'ENABLED';
        populateKeywordsTable();
        markAsDraft();
    }
};

window.deleteKeyword = function(idx) {
    const kws = activeCourseObj.keywords || [];
    kws.splice(idx, 1);
    populateKeywordsTable();
    markAsDraft();
};

window.addNewKeyword = function() {
    const input = document.getElementById('new-kw-input');
    const val = input.value.trim();
    if (!val) return;
    
    if (!activeCourseObj.keywords) activeCourseObj.keywords = [];
    
    // Prevent duplicate keyword texts
    const exists = activeCourseObj.keywords.some(k => k.text.toLowerCase() === val.toLowerCase());
    if (exists) {
        alert("Keyword already exists in the pool.");
        return;
    }
    
    activeCourseObj.keywords.push({
        text: val,
        status: 'ENABLED'
    });
    
    input.value = '';
    populateKeywordsTable();
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
        document.getElementById('path1-counter').textContent = `${p1.value.length}/15`;
        if (p1.value.length > 15) {
            p1.classList.add('invalid-limit');
        } else {
            p1.classList.remove('invalid-limit');
        }
        updateAdPreview();
    });
    
    p2.addEventListener('input', () => {
        document.getElementById('path2-counter').textContent = `${p2.value.length}/15`;
        if (p2.value.length > 15) {
            p2.classList.add('invalid-limit');
        } else {
            p2.classList.remove('invalid-limit');
        }
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
    
    // Display Paths Checks
    const p1 = document.getElementById('path1-input').value.trim();
    const p2 = document.getElementById('path2-input').value.trim();
    if (p1.length > 15 || p2.length > 15) {
        alert("Display Paths must not exceed 15 characters.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }
    
    // Headlines validation (Min 3 filled, Max 15)
    const hlInps = document.querySelectorAll('.headline-field');
    const headlines = [];
    let hlLimitErr = false;
    
    hlInps.forEach(inp => {
        const val = inp.value.trim();
        if (val) {
            headlines.push(val);
            if (val.length > 30) hlLimitErr = true;
        }
    });
    
    if (headlines.length < 3) {
        alert("A minimum of 3 Headlines are required for Google Ads RSA.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }
    if (hlLimitErr) {
        alert("Some Headlines exceed the 30 characters limitation.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }
    
    // Descriptions validation (Min 2, Max 4)
    const descInps = document.querySelectorAll('.description-field');
    const descriptions = [];
    let descLimitErr = false;
    
    descInps.forEach(inp => {
        const val = inp.value.trim();
        if (val) {
            descriptions.push(val);
            if (val.length > 90) descLimitErr = true;
        }
    });
    
    if (descriptions.length < 2) {
        alert("A minimum of 2 Descriptions are required for Google Ads RSA.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }
    if (descLimitErr) {
        alert("Some Descriptions exceed the 90 characters limitation.");
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }
    
    // Sitelinks validation
    const sitelinkBlocks = document.querySelectorAll('.sitelink-editor-card');
    const sitelinksList = [];
    let slErr = false;
    
    sitelinkBlocks.forEach((block, idx) => {
        const h = block.querySelector('.sl-headline-input').value.trim();
        const d1 = block.querySelector('.sl-desc1-input').value.trim();
        const d2 = block.querySelector('.sl-desc2-input').value.trim();
        const u = block.querySelector('.sl-url-input').value.trim();
        
        if (h || d1 || d2 || u) {
            // If any field is filled, headline and URL are mandatory!
            if (!h || !u) {
                alert(`Sitelink #${idx+1} requires both Link Text and Final URL.`);
                slErr = true;
                return;
            }
            if (h.length > 25 || d1.length > 35 || d2.length > 35) {
                alert(`Sitelink #${idx+1} has fields exceeding their limitations.`);
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
    
    // Snippets validation
    const snippetHeader = document.getElementById('snippet-header').value;
    const snippetInps = document.querySelectorAll('.snippet-val-input');
    const snippetValues = [];
    let snipErr = false;
    
    snippetInps.forEach(inp => {
        const val = inp.value.trim();
        if (val) {
            if (val.length > 25) {
                alert("Structured Snippet values must not exceed 25 characters.");
                snipErr = true;
                return;
            }
            snippetValues.push(val);
        }
    });
    
    if (snipErr) {
        deployBtn.disabled = false;
        deployBtn.textContent = originalText;
        return;
    }
    
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
