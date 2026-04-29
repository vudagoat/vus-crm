import { useState, useEffect } from 'react'
import MetricCard from '../components/MetricCard'
import RevenueLineChart from '../components/RevenueLineChart'
import { supabase } from '../supabaseClient'
import styles from './Dashboard.module.css'

const fmt = (n) =>
  n >= 1000 ? `$${(n / 1000).toFixed(n % 1000 === 0 ? 0 : 1)}k` : `$${n}`

const todayLabel = new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export default function Dashboard() {
  const [metrics, setMetrics] = useState({
    revenueMTD: null,
    activeProjects: null,
    pipelineValue: null,
    overdueCount: null,
  })
  const [recentClients, setRecentClients] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAll() {
      const now = new Date()
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`

      const [clientsRes, dealsRes, invoicesRes] = await Promise.all([
        supabase
          .from('clients')
          .select('id, name, project_type, value, status')
          .order('id', { ascending: false }),
        supabase.from('deals').select('value'),
        supabase.from('invoices').select('amount').eq('status', 'paid').gte('issued', monthStart),
      ])

      const clients = clientsRes.data ?? []
      const deals = dealsRes.data ?? []
      const invoices = invoicesRes.data ?? []

      setMetrics({
        revenueMTD: invoices.reduce((s, i) => s + (i.amount ?? 0), 0),
        activeProjects: clients.filter((c) => c.status === 'active').length,
        pipelineValue: deals.reduce((s, d) => s + (d.value ?? 0), 0),
        overdueCount: clients.filter((c) => c.status === 'overdue').length,
      })
      setRecentClients(clients.slice(0, 5))
      setLoading(false)
    }
    fetchAll()
  }, [])

  const d$ = (n) => (loading ? '—' : `$${n.toLocaleString()}`)
  const n$ = (n) => (loading ? '—' : n)
  const k$ = (n) => (loading ? '—' : fmt(n))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Welcome back, Aidan</h1>
          <p className={styles.subtitle}>{todayLabel}</p>
        </div>
        <button className={styles.newBtn}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" clipRule="evenodd" />
          </svg>
          New Project
        </button>
      </header>

      <div className={styles.metrics}>
        <MetricCard
          label="Revenue MTD"
          value={d$(metrics.revenueMTD)}
          sub="This month · paid invoices"
          trend={loading ? undefined : undefined}
          accent="#6b7280"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 0 1-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 0 1-.567.267z" />
              <path fillRule="evenodd" d="M10 18a8 8 0 1 0 0-16 8 8 0 0 0 0 16zm1-13a1 1 0 1 0-2 0v.092a4.535 4.535 0 0 0-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 1 0-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 1 0 2 0v-.092a4.535 4.535 0 0 0 1.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0 0 11 9.092V7.151c.391.127.68.317.843.504a1 1 0 1 0 1.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
            </svg>
          }
        />
        <MetricCard
          label="Active Projects"
          value={n$(metrics.activeProjects)}
          sub="Currently active"
          accent="var(--blue)"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 6V5a3 3 0 0 1 3-3h2a3 3 0 0 1 3 3v1h2a2 2 0 0 1 2 2v3.57A22.952 22.952 0 0 1 10 13a22.95 22.95 0 0 1-8-1.43V8a2 2 0 0 1 2-2h2zm2-1a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v1H8V5zm1 5a1 1 0 0 1 1-1h.01a1 1 0 1 1 0 2H10a1 1 0 0 1-1-1z" clipRule="evenodd" />
              <path d="M2 13.692V16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2.308A24.974 24.974 0 0 1 10 15c-2.796 0-5.487-.46-8-1.308z" />
            </svg>
          }
        />
        <MetricCard
          label="Pipeline Value"
          value={k$(metrics.pipelineValue)}
          sub="All open deals"
          accent="var(--green)"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path d="M2 11a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1v-5zm6-4a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V7zm6-3a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-2a1 1 0 0 1-1-1V4z" />
            </svg>
          }
        />
        <MetricCard
          label="Overdue"
          value={n$(metrics.overdueCount)}
          sub="Action required"
          accent="var(--red)"
          icon={
            <svg viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-1-8a1 1 0 0 0-1 1v3a1 1 0 0 0 2 0V6a1 1 0 0 0-1-1z" clipRule="evenodd" />
            </svg>
          }
        />
      </div>

      <div className={styles.grid}>
        <RevenueLineChart />

        <div className={styles.recentCard}>
          <div className={styles.cardHeader}>
            <h2 className={styles.cardTitle}>Recent Clients</h2>
            <a href="/clients" className={styles.viewAll}>View all →</a>
          </div>

          {loading ? (
            <div className={styles.loadingMsg}>Loading…</div>
          ) : recentClients.length === 0 ? (
            <div className={styles.loadingMsg}>No clients yet.</div>
          ) : (
            <div className={styles.clientList}>
              {recentClients.map((c) => (
                <div key={c.id} className={styles.clientRow}>
                  <div className={styles.clientAvatar}>
                    {c.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                  </div>
                  <div className={styles.clientInfo}>
                    <span className={styles.clientName}>{c.name}</span>
                    <span className={styles.clientType}>{c.project_type}</span>
                  </div>
                  <div className={styles.clientRight}>
                    <span className={styles.clientValue}>${(c.value ?? 0).toLocaleString()}</span>
                    <span className={`${styles.statusBadge} ${styles[c.status]}`}>{c.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
