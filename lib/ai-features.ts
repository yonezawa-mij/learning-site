export const AI_LEARNING_FEATURES = [
  {
    id: 'personalize',
    icon: '🎯',
    title: '個別最適化された学習',
    tag: 'パーソナライズ',
    description:
      '得意・不得意な分野をデータで分析し、その人に合った問題や学習プランを自動生成。つまずき箇所を把握し、理解できるまで異なる角度からサポートします。',
    page: 'ダッシュボード',
    href: '/dashboard',
  },
  {
    id: 'feedback',
    icon: '⚡',
    title: '24時間いつでも即時フィードバック',
    tag: '即時判定',
    description:
      '時間を問わず、クイズ回答後すぐに理解度スコアと解説が返ってきます。疑問をその場で解決し、学習リズムを維持できます。',
    page: 'クイズレッスン',
    href: '/courses',
  },
  {
    id: 'dialogue',
    icon: '💬',
    title: '対話を通じた主体的な学び',
    tag: 'ソクラテス式',
    description:
      'ただ答えを教えるだけでなく「なぜそうなるのか？」を対話形式で一緒に考えます。暗記ではなく深い理解を促します。',
    page: 'AIチューター',
    href: '/tutor',
  },
  {
    id: 'analytics',
    icon: '📊',
    title: '客観的な学習データの管理',
    tag: 'データ可視化',
    description:
      '解答履歴・正答率・弱点分野を記録・可視化。客観的なデータに基づいて、効率的な復習タイミングを提案します。',
    page: 'マイページ',
    href: '/dashboard',
  },
] as const

export const AI_TAGLINE =
  'いつでも、どこでも、自分専用の優秀な家庭教師'
