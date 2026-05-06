# EVO FILMES — Portal de Cadastro

Site completo (Next.js) com:

- Cadastro de talentos (atores/atrizes) para produções de conteúdo adulto
- Upload de fotos de documentos + selfie
- Checagem de similaridade facial no navegador (Face API: `@vladmandic/face-api`)
- Painel do talento via token
- Painel admin com login e gestão de status
- Armazenamento das imagens no banco (SQLite via `sql.js`, arquivo `data/evo.db`)

## Rodar localmente

1) Instale dependências

```bash
npm install
```

2) Configure variáveis de ambiente

Copie `.env.example` para `.env.local` e preencha:

```bash
cp .env.example .env.local
```

Gere o hash da senha do admin:

```bash
node scripts/hash-admin-password.mjs "SUA_SENHA_FORTE"
```

Cole o resultado em `ADMIN_PASSWORD_HASH` no `.env.local`.

3) Inicie

```bash
npm run dev
```

Abra `http://localhost:3000`.

## Aviso importante (produção)

Este projeto lida com **documentos** e **biometria (face)**.

- Em produção, considere **KYC/biometria** com provedor especializado (liveness, antifraude, auditoria)
- Não é recomendado escalar com imagens como **BLOB em SQLite**; prefira storage dedicado (S3/R2) + DB relacional
- Defina política de **privacidade**, **retenção**, **criptografia**, **controle de acesso** e **logs** (LGPD/leis locais)
