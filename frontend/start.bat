@echo off
echo Starting Art In Glass - Expo React Native App
echo.

:: Set environment variables to bypass OneDrive issues
set EXPO_NO_TELEMETRY=1
set EXPO_OFFLINE=true
set EXPO_CACHE=%TEMP%\expo-cache

:: Create temp cache directory
if not exist "%EXPO_CACHE%" mkdir "%EXPO_CACHE%"

echo.
echo Starting Expo with cache at: %EXPO_CACHE%
echo.

:: Start Expo
npx expo start --clear

pause