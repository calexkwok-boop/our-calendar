$ErrorActionPreference = 'Stop'
$path = 'src/App.js'
$timestamp = Get-Date -Format yyyyMMddHHmmss
$backup = "src/App.js.fullwrap.bak.$timestamp"
Copy-Item $path $backup -Force

$lines = [System.Collections.Generic.List[string]]::new()
$lines.AddRange([System.IO.File]::ReadAllLines($path))

# 1) Find the simple wrapper line to replace
$targetIdx = -1
for($i=0;$i -lt $lines.Count;$i++){
  if($lines[$i] -like '*className*calendarView === ''agenda''*rounded-2xl shadow-xl*${bottomNavTab !== ''home'' ? ''hidden'' : ''''}*'){ $targetIdx = $i; break }
}
if($targetIdx -lt 0){ Write-Host 'Simple wrapper line not found; aborting.'; exit 0 }

# 2) Replace it with multi-line full wrapper opening
$indent = ($lines[$targetIdx] -replace "[^\s].*$", '')
$open1 = $indent + '<div className="${bottomNavTab !== ''home'' ? ''hidden'' : ''''} relative overflow-hidden rounded-3xl shadow-2xl p-4 sm:p-6 ${'
$open2 = $indent + '  calendarView === ''agenda'' '
$open3 = $indent + '  ? ''bg-gray-50 dark:bg-gray-900''  : ''bg-gradient-to-br from-white via-purple-50/20 to-pink-50/20 dark:from-gray-900 dark:via-purple-900/5 dark:to-pink-900/5'' `}>'

$lines[$targetIdx] = $open1
$lines.Insert($targetIdx+1, $open2)
$lines.Insert($targetIdx+2, $open3)

# 3) Clean up any previously inserted broken decorative lines nearby (best-effort)
for($j=$targetIdx+1; $j -le [Math]::Min($targetIdx+10, $lines.Count-1); $j++){
  if($lines[$j] -match 'Decorative blur element' -or $lines[$j] -match 'absolute top-0 right-0 w-64 h-64 bg-gradient-to-br'){
    # remove up to 3 lines related to accidental insert block
    for($m=0;$m -lt 3;$m++){ if($j -lt $lines.Count){ $lines.RemoveAt($j) } }
    break
  }
}

# 4) Insert full block decorative and inner z-10 right after opening
$insertAt = $targetIdx+3
$block = @(
  $indent + '  {/* Decorative blur element */}',
  $indent + '  {calendarView !== ''agenda'' && (',
  $indent + '    <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-purple-200/20 to-pink-200/20 dark:from-purple-800/10 dark:to-pink-800/10 rounded-full blur-3xl pointer-events-none" />',
  $indent + '  )}',
  $indent + '  <div className="relative z-10">'
)
for($k=$block.Length-1; $k -ge 0; $k--){ $lines.Insert($insertAt, $block[$k]) }

# 5) Find the "Active sub-calendar banner" comment and insert a closing </div> above it, to close the inner z-10
$bannerIdx = -1
for($i=$insertAt; $i -lt $lines.Count; $i++){
  if($lines[$i] -match 'Active sub-calendar banner'){ $bannerIdx = $i; break }
}
if($bannerIdx -gt 0){
  $lines.Insert($bannerIdx, $indent + '  </div>')
}

[System.IO.File]::WriteAllLines($path, $lines)
Write-Host "Applied full wrapper block. Backup at $backup"