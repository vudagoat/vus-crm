import { useState, useEffect } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase } from '../supabaseClient'
import styles from './RevenueLineChart.module.css'

const RANGES = [
  { key: 'daily',   label: 'Daily' },
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

const GREEN = '#10b981'
const MS_DAY = 86_400_000
const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

function inRange(inv, start, end) {
  const d = new Date(inv.created_at)
  return d >= start && d <= end
}

function sumAmount(arr) {
  return arr.reduce((s, inv) => s + (inv.amount ?? 0), 0)
}

// Current: last 7 days. Previous: the 7 days before that.
function buildDaily(invoices) {
  const now = new Date()
  return Array.from({ length: 7 }, (_, i) => {
    const offset = 6 - i
    const dayStart = new Date(now)
    dayStart.setDate(dayStart.getDate() - offset)
    dayStart.setHours(0, 0, 0, 0)
    const dayEnd = new Date(dayStart)
    dayEnd.setHours(23, 59, 59, 999)
    const prevStart = new Date(dayStart.getTime() - 7 * MS_DAY)
    const prevEnd   = new Date(dayEnd.getTime()   - 7 * MS_DAY)
    return {
      label:    DAY_NAMES[dayStart.getDay()],
      current:  sumAmount(invoices.filter(inv => inRange(inv, dayStart, dayEnd))),
      previous: sumAmount(invoices.filter(inv => inRange(inv, prevStart, prevEnd))),
    }
  })
}

// Current: last 4 weeks. Previous: the 4 weeks before that.
function buildWeekly(invoices) {
  const now = new Date()
  return Array.from({ length: 4 }, (_, i) => {
    const offset = 3 - i
    const weekEnd = new Date(now)
    weekEnd.setDate(weekEnd.getDate() - offset * 7)
    weekEnd.setHours(23, 59, 59, 999)
    const weekStart = new Date(weekEnd)
    weekStart.setDate(weekStart.getDate() - 6)
    weekStart.setHours(0, 0, 0, 0)
    const prevStart = new Date(weekStart.getTime() - 4 * 7 * MS_DAY)
    const prevEnd   = new Date(weekEnd.getTime()   - 4 * 7 * MS_DAY)
    return {
      label:    `Wk ${i + 1}`,
      current:  sumAmount(invoices.filter(inv => inRange(inv, weekStart, weekEnd))),
      previous: sumAmount(invoices.filter(inv => inRange(inv, prevStart, prevEnd))),
    }
  })
}

// Current: last 6 calendar months. Previous: the 6 months before that.
function buildMonthly(invoices) {
  const now = new Date()
  return Array.from({ length: 6 }, (_, i) => {
    const offset = 5 - i
    const d = new Date(now.getFullYear(), now.getMonth() - offset, 1)
    const monthStart = new Date(d.getFullYear(), d.getMonth(), 1)
    const monthEnd   = new Date(d.getFullYear(), d.getMonth() + 1, 0, 23, 59, 59, 999)
    const prevD      = new Date(d.getFullYear(), d.getMonth() - 6, 1)
    const prevStart  = new Date(prevD.getFullYear(), prevD.getMonth(), 1)
    const prevEnd    = new Date(prevD.getFullYear(), prevD.getMonth() + 1, 0, 23, 59, 59, 999)
    return {
      label:    MONTH_NAMES[d.getMonth()],
      current:  sumAmount(invoices.filter(inv => inRange(inv, monthStart, monthEnd))),
      previous: sumAmount(invoices.filter(inv => inRange(inv, prevStart, prevEnd))),
    }
  })
}

const BUILDERS = { daily: buildDaily, weekly: buildWeekly, monthly: buildMonthly }

const fmtAxis = (n) => {
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000)     return `$${(n / 1_000).toFixed(0)}k`
  return `$${n}`
}

const fmtFull = (n) => `$${n.toLocaleString()}`

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const cur  = payload.find((p) => p.dataKey === 'current')
  const prev = payload.find((p) => p.dataKey === 'previous')
  return (
    <div className={styles.tooltip}>
      <span className={styles.ttLabel}>{label}</span>
      {cur && (
        <div className={styles.ttRow}>
          <span className={styles.ttDot} />
          <span className={styles.ttKey}>Current</span>
          <span className={styles.ttVal}>{fmtFull(cur.value)}</span>
        </div>
      )}
      {prev && (
        <div className={styles.ttRow}>
          <span className={styles.ttDash} />
          <span className={styles.ttKey}>Previous</span>
          <span className={`${styles.ttVal} ${styles.ttValMuted}`}>{fmtFull(prev.value)}</span>
        </div>
      )}
    </div>
  )
}

