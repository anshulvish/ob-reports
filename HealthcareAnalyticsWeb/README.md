# 📊 Aya Onboarding Analytics Web Application

## ✨ **Status: Production-Ready with Azure Deployment & Single-Domain Architecture**
- ✅ **Professional Dark Mode UI**: Complete shadcn/ui design system with dark mode default
- ✅ **Live BigQuery Integration**: 116 tables, 1,731 users analyzed with automatic error recovery
- ✅ **Azure Key Vault Integration**: Secure credential management for production
- ✅ **Single-Domain Serving**: Frontend served from .NET backend, eliminating CORS issues
- ✅ **Cross-Platform Support**: Automatic Windows/WSL path conversion
- ✅ **Full Engagement Analytics**: Real-time onboarding metrics with Chart.js visualizations
- ✅ **User Journey Search**: Search users, view session details and timelines  
- ✅ **Screen Flow Visualization**: Interactive React Flow diagrams for onboarding paths
- ✅ **Production Deployment**: Automated Azure App Service deployment with managed identity

## 🏗️ Architecture Overview

**Development**: Frontend and backend run separately for development convenience
**Production**: Single .NET server serves both React frontend and API endpoints

### Single-Domain Benefits
- ✅ No CORS configuration needed
- ✅ Simplified deployment to single Azure resource
- ✅ Unified authentication and session management
- ✅ Better performance with shared infrastructure

## 🚀 Quick Start Guide

### Prerequisites
- .NET 8 SDK installed
- Node.js 18+ and npm installed  
- BigQuery service account key at: `C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json`

### Option 1: Development Mode (Separate Servers)

**Step 1: Start the Backend API**
```bash
cd HealthcareAnalyticsWeb/Backend
dotnet run
```
**Step 2: Start the Frontend (in new terminal)**
```bash
cd HealthcareAnalyticsWeb/frontend
npm install  # if first time
npm start
```
- Backend API: http://localhost:9000/api/
- Frontend: http://localhost:3000

### Option 2: Production Mode (Single Server)

**Build and serve frontend from backend:**
```bash
# Build everything
./build-and-deploy.ps1

# Run single server (serves both frontend and API)
cd Backend
dotnet run
```
- **Full Application**: http://localhost:9000 (React frontend)
- **API Endpoints**: http://localhost:9000/api/ (REST API)
- **Swagger**: http://localhost:9000/swagger (development only)

## 🎨 **Modern Design System**

