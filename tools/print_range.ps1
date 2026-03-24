param([int]$Start,[int]$End)
$path='src/App.js'
$lines = Get-Content $path
for($i=$Start;$i -le $End;$i++){
  $text = $lines[$i-1]
  $num = $i.ToString().PadLeft(6)
  Write-Output ("$num | $text")
}