# Script para build do APK - Minha Bagunça
# Suporta build de debug e release

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet("debug", "release")]
    [string]$BuildType = "debug"
)

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Minha Bagunça - Build Script  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se cordova está instalado
try {
    $cordovaVersion = cordova --version
    Write-Host "✓ Cordova versão: $cordovaVersion" -ForegroundColor Green
} catch {
    Write-Host "ERRO: Cordova não encontrado!" -ForegroundColor Red
    Write-Host "Instale com: npm install -g cordova" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Tipo de build: $BuildType" -ForegroundColor Cyan
Write-Host ""

if ($BuildType -eq "release") {
    # Verificar se build.json existe
    if (-not (Test-Path "build.json")) {
        Write-Host "ERRO: build.json não encontrado!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Para build de release, você precisa:" -ForegroundColor Yellow
        Write-Host "  1. Criar uma keystore (execute: .\create-keystore.ps1)" -ForegroundColor Yellow
        Write-Host "  2. Configurar build.json com suas credenciais" -ForegroundColor Yellow
        Write-Host ""
        exit 1
    }
    
    # Verificar se keystore existe
    $buildConfig = Get-Content "build.json" | ConvertFrom-Json
    $keystorePath = $buildConfig.android.release.keystore
    
    if (-not (Test-Path $keystorePath)) {
        Write-Host "ERRO: Keystore não encontrada em: $keystorePath" -ForegroundColor Red
        Write-Host "Execute: .\create-keystore.ps1" -ForegroundColor Yellow
        exit 1
    }
    
    Write-Host "✓ Keystore encontrada: $keystorePath" -ForegroundColor Green
    Write-Host ""
}

# Limpar build anterior
Write-Host "Limpando builds anteriores..." -ForegroundColor Cyan
if (Test-Path "platforms/android/app/build") {
    Remove-Item -Path "platforms/android/app/build" -Recurse -Force -ErrorAction SilentlyContinue
}
Write-Host "✓ Build anterior limpo" -ForegroundColor Green
Write-Host ""

# Executar build
Write-Host "Iniciando build $BuildType..." -ForegroundColor Cyan
Write-Host ""

try {
    if ($BuildType -eq "release") {
        cordova build android --release
    } else {
        cordova build android
    }
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "========================================" -ForegroundColor Green
        Write-Host "  BUILD CONCLUÍDO COM SUCESSO!" -ForegroundColor Green
        Write-Host "========================================" -ForegroundColor Green
        Write-Host ""
        
        if ($BuildType -eq "release") {
            $apkPath = "platforms/android/app/build/outputs/apk/release/app-release.apk"
            if (Test-Path $apkPath) {
                $apkSize = (Get-Item $apkPath).Length / 1MB
                Write-Host "APK Release:" -ForegroundColor Cyan
                Write-Host "  Caminho: $apkPath" -ForegroundColor White
                Write-Host "  Tamanho: $([math]::Round($apkSize, 2)) MB" -ForegroundColor White
                Write-Host ""
                
                # Verificar assinatura
                Write-Host "Verificando assinatura..." -ForegroundColor Cyan
                keytool -printcert -jarfile $apkPath 2>&1 | Select-String "Owner:", "Issuer:", "Valid from:"
                Write-Host ""
                
                Write-Host "Próximos passos:" -ForegroundColor Cyan
                Write-Host "  • Teste o APK em um dispositivo" -ForegroundColor White
                Write-Host "  • Distribua para seus usuários" -ForegroundColor White
                Write-Host "  • Ou publique na Google Play Store" -ForegroundColor White
            }
        } else {
            $apkPath = "platforms/android/app/build/outputs/apk/debug/app-debug.apk"
            if (Test-Path $apkPath) {
                $apkSize = (Get-Item $apkPath).Length / 1MB
                Write-Host "APK Debug:" -ForegroundColor Cyan
                Write-Host "  Caminho: $apkPath" -ForegroundColor White
                Write-Host "  Tamanho: $([math]::Round($apkSize, 2)) MB" -ForegroundColor White
                Write-Host ""
                Write-Host "Para instalar no dispositivo:" -ForegroundColor Cyan
                Write-Host "  adb install $apkPath" -ForegroundColor White
            }
        }
        
        Write-Host ""
        
    } else {
        Write-Host ""
        Write-Host "ERRO no build!" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host ""
    Write-Host "ERRO: $_" -ForegroundColor Red
    exit 1
}
