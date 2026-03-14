@echo off
echo Running landmark migration for leads table...
echo.

node add-landmark-to-leads.js

echo.
echo Migration completed. Press any key to exit.
pause > nul