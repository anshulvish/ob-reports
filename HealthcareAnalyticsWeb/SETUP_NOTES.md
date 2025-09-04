# Setup Notes - Cross-Platform Development & Deployment

## 🚀 No More Manual Path Switching!

**BREAKTHROUGH**: The application now automatically detects and converts BigQuery credential paths between Windows and WSL environments. No more manual configuration changes needed!

### Automatic Path Conversion
The `BigQueryClientService` automatically detects the runtime environment and converts paths:

**Configuration (keep as Windows format):**
```json
{
  "BigQuery": {
    "ServiceAccountKeyPath": "C:\\Anshul\\Work\\keys\\onboarding-prod-dfa00-9a059d9f43b8.json"
  }
}
```

**Runtime Conversion:**
- **Windows**: Uses path as-is: `C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json`
- **WSL**: Auto-converts to: `/mnt/c/Anshul/Work/keys/onboarding-prod-dfa00-9a059d9f43b8.json`

## 🏗️ Architecture Modes

### Development Mode (Separate Servers)
```bash
# Terminal 1: Backend API
cd Backend
dotnet run              # Runs on http://localhost:9000

# Terminal 2: Frontend Development Server  
cd frontend
npm start               # Runs on http://localhost:3000
```

### Production Mode (Single Server)
```bash
# Build React app into Backend/wwwroot
./build-and-deploy.ps1

# Run unified server
cd Backend
dotnet run              # Serves both frontend and API on http://localhost:9000
```

## 🔄 Environment-Specific Behavior

### Development Environment
- **Credentials**: File-based with automatic path conversion
- **CORS**: Configured for cross-origin requests (localhost:3000 → localhost:9000)
- **Frontend**: Served from separate development server (Webpack dev server)
- **Hot Reload**: React hot reload for rapid development

### Production Environment  
- **Credentials**: Azure Key Vault with managed identity
- **CORS**: Not needed (same-origin requests)
- **Frontend**: Served from .NET server as static files
- **Optimization**: Minified, bundled React production build

## 🛠️ Build Scripts

### `build-and-deploy.ps1`
**Purpose**: Build React frontend and copy to Backend/wwwroot for single-server deployment

```powershell
# What it does:
1. npm install (frontend dependencies)
2. npm run build (create production React build)  
3. Copy build/* to Backend/wwwroot/
4. dotnet build (compile Backend)
```

### `build-and-deploy.sh` 
**Purpose**: Linux/WSL version of the build script

## 🔐 Credential Management

### Development
- **Source**: Local file system
- **Path**: Automatically converted between Windows/WSL formats
- **Security**: File-based (suitable for development only)

### Production
- **Source**: Azure Key Vault
- **Secret Name**: `bigquery-service-account-key`
- **Authentication**: System Managed Identity
- **Security**: Enterprise-grade secret management

## 🚀 Azure Deployment Scripts

### `configure-azure-managed-identity.ps1`
**Purpose**: One-time setup for Azure resources
```powershell
# What it configures:
- System Managed Identity for App Service
- Key Vault access policy for managed identity
- Verifies configuration
```

### `upload-bigquery-key-to-keyvault.ps1` 
**Purpose**: Upload BigQuery service account key to Azure Key Vault
```powershell
# What it uploads:
- Full JSON service account key as 'bigquery-service-account-key'
- Individual project ID as 'bigquery-project-id'
- Secure upload with proper descriptions
```

### `deploy-to-azure.ps1`
**Purpose**: Complete application deployment to Azure
```powershell
# What it does:
1. Build frontend and backend (calls build-and-deploy.ps1)
2. Create deployment package (dotnet publish)  
3. Upload to Azure App Service
4. Verify Key Vault secrets exist
5. Configure production environment variables
```

## 📍 Port Configuration

### Development Mode
- **Backend API**: http://localhost:9000/api/
- **Frontend**: http://localhost:3000
- **Swagger**: http://localhost:9000/swagger

### Production Mode (Local)
- **Full Application**: http://localhost:9000
- **API Endpoints**: http://localhost:9000/api/
- **Swagger**: http://localhost:9000/swagger (dev only)

### Azure Production
- **Full Application**: https://onbrdrp-devsand-wus-app-1.azurewebsites.net
- **API Endpoints**: https://onbrdrp-devsand-wus-app-1.azurewebsites.net/api/

## 🧪 Quick Test Commands

### Local Development
```bash
# Test backend health
curl http://localhost:9000/api/Health

# Test BigQuery connection  
curl http://localhost:9000/api/test/TestBigQuery/test-connection

# Test table discovery
curl http://localhost:9000/api/BigQueryTables
```

### Azure Production
```bash
# Test production deployment
curl https://onbrdrp-devsand-wus-app-1.azurewebsites.net/api/Health

# Test Key Vault integration
curl https://onbrdrp-devsand-wus-app-1.azurewebsites.net/api/test/TestBigQuery/test-connection
```

## 🔍 Error Recovery Features

### Automatic Table Refresh
- **Issue**: BigQuery table discovery can become stale overnight
- **Solution**: Automatic table list refresh on "Table not found" errors
- **Benefit**: Prevents overnight failures, self-healing architecture

### Cross-Platform Path Handling
- **Issue**: Different path formats between Windows and WSL
- **Solution**: Runtime environment detection and automatic path conversion
- **Benefit**: Same configuration works in both environments

## 🎯 Best Practices

### For Development
1. Keep `appsettings.Development.json` with Windows path format
2. Use development mode for rapid React development
3. Switch to production mode to test single-server deployment

### For Production  
1. Always run deployment scripts in order:
   - `configure-azure-managed-identity.ps1` (one-time)
   - `upload-bigquery-key-to-keyvault.ps1` (when credentials change)
   - `deploy-to-azure.ps1` (for each deployment)

2. Verify Key Vault permissions before deployment
3. Test locally in production mode before Azure deployment

---
*No more manual path switching! The application handles everything automatically. 🚀*