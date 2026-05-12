import os
import re
import json
import datetime
import gspread
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration
JSON_FILE_PATH = 'courses.json'
CAMPAIGNS_FILE_PATH = 'campaigns.json'
SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
GSC_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']

def load_ads_data(sheet_id, creds_dict):
    """Loads keywords from the FIRST tab of the Google Sheet."""
    if not sheet_id or not creds_dict:
        return None
    try:
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=SHEETS_SCOPES
        )
        gc = gspread.authorize(credentials)
        # Tab 1: Keywords
        sheet = gc.open_by_key(sheet_id).get_worksheet(0)
        all_vals = sheet.get_all_values()
        if len(all_vals) < 2: return []
        
        headers = [h.strip().lower() for h in all_vals[0]]
        print(f"[{sheet_id}] Detected Headers: {headers}")
        
        # Find column indexes
        idx_kw = next((i for i, h in enumerate(headers) if 'keyword' in h or 'palavra' in h or 'termo' in h), 0)
        idx_url = next((i for i, h in enumerate(headers) if 'url' in h or 'link' in h or 'final' in h), 1)
        idx_imps = next((i for i, h in enumerate(headers) if 'impress' in h or 'impr' in h), 4)
        idx_clicks = next((i for i, h in enumerate(headers) if 'click' in h or 'clique' in h), 5)
        
        records = []
        for row in all_vals[1:]:
            if len(row) <= max(idx_kw, idx_url, idx_imps, idx_clicks): continue
            records.append({
                'Keyword': row[idx_kw],
                'Final URL': row[idx_url],
                'Impressions': row[idx_imps],
                'Clicks': row[idx_clicks]
            })
            
        print(f"Successfully loaded {len(records)} keywords from Sheets via Smart Mapping.")
        return records
    except Exception as e:
        print(f"Note: Could not fetch Keywords tab: {str(e)}")
        return None

def load_campaign_data(sheet_id, creds_dict):
    """Loads campaign stats from the 'Campaigns' tab using direct indexes."""
    if not sheet_id or not creds_dict:
        return None
    try:
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=SHEETS_SCOPES
        )
        gc = gspread.authorize(credentials)
        sheet = gc.open_by_key(sheet_id).worksheet('Campaigns')
        all_vals = sheet.get_all_values()
        if len(all_vals) < 2: return []
        
        records = []
        for row in all_vals[1:]: # Skip headers
            if len(row) < 9: continue
            records.append({
                'Campaign': row[0],
                'Status': row[1],
                'Budget': row[2],
                'Cost': row[3],        # Fixed Mapping: Cost is at index 3
                'Impressions': row[4], # Fixed Mapping: Impr is at index 4
                'Clicks': row[5],      # Fixed Mapping: Clicks is at index 5
                'Conversions': row[6],
                'CTR': row[7],
                'CostPerConv': row[8]
            })
        print(f"Successfully loaded {len(records)} campaigns from Sheets (Direct Mapping).")
        return records
    except Exception as e:
        print(f"Note: Could not fetch 'Campaigns' tab: {str(e)}")
        return None

def fuzzy_clean_url(url):
    """Aggressively normalizes URLs so they match even if language flags or suffixes differ."""
    u = str(url).lower().split('?')[0].rstrip('/')
    u = u.replace('https://', '').replace('http://', '').replace('www.', '')
    # Remove language folders
    u = re.sub(r'/(pt|en|es)/', '/', u)
    # Remove degree folders to reach the core slug
    u = re.sub(r'/(ctesp|licenciaturas|mestrados|doutoramentos|pos-graduacoes|cursos-tecnicos)/', '/', u)
    # Remove suffixes
    u = re.sub(r'-(pt|en|es)$', '', u)
    # Remove campus
    u = re.sub(r'/(lisboa|porto|centro-universitario-lisboa|centro-universitario-porto)/', '/', u)
    return u.strip('/')

def clean_num(v):
    """Robustly cleans strings with EU/US decimals and currency."""
    if v is None or v == "": return 0
    if isinstance(v, (int, float)): return v
    
    # Remove currency, %, spaces, thousands separators
    s = str(v).replace('€', '').replace('$', '').replace('%', '').replace(' ', '').replace('\xa0', '')
    
    # Handle European decimal: 1.234,56 or 644,02
    if ',' in s and '.' not in s:
        s = s.replace(',', '.')
    elif ',' in s and '.' in s:
        if s.find('.') < s.find(','): # dot is thousands (1.234,56)
            s = s.replace('.', '').replace(',', '.')
        else: # comma is thousands (1,234.56)
            s = s.replace(',', '')
            
    try:
        return float(s)
    except:
        return 0

def clean_ctr(v):
    """Ensures CTR is a sane percentage string."""
    try:
        val = clean_num(v)
        # If it's 0.17092 (decimal), it's 17.09%
        # If it's 17.09 (whole), it's 17.09%
        if val < 1.0 and val > 0:
            val = val * 100
        return f"{val:.2f}%"
    except:
        return "0.00%"

