import 'server-only'

export type GeneratedQuestion = {
  question: string
  correct_answer: string
  answer_variants: string[]
  choices: string[]
  explanation: string
  bridge_text: string
}

const QUESTION_SCHEMA = `Return JSON: {"questions":[{"question":"...","correct_answer":"...","answer_variants":[],"choices":["a","b","c","d"],"explanation":"...","bridge_text":"..."}]}`

export async function generateQuestionsWithAi(prompt: string, count: number): Promise<GeneratedQuestion[]> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return fallbackQuestions(count)
  }

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: `${prompt}\n\nGenerate exactly ${count} questions. ${QUESTION_SCHEMA}` }],
        temperature: 0.7,
        response_format: { type: 'json_object' },
      }),
    })
    if (!res.ok) return fallbackQuestions(count)
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return fallbackQuestions(count)
    const parsed = JSON.parse(content) as { questions?: GeneratedQuestion[] }
    const questions = parsed.questions ?? []
    if (questions.length === 0) return fallbackQuestions(count)
    return questions.slice(0, count).map(normalizeQuestion)
  } catch {
    return fallbackQuestions(count)
  }
}

function normalizeQuestion(q: GeneratedQuestion, i: number): GeneratedQuestion {
  return {
    question: String(q.question || `Question ${i + 1}`),
    correct_answer: String(q.correct_answer || ''),
    answer_variants: Array.isArray(q.answer_variants) ? q.answer_variants.map(String) : [],
    choices: Array.isArray(q.choices) && q.choices.length >= 2 ? q.choices.map(String) : [],
    explanation: String(q.explanation || ''),
    bridge_text: String(q.bridge_text || ''),
  }
}

function fallbackQuestions(count: number): GeneratedQuestion[] {
  return Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    question: `サンプル問題 ${i + 1}: 「Hello」の意味は？`,
    correct_answer: 'こんにちは',
    answer_variants: ['hello'],
    choices: ['こんにちは', 'さようなら', 'ありがとう', 'おやすみ'],
    explanation: 'Hello は「こんにちは」の意味です。OPENAI_API_KEY を設定すると AI が問題を生成します。',
    bridge_text: i > 0 ? '前の問題のフレーズを思い出してから答えてください。' : '',
  }))
}

export async function generateAiQuizQuestions(input: {
  domain: string | null
  topic: string
  count: number
  difficulty: string
  weakDomains: string[]
}): Promise<GeneratedQuestion[]> {
  const weakHint =
    input.weakDomains.length > 0
      ? `Focus extra on weak areas: ${input.weakDomains.join(', ')}.`
      : ''

  const prompt = `You are an English quiz author for Japanese learners.
Domain: ${input.domain ?? 'general English'}
Topic: ${input.topic}
Difficulty: ${input.difficulty}
${weakHint}
Create sequential related questions (Q2 relates to Q1). Use Japanese for question text. Include 4 choices for multiple choice.`

  return generateQuestionsWithAi(prompt, input.count)
}

export async function generateWebQuizQuestions(input: {
  url: string
  pageText: string
  domain: string | null
  count: number
}): Promise<GeneratedQuestion[]> {
  const prompt = `You are an English quiz author. Create quiz questions based on this web content.
Source URL: ${input.url}
Domain: ${input.domain ?? 'current topics'}

Content excerpt:
${input.pageText.slice(0, 6000)}

Use Japanese for questions. Test understanding of key facts/phrases from the content. Include 4 choices.`

  return generateQuestionsWithAi(prompt, input.count)
}

export async function fetchPageText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'LearningSite/1.0 (+quiz)' },
    signal: AbortSignal.timeout(15000),
  })
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`)
  const html = await res.text()
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 8000)
}

const ALLOWED_HOSTS = [
  'learning-site-nu.vercel.app',
  'localhost',
  'www.bbc.com',
  'edition.cnn.com',
  'www.reuters.com',
  'en.wikipedia.org',
]

export function isAllowedQuizUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false
    return ALLOWED_HOSTS.some((h) => parsed.hostname === h || parsed.hostname.endsWith(`.${h}`))
  } catch {
    return false
  }
}
