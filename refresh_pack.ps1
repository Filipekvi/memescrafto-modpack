# Sincroniza z:\memescrafto-forge\client\ para z:\memescrafto-forge\modpack\ e atualiza index.toml + pack.toml
param(
    [string]$ClientDir = "z:\memescrafto-forge\client",
    [string]$PackDir = $PSScriptRoot
)

$ErrorActionPreference = "Stop"
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Get-Sha256Lower([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash.ToLower()
}

function Get-Sha512Lower([string]$Path) {
    return (Get-FileHash -LiteralPath $Path -Algorithm SHA512).Hash.ToLower()
}

function Escape-TomlString([string]$s) {
    return $s.Replace('\', '\\').Replace('"', '\"')
}

Write-Host "[1/4] Sincronizando kubejs, config, defaultconfigs, resourcepacks e servers.dat..." -ForegroundColor Cyan

foreach ($sub in @("kubejs", "config", "defaultconfigs", "resourcepacks")) {
    $src = Join-Path $ClientDir $sub
    $dst = Join-Path $PackDir $sub
    if (Test-Path $dst) { Remove-Item $dst -Recurse -Force }
    if (Test-Path $src) {
        Copy-Item $src $dst -Recurse -Force
    }
}

# Remove dados locais/runtime de kubejs/data se existirem
$kubeData = Join-Path $PackDir "kubejs\data"
if (Test-Path $kubeData) { Remove-Item $kubeData -Recurse -Force }

$serversDat = Join-Path $ClientDir "servers.dat"
if (Test-Path $serversDat) {
    Copy-Item $serversDat (Join-Path $PackDir "servers.dat") -Force
}

Write-Host "[2/4] Processando mods (Modrinth API + locais)..." -ForegroundColor Cyan
$modsSrc = Join-Path $ClientDir "mods"
$modsDst = Join-Path $PackDir "mods"
if (Test-Path $modsDst) { Remove-Item $modsDst -Recurse -Force }
New-Item -ItemType Directory -Path $modsDst -Force | Out-Null

$jars = Get-ChildItem -Path $modsSrc -Filter "*.jar" | Sort-Object Name
$hashToJar = @{}
foreach ($j in $jars) {
    $h512 = Get-Sha512Lower $j.FullName
    $hashToJar[$h512] = $j
}

$modrinthMap = @{}
if ($hashToJar.Count -gt 0) {
    $body = @{ hashes = @($hashToJar.Keys); algorithm = "sha512" } | ConvertTo-Json
    try {
        $modrinthMap = Invoke-RestMethod -Uri "https://api.modrinth.com/v2/version_files" -Method Post -ContentType "application/json" -Body $body
    } catch {
        Write-Warning "Falha ao consultar Modrinth API: $_"
    }
}

$modrinthCount = 0
$localCount = 0
foreach ($h512 in $hashToJar.Keys) {
    $j = $hashToJar[$h512]
    $ver = $modrinthMap.$h512
    if ($ver -and $ver.files -and $ver.files.Count -gt 0) {
        $fileObj = $ver.files | Where-Object { $_.hashes.sha512 -eq $h512 } | Select-Object -First 1
        if (-not $fileObj) { $fileObj = $ver.files[0] }
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($j.Name)
        $pwPath = Join-Path $modsDst "$baseName.pw.toml"
        $pwContent = @"
name = "$(Escape-TomlString $baseName)"
filename = "$(Escape-TomlString $j.Name)"
side = "both"

[download]
url = "$(Escape-TomlString $fileObj.url)"
hash-format = "sha512"
hash = "$($fileObj.hashes.sha512)"

[update]
[update.modrinth]
mod-id = "$($ver.project_id)"
version = "$($ver.id)"
"@
        [System.IO.File]::WriteAllText($pwPath, $pwContent, (New-Object System.Text.UTF8Encoding $false))
        $modrinthCount++
    } else {
        Copy-Item $j.FullName (Join-Path $modsDst $j.Name) -Force
        $localCount++
    }
}
Write-Host "  -> $modrinthCount mods via Modrinth CDN | $localCount mods locais (.jar)" -ForegroundColor Green

Write-Host "[3/4] Gerando index.toml..." -ForegroundColor Cyan
$includeRoots = @("mods", "kubejs", "config", "defaultconfigs", "resourcepacks")
$allFiles = New-Object System.Collections.Generic.List[System.IO.FileInfo]

foreach ($r in $includeRoots) {
    $p = Join-Path $PackDir $r
    if (Test-Path $p) {
        Get-ChildItem -Path $p -Recurse -File | ForEach-Object { $allFiles.Add($_) }
    }
}
$sd = Join-Path $PackDir "servers.dat"
if (Test-Path $sd) { $allFiles.Add((Get-Item $sd)) }

$sortedFiles = $allFiles | Sort-Object { $_.FullName.Substring($PackDir.Length + 1).Replace('\', '/') }

$idxLines = New-Object System.Collections.Generic.List[string]
$idxLines.Add('hash-format = "sha256"')
$idxLines.Add('')

foreach ($f in $sortedFiles) {
    $rel = $f.FullName.Substring($PackDir.Length + 1).Replace('\', '/')
    $sha = Get-Sha256Lower $f.FullName
    $idxLines.Add('[[files]]')
    $idxLines.Add("file = `"$(Escape-TomlString $rel)`"")
    $idxLines.Add("hash = `"$sha`"")
    if ($rel.EndsWith(".pw.toml")) {
        $idxLines.Add('metafile = true')
    }
    $idxLines.Add('')
}

$indexPath = Join-Path $PackDir "index.toml"
[System.IO.File]::WriteAllText($indexPath, ($idxLines -join "`n"), (New-Object System.Text.UTF8Encoding $false))

Write-Host "[4/4] Atualizando pack.toml..." -ForegroundColor Cyan
$indexHash = Get-Sha256Lower $indexPath
$packContent = @"
name = "Memescrafto RPG"
author = "Memescrafto"
version = "0.1.0-obt"
pack-format = "packwiz:1.1.0"

[index]
file = "index.toml"
hash-format = "sha256"
hash = "$indexHash"

[versions]
forge = "47.3.0"
minecraft = "1.20.1"
"@
$packPath = Join-Path $PackDir "pack.toml"
[System.IO.File]::WriteAllText($packPath, $packContent, (New-Object System.Text.UTF8Encoding $false))

Write-Host "Pronto! $($sortedFiles.Count) arquivos indexados. Hash do index.toml: $indexHash" -ForegroundColor Green

