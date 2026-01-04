# 🔐 Guia de Segurança - Minha Bagunça

Este guia explica como tornar seu aplicativo mais seguro e reduzir os avisos de segurança quando distribuir o APK.

## 📋 Índice

1. [Assinatura do APK](#1-assinatura-do-apk-crítico)
2. [Configurações de Segurança](#2-configurações-de-segurança)
3. [Content Security Policy](#3-content-security-policy-csp)
4. [Permissões do Android](#4-permissões-do-android)
5. [Checklist Final](#5-checklist-final)

---

## 1. 🔑 Assinatura do APK (CRÍTICO)

> [!IMPORTANT]
> **Esta é a mudança mais importante!** Um APK assinado corretamente reduz drasticamente os avisos de segurança.

### Por que assinar?

Quando você distribui um APK sem assinatura de release, o Android mostra avisos como:
- "Aplicativo não verificado"
- "Esta aplicação pode ser perigosa"
- "Instalar mesmo assim?"

### Passo a Passo:

#### 1.1. Criar uma Keystore (Chave de Assinatura)

Abra o PowerShell e execute:

```powershell
# Navegue até a pasta do projeto
cd d:\app\planerfer

# Crie uma pasta para armazenar a keystore (NÃO commite no Git!)
mkdir private -Force

# Gere a keystore
keytool -genkey -v -keystore private/minha-bagunca.keystore -alias minha-bagunca -keyalg RSA -keysize 2048 -validity 10000
```

**Informações que serão solicitadas:**
- **Senha da keystore**: Escolha uma senha forte e **GUARDE-A COM SEGURANÇA!**
- **Nome e sobrenome**: Seu nome ou nome da empresa
- **Unidade organizacional**: Pode deixar em branco ou colocar "Dev"
- **Organização**: Nome da sua empresa/projeto
- **Cidade, Estado, País**: Suas informações

> [!CAUTION]
> **NUNCA perca esta keystore ou senha!** Se perder, não conseguirá atualizar o app no futuro.
> Faça backup em um local seguro (USB, cloud criptografado, etc.)

#### 1.2. Criar arquivo build.json

Crie o arquivo `build.json` na raiz do projeto com suas credenciais:

```json
{
  "android": {
    "release": {
      "keystore": "private/minha-bagunca.keystore",
      "storePassword": "SUA_SENHA_AQUI",
      "alias": "minha-bagunca",
      "password": "SUA_SENHA_AQUI",
      "keystoreType": ""
    }
  }
}
```

> [!WARNING]
> **NÃO commite o `build.json` no Git!** Adicione ao `.gitignore`.

#### 1.3. Atualizar .gitignore

Adicione estas linhas ao `.gitignore`:

```
# Arquivos de assinatura - NUNCA commitar!
build.json
private/
*.keystore
*.jks
```

#### 1.4. Compilar APK Assinado

```powershell
# Build de release (assinado)
cordova build android --release

# O APK assinado estará em:
# platforms/android/app/build/outputs/apk/release/app-release.apk
```

---

## 2. ⚙️ Configurações de Segurança

### 2.1. Atualizar config.xml

Vamos restringir o acesso apenas aos domínios necessários:

**Antes (inseguro):**
```xml
<access origin="*" />
<allow-navigation href="*" />
```

**Depois (seguro):**
```xml
<!-- Permitir apenas domínios específicos -->
<access origin="https://cdn.tailwindcss.com" />
<access origin="https://fonts.googleapis.com" />
<access origin="https://fonts.gstatic.com" />
<access origin="https://raw.githubusercontent.com" />

<!-- Navegação interna apenas -->
<allow-navigation href="about:*" />
<allow-navigation href="data:*" />
<allow-navigation href="https://cdn.tailwindcss.com/*" />
<allow-navigation href="https://fonts.googleapis.com/*" />
<allow-navigation href="https://fonts.gstatic.com/*" />

<!-- Permitir abrir links externos no navegador -->
<allow-intent href="http://*/*" />
<allow-intent href="https://*/*" />
<allow-intent href="tel:*" />
<allow-intent href="sms:*" />
<allow-intent href="mailto:*" />
```

### 2.2. Adicionar Content Security Policy no index.html

Adicione esta meta tag no `<head>` do `index.html`:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' data: gap: https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com https://raw.githubusercontent.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; 
               font-src 'self' data: https://fonts.gstatic.com; 
               img-src 'self' data: https:; 
               connect-src 'self' https://raw.githubusercontent.com;">
```

---

## 3. 🛡️ Content Security Policy (CSP)

### O que é CSP?

CSP define quais recursos (scripts, estilos, imagens) podem ser carregados no app. Isso previne ataques de injeção de código.

### Níveis de Segurança:

#### Nível 1 - Básico (Atual - Recomendado para desenvolvimento)
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' data: gap: https://cdn.tailwindcss.com https://fonts.googleapis.com https://fonts.gstatic.com https://raw.githubusercontent.com; 
               style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.tailwindcss.com; 
               font-src 'self' data: https://fonts.gstatic.com; 
               img-src 'self' data: https:; 
               connect-src 'self' https://raw.githubusercontent.com;">
```

#### Nível 2 - Restrito (Recomendado para produção)
Para máxima segurança, baixe todas as dependências localmente:

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self' data: gap:; 
               style-src 'self' 'unsafe-inline'; 
               script-src 'self' 'unsafe-inline' 'unsafe-eval'; 
               font-src 'self' data:; 
               img-src 'self' data:; 
               connect-src 'self';">
```

> [!TIP]
> Para usar o Nível 2, você precisará baixar Tailwind CSS, Google Fonts e outras dependências para a pasta `www/`.

---

## 4. 🔓 Permissões do Android

### Revisar Permissões Necessárias

Atualmente seu app solicita:

```xml
<uses-permission android:name="android.permission.WRITE_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_EXTERNAL_STORAGE" />
<uses-permission android:name="android.permission.READ_MEDIA_AUDIO" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

### Recomendações:

1. **WRITE_EXTERNAL_STORAGE / READ_EXTERNAL_STORAGE**: 
   - Necessário apenas se você salva arquivos no armazenamento externo
   - Se usar apenas armazenamento interno, remova

2. **READ_MEDIA_AUDIO**: 
   - Necessário apenas se o app reproduz áudio
   - Se não usa, remova

3. **POST_NOTIFICATIONS**: 
   - Necessário para notificações
   - Mantenha se usa o plugin de notificações

### Permissões Mínimas Recomendadas:

Se você usa apenas notificações e armazenamento interno:

```xml
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

---

## 5. ✅ Checklist Final

Antes de distribuir seu APK, verifique:

### Segurança Básica
- [ ] APK assinado com keystore própria
- [ ] `build.json` adicionado ao `.gitignore`
- [ ] Backup da keystore em local seguro
- [ ] CSP configurado no `index.html`
- [ ] `access origin` restrito no `config.xml`

### Informações do App
- [ ] Nome do app correto no `config.xml`
- [ ] Descrição atualizada
- [ ] Informações de autor corretas
- [ ] Versão atualizada (incrementar a cada release)
- [ ] ID do pacote único (`com.cb.minhabagunca`)

### Permissões
- [ ] Apenas permissões necessárias solicitadas
- [ ] Permissões explicadas aos usuários (se possível)

### Build
- [ ] Build de release executado com sucesso
- [ ] APK testado em dispositivo físico
- [ ] Sem erros no console
- [ ] Todas as funcionalidades testadas

---

## 🚀 Comandos Rápidos

### Build de Release (Assinado)
```powershell
cordova build android --release
```

### Build de Debug (Desenvolvimento)
```powershell
cordova build android
```

### Instalar no Dispositivo
```powershell
# Debug
cordova run android

# Release
adb install platforms/android/app/build/outputs/apk/release/app-release.apk
```

### Verificar Assinatura do APK
```powershell
keytool -printcert -jarfile platforms/android/app/build/outputs/apk/release/app-release.apk
```

---

## 📱 Distribuição

### Opções de Distribuição:

1. **Google Play Store** (Recomendado)
   - Máxima confiança dos usuários
   - Sem avisos de segurança
   - Atualizações automáticas

2. **Distribuição Direta (APK)**
   - Usuários precisam habilitar "Fontes desconhecidas"
   - Avisos de segurança reduzidos com assinatura
   - Você é responsável por atualizações

3. **Lojas Alternativas**
   - Amazon Appstore
   - Samsung Galaxy Store
   - F-Droid (apenas open source)

---

## 🆘 Problemas Comuns

### "App não assinado"
- Certifique-se de usar `--release` no build
- Verifique se `build.json` está configurado corretamente

### "Keystore não encontrada"
- Verifique o caminho no `build.json`
- Use caminho relativo: `private/minha-bagunca.keystore`

### "Senha incorreta"
- Verifique a senha no `build.json`
- A senha do alias deve ser igual à senha da keystore

### "CSP bloqueando recursos"
- Verifique o console do navegador/app
- Adicione o domínio necessário ao CSP

---

## 📚 Recursos Adicionais

- [Documentação Cordova - App Signing](https://cordova.apache.org/docs/en/latest/guide/platforms/android/index.html#signing-an-app)
- [Android - Assinar seu app](https://developer.android.com/studio/publish/app-signing)
- [CSP - Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)

---

**Criado para o projeto Minha Bagunça** 🎯
