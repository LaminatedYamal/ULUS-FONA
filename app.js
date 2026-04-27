const BRANDING = {
    "Lusófona Lisboa": { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
    "Lusófona Porto":  { hex: "#002D62", bgSub: "#001b3b", logo: "https://i.postimg.cc/Z0k5QStc/logotipo-geral-horizontal-branco-png.png" },
    "IPLUSO":          { hex: "#A20736", bgSub: "#780528", logo: "https://i.postimg.cc/fLR0Nksd/Logo-IPLUSO-ECIA-2.png" },
    "ISLA Gaia":       { hex: "#BB969B", bgSub: "#9C797E", logo: "https://i.postimg.cc/kGyZtjz7/Versa-o-Horizontal-Branco-2048x853.png" },
    "ISMAT":           { hex: "#7AC7CD", bgSub: "#5CA2A8", logo: "https://i.postimg.cc/0jpvXd31/logo-ISMAT-02.png" }
};

let courses = [];
let activeCourseId = 0;

async function init() {
    await fetchServerData(); // Merge cloud keywords on top of the baseline
    renderCourseList();
    
    if (courses.length > 0) {
        activeCourseId = courses[0].id;
        loadCourse(activeCourseId);
    }
    
    document.getElementById('keyword-search').addEventListener('input', (e) => {
        filterKeywords(e.target.value);
    });

    document.getElementById('gsc-upload').addEventListener('change', (e) => handleFileUpload(e, 'gsc'));
    document.getElementById('ads-upload').addEventListener('change', (e) => handleFileUpload(e, 'ads'));
    
    loadData(); // Also apply any local browser data
}


async function fetchServerData() {
    try {
        const response = await fetch('courses.json?v=' + Date.now());
        if (!response.ok) throw new Error("Failed to load cloud data.");
        const data = await response.json();
        
        // Initialize the app state completely from the loaded courses.json
        courses = data.map((c, i) => ({
            id: i,
            ...c,
            gscKeywords: c.gscKeywords || [],
            adsKeywords: c.adsKeywords || []
        }));
    } catch (e) {
        console.error('Cloud sync failed:', e);
    }
}

async function syncToGitHub() {
    let token = localStorage.getItem('github_token');
    if (!token) {
        token = prompt("Please enter your GitHub Personal Access Token (PAT) to sync with the team:");
        if (!token) return;
        localStorage.setItem('github_token', token);
    }

    const btn = document.getElementById('sync-btn');
    const status = document.getElementById('sync-status');
    
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

        // 2. Prepare the new content
        // We only sync the raw data to keep the file clean
        const exportData = courses.map(c => ({
            name: c.name,
            degree: c.degree,
            institution: c.institution,
            gscKeywords: c.gscKeywords,
            adsKeywords: c.adsKeywords
        }));

        const content = b64EncodeUnicode(JSON.stringify(exportData, null, 2));

        // 3. Push to GitHub
        const putRes = await fetch(`https://api.github.com/repos/${repo}/contents/${path}`, {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: "Update keywords via Antigravity Dashboard",
                content: content,
                sha: sha,
                branch: "main"
            })
        });

        if (putRes.ok) {
            status.textContent = "✅ Sync Successful! Dashboard will update for everyone in ~60s.";
            setTimeout(() => { status.style.display = "none"; }, 5000);
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
    localStorage.removeItem('github_token');
    alert("Connection Reset! You can now paste a new token when you click Sync.");
}

function b64EncodeUnicode(str) {
    return btoa(encodeURIComponent(str).replace(/%([0-9A-F]{2})/g, function(match, p1) {
        return String.fromCharCode('0x' + p1);
    }));
}

function saveData() {
    // Save data using URL as key for stability
    const exportData = courses.map(c => ({
        url: c.url,
        gscKeywords: c.gscKeywords,
        adsKeywords: c.adsKeywords
    }));
    localStorage.setItem('antigravity_data_v2', JSON.stringify(exportData));
}

