@echo off
echo.
echo ========================================
echo   DELETE TEST LOAN APPLICATIONS
echo ========================================
echo.
echo This will delete ONLY test/demo applications:
echo - Loan numbers starting with "CL-" or "TEST-"
echo - Applicant names containing "test" or "demo"
echo.
echo Production data will be preserved.
echo.
echo Press any key to continue or close this window to cancel...
pause > nul

echo.
echo Running deletion script...
node delete-test-applications.js

echo.
echo Script completed. Press any key to exit.
pause > nul