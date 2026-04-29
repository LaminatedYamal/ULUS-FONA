const BRANDING = {
    "Lusófona Lisboa": { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
    "Lusófona Porto":  { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
    "Grupo Lusófona":  { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
    "IPLUSO":          { hex: "#A20736", bgSub: "#780528", logo: "https://i.postimg.cc/mD3636G7/Logo-IPLUSO-Horizontal-Branco.png" },
    "ISLA Gaia":       { hex: "#BB969B", bgSub: "#9C797E", logo: "https://i.postimg.cc/kGyZtjz7/Versa-o-Horizontal-Branco-2048x853.png" },
    "ISMAT":           { hex: "#7AC7CD", bgSub: "#5CA2A8", logo: "https://i.postimg.cc/0jpvXd31/logo-ISMAT-02.png" }
};

let courses = [];
let activeCourseId = 0;

async function init() {
    await checkAuth(); // Await data loading
    
    // Load cached sync info immediately for better UX
    const cachedSync = localStorage.getItem('hub_last_sync');
    if (cachedSync) {
        const infoEl = document.getElementById('last-sync-info');
        if (infoEl) infoEl.innerText = cachedSync;
    }

    document.getElementById('keyword-search').addEventListener('input', (e) => {
        filterKeywords(e.target.value);
    });

    document.getElementById('gsc-upload').addEventListener('change', (e) => handleFileUpload(e, 'gsc'));
    document.getElementById('ads-upload').addEventListener('change', (e) => handleFileUpload(e, 'ads'));
    document.getElementById('rankings-upload').addEventListener('change', (e) => handleFileUpload(e, 'rankings'));
    
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
        if (userName) {
            greetingEl.textContent = `Olá, ${userName}!`;
        } else {
            greetingEl.textContent = "Olá!";
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
        <div class="modal-icon">🚀</div>
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
        initGreeting(); // Update greeting immediately
        await fetchServerData();
        renderCourseList();
        return true;
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
    // Strip punctuation, symbols, and extra whitespace, and handle accents
    // We use a more aggressive approach for Portuguese accents
    return term.toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "") // Remove accents
        .replace(/[^\w\s]/g, "")        // Remove punctuation
        .replace(/\s+/g, " ")           // Normalize whitespace
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
    list.innerHTML = '';
    const q = searchQuery.toLowerCase().trim();

    // Grouping Logic with Filtering
    const grouped = {};
    let totalMatches = 0;

    courses.forEach(course => {
        // Search Logic: Match name OR any keyword (GSC or Ads)
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
            totalMatches++;
        }
    });

    const instOrder = ['Lusófona Lisboa', 'Lusófona Porto', 'IPLUSO', 'ISLA Gaia', 'ISMAT'];
    
    Object.keys(grouped).sort((a, b) => {
        const indexA = instOrder.indexOf(a);
        const indexB = instOrder.indexOf(b);
        if (indexA === -1 && indexB === -1) return a.localeCompare(b);
        if (indexA === -1) return 1;
        if (indexB === -1) return -1;
        return indexA - indexB;
    }).forEach(inst => {
        // Institution Header with Dynamic Branding
        const brand = BRANDING[inst] || { hex: "#444444", bgSub: "#222222" };
        const instHeader = document.createElement('div');
        instHeader.className = 'nav-group-header';
        instHeader.textContent = inst;
        
        // Apply Branding
        instHeader.style.backgroundColor = brand.hex;
        instHeader.style.color = getContrastColor(brand.hex);
        instHeader.style.borderColor = brand.bgSub;
        
        list.appendChild(instHeader);

        const degreeOrder = ['TeSP', 'Licenciatura', 'Mestrado Integrado', 'Mestrado', 'Doutoramento', 'Pós-Graduação', 'Formações'];
        const displayMapping = {
            'TeSP': 'CTeSP',
            'Licenciatura': 'Licenciaturas',
            'Mestrado Integrado': 'Mestrados Integrados',
            'Mestrado': 'Mestrados',
            'Doutoramento': 'Doutoramentos',
            'Pós-Graduação': 'Pós-Graduações',
            'Formações': 'Formações'
        };
        
        Object.keys(grouped[inst]).sort((a, b) => {
            const indexA = degreeOrder.indexOf(a);
            const indexB = degreeOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        }).forEach(degree => {
            // Degree Category Button (Replaces Accordion)
            const degreeBtn = document.createElement('div');
            degreeBtn.className = 'nav-degree-btn';
            degreeBtn.textContent = displayMapping[degree] || degree;
            
            // Clicking category opens the Landing Hub for this degree
            degreeBtn.addEventListener('click', () => {
                document.querySelectorAll('.nav-degree-btn').forEach(b => b.classList.remove('active'));
                degreeBtn.classList.add('active');
                selectDegreeHub(inst, degree, grouped[inst][degree]);
            });
            
            list.appendChild(degreeBtn);
        });
    });

    // Add Reset Buttons at the bottom
    const resetContainer = document.createElement('div');
    resetContainer.className = 'reset-grid';
    resetContainer.innerHTML = `
        <button onclick="resetApp('gsc')" class="btn-reset gsc-only">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Clear GSC Only
        </button>
        <button onclick="resetApp('ads')" class="btn-reset ads-only">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            Clear Ads Only
        </button>
        <button onclick="resetApp('all')" class="btn-reset danger">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/></svg>
            Clear ALL Data
        </button>
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
    const landingView = document.getElementById("landing-view");
    const dashboardView = document.getElementById("dashboard-view");
    
    if (landingView) landingView.style.display = "flex";
    if (dashboardView) dashboardView.style.display = "none";
    
    // Update Header Text
    document.getElementById('active-course-title').textContent = inst;
    document.getElementById('active-course-desc').textContent = degree;
    
    // Update Landing Logo
    const brand = BRANDING[inst] || { logo: "" };
    const logoEl = document.getElementById('landing-logo');
    if (logoEl) {
        logoEl.src = brand.logo;
        logoEl.style.display = brand.logo ? "block" : "none";
    }
    
    // Update Subtitle
    const subtitle = document.getElementById('landing-subtitle');
    if (subtitle) subtitle.textContent = `Browsing ${degree} courses at ${inst}`;
    
    // Populate Hub Dropdown
    const hubDropdownContainer = document.getElementById('degree-selection-hub');
    const dropdown = document.getElementById('course-dropdown-hub');
    if (dropdown && hubDropdownContainer) {
        dropdown.innerHTML = '<option value="">Choose a Course...</option>';
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
    
    let instName = course.institution || "";
    if (instName.includes('Lus') && instName.includes('fona')) {
        instName = instName.includes('Porto') ? 'Lusófona Porto' : 'Lusófona Lisboa';
    }
    const brand = BRANDING[instName] || { hex: "#444444", bgSub: "#222222", logo: "" };
    
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
    const displayDegree = (course.degree && course.degree !== 'Unknown') ? course.degree : (course.degree_type || 'Formações');
    document.getElementById('active-course-desc').textContent = `${displayDegree} | ${course.institution}`;
    
    renderTables(course.gscKeywords, course.adsKeywords, course.rankingsKeywords);
    updateStats(course);
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function renderTables(gsc = [], ads = [], rankings = []) {
    const gscBody = document.getElementById('gsc-body');
    const adsBody = document.getElementById('ads-body');
    const rankingsBody = document.getElementById('rankings-body');
    
    gscBody.innerHTML = '';
    adsBody.innerHTML = '';
    rankingsBody.innerHTML = '';
    
    // Sort Alphabetically
    const sortedGsc = [...gsc].sort((a, b) => a.term.localeCompare(b.term, 'pt'));
    const sortedAds = [...ads].sort((a, b) => a.term.localeCompare(b.term, 'pt'));
    const sortedRankings = [...rankings].sort((a, b) => a.term.localeCompare(b.term, 'pt'));
    
    const gscNorms = sortedGsc.map(k => normalizeKeyword(k.term));
    const adsNorms = sortedAds.map(k => normalizeKeyword(k.term));
    const rankNorms = sortedRankings.map(k => normalizeKeyword(k.term));
    
    // 1. Render GSC Table
    if (sortedGsc.length === 0) {
        gscBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:40px; color:var(--text-muted); opacity:0.5;">📂 Upload GSC data</td></tr>`;
    } else {
        sortedGsc.forEach((k, i) => {
            const tr = document.createElement('tr');
            const norm = normalizeKeyword(k.term);
            const isMatchAds = adsNorms.includes(norm);
            const isMatchRank = rankNorms.includes(norm);
            
            if (isMatchAds && isMatchRank) {
                tr.className = 'triple-synergy-aura'; // Special rainbow for all three!
            } else if (isMatchAds) {
                tr.className = 'synergy-aura';
            } else {
                tr.className = 'gap-aura';
            }
            
            tr.innerHTML = `
                <td>${k.term}</td>
                <td>${k.clicks.toLocaleString()}</td>
                <td>${isMatchAds ? '<span class="match-tag">✓ Active in Ads</span>' : '<span class="text-muted">Organic Only</span>'}</td>
            `;
            gscBody.appendChild(tr);
        });
    }
    
    // 2. Render Ads Table
    if (sortedAds.length === 0) {
        adsBody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:40px; color:var(--text-muted); opacity:0.5;">📂 Upload Ads data</td></tr>`;
    } else {
        sortedAds.forEach((k, i) => {
            const tr = document.createElement('tr');
            const norm = normalizeKeyword(k.term);
            const isMatchGsc = gscNorms.includes(norm);
            const isMatchRank = rankNorms.includes(norm);
            
            if (isMatchGsc && isMatchRank) {
                tr.className = 'triple-synergy-aura';
            } else if (isMatchGsc) {
                tr.className = 'synergy-aura';
            } else {
                tr.className = 'gap-aura';
            }

            tr.innerHTML = `
                <td>${k.term}</td>
                <td>${isMatchGsc ? '<span class="match-tag">✓ Active in GSC</span>' : '<span class="gap-tag">⚠ Organic Gap</span>'}</td>
            `;
            adsBody.appendChild(tr);
        });
    }

    // 3. Render Rankings Table (Full Width)
    if (sortedRankings.length === 0) {
        rankingsBody.innerHTML = `<tr><td colspan="5" style="text-align:center; padding:40px; color:var(--text-muted); opacity:0.5;">📂 Upload Rankings XML to see positions</td></tr>`;
    } else {
        sortedRankings.forEach((k, i) => {
            const tr = document.createElement('tr');
            const norm = normalizeKeyword(k.term);
            const isMatchGsc = gscNorms.includes(norm);
            const isMatchAds = adsNorms.includes(norm);
            
            if (isMatchGsc && isMatchAds) {
                tr.className = 'triple-synergy-aura';
            } else if (isMatchGsc || isMatchAds) {
                tr.className = 'synergy-aura';
            }

            const diff = (k.prevRank || 0) - (k.rank || 0);
            const trendIcon = diff > 0 ? `<span style="color:var(--success);">▲ ${diff}</span>` : 
                             diff < 0 ? `<span style="color:var(--danger);">▼ ${Math.abs(diff)}</span>` : 
                             `<span style="color:var(--text-muted);">● Stable</span>`;

            tr.innerHTML = `
                <td style="font-weight:700;">${k.term}</td>
                <td style="text-align:center;"><span style="font-size:18px; font-weight:800;">#${k.rank}</span></td>
                <td>${trendIcon}</td>
                <td style="font-size:11px; opacity:0.6; max-width:200px; overflow:hidden; text-overflow:ellipsis;">${k.url}</td>
            `;
            rankingsBody.appendChild(tr);
        });
    }
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
