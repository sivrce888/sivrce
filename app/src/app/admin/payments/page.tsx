import { BadgeDollarSign, Banknote, CreditCard, HandCoins, RefreshCcw } from "lucide-react"

import { markGeorgianOrderRefunded } from "@/app/admin/payments/actions"
import { ConfirmButton } from "@/components/admin/ui/ConfirmButton"
import { DataTable, THeadRow, TRow, td, th } from "@/components/admin/ui/DataTable"
import { EmptyState } from "@/components/admin/ui/EmptyState"
import { FilterSelect } from "@/components/admin/ui/FilterSelect"
import { PageHeader } from "@/components/admin/ui/PageHeader"
import { Pagination } from "@/components/admin/ui/Pagination"
import { StatCard } from "@/components/admin/ui/StatCard"
import { StatusPill } from "@/components/admin/ui/StatusPill"
import { TabLinks } from "@/components/admin/ui/TabLinks"
import { fmtDateTime, fmtMoney, fmtNum, fmtTetri } from "@/lib/admin/format"
import {
  GEORGIAN_ORDER_STATUSES,
  getRevenueStats,
  isPaymentTab,
  listGeorgianOrders,
  listLeadPurchases,
  listStripeOrders,
  listSubscriptions,
  PAYMENT_TABS,
  STRIPE_ORDER_STATUSES,
  userLabels,
} from "@/lib/admin/payments"
import {
  ADMIN_PAGE_SIZE,
  hrefWithParams,
  mergeParams,
  param,
  parsePage,
  type SearchParams,
} from "@/lib/admin/query"

function userText(
  map: Map<string, string>,
  id: string | null,
): string {
  if (!id) return "—"
  return map.get(id) ?? id
}

export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>
}) {
  const sp = await searchParams
  const tabRaw = param(sp.tab)
  const tab = isPaymentTab(tabRaw) ? tabRaw : "georgian"
  const status = param(sp.status)
  const page = parsePage(sp.page)

  const stats = await getRevenueStats()

  const tabs = PAYMENT_TABS.map((t) => ({
    href: hrefWithParams(
      "/admin/payments",
      mergeParams(sp, { tab: t.value === "georgian" ? undefined : t.value, page: undefined, status: undefined }),
    ),
    label: t.label,
    active: tab === t.value,
  }))

  return (
    <div>
      <PageHeader
        title="Payments"
        description="Revenue, orders, subscriptions and lead purchases"
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Georgian revenue · this month"
          value={fmtTetri(stats.georgianTetri)}
          hint="Paid orders via Georgian providers"
          icon={Banknote}
          tone="success"
        />
        <StatCard
          label="Stripe revenue · this month"
          value={fmtMoney(Math.round(stats.stripeCents / 100), "USD")}
          hint="Succeeded Stripe orders"
          icon={CreditCard}
          tone="blue"
        />
        <StatCard
          label="Active subscriptions"
          value={fmtNum(stats.activeSubs)}
          hint="Status active or trialing"
          icon={RefreshCcw}
          tone="ink"
        />
        <StatCard
          label="Lead revenue · this month"
          value={fmtMoney(stats.leadRevenue)}
          hint="Lead purchases by agents"
          icon={HandCoins}
          tone="orange"
        />
      </div>

      <TabLinks items={tabs} />

      {tab === "georgian" ? <GeorgianOrders page={page} status={status} sp={sp} /> : null}
      {tab === "stripe" ? <StripeOrders page={page} status={status} sp={sp} /> : null}
      {tab === "subscriptions" ? <Subscriptions page={page} sp={sp} /> : null}
      {tab === "leads" ? <LeadPurchases page={page} sp={sp} /> : null}
    </div>
  )
}

async function GeorgianOrders({
  page,
  status,
  sp,
}: {
  page: number
  status: string
  sp: SearchParams
}) {
  const { rows, total } = await listGeorgianOrders(page, status)
  const users = await userLabels(rows.map((o) => o.userId))
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <FilterSelect
          name="status"
          label="Status"
          options={GEORGIAN_ORDER_STATUSES}
          value={status}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={Banknote}
          title="No Georgian orders"
          hint="Orders paid via Georgian providers (TBC, BOG…) will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Order</th>
              <th className={th}>User</th>
              <th className={th}>Provider</th>
              <th className={th}>Tier</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={th}>Status</th>
              <th className={th}>Created</th>
              <th className={th}>Actions</th>
            </THeadRow>
            <tbody>
              {rows.map((o) => (
                <TRow key={o.id}>
                  <td className={`${td} max-w-[180px] truncate font-mono text-[12.5px]`}>
                    {o.providerOrderId}
                  </td>
                  <td className={`${td} max-w-[220px] truncate`}>{userText(users, o.userId)}</td>
                  <td className={td}>{o.provider}</td>
                  <td className={td}>{o.tier}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {fmtTetri(o.amountTetri, o.currency)}
                  </td>
                  <td className={td}>
                    <StatusPill status={o.status} />
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(o.createdAt)}</td>
                  <td className={td}>
                    {o.status === "paid" ? (
                      <ConfirmButton
                        action={markGeorgianOrderRefunded}
                        fields={{ id: o.id }}
                        label="Mark refunded"
                        tone="warning"
                        confirm={`Mark order ${o.providerOrderId} as refunded?`}
                      />
                    ) : (
                      <span className="text-[12px] text-sv-ink/30">—</span>
                    )}
                  </td>
                </TRow>
              ))}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/payments"
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            params={sp}
          />
        </>
      )}
    </div>
  )
}

