import requests
import json
import urllib3
from datetime import datetime

# Disable SSL warnings for local testing
urllib3.disable_warnings(urllib3.exceptions.InsecureRequestWarning)

def test_job_search_exposure():
    url = "http://localhost:9000/api/engagement/job-search-exposure"
    
    payload = {
        "startDate": "2025-08-20",
        "endDate": "2025-08-25"
    }
    
    print("Testing Job Search Exposure API...")
    print(f"URL: {url}")
    print(f"Payload: {json.dumps(payload, indent=2)}")
    
    try:
        response = requests.post(
            url,
            json=payload,
            verify=False,  # Skip SSL verification for localhost
            headers={"Content-Type": "application/json"}
        )
        
        print(f"\nStatus Code: {response.status_code}")
        
        if response.status_code == 200:
            data = response.json()
            print("\nAPI Response:")
            print(json.dumps(data, indent=2))
            
            # Analyze the results
            if "analysis" in data and data["analysis"]:
                print("\n=== ANALYSIS SUMMARY ===")
                for item in data["analysis"]:
                    print(f"\nEndpoint/Path: {item.get('endpoint', 'N/A')} / {item.get('path', 'N/A')}")
                    print(f"Total Responses: {item.get('total_responses', 0)}")
                    print(f"Unique Users: {item.get('unique_users', 0)}")
                    print(f"Is Step 4 Submit: {item.get('is_step_4_submit', 'No')}")
                    print(f"Contains 'searchresult': {item.get('contains_searchresult', 0)}")
                    print(f"Contains 'job': {item.get('contains_job', 0)}")
                    print(f"Response Sample: {item.get('response_sample', 'N/A')}")
                    print("-" * 50)
        else:
            print(f"\nError Response:")
            print(response.text)
            
    except Exception as e:
        print(f"\nError occurred: {str(e)}")

if __name__ == "__main__":
    test_job_search_exposure()