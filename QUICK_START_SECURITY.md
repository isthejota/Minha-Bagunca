# 🚀 Guia Rápido - Segurança do APK

## ⚡ Início Rápido

### 1️⃣ Criar Keystore (Primeira vez apenas)

```powershell
.\create-keystore.ps1
```

Este script irá:
- ✅ Criar a pasta `private/`
- ✅ Gerar a keystore de assinatura
- ✅ Criar o arquivo `build.json` automaticamente
- ✅ Salvar as informações em `private/KEYSTORE_INFO.txt`

> **⚠️ IMPORTANTE:** Faça backup da pasta `private/` em local seguro!

---

### 2️⃣ Compilar APK Assinado

```powershell
# Build de release (assinado e pronto para distribuição)
.\build-apk.ps1 -BuildType release

# Build de debug (para testes)
.\build-apk.ps1 -BuildType debug
```

---

## 📦 Localização dos APKs

### Release (Distribuição)
```
platforms/android/app/build/outputs/apk/release/app-release.apk
```

### Debug (Testes)
```
platforms/android/app/build/outputs/apk/debug/app-debug.apk
```

---

## 🔒 O que foi implementado?

### ✅ Segurança
- [x] Assinatura de APK com keystore própria
- [x] Content Security Policy (CSP) configurado
- [x] Acesso de rede restrito apenas a domínios necessários
- [x] Arquivos sensíveis protegidos no `.gitignore`

### ✅ Configurações
- [x] `config.xml` com políticas de acesso restritas
- [x] `index.html` com CSP meta tag
- [x] Descrição e autor do app atualizados

### ✅ Scripts de Automação
- [x] `create-keystore.ps1` - Cria keystore facilmente
- [x] `build-apk.ps1` - Compila APK com validações

---

## 📋 Checklist Antes de Distribuir

- [ ] Keystore criada e backup feito
- [ ] `build.json` configurado (não commitado no Git)
- [ ] Versão atualizada no `config.xml`
- [ ] APK de release compilado
- [ ] APK testado em dispositivo real
- [ ] Todas as funcionalidades testadas

---

## 🆘 Problemas Comuns

### "Keystore não encontrada"
```powershell
# Execute novamente o script de criação
.\create-keystore.ps1
```

### "Build falhou"
```powershell
# Limpe o projeto e tente novamente
cordova clean android
.\build-apk.ps1 -BuildType release
```

### "Senha incorreta"
- Verifique o arquivo `private/KEYSTORE_INFO.txt`
- Atualize o `build.json` com a senha correta

---

## 📚 Documentação Completa

Para informações detalhadas sobre segurança, veja:
- **[SECURITY_GUIDE.md](SECURITY_GUIDE.md)** - Guia completo de segurança

---

## 🎯 Próximos Passos

1. **Teste o APK** em dispositivos reais
2. **Distribua** para seus usuários
3. **Considere publicar** na Google Play Store para máxima confiança

---

**Minha Bagunça** - Organizador Criativo 🎨
