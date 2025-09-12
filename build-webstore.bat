@echo off
echo Creating Chrome Web Store package...

REM Create build directory
if exist build rmdir /s /q build
mkdir build

REM Copy essential extension files
copy manifest.json build\
copy background.js build\
copy sidepanel.html build\
copy popup.html build\
copy popup.js build\
copy mcp-provider-interface.js build\

REM Copy directories
xcopy /E /I /Y css build\css\
xcopy /E /I /Y js build\js\
xcopy /E /I /Y icons build\icons\

echo.
echo Package created in 'build' directory
echo Ready for Chrome Web Store upload!
echo.
echo Files included:
dir build /b

pauseating Chrome Web Store package...

REM Create build directory
if exist build rmdir /s /q build
mkdir build

REM Copy all files except development files
xcopy /E /I /Y * build\ /EXCLUDE:build-exclude.txt

REM Remove localhost permissions from manifest (already done in main manifest.json)
echo.
echo Package created in 'build' directory
echo Ready for Chrome Web Store upload!
echo.
echo Files included:
dir build /b

pause