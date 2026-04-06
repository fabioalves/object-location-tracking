@echo off
REM Create the utils directory for the fuzzy search feature
mkdir "C:\projects\object-location-tracking\utils"
echo.
echo Directory creation status:
if exist "C:\projects\object-location-tracking\utils" (
    echo ✓ utils directory successfully created
    echo.
    echo Directory contents:
    dir "C:\projects\object-location-tracking\utils"
) else (
    echo ✗ Failed to create utils directory
)
