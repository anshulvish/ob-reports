# PowerShell script to build both frontend and backend

param(
    [Parameter(Mandatory=$false)]
    [string]$Configuration = "Release"
)

Write-Host "Building Healthcare Analytics Web Application..." -ForegroundColor Green

# Navigate to frontend directory
Write-Host "`nBuilding React Frontend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot/frontend"

# Install dependencies
Write-Host "Installing frontend dependencies..."
npm install

# Build the React app
Write-Host "Building React app for production..."
npm run build

# Clear the wwwroot folder in backend
Write-Host "`nClearing wwwroot folder..." -ForegroundColor Yellow
$wwwrootPath = "$PSScriptRoot/Backend/wwwroot"
if (Test-Path $wwwrootPath) {
    Remove-Item "$wwwrootPath/*" -Recurse -Force -ErrorAction SilentlyContinue
}

# Copy build files to wwwroot
Write-Host "Copying build files to wwwroot..." -ForegroundColor Yellow
Copy-Item "$PSScriptRoot/frontend/build/*" -Destination $wwwrootPath -Recurse -Force

# Navigate to backend directory
Write-Host "`nBuilding .NET Backend..." -ForegroundColor Yellow
Set-Location "$PSScriptRoot/Backend"

# Build the .NET app
Write-Host "Building .NET application..."
dotnet restore
dotnet build --configuration $Configuration

Write-Host "`nBuild Complete!" -ForegroundColor Green
Write-Host "The application is ready to run or deploy."
Write-Host "Frontend files are in: Backend/wwwroot"
Write-Host "To run locally: cd Backend && dotnet run"