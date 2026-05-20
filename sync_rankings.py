import os
import json
import xml.etree.ElementTree as ET
import requests
import base64
import datetime

# CONFIGURATION
XML_PATH = r"G:\My Drive\Rankings\XML export template.xml"
COURSES_FILE = r"c:\Users\audem\Desktop\Antigravity\antigravity-keyword-agent\courses.json"
GITHUB_REPO = "LaminatedYamal/ULUS-FONA"
# Load GitHub configuration securely from local github_config.json
CONFIG_PATH = os.path.join(os.path.dirname(__file__), "github_config.json")
if not os.path.exists(CONFIG_PATH):
    with open(CONFIG_PATH, "w", encoding="utf-8") as f:
        json.dump({"github_token": "YOUR_NEW_GITHUB_TOKEN"}, f, indent=2)

with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    github_config = json.load(f)
GITHUB_TOKEN = github_config.get("github_token", "YOUR_NEW_GITHUB_TOKEN")

def normalize_url(url):
    if not url: return ""
    u = str(url).lower().split('?')[0].split('#')[0].rstrip('/')
    u = u.replace('https://', '').replace('http://', '').replace('www.', '')
    import re
    u = re.sub(r'/(pt|en|es)(/|$)', '/', u)
    u = re.sub(r'-(pt|en|es)$', '', u)
    return u.rstrip('/')

