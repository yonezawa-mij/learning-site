import Link from 'next/link'
import { AppShell } from '@/components/AppShell'
import { TutorChat } from '@/components/TutorChat'
import { DomainBarChart } from '@/components/DomainBarChart'
import { AiCapabilitiesPanel } from '@/components/AiCapabilitiesPanel'
import { requirePremium } from '@/lib/guards'
import { getTutorMessages } from '@/lib/tutor'
import { getLearningPlan } from '@/lib/learning-plan'
import { getLearningStats } from '@/lib/quiz-analytics'

export const dynamic = 'force-dynamic'

export default async function TutorPage() {
  const user = await requirePremium('/tutor')
  const [messages, plan, stats] = await Promise.all([
    getTutorMessages(user.id),
    getLearningPlan(user.id),
    getLearningStats(user.id),
  ])

  return (
    <AppShell subNav>
      <div className="mx-auto max-w-5xl px-6 py-10 sm:py-12">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold">学習チューター</h1>
          <p className="mt-2 text-sm text-muted max-w-2xl leading-relaxed">
            正答率 {stats.overall_accuracy}%・理解度 {stats.avg_understanding}点のデータをもとに、
            疑問や復習について相談できます。
          </p>
        </div>

        <div className="mb-8">
          <AiCapabilitiesPanel
            stats={{
              hasPlan: true,
              hasQuizData: stats.total_attempts > 0,
              hasTutorHistory: messages.length > 0,
              overallAccuracy: stats.overall_accuracy,
              weakDomainCount: plan.weakDomains.length,
            }}
          />
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
          <TutorChat initialMessages={messages} />

          <div className="space-y-6">
            <div className="card p-5">
              <h2 className="font-semibold mb-1">分野別の理解度</h2>
              <DomainBarChart stats={plan.domainStats} />
            </div>

            {plan.weakDomains.length > 0 && (
              <div className="card p-5 border-amber-100 bg-amber-50/50">
                <h2 className="font-semibold text-amber-900 mb-2">重点復習分野</h2>
                <ul className="space-y-1">
                  {plan.weakDomains.map((d) => (
                    <li key={d} className="text-sm text-amber-900">• {d}</li>
                  ))}
                </ul>
                <Link href="/dashboard" className="mt-3 inline-block text-sm text-accent hover:underline">
                  学習プランを見る
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  )
}
