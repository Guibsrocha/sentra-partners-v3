# Sentra Partners - TODO

## ✅ Concluído e pronto para deploy
- [x] Corrigir loop infinito do job de limpeza (cron mensal)
- [x] Corrigir conversão de data no job de sincronização
- [x] Corrigir nome de tabela no job de contas inativas
- [x] Criar tabela notification_history no banco
- [x] Implementar salvamento automático de notificações no histórico
- [x] Modificar métodos principais (trade aberto/fechado, teste, relatório)
- [x] Implementar timezone dinâmico no calendário
- [x] Remover labels BR/US fixos do calendário
- [x] Adicionar seletor de timezone nas configurações (16 opções)
- [x] Corrigir notificações duplicadas no teste
- [x] Remover nextweek.xml que não existe mais
- [x] Adicionar deduplicação de notificações por ticket (já existe)

## 🧪 Para testar após deploy
- [ ] Enviar notificação de teste e verificar se aparece no histórico
- [ ] Verificar se calendário mostra eventos corretamente
- [ ] Testar mudança de timezone nas configurações
- [ ] Confirmar que não há notificações duplicadas

## 📝 Observações
- Sistema de deduplicação já implementado em mt4-lite.ts (60s cooldown)
- Histórico salva automaticamente via sendMessageWithHistory
- Calendário atualiza a cada 5 minutos automaticamente

## 🚨 URGENTE - Problemas reportados
- [x] Corrigir notificações Telegram atrasadas (timeout 10s)
- [x] Corrigir notificações duplicadas (deduplicação 30s)
- [x] Investigar por que deduplicação não está funcionando (5min -> 30s)
- [x] Otimizar velocidade de envio de notificações (timeout + abort controller)

## 🔥 CRÍTICO - Histórico não funciona
- [ ] Notificações enviadas mas não aparecem no histórico
- [ ] Verificar se saveNotificationHistory está funcionando
- [ ] Verificar se há erro ao inserir no banco
- [ ] Testar endpoint getNotificationHistory
