# PowerShell script to deploy to Azure App Service with Key Vault integration

param(
    [Parameter(Mandatory=$false)]
    [string]$ResourceGroup = "onbrdrp-devsand-wus-rg-1",
    
    [Parameter(Mandatory=$false)]
    [string]$AppServiceName = "onbrdrp-devsand-wus-app-1",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyVaultName = "onbrdrp-devsand-wus-kv-1"
)

Write-Host "Deploying to Azure App Service: $AppServiceName" -ForegroundColor Green

# First, build the application
Write-Host "`nBuilding application..." -ForegroundColor Yellow
& "$PSScriptRoot\build-and-deploy.ps1" -Configuration Release

# Navigate to Backend directory
Set-Location "$PSScriptRoot/Backend"

# Create deployment package
Write-Host "`nCreating deployment package..." -ForegroundColor Yellow
$publishFolder = "bin/Release/net8.0/publish"
dotnet publish --configuration Release --output $publishFolder

# Create zip file for deployment
if (Get-Command "Compress-Archive" -ErrorAction SilentlyContinue) {
    Compress-Archive -Path "$publishFolder\*" -DestinationPath "$publishFolder.zip" -Force
} else {
    # Fallback for older PowerShell versions
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [System.IO.Compression.ZipFile]::CreateFromDirectory($publishFolder, "$publishFolder.zip", "Optimal", $false)
}

# Deploy to Azure
Write-Host "`nDeploying to Azure..." -ForegroundColor Yellow
az webapp deployment source config-zip `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --src "$publishFolder.zip"

# Verify BigQuery key is in Key Vault
Write-Host "`nVerifying BigQuery credentials in Key Vault..." -ForegroundColor Yellow
$keyExists = az keyvault secret show `
    --vault-name $KeyVaultName `
    --name "bigquery-service-account-key" `
    --query "id" `
    --output tsv 2>$null

if ($keyExists) {
    Write-Host "✓ BigQuery service account key found in Key Vault" -ForegroundColor Green
} else {
    Write-Host "⚠ BigQuery service account key not found in Key Vault" -ForegroundColor Yellow
    Write-Host "Run upload-bigquery-key-to-keyvault.ps1 to upload the key" -ForegroundColor Yellow
}

# Set environment variables
Write-Host "`nSetting environment variables..." -ForegroundColor Yellow
az webapp config appsettings set `
    --resource-group $ResourceGroup `
    --name $AppServiceName `
    --settings ASPNETCORE_ENVIRONMENT=Production

Write-Host "`nDeployment Complete!" -ForegroundColor Green
Write-Host "Application URL: https://$AppServiceName.azurewebsites.net"

Write-Host "`nDeployment Summary:" -ForegroundColor Cyan
Write-Host "- App Service: $AppServiceName"
Write-Host "- Key Vault: $KeyVaultName" 
Write-Host "- Environment: Production"
Write-Host "- BigQuery: Using Key Vault credentials"

Write-Host "`nPost-Deployment Checklist:" -ForegroundColor Yellow
Write-Host "□ Verify App Service has System Managed Identity enabled"
Write-Host "□ Confirm Key Vault access policy grants secret read permissions"
Write-Host "□ Test BigQuery connectivity at https://$AppServiceName.azurewebsites.net/api/test/testbigquery/test-connection"
Write-Host "□ Check application logs for any startup errors"