#!/bin/bash
# ============================================
# EVO FILMS - DEPLOYMENT SCRIPT
# Script para publicar automaticamente no Vercel
# ============================================

set -e

ADMIN_LOGIN="MAGHOST223"
ADMIN_PASSWORD="MAGHOST223"
PROJECT_NAME="evo-films"

echo "🚀 EVO FILMS - Deploy Automático"
echo "=================================="

# Verificar se está na pasta certa
if [ ! -f "package.json" ]; then
    echo "❌ Erro: Execute este script a partir do diretório 'web/'"
    exit 1
fi

# ============================================
# PASSO 1: Gerar Hash da Senha
# ============================================
echo ""
echo "📝 PASSO 1: Gerando hash da senha..."
ADMIN_HASH=$(node scripts/hash-admin-password.mjs "$ADMIN_PASSWORD")
echo "✓ Hash gerado com sucesso"
echo "   Login: $ADMIN_LOGIN"
echo "   Hash: $ADMIN_HASH"

# ============================================
# PASSO 2: Verificar dependências
# ============================================
echo ""
echo "📦 PASSO 2: Verificando dependências..."

if ! command -v node &> /dev/null; then
    echo "❌ Node.js não encontrado. Por favor, instale Node.js"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm não encontrado. Por favor, instale npm"
    exit 1
fi

echo "✓ Node.js $(node --version) encontrado"
echo "✓ npm $(npm --version) encontrado"

# ============================================
# PASSO 3: Instalar dependências do projeto
# ============================================
echo ""
echo "📚 PASSO 3: Instalando dependências do projeto..."
npm install
echo "✓ Dependências instaladas"

# ============================================
# PASSO 4: Build local para verificar
# ============================================
echo ""
echo "🔨 PASSO 4: Fazendo build para verificação..."
npm run build
echo "✓ Build completado com sucesso"

# ============================================
# PASSO 5: Configurar Git
# ============================================
echo ""
echo "📂 PASSO 5: Configurando repositório Git..."

if [ ! -d ".git" ]; then
    echo "Inicializando git..."
    git init
    git branch -M main
    echo "✓ Git inicializado"
else
    echo "✓ Git já configurado"
fi

# Verificar se remoto existe
if ! git remote | grep -q origin; then
    echo ""
    echo "⚠️  Repositório remoto não configurado."
    echo "Execute o seguinte comando:"
    echo "   git remote add origin https://github.com/SEU_USUARIO/SEU_REPOSITORIO.git"
    echo ""
    exit 1
fi

# ============================================
# PASSO 6: Commit e Push
# ============================================
echo ""
echo "📤 PASSO 6: Fazendo commit e push..."

git add .
git commit -m "chore: EVO FILMS deployment" || echo "Nada novo para commitar"
git push -u origin main
echo "✓ Push realizado com sucesso"

# ============================================
# PASSO 7: Deploy no Vercel
# ============================================
echo ""
echo "🌐 PASSO 7: Deploying no Vercel..."

if ! command -v vercel &> /dev/null; then
    echo "⚠️  Vercel CLI não encontrado. Instale com:"
    echo "   npm install -g vercel"
    echo ""
    echo "Depois execute:"
    echo "   vercel --prod --env ADMIN_PASSWORD_HASH=$ADMIN_HASH --env ADMIN_SESSION_SECRET=$(openssl rand -hex 32)"
    exit 1
fi

# Gerar session secret
SESSION_SECRET=$(openssl rand -hex 32 2>/dev/null || node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

echo "Deploying com variáveis de ambiente..."
vercel --prod \
    --env "ADMIN_PASSWORD_HASH=$ADMIN_HASH" \
    --env "ADMIN_SESSION_SECRET=$SESSION_SECRET" \
    --env "DATABASE_PATH=./data/evo.db"

echo ""
echo "✅ Deploy completo!"
echo ""
echo "=================================="
echo "📊 Credenciais de Admin:"
echo "   Login: $ADMIN_LOGIN"
echo "   Senha: $ADMIN_PASSWORD"
echo "=================================="
echo ""
echo "🔗 Seu site está online!"
echo ""
