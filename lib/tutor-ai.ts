import 'server-only'
import type { TutorMessage } from './tutor'
import { getDomainStats, getLearningStats } from './quiz-analytics'

type TutorContext = {
  lessonTitle?: string
  domain?: string | null
  lessonContent?: string
}

type TutorReply = {
  content: string
}

function ruleBasedTutorReply(
  userMessage: string,
  history: TutorMessage[],
  stats: Awaited<ReturnType<typeof getLearningStats>>,
  domains: Awaited<ReturnType<typeof getDomainStats>>,
  ctx: TutorContext,
): TutorReply {
  const weak = domains.filter((d) => d.status === 'weak').map((d) => d.domain)
  const lower = userMessage.toLowerCase()

  if (/^(こんにちは|hello|hi|はじめまして)/i.test(userMessage.trim())) {
    const greeting = stats.total_attempts > 0
      ? `こんにちは！正答率${stats.overall_accuracy}%で学習中ですね。`
      : 'こんにちは！一緒に英語を学びましょう。'
    const weakHint = weak.length > 0 ? ` 弱点分野「${weak.join('、')}」を重点的にサポートできます。` : ''
    return {
      content: `${greeting}${weakHint} どんなことでも質問してください。答えを直接教えるより、一緒に考える形でサポートします。`,
    }
  }

  if (/なぜ|why|どうして/.test(userMessage)) {
    return {
      content: `良い質問ですね。「なぜそうなるのか」を考えるのは理解を深める近道です。\n\nまず、あなたの考えを教えてください — この表現が使われる場面を想像すると、どんな状況だと思いますか？\n\n${ctx.domain ? `（現在の分野: ${ctx.domain}）` : ''}`,
    }
  }

  if (/ヒント|hint|わからない|分からない|困/.test(userMessage)) {
    return {
      content: `大丈夫です。ヒントを出しますね。\n\n1. 文の主語と目的を確認しましょう\n2. 日常会話で使う自然な表現を考えてみてください\n3. 前の問題とつながっている場合、前のフレーズを思い出してみましょう\n\nどこまで考えられましたか？`,
    }
  }

  if (/復習|review|弱点|苦手/.test(userMessage)) {
    if (weak.length > 0) {
      return {
        content: `データによると、弱点分野は「${weak.join('」「')}」です。\n\n復習のコツ:\n- 間違えた問題を声に出して読む\n- なぜその答えになるか、自分の言葉で説明する\n- 同じ分野のクイズをもう一度解く\n\nダッシュボードの学習プランから、おすすめの復習セットに進めます。`,
      }
    }
    return {
      content: 'まだ弱点データが十分にありません。クイズを解くと、AIが得意・不得意を分析して復習を提案します。',
    }
  }

  const lastAssistant = [...history].reverse().find((m) => m.role === 'assistant')
  if (lastAssistant && userMessage.length < 30) {
    return {
      content: `なるほど。「${userMessage}」という視点、良いですね。\n\nもう一歩深掘りしましょう — その考えを英語で表現するとしたら、どんなフレーズが使えそうですか？`,
    }
  }

  return {
    content: `興味深い質問です。\n\n${ctx.lessonTitle ? `「${ctx.lessonTitle}」` : 'このレッスン'}の文脈で考えると、まずキーワードを整理してみましょう。\n\nあなたが知りたいのは:\n- 意味・用法の説明\n- なぜその答えになるのか\n- 似た表現との違い\n\nどれに近いですか？`,
  }
}

async function openAiTutorReply(
  userMessage: string,
  history: TutorMessage[],
  stats: Awaited<ReturnType<typeof getLearningStats>>,
  domains: Awaited<ReturnType<typeof getDomainStats>>,
  ctx: TutorContext,
): Promise<TutorReply | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null

  const domainLines = domains
    .map((d) => `${d.domain}: 正答率${Math.round(d.correct_rate * 100)}%, 理解度${d.avg_score}`)
    .join('\n')

  const systemPrompt = `You are a Socratic English tutor for Japanese learners. Rules:
- Respond in Japanese (2-5 sentences)
- Do NOT give direct answers to quiz questions — guide with questions
- Explain "why" through dialogue, not memorization
- Reference learner's weak domains when relevant
- Be encouraging and concise

Learner stats: accuracy ${stats.overall_accuracy}%, avg understanding ${stats.avg_understanding}
Weak domains: ${domains.filter((d) => d.status === 'weak').map((d) => d.domain).join(', ') || 'none yet'}
Domain breakdown:
${domainLines || 'no data'}
Current lesson: ${ctx.lessonTitle ?? 'general'}
Current domain: ${ctx.domain ?? 'general'}`

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.slice(-10).map((m) => ({
      role: m.role as 'user' | 'assistant',
      content: m.content,
    })),
    { role: 'user' as const, content: userMessage },
  ]

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL ?? 'gpt-4o-mini',
        messages,
        temperature: 0.6,
      }),
    })
    if (!res.ok) return null
    const data = await res.json()
    const content = data.choices?.[0]?.message?.content?.trim()
    if (!content) return null
    return { content }
  } catch {
    return null
  }
}

export async function generateTutorReply(
  userId: string,
  userMessage: string,
  history: TutorMessage[],
  ctx: TutorContext = {},
): Promise<TutorReply> {
  const [stats, domains] = await Promise.all([
    getLearningStats(userId),
    getDomainStats(userId),
  ])

  const ai = await openAiTutorReply(userMessage, history, stats, domains, ctx)
  if (ai) return ai

  return ruleBasedTutorReply(userMessage, history, stats, domains, ctx)
}
