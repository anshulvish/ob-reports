# 🧪 User Testing Instructions

## Prerequisites
- ✅ .NET 8 SDK installed
- ✅ Node.js 18+ installed 
- ✅ BigQuery service account key at: `C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json`

## 🚀 Quick Start

### 1. Start Backend API
```bash
cd Backend
dotnet run
```
**Expected**: Server starts on `https://localhost:64547`
**Wait for**: "BigQuery initialization complete" message

### 2. Start Frontend (New Terminal)
```bash
cd frontend  
npm start
```
**Expected**: Opens browser to `http://localhost:3000`

## 🎯 What to Test

### ✅ Working Features
1. **Health Check**: Backend should connect to BigQuery automatically
2. **Date Range Picker**: Select dates from June 26, 2025 to August 24, 2025
3. **Engagement Analytics**: Live data for 1,700+ users
   - Total users, sessions, events
   - Engagement distribution (High/Medium/Low)
   - Session duration & screen views

### 🔍 Test Scenarios
1. **Load Dashboard**: Should show date picker and system status
2. **Select Date Range**: Try "Last 7 days" or custom range
3. **View Analytics**: Engagement panel should populate with real data
4. **Check System Status**: Green health indicators for API & BigQuery

## 🐛 Expected Issues
- ⚠️ **User Sessions**: May show error (known SQL issue, being fixed)
- ⚠️ **Charts**: Using simplified view (Chart.js integration pending)

## 📊 Sample Expected Data
- **Users**: ~1,731 total users
- **Date Range**: 2025-06-26 to 2025-08-24  
- **Tables**: 95 BigQuery tables (47 events, 47 users, 1 intraday)
- **Avg Session Duration**: ~48 minutes
- **Engagement Distribution**: ~214 High, 647 Medium, 870 Low

## 🆘 Troubleshooting

### Backend Won't Start
- Check BigQuery key path: `C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json`
- Verify .NET 8 SDK: `dotnet --version`

### Frontend Won't Start  
- Run: `npm install` in frontend directory
- Check Node version: `node --version` (should be 18+)

### No Data Loading
- Check network connection
- Verify BigQuery credentials are valid
- Look for errors in browser developer console

## 🔗 API Endpoints for Direct Testing
- Health: `https://localhost:64547/api/Health`
- BigQuery Test: `https://localhost:64547/api/test/TestBigQuery/test-connection` 
- Date Ranges: `https://localhost:64547/api/Analytics/date-ranges`
- Engagement Metrics: `POST https://localhost:64547/api/Engagement/metrics`

## 📈 Success Criteria
- ✅ Backend starts and connects to BigQuery
- ✅ Frontend loads without compilation errors
- ✅ Date picker shows available data range
- ✅ Engagement metrics display real analytics data
- ✅ System health shows all green status

---
*Last Updated: 2025-08-25 - Core functionality working, ready for testing*