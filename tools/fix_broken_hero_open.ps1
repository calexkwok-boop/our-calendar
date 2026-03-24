$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.fixopen.bak.$timestamp"
Copy-Item $path $backup -Force

$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([System.IO.File]::ReadAllLines($path))

# Find the broken opening div with unfinished template string
$targetIdx = -1
for ($i = 0; $i -lt $lines.Count; $i++) {
  if ($lines[$i] -like '*relative overflow-hidden rounded-3xl shadow-2xl p-4 sm:p-6 ${*') {
    # verify next line looks like the calendarView line
    if ($i + 1 -lt $lines.Count -and ($lines[$i+1].Trim() -eq "calendarView === 'agenda'")) {
      # and the following line starts the prefer block (broken placement)
      if ($i + 2 -lt $lines.Count -and $lines[$i+2].TrimStart().StartsWith('{preferCalendarHome && (')) {
        $targetIdx = $i
        break
      }
    }
  }
}

if ($targetIdx -lt 0) {
  Write-Host 'No broken hero opening found to fix. Nothing changed.'
  exit 0
}

# Build the three missing lines to complete the template literal and opening tag
$indent = ($lines[$targetIdx+1] -replace "[^\s].*$", '')  # indentation of the calendarView line
$insert = @(
  $indent + "? 'bg-gray-50 dark:bg-gray-900' ",
  $indent + ": 'bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 dark:from-gray-900 dark:via-purple-900/5 dark:to-pink-900/5'",
  ($indent.Substring(0, [Math]::Max(0, $indent.Length - 2))) + "`}>"
)

# Insert after the calendarView line (i+1), before the {preferCalendarHome && ( line
$insertPos = $targetIdx + 2
$tail = $lines.GetRange($insertPos, $lines.Count - $insertPos)
$head = $lines.GetRange(0, $insertPos)

$next = New-Object System.Collections.Generic.List[string]
$next.AddRange($head)
$next.AddRange([string[]]$insert)
$next.AddRange($tail)

[System.IO.File]::WriteAllLines($path, $next)
Write-Host "Fixed opening template near line $($targetIdx+1). Backup at $backup"