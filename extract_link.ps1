$content = Get-Content 'src/App.js' -Raw
$idx = $content.IndexOf('const linkSelectedPhotosToEvent = async')
if ($idx -ge 0) {
  $start = [Math]::Max(0, $idx - 200)
  $end = [Math]::Min($content.Length, $idx + 1200)
  $len = $end - $start
  $snippet = $content.Substring($start, $len)
  Write-Output $snippet
} else { Write-Output 'not found' }
