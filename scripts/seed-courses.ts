import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

type LessonSeed = { title: string; content: string; duration_minutes: number }
type CourseSeed = {
  icon: string
  title: string
  level: string
  description: string
  duration_minutes: number
  sort_order: number
  lessons: LessonSeed[]
}

const courses: CourseSeed[] = [
  {
    icon: '🎯',
    title: '学習設計の基礎',
    level: '初級',
    description: '「何を・どの順番で・どう定着させるか」を設計する力を身につけ、独学でも成果が出る学び方を習得します。',
    duration_minutes: 90,
    sort_order: 1,
    lessons: [
      {
        title: '学習目標の立て方',
        duration_minutes: 15,
        content: `## このレッスンで学ぶこと
- 曖昧な目標を「測れる目標」に変換する
- 1週間単位のマイルストーンを設定する

## ポイント
「AIを学ぶ」ではなく「毎朝30分、プロンプトを3本書いて改善する」のように、行動レベルまで落とし込みます。

## ワーク
1. いま身につけたいスキルを1つ書く
2. 4週間後の到達点を1文で書く
3. 来週やる具体行動を3つ書く`,
      },
      {
        title: 'カリキュラムマップの作り方',
        duration_minutes: 20,
        content: `## このレッスンで学ぶこと
- 基礎→応用→実践の3層構造
- つまずきポイントの先回り

## 3層構造
1. **基礎** — 用語・概念・最小限の操作
2. **応用** — パターン化・テンプレート化
3. **実践** — 実務タスクへの適用

## ワーク
学びたいテーマを3層に分解し、各層に2項目ずつ書き出してください。`,
      },
      {
        title: '学習ログと振り返り',
        duration_minutes: 15,
        content: `## このレッスンで学ぶこと
- 5分振り返りテンプレート
- 定着率を上げる間隔反復

## 振り返りテンプレ
- 今日やったこと
- 理解できたこと
- まだ曖昧なこと
- 次にやること

毎日5分で十分。完璧なノートより継続が重要です。`,
      },
    ],
  },
  {
    icon: '⚡',
    title: 'プロンプト実践ワークショップ',
    level: '中級',
    description: 'Few-shot、Chain-of-Thought、出力形式指定など、実務で即使えるプロンプト技法を演習形式で習得します。',
    duration_minutes: 120,
    sort_order: 2,
    lessons: [
      {
        title: 'Few-shotで精度を上げる',
        duration_minutes: 25,
        content: `## 技法
入力例と期待出力を2〜3組示すことで、形式と品質基準をAIに伝えます。

## 例
\`\`\`
入力: 売上100万、前年比110%
出力: 好調。前年比プラス成長。

入力: 売上80万、前年比95%
出力: 要改善。前年比マイナス。
\`\`\`

## 演習
自分の業務で使える分類タスクを1つ選び、Few-shot例を3組作成してください。`,
      },
      {
        title: 'Chain-of-Thought',
        duration_minutes: 25,
        content: `## 技法
「ステップバイステップで考えて」と指示し、推論過程を出力させます。

## 使いどころ
- 複雑な判断
- 数値の検算
- 多段階の分析

## 注意
推論過程も必ず人間が確認。最終結論だけを鵜呑みにしないでください。`,
      },
      {
        title: '出力形式の固定',
        duration_minutes: 20,
        content: `## 技法
JSON / Markdown表 / 箇条書きなど、後工程で使いやすい形式を明示します。

## 例
\`\`\`json
{"title": "", "summary": "", "action_items": []}
\`\`\`

## 演習
レポート作成プロンプトに、上記JSON形式を組み込んでください。`,
      },
    ],
  },
  {
    icon: '🏁',
    title: '実務投入チェックリスト',
    level: '上級',
    description: '学んだ内容をチームや業務に安全に展開するための、導入・運用・改善の実践ガイドです。',
    duration_minutes: 60,
    sort_order: 3,
    lessons: [
      {
        title: '小さく始めるPilot設計',
        duration_minutes: 20,
        content: `## Pilotの条件
- 対象業務は週1回以上発生
- 失敗しても影響が限定的
- 成果が数値で測れる

## テンプレ
- 対象業務:
- 現状の所要時間:
- 成功指標:
- 期間: 2週間`,
      },
      {
        title: '品質と安全のガードレール',
        duration_minutes: 20,
        content: `## 必須ルール
1. 機密情報を入力しない
2. 出力は必ず人が確認
3. 重要判断はAI単独で行わない
4. 利用ログを残す（可能な範囲で）

## チェックリスト
導入前に上記4項目をチームで合意してください。`,
      },
    ],
  },
]

async function main() {
  const url = process.env.DATABASE_OWNER_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)

  await sql`DELETE FROM lesson_progress`
  await sql`DELETE FROM course_lessons`
  await sql`DELETE FROM courses`

  for (const course of courses) {
    const rows = (await sql`
      INSERT INTO courses (title, description, icon, level, duration_minutes, sort_order, status)
      VALUES (${course.title}, ${course.description}, ${course.icon}, ${course.level}, ${course.duration_minutes}, ${course.sort_order}, 'published')
      RETURNING id
    `) as { id: string }[]
    const courseId = rows[0].id

    for (let i = 0; i < course.lessons.length; i++) {
      const lesson = course.lessons[i]
      await sql`
        INSERT INTO course_lessons (course_id, title, content, sort_order, duration_minutes)
        VALUES (${courseId}, ${lesson.title}, ${lesson.content}, ${i + 1}, ${lesson.duration_minutes})
      `
    }
    console.log(`✓ ${course.title} (${course.lessons.length} lessons)`)
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
