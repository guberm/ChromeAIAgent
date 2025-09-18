Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = "ChromeAiAgent-v2.3.3-Chrome-Web-Store.zip"
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
$entries = $zip.Entries | Where-Object { $_.FullName -ieq 'manifest.json' -or $_.FullName -ieq 'manifest-dev.json' }
foreach ($e in $entries) {
  Write-Output "FOUND: $($e.FullName)"
  $sr = New-Object System.IO.StreamReader($e.Open())
  Write-Output $sr.ReadToEnd()
  $sr.Close()
}
$zip.Dispose()
