# ✅ Checklist de Teste Local - AnchorView

Use este checklist para validar que tudo está funcionando antes de fazer deploy.

---

## 📋 Preparação do Ambiente

- [ ] Node.js instalado (v18+) → `node --version`
- [ ] pnpm instalado → `pnpm --version` (ou npm)
- [ ] Dependências instaladas → `pnpm install`
- [ ] Arquivo `.env` configurado
- [ ] Banco PostgreSQL acessível (Contabo: 185.215.165.19:8002)

---

## 🚀 Teste de Desenvolvimento

### 1. Iniciar Servidor
- [ ] Executar `START.bat` ou `pnpm dev`
- [ ] Servidor inicia sem erros
- [ ] Console mostra: `✓ Ready in X.Xs`
- [ ] Acessa `http://localhost:9002` sem erros 404/500

### 2. Tela de Login/Registro
- [ ] Página carrega corretamente
- [ ] Formulário de registro aparece
- [ ] Botão "Criar Conta" visível

### 3. Criar Conta (Primeira vez)
- [ ] Preencher formulário:
  - Nome da Empresa: `Empresa Teste`
  - Nome: `Admin Local`
  - Email: `admin@local.test`
  - Senha: `teste123`
- [ ] Clicar "Criar Conta"
- [ ] Login automático funciona
- [ ] Redireciona para dashboard

### 4. Dashboard Vazio
- [ ] Página carrega sem erros
- [ ] Mostra mensagem "Criar Primeiro Projeto"
- [ ] Abas visíveis: Dashboard, Pontos, Testes, Relatórios

### 5. Criar Projeto
- [ ] Clicar "Criar Primeiro Projeto"
- [ ] Modal abre
- [ ] Preencher:
  - Nome: `Edifício Solar - Teste`
  - Localização: `São Paulo`
  - Upload planta baixa (qualquer imagem)
- [ ] Clicar "Salvar"
- [ ] Projeto aparece na lista
- [ ] Card do projeto visível

### 6. Visualizar Projeto
- [ ] Clicar no card do projeto
- [ ] Planta baixa carrega
- [ ] Aba "Pontos" ativa
- [ ] Mensagem "Nenhum ponto criado"

### 7. Adicionar Ponto de Ancoragem
- [ ] Clicar em qualquer lugar da planta baixa
- [ ] Marcador roxo aparece
- [ ] Modal de criação abre
- [ ] Preencher:
  - Número: `P1`
  - Localização/Progressão: `Horizontal`
  - Tipo Equipamento: `Olhal`
  - Número Lacre: `12345`
  - Data Instalação: Hoje
  - Frequência: `12 meses`
- [ ] Clicar "Salvar"
- [ ] Modal fecha
- [ ] Ponto aparece na planta
- [ ] Card do ponto aparece na lista lateral

### 8. Editar Ponto
- [ ] Clicar no marcador na planta
- [ ] Modal de detalhes abre
- [ ] Informações corretas (P1, Horizontal, etc.)
- [ ] Clicar "Editar"
- [ ] Modal de edição abre
- [ ] Alterar Observações: `Teste de edição`
- [ ] Salvar
- [ ] Observação atualizada

### 9. Capturar Foto (Desktop)
- [ ] No modal de detalhes do ponto
- [ ] Clicar "Capturar Foto do Ponto"
- [ ] Navegador pede permissão de câmera
- [ ] Permitir acesso
- [ ] Câmera ativa (ou seletor de arquivo)
- [ ] Tirar foto ou escolher arquivo
- [ ] Preview da foto aparece
- [ ] Salvar
- [ ] Foto aparece no card do ponto

### 10. Criar Teste de Tração
- [ ] Ir para aba "Testes"
- [ ] Clicar "Novo Teste"
- [ ] Preencher:
  - Selecionar Ponto: `P1`
  - Resultado: `Aprovado`
  - Carga: `1500 kg`
  - Tempo: `10 minutos`
  - Técnico: `João Silva`
- [ ] Salvar
- [ ] Teste aparece na lista
- [ ] Status do ponto atualiza para "Testado"

### 11. Exportar Relatórios
- [ ] Ir para aba "Relatórios"
- [ ] Seção "Exportação de Dados" visível
- [ ] Clicar "Exportar Excel"
- [ ] Arquivo `.xlsx` faz download
- [ ] Abrir Excel → Dados corretos (projeto, ponto, teste)
- [ ] Clicar "Exportar PDF" (opcional)
- [ ] PDF faz download

---

## 🗄️ Teste de Banco de Dados

### 12. Verificar Dados Salvos
- [ ] Abrir terminal/cmd
- [ ] Conectar ao banco:
  ```bash
  psql -h 185.215.165.19 -p 8002 -U privado -d privado
  # Senha: privado12!
  ```
- [ ] Dentro do psql:
  ```sql
  -- Ver usuário criado
  SELECT id, name, email FROM "User";

  -- Ver projeto criado
  SELECT id, name, location FROM "Project";

  -- Ver ponto criado
  SELECT id, "numeroPonto", localizacao, "numeroLacre" FROM "AnchorPoint";

  -- Ver teste criado
  SELECT id, resultado, carga, tecnico FROM "AnchorTest";

  -- Sair
  \q
  ```
