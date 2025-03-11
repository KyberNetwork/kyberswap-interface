import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { FC } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import WarningNote from 'components/WarningNote'
import { mKNC } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'

const TextUnderlineColor = styled(Text)`
  border-bottom: 1px solid ${({ theme }) => theme.text};
  width: fit-content;
  cursor: pointer;
  color: ${({ theme }) => theme.text};
  font-weight: 500;
  margin-right: 0.5ch;
`

type Props = {
  currencyIn: Currency | undefined
  currencyOut: Currency | undefined
}

const MultichainKNCNote: FC<Props> = ({ currencyIn, currencyOut }) => {
  const { chainId } = useActiveWeb3React()
  const mknc = mKNC[chainId]
  if (
    mknc &&
    [currencyIn?.wrapped.address?.toLowerCase(), currencyOut?.wrapped.address?.toLowerCase()].includes(
      mknc.toLowerCase(),
    )
  ) {
    const shortText = (
      <div>
        <Trans>
          Multichain team ceased operations, and we discourage user interaction with the deployed Wrapped KNC token
          contracts on various chains. See more{' '}
          <TextUnderlineColor
            style={{ minWidth: 'max-content' }}
            as="a"
            href="https://twitter.com/MultichainOrg/status/1679768407628185600"
            target="_blank"
            rel="noreferrer"
          >
            here
          </TextUnderlineColor>
        </Trans>
      </div>
    )
    return <WarningNote shortText={shortText} />
  }

  return null
}

export default MultichainKNCNote