function loadData() {
    const saved = localStorage.getItem('antigravity_data_v2');
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            Object.keys(parsed).forEach(urlKey => {
                const data = parsed[urlKey];
                const target = courses.find(c => normalizeUrl(c.url) === urlKey);
                if (target) {
                    target.gscKeywords = data.gsc || [];
                    target.adsKeywords = data.ads || [];
                }
            });
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
        const results = file.name.toLowerCase().endsWith('.xml') ? parseSmartXML(text) : parseCSV(text);
        
        console.log(`Processing ${file.name}: Found ${results.length} course groups.`);

        results.forEach(res => {
            coursesInFiles++;
            let targetCourse;
            
            if (res.url === 'current') {
                targetCourse = courses.find(c => c.id === activeCourseId);
            } else {
                // STRICT MATCH ONLY: Prevents "Engenharia Informatica" from stealing from "Engenharia Informatica e Redes"
                // SMART MATCH: URL First (Strict), then Name (Exact)
                targetCourse = courses.find(c => {
                    const n1 = normalizeUrl(c.url);
                    const n2 = normalizeUrl(res.url);
                    // Match by URL first
                    if (n1 && n2 && n1 === n2) return true;
                    // Fallback to EXACT name match if URL fails or is missing
                    if (c.name && res.name && c.name.trim().toLowerCase() === res.name.trim().toLowerCase()) return true;
                    return false;
                });
            }

            if (targetCourse) {
                console.log(`[Matcher] Match found: ${res.url} -> ${targetCourse.name}`);
                
                if (type === 'gsc') {
                    targetCourse.gscKeywords = mergeKeywords(targetCourse.gscKeywords || [], res.keywords, 'clicks');
                } else {
                    targetCourse.adsKeywords = mergeKeywords(targetCourse.adsKeywords || [], res.keywords, 'impressions');
                }
                totalUpdated++;
            } else {
                console.warn(`[Matcher] No match found for URL: ${res.url}`);
            }
        });
    }

    if (totalUpdated > 0) {
        alert(`🚀 Smart Bulk Sync Complete!\n\nProcessed ${coursesInFiles} courses from files.\nSuccessfully merged new data into ${totalUpdated} courses.`);
        renderCourseList(); // Refresh sidebar badges
        loadCourse(activeCourseId); // Refresh view
        saveData();
    } else {
        alert(`No matching courses found.\n\nParsed ${coursesInFiles} courses from the file, but none matched the 450 courses in our database.`);
    }
}

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
    
    // Strategy: Any element that has a child containing 'http' is likely a course container
    // We skip the root element to avoid "Total/Summary" blocks that contain everything
    for (let i = 0; i < allElements.length; i++) {
        const el = allElements[i];
        if (el === xml.documentElement) continue; // SKIP ROOT
        
        const tagName = el.tagName.toLowerCase();
        
        // Skip common leaf/metric nodes
        if (['texto', 'filtro', 'cliques', 'impressoes', 'dimension', 'query'].includes(tagName)) continue;
        
        // Does this node contain a direct child with a URL?
        let hasUrl = false;
        for (let child of el.children) {
            if (child.textContent.includes('http')) {
                hasUrl = true;
                break;
            }
        }
        
        // Does it contain keywords/texto?
        let hasKeywords = el.querySelectorAll('Texto, texto, Query, query, TEXTO, QUERY').length > 0;

        if (hasUrl && hasKeywords) {
            potentialCourseNodes.push(el);
        }
    }

    // Deduplicate: If one potential node is inside another, keep the deeper one (more specific)
    const specificNodes = potentialCourseNodes.filter(n => {
        return !potentialCourseNodes.some(other => other !== n && n.parentElement === other);
    });

    // If we found specific containers (like <Curso>), use them
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

