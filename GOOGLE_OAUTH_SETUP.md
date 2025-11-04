# 🔐 Configuração do Google OAuth - AnchorView

## ✅ Implementação Completa

O sistema de autenticação com Google OAuth foi implementado com sucesso! Agora você tem:

- ✅ NextAuth.js instalado e configurado
- ✅ Página de login com botão "Continuar com Google"
- ✅ Página de registro com botão "Continuar com Google"
- ✅ Schema do banco atualizado (Account, Session, VerificationToken)
- ✅ SessionProvider integrado ao layout
- ✅ JWT Secret configurado

## 📋 Próximos Passos: Configurar Google Cloud Console

Para ativar o login com Google, você precisa configurar as credenciais no Google Cloud:

### 1. Criar Projeto no Google Cloud Console

1. Acesse: https://console.cloud.google.com/
2. Crie um novo projeto ou selecione um existente
3. Nome sugerido: "AnchorView Auth"

### 2. Configurar OAuth Consent Screen

1. Navegue para: **APIs & Services** > **OAuth consent screen**
2. Selecione **External** (para permitir qualquer conta Google)
3. Preencha:
   - **App name**: AnchorView
   - **User support email**: seu@email.com
   - **Developer contact**: seu@email.com
4. Em **Scopes**, adicione:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
5. Em **Test users** (modo desenvolvimento), adicione seus emails para teste
6. Clique em **Save and Continue**

### 3. Criar Credenciais OAuth 2.0

1. Navegue para: **APIs & Services** > **Credentials**
2. Clique em **+ CREATE CREDENTIALS** > **OAuth client ID**
3. Selecione **Web application**
4. Preencha:
   - **Name**: AnchorView Web Client
   - **Authorized JavaScript origins**:
     - `http://localhost:9002`
     - `https://seu-dominio.com` (produção)
   - **Authorized redirect URIs**:
     - `http://localhost:9002/api/auth/callback/google`
     - `https://seu-dominio.com/api/auth/callback/google` (produção)
5. Clique em **CREATE**
6. Copie o **Client ID** e **Client Secret**

### 4. Atualizar .env com as Credenciais

Abra o arquivo `.env` e substitua os valores:

```bash
# Google OAuth Credentials
GOOGLE_CLIENT_ID=seu-client-id-aqui.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=seu-client-secret-aqui
```

### 5. Reiniciar o Servidor

```bash
npm run dev
```

## 🧪 Como Testar

### Teste 1: Login com Google
1. Acesse: `http://localhost:9002/auth/login`
2. Clique em **"Continuar com Google"**
3. Selecione sua conta Google
4. Aceite as permissões
5. Você será redirecionado para `/app`

### Teste 2: Registro com Google
1. Acesse: `http://localhost:9002/auth/register`
2. Clique em **"Continuar com Google"**
3. Selecione sua conta Google
4. Complete o setup da empresa (se necessário)
5. Você será redirecionado para `/app`

### Teste 3: Login com Email/Senha (ainda funciona!)
1. Acesse: `http://localhost:9002/auth/login`
2. Use email e senha cadastrados
3. Clique em **"Entrar com Email"**
4. Login funcionando normalmente

## 🔄 Fluxo de Autenticação

### Para Usuários Novos (Google)
```
1. Clica "Continuar com Google"
2. Google OAuth → NextAuth
3. Sistema verifica se email existe no BD
4. Se não existe: Redireciona para /auth/setup (configurar empresa)
5. Se existe: Login automático → /app
```

### Para Usuários Existentes (Google)
```
1. Clica "Continuar com Google"
2. Google OAuth → NextAuth
3. Sistema encontra usuário pelo email
4. Atualiza avatar do Google
5. Login automático → /app
```

### Email/Senha (Compatibilidade mantida)
```
1. Digita email e senha
2. NextAuth valida com bcrypt
3. Login → /app
```

## 🛡️ Segurança

- ✅ NEXTAUTH_SECRET: Gerado com 256 bits de entropia
- ✅ JWT com expiração de 7 dias
- ✅ Cookies httpOnly (proteção contra XSS)
- ✅ CSRF protection automático do NextAuth
- ✅ Passwords hasheados com bcrypt (compatibilidade mantida)

## 🚀 Produção

Para deploy em produção:

1. **Atualize o .env**:
```bash
NEXTAUTH_URL=https://seu-dominio.com
```

2. **Adicione domínio no Google Cloud Console**:
   - Authorized JavaScript origins: `https://seu-dominio.com`
   - Authorized redirect URIs: `https://seu-dominio.com/api/auth/callback/google`

3. **Publique o OAuth App**:
   - No Google Cloud Console
   - OAuth consent screen > **PUBLISH APP**
   - Isso permite qualquer usuário Google fazer login

## 📊 Dados Armazenados

Quando um usuário faz login com Google, o sistema armazena:

**Tabela User**:
- `email`: Email do Google
- `name`: Nome do Google
- `image`: Foto de perfil do Google
- `emailVerified`: Data de verificação
- `password`: NULL (Google OAuth não usa senha)

**Tabela Account**:
- `provider`: "google"
- `providerAccountId`: ID único do Google
- `access_token`: Token de acesso (renovável)
- `refresh_token`: Token de refresh
- `expires_at`: Expiração do token

**Tabela Session**:
- `sessionToken`: Token único da sessão
- `userId`: ID do usuário
- `expires`: Data de expiração (7 dias)

## 🆘 Troubleshooting

### Erro: "redirect_uri_mismatch"
**Solução**: Verifique se a URL de callback está exatamente igual no Google Cloud Console e no código.

### Erro: "access_blocked"
**Solução**: Adicione seu email como "Test user" no OAuth consent screen (modo desenvolvimento).

### Google não redireciona de volta
**Solução**: Verifique se `NEXTAUTH_URL` está correto no .env.

### Erro: "Configuration"
**Solução**: Verifique se `GOOGLE_CLIENT_ID` e `GOOGLE_CLIENT_SECRET` estão corretos.

## 📚 Referências

- [NextAuth.js Docs](https://next-auth.js.org/)
- [Google OAuth Setup](https://next-auth.js.org/providers/google)
- [Google Cloud Console](https://console.cloud.google.com/)

---

**Status**: ✅ Implementação completa - Pronto para configurar credenciais do Google!
