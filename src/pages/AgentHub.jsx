import { useState, useRef, useEffect } from 'react'
import styles from './AgentHub.module.css'

const todayLabel = new Date().toLocaleDateString('en-US', {
  month: 'long', day: 'numeric', year: 'numeric',
})

const AGENTS = [
  { id: 1, name: 'Master',     sub: 'Orchestrator',  status: 'running' },
  { id: 2, name: 'Prospector', sub: 'Lead finder',   status: 'queued'  },
  { id: 3, name: 'Researcher', sub: 'Qualifier',     status: 'idle'    },
  { id: 4, name: 'Copywriter', sub: 'Outreach',      status: 'idle'    },
  { id: 5, name: 'CRM Agent',  sub: 'DB writer',     status: 'idle'    },
  { id: 6, name: 'Briefing',   sub: 'Daily digest',  status: 'idle'    },
]

const INITIAL_TASKS = [
  { id: 1, title: "Call Mike's Plumbing — follow up on proposal sent Monday",    priority: 'High',  who: { type: 'user',  label: 'You'        }, done: false },
  { id: 2, title: 'Find 10 HVAC contractors in Durham with no website',          priority: 'High',  who: { type: 'agent', label: 'Prospector' }, done: false },
  { id: 3, title: "Qualify leads from yesterday's Durham HVAC scrape",           priority: 'Med',   who: { type: 'agent', label: 'Researcher' }, done: false },
  { id: 4, title: 'Draft cold email templates for plumbers — 3 variants',        priority: 'Med',   who: { type: 'agent', label: 'Copywriter' }, done: false },
  { id: 5, title: 'Update Riverside Electric invoice — add $50 maintenance fee', priority: 'Med',   who: { type: 'user',  label: 'You'        }, done: false },
  { id: 6, title: 'Push 6 new qualified leads to CRM as Lead stage',             priority: 'Agent', who: { type: 'agent', label: 'CRM Agent' }, done: false },
  { id: 7, title: 'Research Triad area roofing companies — check Google reviews',priority: 'Low',   who: { type: 'agent', label: 'Researcher' }, done: false },
]

const INITIAL_MESSAGES = [
  { id: 1, role: 'agent', name: 'Master', text: "Good morning! I've reviewed your pipeline and flagged 3 priorities. Prospector is queued to find HVAC leads in Durham. Want me to kick that off?" },
  { id: 2, role: 'user',  text: 'Yes, go ahead. Also check if the Riverside Electric invoice needs updating.' },
  { id: 3, role: 'agent', name: 'Master', text: "On it. I've queued the Prospector run and added a task to update the Riverside Electric invoice. I'll notify you when leads start coming in." },
]

const LOG = [
  { time: '8:06 AM',   agent: 'Prospector', action: 'started — searching Durham HVAC contractors' },
  { time: '8:05 AM',   agent: 'Master',     action: 'created 2 tasks from chat message' },
  { time: '7:48 AM',   agent: 'CRM Agent',  action: 'added 6 leads to Supabase · stage: Lead' },
  { time: '7:41 AM',   agent: 'Researcher', action: 'scored 9 of 15 leads as qualified' },
  { time: '7:30 AM',   agent: 'Prospector', action: 'found 15 plumbers in Greensboro' },
  { time: '7:28 AM',   agent: 'Copywriter', action: 'drafted 3 cold email variants · plumber template' },
  { time: '7:15 AM',   agent: 'Briefing',   action: 'generated morning digest · 3 priority items flagged' },
  { time: 'Yesterday', agent: 'CRM Agent',  action: 'marked Apex Roofing as Active · deal $1,200' },
]

function UserIcon() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="12" height="12">
      <path fillRule="evenodd" d="M10 9a3 3 0 1 0 0-6 3 3 0 0 0 0 6zm-7 9a7 7 0 1 1 14 0H3z" clipRule="evenodd" />
    </svg>
  )
}

function CpuIcon({ size = 12 }) {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width={size} height={size}>
      <path d="M13 7H7v6h6V7z" />
      <path fillRule="evenodd" d="M7 2a1 1 0 0 1 2 0v1h2V2a1 1 0 1 1 2 0v1h1a2 2 0 0 1 2 2v1h1a1 1 0 1 1 0 2h-1v2h1a1 1 0 1 1 0 2h-1v1a2 2 0 0 1-2 2h-1v1a1 1 0 1 1-2 0v-1H9v1a1 1 0 1 1-2 0v-1H6a2 2 0 0 1-2-2v-1H3a1 1 0 1 1 0-2h1V9H3a1 1 0 1 1 0-2h1V6a2 2 0 0 1 2-2h1V2zM6 6h8v8H6V6z" clipRule="evenodd" />
    </svg>
  )
}

