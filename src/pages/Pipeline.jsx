import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../supabaseClient'
import Modal from '../components/Modal'
import DropdownMenu, { DropdownItem } from '../components/DropdownMenu'
import mStyles from '../components/Modal.module.css'
import styles from './Pipeline.module.css'

const STAGES = ['Lead', 'Proposal', 'Active', 'Closed']

const STAGE_META = {
  Lead:     { color: 'var(--blue)',   dimColor: 'var(--blue-dim)' },
  Proposal: { color: 'var(--yellow)', dimColor: 'var(--yellow-dim)' },
  Active:   { color: '#9ca3af',       dimColor: 'rgba(156, 163, 175, 0.15)' },
  Closed:   { color: 'var(--green)',  dimColor: 'var(--green-dim)' },
}

const AVATAR_COLORS = [
  '#6366f1','#8b5cf6','#06b6d4','#f59e0b','#10b981',
  '#ef4444','#f97316','#14b8a6','#a855f7','#22c55e',
]

const PROJECT_TYPES = ['Brand Identity', 'Web Design', 'E-commerce', 'Landing Page', 'Rebranding']
const BLANK = { title: '', client: '', type: 'Web Design', value: '', stage: 'Lead', due_date: '' }
const fmt = (n) => `$${n.toLocaleString()}`