async function StripeOrders({
  page,
  status,
  sp,
}: {
  page: number
  status: string
  sp: SearchParams
}) {
  const { rows, total } = await listStripeOrders(page, status)
  const users = await userLabels(rows.map((o) => o.userId))
  return (
    <div>
      <div className="mb-4 flex justify-end">
        <FilterSelect
          name="status"
          label="Status"
          options={STRIPE_ORDER_STATUSES}
          value={status}
        />
      </div>
      {rows.length === 0 ? (
        <EmptyState
          icon={CreditCard}
          title="No Stripe orders"
          hint="Stripe checkout orders will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Session</th>
              <th className={th}>User</th>
              <th className={th}>Tier</th>
              <th className={`${th} text-right`}>Amount</th>
              <th className={th}>Status</th>
              <th className={th}>Created</th>
            </THeadRow>
            <tbody>
              {rows.map((o) => (
                <TRow key={o.id}>
                  <td className={`${td} max-w-[180px] truncate font-mono text-[12.5px]`}>
                    {o.sessionId}
                  </td>
                  <td className={`${td} max-w-[220px] truncate`}>{userText(users, o.userId)}</td>
                  <td className={td}>{o.tier.replaceAll("_", " ")}</td>
                  <td className={`${td} text-right tabular-nums`}>
                    {fmtTetri(o.amountCents, o.currency.toUpperCase())}
                  </td>
                  <td className={td}>
                    <StatusPill status={o.status} />
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(o.createdAt)}</td>
                </TRow>
              ))}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/payments"
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            params={sp}
          />
        </>
      )}
    </div>
  )
}

async function Subscriptions({ page, sp }: { page: number; sp: SearchParams }) {
  const { rows, total } = await listSubscriptions(page)
  return (
    <div>
      {rows.length === 0 ? (
        <EmptyState
          icon={RefreshCcw}
          title="No subscriptions"
          hint="Agent and agency subscriptions will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>User</th>
              <th className={th}>Tier</th>
              <th className={th}>Interval</th>
              <th className={th}>Status</th>
              <th className={th}>Period ends</th>
              <th className={th}>Auto-renew</th>
              <th className={th}>Created</th>
            </THeadRow>
            <tbody>
              {rows.map((s) => (
                <TRow key={s.id}>
                  <td className={`${td} max-w-[220px] truncate`}>
                    {s.user.name ? `${s.user.name} (${s.user.email})` : s.user.email}
                  </td>
                  <td className={td}>{s.tier.replaceAll("_", " ")}</td>
                  <td className={td}>{s.interval === "month" ? "Monthly" : "Yearly"}</td>
                  <td className={td}>
                    <StatusPill status={s.status} />
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(s.currentPeriodEnd)}</td>
                  <td className={td}>{s.cancelAtPeriodEnd ? "Cancels at period end" : "Renews"}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(s.createdAt)}</td>
                </TRow>
              ))}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/payments"
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            params={sp}
          />
        </>
      )}
    </div>
  )
}

async function LeadPurchases({ page, sp }: { page: number; sp: SearchParams }) {
  const { rows, total } = await listLeadPurchases(page)
  const users = await userLabels(rows.map((r) => r.buyerId))
  return (
    <div>
      {rows.length === 0 ? (
        <EmptyState
          icon={BadgeDollarSign}
          title="No lead purchases"
          hint="Leads purchased by agents from the marketplace will appear here."
        />
      ) : (
        <>
          <DataTable>
            <THeadRow>
              <th className={th}>Buyer</th>
              <th className={th}>Lead</th>
              <th className={th}>Location</th>
              <th className={`${th} text-right`}>Price</th>
              <th className={th}>Purchased</th>
              <th className={th}>Expires</th>
            </THeadRow>
            <tbody>
              {rows.map((r) => (
                <TRow key={r.id}>
                  <td className={`${td} max-w-[220px] truncate`}>{userText(users, r.buyerId)}</td>
                  <td className={`${td} max-w-[200px] truncate`}>{r.inquiry.buyerName}</td>
                  <td className={td}>
                    {[r.inquiry.district, r.inquiry.city].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className={`${td} text-right tabular-nums`}>
                    {fmtMoney(r.price, r.currency)}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(r.purchasedAt)}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {r.expiresAt ? fmtDateTime(r.expiresAt) : "—"}
                  </td>
                </TRow>
              ))}
            </tbody>
          </DataTable>
          <Pagination
            basePath="/admin/payments"
            page={page}
            pageSize={ADMIN_PAGE_SIZE}
            total={total}
            params={sp}
          />
        </>
      )}
    </div>
  )
}
