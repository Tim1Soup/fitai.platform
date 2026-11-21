import { mockWorkouts } from '../data/mockData';

// Конфигурация будущего подключения к локальной LLM (Ollama / LM Studio)
export const LLM_CONFIG = {
  mode: 'mock', // 'mock' | 'ollama' | 'lmstudio'
  endpoint: 'http://localhost:11434/v1/chat/completions', // для LM Studio: http://localhost:1234/v1/chat/completions
  model: 'qwen2.5:7b',
};

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

export const fetchWorkouts = async () => {
  await delay(250);
  return mockWorkouts;
};

export const fetchWorkoutById = async (id) => {
  await delay(180);
  return mockWorkouts.find((w) => w.id === id) || null;
};

// Поиск релевантных упражнений в базе знаний (имитация RAG-ретривера)
const retrieveRelevantWorkouts = (query) => {
  const tokens = query
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, '')
    .split(/\s+/)
    .filter((t) => t.length > 2);

  if (tokens.length === 0) return [];

  return mockWorkouts
    .map((workout) => {
      const searchable = [
        workout.name,
        workout.category,
        ...workout.muscles,
        ...workout.equipment,
        ...workout.goals,
      ]
        .join(' ')
        .toLowerCase();

      const score = tokens.reduce(
        (acc, token) => (searchable.includes(token) ? acc + 1 : acc),
        0
      );
      return { workout, score };
    })
    .filter((item) => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.workout);
};

export const askCoach = async (query) => {
  const matchedSources = retrieveRelevantWorkouts(query);

  // Готовый блок для локальной модели (Ollama / LM Studio)
  if (LLM_CONFIG.mode !== 'mock') {
    const contextText =
      matchedSources.length > 0
        ? matchedSources
            .map(
              (w) =>
                `- ${w.name} (${w.category}, ${w.setsReps}): мышцы — ${w.muscles.join(', ')}. Ошибки: ${w.mistakes.join('; ')}`
            )
            .join('\n')
        : 'Прямых совпадений в локальной базе не найдено, ответь как опытный фитнес-тренер.';

    const response = await fetch(LLM_CONFIG.endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: LLM_CONFIG.model,
        messages: [
          {
            role: 'system',
            content: `Ты — персональный ИИ-тренер FitAI. Отвечай структурированно в формате Markdown. Опирайся на данные из базы знаний:\n${contextText}`,
          },
          { role: 'user', content: query },
        ],
        temperature: 0.4,
      }),
    });

    const data = await response.json();
    return {
      text: data.choices?.[0]?.message?.content || 'Не удалось получить ответ от модели.',
      sources: matchedSources,
    };
  }

  // Демо-режим (Mock RAG)
  await delay(750);

  if (matchedSources.length > 0) {
    const listMarkdown = matchedSources
      .map(
        (w, idx) =>
          `${idx + 1}. **${w.name}** (${w.category}) — режим \`${w.setsReps}\`\n   *Целевые мышцы:* ${w.muscles.join(', ')}.\n   *На что обратить внимание:* ${w.mistakes[0]}`
      )
      .join('\n\n');

    return {
      text: `По вашему запросу я проанализировал базу знаний **FitAI** и подобрал наиболее подходящие упражнения:\n\n${listMarkdown}\n\nВы можете открыть любую из прикреплённых карточек ниже, чтобы посмотреть пошаговую технику выполнения.`,
      sources: matchedSources,
    };
  }

  return {
    text: `Я проанализировал запрос, но точных совпадений по ключевым словам в текущей демо-базе не нашлось.\n\nПопробуйте уточнить **группу мышц** (*грудь, спина, ноги, плечи, пресс*) или **инвентарь** (*гантели, штанга, турник*), и я соберу программу на основе проверенных упражнений из каталога.`,
    sources: [],
  };
};