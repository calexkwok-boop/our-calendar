$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.fixbt.bak.$timestamp"
Copy-Item $path $backup -Force

$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([System.IO.File]::ReadAllLines($path))

$pattern = "dark:to-pink-900/5' }>"
$replaced = $false
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i].Contains($pattern)) {
    $lines[$i] = $lines[$i].Replace($pattern, "dark:to-pink-900/5' `}>")
    $replaced = $true
    break
  }
}

if ($replaced) {
  [System.IO.File]::WriteAllLines($path, $lines)
  Write-Host "Inserted missing backtick before }>. Backup at $backup"
} else {
  Write-Host "Target pattern not found. Nothing changed."
}