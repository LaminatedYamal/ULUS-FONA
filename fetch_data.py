import os
import json
import datetime
import gspread
from google.oauth2 import service_account

# Configuration
JSON_FILE_PATH = 'courses.json'
CAMPAIGNS_FILE_PATH = 'campaigns.json'
SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']

def load_ads_data(sheet_id, creds_dict):
    """Loads keywords using the STABLE get_all_records logic (Same as original Lusofona)."""
    if not sheet_id or not creds_dict:
        return None
    try:
        credentials = service_account.Credentials.from_service_account_info(creds_dict, scopes=SHEETS_SCOPES)
        gc = gspread.authorize(credentials)
        sh = gc.open_by_key(sheet_id)
        
        # Try to find 'Ads Hub' specifically, fallback to first sheet
        try:
            sheet = sh.worksheet('Ads Hub')
        except:
            sheet = sh.get_worksheet(0)
            
        print(f"  Using sheet: {sheet.title}")
        return sheet.get_all_records()
    except Exception as e:
        print(f"Note: Could not fetch Keywords for {sheet_id}: {str(e)}")
        return None

def load_campaign_data(sheet_id, creds_dict):
    """Loads campaign stats from the 'Campaigns' tab."""
    if not sheet_id or not creds_dict:
        return None
    try:
        credentials = service_account.Credentials.from_service_account_info(creds_dict, scopes=SHEETS_SCOPES)
        gc = gspread.authorize(credentials)
        sheet = gc.open_by_key(sheet_id).worksheet('Campaigns')
        all_vals = sheet.get_all_values()
        if len(all_vals) < 2: return []
        
        records = []
        for row in all_vals[1:]:
            if len(row) < 9: continue
            records.append({
                'Campaign': row[0],
                'Status': row[1],
                'Budget': row[2],
                'Cost': row[3],
                'Impressions': row[4],
                'Clicks': row[5],
                'Conversions': row[6],
                'CTR': row[7],
                'CostPerConv': row[8]
            })
        return records
    except:
        return None

def normalize_url(url):
    """The original stable URL normalization logic, now enhanced for language-agnostic matching, unquoting, and accent-stripping."""
    if not url: return ""
    import urllib.parse
    import re
    # Unquote percent-encoding
    u = urllib.parse.unquote(str(url)).lower().strip()
    # Strip query parameters and hashes
    u = u.split('?')[0].split('#')[0].rstrip('/')
    # Remove http/https and www
    u = u.replace('https://', '').replace('http://', '').replace('www.', '')
    # Remove language prefixes if they exist at the start of the path
    u = re.sub(r'/(pt|en|es)(/|$)', '/', u)
    # Remove language suffixes from the slug (e.g., -pt, -en)
    u = re.sub(r'-(pt|en|es)$', '', u)
    # Normalize accented characters
    accents = {
        'á':'a', 'à':'a', 'â':'a', 'ã':'a', 'ä':'a',
        'é':'e', 'è':'e', 'ê':'e', 'ë':'e',
        'í':'i', 'ì':'i', 'î':'i', 'ï':'i',
        'ó':'o', 'ò':'o', 'ô':'o', 'õ':'o', 'ö':'o',
        'ú':'u', 'ù':'u', 'û':'u', 'ü':'u',
        'ç':'c', 'ñ':'n'
    }
    for char, replacement in accents.items():
        u = u.replace(char, replacement)
    u = u.rstrip('/')
    return u

def clean_num(v):
    if v is None or v == "": return 0
    try:
        s = str(v).replace('€', '').replace('$', '').replace('%', '').strip()
        if ',' in s and '.' in s: s = s.replace('.', '').replace(',', '.')
        elif ',' in s: s = s.replace(',', '.')
        return float(s)
    except: return 0

