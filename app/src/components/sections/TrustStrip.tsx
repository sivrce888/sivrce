'use client'

import { ShieldCheck, Sparkles, Building2, CheckCircle2 } from 'lucide-react'
import { Reveal } from '@/components/Reveal'

const TRUST_POINTS = [
  {
    icon: ShieldCheck,
    title: '100% ვერიფიცირებული',
    desc: 'ყველა განცხადება გადის რეალურ გადამოწმებას',
  },
  {
    icon: Building2,
    title: 'დეველოპერის ფასები',
    desc: 'პირდაპირი ფასები დეველოპერული კომპანიებისგან',
  },
  {
    icon: Sparkles,
    title: 'AI ფასის შეფასება',
    desc: 'ხელოვნური ინტელექტი იცავს გადაჭარბებული ფასისგან',
  },
  {
    icon: CheckCircle2,
    title: 'იურიდიული უსაფრთხოება',
    desc: 'მხოლოდ შემოწმებული სააგენტოები და აგენტები',
  },
]

export default function TrustStrip() {
  return (
    <section className="border-y border-sv-ink/[0.06] bg-sv-navy py-12 text-white">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TRUST_POINTS.map((pt, i) => (
            <Reveal key={pt.title} delay={i * 0.08} className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-module bg-sv-blue/20 text-sv-blue-light border border-sv-blue/30">
                <pt.icon className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-[16px] font-black text-white">{pt.title}</h3>
                <p className="mt-1 text-[13px] font-semibold text-white/60 leading-snug">{pt.desc}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  )
}
