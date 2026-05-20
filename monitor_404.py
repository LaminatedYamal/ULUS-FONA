import os
import json
import requests
import datetime
import time

# Configuration
URLS_FILE = 'urls.txt'
SPECIAL_URLS_FILE = 'special_urls.txt'
RESULTS_DIR = '404-board'

def get_institution(url):
    u = url.lower()
    if "ulusofona.pt/lisboa" in u: return "Lusófona Lisboa"
    if "ulusofona.pt/porto" in u: return "Lusófona Porto"
    if "ipluso.pt" in u: return "IPLUSO"
    if "islagaia.pt" in u: return "ISLA Gaia"
    if "ismat.pt" in u: return "ISMAT"
    return "Outros"

def check_urls(input_file, results_file_base):
    print(f"Checking {input_file}...")
    if not os.path.exists(input_file):
        print(f"File {input_file} not found.")
        return

    with open(input_file, 'r', encoding='utf-8') as f:
        urls = [line.strip() for line in f if line.strip() and not line.startswith('#')]

    results_json_path = os.path.join(RESULTS_DIR, f"{results_file_base}.json")
    results_js_path = os.path.join(RESULTS_DIR, f"{results_file_base}.js")

    old_results = []
    if os.path.exists(results_json_path):
        try:
            with open(results_json_path, 'r', encoding='utf-8') as f:
                old_results = json.load(f)
        except: pass

    new_results = []
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AntigravityMonitor/1.0'}

    for url in urls:
        print(f"  -> {url} ", end='', flush=True)
        status = "Down"
        code = 0
        message = "Unknown"
        
        try:
            resp = requests.get(url, headers=headers, timeout=15, allow_redirects=True)
            code = resp.status_code
            status = "OK" if 200 <= code < 400 else "Error"
            message = f"HTTP {code}"
        except Exception as e:
            message = str(e)

        # Downtime Logic
        old_record = next((r for r in old_results if r['Url'] == url), None)
        first_down_date = ""
        consecutive_days_down = 0

        if status != "OK":
            if old_record and old_record.get('FirstDownDate'):
                first_down_date = old_record['FirstDownDate']
                try:
                    delta = datetime.date.today() - datetime.datetime.strptime(first_down_date, "%Y-%m-%d").date()
                    consecutive_days_down = delta.days + 1
                except: consecutive_days_down = 1
            else:
                first_down_date = datetime.date.today().strftime("%Y-%m-%d")
                consecutive_days_down = 1
        
        # Course name extraction
        course_name = url.split('/')[-1].replace('-', ' ').title() if '/' in url else url

        new_results.append({
            "Url": url,
            "Course": course_name,
            "Institution": get_institution(url),
            "StatusCode": code,
            "Status": status,
            "Message": message,
            "LastChecked": datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "FirstDownDate": first_down_date,
            "ConsecutiveDaysDown": consecutive_days_down
        })
        print(f"[{status}] ({consecutive_days_down} days)")

    # Save JSON
    with open(results_json_path, 'w', encoding='utf-8') as f:
        json.dump(new_results, f, indent=4, ensure_ascii=False)

    # Save JS (For dashboard bypassing CORS)
    timestamp = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    js_content = f"console.log('Telemetry Sync: {timestamp}'); window.telemetryData = {json.dumps(new_results, ensure_ascii=False)};"
    with open(results_js_path, 'w', encoding='utf-8') as f:
        f.write(js_content)

def main():
    if not os.path.exists(RESULTS_DIR):
        os.makedirs(RESULTS_DIR)
        
    check_urls(URLS_FILE, 'results')
    check_urls(SPECIAL_URLS_FILE, 'results_special')

if __name__ == "__main__":
    main()
