@echo off
echo ========================================================
echo Starting TowingHero Development Server...
echo ========================================================

:: Check if uv is installed
where uv >nul 2>nul
if %ERRORLEVEL% EQU 0 (
    echo [INFO] uv package manager found. Starting server using uv...
    uv run flask run --debug --host=0.0.0.0 --port=5000
    goto end
)

:: Fallback to standard python venv
echo [INFO] uv not found. Checking Python virtual environment...

if not exist .venv (
    echo [INFO] Creating virtual environment (.venv)...
    python -m venv .venv
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to create virtual environment. Make sure Python is installed and in your PATH.
        pause
        exit /b 1
    )
    echo [INFO] Virtual environment created. Installing dependencies...
    call .venv\Scripts\activate.bat
    python -m pip install --upgrade pip
    pip install -r requirements.txt
) else (
    call .venv\Scripts\activate.bat
)

echo [INFO] Starting Flask server...
flask run --debug --host=0.0.0.0 --port=5000

:end
pause
