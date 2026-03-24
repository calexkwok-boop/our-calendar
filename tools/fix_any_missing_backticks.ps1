$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.fixbt2.bak.$timestamp"
Copy-Item $path $backup -Force

$content = [System.IO.File]::ReadAllText($path)
$pattern = "'\s*}>"
$replacement = "' `}>"
$new = [System.Text.RegularExpressions.Regex]::Replace($content, $pattern, $replacement, [System.Text.RegularExpressions.RegexOptions]::Singleline, 1)
[System.IO.File]::WriteAllText($path, $new)
Write-Host "Applied backtick insertion on first match. Backup at $backup"