# PowerShell script to configure Azure App Service with Managed Identity and Key Vault access

param(
    [Parameter(Mandatory=$true)]
    [string]$ResourceGroup = "onbrdrp-devsand-wus-rg-1",
    
    [Parameter(Mandatory=$true)]
    [string]$AppServiceName = "onbrdrp-devsand-wus-app-1",
    
    [Parameter(Mandatory=$true)]
    [string]$KeyVaultName = "onbrdrp-devsand-wus-kv-1"
)

Write-Host "Configuring Azure App Service Managed Identity and Key Vault Access" -ForegroundColor Green

# Enable System Assigned Managed Identity for App Service
Write-Host "`nEnabling System Assigned Managed Identity for App Service..." -ForegroundColor Yellow
$identity = az webapp identity assign `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --query principalId `
    --output tsv

if ($identity) {
    Write-Host "Managed Identity enabled. Principal ID: $identity" -ForegroundColor Cyan
} else {
    Write-Host "Failed to enable Managed Identity" -ForegroundColor Red
    exit 1
}

# Grant the App Service managed identity access to Key Vault secrets
Write-Host "`nGranting App Service access to Key Vault secrets..." -ForegroundColor Yellow
try {
    az keyvault set-policy `
        --name $KeyVaultName `
        --object-id $identity `
        --secret-permissions get list `
        --query "properties.accessPolicies[-1].objectId" `
        --output tsv | Out-Null
    
    Write-Host "Successfully granted Key Vault access to App Service Managed Identity" -ForegroundColor Green
}
catch {
    Write-Host "Error granting Key Vault access: $_" -ForegroundColor Red
    Write-Host "You may need to run this script with Azure Key Vault Administrator or Owner permissions" -ForegroundColor Yellow
    exit 1
}

# Verify the configuration
Write-Host "`nVerifying configuration..." -ForegroundColor Yellow

# Check if App Service has managed identity
$appIdentity = az webapp identity show `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --query "principalId" `
    --output tsv

if ($appIdentity) {
    Write-Host "✓ App Service Managed Identity is enabled" -ForegroundColor Green
} else {
    Write-Host "✗ App Service Managed Identity is not enabled" -ForegroundColor Red
}

# Check Key Vault access policies
$accessPolicy = az keyvault show `
    --name $KeyVaultName `
    --query "properties.accessPolicies[?objectId=='$identity'].permissions.secrets" `
    --output tsv

if ($accessPolicy -and $accessPolicy.Contains("get")) {
    Write-Host "✓ Key Vault access policy is configured" -ForegroundColor Green
} else {
    Write-Host "✗ Key Vault access policy is not configured properly" -ForegroundColor Red
}

Write-Host "`nConfiguration Summary:" -ForegroundColor Cyan
Write-Host "- Resource Group: $ResourceGroup"
Write-Host "- App Service: $AppServiceName"
Write-Host "- Key Vault: $KeyVaultName"
Write-Host "- Managed Identity Principal ID: $identity"

Write-Host "`nNext Steps:" -ForegroundColor Green
Write-Host "1. Upload BigQuery service account key to Key Vault using upload-bigquery-key-to-keyvault.ps1"
Write-Host "2. Deploy application using deploy-to-azure.ps1"
Write-Host "3. Test the application at https://$AppServiceName.azurewebsites.net"