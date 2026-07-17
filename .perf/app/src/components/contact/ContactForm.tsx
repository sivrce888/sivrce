'use client'

import { useState, type FormEvent } from 'react'
import { Send, CheckCircle2 } from 'lucide-react'

export default function ContactForm() {
  const [sent, setSent] = useState(false)

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSent(true)
  }

  if (sent) {
    return (
      <div className="rounded-card bg-white p-8 shadow-card ring-1 ring-sv-ink/5 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-module bg-sv-blue/10">
          <CheckCircle2 className="h-7 w-7 text-sv-blue" />
        </div>
        <h2 className="mt-5 text-xl font-black tracking-[-0.02em] text-sv-ink text-balance">
          შეტყობინება გაგზავნილია
        </h2>
        <p className="mt-2 text-[15px] font-medium text-sv-ink/60">
          გმადლობთ! ჩვენი გუნდა გიპასუხებთ 24 საათის განმავლობაში.
        </p>
        <button
          type="button"
          onClick={() => setSent(false)}
          className="mt-6 rounded-full bg-sv-orange px-6 py-3 text-sm font-bold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
        >
          ახალი შეტყობინება
        </button>
      </div>
    )
  }

  const inputCls =
    'w-full rounded-control bg-sv-cloud px-4 py-3 text-[15px] font-medium text-sv-ink ring-1 ring-sv-ink/5 outline-none transition placeholder:text-sv-ink/35 focus:ring-2 focus:ring-sv-blue/40'

  return (
    <form onSubmit={onSubmit} className="rounded-card bg-white p-6 shadow-card ring-1 ring-sv-ink/5 md:p-8">
      <div className="grid gap-5">
        <div>
          <label htmlFor="contact-name" className="mb-2 block text-sm font-bold text-sv-ink">
            სახელი
          </label>
          <input id="contact-name" name="name" type="text" required placeholder="შენი სახელი" className={inputCls} />
        </div>
        <div>
          <label htmlFor="contact-email" className="mb-2 block text-sm font-bold text-sv-ink">
            ელ. ფოსტა
          </label>
          <input id="contact-email" name="email" type="email" required placeholder="name@example.com" className={inputCls} />
        </div>
        <div>
          <label htmlFor="contact-message" className="mb-2 block text-sm font-bold text-sv-ink">
            შეტყობინება
          </label>
          <textarea
            id="contact-message"
            name="message"
            required
            rows={5}
            placeholder="რით შეგვიძლია დაგეხმაროთ?"
            className={`${inputCls} resize-none`}
          />
        </div>
        <button
          type="submit"
          className="inline-flex items-center justify-center gap-2 rounded-full bg-sv-orange px-6 py-3.5 text-sm font-bold text-white shadow-glow-orange transition hover:-translate-y-0.5 hover:shadow-glow-orange-lg"
        >
          <Send className="h-4 w-4" />
          გაგზავნა
        </button>
      </div>
    </form>
  )
}
