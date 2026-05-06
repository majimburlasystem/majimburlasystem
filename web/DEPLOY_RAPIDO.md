# 🚀 PUBLICAR EVO FILMS EM 5 MINUTOS

## **MÉTODO 1: Automático (Recomendado)**

### Passo 1: Abra PowerShell

Na pasta `web/`, clique direito e escolha "Abrir PowerShell aqui"

### Passo 2: Execute o Script

```powershell
.\deploy.ps1
```

O script vai:
1. ✓ Gerar hash da senha
2. ✓ Instalar dependências
3. ✓ Fazer build
4. ✓ Configurar Git
5. ✓ Fazer push para GitHub
6. ✓ Exibir instruções finais

**Pronto!** O site está pronto para deploy 🎉

---

## **MÉTODO 2: Manual (5 minutos)**

### Passo 1: Fazer Push para GitHub

```bash
cd web

# Inicializar git
git init
git add .
git commit -m "EVO FILMS - deployment"
git branch -M main

# Adicionar repositório remoto
git remote add origin https://github.com/SEU_USUARIO/SEU_REPO.git

# Fazer push
git push -u origin main
```

### Passo 2: Deploy no Vercel

1. **Acesse:** https://vercel.com
2. **Faça login** com GitHub
3. **Clique:** "New Project"
4. **Selecione** seu repositório
5. **Adicione variáveis:**

```
ADMIN_PASSWORD_HASH:
pbkdf2_sha256$600000$ZryNug57CFsqQ+qN8ck/Qg==$0DRcThDwGq8oRJV4gCEVSx2FewLb1TCtMth//ZN0ltg=

ADMIN_SESSION_SECRET:
seu-secret-aleatorio-bem-forte

DATABASE_PATH:
./data/evo.db
```

6. **Clique:** "Deploy"

### Passo 3: Esperar ~2 minutos

Vercel está compilando seu site...

### Passo 4: ✅ Pronto!

Seu site está em: `seu-projeto.vercel.app`

---

## 🔑 CREDENCIAIS DE ADMIN

Login: **MAGHOST223**  
Senha: **MAGHOST223**

Acesse: `seu-site.vercel.app/admin`

---

## 🛠️ SE ALGO DER ERRADO

### Erro: "Cannot find module"
```bash
npm install
```

### Erro: "Git remoto não configurado"
```bash
git remote add origin https://github.com/seu-usuario/seu-repo.git
git push -u origin main
```

### Site mostra erro 500
- Verifique variáveis de ambiente no Vercel
- Confira o hash da senha
- Execute: `vercel logs`

### Vercel trava na compilação
- Limpe cache: `npm run build`
- Faça rebuild: `vercel --prod --force`

---

## ✅ CHECKLIST

- [ ] Script executado com sucesso OU push para GitHub feito
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Deploy iniciado
- [ ] Site online (vercel.app)
- [ ] Login admin funcionando
- [ ] Cadastro abrindo
- [ ] Fotos sendo salvas

---

## 📞 VERIFICAR SE FUNCIONOU

Acesse:
```
🏠 Home: seu-site.vercel.app
📋 Quem Somos: seu-site.vercel.app/quem-somos
📝 Cadastro: seu-site.vercel.app/cadastro
👤 Admin: seu-site.vercel.app/admin
```

**Login admin:**
```
Usuário: MAGHOST223
Senha: MAGHOST223
```

---

## 🎯 PRONTO?

Seu site **EVO FILMS** está 100% funcional e pronto para receber candidatos! 🚀

Basta seguir os passos acima e em 5 minutos estará online.

Boa sorte! 💪