export default function Pipeline() {
  const [deals, setDeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [editingDeal, setEditingDeal] = useState(null)
  const [form, setForm] = useState(BLANK)
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState(null)
  const [activeMenu, setActiveMenu] = useState(null)
  const [menuAnchor, setMenuAnchor] = useState(null)

  const fetchDeals = useCallback(async () => {
    setLoading(true)
    const { data, error } = await supabase.from('deals').select('*').order('id', { ascending: false })
    if (error) setError(error.message)
    else setDeals(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchDeals() }, [fetchDeals])

  const closeMenu = () => { setActiveMenu(null); setMenuAnchor(null) }

  const byStage = STAGES.reduce((acc, s) => {
    acc[s] = deals.filter((d) => d.stage === s)
    return acc
  }, {})

  const totalValue = deals.reduce((s, d) => s + (d.value ?? 0), 0)

  const openAdd = () => { setEditingDeal(null); setForm(BLANK); setFormError(null); setShowModal(true) }

  const openEdit = (deal) => {
    closeMenu()
    setEditingDeal(deal)
    setForm({
      title: deal.title ?? '',
      client: deal.client ?? '',
      type: deal.type ?? 'Web Design',
      value: deal.value ?? '',
      stage: deal.stage ?? 'Lead',
      due_date: deal.due_date ?? '',
    })
    setFormError(null)
    setShowModal(true)
  }

  const closeModal = () => { setShowModal(false); setEditingDeal(null) }

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setFormError(null)

    let payload
    if (editingDeal) {
      payload = {
        title: form.title.trim(),
        client: form.client.trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        stage: form.stage,
        due_date: form.due_date || null,
      }
    } else {
      const words = form.client.trim().split(' ')
      const avatar = words.map((w) => w[0]).slice(0, 2).join('').toUpperCase()
      const avatar_color = AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)]
      payload = {
        title: form.title.trim(),
        client: form.client.trim(),
        type: form.type,
        value: parseFloat(form.value) || 0,
        stage: form.stage,
        due_date: form.due_date || null,
        avatar,
        avatar_color,
      }
    }

    const { error } = editingDeal
      ? await supabase.from('deals').update(payload).eq('id', editingDeal.id)
      : await supabase.from('deals').insert([payload])

    setSaving(false)
    if (error) { setFormError(error.message); return }
    closeModal()
    fetchDeals()
  }

  const handleDelete = async (id) => {
    closeMenu()
    if (!window.confirm('Delete this deal? This cannot be undone.')) return
    const { error } = await supabase.from('deals').delete().eq('id', id)
    if (error) { alert(error.message); return }
    fetchDeals()
  }

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Pipeline</h1>
          <p className={styles.subtitle}>
            {loading ? '…' : `${deals.length} deals · ${fmt(totalValue)} total value`}
          </p>
        </div>
        <button className={styles.addBtn} onClick={openAdd}>
          <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
            <path fillRule="evenodd" d="M10 3a1 1 0 0 1 1 1v5h5a1 1 0 1 1 0 2h-5v5a1 1 0 1 1-2 0v-5H4a1 1 0 1 1 0-2h5V4a1 1 0 0 1 1-1z" clipRule="evenodd" />
          </svg>
          Add Deal
        </button>
      </header>

      {loading && <div className={styles.stateMsg}>Loading deals…</div>}
      {error && <div className={`${styles.stateMsg} ${styles.errorMsg}`}>{error}</div>}

      {!loading && !error && (
        <div className={styles.stages}>
          {STAGES.map((stage) => {
            const meta = STAGE_META[stage]
            const stageDeals = byStage[stage]
            const stageValue = stageDeals.reduce((s, d) => s + (d.value ?? 0), 0)

            return (
              <div key={stage} className={styles.column}>
                <div className={styles.colHeader}>
                  <div className={styles.colTitleRow}>
                    <span className={styles.colDot} style={{ background: meta.color }} />
                    <span className={styles.colName}>{stage}</span>
                    <span className={styles.colCount}>{stageDeals.length}</span>
                  </div>
                  <span className={styles.colValue}>{fmt(stageValue)}</span>
                </div>

                <div className={styles.cards}>
                  {stageDeals.map((deal) => {
                    const color = deal.avatar_color ?? '#6b7280'
                    return (
                      <div key={deal.id} className={styles.dealCard}>
                        <div className={styles.dealTop}>
                          <div
                            className={styles.dealAvatar}
                            style={{ background: `${color}22`, color, borderColor: `${color}44` }}
                          >
                            {deal.avatar}
                          </div>
                          <div className={styles.dealInfo}>
                            <span className={styles.dealClient}>{deal.title ?? deal.client}</span>
                            <span className={styles.dealType}>
                              {deal.client ? `${deal.client} · ${deal.type}` : deal.type}
                            </span>
                          </div>
                          <div className={styles.cardMenu}>
                            <button
                              className={styles.cardMenuBtn}
                              onClick={(e) => {
                                activeMenu === deal.id ? closeMenu() : (setActiveMenu(deal.id), setMenuAnchor(e.currentTarget))
                              }}
                              title="More options"
                            >
                              <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                                <path d="M6 10a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm6 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0zm4 2a2 2 0 1 0 0-4 2 2 0 0 0 0 4z" />
                              </svg>
                            </button>
                            {activeMenu === deal.id && (
                              <DropdownMenu triggerEl={menuAnchor} onClose={closeMenu}>
                                <DropdownItem
                                  icon={<svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" /></svg>}
                                  onClick={() => openEdit(deal)}
                                >Edit</DropdownItem>
                                <DropdownItem
                                  danger
                                  icon={<svg viewBox="0 0 20 20" fill="currentColor" width="13" height="13"><path fillRule="evenodd" d="M9 2a1 1 0 0 0-.894.553L7.382 4H4a1 1 0 0 0 0 2v10a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V6a1 1 0 0 0 0-2h-3.382l-.724-1.447A1 1 0 0 0 11 2H9zM7 8a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8zm4 0a1 1 0 0 1 2 0v6a1 1 0 1 1-2 0V8z" clipRule="evenodd" /></svg>}
                                  onClick={() => handleDelete(deal.id)}
                                >Delete</DropdownItem>
                              </DropdownMenu>
                            )}
                          </div>
                        </div>
                        <div className={styles.dealFooter}>
                          <span className={styles.dealValue}>{fmt(deal.value ?? 0)}</span>
                          <span className={styles.dealStage} style={{ background: meta.dimColor, color: meta.color }}>
                            {stage}
                          </span>
                        </div>
                      </div>
                    )
                  })}
                  {stageDeals.length === 0 && (
                    <div className={styles.empty}>No deals in this stage</div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {showModal && (
        <Modal title={editingDeal ? 'Edit Deal' : 'Add Deal'} onClose={closeModal}>
          <form className={mStyles.form} onSubmit={handleSave}>
            <label className={mStyles.field}>
              Deal Title
              <input className={mStyles.input} type="text" value={form.title} onChange={set('title')} placeholder="Homepage Redesign" required />
            </label>
            <label className={mStyles.field}>
              Client
              <input className={mStyles.input} type="text" value={form.client} onChange={set('client')} placeholder="Horizon Labs" required />
            </label>
            <label className={mStyles.field}>
              Project Type
              <select className={mStyles.select} value={form.type} onChange={set('type')}>
                {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
            </label>
            <div className={mStyles.formRow}>
              <label className={mStyles.field}>
                Value ($)
                <input className={mStyles.input} type="number" min="0" step="100" value={form.value} onChange={set('value')} placeholder="8000" required />
              </label>
              <label className={mStyles.field}>
                Stage
                <select className={mStyles.select} value={form.stage} onChange={set('stage')}>
                  {STAGES.map((s) => <option key={s}>{s}</option>)}
                </select>
              </label>
            </div>
            <label className={mStyles.field}>
              Due Date
              <input className={mStyles.input} type="date" value={form.due_date} onChange={set('due_date')} />
            </label>
            {formError && <p className={mStyles.errorMsg}>{formError}</p>}
            <div className={mStyles.formFooter}>
              <button type="button" className={mStyles.cancelBtn} onClick={closeModal}>Cancel</button>
              <button type="submit" className={mStyles.submitBtn} disabled={saving}>
                {saving ? 'Saving…' : editingDeal ? 'Save Changes' : 'Add Deal'}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  )
}
