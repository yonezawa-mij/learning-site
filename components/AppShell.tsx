import { Navbar } from '@/components/Navbar'
import { Footer } from '@/components/Footer'
import { MemberSubNav } from '@/components/MemberSubNav'

export function AppShell({
  children,
  subNav = false,
}: {
  children: React.ReactNode
  subNav?: boolean
}) {
  return (
    <>
      <Navbar />
      {subNav && <MemberSubNav />}
      <div className="app-main">{children}</div>
      <Footer />
    </>
  )
}
