import { useState, useEffect, useCallback, useRef } from 'react'
import { supabase } from '../supabaseClient'
import Modal from '../components/Modal'
import DropdownMenu, { DropdownItem } from '../components/DropdownMenu'
import mStyles from '../components/Modal.module.css'
import styles from './Invoices.module.css'

const STATUS_META = {
  paid:    { label: 'Paid',    color: 'var(--green)', bg: 'var(--green-dim)' },
  pending: { label: 'Pending', color: 'var(--yellow)', bg: 'var(--yellow-dim)' },
  overdue: { label: 'Overdue', color: 'var(--red)',   bg: 'var(--red-dim)' },
}

const BLANK = { client: '', amount: '', issued: '', due: '', status: 'pending', pdf_file: null }

const fmtDate = (d) =>
  d ? new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'

export default function Invoices() {
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingInvoice, setEditingInvoice] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)
  const fileInputRef = useRef(null)

  const fetchInvoices = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('invoices')
      .select('*')
      .order('invoice_number', { ascending: false })
    if (error) setError(error.message)
    else setInvoices(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchInvoices() }, [fetchInvoices])

  const closeMenu = () => { setActiveMenu(null); setMenuAnchor(null) }

  const total = (status) => invoices.filter((i) => i.status === status).reduce((s, i) => s + (i.amount ?? 0), 0)
  const totalAll = invoices.reduce((s, i) => s + (i.amount ?? 0), 0)

  const openAdd = () => {
    setEditingInvoice(null)
    setForm(BLANK)
    setFormError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowModal(true)
  }

  const openEdit = (inv) => {
    closeMenu()
    setEditingInvoice(inv)
    setForm({
      client: inv.client ?? '',
      amount: inv.amount ?? '',
      issued: inv.issued ?? '',
      due: inv.due ?? '',
      status: inv.status ?? 'pending',
      pdf_file: null,
    })
    setFormError(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingInvoice(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    let pdf_url = editingInvoice?.pdf_url ?? null

    if (form.pdf_file) {
      const ext = form.pdf_file.name.split('.').pop()
      const fileName = `${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage
        .from('invoices')
        .upload(fileName, form.pdf_file, { upsert: false })
      if (uploadError) {
        setFormError(`PDF upload failed: ${uploadError.message}`)
        setSaving(false)
        return
      }
      const { data: urlData } = supabase.storage.from('invoices').getPublicUrl(fileName)
      pdf_url = urlData.publicUrl
    }

    const basePayload = {
      client: form.client.trim(),
      amount: parseFloat(form.amount) || 0,
      issued: form.issued,
      due: form.due,
      status: form.status,
      pdf_url,
    }

    let dbError
    if (editingInvoice) {
      const { error } = await supabase.from('invoices').update(basePayload).eq('id', editingInvoice.id)
      dbError = error
    } else {
      const { count } = await supabase.from('invoices').select('*', { count: 'exact', head: true })
      const invoice_number = String((count ?? 0) + 1).padStart(4, '0')
      const { error } = await supabase.from('invoices').insert([{ ...basePayload, invoice_number }])
      dbError = error
    }

    setSaving(false)
    if (dbError) { setFormError(dbError.message); return }
    closeModal()
    fetchInvoices()
  }

  const handleDelete = async (id) => {
    closeMenu()
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return
    const { error } = await supabase.from('invoices').delete().eq('id', id)
    if (error) { alert(error.message); return }
    fetchInvoices()
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))
  const setFile = (e) => setForm((f) => ({ ...f, pdf_file: e.target.files[0] ?? null }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Invoices</h1>
          <p className={styles.subtitle}>{loading ? '…' : `${invoices.length} invoices total`}</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" clipRule="evenodd" />
          </svg>
          New Invoice
        </button>
      </header>

      <div className={styles.summaries}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Collected</span>
          <span className={styles.summaryValue} style={{ color: 'var(--green)' }}>${total('paid').toLocaleString()}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Awaiting Payment</span>
          <span className={styles.summaryValue} style={{ color: 'var(--yellow)' }}>${total('pending').toLocaleString()}</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Overdue</span>
          <span className={styles.summaryValue} style={{ color: 'var(--red)' }}>${total('overdue').toLocaleString()}</span>
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
              <th>Invoice #</th>
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
              const displayNumber = inv.invoice_number ? `#${inv.invoice_number}` : `#${String(inv.id).slice(-4)}`
              return (
                <tr key={inv.id} className={styles.row}>
                  <td className={styles.invId}>{displayNumber}</td>
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
                    <div className={styles.rowActions}>
                      {inv.pdf_url && (
                        <a
                          href={inv.pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.downloadBtn}
                          title="Download PDF"
                          download
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path fillRule="evenodd" d="M3 17a1 1 0 0 1 1-1h12a1 1 0 1 1 0 2H4a1 1 0 0 1-1-1zm3.293-7.707a1 1 0 0 1 1.414 0L9 10.586V3a1 1 0 1 1 2 0v7.586l1.293-1.293a1 1 0 1 1 1.414 1.414l-3 3a1 1 0 0 1-1.414 0l-3-3a1 1 0 0 1 0-1.414z" clipRule="evenodd" />
                          </svg>
                        </a>
                      )}
                      <div className={styles.menuWrap}>
                        <button
                          className={styles.actionBtn}
                          title="More options"
                          onClick={(e) => {
                            activeMenu === inv.id ? closeMenu() : (setActiveMenu(inv.id), setMenuAnchor(e.currentTarget))
                          }}
                        >
                          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                            <path d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                          </svg>
                        </button>
                        {activeMenu === inv.id && (
                          <DropdownMenu triggerEl={menuAnchor} onClose={closeMenu}>
                            <DropdownItem
                              icon={<svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>}
                              onClick={() => openEdit(inv)}
                            >Edit</DropdownItem>
                            <DropdownItem
                              danger
                              icon={<svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M9 2a1 1 0 0 0-.894.553L7.382 4H4a1 1 0 0 0 0 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a1 1 0 0 0 0-2h-3.382l-.724-1.447A1 1 0 0 0 11 2H9zM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8zm4 0a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8z" clipRule="evenodd" /></svg>}
                              onClick={() => handleDelete(inv.id)}
                            >Delete</DropdownItem>
                          </DropdownMenu>
                        )}
                      </div>
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
        <Modal title={editingInvoice ? 'Edit Invoice' : 'New Invoice'} onClose={closeModal}>
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
            <label className={mStyles.field}>
              Attach PDF {editingInvoice?.pdf_url && <span className={styles.pdfNote}>(replaces existing)</span>}
              <input
                ref={fileInputRef}
                className={mStyles.input}
                type="file"
                accept=".pdf,application/pdf"
                onChange={setFile}
              />
            </label>
            {formError && <p className={mStyles.errorMsg}>{formError}</p>}
            <div className={mStyles.formFooter}>
              <button type="button" className={mStyles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button type="submit" className={mStyles.submitBtn} disabled={saving}>
                {saving ? 'Saving…' : editingInvoice ? 'Save Changes' : 'Create Invoice'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
