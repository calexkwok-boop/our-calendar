param([int]$After,[string]$Block)
$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.insertblk.bak.$timestamp"
Copy-Item $path $backup -Force

$all = New-Object System.Collections.Generic.List[string]
$all.AddRange([System.IO.File]::ReadAllLines($path))

$idx = $After
if ($idx -lt 0 -or $idx -gt $all.Count) { throw "Invalid insert index $After for file of $($all.Count) lines" }

# Normalize newlines and split to lines
$blockNormalized = $Block -replace '\r\n', "`n" -replace '\r', "`n"
$linesToInsert = $blockNormalized -split "`n"

$head = $all.GetRange(0, $idx)
$tail = $all.GetRange($idx, $all.Count - $idx)
$next = New-Object System.Collections.Generic.List[string]
$next.AddRange($head)
$next.AddRange([string[]]$linesToInsert)
$next.AddRange($tail)

[System.IO.File]::WriteAllLines($path, $next)
Write-Host "Inserted $($linesToInsert.Length) lines after $After. Backup at $backup"