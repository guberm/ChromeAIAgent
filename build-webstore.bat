@echo off
echo Creating Chrome Web Store package...

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