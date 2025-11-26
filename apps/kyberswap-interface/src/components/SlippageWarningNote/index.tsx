import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

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

const TextUnderlineColor = styled(Text)`
  border-bottom: 1px solid ${({ theme }) => theme.text};
  width: fit-content;
  display: inline;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
`

const TextUnderlineTransparent = styled(Text)`
  border-bottom: 1px solid transparent;
  width: fit-content;
  display: inline;
`

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
        <TextUnderlineTransparent>Your </TextUnderlineTransparent>

        <TextUnderlineColor
          style={{ minWidth: 'max-content' }}
          as="a"
          href={SLIPPAGE_EXPLANATION_URL}
          target="_blank"
          rel="noreferrer"
        >
          Slippage
        </TextUnderlineColor>
        <TextUnderlineTransparent> {msg}</TextUnderlineTransparent>
      </Trans>
    </div>
  )

  return <WarningNote className={className} shortText={shortText} />
}

export default SlippageWarningNote
