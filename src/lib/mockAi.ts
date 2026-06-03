/*
  Mock responses for local development without Claude API
*/

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

**Quarta-feira**: Descanso

**Quinta-feira**: Musculação
- Agachamento: 3x8
- Leg press: 3x10
- Cadeira extensora: 3x12

**Sexta-feira**: Cardio
- Ciclismo: 30 minutos
- Alongamento: 10 minutos

**Sábado**: Funcional
- Exercícios com peso corporal: 30 minutos

**Domingo**: Descanso

Lembre-se de se aquecer antes e alongar após cada sessão!`,
    `**Treino para todas as semanas**

Comece com 3 dias na semana, intercalando dias de descanso. Aumente gradualmente a intensidade conforme se adaptar.`,
  ],
  'exercício': [
    `**Exercícios para iniciantes:**

1. **Flexão** - Trabalha peito, ombros e tríceps
2. **Agachamento** - Fortalece pernas
3. **Prancha** - Core e estabilidade
4. **Rosca direta** - Bíceps
5. **Supino** - Peito
6. **Corrida** - Cardio geral

Faça 3 séries de 10 repetições cada.`,
  ],
  'alimentação': [
    `**Dicas de nutrição:**

- Proteína em cada refeição (frango, peixe, ovos)
- Frutas e vegetais variados
- Carboidratos complexos (arroz integral, batata doce)
- Hidrate-se: 2-3 litros de água por dia
- Evite ultraprocessados
- Coma devagar e mastigue bem

Consulte um nutricionista para um plano personalizado!`,
  ],
  'acessível': [
    `**Treinos Acessíveis:**

- Exercícios em cadeira (musculação sentado)
- Fisioterapia com bola suíça
- Natação e hidroginástica
- Yoga adaptado
- Pilates para mobilidade

No AdaptiveMove, você encontra academias com estrutura acessível!`,
  ],
};

export function getMockAiResponse(userMessage: string): string {
  const lowerMsg = userMessage.toLowerCase();

  for (const [keyword, responses] of Object.entries(MOCK_RESPONSES)) {
    if (lowerMsg.includes(keyword)) {
      return responses[Math.floor(Math.random() * responses.length)];
    }
  }

  return `Ótima pergunta! Aqui estão algumas dicas:

- Comece devagar e aumente gradualmente
- Consistência é mais importante que intensidade
- Ouça seu corpo e respeite seus limites
- Durma bem e mantenha uma boa alimentação
- Se possível, procure um treinador profissional

Como posso te ajudar mais?`;
}

export function generateLoadingDelay(): number {
  // Simula latência natural (800-1500ms)
  return 800 + Math.random() * 700;
}
