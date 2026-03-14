@echo off
REM Migration script to populate landmark in loans table

echo.
echo ========================================
echo Landmark Population Migration
echo ========================================
echo.

REM Check if we're in the backend directory
if not exist "src\config\database.js" (
    echo Error: Please run this script from the finonest-app-backend directory
    echo Current directory: %cd%
    pause
    exit /b 1
)

echo Starting migration...
echo.

REM Run the migration script
node populate-landmark.js

if %errorlevel% equ 0 (
    echo.
    echo ========================================
    echo Migration completed successfully!
    echo ========================================
    echo.
    echo Next steps:
    echo 1. Refresh your browser (Ctrl+R or Cmd+R)
    echo 2. Go to Loans ^& Loans ^> Loan Apps
    echo 3. Open a loan detail
    echo 4. Check if Landmark now shows values
    echo.
) else (
    echo.
    echo ========================================
    echo Migration failed!
    echo ========================================
    echo.
    echo Please check the error messages above
    echo.
)

pause
