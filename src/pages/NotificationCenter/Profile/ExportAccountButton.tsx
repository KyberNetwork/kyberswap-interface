import { useState } from 'react'

import Withdraw from 'components/Icons/Withdraw'
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
        <Withdraw
          width={18}
          height={18}
          style={{
            marginRight: '4px',
          }}
        />
        Export
      </ButtonExport>
      <ExportAccountModal isOpen={isOpen} onDismiss={onDismiss} />
    </>
  )
}
