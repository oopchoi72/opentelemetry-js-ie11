@echo off
echo Stopping any running Node.js processes...
taskkill /f /im node.exe 2>nul

echo Starting server on port 8080...
node start-server.js

pause 