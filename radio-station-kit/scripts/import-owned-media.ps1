param(
  [Parameter(Mandatory = $true)]
  [string]$SourceFolder,

  [Parameter(Mandatory = $true)]
  [ValidateSet("adoracion", "alabanza", "predicas", "palabras", "devocionales", "testimonios", "jingles", "por-revisar")]
  [string]$Category
)

$ErrorActionPreference = "Stop"
$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$KitRoot = Split-Path -Parent $ScriptDir
$targetDir = Join-Path $KitRoot "media\$Category"
New-Item -ItemType Directory -Force -Path $targetDir | Out-Null

$extensions = @("*.mp3", "*.aac", "*.m4a", "*.ogg", "*.oga", "*.wav", "*.flac")
$copied = 0

foreach ($ext in $extensions) {
  Get-ChildItem -LiteralPath $SourceFolder -Filter $ext -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination (Join-Path $targetDir $_.Name) -Force
    $copied++
  }
}

Write-Host "Archivos importados: $copied"
Write-Host "Destino: $targetDir"
