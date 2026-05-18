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
            for row in ads:
                row['__institution__'] = inst
            all_ads_records.extend(ads)
        if camps: 
            print(f"  Captured {len(camps)} campaign rows.")
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

    def detect_row_degree_type(url, campaign, ad_group):
        u = url.lower()
        c = campaign.lower()
        a = ad_group.lower()
        
        # Check URL path
        if 'licenciatura' in u or 'licenciaturas' in u:
            return 'Licenciatura'
        if 'mestrado' in u or 'mestrados' in u:
            return 'Mestrado'
        if 'ctesp' in u or 'tesp' in u:
            return 'TeSP'
        if 'pos-gradua' in u or 'posgradua' in u or 'pg-' in u:
            return 'Pós-Graduação'
        if 'doutoramento' in u or 'doutorado' in u:
            return 'Doutoramento'
            
        # Check campaign and ad group names
        for text in (a, c):
            if 'licenciatura' in text:
                return 'Licenciatura'
            if 'mestrado' in text:
                return 'Mestrado'
            if 'ctesp' in text or 'tesp' in text:
                return 'TeSP'
            if 'pos-gradua' in text or 'posgradua' in text or 'pg-' in text or 'pós' in text:
                return 'Pós-Graduação'
            if 'doutoramento' in text or 'doutorado' in text:
                return 'Doutoramento'
                
        return None

    def check_institution_match(course_inst, row_inst, url):
        if row_inst == 'IPLUSO':
            return course_inst == 'IPLUSO'
        if row_inst == 'ISMAT':
            return course_inst == 'ISMAT'
        if row_inst == 'ISLA_Gaia':
            return course_inst == 'ISLA Gaia'
        if row_inst == 'Lusofona':
            if course_inst not in ('Lusófona Lisboa', 'Lusófona Porto'):
                return False
            if course_inst == 'Lusófona Porto':
                return 'porto' in url
            if course_inst == 'Lusófona Lisboa':
                return 'porto' not in url
        return False

    def check_degree_match(course_degree, row_degree):
        if not row_degree:
            return True
        if row_degree == 'Mestrado':
            return course_degree in ('Mestrado', 'Mestrado Integrado')
        return course_degree == row_degree

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
                'institution': item.get('institution', ''),
                'degree_type': item.get('degree_type', '')
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
        row_inst = row.get('__institution__')
        
        row_degree = detect_row_degree_type(url, row.get('Campaign', ''), row.get('Ad Group', ''))
        
        best_match_course = None
        for c in course_catalog:
            # Match if the cleaned slug is a substring of the ad group or campaign name
            if len(c['slug']) > 3 and (c['slug'] in ad_group or c['slug'] in campaign):
                # Verify school and degree type parity
                if check_institution_match(c['institution'], row_inst, url):
                    if check_degree_match(c['degree_type'], row_degree):
                        best_match_course = c
                        break
                
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
    
    # Pre-parse ads_map keys for fallback fuzzy matching
    ads_fuzzy_pool = []
    for ads_url in ads_map:
        parts = ads_url.split('/')
        domain = parts[0]
        path = '/'.join(parts[1:])
        ads_fuzzy_pool.append({
            'url': ads_url,
            'domain': domain,
            'path': path
        })

    # Track matched ads URLs to identify and log skipped entries
    matched_ads_urls = set()

    for item in data:
        if item.get('type') == 'metadata': continue
        url = normalize_url(item.get('url', ''))
        
        matched_url = None
        if url in ads_map:
            matched_url = url
        else:
            # Fallback fuzzy matching for domains with legacy URLs (ISLA Gaia, IPLUSO, ISMAT)
            course_domain = url.split('/')[0] if '/' in url else url
            course_path = '/'.join(url.split('/')[1:]) if '/' in url else ''
            course_slug = url.split('/')[-1] if '/' in url else url
            
            if course_slug and len(course_slug) > 3:
                for pool_item in ads_fuzzy_pool:
                    if pool_item['domain'] == course_domain:
                        # Verify degree type parity to avoid false matches across degrees
                        degree_match = True
                        if 'ctesp' in course_path and 'ctesp' not in pool_item['path']:
                            degree_match = False
                        if 'licenciatura' in course_path and 'licenciatura' not in pool_item['path']:
                            degree_match = False
                        if 'pos-gradua' in course_path and 'pos-gradua' not in pool_item['path']:
                            degree_match = False
                        if 'lisboa' in course_path and 'lisboa' not in pool_item['path']:
                            degree_match = False
                        if 'porto' in course_path and 'porto' not in pool_item['path']:
                            degree_match = False
                            
                        # Check if course slug is a substring of the spreadsheet URL path
                        if degree_match and course_slug in pool_item['path']:
                            matched_url = pool_item['url']
                            break
                            
        if matched_url:
            matched_ads_urls.add(matched_url)
            keywords = list(ads_map[matched_url].values())
            # Sort by volume then impressions
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
