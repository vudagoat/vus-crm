import { useState, useRef, useEffect } from 'react'
import {
  ComposedChart, Area, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { chartData } from '../data/clients'
import styles from './RevenueLineChart.module.css'

const RANGES = [
  { key: 'daily',   label: 'Daily' },
  { key: 'weekly',  label: 'Weekly' },
  { key: 'monthly', label: 'Monthly' },
]

const GREEN = '#10b981'

const fmtAxis = (n) => {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`
  if (n >= 1000) return `$${(n / 1000).toFixed(0)}k`
  return `$${n}`
}

const fmtFull = (n) => `$${n.toLocaleString()}`

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  const cur = payload.find((p) => p.dataKey === 'current')
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

function CalendarIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
      <path fillRule="evenodd" d="M6 2a1 1 0 0 0-1 1v1H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-1V3a1 1 0 1 0-2 0v1H7V3a1 1 0 0 0-1-1zm0 5a1 1 0 0 0 0 2h8a1 1 0 1 0 0-2H6z" clipRule="evenodd" />
    </svg>
  )
}

export default function RevenueLineChart() {
  const [range, setRange] = useState('daily')
  const [showPicker, setShowPicker] = useState(false)
  const [customStart, setCustomStart] = useState('')
  const [customEnd, setCustomEnd] = useState('')
  const [appliedCustom, setAppliedCustom] = useState(null)
  const pickerRef = useRef(null)

  useEffect(() => {
    const onDown = (e) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target)) {
        setShowPicker(false)
      }
    }
    document.addEventListener('mousedown', onDown)
    return () => document.removeEventListener('mousedown', onDown)
  }, [])

  const isCustom = range === 'custom'
  const data = isCustom ? chartData.monthly : chartData[range]

  const totalCurrent = data.reduce((s, d) => s + d.current, 0)
  const totalPrevious = data.reduce((s, d) => s + d.previous, 0)
  const rawPct = ((totalCurrent - totalPrevious) / totalPrevious) * 100
  const pctChange = Math.abs(rawPct).toFixed(1)
  const isUp = totalCurrent >= totalPrevious

  const handleRangeClick = (key) => {
    setRange(key)
    setAppliedCustom(null)
    setShowPicker(false)
  }

  const handleApply = () => {
    if (!customStart || !customEnd) return
    setAppliedCustom({ start: customStart, end: customEnd })
    setRange('custom')
    setShowPicker(false)
  }

  const customLabel = appliedCustom
    ? (() => {
        const f = (d) =>
          new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        return `${f(appliedCustom.start)} – ${f(appliedCustom.end)}`
      })()
    : 'Custom range'

  return (
    <div className={styles.card}>
      {/* ── Top bar ── */}
      <div className={styles.top}>
        <div className={styles.totals}>
          <div className={styles.amount}>{fmtFull(totalCurrent)}</div>
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
        </div>

        <div className={styles.controls}>
          {RANGES.map(({ key, label }) => (
            <button
              key={key}
              className={`${styles.rangeBtn} ${range === key ? styles.rangeBtnActive : ''}`}
              onClick={() => handleRangeClick(key)}
            >
              {label}
            </button>
          ))}

          <div className={styles.pickerWrap} ref={pickerRef}>
            <button
              className={`${styles.rangeBtn} ${isCustom ? styles.rangeBtnActive : ''}`}
              onClick={() => setShowPicker((v) => !v)}
            >
              <CalendarIcon />
              {customLabel}
            </button>

            {showPicker && (
              <div className={styles.pickerDropdown}>
                <span className={styles.pickerTitle}>Custom range</span>
                <div className={styles.pickerFields}>
                  <label className={styles.pickerLabel}>
                    Start date
                    <input
                      type="date"
                      className={styles.pickerInput}
                      value={customStart}
                      onChange={(e) => setCustomStart(e.target.value)}
                      max={customEnd || undefined}
                    />
                  </label>
                  <label className={styles.pickerLabel}>
                    End date
                    <input
                      type="date"
                      className={styles.pickerInput}
                      value={customEnd}
                      onChange={(e) => setCustomEnd(e.target.value)}
                      min={customStart || undefined}
                    />
                  </label>
                </div>
                <button
                  className={styles.applyBtn}
                  onClick={handleApply}
                  disabled={!customStart || !customEnd}
                >
                  Apply
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Legend ── */}
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

      {/* ── Chart ── */}
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

          {/* Area fill + solid line for current period */}
          <Area
            type="monotone"
            dataKey="current"
            stroke={GREEN}
            strokeWidth={2.5}
            fill="url(#revenueGradient)"
            dot={false}
            activeDot={{ r: 4, fill: GREEN, strokeWidth: 0 }}
          />

          {/* Dotted line for previous period — no fill */}
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
    </div>
  )
}
