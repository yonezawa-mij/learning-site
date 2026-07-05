import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

config({ path: '.env.local' })

type Q = {
  question: string
  correct_answer: string
  answer_variants?: string[]
  choices: string[]
  explanation: string
  bridge_text: string
}

type QuizSet = {
  title: string
  domain: string
  intro: string
  quiz_source?: 'fixed' | 'dify'
  quiz_config?: Record<string, unknown>
  questions: Q[]
}

const course = {
  icon: '🇬🇧',
  title: '英会話クイズ',
  level: '初級',
  description:
    '挨拶・自己紹介・レストランなど、日常場面の英会話をクイズ形式で学びます。定番のカリキュラム問題と、AI による個別問題の両方を用意しています。',
  sort_order: 0,
}

const sets: QuizSet[] = [
  {
    title: 'Set 1: Greetings & First Contact',
    domain: '挨拶・ファーストコンタクト',
    intro: '英語の会話は挨拶から始まります。このセットで基本の挨拶フレーズを、会話の流れに沿って身につけましょう。',
    questions: [
      {
        question: '初対面の人に昼間会ったとき、最も一般的な挨拶はどれ？',
        choices: ['Good morning', 'Good night', 'Goodbye', 'See you yesterday'],
        correct_answer: 'Good morning',
        answer_variants: ['good morning'],
        explanation: '午前〜昼過ぎに使う定番の挨拶です。',
        bridge_text: '',
      },
      {
        question: '「Good morning」と言われたら、自然な返答は？',
        choices: ['Good morning!', 'Good evening.', 'I am fine, thank you.', 'Nice to meet you.'],
        correct_answer: 'Good morning!',
        answer_variants: ['good morning', 'good morning!'],
        explanation: '挨拶には同じ挨拶で返すのが自然です。',
        bridge_text: '前の問題で「Good morning」を選びました。同じフレーズで返すのが基本です。',
      },
      {
        question: '挨拶のあと、相手の調子を聞く定番フレーズは？',
        choices: ['How are you?', 'What is your name?', 'Where are you from?', 'How old are you?'],
        correct_answer: 'How are you?',
        explanation: '「お元気ですか？」— 挨拶の次によく続けます。',
        bridge_text: '挨拶の後は、相手の状態を聞く表現が続きやすいです。',
      },
      {
        question: '「How are you?」への定番の返答は？',
        choices: ["I'm fine, thank you.", 'My name is John.', 'I am from Japan.', 'Good night.'],
        correct_answer: "I'm fine, thank you.",
        answer_variants: ["i'm fine, thank you", 'im fine thank you', "i am fine, thank you"],
        explanation: '「元気です、ありがとう」— 教科書的な基本返答です。',
        bridge_text: '前問で「How are you?」を選びました。これに対する返答を考えましょう。',
      },
      {
        question: '返答のあと、相手にも聞き返す自然な言い方は？',
        choices: ['And you?', 'Goodbye!', 'See you later.', 'What time is it?'],
        correct_answer: 'And you?',
        answer_variants: ['and you', 'and you?'],
        explanation: '「あなたは？」— 会話を続ける丁寧な返しです。',
        bridge_text: '「I\'m fine」のあと、相手にも同じ質問を返すと自然です。',
      },
      {
        question: '初対面で自己紹介するとき「はじめまして」に相当するのは？',
        choices: ['Nice to meet you.', 'How are you?', 'Good morning.', 'Thank you very much.'],
        correct_answer: 'Nice to meet you.',
        answer_variants: ['nice to meet you', 'nice to meet you.'],
        explanation: '初対面の定番表現です。',
        bridge_text: '挨拶の流れが続いたあと、自己紹介の段階に入ります。',
      },
      {
        question: '「Nice to meet you.」への返答として自然なのは？',
        choices: ['Nice to meet you too.', 'Good morning.', 'I am 25 years old.', 'See you.'],
        correct_answer: 'Nice to meet you too.',
        answer_variants: ['nice to meet you too', 'nice to meet you, too'],
        explanation: '「こちらこそ」— too を付けて返します。',
        bridge_text: '前問の自己紹介に対する返答を選びましょう。',
      },
      {
        question: '昼過ぎ〜夕方に会った人への挨拶は？',
        choices: ['Good afternoon', 'Good morning', 'Good night', 'Good luck'],
        correct_answer: 'Good afternoon',
        explanation: '12時以降〜夕方前後に使います。',
        bridge_text: '時間帯によって挨拶が変わります。午後の場面を想像してください。',
      },
      {
        question: '別れ際に「またね」と言いたいときは？',
        choices: ['See you later.', 'Nice to meet you.', 'How are you?', 'Good morning.'],
        correct_answer: 'See you later.',
        answer_variants: ['see you later', 'see you'],
        explanation: 'カジュアルな別れの挨拶です。',
        bridge_text: '会話が終わる場面。別れのフレーズを選びましょう。',
      },
      {
        question: '夜、寝る前に家族に言う挨拶は？',
        choices: ['Good night.', 'Good afternoon.', 'Hello.', 'How are you?'],
        correct_answer: 'Good night.',
        answer_variants: ['good night', 'good night.'],
        explanation: '就寝前の挨拶。「Good evening」と混同しないよう注意。',
        bridge_text: '1日の終わりの場面。時間帯に合った挨拶です。',
      },
    ],
  },
  {
    title: 'Set 2: Self Introduction',
    domain: '自己紹介',
    intro: '名前・出身・職業など、自己紹介の基本パターンを関連問題で学びます。',
    questions: [
      {
        question: '名前を聞くとき「お名前は？」は英語で？',
        choices: ["What's your name?", 'How old are you?', 'Where do you live?', 'How are you?'],
        correct_answer: "What's your name?",
        answer_variants: ['what is your name', "what's your name"],
        explanation: 'What + be動詞 で質問します。',
        bridge_text: '',
      },
      {
        question: '「My name is Yuki.」と言ったあと、相手に名前を聞き返すには？',
        choices: ["And what's your name?", 'Goodbye.', 'I am fine.', 'See you.'],
        correct_answer: "And what's your name?",
        answer_variants: ['and what is your name', "and what's your name"],
        explanation: 'And で続けて質問を返します。',
        bridge_text: '自分の名前を言ったあと、相手にも聞くのが会話の基本です。',
      },
      {
        question: '「Where are you from?」の意味は？',
        choices: ['どこ出身ですか？', 'お名前は？', 'お仕事は？', '何歳ですか？'],
        correct_answer: 'どこ出身ですか？',
        explanation: 'be from = 〜出身である',
        bridge_text: '名前の次は、出身を聞くことが多いです。',
      },
      {
        question: '「日本から来ました」を英語で言うと？',
        choices: ["I'm from Japan.", 'I am Japan.', 'I come Japan.', 'I live to Japan.'],
        correct_answer: "I'm from Japan.",
        answer_variants: ['i am from japan', "i'm from japan"],
        explanation: 'be from + 国名 の形です。',
        bridge_text: '前問「Where are you from?」への回答を考えましょう。',
      },
      {
        question: '「What do you do?」は何を聞いている？',
        choices: ['職業', '年齢', '趣味', '出身地'],
        correct_answer: '職業',
        explanation: '仕事・職業を聞く定番表現です。',
        bridge_text: '出身の次は、仕事について聞く流れが自然です。',
      },
      {
        question: '「I\'m a student.」の意味は？',
        choices: ['私は学生です。', '私は先生です。', '私は疲れています。', '私は日本出身です。'],
        correct_answer: '私は学生です。',
        explanation: 'a + 職業/身分 の形です。',
        bridge_text: '前問で職業を聞きました。この回答の意味を確認しましょう。',
      },
      {
        question: '自己紹介の締め「よろしくお願いします」に近いのは？',
        choices: ['Nice to meet you.', 'Good night.', 'How are you?', 'See you later.'],
        correct_answer: 'Nice to meet you.',
        explanation: '初対面の締めくくりとしてよく使います。',
        bridge_text: '自己紹介の最後は、好印象を残すフレーズで締めます。',
      },
      {
        question: '「I work at a tech company.」で伝わることは？',
        choices: ['IT企業で働いている', '学校に通っている', '旅行中である', '引退した'],
        correct_answer: 'IT企業で働いている',
        explanation: 'work at + 会社/場所',
        bridge_text: '職業の説明をもう少し具体的にする表現です。',
      },
    ],
  },
  {
    title: 'Set 3: At a Restaurant',
    domain: 'レストラン・注文',
    intro: 'レストランでの一連の会話を、注文の流れに沿った問題で練習します。',
    questions: [
      {
        question: '店員が最初に言う「いらっしゃいませ」に近いのは？',
        choices: ['Welcome!', 'Goodbye!', 'Thank you for the meal.', 'See you tomorrow.'],
        correct_answer: 'Welcome!',
        explanation: '店舗での歓迎の言葉です。',
        bridge_text: '',
      },
      {
        question: '「メニューをください」を英語で言うと？',
        choices: ['Can I have the menu, please?', 'I am the menu.', 'Menu is good.', 'Where is menu?'],
        correct_answer: 'Can I have the menu, please?',
        answer_variants: ['can i have the menu please', 'may i have the menu please'],
        explanation: 'Can I have ~, please? は丁寧な依頼表現。',
        bridge_text: '店に入ったら、まずメニューをもらう場面です。',
      },
      {
        question: '注文するとき「コーヒーを一つお願いします」は？',
        choices: ["I'd like a coffee, please.", 'I am coffee.', 'Coffee is me.', 'Give coffee now.'],
        correct_answer: "I'd like a coffee, please.",
        answer_variants: ["i'd like a coffee please", 'i would like a coffee please'],
        explanation: "I'd like ~ = 〜をください（丁寧）",
        bridge_text: 'メニューを見たあと、注文する場面に進みます。',
      },
      {
        question: '「For here or to go?」の意味は？',
        choices: ['店内ですか、持ち帰りですか？', 'コーヒーですか、紅茶ですか？', '大きいですか、小さいですか？', '甘いですか、苦いですか？'],
        correct_answer: '店内ですか、持ち帰りですか？',
        explanation: 'for here = 店内, to go = 持ち帰り',
        bridge_text: '注文の詳細を確認する定番の質問です。',
      },
      {
        question: '店内で食べる場合の返答は？',
        choices: ['For here, please.', 'To go, please.', 'Good night.', 'I am fine.'],
        correct_answer: 'For here, please.',
        answer_variants: ['for here please', 'for here, please'],
        explanation: '店内利用を伝えます。',
        bridge_text: '前問の質問への回答を選びましょう。',
      },
      {
        question: '店員が「Anything else?」と聞いた意味は？',
        choices: ['他にご注文はありますか？', 'お会計です。', 'お店は閉まります。', 'メニューがありません。'],
        correct_answer: '他にご注文はありますか？',
        explanation: '追加注文の確認です。',
        bridge_text: '1品注文したあと、追加があるか聞かれる場面です。',
      },
      {
        question: '「それだけです」と伝えると？',
        choices: ["That's all, thank you.", 'More please forever.', 'I am menu.', 'Welcome back.'],
        correct_answer: "That's all, thank you.",
        answer_variants: ["that's all thank you", 'thats all thank you'],
        explanation: "That's all = 以上です",
        bridge_text: '追加注文がないことを伝える表現です。',
      },
      {
        question: '会計をお願いするときは？',
        choices: ['Can I have the bill, please?', 'Can I have the menu?', 'Good morning.', 'Nice to meet you.'],
        correct_answer: 'Can I have the bill, please?',
        answer_variants: ['check please', 'can i have the check please'],
        explanation: 'bill / check どちらも会計を意味します（米/英）。',
        bridge_text: '食事が終わり、会計の場面です。',
      },
      {
        question: '「ごちそうさまでした」を英語で言うと？',
        choices: ['Thank you for the meal.', 'Welcome!', 'Good night.', 'How are you?'],
        correct_answer: 'Thank you for the meal.',
        answer_variants: ['thanks for the meal'],
        explanation: '食事への感謝を伝える表現です。',
        bridge_text: 'レストランを出る前の締めのフレーズです。',
      },
      {
        question: '店を出るとき自然な別れの言葉は？',
        choices: ['Have a nice day!', 'Good morning!', 'What is your name?', 'I am hungry.'],
        correct_answer: 'Have a nice day!',
        answer_variants: ['have a nice day'],
        explanation: '良い一日を — 店員との別れでよく使います。',
        bridge_text: 'レストランでの一連の会話の最後。自然な締めくくりです。',
      },
    ],
  },
  {
    title: 'Set 4: 弱点フォロー',
    domain: '弱点に合わせた会話',
    intro: 'これまでの学習データをもとに、あなたの弱点分野に合わせた問題に挑戦します。',
    quiz_source: 'dify',
    quiz_config: {
      topic: 'English daily conversation tailored to learner weaknesses',
      question_count: 8,
      difficulty: '初級',
      weakness_focus: true,
    },
    questions: [],
  },
  {
    title: 'Set 5: 旅行英会話',
    domain: '旅行・道案内',
    intro: '空港・ホテル・道案内など、旅行場面の英会話問題に取り組みます。',
    quiz_source: 'dify',
    quiz_config: {
      topic: 'Travel English — airport, hotel, directions',
      question_count: 8,
      difficulty: '初級',
      weakness_focus: false,
    },
    questions: [],
  },
]

