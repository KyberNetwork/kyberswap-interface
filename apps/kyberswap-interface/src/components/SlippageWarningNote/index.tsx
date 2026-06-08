import { Trans } from '@lingui/macro'
import { FC } from 'react'

import WarningNote from 'components/WarningNote'
import { PAIR_CATEGORY } from 'constants/index'
import { usePairCategory } from 'state/swap/hooks'
import { SLIPPAGE_STATUS, SLIPPAGE_WARNING_MESSAGES, checkRangeSlippage } from 'utils/slippage'

type Props = {
  rawSlippage: number
  className?: string
}

export const SLIPPAGE_EXPLANATION_URL =
  'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'

const SlippageWarningNote: FC<Props> = ({ className, rawSlippage }) => {
  const pairCategory = usePairCategory()
  const slippageStatus = checkRangeSlippage(rawSlippage, pairCategory)

  if (slippageStatus === SLIPPAGE_STATUS.NORMAL) {
    return null
  }

  const msg = (SLIPPAGE_WARNING_MESSAGES[slippageStatus] as Record<PAIR_CATEGORY, string>)?.[pairCategory] || ''

  const shortText = (
    <div>
      <Trans>
        <span className="inline w-fit border-b border-transparent">Your </span>

        <a
          href={SLIPPAGE_EXPLANATION_URL}
          target="_blank"
          rel="noreferrer"
          className="inline w-fit min-w-max cursor-pointer border-b border-text font-medium text-text"
        >
          Slippage
        </a>
        <span className="inline w-fit border-b border-transparent"> {msg}</span>
      </Trans>
    </div>
  )

  return <WarningNote className={className} shortText={shortText} />
}

export default SlippageWarningNote
