/*
  # AdaptiveMove - Seed Data

  Seeds:
  - 3 subscription plans (Free, Pro, Elite)
  - 5 gyms in São Paulo / Ribeirão Pires area
*/

-- =====================
-- PLANS SEED
-- =====================
INSERT INTO plans (name, price_monthly, price_yearly, features, is_featured) VALUES
(
  'Free',
  0,
  0,
  '["Acesso ao mapa de academias", "5 treinos/mês no calendário", "Chat IA limitado (10 msg/dia)", "Feed social", "Perfil público"]',
  false
),
(
  'Pro',
  29.90,
  287.04,
  '["Tudo do Free", "Treinos ilimitados no calendário", "Chat IA ilimitado", "Mensagens diretas", "Lembretes avançados de treino", "Estatísticas de progresso"]',
  true
),
(
  'Elite',
  59.90,
  574.08,
  '["Tudo do Pro", "Suporte prioritário", "Análise de progresso avançada", "Badge exclusivo de perfil", "Acesso antecipado a novas funcionalidades", "Personal trainer virtual IA"]',
  false
)
ON CONFLICT DO NOTHING;

-- =====================
-- GYMS SEED (São Paulo / Ribeirão Pires)
-- =====================
INSERT INTO gyms (name, address, latitude, longitude, phone, website, rating, amenities, photos, verified) VALUES
(
  'Academia SmartFit - Paulista',
  'Av. Paulista, 1000 - Bela Vista, São Paulo - SP',
  -23.5637,
  -46.6547,
  '(11) 3145-7800',
  'https://www.smartfit.com.br',
  4.5,
  '["Musculação", "Cardio", "Aulas coletivas", "Vestiários", "Ar condicionado", "Acessível para cadeirantes", "Estacionamento"]',
  '["https://images.pexels.com/photos/1552242/pexels-photo-1552242.jpeg", "https://images.pexels.com/photos/2261477/pexels-photo-2261477.jpeg"]',
  true
),
(
  'Bodytech - Vila Olímpia',
  'R. Funchal, 418 - Vila Olímpia, São Paulo - SP',
  -23.5980,
  -46.6857,
  '(11) 3443-5600',
  'https://www.bodytech.com.br',
  4.7,
  '["Musculação", "Cardio", "Piscina", "Sauna", "Personal Trainer", "Pilates", "Acessível para cadeirantes", "Vestiários premium"]',
  '["https://images.pexels.com/photos/1552249/pexels-photo-1552249.jpeg", "https://images.pexels.com/photos/2261481/pexels-photo-2261481.jpeg"]',
  true
),
(
  'Bio Ritmo - Moema',
  'Av. Ibirapuera, 2907 - Moema, São Paulo - SP',
  -23.6047,
  -46.6668,
  '(11) 5051-4900',
  'https://www.bioritmoacademia.com.br',
  4.3,
  '["Musculação", "Cardio", "Yoga", "Spinning", "Piscina", "Fisioterapia", "Acessível para cadeirantes"]',
  '["https://images.pexels.com/photos/1153369/pexels-photo-1153369.jpeg"]',
  true
),
(
  'Academia Total - Ribeirão Pires',
  'Av. Humberto de Alencar Castelo Branco, 555 - Ribeirão Pires - SP',
  -23.7118,
  -46.4127,
  '(11) 4824-3322',
  null,
  4.1,
  '["Musculação", "Cardio", "Funcional", "Personal Trainer", "Vestiários", "Estacionamento gratuito"]',
  '["https://images.pexels.com/photos/3076509/pexels-photo-3076509.jpeg"]',
  true
),
(
  'Fit Space Inclusivo - Santo André',
  'R. Coronel Oliveira Lima, 1200 - Santo André - SP',
  -23.6661,
  -46.5358,
  '(11) 4433-7788',
  null,
  4.6,
  '["Musculação", "Cardio", "Yoga", "Pilates", "Acessível para cadeirantes", "Rampa de acesso", "Banheiro adaptado", "Personal Trainer inclusivo", "Equipamentos adaptados", "Libras disponível"]',
  '["https://images.pexels.com/photos/4162449/pexels-photo-4162449.jpeg", "https://images.pexels.com/photos/3253501/pexels-photo-3253501.jpeg"]',
  true
)
ON CONFLICT DO NOTHING;