def main():
    print("Starting automated data fetch pipeline (v100 — Multi-Institution)...")
    
    # Load Credentials
    creds_json = os.environ.get('GCP_SERVICE_ACCOUNT_JSON')
    if not creds_json:
        print("Error: GCP_SERVICE_ACCOUNT_JSON environment variable not set.")
        return
    creds_dict = json.loads(creds_json)
    
    # All institution sheet IDs (add new ones here)
    INSTITUTION_SHEETS = {
        'Lusofona':  os.environ.get('GOOGLE_ADS_SHEET_ID'),
        'IPLUSO':    os.environ.get('GOOGLE_ADS_SHEET_ID_IPLUSO'),
        'ISMAT':     os.environ.get('GOOGLE_ADS_SHEET_ID_ISMAT'),
        'ISLA_Gaia': os.environ.get('GOOGLE_ADS_SHEET_ID_ISLA_GAIA'),
    }

    # 1. Load main courses.json
    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except Exception as e:
        print(f"Error loading {JSON_FILE_PATH}: {e}")
        return

    # 2. Load & merge Ads data from ALL institution sheets
    all_ads_records = []
    all_campaign_records = []

    for institution, sheet_id in INSTITUTION_SHEETS.items():
        if not sheet_id:
            print(f"[{institution}] No sheet ID configured — skipping.")
            continue
        print(f"[{institution}] Fetching from sheet: {sheet_id}")
        ads = load_ads_data(sheet_id, creds_dict)
        campaigns = load_campaign_data(sheet_id, creds_dict)
        if ads:
            all_ads_records.extend(ads)
            print(f"[{institution}] Loaded {len(ads)} keyword rows.")
        if campaigns:
            all_campaign_records.extend(campaigns)
            print(f"[{institution}] Loaded {len(campaigns)} campaign rows.")

    ads_records = all_ads_records
    campaign_records = all_campaign_records

    # 3. Save Campaigns File for Live Monitor
    if campaign_records:
        # Clean campaign data before saving
        cleaned_campaigns = []
        for c in campaign_records:
            cleaned_campaigns.append({
                'Campaign': c.get('Campaign', 'Unknown'),
                'Status': c.get('Status', 'UNKNOWN'),
                'Budget': clean_num(c.get('Budget', 0)),
                'Impressions': clean_num(c.get('Impressions', 0)),
                'Clicks': clean_num(c.get('Clicks', 0)),
                'Cost': clean_num(c.get('Cost', 0)),
                'Conversions': clean_num(c.get('Conversions', 0)),
                'CTR': clean_ctr(c.get('CTR', '0%')),
                'CostPerConv': clean_num(c.get('CostPerConv', 0))
            })
        with open(CAMPAIGNS_FILE_PATH, 'w', encoding='utf-8') as f:
            json.dump(cleaned_campaigns, f, indent=2, ensure_ascii=False)
        print(f"Generated {CAMPAIGNS_FILE_PATH} with {len(cleaned_campaigns)} rows.")

    # 2. Process Courses
    courses_updated_ads = 0
    
    # Pre-process Ads data into a map for speed
    ads_map = {}
    if ads_records:
        for row in ads_records:
            # Extract common column names
            url = str(row.get('Final URL', ''))
            url_clean = fuzzy_clean_url(url)
            
            term = str(row.get('Keyword', '')).strip()
            # Absolute Zero Deduplication: strict alphanumeric lowercase
            term_clean = "".join(c for c in term.lower() if c.isalnum() or c.isspace())
            term_clean = " ".join(term_clean.split())
            
            imps = clean_num(row.get('Impressions', 0))
            
            if url_clean and term_clean:
                if url_clean not in ads_map:
                    ads_map[url_clean] = {}
                
                # Keep only unique terms per URL (Overwrite mode: highest impressions wins)
                if term_clean not in ads_map[url_clean] or imps > ads_map[url_clean][term_clean]:
                    ads_map[url_clean][term_clean] = imps

    for item in data:
        if item.get('type') == 'metadata': continue
        
        url_clean = fuzzy_clean_url(item.get('url', ''))

        if url_clean in ads_map:
            # Convert map back to list for JSON
            keyword_list = [{'term': t, 'impressions': i} for t, i in ads_map[url_clean].items()]
            # Sort and Prune
            keyword_list.sort(key=lambda x: x.get('impressions', 0), reverse=True)
            item['adsKeywords'] = keyword_list[:100]
            courses_updated_ads += 1

    # 3. Update Metadata
    timestamp = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    metadata_updated = False
    for item in data:
        if item.get('type') == 'metadata':
            item['last_sync_by'] = "Nightly Pipeline (Ads + Campaigns)"
            item['last_sync_at'] = timestamp
            metadata_updated = True
            break
            
    if not metadata_updated:
        data.append({
            "type": "metadata",
            "last_sync_by": "Nightly Pipeline (Ads + Campaigns)",
            "last_sync_at": timestamp
        })

    # 4. Save Main DB
    with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Finished! Updated Ads for {courses_updated_ads} courses.")

if __name__ == '__main__':
    main()
