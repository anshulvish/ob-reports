@echo off
echo Building Aya Healthcare Analytics Backend...
cd Backend
dotnet restore
dotnet build --configuration Release --verbosity normal
if %errorlevel% equ 0 (
    echo Backend build successful!
) else (
    echo Backend build failed!
    exit /b %errorlevel%
)

echo.
echo Building Frontend...
cd ../frontend
call npm install
call npm run build
if %errorlevel% equ 0 (
    echo Frontend build successful!
    echo.
    echo All builds completed successfully!
) else (
    echo Frontend build failed!
    exit /b %errorlevel%
)