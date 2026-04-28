
import json
import re

def clean_string(s):
    if not s: return ""
    # Replace the Unicode Replacement Character and other common artifacts
    s = s.replace('\ufffd', 'o').replace('A3', 'o').replace('Ã³', 'o')
    s = s.lower().strip()
    accents = {
        'á':'a', 'à':'a', 'â':'a', 'ã':'a',
        'é':'e', 'è':'e', 'ê':'e',
        'í':'i', 'ì':'i', 'î':'i',
        'ó':'o', 'ò':'o', 'ô':'o', 'õ':'o',
        'ú':'u', 'ù':'u', 'û':'u',
        'ç':'c'
    }
    for char, replacement in accents.items():
        s = s.replace(char, replacement)
    s = re.sub(r'[^a-z0-9\s]', '', s)
    return " ".join(s.split())

# Load the baseline
with open('c:/Users/audem/Desktop/Antigravity/antigravity-keyword-agent/courses.json', 'r', encoding='utf-8') as f:
    baseline = json.load(f)

# Load the recovered data
with open('c:/Users/audem/Desktop/Antigravity/antigravity-keyword-agent/recovered_keywords.json', 'r', encoding='utf-8') as f:
    lines = f.readlines()
    json_start = 0
    for i, line in enumerate(lines):
        if line.strip().startswith('['):
            json_start = i
            break
    recovered_raw = "".join(lines[json_start:])
    recovered = json.loads(recovered_raw)

# Create lookup map
recovery_map = {}
for r in recovered:
    name = clean_string(r['name'])
    inst = clean_string(r['institution'])
    recovery_map[(name, inst)] = r

# Merge
merged_count = 0
for b in baseline:
    # First, fix the corrupted baseline institution for future use
    if '\ufffd' in b['institution']:
        b['institution'] = b['institution'].replace('\ufffd', 'ó')
    
    name = clean_string(b['name'])
    inst = clean_string(b['institution'])
    key = (name, inst)
    
    if key in recovery_map:
        r = recovery_map[key]
        if r.get('gscKeywords') or r.get('adsKeywords'):
            b['gscKeywords'] = r.get('gscKeywords', [])
            b['adsKeywords'] = r.get('adsKeywords', [])
            merged_count += 1

print(f"Successfully restored keywords for {merged_count} courses.")

# Save with proper UTF-8 and clean headers
with open('c:/Users/audem/Desktop/Antigravity/antigravity-keyword-agent/courses.json', 'w', encoding='utf-8') as f:
    json.dump(baseline, f, indent=2, ensure_ascii=False)
