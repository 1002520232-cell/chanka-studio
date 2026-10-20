@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo Iniciando Chanka Studio en http://localhost:8000 ...
start "" "http://localhost:8000"
where py >nul 2>nul
if %ERRORLEVEL% EQU 0 (
  py -m http.server 8000
) else (
  python -m http.server 8000
)
pause
