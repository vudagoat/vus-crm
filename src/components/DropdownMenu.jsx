import { useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import styles from './DropdownMenu.module.css'

export function DropdownItem({ onClick, danger, icon, children }) {
  return (
    <button
      className={`${styles.item} ${danger ? styles.itemDanger : ''}`}
      onClick={onClick}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </button>
  )
}

export default function DropdownMenu({ triggerEl, onClose, children }) {
  const menuRef = useRef(null)

  // Calculate and apply position after the menu mounts
  useEffect(() => {
    const menu = menuRef.current
    if (!menu || !triggerEl) return

    const GAP = 5
    const EDGE = 8
    const t = triggerEl.getBoundingClientRect()
    const mW = menu.offsetWidth
    const mH = menu.offsetHeight

    // Align right edge of menu to right edge of trigger button
    let left = t.right - mW
    left = Math.max(EDGE, Math.min(left, window.innerWidth - mW - EDGE))

    // Open downward unless there isn't enough room below
    const spaceBelow = window.innerHeight - t.bottom - GAP - EDGE
    const top = spaceBelow >= mH
      ? t.bottom + GAP
      : t.top - mH - GAP

    menu.style.left = `${left}px`
    menu.style.top = `${top}px`
    menu.style.opacity = '1'
  }, [triggerEl])

  // Close when clicking outside both the menu and the trigger
  useEffect(() => {
    if (!triggerEl) return
    const handle = (e) => {
      if (!menuRef.current?.contains(e.target) && !triggerEl.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [triggerEl, onClose])

  return createPortal(
    <div ref={menuRef} className={styles.menu} role="menu">
      {children}
    </div>,
    document.body
  )
}
