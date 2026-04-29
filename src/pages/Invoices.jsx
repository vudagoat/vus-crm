import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import Modal from '../components/Modal'
import mStyles from '../components/Modal.module.css'
import styles from './Invoices.module.css'

const STATUS_META = {
  paid:    { label: 'Paid',    color: 'var(--green)', bg: 'var(--green-dim)' },
  pending: { label: 'Pending', color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
  overdue: { label: 'Overdue', color: 'var(--red)',   bg: 'var(--red-dim)' },
}

const BLANK = { client: '', amount: '', issued: '', due: '', status: 'pending' }

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

const fmtId = (id) =>
  typeof id === 'number' ? `INV-${String(id).padStart(3, '0')}` : id

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('id', { ascending: false })
    if (error) setError(error.message)
    else setInvoices(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const total = (status) => invoices.filter((i) => i.status === status).reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalAll = invoices.reduce((s, i) => s + (i.amount ?? 0), 0)

  const openModal = () => { setForm(BLANK); setFormError(null); setShowModal(true) }
  const closeModal = () => setShowModal(false)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const { error } = await supabase.from('invoices').insert([{
      client: form.client.trim(),
      amount: parseFloat(form.amount) || 0,
      issued: form.issued,
      due: form.due,
      status: form.status,
    }])
    setSaving(false)
    if (error) { setFormError(error.message); return }
    closeModal()
    fetchInvoices()
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>{loading ? '…' : `${invoices.length} invoices total`}</p>
        </div>
        <button className={styles.addBtn} onClick={openModal}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" clipRule="evenodd" />
          </svg>
          New Invoice
        </button>
      </header>

      <div className={styles.summaries}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Collected</span>
          <span className={styles.summaryValue} style={{ color: 'var(--green)' }}>
            ${total('paid').toLocaleString()}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Awaiting Payment</span>
          <span className={styles.summaryValue} style={{ color: 'var(--yellow)' }}>
            ${total('pending').toLocaleString()}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Overdue</span>
          <span className={styles.summaryValue} style={{ color: 'var(--red)' }}>
            ${total('overdue').toLocaleString()}
          </span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Total Invoiced</span>
          <span className={styles.summaryValue}>${totalAll.toLocaleString()}</span>
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Invoice</th>
              <th>Client</th>
              <th>Amount</th>
              <th>Issued</th>
              <th>Due</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={7} className={styles.stateCell}>Loading invoices…</td></tr>
            )}
            {error && (
              <tr><td colSpan={7} className={`${styles.stateCell} ${styles.errorCell}`}>{error}</td></tr>
            )}
            {!loading && !error && invoices.map((inv) => {
              const meta = STATUS_META[inv.status] ?? STATUS_META.pending
              return (
                <tr key={inv.id} className={styles.row}>
                  <td className={styles.invId}>{fmtId(inv.id)}</td>
                  <td className={styles.client}>{inv.client}</td>
                  <td className={styles.amount}>${(inv.amount ?? 0).toLocaleString()}</td>
                  <td className={styles.date}>{fmtDate(inv.issued)}</td>
                  <td className={styles.date}>{fmtDate(inv.due)}</td>
                  <td>
                    <span className={styles.badge} style={{ background: meta.bg, color: meta.color }}>
                      {meta.label}
                    </span>
                  </td>
                  <td>
                    <div className={styles.actions}>
                      <button className={styles.actionBtn} title="Download">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                          <path fillRule="evenodd" d="M3 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm3.293-7.707a1 1 0 0 1 1.414 0L9 10.586V3a1 1 0 1 1 2 0v7.586l1.293-1.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                      <button className={styles.actionBtn} title="More">
                        <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                          <path d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {!loading && !error && invoices.length === 0 && (
          <div className={styles.stateCell}>No invoices yet.</div>
        )}
      </div>

      {showModal && (
        <Modal title="New Invoice" onClose={closeModal}>
          <form className={mStyles.form} onSubmit={handleSave}>
            <label className={mStyles.field}>
              Client
              <input className={mStyles.input} type="text" value={form.client} onChange={set('client')} placeholder="Apex Creative Co." required />
            </label>
            <label className={mStyles.field}>
              Amount ($)
              <input className={mStyles.input} type="number" min="0" step="50" value={form.amount} onChange={set('amount')} placeholder="4500" required />
            </label>
            <div className={mStyles.formRow}>
              <label className={mStyles.field}>
                Issue Date
                <input className={mStyles.input} type="date" value={form.issued} onChange={set('issued')} required />
              </label>
              <label className={mStyles.field}>
                Due Date
                <input className={mStyles.input} type="date" value={form.due} onChange={set('due')} required />
              </label>
            </div>
            <label className={mStyles.field}>
              Status
              <select className={mStyles.select} value={form.status} onChange={set('status')}>
                <option value="pending">Pending</option>
                <option value="paid">Paid</option>
                <option value="overdue">Overdue</option>
              </select>
            </label>
            {formError && <p className={mStyles.errorMsg}>{formError}</p>}
            <div className={mStyles.formFooter}>
              <button type="button" className={mStyles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button type="submit" className={mStyles.submitBtn} disabled={saving}>
                {saving ? 'Saving…' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
