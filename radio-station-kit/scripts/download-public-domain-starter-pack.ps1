param(
  [switch]$Force
)

$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KitRoot = Split-Path -Parent $ScriptDir

$items = @(
  @{
    Url = "https://upload.wikimedia.org/wikipedia/commons/8/82/God_of_Our_Fathers_-_Concert_Band_-_United_States_Air_Force_Heritage_of_America_Band.mp3"
    Output = "media/alabanza/god-of-our-fathers-usaf.mp3"
    Title = "God of Our Fathers"
    Source = "https://commons.wikimedia.org/wiki/File:God_of_Our_Fathers_-_Concert_Band_-_United_States_Air_Force_Heritage_of_America_Band.mp3"
    License = "Public Domain"
  },
  @{
    Url = "https://upload.wikimedia.org/wikipedia/commons/6/62/The_God_of_Abraham_Praise_-_Concert_Band_-_United_States_Air_Force_Band.mp3"
    Output = "media/adoracion/the-god-of-abraham-praise-usaf.mp3"
    Title = "The God of Abraham Praise"
    Source = "https://commons.wikimedia.org/wiki/File:The_God_of_Abraham_Praise_-_Concert_Band_-_United_States_Air_Force_Band.mp3"
    License = "Public Domain"
  }
)

foreach ($item in $items) {
  $target = Join-Path $KitRoot $item.Output
  $dir = Split-Path -Parent $target
  New-Item -ItemType Directory -Force -Path $dir | Out-Null

  if ((Test-Path -LiteralPath $target) -and -not $Force) {
    Write-Host "Existe: $($item.Output)"
    continue
  }

  Write-Host "Descargando: $($item.Title)"
  Invoke-WebRequest -Uri $item.Url -OutFile $target -UseBasicParsing
}

$metadataDir = Join-Path $KitRoot "metadata"
New-Item -ItemType Directory -Force -Path $metadataDir | Out-Null
$items | ConvertTo-Json -Depth 4 | Set-Content -LiteralPath (Join-Path $metadataDir "starter-pack-sources.json") -Encoding UTF8

Write-Host "Paquete inicial listo en $KitRoot\media"
