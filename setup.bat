@echo off
echo ========================================
echo  AgriHandshake - Full Setup Script
echo ========================================
echo.

echo [1/3] Installing root dependencies (Hardhat)...
call npm install
echo.

echo [2/3] Installing backend dependencies...
cd backend
call npm install
cd ..
echo.

echo [3/3] Installing frontend dependencies...
cd frontend
call npm install
cd ..
echo.

echo ========================================
echo  Setup Complete! To run the project:
echo  1. npx hardhat node              (Terminal 1)
echo  2. npx hardhat run scripts/deploy.js --network localhost  (Terminal 2)
echo  3. cd backend ^&^& node server.js  (Terminal 3)
echo  4. cd frontend ^&^& npm start      (Terminal 4)
echo ========================================
pause
