import { Trans } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { useLocation, useSearchParams } from 'react-router-dom'
import { useMedia } from 'react-use'

import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import { MEDIA_WIDTHS } from 'theme'

const STORAGE_KEY = 'singapore_warning_acknowledged'

export default function SingaporeWarningPopup() {
  const [, setSearchParams] = useSearchParams()
  const [shouldShowPopup, setShouldShowPopup] = useState(false)
  const location = useLocation()

  const upToSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToSmall}px)`)

  useEffect(() => {
    // Parse from location.search to catch redirects that preserve query string
    const params = new URLSearchParams(location.search)
    const countryParam = params.get('country')
    if (!countryParam) return

    const isSingaporeParam = countryParam.toLowerCase() === 'singapore'

    // Always remove the country parameter immediately (preserve others)
    const nextParams = new URLSearchParams(params)
    nextParams.delete('country')
    setSearchParams(nextParams, { replace: true })

    if (!isSingaporeParam) return

    let acknowledged = false
    try {
      acknowledged = localStorage.getItem(STORAGE_KEY) === 'true'
    } catch (error) {
      console.error('Error reading Singapore warning acknowledgment:', error)
    }

    if (!acknowledged) setShouldShowPopup(true)
  }, [location.search, setSearchParams])

  const handleAcknowledge = () => {
    try {
      localStorage.setItem(STORAGE_KEY, 'true')
    } catch (error) {
      console.error('Error saving Singapore warning acknowledgment:', error)
    }
    setShouldShowPopup(false)
  }

  return (
    <Modal
      isOpen={shouldShowPopup}
      onDismiss={() => {}}
      width={upToSmall ? undefined : '700px'}
      maxWidth={700}
      zindex={1000}
    >
      <div className="flex w-full flex-col gap-2.5 bg-background p-5 pb-6 sm:gap-3 sm:p-7">
        <h2 className="m-0 w-full text-center text-base font-semibold uppercase leading-[22px] text-text sm:text-lg sm:leading-6">
          IMPORTANT NOTICE
        </h2>

        <div className="mt-1 flex items-start gap-3 sm:items-center sm:gap-4">
          <span className="flex size-8 flex-[0_0_2rem] items-center justify-center rounded-full bg-tabActive text-sm font-semibold text-text sm:size-9 sm:flex-[0_0_2.25rem] sm:text-base">
            A
          </span>
          <span className="mt-0 text-sm leading-[22px] text-text sm:mt-0.5 sm:text-base sm:leading-6">
            <Trans>
              This Website and its contents have not been reviewed by the Monetary Authority of Singapore
              (&quot;MAS&quot;).
            </Trans>
          </span>
        </div>

        <div className="mt-1 flex items-start gap-3 sm:items-center sm:gap-4">
          <span className="flex size-8 flex-[0_0_2rem] items-center justify-center rounded-full bg-tabActive text-sm font-semibold text-text sm:size-9 sm:flex-[0_0_2.25rem] sm:text-base">
            B
          </span>
          <span className="mt-0 text-sm leading-[22px] text-text sm:mt-0.5 sm:text-base sm:leading-6">
            <Trans>Neither Kyber Network nor any entity affiliated therewith</Trans>:
          </span>
        </div>

        <ul className="ml-11 mt-2 list-disc pl-[18px] text-sm leading-[22px] text-text sm:-mt-2 sm:ml-[60px] sm:pl-5 sm:text-base sm:leading-6">
          <li className="mb-1.5">
            <Trans>(i) is regulated by MAS; or</Trans>
          </li>
          <li className="mb-1.5">
            <Trans>
              (ii) holds a licence issued by MAS for the provision of, or is authorised by MAS to provide, any service
              relating to tokens (whether digital payment tokens under the Payment Services Act of Singapore or digital
              tokens under the Financial Markets Services Act of Singapore).
            </Trans>
          </li>
        </ul>

        <ButtonPrimary
          onClick={handleAcknowledge}
          width="auto"
          style={{ alignSelf: 'center', padding: '12px 28px' }}
          className="sm:!px-[42px]"
        >
          <Trans>Acknowledge</Trans>
        </ButtonPrimary>
      </div>
    </Modal>
  )
}
