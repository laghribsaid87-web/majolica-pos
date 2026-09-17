@echo off
echo ========================================================
echo        ARRET DU ROBOT WHATSAPP EN ARRIERE-PLAN
echo ========================================================
echo.
echo Recherche du serveur en cours...
FOR /F "tokens=5" %%T IN ('netstat -a -n -o ^| findstr :3001') DO (
  echo Arret du processus PID %%T...
  taskkill /F /PID %%T
)
echo.
echo Le robot WhatsApp a ete arrete avec succes !
pause
