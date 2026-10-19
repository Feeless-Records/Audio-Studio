@echo off
setlocal
cd /d "%~dp0"
start "" "http://localhost:8080"
py -3 server.py
if errorlevel 1 (
  echo Python 3 is needed to run the local WebGPU server.
  pause
)
