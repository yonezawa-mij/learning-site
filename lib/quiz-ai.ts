import 'server-only'
import type { QuizQuestion } from './quiz'
import { checkAnswer, getQuizAttempts, normalizeAnswer } from './quiz'

type FeedbackInput = {
  question: QuizQuestion
  userAnswer: string
  isCorrect: boolean
  previousCorrect: number
  totalAnswered: number
  nextQuestion?: QuizQuestion | null
}

export type QuizFeedback = {
  score: number
  feedback: string
  encouragement: string
  nextFocus?: string
}

function ruleBasedFeedback(input: FeedbackInput): QuizFeedback {
  const { question, userAnswer, isCorrect, previousCorrect, totalAnswered, nextQuestion } = input
  const accuracy = totalAnswered > 0 ? previousCorrect / totalAnswered : 0

  if (isCorrect) {
    const score = accuracy >= 0.8 ? 95 : accuracy >= 0.5 ? 85 : 75
    let feedback = `正解です。「${question.correct_answer}」${question.explanation ? ` — ${question.explanation}` : ''}`
    if (nextQuestion?.bridge_text) {
      feedback += `\n\n次の問題へ: ${nextQuestion.bridge_text}`
    }
    return {
      score,
      feedback,
      encouragement: accuracy >= 0.8
        ? '理解度が高いです。この調子で関連問題を続けましょう。'
        : '良い流れです。前の問題の内容を活かして次も考えてみましょう。',
      nextFocus: nextQuestion ? `分野「${nextQuestion.question.slice(0, 30)}...」への応用` : undefined,
    }
  }

  const score = Math.max(20, Math.round(accuracy * 60))
  const choices = JSON.parse(question.choices || '[]') as string[]
  const hint = choices.length > 0 ? `ヒント: 選択肢の中から日常会話で使う自然な表現を選びましょう。` : ''

  let feedback = `不正解です。正解は「${question.correct_answer}」です。`
  if (question.explanation) feedback += `\n${question.explanation}`
  if (userAnswer.trim()) {
    feedback += `\n\nあなたの回答「${userAnswer}」は、この文脈では自然な用法ではありません。`
  }
  if (hint) feedback += `\n${hint}`

  return {
    score,
    feedback,
    encouragement:
      accuracy < 0.5
        ? '関連問題を順番に解くことで、会話の流れが掴みやすくなります。解説を読んでから次へ進みましょう。'
        : '1問前の内容とつなげて考えると正解に近づきます。もう一度確認してから次へ。',
    nextFocus: nextQuestion?.bridge_text || '前の問題のフレーズを思い出してから回答してください。',
  }
}

async function openAiFeedback(input: FeedbackInput): Promise<QuizFeedback | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const { question, userAnswer, isCorrect, nextQuestion } = input
  const prompt = `You are an English tutor for Japanese learners. Evaluate this quiz answer briefly in Japanese (3-5 sentences).

Question: ${question.question}
Correct answer: ${question.correct_answer}
User answer: ${userAnswer}
Is correct: ${isCorrect}
Explanation: ${question.explanation}
Next question bridge: ${nextQuestion?.bridge_text ?? 'none'}

Return JSON: {"score":0-100,"feedback":"...","encouragement":"...","nextFocus":"..."}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4,
        response_format: { type: 'json_object' },
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content
    if (!content) return null
    const parsed = JSON.parse(content) as QuizFeedback
    return {
      score: Math.min(100, Math.max(0, Number(parsed.score) || 0)),
      feedback: String(parsed.feedback || ''),
      encouragement: String(parsed.encouragement || ''),
      nextFocus: parsed.nextFocus ? String(parsed.nextFocus) : undefined,
    }
  } catch {
    return null
  }
}

export async function evaluateQuizAnswer(
  userId: string,
  lessonId: string,
  question: QuizQuestion,
  userAnswer: string,
  allQuestions: QuizQuestion[],
): Promise<QuizFeedback> {
  const isCorrect = checkAnswer(question, userAnswer)
  const attempts = await getQuizAttempts(userId, lessonId)
  const answered = [...attempts.values()]
  const previousCorrect = answered.filter((a) => a.is_correct).length
  const nextQuestion = allQuestions.find((q) => q.sort_order === question.sort_order + 1) ?? null

  const input: FeedbackInput = {
    question,
    userAnswer,
    isCorrect,
    previousCorrect,
    totalAnswered: answered.length,
    nextQuestion,
  }

  const ai = await openAiFeedback(input)
  if (ai) return ai

  return ruleBasedFeedback(input)
}

export function summarizeSetUnderstanding(scores: number[]): { avg: number; level: string; advice: string } {
  if (scores.length === 0) return { avg: 0, level: '未実施', advice: '' }
  const avg = Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
  if (avg >= 85) {
    return { avg, level: '高い', advice: 'この分野はよく理解できています。次のセットに進みましょう。' }
  }
  if (avg >= 60) {
    return { avg, level: '標準', advice: '基本は押さえています。間違えた問題を復習してから次へ進むと定着します。' }
  }
  return { avg, level: '要復習', advice: '関連問題をもう一度順番に解き、会話の流れを復習しましょう。' }
}
