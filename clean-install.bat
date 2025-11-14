@echo off
echo Starting clean reinstall...

:: Clean up
echo Removing node_modules and build files...
rmdir /s /q node_modules 2>nul
rmdir /s /q .next 2>nul
del /f /q pnpm-lock.yaml 2>nul

:: Install
echo Installing dependencies...
call pnpm install

:: Build
echo Building project...
call pnpm build

echo.
echo Installation complete! You can now run 'pnpm dev'
pause