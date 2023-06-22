import { useState } from 'react'
import { Download } from 'react-feather'

import ExportAccountModal from 'pages/NotificationCenter/Profile/ExportAccountModal'
import { ButtonExport } from 'pages/NotificationCenter/Profile/buttons'

export default function ExportAccountButton() {
  const [isOpen, setOpen] = useState(false)
  const onDismiss = () => {
    setOpen(false)
  }
  return (
    <>
      <ButtonExport
        onClick={() => {
          setOpen(true)
        }}
      >
        <Download size={16} style={{ marginRight: '4px' }} />
        Export
      </ButtonExport>
      <ExportAccountModal isOpen={isOpen} onDismiss={onDismiss} />
    </>
  )
}