export default function RevenueLineChart() {
  const [range, setRange] = useState('monthly')
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      // 12 months covers all views (6 current + 6 previous for monthly)
      const cutoff = new Date()
      cutoff.setFullYear(cutoff.getFullYear() - 1)
      const { data } = await supabase
        .from('invoices')
        .select('amount, created_at')
        .gte('created_at', cutoff.toISOString())
      setInvoices(data ?? [])
      setLoading(false)
    }
    fetchInvoices()
  }, [])

  const data = BUILDERS[range](invoices)
  const totalCurrent  = data.reduce((s, d) => s + d.current,  0)
  const totalPrevious = data.reduce((s, d) => s + d.previous, 0)
  const hasData = data.some((d) => d.current > 0 || d.previous > 0)

  const rawPct = totalPrevious > 0
    ? ((totalCurrent - totalPrevious) / totalPrevious) * 100
    : totalCurrent > 0 ? 100 : 0
  const pctChange = Math.abs(rawPct).toFixed(1)
  const isUp = totalCurrent >= totalPrevious

  return (
    <div className={styles.card}>
      {/* ── Top bar ── */}
      <div className={styles.top}>
        <div className={styles.totals}>
          <div className={styles.amount}>{loading ? '—' : fmtFull(totalCurrent)}</div>
          {!loading && hasData && (
            <div className={`${styles.change} ${isUp ? styles.changeUp : styles.changeDown}`}>
              <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13" aria-hidden>
                {isUp ? (
                  <path fillRule="evenodd" d="M3.293 9.707a1 1 0 0 1 0-1.414l6-6a1 1 0 0 1 1.414 0l6 6a1 1 0 0 1-1.414 1.414L11 5.414V17a1 1 0 1 1-2 0V5.414L4.707 9.707a1 1 0 0 1-1.414 0z" clipRule="evenodd" />
                ) : (
                  <path fillRule="evenodd" d="M16.707 10.293a1 1 0 0 1 0 1.414l-6 6a1 1 0 0 1-1.414 0l-6-6a1 1 0 0 1 1.414-1.414L9 14.586V3a1 1 0 0 1 2 0v11.586l4.293-4.293a1 1 0 0 1 1.414 0z" clipRule="evenodd" />
                )}
              </svg>
              {pctChange}%
              <span className={styles.changeSub}>vs previous period</span>
            </div>
          )}
        </div>

        <div className={styles.controls}>
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.rangeBtn} ${range === key ? styles.rangeBtnActive : ''}`}
              onClick={() => setRange(key)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Legend (only when data exists) ── */}
      {!loading && hasData && (
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={styles.legendSolid} />
            Current period
          </span>
          <span className={styles.legendItem}>
            <span className={styles.legendDashed} />
            Previous period
          </span>
        </div>
      )}

      {/* ── Chart / states ── */}
      {loading ? (
        <div className={styles.emptyState}>
          <span className={styles.emptyTitle}>Loading…</span>
        </div>
      ) : !hasData ? (
        <div className={styles.emptyState}>
          <svg viewBox="0 0 24 24" fill="none" width="36" height="36" className={styles.emptyIcon}>
            <path d="M3 3v18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M7 16l4-4 4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          <p className={styles.emptyTitle}>No data yet</p>
          <p className={styles.emptySub}>Revenue will appear here once invoices are recorded.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={data} margin={{ top: 4, right: 4, left: -4, bottom: 0 }}>
            <defs>
              <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.22} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-subtle)" vertical={false} />
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: 'var(--text-secondary)', fontSize: 12 }}
              tickFormatter={fmtAxis}
              width={50}
            />
            <Tooltip
              content={<CustomTooltip />}
              cursor={{ stroke: 'var(--border)', strokeWidth: 1, strokeDasharray: '3 3' }}
            />
            <Area
              type="monotone"
              dataKey="current"
              stroke={GREEN}
              strokeWidth={2.5}
              fill="url(#revenueGradient)"
              dot={false}
              activeDot={{ r: 4, fill: GREEN, strokeWidth: 0 }}
            />
            <Line
              type="monotone"
              dataKey="previous"
              stroke={GREEN}
              strokeWidth={1.5}
              strokeDasharray="5 4"
              strokeOpacity={0.4}
              dot={false}
              activeDot={{ r: 3, fill: GREEN, fillOpacity: 0.5, strokeWidth: 0 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
