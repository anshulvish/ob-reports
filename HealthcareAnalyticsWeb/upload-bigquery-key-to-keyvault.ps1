# PowerShell script to upload BigQuery service account key to Azure Key Vault

param(
    [Parameter(Mandatory=$true)]
    [string]$KeyFilePath = "C:\Anshul\Work\keys\onboarding-prod-dfa00-9a059d9f43b8.json",
    
    [Parameter(Mandatory=$false)]
    [string]$KeyVaultName = "onbrdrp-devsand-wus-kv-1",
    
    [Parameter(Mandatory=$false)]
    [string]$SecretName = "bigquery-service-account-key"
)

Write-Host "Uploading BigQuery service account key to Key Vault: $KeyVaultName" -ForegroundColor Green

# Check if file exists
if (-not (Test-Path $KeyFilePath)) {
    Write-Host "Error: Service account key file not found at $KeyFilePath" -ForegroundColor Red
    exit 1
}

# Read the JSON file content
Write-Host "Reading service account key file..." -ForegroundColor Yellow
$keyContent = Get-Content $KeyFilePath -Raw

# Convert to secure string for Key Vault
$secureKeyContent = ConvertTo-SecureString -String $keyContent -AsPlainText -Force

# Upload to Key Vault
Write-Host "Uploading to Key Vault as secret '$SecretName'..." -ForegroundColor Yellow
try {
    az keyvault secret set `
        --vault-name $KeyVaultName `
        --name $SecretName `
        --value $keyContent `
        --description "BigQuery service account JSON key for onboarding analytics"
    
    Write-Host "Successfully uploaded key to Key Vault!" -ForegroundColor Green
    Write-Host "Secret name: $SecretName" -ForegroundColor Cyan
}
catch {
    Write-Host "Error uploading to Key Vault: $_" -ForegroundColor Red
    exit 1
}

# Also upload individual values for flexibility
Write-Host "`nExtracting and uploading individual key components..." -ForegroundColor Yellow
$keyJson = Get-Content $KeyFilePath | ConvertFrom-Json

# Upload project ID separately
az keyvault secret set `
    --vault-name $KeyVaultName `
    --name "bigquery-project-id" `
    --value $keyJson.project_id `
    --description "BigQuery project ID" | Out-Null

Write-Host "Uploaded project ID: $($keyJson.project_id)" -ForegroundColor Gray

Write-Host "`nKey Vault configuration complete!" -ForegroundColor Green