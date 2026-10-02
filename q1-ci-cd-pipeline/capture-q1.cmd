@echo off
REM ============================================================
REM  Q1 SCREENSHOT HELPER
REM  Usage:  capture-q1.cmd local     -> Q1-01 and Q1-07
REM          capture-q1.cmd docker    -> Q1-05, Q1-06, Q1-09
REM
REM  Uses port 3100 because port 3000 is already taken on this PC.
REM ============================================================
setlocal
cd /d "%~dp0"
set APP_PORT=3100

if "%~1"=="" goto usage
if /i "%~1"=="local" goto local
if /i "%~1"=="docker" goto docker
goto usage

:usage
echo.
echo   Usage:
echo     capture-q1.cmd local     - build + test output, then start the API
echo     capture-q1.cmd docker    - build image, compose up, generate traffic
echo.
goto :eof

REM ------------------------------------------------------------
:local
echo.
echo ==========================================================
echo   STEP 1 of 2  -  BUILD + TEST   (screenshot this terminal)
echo ==========================================================
echo.
call npm install
call npm run verify
echo.
echo ==========================================================
echo   Press any key to start the API for screenshot Q1-07...
echo ==========================================================
pause >nul
start "" cmd /k "title Task API Q1-07 && set PORT=%APP_PORT% && npm start"
echo.
echo API starting. Wait 5 seconds, then open these in Chrome:
echo.
echo   http://localhost:%APP_PORT%/api/health    - screenshot this  (Q1-07)
echo   http://localhost:%APP_PORT%/api/tasks     - screenshot this  (Q1-07)
echo   http://localhost:%APP_PORT%/metrics       - screenshot this  (Q1-07)
echo.
echo Then close the API window when you are done.
echo.
pause
goto :eof

REM ------------------------------------------------------------
:docker
where docker >nul 2>&1
if errorlevel 1 (
  echo.
  echo   Docker is not installed or not in PATH.
  echo   Install Docker Desktop from https://www.docker.com/products/docker-desktop/
  echo   Then run this script again.
  echo.
  pause
  goto :eof
)

echo.
echo ==========================================================
echo   STEP 1 of 3  -  DOCKER BUILD   (screenshot this terminal)
echo ==========================================================
echo.
docker build -t task-api:1.0.0 .
echo.
pause

echo.
echo ==========================================================
echo   STEP 2 of 3  -  COMPOSE UP + PS   (screenshot this terminal)
echo ==========================================================
echo.
docker compose up -d --build
echo.
echo ----------- docker compose ps -----------
docker compose ps
echo.
pause

echo.
echo ==========================================================
echo   STEP 3 of 3  -  TRAFFIC, THEN SCREENSHOT DASHBOARDS
echo ==========================================================
echo.
echo Generating traffic so the Grafana graphs are not empty...
for /L %%i in (1,1,60) do (
  curl -s -o NUL http://localhost:%APP_PORT%/api/health
  curl -s -o NUL http://localhost:%APP_PORT%/api/tasks
  curl -s -o NUL -X POST http://localhost:%APP_PORT%/api/tasks -H "Content-Type: application/json" -d "{\"title\":\"Traffic %%i\"}"
  timeout /t 1 /nobreak >NUL
)

echo.
echo Wait 30 seconds so Prometheus scrapes a few times, then screenshot:
echo.
echo   http://localhost:%APP_PORT%/api/health    - Q1-07
echo   http://localhost:%APP_PORT%/metrics      - Q1-07
echo   http://localhost:9090/targets            - Q1-09  (target must show UP)
echo   http://localhost:3001                    - Q1-09  (login admin / admin123)
echo                                          dashboard: "Task API - Monitoring"
echo.
pause
goto :eof
