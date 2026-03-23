$matches = Select-String -Path 'src/App.js' -Pattern 'const onAddPhoto' -Context 5,80
foreach ($match in $matches) {
  $pre = ($match.Context.PreContext -join "`n")
  $post = ($match.Context.PostContext -join "`n")
  Write-Output $pre
  Write-Output $match.Line
  Write-Output $post
}
