import { Suspense, lazy, useEffect, useState } from 'react'

import ModalConfirm from 'components/ConfirmModal'
import SwitchToEthereumModal from 'pages/KyberDAO/StakeKNC/SwitchToEthereumModal'
import { useModalOpen } from 'state/application/hooks'
import { ApplicationModal } from 'state/application/types'

// Lazy: RecapSection statically pulls the Earns reward hooks (useKemRewards/useCompounding -> the
// compounding-widget, Earns/utils/zap -> the liquidity-widgets), dragging ~1.4MB of widgets into the
// eager entry. The modal's only live trigger is the redux RECAP toggle (the /2025-journey redirect or
// a manual toggle), so we defer the chunk until that selector first turns true.
const RecapSection = lazy(() => import('components/Recap'))

export default function ModalsGlobal() {
  const isRecapOpen = useModalOpen(ApplicationModal.RECAP)
  // Latches true the first time the RECAP modal is requested so the lazy chunk loads then and stays
  // mounted afterwards (lets the modal's exit animation play on close instead of unmounting instantly).
  const [recapMounted, setRecapMounted] = useState(false)

  useEffect(() => {
    if (isRecapOpen) setRecapMounted(true)
  }, [isRecapOpen])

  return (
    <>
      <SwitchToEthereumModal />
      <ModalConfirm />
      {recapMounted && (
        <Suspense fallback={null}>
          <RecapSection />
        </Suspense>
      )}
    </>
  )
}
