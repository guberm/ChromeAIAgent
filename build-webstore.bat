@echo off
setlocal enabledelayedexpansion
echo Creating Chrome Web Store package...

REM Clean build directory
if exist build (
	rmdir /s /q build
)
mkdir build

REM Use robocopy to avoid cyclic copy issues and honor excludes
REM Exclude directories: build, .git
REM Exclude files: patterns from build-exclude.txt (mirrored below)
robocopy . build /E /NFL /NDL /NJH /NJS /NC /NS ^
	/XD build .git .github node_modules ^
	/XF build-exclude.txt build-webstore.bat launch-chrome.bat LICENSE *.md *.zip *.bat *.ps1 *.cmd manifest-dev.json test-*.html original_* package-lock.json yarn.lock pnpm-lock.yaml >nul

if %ERRORLEVEL% GEQ 8 (
	echo robocopy reported an error. Code: %ERRORLEVEL%
	exit /b %ERRORLEVEL%
)

echo.
echo Package created in 'build' directory

REM Create build.zip for Chrome Web Store upload
if exist build.zip del /f /q build.zip
powershell -NoLogo -NoProfile -Command "Compress-Archive -Path 'build/*' -DestinationPath 'build.zip' -Force" 

if exist build.zip (
	echo Created build.zip
) else (
	echo WARNING: build.zip was not created
)

echo Ready for Chrome Web Store upload!
echo.
echo Files included (build/):
dir build /b

pause
