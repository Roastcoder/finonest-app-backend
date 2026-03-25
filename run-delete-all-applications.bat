@echo off
echo.
echo ========================================
echo   DELETE ALL LOAN APPLICATIONS
echo ========================================
echo.
echo WARNING: This will permanently delete ALL loan applications!
echo.
echo This includes:
echo - All loan records
echo - All commission data
echo - All payout records
echo - All insurance policies
echo - All related data
echo.
echo THIS ACTION CANNOT BE UNDONE!
echo.
echo Press any key to continue or close this window to cancel...
pause > nul

echo.
echo Running deletion script...
node delete-all-applications.js

echo.
echo Script completed. Press any key to exit.
pause > nul