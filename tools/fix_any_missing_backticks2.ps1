$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.fixbt3.bak.$timestamp"
Copy-Item $path $backup -Force

$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([System.IO.File]::ReadAllLines($path))

for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -match "'\s*}>$") {
    $lines[$i] = $lines[$i] -replace "'\s*}>$", "' `}>"
    break
  }
}

[System.IO.File]::WriteAllLines($path, $lines)
Write-Host "Applied line-based backtick insertion on first matching line. Backup at $backup"