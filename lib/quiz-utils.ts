export function parseJsonArray(raw: string): string[] {
  try {
    const v = JSON.parse(raw)
    return Array.isArray(v) ? v.map(String) : []
  } catch {
    return []
  }
}

export function normalizeAnswer(input: string): string {
  return input.trim().toLowerCase().replace(/\s+/g, ' ')
}

export type QuizAnswerCheck = {
  correct_answer: string
  answer_variants: string
}

export function checkAnswer(question: QuizAnswerCheck, userAnswer: string): boolean {
  const normalized = normalizeAnswer(userAnswer)
  if (!normalized) return false
  const variants = [
    normalizeAnswer(question.correct_answer),
    ...parseJsonArray(question.answer_variants).map(normalizeAnswer),
  ]
  return variants.includes(normalized)
}