- [ ] Todos dados aparecem corretamente

### 13. Verificar localStorage
- [ ] Abrir DevTools (F12)
- [ ] Ir para Application → Local Storage
- [ ] Verificar chaves:
  - `anchorPoints` → JSON com array de pontos
  - `anchorTests` → JSON com array de testes
  - `currentUser` → Dados do usuário logado
  - `currentProject` → ID do projeto selecionado

---

## 📱 Teste no Celular (Opcional)

### 14. Preparar Acesso Externo
- [ ] Descobrir IP do PC:
  ```bash
  ipconfig
  # Anotar IPv4 (ex: 192.168.1.100)
  ```
- [ ] Editar `package.json`:
  ```json
  "dev": "next dev --turbopack -p 9002 -H 0.0.0.0"
  ```
- [ ] Restart servidor

### 15. Acessar do Celular
- [ ] Conectar celular na mesma rede WiFi
- [ ] Abrir navegador
- [ ] Acessar `http://192.168.1.100:9002` (trocar pelo seu IP)
- [ ] App carrega
- [ ] Login funciona
- [ ] Navegar para projeto

### 16. Capturar Foto com Câmera
- [ ] No celular, clicar em ponto
- [ ] "Capturar Foto do Ponto"
- [ ] Câmera do celular ativa
- [ ] Tirar foto real
- [ ] Preview aparece
- [ ] Salvar
- [ ] Foto salva no ponto

### 17. Testar PWA (Opcional)
- [ ] No celular (Chrome/Safari)
- [ ] Menu → "Adicionar à tela inicial"
- [ ] Ícone AnchorView aparece na home
- [ ] Abrir via ícone → Abre como app nativo
- [ ] Funciona offline (desligar WiFi e navegar)

---

## 🏗️ Build de Produção

### 18. Build Local
- [ ] Executar `BUILD.bat` ou `pnpm build`
- [ ] Build completa sem erros críticos
- [ ] Pasta `.next` criada
- [ ] Arquivos otimizados gerados

### 19. Testar Build de Produção
- [ ] Executar `pnpm start`
- [ ] Servidor inicia na porta 9002
- [ ] Acessar `http://localhost:9002`
- [ ] App carrega (versão otimizada)
- [ ] Login funciona
- [ ] Funcionalidades principais funcionam

### 20. Verificar Service Worker
- [ ] DevTools → Application → Service Workers
- [ ] `sw.js` aparece como "activated"
- [ ] Status: "Running"

### 21. Testar Modo Offline (Build)
- [ ] DevTools → Network → Marcar "Offline"
- [ ] Recarregar página → App carrega do cache
- [ ] Navegar entre páginas → Funciona
- [ ] Capturar foto offline → Salva em IndexedDB
- [ ] Voltar online → Sincronização automática

---

## 🔍 Verificar Console

### 22. Sem Erros Críticos
- [ ] Abrir DevTools (F12) → Console
- [ ] Nenhum erro vermelho crítico
- [ ] Avisos (warnings) são aceitáveis
- [ ] Nenhuma mensagem de "Failed to fetch"

### 23. Logs Esperados
- [ ] `[Auth] User logged in`
- [ ] `[Data] Project loaded`
- [ ] `[Sync] Data synchronized`
- [ ] `[SW] Service Worker registered`

---

## ✅ Checklist Final

Antes de fazer deploy, certifique-se:

- [ ] **Funcionalidades principais:** Login, Projeto, Ponto, Teste, Foto ✅
- [ ] **Banco de dados:** Dados salvam corretamente ✅
- [ ] **Build:** Produção funciona sem erros ✅
- [ ] **Mobile:** App funciona no celular (opcional) ✅
- [ ] **PWA:** Service Worker registra (build) ✅
- [ ] **Offline:** Modo offline funciona (build) ✅
- [ ] **Exportação:** Excel/PDF funcionam ✅
- [ ] **Console:** Sem erros críticos ✅
- [ ] **Performance:** App carrega em < 3 segundos ✅

---

## 🎉 Tudo Funcionando?

Se todos os itens acima estão ✅, você está pronto para:

1. **Deploy em produção:** [DEPLOY_EASYPANEL.md](DEPLOY_EASYPANEL.md)
2. **Aplicar melhorias mobile:** [CORRECOES_RESPONSIVIDADE.md](CORRECOES_RESPONSIVIDADE.md)

---

## ❌ Encontrou Problemas?

### Erro de Conexão com Banco
```bash
# Verificar conectividade
psql -h 185.215.165.19 -p 8002 -U privado -d privado
# Se não conectar, verificar firewall/VPN
```

### Porta 9002 Ocupada
```bash
netstat -ano | findstr :9002
taskkill /PID <numero> /F
```

### Next.js Não Atualiza
```bash
# Limpar cache
rm -rf .next
pnpm dev
```

### TypeScript Errors
```bash
pnpm prisma generate
# VSCode: Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Build Falha
```bash
# Verificar tipos
pnpm typecheck

# Ver erro específico
pnpm build --debug
```

---

**📊 Progresso:** ___/23 seções completas

**Tempo estimado:** 30-45 minutos para checklist completo

**Prioridade mínima para deploy:**
- Seções 1-11 (Funcionalidades principais) ✅
- Seção 18-19 (Build de produção) ✅
