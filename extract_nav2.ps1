$content = Get-Content 'src/App.js' -Raw
$idx = $content.IndexOf('className="flex rounded-2xl bg-white/60 p-1')
if ($idx -ge 0) {
  $start = $idx
  $end = [Math]::Min($content.Length, $idx + 4000)
  $snippet = $content.Substring($start, $end - $start)
  Write-Output $snippet
} else { Write-Output 'not found' }
