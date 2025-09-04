#!/bin/bash
# Bash script to build both frontend and backend

CONFIGURATION=${1:-Release}

echo -e "\033[32mBuilding Healthcare Analytics Web Application...\033[0m"

# Get the script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"

# Navigate to frontend directory
echo -e "\n\033[33mBuilding React Frontend...\033[0m"
cd "$SCRIPT_DIR/frontend"

# Install dependencies
echo "Installing frontend dependencies..."
npm install

# Build the React app
echo "Building React app for production..."
npm run build

# Clear the wwwroot folder in backend
echo -e "\n\033[33mClearing wwwroot folder...\033[0m"
WWWROOT_PATH="$SCRIPT_DIR/Backend/wwwroot"
if [ -d "$WWWROOT_PATH" ]; then
    rm -rf "$WWWROOT_PATH"/*
fi

# Copy build files to wwwroot
echo -e "\033[33mCopying build files to wwwroot...\033[0m"
cp -r "$SCRIPT_DIR/frontend/build/"* "$WWWROOT_PATH/"

# Navigate to backend directory
echo -e "\n\033[33mBuilding .NET Backend...\033[0m"
cd "$SCRIPT_DIR/Backend"

# Build the .NET app
echo "Building .NET application..."
~/.dotnet/dotnet restore || dotnet restore
~/.dotnet/dotnet build --configuration $CONFIGURATION || dotnet build --configuration $CONFIGURATION

echo -e "\n\033[32mBuild Complete!\033[0m"
echo "The application is ready to run or deploy."
echo "Frontend files are in: Backend/wwwroot"
echo "To run locally: cd Backend && dotnet run"