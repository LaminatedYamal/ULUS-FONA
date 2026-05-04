import os
import json
import datetime
import gspread
from google.oauth2 import service_account
from googleapiclient.discovery import build

# Configuration
JSON_FILE_PATH = 'courses.json'
GSC_SCOPES = ['https://www.googleapis.com/auth/webmasters.readonly']
SHEETS_SCOPES = ['https://www.googleapis.com/auth/spreadsheets.readonly']
DAYS_TO_FETCH = 30
MAX_ROWS_PER_URL = 200
GOOGLE_ADS_SHEET_ID = os.environ.get('GOOGLE_ADS_SHEET_ID', '1W6_6SRLDHSOVF0IR1RsRUxEkERn2ursuQAFyjcSNJUE')

def get_creds_dict():
    creds_json = os.environ.get('GCP_SERVICE_ACCOUNT_JSON')
    if not creds_json:
        raise ValueError("GCP_SERVICE_ACCOUNT_JSON environment variable is not set!")
    return json.loads(creds_json)

def get_gsc_service(creds_dict):
    """Authenticates and returns the GSC service object."""
    credentials = service_account.Credentials.from_service_account_info(
        creds_dict, scopes=GSC_SCOPES
    )
    return build('searchconsole', 'v1', credentials=credentials)

def fetch_gsc_data(service, site_url):
    """Fetches keyword data for a specific site URL over the last 30 days."""
    end_date = datetime.date.today()
    start_date = end_date - datetime.timedelta(days=DAYS_TO_FETCH)
    
    request = {
        'startDate': start_date.strftime('%Y-%m-%d'),
        'endDate': end_date.strftime('%Y-%m-%d'),
        'dimensions': ['query'],
        'rowLimit': MAX_ROWS_PER_URL
    }
    
    try:
        response = service.searchanalytics().query(siteUrl=site_url, body=request).execute()
        
        keywords = []
        if 'rows' in response:
            for row in response['rows']:
                term = row['keys'][0]
                clicks = int(row.get('clicks', 0))
                if clicks > 0:
                    keywords.append({'term': term, 'clicks': clicks})
        
        keywords.sort(key=lambda x: x['clicks'], reverse=True)
        return keywords
    except Exception as e:
        print(f"Error fetching GSC data for {site_url}: {str(e)}")
        return None

def fetch_ads_data(creds_dict, sheet_id):
    """Fetches Ads keyword data from the Google Sheet bridge."""
    if not sheet_id:
        print("No GOOGLE_ADS_SHEET_ID provided. Skipping Ads data fetch.")
        return None
        
    try:
        credentials = service_account.Credentials.from_service_account_info(
            creds_dict, scopes=SHEETS_SCOPES
        )
        gc = gspread.authorize(credentials)
        sheet = gc.open_by_key(sheet_id).sheet1
        records = sheet.get_all_records()
        print(f"Successfully loaded {len(records)} active ad keywords from Sheets.")
        return records
    except Exception as e:
        print(f"Error fetching Ads data from Sheets: {str(e)}")
        return None

def main():
    print("Starting automated data fetch pipeline...")
    
    try:
        with open(JSON_FILE_PATH, 'r', encoding='utf-8') as f:
            data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {JSON_FILE_PATH} not found.")
        return
        
    try:
        creds_dict = get_creds_dict()
        gsc_service = get_gsc_service(creds_dict)
        print("Successfully authenticated with Google Cloud.")
    except Exception as e:
        print(f"Authentication failed: {str(e)}")
        return

    # Fetch global ads data from Sheet
    ads_records = fetch_ads_data(creds_dict, GOOGLE_ADS_SHEET_ID)

    courses_updated_gsc = 0
    courses_updated_ads = 0

    for item in data:
        if item.get('type') == 'metadata':
            continue
            
        course_name = item.get('name', '')
        url = item.get('url')
        
        # 1. Update GSC
        if url:
            print(f"Querying GSC for: {url}")
            new_gsc_data = fetch_gsc_data(gsc_service, url)
            if new_gsc_data is not None:
                item['gscKeywords'] = new_gsc_data
                courses_updated_gsc += 1

        # 2. Update Ads from Sheet
        if ads_records and course_name:
            course_name_lower = course_name.lower()
            keyword_map = {}
            
            for row in ads_records:
                campaign = str(row.get('Campaign Name', '')).lower()
                adgroup = str(row.get('Ad Group Name', '')).lower()
                
                # Match logic: if the course name is inside the Campaign or Ad Group name
                if course_name_lower in campaign or course_name_lower in adgroup:
                    term = str(row.get('Keyword', '')).strip()
                    imps = int(row.get('Impressions', 0))
                    if term:
                        keyword_map[term] = keyword_map.get(term, 0) + imps
            
            if keyword_map:
                course_ads = [{'term': k, 'impressions': v} for k, v in keyword_map.items()]
                course_ads.sort(key=lambda x: x['impressions'], reverse=True)
                item['adsKeywords'] = course_ads
                courses_updated_ads += 1

    # Update Metadata
    timestamp = datetime.datetime.now().strftime("%d/%m/%Y, %H:%M:%S")
    metadata_updated = False
    for item in data:
        if item.get('type') == 'metadata':
            item['last_sync_by'] = "Nightly Pipeline (GSC + Ads)"
            item['last_sync_at'] = timestamp
            metadata_updated = True
            break
            
    if not metadata_updated:
        data.append({
            "type": "metadata",
            "last_sync_by": "Nightly Pipeline (GSC + Ads)",
            "last_sync_at": timestamp
        })

    with open(JSON_FILE_PATH, 'w', encoding='utf-8') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
        
    print(f"Finished! Updated GSC for {courses_updated_gsc} courses, Ads for {courses_updated_ads} courses.")

if __name__ == '__main__':
    main()
