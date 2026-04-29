import styles from './MetricCard.module.css'

export default function MetricCard({ label, value, sub, trend, icon, accent }) {
  return (
    <div className={styles.card} style={{ '--card-accent': accent }}>
      <div className={styles.top}>
        <span className={styles.label}>{label}</span>
        <span className={styles.icon}>{icon}</span>
      </div>
      <div className={styles.value}>{value}</div>
      {(sub || trend !== undefined) && (
        <div className={styles.footer}>
          {sub && <span className={styles.sub}>{sub}</span>}
          {trend !== undefined && (
            <span className={`${styles.trend} ${trend >= 0 ? styles.up : styles.down}`}>
              {trend >= 0 ? '▲' : '▼'} {Math.abs(trend)}%
            </span>
          )}
        </div>
      )}
    </div>
  )
}
