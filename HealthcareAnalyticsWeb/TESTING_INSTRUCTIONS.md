# 🧪 Complete Testing Guide - Local & Azure

## Prerequisites
- ✅ .NET 8 SDK installed
- ✅ Node.js 18+ installed 
- ✅ BigQuery service account key at: `C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json`
- ✅ Azure CLI installed (for Azure deployment testing)

## 🚀 Testing Modes

### Mode 1: Development Testing (Separate Servers)

**Perfect for**: Frontend development, API debugging, rapid iteration

#### Start Backend API
```bash
cd Backend
dotnet run
```
**Expected**: 
- Server starts on `http://localhost:9000`
- Logs show "BigQuery initialization complete. Found 116 tables"
- Automatic path conversion: Windows path → WSL path (if in WSL)

#### Start Frontend (New Terminal)
```bash
cd frontend  
npm install  # if first time
npm start
```
**Expected**: 
- Opens browser to `http://localhost:3000`
- React development server with hot reload

**Test URLs:**
- Frontend: http://localhost:3000
- Backend API: http://localhost:9000/api/Health
- Swagger: http://localhost:9000/swagger

### Mode 2: Production Testing (Single Server)

**Perfect for**: Deployment validation, CORS testing, production simulation

#### Build and Run Single Server
```bash
# Build React app and copy to Backend
./build-and-deploy.ps1

# Run unified server
cd Backend
dotnet run
```

**Expected**:
- Single server on `http://localhost:9000`
- Frontend served from Backend/wwwroot
- No CORS issues (same-origin)

**Test URLs:**
- Full Application: http://localhost:9000 (React frontend)
- API Endpoints: http://localhost:9000/api/Health
- Swagger: http://localhost:9000/swagger

### Mode 3: Azure Production Testing

**Perfect for**: End-to-end production validation, Key Vault testing

#### Deploy to Azure
```powershell
# One-time setup
./configure-azure-managed-identity.ps1
./upload-bigquery-key-to-keyvault.ps1

# Deploy application  
./deploy-to-azure.ps1
```

**Test URLs:**
- Production App: https://onbrdrp-devsand-wus-app-1.azurewebsites.net
- Health Check: https://onbrdrp-devsand-wus-app-1.azurewebsites.net/api/Health
- BigQuery Test: https://onbrdrp-devsand-wus-app-1.azurewebsites.net/api/test/TestBigQuery/test-connection

## 🎯 Comprehensive Test Scenarios

### 1. System Integration Tests
**Goal**: Verify all components work together

#### Backend Startup
- ✅ **Automatic Path Conversion**: WSL converts Windows paths automatically
- ✅ **BigQuery Connection**: Should connect without manual path changes
- ✅ **Table Discovery**: Logs should show "Found 116 tables"
- ✅ **Error Recovery**: Automatic retry on "Table not found" errors

#### Frontend Integration  
- ✅ **Development Mode**: React dev server connects to Backend API
- ✅ **Production Mode**: Frontend served from Backend with no CORS issues
- ✅ **API Communication**: All endpoints respond correctly

### 2. Feature Functionality Tests
**Goal**: Validate all analytics features work with real data

#### Dashboard Features
1. **Date Range Picker**: 
   - Shows available data (2025-06-26 to 2025-09-04)
   - Validates selected ranges
   - Updates analytics when changed

2. **Engagement Analytics**:
   - Total Users: ~1,731 users
   - Session Metrics: ~1.24 avg sessions/user
   - Event Tracking: ~19.4 avg events/user
   - Interactive charts with real BigQuery data

3. **User Journey Search**:
   - Search by pseudo user ID
   - Display session details and timelines
   - Show engagement levels and metrics

4. **Screen Flow Visualization**:
   - Interactive flow diagrams with React Flow
   - Conversion rates between screens
   - Drop-off point identification

### 3. Environment-Specific Tests
**Goal**: Ensure proper behavior in different environments

#### Development Environment
- ✅ **File-based Credentials**: Uses local service account key
- ✅ **Path Conversion**: Automatic Windows ↔ WSL conversion
- ✅ **Hot Reload**: React development server features
- ✅ **CORS Handling**: Cross-origin requests work correctly

#### Production Environment
- ✅ **Key Vault Integration**: Loads credentials from Azure Key Vault
- ✅ **Managed Identity**: App Service authenticates to Key Vault
- ✅ **Single Domain**: No CORS issues, unified serving
- ✅ **Error Handling**: Graceful fallbacks and logging

