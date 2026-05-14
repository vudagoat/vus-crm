import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import Modal from '../components/Modal'
import mStyles from '../components/Modal.module.css'
import styles from './Clients.module.css'

const STATUS_ORDER = ['active', 'review', 'overdue', 'completed']
const PROJECT_TYPES = ['Brand Identity', 'Web Design', 'E-commerce', 'Landing Page', 'Rebranding']
const BLANK = { name: '', project_type: 'Web Design', value: '', due_date: '', status: 'active' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editingClient, setEditingClient] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)

  const fetchClients = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .order('id', { ascending: false })
    if (error) setError(error.message)
    else setClients(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchClients() }, [fetchClients])

  useEffect(() => {
    const close = () => setActiveMenu(null)
    document.addEventListener('click', close)
    return () => document.removeEventListener('click', close)
  }, [])

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase()
    const matchSearch = c.name?.toLowerCase().includes(q) || c.project_type?.toLowerCase().includes(q)
    return matchSearch && (filter === 'all' || c.status === filter)
  })

  const openAdd = () => {
    setEditingClient(null)
    setForm(BLANK)
    setFormError(null)
    setShowModal(true)
  }

  const openEdit = (client) => {
    setEditingClient(client)
    setForm({
      name: client.name ?? '',
      project_type: client.project_type ?? 'Web Design',
      value: client.value ?? '',
      due_date: client.due_date ?? '',
      status: client.status ?? 'active',
    })
    setFormError(null)
    setShowModal(true)
    setActiveMenu(null)
  }

  const closeModal = () => { setShowModal(false); setEditingClient(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)
    const payload = {
      name: form.name.trim(),
      project_type: form.project_type,
      value: parseFloat(form.value) || 0,
      due_date: form.due_date || null,
      status: form.status,
    }
    const { error } = editingClient
      ? await supabase.from('clients').update(payload).eq('id', editingClient.id)
      : await supabase.from('clients').insert([payload])
    setSaving(false)
    if (error) { setFormError(error.message); return }
    closeModal()
    fetchClients()
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this client? This cannot be undone.')) return
    setActiveMenu(null)
    const { error } = await supabase.from('clients').delete().eq('id', id)
    if (error) { alert(error.message); return }
    fetchClients()
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Clients</h1>
          <p className={styles.subtitle}>{loading ? '…' : `${clients.length} total clients`}</p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" clipRule="evenodd" />
          </svg>
          Add Client
        </button>
      </header>

      <div className={styles.toolbar}>
        <div className={styles.searchWrap}>
          <svg className={styles.searchIcon} viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 8a6 6 0 1 1 10.89 3.476l4.817 4.817a1 1 0 0 1-1.414 1.414l-4.816-4.816A6 6 0 0 1 2 8z" clipRule="evenodd" />
          </svg>
          <input
            className={styles.search}
            type="text"
            placeholder="Search clients…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className={styles.filters}>
          {['all', ...STATUS_ORDER].map((s) => (
            <button
              key={s}
              className={`${styles.filterBtn} ${filter === s ? styles.active : ''}`}
              onClick={() => setFilter(s)}
            >
              {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.tableWrap}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Client</th>
              <th>Project Type</th>
              <th>Value</th>
              <th>Due Date</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr><td colSpan={6} className={styles.stateCell}>Loading clients…</td></tr>
            )}
            {error && (
              <tr><td colSpan={6} className={`${styles.stateCell} ${styles.errorCell}`}>{error}</td></tr>
            )}
            {!loading && !error && filtered.map((c) => (
              <tr key={c.id} className={styles.row}>
                <td>
                  <div className={styles.clientCell}>
                    <div className={styles.avatar}>
                      {c.name?.split(' ').map((w) => w[0]).slice(0, 2).join('') ?? '?'}
                    </div>
                    <span className={styles.clientName}>{c.name}</span>
                  </div>
                </td>
                <td className={styles.type}>{c.project_type}</td>
                <td className={styles.value}>${(c.value ?? 0).toLocaleString()}</td>
                <td className={styles.date}>
                  {c.due_date
                    ? new Date(c.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                    : '—'}
                </td>
                <td>
                  <span className={`${styles.badge} ${styles[c.status]}`}>{c.status}</span>
                </td>
                <td>
                  <div className={styles.menuWrap} onClick={(e) => e.stopPropagation()}>
                    <button
                      className={styles.moreBtn}
                      title="More options"
                      onClick={() => setActiveMenu(activeMenu === c.id ? null : c.id)}
                    >
                      <svg viewBox="0 0 20 20" fill="currentColor" width="16" height="16">
                        <path d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                      </svg>
                    </button>
                    {activeMenu === c.id && (
                      <div className={styles.dropdown}>
                        <button className={styles.dropdownItem} onClick={() => openEdit(c)}>
                          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>
                          Edit
                        </button>
                        <button className={`${styles.dropdownItem} ${styles.dropdownDanger}`} onClick={() => handleDelete(c.id)}>
                          <svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M9 2a1 1 0 0 0-.894.553L7.382 4H4a1 1 0 0 0 0 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a1 1 0 0 0 0-2h-3.382l-.724-1.447A1 1 0 0 0 11 2H9zM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8zm4 0a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8z" clipRule="evenodd" /></svg>
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && !error && filtered.length === 0 && (
          <div className={styles.empty}>No clients match your search.</div>
        )}
      </div>

      {showModal && (
        <Modal title={editingClient ? 'Edit Client' : 'Add Client'} onClose={closeModal}>
          <form className={mStyles.form} onSubmit={handleSave}>
            <label className={mStyles.field}>
              Client Name
              <input className={mStyles.input} type="text" value={form.name} onChange={set('name')} placeholder="Apex Creative Co." required />
            </label>
            <label className={mStyles.field}>
              Project Type
              <select className={mStyles.select} value={form.project_type} onChange={set('project_type')}>
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <div className={mStyles.formRow}>
              <label className={mStyles.field}>
                Value ($)
                <input className={mStyles.input} type="number" min="0" step="100" value={form.value} onChange={set('value')} placeholder="5000" required />
              </label>
              <label className={mStyles.field}>
                Due Date
                <input className={mStyles.input} type="date" value={form.due_date} onChange={set('due_date')} />
              </label>
            </div>
            <label className={mStyles.field}>
              Status
              <select className={mStyles.select} value={form.status} onChange={set('status')}>
                {STATUS_ORDER.map((s) => (
                  <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                ))}
              </select>
            </label>
            {formError && <p className={mStyles.errorMsg}>{formError}</p>}
            <div className={mStyles.formFooter}>
              <button type="button" className={mStyles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button type="submit" className={mStyles.submitBtn} disabled={saving}>
                {saving ? 'Saving…' : editingClient ? 'Save Changes' : 'Add Client'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
