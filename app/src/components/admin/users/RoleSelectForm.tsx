"use client"

/** Role picker + submit with a native confirm gate (uncontrolled, JS-optional render). */
export function RoleSelectForm({
  userId,
  currentRole,
  roles,
  action,
}: {
  userId: string
  currentRole: string
  roles: readonly string[]
  action: (formData: FormData) => void | Promise<void>
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        const next = new FormData(e.currentTarget).get("role")
        if (next === currentRole) {
          e.preventDefault()
          return
        }
        if (!window.confirm(`Change this user's role to "${next}"?`)) e.preventDefault()
      }}
      className="flex flex-wrap items-end gap-2"
    >
      <input type="hidden" name="id" value={userId} />
      <label className="text-[12.5px] font-semibold text-sv-ink/50">
        Role
        <select
          name="role"
          defaultValue={currentRole}
          className="mt-1 block h-9 min-w-[140px] rounded-[var(--radius-control)] border border-sv-ink/10 bg-white px-3 text-[13.5px] font-semibold text-sv-ink outline-none focus:border-sv-blue"
        >
          {roles.map((r) => (
            <option key={r} value={r}>
              {r[0].toUpperCase() + r.slice(1)}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="inline-flex h-9 items-center justify-center rounded-[var(--radius-control)] bg-sv-blue px-3.5 text-[12.5px] font-bold whitespace-nowrap text-white transition-colors hover:bg-sv-blue-deep"
      >
        Update role
      </button>
    </form>
  )
}
