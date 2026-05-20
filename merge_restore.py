import json
import re
import requests
import base64

def fix_string(s):
    if not s: return ""
    try:
        # Resolve double-encoding by roundtripping latin-1 and utf-8
        test_bytes = s.encode('latin-1')
        decoded = test_bytes.decode('utf-8')
        if any(x in s for x in ['Ã', 'Â']):
            s = decoded
    except:
        pass
    replacements = {
        'Ã§Ã£': 'çã',
        'Ã§': 'ç',
        'Ã£': 'ã',
        'Ã³': 'ó',
        'Ã¡': 'á',
        'Ã©': 'é',
        'Ã­': 'í',
        'Ãµ': 'õ',
        'Ãª': 'ê',
        'Ã¢': 'â',
        'Ã ': 'à',
        'Â³': '³',
    }
    for old, new in replacements.items():
        s = s.replace(old, new)
    return s

def clean_string(s):
    if not s: return ""
    s = fix_string(s)
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
    s = re.sub(r'[^a-z0-9]', '', s)
    return s

# 1. Load local baseline
COURSES_PATH = r"c:\Users\audem\Desktop\Antigravity\antigravity-keyword-agent\courses.json"
with open(COURSES_PATH, 'r', encoding='utf-8') as f:
    baseline = json.load(f)

# 2. Fetch pristine historical data from commit 66cf771f
CONFIG_PATH = r"c:\Users\audem\Desktop\Antigravity\antigravity-keyword-agent\github_config.json"
with open(CONFIG_PATH, "r", encoding="utf-8") as f:
    config = json.load(f)
TOKEN = config["github_token"]
REPO = "LaminatedYamal/ULUS-FONA"

print("Fetching pristine GSC data from GitHub commit 66cf771f...")
headers = {
    'Authorization': f'token {TOKEN}',
    'Accept': 'application/vnd.github.v3+json'
}
url = f"https://api.github.com/repos/{REPO}/contents/courses.json?ref=66cf771f"
res = requests.get(url, headers=headers).json()
raw_bytes = base64.b64decode(res['content'])
pristine_text = raw_bytes.decode('latin-1')
pristine_data = json.loads(pristine_text)

# 3. Build recovery map
recovery_map = {}
for item in pristine_data:
    if not isinstance(item, dict) or item.get('type') == 'metadata' or 'institution' not in item:
        continue
    name = clean_string(item['name'])
    inst = clean_string(item['institution'])
    recovery_map[(name, inst)] = item

# 4. Merge and fix GSC keywords
merged_count = 0
for b in baseline:
    if not isinstance(b, dict) or b.get('type') == 'metadata' or 'institution' not in b:
        continue
    
    b['institution'] = fix_string(b['institution'])
    b['name'] = fix_string(b['name'])
    
    name = clean_string(b['name'])
    inst = clean_string(b['institution'])
    key = (name, inst)
    
    if key in recovery_map:
        r = recovery_map[key]
        if r.get('gscKeywords'):
            fixed_kws = []
            for kw in r['gscKeywords']:
                fixed_kw = {
                    'term': fix_string(kw.get('term', '')),
                    'clicks': kw.get('clicks', 0),
                    'impressions': kw.get('impressions', 0)
                }
                fixed_kws.append(fixed_kw)
            b['gscKeywords'] = fixed_kws
            merged_count += 1
        else:
            b['gscKeywords'] = []
    else:
        b['gscKeywords'] = []

print(f"Successfully restored actual, clean, accented GSC keywords for {merged_count} courses!")

# 5. Save locally as UTF-8
with open(COURSES_PATH, 'w', encoding='utf-8') as f:
    json.dump(baseline, f, indent=2, ensure_ascii=False)
