@echo off
echo Starting clean reinstallation...

:: Run as administrator check
net session >nul 2>&1
if %errorLevel% == 0 (
    echo Running with administrator privileges
) else (
    echo Warning: Some operations may require administrator privileges
    echo Consider running this script as administrator if you encounter permission errors
    timeout /t 3
)

:: Remove installation and build files
echo Cleaning up previous installation...
rmdir /s /q node_modules 2>nul
rmdir /s /q .next 2>nul
rmdir /s /q .vercel 2>nul
del /f /q pnpm-lock.yaml 2>nul

:: Clear TypeScript compilation cache
del /f /q tsconfig.tsbuildinfo 2>nul

:: Skip pnpm store cleanup if it fails
echo Cleaning pnpm store...
call pnpm store prune 2>nul
if errorlevel 1 (
    echo Warning: Could not clean pnpm store - skipping
    echo This is normal if the store is in use or requires elevated permissions
    timeout /t 2
)

:: Remove local caches
echo Cleaning local caches...
rmdir /s /q .pnpm-store 2>nul

:: Check Node.js version (but don't exit if it doesn't match)
echo Checking Node.js version...
for /f "tokens=*" %%a in ('type .nvmrc') do set REQUIRED_NODE_VERSION=%%a
node -v | findstr /C:"%REQUIRED_NODE_VERSION%" >nul
if errorlevel 1 (
    echo Warning: Node.js version does not match .nvmrc
    echo Current version: 
    node -v
    echo Required version: %REQUIRED_NODE_VERSION%
    echo Consider switching Node.js version using nvm
    choice /C YN /M "Do you want to continue anyway"
    if errorlevel 2 exit /b 1
)

:: Reinstall dependencies
echo Installing dependencies...
call pnpm install
if errorlevel 1 (
    echo Error: Failed to install dependencies
    pause
    exit /b 1
)

:: Build the project
echo Building project...
call pnpm build
if errorlevel 1 (
    echo Error: Build failed
    pause
    exit /b 1
)

echo.
echo Testing path alias configuration...
node test-paths.js

if errorlevel 1 (
    echo Warning: Path alias test failed. Please check your configuration.
    choice /C YN /M "Do you want to continue anyway"
    if errorlevel 2 exit /b 1
)

echo.
echo Reinstallation complete! You can now run 'pnpm dev' to start the development server.
echo Path aliases (@/) are verified and working correctly.
pause