### 4. Error Recovery Tests
**Goal**: Validate self-healing capabilities

#### BigQuery Error Handling
1. **Table Not Found**: 
   - Trigger: Query non-existent table
   - Expected: Automatic table refresh and retry
   - Result: Query succeeds after refresh

2. **Stale Table Cache**:
   - Trigger: Query with outdated table list
   - Expected: Background refresh, user sees success
   - Result: Prevents overnight failures

#### Credential Management
1. **Development**: Missing file should show clear error
2. **Production**: Key Vault access issues should be logged clearly

## 🔍 API Testing Commands

### Local Development (Mode 1 & 2)
```bash
# System Health
curl http://localhost:9000/api/Health

# BigQuery Connection
curl http://localhost:9000/api/test/TestBigQuery/test-connection

# Table Discovery  
curl http://localhost:9000/api/BigQueryTables

# Date Ranges
curl http://localhost:9000/api/Analytics/date-ranges

# Engagement Analytics (POST request)
curl -X POST http://localhost:9000/api/Engagement/metrics \
  -H "Content-Type: application/json" \
  -d '{"startDate":"2025-08-01","endDate":"2025-08-24"}'
```

### Azure Production (Mode 3)
```bash
# System Health
curl https://onbrdrp-devsand-wus-app-1.azurewebsites.net/api/Health

# BigQuery with Key Vault
curl https://onbrdrp-devsand-wus-app-1.azurewebsites.net/api/test/TestBigQuery/test-connection

# Verify Managed Identity
curl https://onbrdrp-devsand-wus-app-1.azurewebsites.net/api/BigQueryTables
```

## 🆘 Troubleshooting Guide

### Development Issues
| Problem | Solution |
|---------|----------|
| "BigQuery client not available" | Check if service account key file exists |
| "Port already in use" | Kill existing dotnet processes |
| Frontend won't connect to API | Verify backend is running on localhost:9000 |
| Path not found errors | Service automatically converts Windows ↔ WSL paths |

### Production Issues  
| Problem | Solution |
|---------|----------|
| Azure deployment fails | Check Azure CLI authentication: `az login` |
| Key Vault access denied | Verify managed identity permissions |
| BigQuery connection fails | Check Key Vault secret exists and is valid |
| Frontend shows 404 | Ensure `build-and-deploy.ps1` was run |

### Performance Issues
| Problem | Solution |
|---------|----------|
| Slow BigQuery queries | Check date range scope, large ranges take longer |
| Frontend loading slowly | Verify production build was created |
| API timeouts | Check BigQuery table refresh status |

## 📊 Expected Test Data

### Current Dataset (as of 2025-09-04)
- **Total Tables**: 116 BigQuery tables
- **Users**: 1,731 analyzed users
- **Date Range**: 2025-06-26 to 2025-09-04
- **Latest Data**: events_intraday_20250904, pseudonymous_users_20250902

### Sample Metrics
- **Avg Session Duration**: ~48 minutes
- **Avg Events per User**: ~19.4 events
- **Engagement Distribution**: 
  - High: ~214 users (12%)
  - Medium: ~647 users (37%) 
  - Low: ~870 users (50%)

## ✅ Success Criteria

### Development Mode Success
- ✅ Backend starts and discovers 116+ tables
- ✅ Automatic path conversion works (no manual changes needed)
- ✅ Frontend connects to backend API successfully
- ✅ Date picker shows June 2025 to current date
- ✅ All analytics queries return real data

### Production Mode Success  
- ✅ Single server serves both frontend and API
- ✅ No CORS errors in browser console
- ✅ Build process copies React files to wwwroot
- ✅ All API endpoints accessible under same domain

### Azure Production Success
- ✅ App Service shows healthy status
- ✅ Key Vault integration loads BigQuery credentials
- ✅ Managed identity authentication works
- ✅ Public URL serves complete application
- ✅ Production logs show no authentication errors

## 🎯 Test Checklist

### Pre-Deployment Testing
- [ ] Mode 1 (Development): Frontend + Backend work separately
- [ ] Mode 2 (Production): Single server serves both successfully
- [ ] All API endpoints return expected data
- [ ] Date range validation works correctly
- [ ] Error handling displays user-friendly messages

### Post-Deployment Testing
- [ ] Azure deployment completes successfully
- [ ] Production URL loads without errors
- [ ] Key Vault credentials are retrieved correctly
- [ ] BigQuery queries execute in production environment
- [ ] Application performance meets expectations

---
*Updated: 2025-09-04 - Complete testing guide for all deployment modes and environments*