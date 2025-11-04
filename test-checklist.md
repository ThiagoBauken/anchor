# ✅ CHECKLIST DE TESTE COMPLETO - AnchorView

## 🔧 **PREPARAÇÃO**
```bash
# 1. Limpar cache
clear-cache.cmd

# 2. Rodar projeto  
npm run dev

# 3. Acessar: http://localhost:9002
```

## 🔐 **AUTENTICAÇÃO**
- [ ] **Login:** `admin@anchorview.com` / `admin123`
- [ ] **Verificar:** Nome do usuário aparece (Super Administrador)
- [ ] **Verificar:** Role = superadmin
- [ ] **Verificar:** Empresa = AnchorView Admin

## 📁 **PROJETOS**
- [ ] **Criar projeto:** Nome "Teste Projeto 1"
- [ ] **Upload planta:** Testar upload de imagem
- [ ] **Editar projeto:** Alterar nome para "Projeto Editado"
- [ ] **Visualizar:** Projeto aparece na lista
- [ ] **Selecionar:** Projeto ativo muda interface

## 📍 **LOCALIZAÇÕES**
- [ ] **Criar localização:** Nome "Setor A"
- [ ] **Escolher formato:** Círculo, quadrado, X, +
- [ ] **Editar localização:** Alterar nome
- [ ] **Filtrar por localização:** Dropdown funciona
- [ ] **Deletar localização:** Confirmar exclusão

## ⚓ **PONTOS DE ANCORAGEM**
- [ ] **Adicionar ponto:** Clicar na planta baixa
- [ ] **Preencher dados:** Número, tipo, marca, modelo
- [ ] **Capturar foto:** Usar câmera/upload
- [ ] **Definir localização:** Escolher setor
- [ ] **Salvar ponto:** Aparecer na lista
- [ ] **Editar ponto:** Alterar dados
- [ ] **Arquivar ponto:** Mover para arquivados

## 🧪 **TESTES**
- [ ] **Criar teste:** Selecionar ponto
- [ ] **Preencher:** Resultado, carga, tempo, técnico
- [ ] **Resultado:** Aprovado/Reprovado
- [ ] **Fotos teste:** Antes e depois
- [ ] **Observações:** Campo de texto
- [ ] **Salvar teste:** Aparecer na lista
- [ ] **Status ponto:** Atualizar automaticamente

## 👥 **USUÁRIOS**
- [ ] **Gerar convite:** Criar link de convite
- [ ] **Definir papel:** Admin ou usuário
- [ ] **Copiar link:** Funcionar no clipboard
- [ ] **Lista convites:** Visualizar pendentes
- [ ] **Adicionar local:** Usuário offline
- [ ] **Gerenciar usuários:** Ver lista ativa

## 🔄 **SINCRONIZAÇÃO**
- [ ] **Status online:** Indicador verde
- [ ] **Sync manual:** Botão sincronizar
- [ ] **Contadores:** 0 pendentes após sync
- [ ] **Background sync:** Automático a cada 5min
- [ ] **Offline mode:** Funcionar sem internet

## 📊 **EXPORTAÇÃO**
- [ ] **Excel:** Download arquivo .xlsx
- [ ] **PDF:** Download relatório .pdf  
- [ ] **JSON:** Download dados .json
- [ ] **Conteúdo:** Verificar dados corretos

## ⚙️ **CONFIGURAÇÕES**
- [ ] **Acessar página:** /configuracoes
- [ ] **Alterar tema:** Claro/escuro
- [ ] **Configurar sync:** Intervalo automático
- [ ] **Backup settings:** Configurações
- [ ] **Salvar mudanças:** Persistir

## 🔧 **ADMIN** (Super Admin)
- [ ] **Painel admin:** /admin
- [ ] **Métricas:** Visualizar estatísticas
- [ ] **Usuários:** Gerenciar todos
- [ ] **Backups:** Configurar automático
- [ ] **Logs:** Auditoria de ações
- [ ] **Sistema:** Status geral

## 🚨 **TESTES DE ERRO**
- [ ] **Campos vazios:** Validação funciona
- [ ] **Upload inválido:** Rejeitar formatos
- [ ] **Ponto duplicado:** Mesmo número/local
- [ ] **Dados inválidos:** Sanitização
- [ ] **Offline:** Graceful degradation

## 📱 **RESPONSIVIDADE**
- [ ] **Desktop:** 1920x1080
- [ ] **Tablet:** 768x1024  
- [ ] **Mobile:** 375x667
- [ ] **Touch:** Gestos funcionam
- [ ] **PWA:** Instalar como app

## 🎯 **RESULTADO ESPERADO**
✅ **100% das funcionalidades funcionando**
✅ **Zero erros no console**
✅ **Sincronização online estável**
✅ **Interface responsiva completa**

---

## 🐛 **ERROS ENCONTRADOS:**
_(Anote aqui qualquer problema durante o teste)_

- [ ] **Bug 1:** Descrição
- [ ] **Bug 2:** Descrição
- [ ] **Bug 3:** Descrição

---

## ✅ **STATUS FINAL:**
- **Data teste:** ___________
- **Versão:** AnchorView v1.0
- **Status:** ✅ APROVADO / ❌ REPROVADO
- **Observações:** ________________