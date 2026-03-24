$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.l23446.bak.$timestamp"
Copy-Item $path $backup -Force

$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([System.IO.File]::ReadAllLines($path))

$index = 23445  # zero-based for visible line 23446
# pattern used below; keep escaped in -like and -replace
if ($lines[$index] -like "*dark:to-pink-900/5' }>*") {
  $lines[$index] = "  ? 'bg-gray-50 dark:bg-gray-900'    : 'bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 dark:from-gray-900 dark:via-purple-900/5 dark:to-pink-900/5' ``}>"
  [System.IO.File]::WriteAllLines($path, $lines)
  Write-Host "Rewrote line $($index+1) to include backtick. Backup at $backup"
} else {
  Write-Host "Line content did not match expected pattern. Nothing changed."
}