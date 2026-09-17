Set WshShell = CreateObject("WScript.Shell")
WshShell.Run "cmd /c cd /d ""C:\Users\pc\Desktop\Majolica-POS\server"" && node index.js", 0, False
