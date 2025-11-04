# 📋 TAREFAS PENDENTES - ANCHORVIEW SAAS

## 🔴 URGENTE - Problemas Críticos

### 1. ✅ Corrigir Conexão do Banco de Dados
**Problema**: Prisma tentando conectar em `db:5432` ao invés de `185.215.165.19:8002`
- [ ] Executar `npx prisma generate` para regenerar cliente
- [ ] Verificar se DATABASE_URL está sendo lida corretamente
- [ ] Testar conexão manual com PostgreSQL
- [ ] Confirmar que dados estão sendo salvos/carregados do banco

### 2. ✅ Navegação Direta para Ponto no Teste
**Problema**: Ao clicar "Realizar Teste" está indo para seleção de ponto ao invés do ponto específico
- [ ] Corrigir rota para passar pointId como parâmetro
- [ ] Implementar redirecionamento direto: `/tester?pointId=POINT_ID`
- [ ] Auto-selecionar o ponto correto na interface de teste
- [ ] Validar se o ponto existe antes de carregar

### 3. ✅ Instalar Mercado Pago SDK
**Problema**: Dependência `mercadopago` não está instalada
- [ ] Executar `npm install mercadopago`
- [ ] Verificar se imports estão funcionando
- [ ] Testar integração com checkout

## 🟡 FUNCIONALIDADES FALTANTES

### 4. Sistema de Upload de Arquivos
- [ ] Implementar `/api/files/upload`
- [ ] Suporte para upload de plantas baixas (PNG, JPG, PDF, DWG)
- [ ] Sistema de armazenamento em nuvem (AWS S3 ou similar)
- [ ] Otimização de imagens
- [ ] Visualização de DWG (converter para PNG/SVG)

### 5. Sistema de Notificações
- [ ] API `/api/notifications/`
- [ ] Push notifications para PWA
- [ ] Notificações de lembretes de inspeção
- [ ] Alertas de pagamentos/vencimentos
- [ ] Status de sincronização offline

### 6. APIs de Sincronização PostgreSQL
- [ ] `/api/sync/anchor-points` - Sincronizar pontos do localStorage
- [ ] `/api/sync/anchor-tests` - Sincronizar testes do localStorage  
- [ ] Background sync automático
- [ ] Resolução de conflitos
- [ ] Status de sync por item

### 7. Sistema de Busca Avançada
- [ ] `/api/search` com filtros
- [ ] Busca por texto em projetos, pontos, testes
- [ ] Filtros por data, status, local, usuário
- [ ] Histórico de buscas
- [ ] Busca com autocomplete

## 🟢 MELHORIAS NECESSÁRIAS

### 8. Suporte a DWG
- [ ] Visualização de arquivos DWG
- [ ] Conversão DWG -> PNG/SVG no servidor
- [ ] Biblioteca para parsing de DWG
- [ ] Cache de conversões

### 9. Correção de UI/UX
- [ ] Formato consistente de datas (dd/mm/yyyy)
- [ ] Validação de formulários
- [ ] Estados de loading melhorados
- [ ] Feedback visual para ações

### 10. Otimizações PWA
- [ ] Cache de imagens offline
- [ ] Background sync mais robusto
- [ ] Compressão de dados localStorage
- [ ] Cleanup automático de dados antigos

### 11. Relatórios Avançados
- [ ] Templates customizáveis
- [ ] Gráficos e dashboards
- [ ] Exportação para diferentes formatos
- [ ] Assinatura digital nos PDFs

### 12. Multi-idioma
- [ ] Suporte a inglês/espanhol
- [ ] Formatação de datas/números por região
- [ ] Configuração de idioma por usuário

### 13. Auditoria e Logs
- [ ] Log de todas as ações dos usuários
- [ ] Histórico de mudanças em projetos
- [ ] Rastreabilidade completa
- [ ] Dashboard de atividades

### 14. Integração com APIs Externas
- [ ] CEP para autocompletar endereços
- [ ] Mapas para localização de obras
- [ ] APIs de documentos fiscais

### 15. Performance e Monitoramento
- [ ] Métricas de performance
- [ ] Monitoramento de erros (Sentry)
- [ ] Analytics de uso
- [ ] Otimização de queries

## 📊 PRIORIDADES

### Sprint 1 (Crítico - Esta Semana)
1. Corrigir conexão do banco PostgreSQL
2. Implementar navegação direta para pontos
3. Instalar SDK Mercado Pago

### Sprint 2 (Alta - Próxima Semana)  
4. Sistema de upload de arquivos
5. APIs de sincronização PostgreSQL
6. Sistema de notificações básico

### Sprint 3 (Média - Em 2 semanas)
7. Busca avançada
8. Suporte a DWG
9. Melhorias de UI/UX

### Sprint 4 (Baixa - Em 1 mês)
10-15. Demais funcionalidades

---

**📝 Atualizado em**: 19/08/2025
**🔄 Status**: Em andamento