# ⚡ QUICK START

## 3 Passos para Começar

### 1️⃣ Extrair e Instalar
```bash
unzip adaptivemove-final.zip
cd project
npm install --legacy-peer-deps
```

### 2️⃣ Configurar Variáveis
```bash
cp .env.example .env
# Edite .env e preencha:
VITE_SUPABASE_URL=https://seu-projeto.supabase.co
VITE_SUPABASE_ANON_KEY=sua-chave-anonima
# Deixe as outras em branco (ANTHROPIC_API_KEY, STRIPE_SECRET_KEY, etc)
```

### 3️⃣ Executar
```bash
npm run dev
# Abra http://localhost:5173
```

---

## ✅ Tudo Funciona Sem Keys Pagas

- 🤖 Chat IA → Respostas mock
- 💳 Pagamentos → Simulados
- 💾 Histórico → Salvo em Supabase
- ✨ Tudo mais → 100% funcional

---

## 📂 Arquivos Importantes

| Arquivo | Uso |
|---------|-----|
| `.env.example` | Template de variáveis |
| `LOCAL_SETUP.md` | Guia completo |
| `SECURITY_FIXES.md` | Detalhes de segurança |
| `FILES_CHANGED.md` | O que foi modificado |
| `src/lib/mockAi.ts` | Respostas mock IA |

---

## 🚀 Comandos Úteis

```bash
npm run dev      # Dev server
npm run build    # Build prod
npm run preview  # Preview build
npm run lint     # ESLint
```

---

## 🔐 Para Produção

Adicione estas variáveis no seu host:

```bash
# Claude real (opcional)
ANTHROPIC_API_KEY=sk-ant-...

# Stripe real (opcional)
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

---

## 📞 Dúvidas?

Leia `LOCAL_SETUP.md` para mais informações.

---

**Aproveita o projeto! 🎉**
