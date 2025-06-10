#!/usr/bin/env powershell

# Script automatizado para deploy no Heroku
# Execute com: powershell -ExecutionPolicy Bypass -File scripts/deploy-heroku.ps1

param(
    [Parameter(Mandatory=$true)]
    [string]$AppName,
    
    [Parameter(Mandatory=$false)]
    [string]$Region = "us"
)

Write-Host "🚀 Iniciando deploy automatizado para o Heroku..." -ForegroundColor Green
Write-Host "📱 App: $AppName" -ForegroundColor Yellow
Write-Host "🌍 Região: $Region" -ForegroundColor Yellow

# Verificar se o Heroku CLI está instalado
try {
    heroku --version | Out-Null
    Write-Host "✅ Heroku CLI encontrado" -ForegroundColor Green
} catch {
    Write-Host "❌ Heroku CLI não encontrado. Instale em: https://devcenter.heroku.com/articles/heroku-cli" -ForegroundColor Red
    exit 1
}

# Fazer login no Heroku
Write-Host "🔑 Fazendo login no Heroku..." -ForegroundColor Cyan
heroku auth:whoami
if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Fazendo login..." -ForegroundColor Yellow
    heroku login
}

# Criar aplicação se não existir
Write-Host "📦 Verificando/criando aplicação..." -ForegroundColor Cyan
$appExists = heroku apps:info $AppName 2>$null
if ($LASTEXITCODE -ne 0) {
    Write-Host "🆕 Criando nova aplicação..." -ForegroundColor Yellow
    heroku create $AppName --region $Region
} else {
    Write-Host "✅ Aplicação existente encontrada" -ForegroundColor Green
}

# Configurar variáveis de ambiente essenciais
Write-Host "⚙️  Configurando variáveis de ambiente..." -ForegroundColor Cyan

$envVars = @{
    "NODE_ENV" = "production"
    "DATABASE_PATH" = "./ze_da_fruta.sqlite"
    "JWT_EXPIRES_IN" = "1d"
    "RATE_LIMIT_PUBLIC_TTL" = "60"
    "RATE_LIMIT_PUBLIC_LIMIT" = "50"
    "RATE_LIMIT_AUTH_TTL" = "60"
    "RATE_LIMIT_AUTH_LIMIT" = "200"
    "HELMET_ENABLED" = "true"
}

foreach ($key in $envVars.Keys) {
    heroku config:set "$key=$($envVars[$key])" --app $AppName
}

# Gerar JWT_SECRET se não existir
$jwtSecret = heroku config:get JWT_SECRET --app $AppName
if ([string]::IsNullOrEmpty($jwtSecret)) {
    Write-Host "🔐 Gerando JWT_SECRET..." -ForegroundColor Yellow
    $randomBytes = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    $bytes = New-Object byte[] 32
    $randomBytes.GetBytes($bytes)
    $jwtSecret = [Convert]::ToBase64String($bytes)
    heroku config:set "JWT_SECRET=$jwtSecret" --app $AppName
}

# Configurar CORS_ORIGIN e FRONTEND_URL
$frontendUrl = Read-Host "🌐 Digite a URL do frontend (ou pressione Enter para usar https://$AppName-frontend.herokuapp.com)"
if ([string]::IsNullOrEmpty($frontendUrl)) {
    $frontendUrl = "https://$AppName-frontend.herokuapp.com"
}

heroku config:set "CORS_ORIGIN=$frontendUrl" --app $AppName
heroku config:set "FRONTEND_URL=$frontendUrl" --app $AppName

# Configurar Google OAuth (opcional)
$configureGoogle = Read-Host "🔍 Configurar Google OAuth? (y/N)"
if ($configureGoogle -eq "y" -or $configureGoogle -eq "Y") {
    $googleClientId = Read-Host "Google Client ID"
    $googleClientSecret = Read-Host "Google Client Secret"
    
    if (![string]::IsNullOrEmpty($googleClientId) -and ![string]::IsNullOrEmpty($googleClientSecret)) {
        heroku config:set "GOOGLE_CLIENT_ID=$googleClientId" --app $AppName
        heroku config:set "GOOGLE_CLIENT_SECRET=$googleClientSecret" --app $AppName
        heroku config:set "GOOGLE_CALLBACK_URL=https://$AppName.herokuapp.com/auth/google/callback" --app $AppName
    }
}

# Configurar Stripe (opcional)
$configureStripe = Read-Host "💳 Configurar Stripe? (y/N)"
if ($configureStripe -eq "y" -or $configureStripe -eq "Y") {
    $stripeSecret = Read-Host "Stripe Secret Key"
    $stripeWebhook = Read-Host "Stripe Webhook Secret"
    
    if (![string]::IsNullOrEmpty($stripeSecret)) {
        heroku config:set "STRIPE_SECRET_KEY=$stripeSecret" --app $AppName
        heroku config:set "STRIPE_SUCCESS_URL=$frontendUrl/success" --app $AppName
        heroku config:set "STRIPE_CANCEL_URL=$frontendUrl/cancel" --app $AppName
        
        if (![string]::IsNullOrEmpty($stripeWebhook)) {
            heroku config:set "STRIPE_WEBHOOK_SECRET=$stripeWebhook" --app $AppName
        }
    }
}

# Adicionar remote do Heroku
Write-Host "🔗 Configurando remote do Git..." -ForegroundColor Cyan
heroku git:remote --app $AppName

# Fazer deploy
Write-Host "🚀 Fazendo deploy..." -ForegroundColor Cyan
git add .
git commit -m "Deploy para produção no Heroku - $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"
git push heroku main

# Verificar status
Write-Host "📊 Verificando status do deploy..." -ForegroundColor Cyan
heroku ps --app $AppName

# Executar seed
Write-Host "🌱 Executando seed dos dados..." -ForegroundColor Cyan
heroku run npm run seed:prod --app $AppName

# Mostrar logs
Write-Host "📋 Últimos logs:" -ForegroundColor Cyan
heroku logs --tail --num 20 --app $AppName

Write-Host "🎉 Deploy concluído!" -ForegroundColor Green
Write-Host "🌐 URL da aplicação: https://$AppName.herokuapp.com" -ForegroundColor Yellow
Write-Host "📚 Documentação Swagger: https://$AppName.herokuapp.com/api" -ForegroundColor Yellow
Write-Host "📊 Dashboard Heroku: https://dashboard.heroku.com/apps/$AppName" -ForegroundColor Yellow
