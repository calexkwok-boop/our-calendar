$content = Get-Content 'src/App.js' -Raw
$idx = $content.IndexOf('<TripRatingSystem')
if ($idx -ge 0) {
  $start = [Math]::Max(0, $idx - 500)
  $end = [Math]::Min($content.Length, $idx + 1500)
  $len = $end - $start
  $snippet = $content.Substring($start, $len)
  Write-Output $snippet
} else { Write-Output 'not found' }
