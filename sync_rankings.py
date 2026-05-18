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

    # 4. Update
    match_count = 0
    for course in courses:
        if isinstance(course, dict) and course.get('type') == 'metadata':
            continue
            
        norm_c_url = normalize_url(course.get('url', ''))
        if norm_c_url in final_rankings:
            course['rankingsKeywords'] = final_rankings[norm_c_url]
            match_count += 1
        else:
            # Strictly clear if no exact match (blocks homepage bleeding)
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