async function main() {
  const url = process.env.DATABASE_OWNER_URL?.trim() || process.env.DATABASE_URL?.trim()
  if (!url) throw new Error('DATABASE_URL is not set')
  const sql = neon(url)

  await sql`DELETE FROM courses`
  console.log('✓ courses reset')

  const rows = (await sql`
    INSERT INTO courses (title, description, icon, level, sort_order, status, duration_minutes)
    VALUES (${course.title}, ${course.description}, ${course.icon}, ${course.level}, ${course.sort_order}, 'published', 90)
    RETURNING id
  `) as { id: string }[]
  const courseId = rows[0].id

  for (let si = 0; si < sets.length; si++) {
    const set = sets[si]
    const source = set.quiz_source ?? 'fixed'
    const config = JSON.stringify(set.quiz_config ?? {})
    const lessonRows = (await sql`
      INSERT INTO course_lessons (course_id, title, content, sort_order, duration_minutes, lesson_type, domain, quiz_source, quiz_config)
      VALUES (${courseId}, ${set.title}, ${set.intro}, ${si + 1}, ${Math.max(set.questions.length, 6) * 2}, 'quiz', ${set.domain}, ${source}, ${config})
      RETURNING id
    `) as { id: string }[]
    const lessonId = lessonRows[0].id

    if (set.questions.length === 0) {
      console.log(`✓ ${set.title} (${source} — 問題は初回アクセス時に生成)`)
      continue
    }

    for (let qi = 0; qi < set.questions.length; qi++) {
      const q = set.questions[qi]
      await sql`
        INSERT INTO quiz_questions (lesson_id, sort_order, question, correct_answer, answer_variants, choices, explanation, bridge_text, source)
        VALUES (
          ${lessonId}, ${qi + 1}, ${q.question}, ${q.correct_answer},
          ${JSON.stringify(q.answer_variants ?? [])},
          ${JSON.stringify(q.choices)},
          ${q.explanation}, ${q.bridge_text}, 'fixed'
        )
      `
    }
    console.log(`✓ ${set.title} (${set.questions.length} questions, fixed)`)
  }

  console.log('English quiz course seeded.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
