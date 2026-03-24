param([int]$Start,[int]$End)
$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.removerange.bak.$timestamp"
Copy-Item $path $backup -Force

if ($Start -lt 1 -or $End -lt $Start) { throw 'Invalid range' }
$all = [System.Collections.Generic.List[string]]::new()
$all.AddRange([System.IO.File]::ReadAllLines($path))
$startIdx = $Start - 1
$endIdx = $End - 1
if ($endIdx -ge $all.Count) { throw "End exceeds file length ($($all.Count))" }

$head = $all.GetRange(0, $startIdx)
$tail = $all.GetRange($endIdx+1, $all.Count - ($endIdx+1))
$next = New-Object System.Collections.Generic.List[string]
$next.AddRange($head)
$next.AddRange($tail)
[System.IO.File]::WriteAllLines($path, $next)
Write-Host "Removed lines $Start..$End. Backup at $backup"