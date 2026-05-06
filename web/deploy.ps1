# ============================================
# EVO FILMS - DEPLOYMENT SCRIPT (Windows)
# Script para publicar automaticamente no Vercel
# ============================================

Write-Host "🚀 EVO FILMS - Deploy Automático (Windows)" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

$ADMIN_LOGIN = "MAGHOST223"
$ADMIN_PASSWORD = "MAGHOST223"
$PROJECT_NAME = "evo-films"

# Verificar se está na pasta certa
if (-not (Test-Path "package.json")) {
    Write-Host "❌ Erro: Execute este script a partir do diretório 'web/'" -ForegroundColor Red
    exit 1
}

# ============================================
# PASSO 1: Gerar Hash da Senha
# ============================================
Write-Host ""
Write-Host "📝 PASSO 1: Gerando hash da senha..." -ForegroundColor Yellow
$ADMIN_HASH = & node scripts/hash-admin-password.mjs $ADMIN_PASSWORD
Write-Host "✓ Hash gerado com sucesso" -ForegroundColor Green
Write-Host "   Login: $ADMIN_LOGIN" -ForegroundColor Gray
Write-Host "   Hash: $ADMIN_HASH" -ForegroundColor Gray

# ============================================
# PASSO 2: Verificar dependências
# ============================================
Write-Host ""
Write-Host "📦 PASSO 2: Verificando dependências..." -ForegroundColor Yellow

$node_version = & node --version
$npm_version = & npm --version

Write-Host "✓ Node.js $node_version encontrado" -ForegroundColor Green
Write-Host "✓ npm $npm_version encontrado" -ForegroundColor Green

# ============================================
# PASSO 3: Instalar dependências do projeto
# ============================================
Write-Host ""
Write-Host "📚 PASSO 3: Instalando dependências do projeto..." -ForegroundColor Yellow
& npm install
Write-Host "✓ Dependências instaladas" -ForegroundColor Green

# ============================================
# PASSO 4: Build local para verificar
# ============================================
Write-Host ""
Write-Host "🔨 PASSO 4: Fazendo build para verificação..." -ForegroundColor Yellow
& npm run build
Write-Host "✓ Build completado com sucesso" -ForegroundColor Green

# ============================================
# PASSO 5: Configurar Git
# ============================================
Write-Host ""
Write-Host "📂 PASSO 5: Configurando repositório Git..." -ForegroundColor Yellow

if (-not (Test-Path ".git")) {
    Write-Host "Inicializando git..." -ForegroundColor Gray
    & git init
    & git branch -M main
    Write-Host "✓ Git inicializado" -ForegroundColor Green
}
else {
    Write-Host "✓ Git já configurado" -ForegroundColor Green
}

# ============================================
# PASSO 6: Commit e Push
# ============================================
Write-Host ""
Write-Host "📤 PASSO 6: Fazendo commit e push..." -ForegroundColor Yellow

& git add .
& git commit -m "chore: EVO FILMS deployment" 2>$null
& git push -u origin main
Write-Host "✓ Push realizado com sucesso" -ForegroundColor Green

# ============================================
# PASSO 7: Instruções para Vercel
# ============================================
Write-Host ""
Write-Host "🌐 PASSO 7: Próximo Passo - Deploy no Vercel" -ForegroundColor Yellow
Write-Host ""
Write-Host "==== INSTRUÇÕES ====" -ForegroundColor Cyan
Write-Host "1. Acesse: https://vercel.com" -ForegroundColor White
Write-Host "2. Clique em 'New Project'" -ForegroundColor White
Write-Host "3. Selecione seu repositório do GitHub" -ForegroundColor White
Write-Host "4. Configure as variáveis de ambiente:" -ForegroundColor White
Write-Host ""
Write-Host "   ADMIN_PASSWORD_HASH:" -ForegroundColor Gray
Write-Host "   $ADMIN_HASH" -ForegroundColor Gray
Write-Host ""
Write-Host "   ADMIN_SESSION_SECRET:" -ForegroundColor Gray
Write-Host "   (Gere uma chave aleatória forte)" -ForegroundColor Gray
Write-Host ""
Write-Host "   DATABASE_PATH:" -ForegroundColor Gray
Write-Host "   ./data/evo.db" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Clique em 'Deploy'" -ForegroundColor White
Write-Host ""

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "✅ Repositório pronto para deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "📊 Credenciais de Admin:" -ForegroundColor Cyan
Write-Host "   Login: $ADMIN_LOGIN" -ForegroundColor Yellow
Write-Host "   Senha: $ADMIN_PASSWORD" -ForegroundColor Yellow
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Após o deploy no Vercel, acesse /admin para logar" -ForegroundColor Gray