def main():
    print("Starting automated data fetch pipeline (v101 — Stable Multi-Institution)...")
    
    creds_json = os.environ.get('GCP_SERVICE_ACCOUNT_JSON')
    if not creds_json:
        print("Error: GCP_SERVICE_ACCOUNT_JSON not set.")
        return
    creds_dict = json.loads(creds_json)
    
    INSTITUTION_SHEETS = {
        'Lusofona':  os.environ.get('GOOGLE_ADS_SHEET_ID'),
        'IPLUSO':    os.environ.get('GOOGLE_ADS_SHEET_ID_IPLUSO'),
        'ISMAT':     os.environ.get('GOOGLE_ADS_SHEET_ID_ISMAT'),
        'ISLA_Gaia': os.environ.get('GOOGLE_ADS_SHEET_ID_ISLA_GAIA'),
    }

    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except:
        print("Error loading courses.json")
        return

    all_ads_records = []
    all_campaign_records = []

    for inst, sid in INSTITUTION_SHEETS.items():
        if not sid: continue
        print(f"Fetching {inst} (ID: ...{sid[-6:]})...")
        ads = load_ads_data(sid, creds_dict)
        camps = load_campaign_data(sid, creds_dict)
        if ads: 
            print(f"  Captured {len(ads)} keyword rows.")
            for r in ads:
                r['source_inst'] = inst
            all_ads_records.extend(ads)
            # Live Debug: search for Criminologia
            for r in ads:
                val = str(r).lower()
                if 'crimin' in val:
                    print(f"  [DEBUG MATCH in {inst}]: {r}")
        if camps: 
            print(f"  Captured {len(camps)} campaign rows.")
            for r in camps:
                r['source_inst'] = inst
            all_campaign_records.extend(camps)

    # 1. Process Campaigns
    if all_campaign_records:
        cleaned = []
        for c in all_campaign_records:
            cleaned.append({
                'Campaign': c.get('Campaign', 'Unknown'),
                'Status': c.get('Status', 'UNKNOWN'),
                'Budget': clean_num(c.get('Budget', 0)),
                'Impressions': clean_num(c.get('Impressions', 0)),
                'Clicks': clean_num(c.get('Clicks', 0)),
                'Cost': clean_num(c.get('Cost', 0)),
                'Conversions': clean_num(c.get('Conversions', 0)),
                'CTR': str(c.get('CTR', '0%')),
                'CostPerConv': clean_num(c.get('CostPerConv', 0))
            })
        with open(CAMPAIGNS_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(cleaned, f, indent=2, ensure_ascii=False)

    # Helper to clean text and slugs for matching
    def clean_slug(s):
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
        # Remove degree prefixes/suffixes and generic terms
        s = re.sub(r'\b(ctesp|licenciatura|mestrado|pos-graduacao|curso)\b', '', s)
        s = re.sub(r'[^a-z0-9\s-]', '', s)
        s = s.replace('-', ' ')
        return ' '.join(s.split())

    # Pre-compile the course catalog list of slugs for auto-correction matching
    course_catalog = []
    for item in data:
        if item.get('type') == 'metadata': continue
        c_url = normalize_url(item.get('url', ''))
        if c_url:
            c_slug = clean_slug(c_url.split('/')[-1])
            course_catalog.append({
                'url': c_url,
                'slug': c_slug,
                'name_clean': clean_slug(item.get('name', '')),
                'institution': item.get('institution', '')
            })

    # 2. Process Keywords
    ads_map = {}
    for row in all_ads_records:
        # Robust column detection
        url_raw = row.get('Final URL', row.get('URL', row.get('Landing page', row.get('Final url', ''))))
        url = normalize_url(url_raw)
        if not url: continue

        # Heuristic Auto-Correction: If Ad Group name matches a specific course, correct the URL
        ad_group = clean_slug(row.get('Ad Group', row.get('Ad group', '')))
        campaign = clean_slug(row.get('Campaign', ''))
        
        best_match_course = None
        best_match_len = -1
        for c in course_catalog:
            # Match if the cleaned slug is a substring of the ad group or campaign name
            if len(c['slug']) > 3 and (c['slug'] in ad_group or c['slug'] in campaign):
                # Verify institution parity to prevent incorrect cross-institution mapping
                ad_inst = row.get('source_inst', '')
                course_inst = c['institution']
                
                inst_match = False
                if ad_inst == 'Lusofona' and ('Lusófona' in course_inst or 'Lusofona' in course_inst):
                    inst_match = True
                elif ad_inst == 'IPLUSO' and course_inst == 'IPLUSO':
                    inst_match = True
                elif ad_inst == 'ISLA_Gaia' and course_inst == 'ISLA Gaia':
                    inst_match = True
                elif ad_inst == 'ISMAT' and course_inst == 'ISMAT':
                    inst_match = True
                
                if inst_match:
                    if len(c['slug']) > best_match_len:
                        best_match_course = c
                        best_match_len = len(c['slug'])
                
        if best_match_course and url != best_match_course['url']:
            # Safe verification: Only redirect if the ad group name doesn't contain the current wrong URL's name
            current_slug = clean_slug(url.split('/')[-1])
            if current_slug not in ad_group:
                print(f"  [Auto-Correction] Rerouted '{row.get('Keyword', '')}' (Ad Group: '{row.get('Ad Group')}') from '{url}' to correct URL '{best_match_course['url']}'")
                url = best_match_course['url']
        
        term = str(row.get('Keyword', row.get('Search term', row.get('Keyword ', '')))).strip()
        if not term or term.lower() == 'total': continue
        
        # Capture all possible metrics
        imps = clean_num(row.get('Impressions', row.get('Impr.', 0)))
        clicks = clean_num(row.get('Clicks', 0))
        
        # Keyword Planner specific fields
        vol = clean_num(row.get('Avg. monthly searches', row.get('Search Volume', row.get('Volume', 0))))
        low_bid = clean_num(row.get('Top of page bid (low range)', row.get('Low bid', 0)))
        high_bid = clean_num(row.get('Top of page bid (high range)', row.get('High bid', 0)))
        
        if url not in ads_map: ads_map[url] = {}
        
        # Deduplicate by term per URL, keeping the one with most impressions or volume
        if term not in ads_map[url] or (imps + vol) > (ads_map[url][term]['impressions'] + ads_map[url][term]['vol']):
            ads_map[url][term] = {
                'term': term,
                'impressions': imps,
                'clicks': clicks,
                'vol': vol,
                'low': low_bid,
                'high': high_bid
            }

    # 3. Update Courses
    updated = 0
    total_matched_keywords = 0
    
    # 3. Update Courses (1-to-1 mapping to prevent keyword duplication)
    course_keywords_map = {} # course_url -> list of keywords
    matched_ads_urls = set()
    
    # Pre-compile the course catalog URLs and info
    catalog_lookup = []
    for item in data:
        if item.get('type') == 'metadata': continue
        c_url = normalize_url(item.get('url', ''))
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
                'item_ref': item
            })

    for ads_url, keywords_dict in ads_map.items():
        ads_domain = ads_url.split('/')[0] if '/' in ads_url else ads_url
        ads_path = '/'.join(ads_url.split('/')[1:]) if '/' in ads_url else ''
        
        ads_degree = None
        if 'ctesp' in ads_path:
            ads_degree = 'ctesp'
        elif 'licenciatura' in ads_path:
            ads_degree = 'licenciatura'
        elif 'pos-gradua' in ads_path:
            ads_degree = 'pos-gradua'
            
        best_course = None
        best_score = -1
        
        for c in catalog_lookup:
            if c['domain'] != ads_domain:
                continue
                
            # Exact Match
            if c['url'] == ads_url:
                best_course = c
                best_score = 9999
                break
                
            # Fuzzy Match
            if ads_degree and c['degree'] and ads_degree != c['degree']:
                continue
                
            c_slug_clean = clean_slug(c['slug'])
            ads_path_clean = clean_slug(ads_path)
            
            if c_slug_clean and len(c_slug_clean) > 3 and c_slug_clean in ads_path_clean:
                score = len(c_slug_clean)
                if score > best_score:
                    best_course = c
                    best_score = score
                    
        if best_course:
            matched_ads_urls.add(ads_url)
            c_url = best_course['url']
            if c_url not in course_keywords_map:
                course_keywords_map[c_url] = []
            course_keywords_map[c_url].extend(keywords_dict.values())
            
    # Assign the keywords back to the courses in data
    updated = 0
    total_matched_keywords = 0
    for item in data:
        if item.get('type') == 'metadata': continue
        url = normalize_url(item.get('url', ''))
        if url in course_keywords_map:
            # Deduplicate keywords for this course
            course_kws = {}
            for kw in course_keywords_map[url]:
                term = kw['term'].strip().lower()
                if term not in course_kws or (kw['impressions'] + kw['vol']) > (course_kws[term]['impressions'] + course_kws[term]['vol']):
                    course_kws[term] = kw
            
            keywords = list(course_kws.values())
            keywords.sort(key=lambda x: (x['vol'], x['impressions']), reverse=True)
            item['adsKeywords'] = keywords[:100]
            updated += 1
            total_matched_keywords += len(keywords)
        else:
            item['adsKeywords'] = []

    print(f"Sync Result: Updated {updated} courses with {total_matched_keywords} keywords.")
    
    # Log skipped spreadsheet URLs
    skipped_urls = set(ads_map.keys()) - matched_ads_urls
    if skipped_urls:
        print(f"\n[Logging] Skipped {len(skipped_urls)} spreadsheet URLs (No matching course found):")
        for su in sorted(skipped_urls):
            print(f"  - {su}")
    else:
        print("\n[Logging] Excellent! 100% of spreadsheet URLs matched courses.")

    # 4. Save and Finish
    timestamp = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    for item in data:
        if item.get('type') == 'metadata':
            item['lastSync'] = timestamp
            item['totalAdsCourses'] = updated
            item['last_sync_by'] = 'Automated Pipeline Sync'
            item['last_sync_at'] = timestamp

    with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Pipeline Complete. Updated {updated} courses.")

if __name__ == "__main__":
    main()
