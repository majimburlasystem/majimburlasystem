# 🚀 Guia de Deployment - EVO FILMS

## Publicação no Vercel (Recomendado)

### Pré-requisitos
- Conta no GitHub (seu repositório)
- Conta no Vercel (gratuita)

### Passo 1: Upload para GitHub
```bash
# No seu projeto local
git init
git add .
git commit -m "Initial commit: EVO FILMS"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

### Passo 2: Deploy no Vercel
1. Acesse https://vercel.com
2. Clique em "New Project"
3. Selecione seu repositório do GitHub
4. Configure as variáveis de ambiente:
   - `ADMIN_SESSION_SECRET`: gere uma chave aleatória forte (use um UUID ou crypto aleatório)
   - `ADMIN_PASSWORD_HASH`: use o hash gerado localmente
   - `DATABASE_PATH`: `./data/evo.db`
5. Clique em "Deploy"

### Passo 3: Configuração Pós-Deploy
- Depois do deploy, o site estará online em `seu-projeto.vercel.app`
- Acesse `/admin` para logar (use a senha que gerou o hash)

---

## Alternativa: Deploy no GitHub Pages (Mais Limitado)

⚠️ GitHub Pages é estatístico, então **não é recomendado** para um app Next.js com API backend.
Preferimos o Vercel que suporta Node.js e APIs.

---

## Geração de Senha Admin

```bash
cd web
node scripts/hash-admin-password.mjs "sua-senha-forte-aqui"
```

Copie o hash gerado e configure em `ADMIN_PASSWORD_HASH` no Vercel.

---

## Checklist Antes de Publicar

- [ ] `.env.local` foi renomeado para `.env.example`
- [ ] Senha admin é forte (mude de "admin123")
- [ ] `ADMIN_SESSION_SECRET` é uma chave aleatória forte
- [ ] Repositório não contém senhas em arquivos
- [ ] Testou localmente com `npm run dev`
- [ ] Build local funciona: `npm run build`

---

## Problemas Comuns

### Erro: "DATABASE_PATH not found"
- Vercel é stateless. Para produção com dados persistentes, migre para PostgreSQL/MongoDB

### Erro: "Cannot find module"
- Execute `npm install` localmente antes de fazer push

### Site lento na primeira visita
- Vercel pode demorar na primeira cold start. Após alguns segundos, normaliza.

---

## Next Steps
1. Considere migrar o banco de dados para PostgreSQL/MongoDB
2. Configure HTTPS/SSL (Vercel faz automaticamente)
3. Configure domínio customizado
4. Ative monitoramento com Vercel Analytics
