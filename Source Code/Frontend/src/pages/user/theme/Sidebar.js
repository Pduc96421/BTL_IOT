import React from 'react'
import { NavLink } from 'react-router-dom'
import './sidebar.scss'
import { ROUTERS } from '../../../utils/router'

const items = [
  { to: ROUTERS.USER.DASHBOARD, label: 'Home', icon: '🏠' },
  { to: ROUTERS.USER.HISTORY, label: 'History', icon: '📜' },
  { to: ROUTERS.USER.USERS, label: 'Users', icon: '👥' },
  { to: ROUTERS.USER.DEVICES, label: 'Devices', icon: '⚙️' },
]

const Sidebar = () => {
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
        {items.map((it) => (
          <NavLink
            key={it.to}
            to={it.to}
            className={({ isActive }) => (isActive ? 'nav-item active' : 'nav-item')}
          >
            <span className="nav-icon">{it.icon}</span>
            <span className="nav-label">{it.label}</span>
          </NavLink>
        ))}
      </nav>
    </aside>
  )
}

export default Sidebar
