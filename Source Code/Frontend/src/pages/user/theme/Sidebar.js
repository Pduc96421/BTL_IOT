import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom'
import './sidebar.scss'
import { ROUTERS } from '../../../utils/router'
import { api } from 'services/api.service'
import { socket } from 'services/socket.service'

const items = [
  { to: ROUTERS.USER.DASHBOARD, label: 'Home', icon: '🏠' },
  { to: ROUTERS.USER.HISTORY, label: 'History', icon: '📜' },
  { to: ROUTERS.USER.USERS, label: 'Users', icon: '👥' },
  { to: ROUTERS.USER.DEVICES, label: 'Devices', icon: '⚙️' },
  { to: ROUTERS.USER.ALERTS, label: 'Alerts', icon: '🚨' },
]

const Sidebar = () => {
  const [consecutiveFails, setConsecutiveFails] = useState(0)
  const [hasCriticalAlert, setHasCriticalAlert] = useState(false)

  // Tính số lần fail liên tiếp ban đầu từ API, sau đó cập nhật realtime qua socket
  useEffect(() => {
    const init = async () => {
      try {
        const res = await api.get('/access_log')
        const list = res.data?.result || []
        let count = 0
        for (const log of list) {
          if (log.result === 'FALSE') count += 1
          else break
        }
        setConsecutiveFails(count)
        setHasCriticalAlert(count >= 5)
      } catch (e) {
        console.error('Load access_log for sidebar failed', e)
      }
    }
    init()

    const onAccessLog = (log) => {
      if (!log) return
      if (log.result === 'FALSE') {
        setConsecutiveFails((prev) => {
          const next = prev + 1
          if (next >= 5) setHasCriticalAlert(true)
          return next
        })
      } else {
        setConsecutiveFails(0)
        setHasCriticalAlert(false)
      }
    }

    socket.on('client-access-log', onAccessLog)
    return () => {
      socket.off('client-access-log', onAccessLog)
    }
  }, [])

  return (
    <aside className="app-sidebar">
      <div className="brand">
        <div className="brand-icon">🔒</div>
        <div className="brand-text">
          <div className="brand-title">SmartLock</div>
          <div className="brand-sub">Control Panel</div>
        </div>
      </div>

      <nav className="nav-list">
        {items.map((it) => {
          const isAlertItem = it.to === ROUTERS.USER.ALERTS
          return (
            <NavLink
              key={it.to}
              to={it.to}
              className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
            >
              <span className="nav-icon">{it.icon}</span>
              <span className="nav-label">
                {it.label}
                {isAlertItem && hasCriticalAlert && <span className="alert-dot" />}
              </span>
            </NavLink>
          )
        })}
      </nav>
    </aside>
  )
}

export default Sidebar
