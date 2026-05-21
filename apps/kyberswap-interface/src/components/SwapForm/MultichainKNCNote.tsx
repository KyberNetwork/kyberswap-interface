import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { FC } from 'react'

import WarningNote from 'components/WarningNote'
import { mKNC } from 'constants/tokens'
import { useActiveWeb3React } from 'hooks'

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
          <a
            href="https://twitter.com/MultichainOrg/status/1679768407628185600"
            target="_blank"
            rel="noreferrer"
            className="mr-[0.5ch] inline w-fit min-w-max cursor-pointer border-b border-text font-medium text-text"
          >
            here
          </a>
        </Trans>
      </div>
    )
    return <WarningNote shortText={shortText} />
  }

  return null
}

export default MultichainKNCNote
