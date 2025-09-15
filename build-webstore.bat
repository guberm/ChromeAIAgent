@echo off
setlocal enabledelayedexpansion
echo Creating Chrome Web Store package...

REM Clean build directory
if exist build (
	rmdir /s /q build
)
mkdir build

REM Copy all files except excluded (dev/test/docs)
xcopy /E /I /Y * build\ /EXCLUDE:build-exclude.txt >nul

echo.
echo Package created in 'build' directory
echo Ready for Chrome Web Store upload!
echo.
echo Files included:
dir build /b

pause
