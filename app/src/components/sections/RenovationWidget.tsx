'use client'

import { useState } from 'react'
import LocalizedLink from '@/components/LocalizedLink'
import { Paintbrush, ArrowRight, Calculator, CheckCircle2 } from 'lucide-react'
import { Reveal } from '@/components/Reveal'
import { SERVICE_BRAND } from '@/lib/category-brand'

const FRAME_OPTIONS = [
  { id: 'black', label: 'შავი კარკასი', costPerM2: 180, desc: 'სრული რემონტი ნულოვანი მდგომარეობიდან' },
  { id: 'white', label: 'თეთრი კარკასი', costPerM2: 120, desc: 'მალე ჭერი, იატაკი და სანტექნიკა' },
  { id: 'green', label: 'მწვანე კარკასი', costPerM2: 80, desc: 'კოსმეტიკური და დიზაინერული მოწყობა' },
  { id: 'turnkey', label: 'გასაღების ჩაბარებით', costPerM2: 250, desc: 'პრემიუმ რემონტი ავეჯითა და ტექნიკით' },
]

export default function RenovationWidget() {
  const [area, setArea] = useState<number>(65)
  const [selectedFrame, setSelectedFrame] = useState<string>('black')

  const frame = FRAME_OPTIONS.find((f) => f.id === selectedFrame) || FRAME_OPTIONS[0]
  const totalUSD = area * frame.costPerM2
  const totalGEL = Math.round(totalUSD * 2.7)

  return (
    <section className="relative overflow-hidden bg-sv-surface py-16 md:py-24">
      <div className="mx-auto max-w-[1440px] px-5 md:px-10">
        <Reveal className="mb-10 text-center">
          <span
            className="mb-3 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-[12px] font-black uppercase tracking-wider"
            style={{ backgroundColor: SERVICE_BRAND.renovation.chip, color: SERVICE_BRAND.renovation.hue }}
          >
            <Calculator className="h-3.5 w-3.5" /> რემონტი და კალკულატორი
          </span>
          <h2 className="text-balance text-[28px] font-black tracking-[-0.02em] text-sv-ink md:text-[38px]">
            გამოითვალე რემონტის სავარაუდო ბიუჯეტი
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-[14px] font-semibold text-sv-ink/65 md:text-[16px]">
            აირჩიე ბინის ფართობი და მდგომარეობა — მიიღე მყისიერი გაანგარიშება
          </p>
        </Reveal>

        <div className="mx-auto max-w-4xl overflow-hidden rounded-card border border-sv-ink/[0.08] bg-gradient-to-b from-sv-cloud to-sv-surface p-6 md:p-10 shadow-card">
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Controls */}
            <div className="space-y-6 lg:col-span-7">
              {/* Area Slider */}
              <div>
                <div className="flex items-center justify-between text-[14px] font-extrabold text-sv-ink">
                  <span>ბინის ფართობი (მ²)</span>
                  <span className="text-[18px] font-black text-sv-orange">{area} მ²</span>
                </div>
                <input
                  type="range"
                  min={25}
                  max={250}
                  step={5}
                  value={area}
                  onChange={(e) => setArea(Number(e.target.value))}
                  className="mt-3 h-2 w-full cursor-pointer appearance-none rounded-full bg-sv-ink/10 accent-sv-orange"
                />
                <div className="mt-1 flex justify-between text-[11px] font-bold text-sv-ink/40">
                  <span>25 მ²</span>
                  <span>100 მ²</span>
                  <span>250 მ²</span>
                </div>
              </div>

              {/* Frame Selector Buttons */}
              <div>
                <label className="mb-2.5 block text-[14px] font-extrabold text-sv-ink">
                  საწყისი მდგომარეობა
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {FRAME_OPTIONS.map((f) => {
                    const active = f.id === selectedFrame
                    return (
                      <button
                        key={f.id}
                        type="button"
                        onClick={() => setSelectedFrame(f.id)}
                        className={`flex flex-col items-start rounded-control p-3.5 text-left text-[13px] font-extrabold transition-all ${
                          active
                            ? 'bg-sv-navy text-white shadow-glow-navy'
                            : 'bg-sv-surface text-sv-ink/80 border border-sv-ink/10 hover:border-sv-blue/30'
                        }`}
                      >
                        <span className="flex items-center gap-1.5">
                          <CheckCircle2 className={`h-3.5 w-3.5 ${active ? 'text-sv-orange' : 'text-sv-ink/30'}`} />
                          {f.label}
                        </span>
                        <span className={`mt-1 text-[11px] font-bold ${active ? 'text-white/70' : 'text-sv-ink/50'}`}>
                          ${f.costPerM2}/მ²-დან
                        </span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </div>

            {/* Price Output Result */}
            <div className="flex flex-col justify-between rounded-module border border-sv-orange/20 bg-sv-navy p-6 text-white lg:col-span-5">
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-sv-orange/20 px-3 py-1 text-[11px] font-extrabold text-sv-orange">
                  <Paintbrush className="h-3 w-3" /> სავარაუდო ღირებულება
                </span>
                <div className="mt-4">
                  <div className="text-[32px] font-black text-white md:text-[38px]">
                    ${totalUSD.toLocaleString()}
                  </div>
                  <div className="text-[18px] font-extrabold text-sv-orange">
                    ≈ {totalGEL.toLocaleString()} ₾
                  </div>
                </div>
                <p className="mt-3 text-[12px] font-medium leading-relaxed text-white/60">
                  მოიცავს მასალების, ხელობისა და სამუშაოების სრულ ციკლს ({area} მ² • {frame.label}).
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-white/10">
                <LocalizedLink
                  href="/contact"
                  className="flex w-full items-center justify-center gap-2 rounded-control bg-sv-orange px-5 py-3 text-[14px] font-black text-white shadow-glow-orange transition-all hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
                >
                  ხარჯთაღრიცხვის მიღება
                  <ArrowRight className="h-4 w-4" />
                </LocalizedLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