function ArrowRight() {
  return (
    <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14" className={styles.pipelineArrow}>
      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 0 1 0-1.414L10.586 10 7.293 6.707a1 1 0 0 1 1.414-1.414l4 4a1 1 0 0 1 0 1.414l-4 4a1 1 0 0 1-1.414 0z" clipRule="evenodd" />
    </svg>
  )
}

export default function AgentHub() {
  const [activeTab, setActiveTab] = useState('tasks')
  const [tasks, setTasks] = useState(INITIAL_TASKS)
  const [messages, setMessages] = useState(INITIAL_MESSAGES)
  const [chatInput, setChatInput] = useState('')
  const scrollAnchorRef = useRef(null)

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const toggleTask = (id) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, done: !t.done } : t)))

  const handleSend = () => {
    const text = chatInput.trim()
    if (!text) return
    setMessages((m) => [...m, { id: Date.now(), role: 'user', text }])
    setChatInput('')
    setTimeout(() => {
      setMessages((m) => [
        ...m,
        { id: Date.now() + 1, role: 'agent', name: 'Master', text: "Got it. I'll look into that and update you shortly." },
      ])
    }, 1000)
  }

  return (
    <div className={styles.page}>
      {/* ── Header ── */}
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>Agent Hub</h1>
          <p className={styles.subtitle}>{todayLabel}</p>
        </div>
        <div className={styles.statusRow}>
          <span className={styles.headerDot} />
          <span className={styles.statusLabel}>1 agent running</span>
        </div>
      </header>

      {/* ── 3-column layout ── */}
      <div className={styles.layout}>

        {/* ─── LEFT column ─── */}
        <div className={styles.col}>

          {/* Agents list */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Agents</span>
            </div>
            {AGENTS.map((a) => (
              <div key={a.id} className={styles.agentRow}>
                <span className={`${styles.dot} ${styles[`dot${a.status.charAt(0).toUpperCase() + a.status.slice(1)}`]}`} />
                <div className={styles.agentInfo}>
                  <span className={styles.agentName}>{a.name}</span>
                  <span className={styles.agentSub}>{a.sub}</span>
                </div>
                <span className={`${styles.statusBadge} ${styles[`sb${a.status.charAt(0).toUpperCase() + a.status.slice(1)}`]}`}>
                  {a.status}
                </span>
              </div>
            ))}
          </div>

          {/* Task pipeline */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Task Pipeline</span>
            </div>
            <div className={styles.pipeline}>
              <div className={styles.pipelineStat}>
                <span className={styles.pipelineNum}>6</span>
                <span className={styles.pipelineLabel}>Queued</span>
              </div>
              <ArrowRight />
              <div className={styles.pipelineStat}>
                <span className={`${styles.pipelineNum} ${styles.pipelineGreen}`}>1</span>
                <span className={styles.pipelineLabel}>Running</span>
              </div>
              <ArrowRight />
              <div className={styles.pipelineStat}>
                <span className={styles.pipelineNum}>14</span>
                <span className={styles.pipelineLabel}>Done</span>
              </div>
            </div>
          </div>

          {/* Quick launch */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Quick Launch</span>
            </div>
            <div className={styles.launchList}>
              <button className={styles.launchBtn} onClick={() => console.log('Prospector')}>
                <span className={styles.launchIconBox} style={{ background: 'var(--blue-dim)', color: 'var(--blue)' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M8 4a4 4 0 1 0 0 8 4 4 0 0 0 0-8zM2 8a6 6 0 1 1 10.89 3.476l4.817 4.817a1 1 0 0 1-1.414 1.414l-4.816-4.816A6 6 0 0 1 2 8z" clipRule="evenodd" />
                  </svg>
                </span>
                <div className={styles.launchText}>
                  <span className={styles.launchTitle}>Find leads</span>
                  <span className={styles.launchSub}>Triggers Prospector</span>
                </div>
              </button>
              <button className={styles.launchBtn} onClick={() => console.log('Briefing')}>
                <span className={styles.launchIconBox} style={{ background: 'var(--green-dim)', color: 'var(--green)' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path fillRule="evenodd" d="M4 4a2 2 0 0 1 2-2h4.586A2 2 0 0 1 12 2.586L15.414 6A2 2 0 0 1 16 7.414V16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4zm2 6a1 1 0 0 1 1-1h6a1 1 0 1 1 0 2H7a1 1 0 0 1-1-1zm1 3a1 1 0 1 0 0 2h6a1 1 0 1 0 0-2H7z" clipRule="evenodd" />
                  </svg>
                </span>
                <div className={styles.launchText}>
                  <span className={styles.launchTitle}>Daily briefing</span>
                  <span className={styles.launchSub}>Triggers Briefing agent</span>
                </div>
              </button>
              <button className={styles.launchBtn} onClick={() => console.log('Copywriter')}>
                <span className={styles.launchIconBox} style={{ background: 'var(--yellow-dim)', color: 'var(--yellow)' }}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path d="M13.586 3.586a2 2 0 1 1 2.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </span>
                <div className={styles.launchText}>
                  <span className={styles.launchTitle}>Draft outreach</span>
                  <span className={styles.launchSub}>Triggers Copywriter</span>
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* ─── CENTER column ─── */}
        <div className={styles.centerCard}>
          {/* Tab bar */}
          <div className={styles.tabBar}>
            <div className={styles.tabs}>
              <button
                className={`${styles.tab} ${activeTab === 'tasks' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('tasks')}
              >
                Task list
              </button>
              <button
                className={`${styles.tab} ${activeTab === 'chat' ? styles.tabActive : ''}`}
                onClick={() => setActiveTab('chat')}
              >
                Chat with Master
              </button>
            </div>
            {activeTab === 'tasks' && (
              <button className={styles.addTaskBtn} onClick={() => console.log('add task')}>
                + Add task
              </button>
            )}
          </div>

          {/* Task list tab */}
          {activeTab === 'tasks' && (
            <div className={styles.taskList}>
              {tasks.map((t) => (
                <label key={t.id} className={styles.taskRow}>
                  <input
                    type="checkbox"
                    className={styles.checkbox}
                    checked={t.done}
                    onChange={() => toggleTask(t.id)}
                  />
                  <span className={`${styles.taskTitle} ${t.done ? styles.taskDone : ''}`}>
                    {t.title}
                  </span>
                  <span className={`${styles.priorityBadge} ${styles[`p${t.priority}`]}`}>
                    {t.priority}
                  </span>
                  <span className={styles.whoLabel}>
                    {t.who.type === 'user' ? <UserIcon /> : <CpuIcon />}
                    {t.who.label}
                  </span>
                </label>
              ))}
            </div>
          )}

          {/* Chat tab */}
          {activeTab === 'chat' && (
            <div className={styles.chatPane}>
              <div className={styles.chatMessages}>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`${styles.msg} ${msg.role === 'user' ? styles.msgUser : styles.msgAgent}`}
                  >
                    {msg.role === 'agent' && (
                      <span className={styles.msgName}>{msg.name}</span>
                    )}
                    <div className={styles.msgBubble}>{msg.text}</div>
                  </div>
                ))}
                <div ref={scrollAnchorRef} />
              </div>
              <div className={styles.chatInputRow}>
                <input
                  className={styles.chatField}
                  type="text"
                  placeholder="Message Master…"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleSend() }}
                />
                <button className={styles.sendBtn} onClick={handleSend}>
                  <svg viewBox="0 0 20 20" fill="currentColor" width="14" height="14">
                    <path d="M10.894 2.553a1 1 0 0 0-1.788 0l-7 14a1 1 0 0 0 1.169 1.409l5-1.429A1 1 0 0 0 9 15.571V11a1 1 0 1 1 2 0v4.571a1 1 0 0 0 .725.962l5 1.428a1 1 0 0 0 1.17-1.408l-7-14z" />
                  </svg>
                  Send
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ─── RIGHT column ─── */}
        <div className={styles.col}>

          {/* Today's snapshot */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Today's Snapshot</span>
            </div>
            <div className={styles.snapshotGrid}>
              <div className={styles.snapshotStat}>
                <span className={styles.snapshotVal}>23</span>
                <span className={styles.snapshotLbl}>Leads Found</span>
              </div>
              <div className={styles.snapshotStat}>
                <span className={styles.snapshotVal}>8</span>
                <span className={styles.snapshotLbl}>Emails Drafted</span>
              </div>
              <div className={styles.snapshotStat}>
                <span className={styles.snapshotVal}>14</span>
                <span className={styles.snapshotLbl}>Tasks Done</span>
              </div>
              <div className={styles.snapshotStat}>
                <span className={`${styles.snapshotVal} ${styles.snapshotRed}`}>3</span>
                <span className={styles.snapshotLbl}>Follow-ups</span>
              </div>
            </div>
          </div>

          {/* Activity log */}
          <div className={styles.card}>
            <div className={styles.cardHeader}>
              <span className={styles.cardTitle}>Activity Log</span>
            </div>
            <div className={styles.logList}>
              {LOG.map((entry, i) => (
                <div key={i} className={styles.logEntry}>
                  <span className={styles.logTime}>{entry.time}</span>
                  <p className={styles.logContent}>
                    <span className={styles.logAgent}>{entry.agent}</span>
                    {' '}
                    <span className={styles.logAction}>{entry.action}</span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
