@echo off
echo 🚀 AI Chatbot Platform - Docker Deployment
echo ========================================

echo.
echo 📋 Checking prerequisites...

REM Check if Docker is installed
docker --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker is not installed or not in PATH
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    pause
    exit /b 1
)

REM Check if Docker Compose is available
docker-compose --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Docker Compose is not available
    echo Please ensure Docker Desktop is running
    pause
    exit /b 1
)

echo ✅ Docker is available

echo.
echo 🏗️  Building and starting services...

REM Build and start with docker-compose
docker-compose up -d --build

if %errorlevel% neq 0 (
    echo ❌ Failed to start services
    pause
    exit /b 1
)

echo.
echo ✅ Services started successfully!

echo.
echo 🌐 Application URLs:
echo    Frontend: http://localhost:80
echo    Backend:  http://localhost:5000
echo    Health:   http://localhost:5000/health

echo.
echo 📊 To view logs: docker-compose logs -f
echo 🛑 To stop:      docker-compose down

echo.
echo 🧪 Running basic tests...
node test-docker.js

echo.
echo 🎉 Deployment complete!
pause
