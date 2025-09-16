# ChromeAI Agent v2.2.6 Release Notes

## 🚀 What's New in Version 2.2.6

### 🔧 Enhanced Build & Deployment Pipeline
- **Build Consistency**: Improved preservation of manual build edits across version updates
- **Packaging Optimization**: Enhanced `build-webstore.bat` with better exclusion filters
- **Automatic Zip Creation**: Streamlined Chrome Web Store package generation with `build.zip`
- **Clean File Structure**: Removed development artifacts from Web Store packages

### 🛠️ Development & Infrastructure Improvements
- **Pipeline Stability**: Eliminated cyclic copy issues in build script using `robocopy`
- **Exclusion Filters**: Comprehensive filtering of unnecessary files (.github, *.zip, *.bat, original_*, etc.)
- **Tag Versioning**: Improved strategy for handling remote tag conflicts
- **Source-Build Sync**: Maintained parity between source and runtime build directories

### 📦 Packaging Enhancements
- **Robocopy Integration**: Replaced `xcopy` with `robocopy` for more reliable file operations
- **PowerShell Compression**: Automated `build.zip` creation using `Compress-Archive`
- **Cleaner Builds**: Removed repository artifacts and development files from final packages
- **Size Optimization**: Reduced package size by excluding unnecessary files

## 🔄 Changes from v2.2.5

### Build System
- Updated `build-webstore.bat` to use `robocopy` instead of `xcopy`
- Added comprehensive file exclusion patterns
- Implemented automatic zip creation for Chrome Web Store uploads
- Fixed cyclic copy issues that could corrupt builds

### Version Management
- Enhanced tag strategy to handle remote conflicts
- Improved commit messaging with conventional format
- Better preservation of manual edits during version updates

### Documentation
- Updated README.md with version 2.2.6 badge
- Added comprehensive "What's New" sections
- Enhanced Chrome Web Store listing with latest features

## 🛡️ Quality & Stability
- **Zero Breaking Changes**: All existing functionality preserved
- **Backward Compatibility**: Maintains compatibility with previous settings and data
- **Tested Builds**: Verified package integrity and installation process
- **Clean Deployments**: Streamlined deployment process for both GitHub and Chrome Web Store

## 📋 Technical Details

### Modified Files
- `manifest.json` → Version bump to 2.2.6
- `build/manifest.json` → Version bump to 2.2.6
- `README.md` → Updated version badge and added v2.2.6 changelog
- `CHROME_STORE_LISTING.md` → Added v2.2.6 "What's New" section
- `build-webstore.bat` → Enhanced with robocopy and auto-zip functionality

### Build Process
1. Version updated in both source and build manifests
2. Documentation updated with new features and improvements
3. Enhanced packaging script tested and verified
4. Clean build.zip generated for Chrome Web Store
5. Git tag created and pushed to GitHub

## 🎯 Next Steps

### For Users
- Update to v2.2.6 through Chrome Web Store when available
- Enjoy improved build consistency and stability
- No action required - all existing settings preserved

### For Developers
- Use improved `build-webstore.bat` for clean package generation
- Leverage enhanced exclusion filters for cleaner builds
- Follow new tag versioning strategy for conflict resolution

## 📊 Statistics
- **Files Changed**: 5 core files
- **Package Size**: Optimized through better exclusions
- **Build Time**: Improved with robocopy efficiency
- **Compatibility**: 100% backward compatible

---

**Download**: Available on Chrome Web Store and GitHub Releases
**Support**: Report issues on [GitHub Issues](https://github.com/guberm/ChromeAI-Agent/issues)
**Documentation**: Full setup guide in [README.md](README.md)