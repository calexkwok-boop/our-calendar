param([int]$After,[string[]]$Lines)
$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.insert.bak.$timestamp"
Copy-Item $path $backup -Force

$all = New-Object System.Collections.Generic.List[string]
$all.AddRange([System.IO.File]::ReadAllLines($path))

$idx = $After  # 1-based 'After' -> we will insert starting at this index (1-based)
if ($idx -lt 0 -or $idx -gt $all.Count) { throw "Invalid insert index $After for file of $($all.Count) lines" }

$head = $all.GetRange(0, $idx)
$tail = $all.GetRange($idx, $all.Count - $idx)
$next = New-Object System.Collections.Generic.List[string]
$next.AddRange($head)
$next.AddRange([string[]]$Lines)
$next.AddRange($tail)

[System.IO.File]::WriteAllLines($path, $next)
Write-Host "Inserted $($Lines.Length) lines after $After. Backup at $backup"