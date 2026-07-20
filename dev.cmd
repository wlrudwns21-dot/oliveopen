@echo off
rem 개발 서버 실행 스크립트 — Node가 PATH에 없으면 포터블 Node를 사용
set "PORTABLE_NODE=C:\Users\owner\AppData\Local\Temp\oo-node\node-v20.18.1-win-x64"
where node >nul 2>nul || set "PATH=%PORTABLE_NODE%;%PATH%"
cd /d "%~dp0"
npm run dev
