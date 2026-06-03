import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": Deno.env.get("ALLOWED_ORIGIN") || "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

// Mock responses for development mode
const MOCK_RESPONSES: Record<string, string[]> = {
  'treino': [
    `**Plano de treino semanal (Iniciante)**

**Segunda-feira**: Musculação
- Supino: 3x8 repetições
- Rosca direta: 3x10
- Descer banco: 3x10

**Terça-feira**: Cardio
- Corrida leve: 20 minutos
- Caminhada rápida: 10 minutos

Lembre-se de se aquecer antes e alongar após cada sessão!`,
  ],
  'exercício': [
    `**Exercícios para iniciantes:**

1. Flexão - Trabalha peito, ombros e tríceps
2. Agachamento - Fortalece pernas
3. Prancha - Core e estabilidade

Faça 3 séries de 10 repetições cada.`,
  ],
  'alimentação': [
    `**Dicas de nutrição:**

- Proteína em cada refeição
- Frutas e vegetais variados
- Hidrate-se: 2-3 litros de água por dia

Consulte um nutricionista para um plano personalizado!`,
  ],
};

function getMockResponse(message: string): string {
  const lower = message.toLowerCase();
  for (const [keyword, responses] of Object.entries(MOCK_RESPONSES)) {
    if (lower.includes(keyword)) {
      return responses[0];
    }
  }
  return `Ótima pergunta! Aqui estão algumas dicas gerais sobre fitness e bem-estar. Como posso te ajudar mais?`;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const { message } = await req.json();

    // Check if Claude API key is configured
    const anthropicApiKey = Deno.env.get("ANTHROPIC_API_KEY");

    if (!anthropicApiKey) {
      // Use mock responses for local development
      const mockResponse = getMockResponse(message);
      return new Response(
        JSON.stringify({ response: `[DEMO MODE] ${mockResponse}` }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Production: call Claude API
    const SYSTEM_PROMPT = `Você é o assistente virtual da AdaptiveMove, uma plataforma de academia focada em saúde, bem-estar e inclusão (ODS 3). Responda em português brasileiro, seja motivador, acolhedor, e especialista em fitness e acessibilidade. Nunca recomende medicamentos ou diagnósticos médicos.`;

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": anthropicApiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5",
        max_tokens: 1024,
        system: SYSTEM_PROMPT,
        messages: [{ role: "user", content: message }],
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      return new Response(
        JSON.stringify({ response: "Erro ao processar sua mensagem." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const reply = data.content?.[0]?.text || "Não consegui gerar uma resposta.";

    return new Response(
      JSON.stringify({ response: reply }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ response: "Erro interno ao processar sua mensagem." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

