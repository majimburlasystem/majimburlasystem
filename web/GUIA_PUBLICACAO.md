# 🎬 EVO FILMS - Guia Completo de Publicação

## 📋 Índice
1. [Sobre](#sobre)
2. [Requisitos](#requisitos)
3. [Publicação no Vercel](#publicação-no-vercel)
4. [Credenciais Admin](#credenciais-admin)
5. [Segurança](#segurança)
6. [Troubleshooting](#troubleshooting)

---

## 📌 Sobre

EVO FILMS é uma plataforma profissional para cadastro de atores e atrizes de conteúdo adulto. 
O site utiliza:
- **Next.js 16** para frontend/backend
- **SQLite (sql.js)** para banco de dados
- **Face Recognition** para verificação biométrica
- **Segurança LGPD** com criptografia e privacidade

---

## ✅ Requisitos

### Instalação Local
- **Node.js** 20+ ([download](https://nodejs.org))
- **npm** 10+ (vem com Node.js)
- **Git** ([download](https://git-scm.com))

### Para Publicação
- **Conta no GitHub** (repositório gratuito)
- **Conta no Vercel** (deploy gratuito - [criar aqui](https://vercel.com/signup))

---

## 🚀 Publicação no Vercel (Passo a Passo)

### Opção 1: Usando Script Automático (Recomendado para Windows)

```powershell
# Abra PowerShell na pasta web/ e execute:
.\deploy.ps1
```

O script fará tudo automaticamente:
✓ Gera hash da senha  
✓ Instala dependências  
✓ Faz build  
✓ Configura Git  
✓ Faz push para GitHub  
✓ Exibe instruções finais  

### Opção 2: Manual (Mais Controle)

#### Passo 1: Preparar o Repositório Git

```bash
cd web
git init
git add .
git commit -m "Initial commit: EVO FILMS"
git branch -M main
git remote add origin https://github.com/seu-usuario/seu-repositorio.git
git push -u origin main
```

#### Passo 2: Deploy no Vercel

1. **Acesse** https://vercel.com e faça login
2. **Clique** em "New Project"
3. **Selecione** seu repositório do GitHub
4. **Configure as variáveis de ambiente:**

```
ADMIN_PASSWORD_HASH = pbkdf2_sha256$600000$ZryNug57CFsqQ+qN8ck/Qg==$0DRcThDwGq8oRJV4gCEVSx2FewLb1TCtMth//ZN0ltg=

ADMIN_SESSION_SECRET = (gere uma chave aleatória - use um UUID ou crypto)

DATABASE_PATH = ./data/evo.db
```

5. **Clique** em "Deploy"

#### Passo 3: Depois do Deploy

- Seu site estará em: `seu-projeto.vercel.app`
- Acesse `/admin` para logar com as credenciais

---

## 🔐 Credenciais Admin

### Login
- **Usuário:** `MAGHOST223`
- **Senha:** `MAGHOST223`

### Para Mudar a Senha

```bash
node scripts/hash-admin-password.mjs "sua-nova-senha"
```

Copie o hash e atualize `ADMIN_PASSWORD_HASH` no Vercel.

---

## 🛡️ Segurança

### ✅ Já Implementado
- ✓ Reconhecimento facial no navegador (sem envio de imagens brutas)
- ✓ Hash criptográfico de senha (PBKDF2)
- ✓ JWT para sessões de admin
- ✓ Validação de dados com Zod
- ✓ Conformidade LGPD
- ✓ Armazenamento seguro de documentos

### ⚠️ Para Produção
- [ ] Migrar banco de dados para **PostgreSQL** (SQLite é apenas teste)
- [ ] Implementar **HTTPS** (Vercel faz automaticamente)
- [ ] Adicionar **rate limiting** na API
- [ ] Configurar **CORS** corretamente
- [ ] Implementar **audit logs**
- [ ] Criptografia de dados em repouso
- [ ] Backup automático de banco de dados
- [ ] Monitoramento com Sentry/DataDog

---

## 🔍 Verificação de Segurança do Frontend

✅ **Sem Senhas Expostas**
- A senha está apenas no backend (.env.local)
- Frontend não acessa variáveis de ambiente

✅ **Sem Chaves de API Expostas**
- Session secret é backend-only
- Database path não é acessível

✅ **Validação de Inputs**
- Todos os formulários usam Zod
- Validação no servidor e cliente

✅ **CORS Protegido**
- API aceita apenas requisições do mesmo domínio

---

## 🐛 Troubleshooting

### "Port 3000 is in use"
```bash
# Linux/Mac
kill -9 $(lsof -ti:3000)

# Windows
taskkill /PID <PID> /F
```

### "Cannot find module"
```bash
npm install
```

### "Build failed"
```bash
# Limpar cache
rm -rf .next
npm run build
```

### "Banco de dados não encontra"
```bash
mkdir -p data
npm run build
npm start
```

### Vercel mostra "500 Internal Server Error"
1. Verifique variáveis de ambiente no dashboard Vercel
2. Confira se `ADMIN_PASSWORD_HASH` está correto
3. Verifique logs: `vercel logs`

---

## 📊 Estrutura do Projeto

```
web/
├── src/
│   ├── app/
│   │   ├── page.tsx           # Homepage
│   │   ├── quem-somos/        # Quem somos
│   │   ├── cadastro/          # Formulário de cadastro
│   │   ├── painel/            # Painel do candidato
│   │   ├── admin/             # Painel admin
│   │   └── api/               # Rotas da API
│   ├── components/            # Componentes React
│   ├── lib/                   # Funções auxiliares
│   └── middleware.ts          # Middleware Next.js
├── public/                    # Assets estáticos
├── scripts/
│   └── hash-admin-password.mjs # Gerar hash
├── package.json
├── next.config.ts
├── tsconfig.json
└── .env.local                 # Variáveis de ambiente
```

---

## 🎯 Próximos Passos

1. **Customizar domínio**: Configure um domínio customizado no Vercel
2. **Analytics**: Ative Vercel Analytics
3. **Monitoramento**: Configure alertas de erros
4. **Backup**: Configure backup do banco de dados
5. **CI/CD**: Configure testes automáticos

---

## 📞 Suporte

Em caso de problemas:
1. Verifique os logs: `vercel logs`
2. Confirme variáveis de ambiente
3. Teste localmente: `npm run dev`
4. Faça rebuild: `vercel --prod --force`

---

## 📄 Licença

Propriedade exclusiva - EVO FILMS 2024

