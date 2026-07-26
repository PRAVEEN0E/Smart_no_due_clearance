@echo off
echo ========================================
echo Smart No Due Clearance - Setup Script
echo ========================================
echo.
echo Step 1: Installing server dependencies...
cd server
call npm install
echo.
echo Step 2: Setting up environment...
if not exist .env (
    copy .env.example .env
    echo Created .env from .env.example
)
echo.
echo Step 3: Generating Prisma client...
call npx prisma generate
echo.
echo Step 4: Installing client dependencies...
cd ..\client
call npm install
echo.
echo Done! Run 'npm start' from the root to launch.
