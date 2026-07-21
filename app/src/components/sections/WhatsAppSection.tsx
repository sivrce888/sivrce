'use client'

import { useState } from 'react'
import { MessageCircle, Bell, CheckCircle2, Sparkles, Send } from 'lucide-react'
import { useI18n } from '@/lib/i18n/context'
import { Reveal } from '@/components/Reveal'
import { CITIES, DEALS, TYPES } from '@/lib/seo-pages'

export default function WhatsAppSection() {
  const { t, lang } = useI18n()
  const [city, setCity] = useState('tbilisi')
  const [deal, setDeal] = useState('sale')
  const [type, setType] = useState('apartments')
  const [maxPrice, setMaxPrice] = useState('')
  const [phone, setPhone] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!phone.trim()) return
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
    }, 600)
  }

  return (
    <section className="relative overflow-hidden bg-sv-navy py-16 md:py-24">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 bg-grid-dark opacity-40" />
      <div className="absolute -left-20 top-1/2 h-[380px] w-[480px] -translate-y-1/2 rounded-full bg-sv-blue/15 blur-[140px]" />
      <div className="absolute -right-20 top-1/2 h-[380px] w-[480px] -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[140px]" />

      <div className="relative mx-auto max-w-[1440px] px-5 md:px-10">
        <div className="grid gap-12 lg:grid-cols-12 lg:items-center">
          {/* Left Column — Info & How it works */}
          <div className="lg:col-span-6">
            <Reveal>
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-1.5 ring-1 ring-emerald-500/30">
                <MessageCircle className="h-4 w-4 text-emerald-400" />
                <span className="text-[13px] font-bold text-emerald-300">
                  {t('whatsapp.badge')}
                </span>
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <h2 className="mt-4 text-balance text-[28px] font-black leading-[1.12] tracking-[-0.02em] text-white sm:text-[38px] md:text-[44px]">
                {t('whatsapp.title')}
              </h2>
              <p className="mt-4 text-[15px] font-medium leading-relaxed text-white/70 sm:text-[17px]">
                {t('whatsapp.subtitle')}
              </p>
            </Reveal>

            <Reveal delay={0.2}>
              <div className="mt-8 space-y-5">
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-emerald-500/15 text-emerald-400">
                    <Bell className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white">
                      {t('whatsapp.feature1')}
                    </h3>
                    <p className="mt-0.5 text-[14px] font-medium text-white/60">
                      {t('whatsapp.feature1Sub')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-sv-blue/15 text-sv-blue-light">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white">
                      {t('whatsapp.feature2')}
                    </h3>
                    <p className="mt-0.5 text-[14px] font-medium text-white/60">
                      {t('whatsapp.feature2Sub')}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-control bg-sv-orange/15 text-sv-orange">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-[15px] font-bold text-white">
                      {t('whatsapp.feature3')}
                    </h3>
                    <p className="mt-0.5 text-[14px] font-medium text-white/60">
                      {t('whatsapp.feature3Sub')}
                    </p>
                  </div>
                </div>
              </div>
            </Reveal>
          </div>

          {/* Right Column — Interactive Subscription Card */}
          <div className="lg:col-span-6">
            <Reveal delay={0.25}>
              <div className="rounded-card border border-white/10 bg-sv-navy-soft/80 p-6 backdrop-blur-xl shadow-card sm:p-8">
                {submitted ? (
                  <div className="py-8 text-center">
                    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400 ring-4 ring-emerald-500/10">
                      <CheckCircle2 className="h-9 w-9" />
                    </div>
                    <h3 className="mt-5 text-[22px] font-black text-white">
                      {t('whatsapp.success')}
                    </h3>
                    <p className="mt-2 text-[14px] font-medium text-white/70">
                      {city && DEALS[deal] ? `${CITIES.find(c => c.slug === city)?.ka} · ${DEALS[deal]?.ka}` : ''}
                    </p>
                    <button
                      type="button"
                      onClick={() => setSubmitted(false)}
                      className="mt-6 rounded-control bg-white/10 px-5 py-2.5 text-[14px] font-bold text-white transition-colors hover:bg-white/20"
                    >
                      სხვა ფილტრის დამატება
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[12px] font-bold uppercase tracking-wider text-white/70">
                          {t('whatsapp.city')}
                        </label>
                        <select
                          value={city}
                          onChange={(e) => setCity(e.target.value)}
                          className="mt-1.5 w-full rounded-control border border-white/15 bg-white/5 px-3.5 py-2.5 text-[14px] font-semibold text-white transition-colors focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/30"
                        >
                          {CITIES.map((c) => (
                            <option key={c.slug} value={c.slug} className="bg-sv-navy text-white">
                              {lang === 'en' ? c.en : lang === 'ru' ? c.ru : c.ka}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[12px] font-bold uppercase tracking-wider text-white/70">
                          {t('whatsapp.deal')}
                        </label>
                        <select
                          value={deal}
                          onChange={(e) => setDeal(e.target.value)}
                          className="mt-1.5 w-full rounded-control border border-white/15 bg-white/5 px-3.5 py-2.5 text-[14px] font-semibold text-white transition-colors focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/30"
                        >
                          {Object.entries(DEALS).map(([k, d]) => (
                            <option key={k} value={k} className="bg-sv-navy text-white">
                              {lang === 'en' ? d.en : lang === 'ru' ? d.ru : d.ka}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="block text-[12px] font-bold uppercase tracking-wider text-white/70">
                          {t('whatsapp.type')}
                        </label>
                        <select
                          value={type}
                          onChange={(e) => setType(e.target.value)}
                          className="mt-1.5 w-full rounded-control border border-white/15 bg-white/5 px-3.5 py-2.5 text-[14px] font-semibold text-white transition-colors focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/30"
                        >
                          {Object.entries(TYPES).map(([k, tp]) => (
                            <option key={k} value={k} className="bg-sv-navy text-white">
                              {lang === 'en' ? tp.en : lang === 'ru' ? tp.ru : tp.ka}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[12px] font-bold uppercase tracking-wider text-white/70">
                          {t('whatsapp.maxPrice')}
                        </label>
                        <input
                          type="number"
                          placeholder="მაგ. 120000"
                          value={maxPrice}
                          onChange={(e) => setMaxPrice(e.target.value)}
                          className="mt-1.5 w-full rounded-control border border-white/15 bg-white/5 px-3.5 py-2.5 text-[14px] font-semibold text-white placeholder-white/40 transition-colors focus:border-sv-blue focus:outline-none focus:ring-2 focus:ring-sv-blue/30"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[12px] font-bold uppercase tracking-wider text-white/70">
                        {t('whatsapp.phone')}
                      </label>
                      <div className="relative mt-1.5">
                        <div className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-emerald-400">
                          <MessageCircle className="h-4 w-4" />
                        </div>
                        <input
                          type="tel"
                          required
                          placeholder={t('whatsapp.phonePh')}
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full rounded-control border border-white/15 bg-white/5 py-2.5 pl-10 pr-3.5 text-[14px] font-semibold text-white placeholder-white/40 transition-colors focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-2 flex w-full items-center justify-center gap-2 rounded-control bg-emerald-500 py-3.5 text-[15px] font-extrabold text-sv-navy transition-all duration-300 hover:bg-emerald-400 hover:shadow-glow-blue active:scale-[0.98] disabled:opacity-50"
                    >
                      {loading ? (
                        <span>იტვირთება…</span>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          <span>{t('whatsapp.subscribe')}</span>
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  )
}