function renderCourseList() {
    const list = document.getElementById('course-list');
    list.innerHTML = '';

    // Grouping Logic
    const grouped = {};
    courses.forEach(course => {
        if (!grouped[course.institution]) grouped[course.institution] = {};
        if (!grouped[course.institution][course.degree]) grouped[course.institution][course.degree] = [];
        grouped[course.institution][course.degree].push(course);
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
        // Institution Header
        const instHeader = document.createElement('div');
        instHeader.className = 'nav-group-header';
        instHeader.textContent = inst;
        list.appendChild(instHeader);

        const degreeOrder = ['CTeSP', 'Licenciaturas', 'Mestrados Integrados', 'Mestrados', 'Doutoramentos', 'Pós-Graduações', 'Formação'];
        
        Object.keys(grouped[inst]).sort((a, b) => {
            const indexA = degreeOrder.indexOf(a);
            const indexB = degreeOrder.indexOf(b);
            if (indexA === -1 && indexB === -1) return a.localeCompare(b);
            if (indexA === -1) return 1;
            if (indexB === -1) return -1;
            return indexA - indexB;
        }).forEach(degree => {
            // Degree Accordion
            const degreeDetails = document.createElement('details');
            degreeDetails.className = 'nav-degree-group';
            
            const summary = document.createElement('summary');
            summary.textContent = degree;
            degreeDetails.appendChild(summary);

            const ul = document.createElement('ul');
            // Sort courses alphabetically A-Z
            const sortedCourses = [...grouped[inst][degree]].sort((a, b) => a.name.localeCompare(b.name, 'pt'));
            
            sortedCourses.forEach(course => {
                const li = document.createElement('li');
                const gscCount = course.gscKeywords.length;
                const adsCount = course.adsKeywords.length;
                let badges = '';
                if (gscCount > 0) badges += `<span class="badge gsc-count">${gscCount}</span>`;
                if (adsCount > 0) badges += `<span class="badge ads-count">${adsCount}</span>`;

                li.innerHTML = `
                    <span class="course-name">${course.name}</span>
                    <div class="course-badges">${badges}</div>
                `;
                li.dataset.id = course.id;
                if (course.id === activeCourseId) li.classList.add('active');
                
                li.addEventListener('click', () => {
                    document.querySelectorAll('#course-list li').forEach(el => el.classList.remove('active'));
                    li.classList.add('active');
                    loadCourse(course.id);
                });
                ul.appendChild(li);
            });
            degreeDetails.appendChild(ul);
            list.appendChild(degreeDetails);
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

function loadCourse(id) {
    activeCourseId = id;
    const course = courses.find(c => c.id === id);
    if (!course) return;
    
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
    document.getElementById('active-course-desc').textContent = `${course.degree} | ${course.institution}`;
    
    renderTables(course.gscKeywords, course.adsKeywords);
    updateStats(course);

    // Auto-open parent accordion
    const activeLi = document.querySelector(`#course-list li[data-id="${id}"]`);
    if (activeLi) {
        const parentDetails = activeLi.closest('details');
        if (parentDetails) parentDetails.open = true;
    }
}

function hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
    } : null;
}

function renderTables(gsc = [], ads = []) {
    const gscBody = document.getElementById('gsc-body');
    const adsBody = document.getElementById('ads-body');
    
    gscBody.innerHTML = '';
    adsBody.innerHTML = '';
    
    // Sort Alphabetically
    const sortedGsc = [...gsc].sort((a, b) => a.term.localeCompare(b.term, 'pt'));
    const sortedAds = [...ads].sort((a, b) => a.term.localeCompare(b.term, 'pt'));
    
    const gscTerms = sortedGsc.map(k => k.term.toLowerCase());
    const adsTerms = sortedAds.map(k => k.term.toLowerCase());
    
    if (sortedGsc.length === 0) {
        gscBody.innerHTML = `<tr><td colspan="3" style="text-align:center; padding:40px; color:var(--text-muted); opacity:0.5;">📂 Upload GSC data to see keywords</td></tr>`;
    } else {
        sortedGsc.forEach(k => {
            const tr = document.createElement('tr');
            const isMatch = adsTerms.includes(k.term.toLowerCase());
            tr.innerHTML = `
                <td>${k.term}</td>
                <td>${k.clicks.toLocaleString()}</td>
                <td>${isMatch ? '<span class="match-tag">✓ Active in Ads</span>' : '<span class="text-muted">Organic Only</span>'}</td>
            `;
            gscBody.appendChild(tr);
        });
    }
    
    if (sortedAds.length === 0) {
        adsBody.innerHTML = `<tr><td colspan="2" style="text-align:center; padding:40px; color:var(--text-muted); opacity:0.5;">📂 Upload Ads data to see keywords</td></tr>`;
    } else {
        sortedAds.forEach(k => {
            const tr = document.createElement('tr');
            const isMatch = gscTerms.includes(k.term.toLowerCase());
            tr.innerHTML = `
                <td>${k.term}</td>
                <td>${isMatch ? '<span class="match-tag">✓ Active in GSC</span>' : '<span class="gap-tag">⚠ Organic Gap</span>'}</td>
            `;
            adsBody.appendChild(tr);
        });
    }
}

function updateStats(course) {
    const gscCount = course.gscKeywords.length;
    const adsCount = course.adsKeywords.length;
    const gscTerms = course.gscKeywords.map(k => k.term.toLowerCase());
    const adsTerms = course.adsKeywords.map(k => k.term.toLowerCase());
    const matches = adsTerms.filter(term => gscTerms.includes(term)).length;
    const parity = adsCount > 0 ? Math.round((matches / adsCount) * 100) : 0;
    const gaps = adsTerms.filter(term => !gscTerms.includes(term)).length;
    
    document.getElementById('gsc-count').textContent = gscCount;
    document.getElementById('ads-count').textContent = adsCount;
    document.getElementById('parity-score').textContent = `${parity}%`;
    document.getElementById('parity-bar').style.width = `${parity}%`;
    document.getElementById('gap-count').textContent = gaps;
}

function filterKeywords(query) {
    const q = query.toLowerCase();
    const course = courses.find(c => c.id === activeCourseId);
    const filteredGsc = course.gscKeywords.filter(k => k.term.toLowerCase().includes(q));
    const filteredAds = course.adsKeywords.filter(k => k.term.toLowerCase().includes(q));
    renderTables(filteredGsc, filteredAds);
}

document.addEventListener('DOMContentLoaded', init);