### Professional UI Components
- **shadcn/ui**: Accessible, headless React components
- **Tailwind CSS**: Utility-first styling with consistent design tokens
- **Clean Color Scheme**: Professional blues (#2563eb) replacing gradients
- **Responsive Design**: Mobile-first approach with modern layouts
- **TypeScript**: Full type safety with modern React patterns

### Design Principles
- ✅ **No Gradients**: Clean, flat design with professional color palette
- ✅ **Consistent Spacing**: Tailwind design tokens for uniform layouts  
- ✅ **Accessible**: WCAG compliant components with proper contrast
- ✅ **Modern Icons**: Lucide React icons throughout the interface
- ✅ **Card-Based Layout**: Clean shadows and borders for content organization

## 🎯 **All Features Complete & Working**

### 1. **Main Dashboard** (`http://localhost:3000`)
- ✅ **Date Range Picker**: Select from available data (June 26 - Aug 24, 2025)
- ✅ **Live Engagement Analytics**: Real-time metrics for 1,731 users with Chart.js visualizations
- ✅ **System Health Status**: BigQuery connection monitoring
- ✅ **Interactive Navigation**: Sidebar with all features accessible

### 2. **Engagement Analytics** (LIVE DATA with Charts!)
- **Total Users**: 1,731 analyzed users
- **Session Metrics**: 1.24 avg sessions/user, 48min avg duration
- **Event Tracking**: 19.4 avg events/user, 7+ unique events
- **Engagement Distribution**: Interactive doughnut chart showing High/Medium/Low users
- **Comparison Charts**: Bar charts comparing averages vs medians
- **Screen Analytics**: 6.8 avg screen views, 8.9 AIFP interactions

### 3. **User Journey Search** (`/user-journeys`)
- **Search Interface**: Find users by pseudo ID (partial matches supported)
- **Session Details**: View complete session information
- **Engagement Analysis**: Session duration, event counts, engagement levels
- **Timeline View**: Session start/end times with duration

### 4. **Screen Flow Visualization** (`/screen-flow`) 
- **Interactive Flow Diagram**: Drag-and-drop nodes powered by React Flow
- **Conversion Tracking**: Visual indicators for conversion rates between screens
- **Traffic Volume**: Line thickness represents user volume
- **Minimap Navigation**: Easy navigation for complex flows
- **Exit Rate Analysis**: Identify drop-off points in the user journey

### 5. **System Diagnostics** (`/diagnostics`)
- **Query Testing**: Execute custom BigQuery queries
- **Table Inspector**: View available tables and metadata
- **Performance Metrics**: Query execution times

## 🚀 Azure Production Deployment

### One-Time Setup

**1. Configure Azure Resources**
```powershell
./configure-azure-managed-identity.ps1
```
This sets up:
- System Managed Identity for App Service
- Key Vault access policies for BigQuery credentials

**2. Upload BigQuery Credentials**
```powershell
./upload-bigquery-key-to-keyvault.ps1
```
Uploads service account key to Azure Key Vault securely

### Deploy to Azure

```powershell
./deploy-to-azure.ps1
```

**Production URL**: https://onbrdrp-devsand-wus-app-1.azurewebsites.net

### Azure Architecture
- **App Service**: `onbrdrp-devsand-wus-app-1` (single resource for frontend + backend)
- **Key Vault**: `onbrdrp-devsand-wus-kv-1` (secure BigQuery credential storage)
- **Managed Identity**: App Service uses system identity to access Key Vault
- **Environment**: Production configuration with Key Vault integration

## 🔄 Cross-Platform Development

### Automatic Path Conversion
The application automatically detects and converts BigQuery service account key paths:

**Windows**: `C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json`
**WSL**: `/mnt/c/Anshul/Work/keys/onboarding-prod-dfa00-9a059d9f43b8.json`

No manual configuration needed - the app detects the environment and converts paths automatically.

### Environment-Specific Configuration
- **Development**: File-based BigQuery credentials with automatic path conversion
- **Production**: Azure Key Vault credentials with managed identity authentication
- **Error Recovery**: Automatic table refresh on BigQuery "Table not found" errors

## 📡 API Endpoints

**Health & Status:**
- `GET /api/Health` - System health
- `GET /api/BigQueryTables` - Table discovery info

**Analytics:**
- `GET /api/Analytics/date-ranges` - Available date ranges
- `POST /api/Analytics/query` - Execute analytics queries

**Engagement Analytics:**
- `POST /api/Engagement/metrics` - Detailed engagement metrics with automatic error recovery
- `POST /api/Engagement/user-sessions` - User session details
- `POST /api/Engagement/job-search-exposure` - Job search analytics

**Test Endpoints:**
- `GET /api/test/TestBigQuery/test-connection` - BigQuery connection status
- `GET /api/test/TestBigQuery/test-query` - Sample BigQuery test

### OpenAPI Documentation
- **Development**: http://localhost:9000/swagger
- **Production**: https://onbrdrp-devsand-wus-app-1.azurewebsites.net/swagger

## 🎯 Key Features to Test

### A. System Integration
1. **Backend Startup**: Verify BigQuery connection and table discovery
2. **Frontend Connection**: Dashboard should load without errors
3. **API Communication**: All endpoints respond correctly

### B. Date-Driven Analytics
1. **Date Range Selection**: 
   - Select "Last 7 days" or custom range
   - Should validate against available data (2025-06-26 to 2025-08-24)
2. **Query Execution**:
   - Try each query type (Sample, Engagement, User Journeys)
   - Results should show table metadata and row counts
   - Expandable tables show actual BigQuery data

### C. Data Visualization
1. **Real-time Results**: Data loads dynamically based on date selection
2. **Table Display**: Expandable rows with formatted data
3. **Query Metadata**: Shows which BigQuery tables were used

### D. Error Handling
1. **Invalid Date Ranges**: Should show appropriate error messages
2. **No Data Available**: Graceful handling when no tables exist for date range
3. **BigQuery Errors**: Structured error messages with details

## 📊 Expected Data

**Available Data Range**: June 26, 2025 - August 24, 2025
**Total Tables**: 95 (47 daily events, 1 intraday, 47 user tables)
**Sample Events**: `first_visit`, `session_start`, `page_view`, `aifp_screen_view`, `aifp_api_request`

## 🔧 Troubleshooting

### Development Issues
- **Port conflicts**: Backend runs on http://localhost:9000 by default
- **BigQuery errors**: Path conversion is automatic - check service account key exists
- **Build errors**: Run `npm install` in frontend directory

### Production Issues  
- **Deployment fails**: Verify Azure CLI authentication (`az login`)
- **Key Vault access**: Ensure managed identity has correct permissions
- **BigQuery connection**: Check Key Vault secret `bigquery-service-account-key` exists

### Common Issues
1. **"BigQuery client not available"**: 
   - Development: Check service account key file exists
   - Production: Verify Key Vault secret and managed identity permissions
2. **"Table not found" errors**: Application auto-refreshes table list and retries
3. **Frontend 404 errors**: Ensure `build-and-deploy.ps1` was run to copy React build
4. **CORS errors in development**: Backend configured for localhost:3000

### Environment Detection
The application automatically detects:
- **WSL vs Windows** environment for path conversion
- **Development vs Production** for credential source (file vs Key Vault)
- **Table availability** and refreshes on errors

## 🎉 Success Indicators

### Development
✅ **Backend Started**: Logs show "116 tables discovered"
✅ **Path Conversion**: Automatic Windows/WSL path detection working
✅ **Frontend Loads**: React app displays without errors
✅ **API Integration**: All endpoints respond correctly

### Production  
✅ **Azure Deployment**: App Service shows healthy status
✅ **Key Vault Integration**: BigQuery credentials loaded from Key Vault
✅ **Managed Identity**: App Service can access Key Vault secrets
✅ **Single Domain**: Both frontend and API serve from same URL

## 🚀 Deployment Summary

### Local Development
```bash
# Development mode (separate servers)
cd Backend && dotnet run           # API: localhost:9000/api/
cd frontend && npm start           # Frontend: localhost:3000

# Production mode (single server)  
./build-and-deploy.ps1            # Build React into Backend/wwwroot
cd Backend && dotnet run           # Full app: localhost:9000
```

### Azure Production
```powershell
./configure-azure-managed-identity.ps1   # One-time setup
./upload-bigquery-key-to-keyvault.ps1    # Upload credentials  
./deploy-to-azure.ps1                     # Deploy to Azure
```

**Result**: https://onbrdrp-devsand-wus-app-1.azurewebsites.net

---

*Happy testing! 🚀 Let me know what you discover!*