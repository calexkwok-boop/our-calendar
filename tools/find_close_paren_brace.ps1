param([int]$Start,[int]$Max=10000)
$path='src/App.js'
$lines=Get-Content $path
for($i=$Start-1; $i -lt [Math]::Min($lines.Length, $Start-1+$Max); $i++){
  if($lines[$i] -match '^\s*\)\}\s*$'){
    $num = $i+1
    Write-Output $num
    break
  }
}