def sync_rankings():
    print(f"Starting Auto-Sync from: {XML_PATH}")
    
    if not os.path.exists(XML_PATH):
        print("Error: Rankings XML not found on Drive.")
        return

    # 1. Read XML
    with open(XML_PATH, 'r', encoding='utf-8') as f:
        xml_text = f.read()
    
    # 2. Parse XML
    try:
        root = ET.fromstring(xml_text)
    except ET.ParseError as e:
        print(f"XML Parse Error: {e}")
        return

    new_rankings = {}
    for record in root.findall('.//record'):
        kw = record.find('Keyword').text if record.find('Keyword') is not None else None
        url = record.find('URLFound').text if record.find('URLFound') is not None else None
        pos_text = record.find('Rank').text if record.find('Rank') is not None else "0"
        prev_text = record.find('PreviousRank').text if record.find('PreviousRank') is not None else pos_text
        
        if kw and url:
            norm_url = normalize_url(url)
            rank = int(pos_text) if pos_text.isdigit() else 0
            prev_rank = int(prev_text) if prev_text.isdigit() else rank
            
            if norm_url not in new_rankings:
                new_rankings[norm_url] = {}
            
            kw_key = kw.lower().strip()
            if kw_key not in new_rankings[norm_url] or rank < new_rankings[norm_url][kw_key]['rank']:
                new_rankings[norm_url][kw_key] = {
                    "term": kw,
                    "rank": rank,
                    "prevRank": prev_rank,
                    "url": url
                }

    final_rankings = {}
    for url in new_rankings:
        final_rankings[url] = list(new_rankings[url].values())

    print(f"Found rankings for {len(final_rankings)} unique URLs.")

    # 3. Load Courses (Fetch from GitHub first to preserve other nightly syncs like Ads/GSC)
    print("Fetching fresh courses.json from GitHub to prevent data overwrites...")
    github_url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/courses.json"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }
    fetched_from_github = False
    try:
        res = requests.get(github_url, headers=headers)
        if res.status_code == 200:
            content_b64 = res.json()['content']
            courses_str = base64.b64decode(content_b64).decode('utf-8')
            courses = json.loads(courses_str)
            print("Successfully loaded fresh courses.json from GitHub.")
            fetched_from_github = True
        else:
            print(f"Warning: GitHub API returned status {res.status_code}. Falling back to local file.")
    except Exception as e:
        print(f"Warning: GitHub fetch failed ({str(e)}). Falling back to local file.")

    if not fetched_from_github:
        with open(COURSES_FILE, 'r', encoding='utf-8') as f:
            try:
                courses = json.load(f)
            except json.JSONDecodeError:
                print("Recovering courses from backup or history...")
                courses = []

    # 4. Update (1-to-1 mapping to prevent rankings duplicate injections)
    course_rankings_map = {} # course_url -> list of ranking dicts
    
    # Pre-compile the course catalog URLs and info
    catalog_lookup = []
    for course in courses:
        if isinstance(course, dict) and course.get('type') == 'metadata':
            continue
        c_url = normalize_url(course.get('url', ''))
        if c_url:
            c_path = '/'.join(c_url.split('/')[1:]) if '/' in c_url else ''
            c_slug = c_url.split('/')[-1]
            c_domain = c_url.split('/')[0]
            
            c_degree = None
            if 'ctesp' in c_path:
                c_degree = 'ctesp'
            elif 'licenciatura' in c_path:
                c_degree = 'licenciatura'
            elif 'pos-gradua' in c_path:
                c_degree = 'pos-gradua'
                
            catalog_lookup.append({
                'url': c_url,
                'domain': c_domain,
                'path': c_path,
                'slug': c_slug,
                'degree': c_degree,
                'item_ref': course
            })

    # Helper function to clean text for matching
    def clean_text(s):
        if not s: return ""
        import re
        s = s.lower().strip()
        accents = {
            'á':'a', 'à':'a', 'â':'a', 'ã':'a', 'ä':'a',
            'é':'e', 'è':'e', 'ê':'e', 'ë':'e',
            'í':'i', 'ì':'i', 'î':'i', 'ï':'i',
            'ó':'o', 'ò':'o', 'ô':'o', 'õ':'o', 'ö':'o',
            'ú':'u', 'ù':'u', 'û':'u', 'ü':'u',
            'ç':'c', 'ñ':'n'
        }
        for char, replacement in accents.items():
            s = s.replace(char, replacement)
        s = re.sub(r'\b(ctesp|licenciatura|mestrado|pos-graduacao|curso)\b', '', s)
        s = re.sub(r'[^a-z0-9\s-]', '', s)
        s = s.replace('-', ' ')
        return ' '.join(s.split())

    for rank_url, rank_kws in final_rankings.items():
        rank_domain = rank_url.split('/')[0] if '/' in rank_url else rank_url
        rank_path = '/'.join(rank_url.split('/')[1:]) if '/' in rank_url else ''
        
        rank_degree = None
        if 'ctesp' in rank_path:
            rank_degree = 'ctesp'
        elif 'licenciatura' in rank_path:
            rank_degree = 'licenciatura'
        elif 'pos-gradua' in rank_path:
            rank_degree = 'pos-gradua'
            
        best_course = None
        best_score = -1
        
        for c in catalog_lookup:
            if c['domain'] != rank_domain:
                continue
                
            # Exact Match
            if c['url'] == rank_url:
                best_course = c
                best_score = 9999
                break
                
            # Fuzzy Match
            if rank_degree and c['degree'] and rank_degree != c['degree']:
                continue
                
            c_slug_clean = clean_text(c['slug'])
            rank_path_clean = clean_text(rank_path)
            
            if c_slug_clean and len(c_slug_clean) > 3 and c_slug_clean in rank_path_clean:
                score = len(c_slug_clean)
                if score > best_score:
                    best_course = c
                    best_score = score
                    
        if best_course:
            c_url = best_course['url']
            if c_url not in course_rankings_map:
                course_rankings_map[c_url] = []
            course_rankings_map[c_url].extend(rank_kws)

    # Assign rankings back to the courses in courses array
    match_count = 0
    for course in courses:
        if isinstance(course, dict) and course.get('type') == 'metadata':
            continue
        url = normalize_url(course.get('url', ''))
        if url in course_rankings_map:
            # Deduplicate by term, keeping the one with best rank
            course_kws = {}
            for rkw in course_rankings_map[url]:
                term = rkw['term'].strip().lower()
                if term not in course_kws or rkw['rank'] < course_kws[term]['rank']:
                    course_kws[term] = rkw
                    
            course['rankingsKeywords'] = list(course_kws.values())
            match_count += 1
        else:
            course['rankingsKeywords'] = []

    # 5. Update Sync Metadata
    found_meta = False
    timestamp = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    for item in courses:
        if isinstance(item, dict) and item.get('type') == 'metadata':
            item['last_sync_by'] = "Antigravity AI (Organic Sync)"
            item['last_sync_at'] = timestamp
            found_meta = True
            break
    
    if not found_meta:
        courses.append({
            "type": "metadata",
            "last_sync_by": "Antigravity AI (Organic Sync)",
            "last_sync_at": timestamp
        })

    print(f"Matched rankings to {match_count} courses.")

    # Save local plain text
    with open(COURSES_FILE, 'w', encoding='utf-8') as f:
        json.dump(courses, f, indent=2, ensure_ascii=False)

    # 5. Push PLAIN to GitHub
    push_to_github(courses)

def push_to_github(data):
    url = f"https://api.github.com/repos/{GITHUB_REPO}/contents/courses.json"
    headers = {
        "Authorization": f"token {GITHUB_TOKEN}",
        "Accept": "application/vnd.github.v3+json"
    }

    res = requests.get(url, headers=headers)
    if res.status_code != 200:
        print("Failed to get SHA from GitHub.")
        return
    sha = res.json()['sha']

    # Stringify PLAIN JSON
    content_str = json.dumps(data, indent=2, ensure_ascii=False)
    content_b64 = base64.b64encode(content_str.encode('utf-8')).decode('utf-8')

    payload = {
        "message": "Dashboard Restore: Reverting to Plain JSON with Secure Login",
        "content": content_b64,
        "sha": sha,
        "branch": "main"
    }
    
    put_res = requests.put(url, headers=headers, json=payload)
    if put_res.status_code == 200:
        print("Restore Sync Complete! Plain data is live.")
    else:
        print(f"GitHub Push Failed: {put_res.text}")

if __name__ == "__main__":
    sync_rankings()
