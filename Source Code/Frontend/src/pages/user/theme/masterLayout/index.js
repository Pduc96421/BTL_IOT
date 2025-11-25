

import React from 'react'
import Sidebar from '../Sidebar'

const MasterUserLayout = ({ children, ...props }) => {
  return (
    <div {...props} style={{ display: 'flex', minHeight: '100vh' }}>
      <Sidebar />
      <main style={{ flex: 1, padding: 24 }}>{children}</main>
    </div>
  )
}

export default MasterUserLayout
