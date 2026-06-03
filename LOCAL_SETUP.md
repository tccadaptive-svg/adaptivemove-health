# AdaptiveMove - Guia de Desenvolvimento Local

## Início Rápido

A aplicação está configurada para rodar **completamente local** sem dependências de serviços pagos.

### 1. Clonar e instalar
```bash
npm install --legacy-peer-deps
```

### 2. Configurar variáveis de ambiente
```bash
cp .env.example .env
```

Preencha as variáveis Supabase (obrigatório):
```
VITE_SUPABASE_URL=seu-url-supabase
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
```

**Deixe vazias** (opcional):
- `ANTHROPIC_API_KEY` - A IA usará respostas mock
- `STRIPE_SECRET_KEY` - Pagamentos serão simulados
- `STRIPE_WEBHOOK_SECRET` - Webhooks não necessários

### 3. Iniciar desenvolvimento
```bash
npm run dev
```

---

## 🤖 Chat IA (Modo Demo)

Quando `ANTHROPIC_API_KEY` não está configurado:
- O chat funciona normalmente
- Respostas são geradas localmente (simuladas)
- Um banner azul indica "Modo Demo"
- Histórico é salvo no Supabase normalmente

### Ativar Claude Real (Produção)

1. Criar conta em: https://console.anthropic.com
2. Gerar API Key
3. Adicionar ao `.env`:
   ```
   ANTHROPIC_API_KEY=sk-ant-...
   ```
4. Deploy Edge Function:
   ```bash
   supabase functions deploy ai-chat
   ```

---

## 💳 Pagamentos (Modo Demo)

Quando `STRIPE_SECRET_KEY` não está configurado:
- Botões de "Assinar" mostram um alerta
- Clique simula uma atualização de plano (sem débito)
- Um banner laranja indica "Modo Demo"
- Perfil do usuário é atualizado localmente

### Ativar Stripe Real (Produção)

1. Criar conta em: https://dashboard.stripe.com
2. Obter Secret Key e Webhook Secret
3. Adicionar ao `.env`:
   ```
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```
4. Deploy Edge Function:
   ```bash
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

---

## 📁 Arquivos Modificados para Suporte Local

### Frontend
- **`src/pages/AiChatPage.tsx`** - Importa `getMockAiResponse()` quando offline
- **`src/pages/PlansPage.tsx`** - Simula atualização de plano em modo demo
- **`src/lib/mockAi.ts`** - Novo: Respostas mock e delay simulado

### Edge Functions
- **`supabase/functions/ai-chat/index.ts`** - Fallback para mock quando API key ausente
- **`supabase/functions/create-checkout-session/index.ts`** - Retorna resposta demo sem Stripe
- **`supabase/functions/stripe-webhook/index.ts`** - Aceita requests sem validação Stripe

### Configuração
- **`.env.example`** - Novo: Documentação das variáveis opcionais

---

## ✨ Funcionalidades Testáveis Localmente

| Funcionalidade | Sem Config | Com Config | Notas |
|---|---|---|---|
| Registro/Login | ✅ | ✅ | Supabase Auth |
| Perfil | ✅ | ✅ | Upload avatar para Storage |
| Calendário | ✅ | ✅ | CRUD de treinos |
| Mapa | ✅ | ✅ | Leaflet + 5 academias seed |
| Feed Social | ✅ | ✅ | Posts, comentários, likes |
| Mensagens | ✅ | ✅ | Real-time Supabase |
| Chat IA | ✅ Mock | ✅ Real | Respostas mock sem key |
| Planos | ✅ Demo | ✅ Real | Simula pagamento sem key |
| Acessibilidade | ✅ | ✅ | Salvo em DB |
| Admin | ✅ | ✅ | Gerenciar usuários/academias |

---

## 🔧 Troubleshooting

### Erro: "Serviço indisponível"
- Verifique conexão com Supabase
- Confira `VITE_SUPABASE_URL` e `VITE_SUPABASE_ANON_KEY`

### Chat IA não funciona
- Verifique se vê o banner "Modo Demo"
- Sem `ANTHROPIC_API_KEY`, respostas mock aparecem
- Histórico ainda é salvo no Supabase

### Pagamentos não funcionam
- Verifique se vê o alerta de simulação
- Sem `STRIPE_SECRET_KEY`, clique simula upgrade
- Plano é atualizado localmente (sem débito real)

---

## 🚀 Deploy para Produção

1. **Configurar variáveis de ambiente** em seu host (Vercel, Render, etc):
   ```
   VITE_SUPABASE_URL=...
   VITE_SUPABASE_ANON_KEY=...
   ANTHROPIC_API_KEY=sk-ant-...
   STRIPE_SECRET_KEY=sk_live_...
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

2. **Deploy Edge Functions**:
   ```bash
   supabase functions deploy ai-chat
   supabase functions deploy create-checkout-session
   supabase functions deploy stripe-webhook
   ```

3. **Build e push**:
   ```bash
   npm run build
   git push
   ```

---

## 📞 Suporte

- **Documentação Supabase**: https://supabase.com/docs
- **Antropic Claude**: https://console.anthropic.com
- **Stripe**: https://stripe.com/docs
- **Leaflet Map**: https://leafletjs.com/
