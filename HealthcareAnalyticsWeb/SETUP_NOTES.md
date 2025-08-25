# Setup Notes - Environment Switching

## BigQuery Credentials Path Configuration

### When running in WSL (Claude Code environment):
```json
{
  "BigQuery": {
    "ServiceAccountKeyPath": "/mnt/c/Anshul/Work/keys/onboarding-prod-dfa00-9a059d9f43b8.json"
  }
}
```

### When running in Windows (User testing):
```json
{
  "BigQuery": {
    "ServiceAccountKeyPath": "C:\\Anshul\\Work\\keys\\onboarding-prod-dfa00-9a059d9f43b8.json"
  }
}
```

## Quick Switch Commands

### For User Testing (Windows):
```bash
# Update appsettings.Development.json
cd HealthcareAnalyticsWeb/Backend
# Change path from /mnt/c/Anshul/Work/keys/... to C:\Anshul\Work\keys\...
```

### Back to WSL Development:
```bash
# Update appsettings.Development.json  
cd HealthcareAnalyticsWeb/Backend
# Change path from C:\Anshul\Work\keys\... to /mnt/c/Anshul/Work/keys/...
```

## Port Configuration
- **Backend**: https://localhost:64547 (default with `dotnet run`)
- **Frontend**: http://localhost:3000 (default with `npm start`)
- **CORS**: Already configured for localhost:3000

## Key File Location
- **Windows Path**: `C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json`
- **WSL Mount Path**: `/mnt/c/Anshul/Work/keys/onboarding-prod-dfa00-9a059d9f43b8.json`

## Quick Test Commands

### Test BigQuery Connection:
```bash
curl -k "https://localhost:64547/api/test/TestBigQuery/test-connection"
```

### Test Date Ranges:
```bash
curl -k "https://localhost:64547/api/Analytics/date-ranges"
```

## Environment Detection
The application should automatically detect the environment, but manual path updates may be needed when switching between WSL and Windows execution contexts.

---
*Remember: Always update the ServiceAccountKeyPath when switching between WSL development and Windows user testing!*