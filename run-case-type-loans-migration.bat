@echo off
echo Running case_type migration for loans table...
echo.

node add-case-type-to-loans.js

echo.
echo Migration completed. Press any key to exit.
pause > nul