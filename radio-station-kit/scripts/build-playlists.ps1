param(
  [string]$MediaRoot
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KitRoot = Split-Path -Parent $ScriptDir
if (-not $MediaRoot) { $MediaRoot = Join-Path $KitRoot "media" }

$playlistDir = Join-Path $KitRoot "playlists"
New-Item -ItemType Directory -Force -Path $playlistDir | Out-Null
$kitRootFull = (Resolve-Path -LiteralPath $KitRoot).Path.TrimEnd("\", "/")

$extensions = @("*.mp3", "*.aac", "*.m4a", "*.ogg", "*.oga", "*.wav", "*.flac")
$allFiles = New-Object System.Collections.Generic.List[string]

Get-ChildItem -LiteralPath $MediaRoot -Directory | ForEach-Object {
  $category = $_.Name
  $files = foreach ($ext in $extensions) {
    Get-ChildItem -LiteralPath $_.FullName -Filter $ext -File -Recurse -ErrorAction SilentlyContinue
  }

  $relative = $files | Sort-Object FullName | ForEach-Object {
    $path = (Resolve-Path -LiteralPath $_.FullName).Path
    if ($path.StartsWith($kitRootFull, [System.StringComparison]::OrdinalIgnoreCase)) {
      $relativePath = $path.Substring($kitRootFull.Length).TrimStart("\", "/")
    } else {
      $relativePath = $path
    }
    $relativePath -replace "\\", "/"
  }

  if ($relative.Count -gt 0) {
    $relative | Set-Content -LiteralPath (Join-Path $playlistDir "$category.m3u") -Encoding UTF8
    $relative | ForEach-Object { $allFiles.Add($_) }
  }
}

$allFiles | Set-Content -LiteralPath (Join-Path $playlistDir "all.m3u") -Encoding UTF8
Write-Host "Playlists generadas en $playlistDir"
