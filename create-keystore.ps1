# Script para criar keystore para assinatura do APK
# Minha Bagunça - Security Setup

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Minha Bagunça - Keystore Generator  " -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se keytool está disponível
try {
    $null = keytool -help 2>&1
} catch {
    Write-Host "ERRO: keytool não encontrado!" -ForegroundColor Red
    Write-Host "Certifique-se de que o Java JDK está instalado e no PATH." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Download Java JDK: https://www.oracle.com/java/technologies/downloads/" -ForegroundColor Yellow
    exit 1
}

# Criar diretório private se não existir
if (-not (Test-Path "private")) {
    New-Item -ItemType Directory -Path "private" | Out-Null
    Write-Host "✓ Diretório 'private' criado" -ForegroundColor Green
}

# Verificar se keystore já existe
if (Test-Path "private/minha-bagunca.keystore") {
    Write-Host ""
    Write-Host "ATENÇÃO: Keystore já existe!" -ForegroundColor Yellow
    Write-Host "Se você criar uma nova keystore, não poderá atualizar apps assinados com a anterior." -ForegroundColor Yellow
    Write-Host ""
    $response = Read-Host "Deseja sobrescrever? (sim/não)"
    if ($response -ne "sim") {
        Write-Host "Operação cancelada." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Vamos criar sua keystore de assinatura." -ForegroundColor Cyan
Write-Host ""
Write-Host "IMPORTANTE:" -ForegroundColor Yellow
Write-Host "  • Guarde a senha em local seguro" -ForegroundColor Yellow
Write-Host "  • Faça backup da keystore" -ForegroundColor Yellow
Write-Host "  • NUNCA perca esses dados!" -ForegroundColor Yellow
Write-Host ""

# Solicitar informações
Write-Host "Informações da Keystore:" -ForegroundColor Cyan
Write-Host ""

$storePassword = Read-Host "Digite a senha da keystore (mínimo 6 caracteres)" -AsSecureString
$storePasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($storePassword))

if ($storePasswordPlain.Length -lt 6) {
    Write-Host "ERRO: Senha muito curta! Mínimo 6 caracteres." -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Informações do certificado (pressione Enter para usar padrão):" -ForegroundColor Cyan
Write-Host ""

$nome = Read-Host "Nome completo [Minha Bagunça]"
if ([string]::IsNullOrWhiteSpace($nome)) { $nome = "Minha Bagunça" }

$unidade = Read-Host "Unidade organizacional [Dev]"
if ([string]::IsNullOrWhiteSpace($unidade)) { $unidade = "Dev" }

$organizacao = Read-Host "Organização [Minha Bagunça]"
if ([string]::IsNullOrWhiteSpace($organizacao)) { $organizacao = "Minha Bagunça" }

$cidade = Read-Host "Cidade [São Paulo]"
if ([string]::IsNullOrWhiteSpace($cidade)) { $cidade = "São Paulo" }

$estado = Read-Host "Estado [SP]"
if ([string]::IsNullOrWhiteSpace($estado)) { $estado = "SP" }

$pais = Read-Host "País (código de 2 letras) [BR]"
if ([string]::IsNullOrWhiteSpace($pais)) { $pais = "BR" }

# Construir DN (Distinguished Name)
$dn = "CN=$nome, OU=$unidade, O=$organizacao, L=$cidade, ST=$estado, C=$pais"

Write-Host ""
Write-Host "Criando keystore..." -ForegroundColor Cyan

# Criar keystore
$keystorePath = "private/minha-bagunca.keystore"
$alias = "minha-bagunca"

try {
    keytool -genkey -v `
        -keystore $keystorePath `
        -alias $alias `
        -keyalg RSA `
        -keysize 2048 `
        -validity 10000 `
        -storepass $storePasswordPlain `
        -keypass $storePasswordPlain `
        -dname $dn

    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ Keystore criada com sucesso!" -ForegroundColor Green
        Write-Host ""
        
        # Criar build.json
        $buildJsonContent = @"
{
  "android": {
    "release": {
      "keystore": "private/minha-bagunca.keystore",
      "storePassword": "$storePasswordPlain",
      "alias": "minha-bagunca",
      "password": "$storePasswordPlain",
      "keystoreType": ""
    }
  }
}
"@
        
        $buildJsonContent | Out-File -FilePath "build.json" -Encoding UTF8
        Write-Host "✓ Arquivo build.json criado" -ForegroundColor Green
        Write-Host ""
        
        # Mostrar informações
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host "  INFORMAÇÕES IMPORTANTES" -ForegroundColor Cyan
        Write-Host "========================================" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "Keystore: $keystorePath" -ForegroundColor White
        Write-Host "Alias: $alias" -ForegroundColor White
        Write-Host "Senha: $storePasswordPlain" -ForegroundColor White
        Write-Host ""
        Write-Host "GUARDE ESSAS INFORMAÇÕES EM LOCAL SEGURO!" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Próximos passos:" -ForegroundColor Cyan
        Write-Host "  1. Faça backup da pasta 'private'" -ForegroundColor White
        Write-Host "  2. Execute: cordova build android --release" -ForegroundColor White
        Write-Host "  3. APK estará em: platforms/android/app/build/outputs/apk/release/" -ForegroundColor White
        Write-Host ""
        
        # Salvar informações em arquivo
        $infoContent = @"
INFORMAÇÕES DA KEYSTORE - MINHA BAGUNÇA
========================================

Data de criação: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")

Keystore: $keystorePath
Alias: $alias
Senha: $storePasswordPlain

Distinguished Name:
$dn

IMPORTANTE:
- Faça backup deste arquivo e da keystore
- NUNCA perca a senha ou a keystore
- Sem eles, você não poderá atualizar o app

========================================
"@
        
        $infoContent | Out-File -FilePath "private/KEYSTORE_INFO.txt" -Encoding UTF8
        Write-Host "✓ Informações salvas em: private/KEYSTORE_INFO.txt" -ForegroundColor Green
        Write-Host ""
        
    } else {
        Write-Host "ERRO ao criar keystore!" -ForegroundColor Red
        exit 1
    }
    
} catch {
    Write-Host "ERRO: $_" -ForegroundColor Red
    exit 1
}
