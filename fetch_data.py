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
    """The original stable URL normalization logic, now enhanced for language-agnostic matching."""
    if not url: return ""
    # Strip query parameters and hashes
    u = str(url).lower().split('?')[0].split('#')[0].rstrip('/')
    # Remove http/https and www
    u = u.replace('https://', '').replace('http://', '').replace('www.', '')
    # Remove language prefixes if they exist at the start of the path
    import re
    u = re.sub(r'/(pt|en|es)(/|$)', '/', u)
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

    # 2. Process Keywords
    ads_map = {}
    for row in all_ads_records:
        # Robust column detection
        url_raw = row.get('Final URL', row.get('URL', row.get('Landing page', row.get('Final url', ''))))
        url = normalize_url(url_raw)
        if not url: continue
        
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
    for item in data:
        if item.get('type') == 'metadata': continue
        url = normalize_url(item.get('url', ''))
        if url in ads_map:
            keywords = list(ads_map[url].values())
            # Sort by volume then impressions
            keywords.sort(key=lambda x: (x['vol'], x['impressions']), reverse=True)
            item['adsKeywords'] = keywords[:100]
            updated += 1
            total_matched_keywords += len(keywords)

    print(f"Sync Result: Updated {updated} courses with {total_matched_keywords} keywords.")

    # 4. Save and Finish
    timestamp = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    for item in data:
        if item.get('type') == 'metadata':
            item['lastSync'] = timestamp
            item['totalAdsCourses'] = updated

    with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    
    print(f"Pipeline Complete. Updated {updated} courses.")

if __name__ == "__main__":
    main()
