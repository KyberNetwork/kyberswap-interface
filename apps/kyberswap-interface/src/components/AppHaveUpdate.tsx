import { Trans } from '@lingui/macro'

import { Z_INDEXS } from 'constants/styles'
import { useServiceWorkerRegistration } from 'state/application/hooks'

import { ButtonPrimary } from './Button'

const AppHaveUpdate = () => {
  const serviceWorkerRegistration = useServiceWorkerRegistration()

  const updateServiceWorker = () => {
    if (!serviceWorkerRegistration) return
    const registrationWaiting = serviceWorkerRegistration.waiting

    if (registrationWaiting) {
      registrationWaiting.postMessage({ type: 'SKIP_WAITING' })

      registrationWaiting.addEventListener('statechange', (e: any) => {
        if (e.target.state === 'activated') {
          window.location.reload()
        }
      })
    } else {
      window.location.reload()
    }
  }
  if (!serviceWorkerRegistration?.waiting) return null

  return (
    <div
      style={{ zIndex: Z_INDEXS.MODAL }}
      className="fixed bottom-4 right-4 rounded-2xl bg-tableHeader p-5 text-center shadow-[0_4px_8px_0_rgba(0,0,0,0.05)]"
    >
      <div>
        <Trans>New contents are available.</Trans>
      </div>
      <ButtonPrimary
        style={{ width: 'fit-content', padding: '8px 20px', margin: 'auto', marginTop: '1rem' }}
        onClick={updateServiceWorker}
      >
        <Trans>Reload</Trans>
      </ButtonPrimary>
    </div>
  )
}

export default AppHaveUpdate
