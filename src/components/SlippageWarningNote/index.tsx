import { Trans } from '@lingui/macro'
import { Text } from 'rebass'
import styled from 'styled-components'

import { MouseoverTooltip } from 'components/Tooltip'
import WarningNote from 'components/WarningNote'
import { SLIPPAGE_STATUS, checkRangeSlippage } from 'utils/slippage'

type Props = {
  rawSlippage: number
  isStablePairSwap: boolean
  className?: string
}

const SLIPPAGE_EXPLANATION_URL =
  'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'

const TextDashedColor = styled(Text)`
  border-bottom: 1px dashed ${({ theme }) => theme.text};
  width: fit-content;
  display: inline;
`

const TextDashedTransparent = styled(Text)`
  border-bottom: 1px dashed transparent;
  width: fit-content;
  display: inline;
`

const SlippageWarningNote: React.FC<Props> = ({ className, rawSlippage, isStablePairSwap }) => {
  const slippageStatus = checkRangeSlippage(rawSlippage, isStablePairSwap)
  if (slippageStatus === SLIPPAGE_STATUS.NORMAL) {
    return null
  }

  let msg = 'is high. Your transaction may be front-run'
  if (slippageStatus === SLIPPAGE_STATUS.LOW) {
    msg = 'is low. Your transaction may fail'
  }
  const shortText = (
    <div>
      <Trans>
        <TextDashedColor style={{ minWidth: 'max-content' }} as="span">
          <MouseoverTooltip
            placement="top"
            width="fit-content"
            text={
              <Text fontSize={12}>
                Read more{' '}
                <a href={SLIPPAGE_EXPLANATION_URL} target="_blank" rel="noreferrer">
                  <b>here</b>
                </a>
                .
              </Text>
            }
          >
            Slippage
          </MouseoverTooltip>
        </TextDashedColor>
        <TextDashedTransparent> {msg}</TextDashedTransparent>
      </Trans>
    </div>
  )

  return <WarningNote className={className} shortText={shortText} />
}

export default SlippageWarningNote
