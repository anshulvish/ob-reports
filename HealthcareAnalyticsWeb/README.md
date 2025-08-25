# 📊 Aya Onboarding Analytics Web Application

## ✨ **Status: Complete Modern Design System & Ready for Production!**
- ✅ **Professional Dark Mode UI**: Complete shadcn/ui design system with dark mode default
- ✅ **Live BigQuery Integration**: 95 tables, 1,731 users analyzed
- ✅ **Full Engagement Analytics**: Real-time onboarding metrics with Chart.js visualizations
- ✅ **User Journey Search**: Search users, view session details and timelines  
- ✅ **Screen Flow Visualization**: Interactive React Flow diagrams for onboarding paths
- ✅ **Complete Navigation**: Professional dark mode sidebar with theme toggle
- ✅ **Modern Tech Stack**: Tailwind CSS, TypeScript, React 18, Dark Mode
- ✅ **Production Ready**: Clean build with optimized bundle (232KB)

## 🚀 Quick Start Guide

### Prerequisites
- .NET 8 SDK installed
- Node.js 18+ and npm installed  
- BigQuery service account key at: `C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json`

### ⚠️ Important Setup Note
The BigQuery credentials are configured for **Windows execution**. The application automatically detects data from **2025-06-26 to 2025-08-24** with 95 tables discovered.

### Step 1: Start the Backend API

```bash
cd HealthcareAnalyticsWeb/Backend
dotnet run
```

**Expected Output:**
```
[INFO] Starting Aya Onboarding Analytics Web Application
[INFO] BigQuery initialization complete. Found 95 tables
[INFO] Event data available from 2025-06-26 to 2025-08-24
```

The API will be available at: `https://localhost:64547`

### Step 2: Start the Frontend

```bash
cd HealthcareAnalyticsWeb/frontend
npm install  # if first time
npm start
```

The frontend will be available at: `http://localhost:3000`

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

## 📡 API Endpoints (Backend Testing)

**Health & Status:**
- `GET https://localhost:64547/api/Health` - System health
- `GET https://localhost:64547/api/BigQueryTables` - Table discovery info

**Analytics:**
- `GET https://localhost:64547/api/Analytics/date-ranges` - Available date ranges
- `POST https://localhost:64547/api/Analytics/query` - Execute analytics queries

**✅ Engagement (ALL FIXED & WORKING!):**
- `POST https://localhost:64547/api/Engagement/metrics` - ✅ **LIVE** detailed engagement metrics  
- `POST https://localhost:64547/api/Engagement/user-sessions` - ✅ **FIXED** user session details

**Test Data:**
- `GET https://localhost:64547/api/test/TestBigQuery/test-connection` - BigQuery status
- `GET https://localhost:64547/api/test/TestBigQuery/test-query?date=2025-08-24` - Sample query

### 4. OpenAPI Documentation
Visit `https://localhost:64547/swagger` for interactive API documentation

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

### Backend Issues
- **Port conflicts**: Backend runs on https://localhost:64547 by default
- **BigQuery errors**: Check service account key path in appsettings.Development.json
- **WSL path issues**: Ensure key path uses `/mnt/c/` format

### Frontend Issues  
- **CORS errors**: Backend already configured for localhost:3000
- **API connection**: Check that backend is running on correct port
- **Build errors**: Run `npm install` to ensure dependencies are current

### Common Issues
1. **"BigQuery client not available"**: Restart backend, check service account key
2. **"No data available for date range"**: Use dates within 2025-06-26 to 2025-08-24
3. **Loading indefinitely**: Check browser console for API errors

## 🎉 Success Indicators

✅ **Backend Started**: Logs show "95 tables discovered"
✅ **Frontend Loads**: Dashboard displays without errors  
✅ **Date Picker Works**: Shows available range and validates selection
✅ **Queries Execute**: Returns real BigQuery data with table metadata
✅ **Data Displays**: Expandable tables show formatted results
✅ **Type Safety**: No TypeScript errors in browser console

## 📞 Next Steps

After testing the current features, you can:
1. **Explore the data**: Try different date ranges and query types
2. **Check engagement metrics**: Test the new engagement analytics endpoints
3. **Review visualizations**: See how BigQuery data is presented
4. **Plan next features**: User journey flow diagrams and screen analysis

---

*Happy testing! 🚀 Let me know what you discover!*