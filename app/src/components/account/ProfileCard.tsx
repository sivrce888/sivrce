'use client'

import { signIn } from 'next-auth/react'
import { LogIn, User } from 'lucide-react'
import SectionHeader from './SectionHeader'
import { useAccountStrings } from './i18n'

export interface AccountUser {
  name: string | null
  email: string | null
  image: string | null
}

export default function ProfileCard({ user }: { user: AccountUser | null }) {
  const tt = useAccountStrings()

  return (
    <section aria-label={tt('profile')} className="rounded-card border border-sv-ink/[0.06] bg-sv-surface p-6 shadow-card">
      <SectionHeader icon={User} title={tt('profile')} chipClass="bg-sv-blue/10 text-sv-blue" />
      {user ? (
        <div className="flex items-center gap-4">
          {user.image ? (
            // Remote OAuth avatar — next/image remotePatterns not configured
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.image} alt="" className="h-14 w-14 rounded-full" referrerPolicy="no-referrer" />
          ) : (
            <span className="grid h-14 w-14 place-items-center rounded-full bg-sv-blue/10">
              <User className="h-6 w-6 text-sv-blue" aria-hidden="true" />
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate text-[17px] font-black text-sv-ink">{user.name ?? '—'}</p>
            <p className="truncate text-[14px] font-semibold text-sv-ink/55">{user.email ?? '—'}</p>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-4">
          <button
            onClick={() => signIn('google')}
            className="flex h-11 items-center gap-2 rounded-full bg-sv-orange px-6 text-[14px] font-extrabold text-white shadow-glow-orange transition-all hover:-translate-y-0.5 hover:shadow-glow-orange-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sv-blue focus-visible:ring-offset-2"
          >
            <LogIn className="h-4 w-4" aria-hidden="true" />
            {tt('signIn')}
          </button>
          <p className="text-[13px] font-semibold text-sv-ink/50">{tt('signInHint')}</p>
        </div>
      )}
    </section>
  )
}
