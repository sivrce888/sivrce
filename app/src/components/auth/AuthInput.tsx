"use client"

import { useState, type InputHTMLAttributes } from "react"
import { Eye, EyeOff } from "lucide-react"

type Props = InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
}

export function AuthInput({ label, error, type = "text", id, className, ...rest }: Props) {
  const [show, setShow] = useState(false)
  const isPassword = type === "password"
  const inputId = id ?? rest.name ?? label
  const resolvedType = isPassword && show ? "text" : type

  return (
    <label className="block">
      <span className="mb-1.5 block text-[12.5px] font-bold tracking-tight text-sv-ink/60">
        {label}
      </span>
      <span className="relative block">
        <input
          id={inputId}
          type={resolvedType}
          className={`min-h-11 w-full rounded-control border bg-sv-cloud/80 px-4 py-3 text-[15px] font-semibold text-sv-ink outline-none transition placeholder:text-sv-ink/35 focus:border-sv-blue focus:bg-sv-surface focus:ring-2 focus:ring-sv-blue/20 ${
            error ? "border-sv-orange-deep/60" : "border-sv-ink/10"
          } ${isPassword ? "pr-11" : ""} ${className ?? ""}`}
          {...rest}
        />
        {isPassword ? (
          <button
            type="button"
            onClick={() => setShow((v) => !v)}
            className="absolute right-1.5 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-sv-ink/60 transition-colors hover:text-sv-ink focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sv-blue"
            aria-label={show ? "Hide password" : "Show password"}
            aria-pressed={show}
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        ) : null}
      </span>
      {error ? (
        <span className="mt-1.5 block text-[12px] font-semibold text-sv-orange-deep">{error}</span>
      ) : null}
    </label>
  )
}
