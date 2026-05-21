import { Currency, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { AlertTriangle } from 'react-feather'

import AddTokenToMetaMask from 'components/AddToMetamask'
import CopyHelper from 'components/Copy'
import { NetworkLogo } from 'components/Logo'
import Row from 'components/Row'
import { MouseoverTooltipDesktopOnly } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { shortenAddress } from 'utils'

const WarningBrave = ({ token }: { token: Currency | undefined }) => {
  const { chainId, walletKey } = useActiveWeb3React()
  const theme = useTheme()

  if (!token || walletKey !== 'BRAVE' || token.isNative) return null
  return (
    <div className="flex gap-4 rounded-2xl bg-buttonBlack p-4 text-xs leading-4 text-subText">
      <div>
        <AlertTriangle size={18} color={theme.subText} />
      </div>
      <div className="flex flex-col gap-2.5">
        <span className="font-normal text-text">
          <Trans> Notice for Brave wallet users</Trans>
        </span>
        <span className="whitespace-normal">
          <Trans>
            Please ensure the selected token has been imported in your Brave wallet before sending. Otherwise, your
            transaction will be rejected. In this case, you can quickly import token with contract address below.
          </Trans>
        </span>
        <Row justify="space-between">
          <span>
            <Trans>Contract Address</Trans>
          </span>
          <div className="flex items-center justify-between gap-1.5">
            <NetworkLogo chainId={chainId} style={{ width: 16, height: 16 }} />
            {shortenAddress(chainId, token.wrapped.address, 5, false)}
            <CopyHelper toCopy={token.wrapped.address} />
            <MouseoverTooltipDesktopOnly text={t`Import token in Brave wallet.`}>
              <AddTokenToMetaMask token={token as Token} />
            </MouseoverTooltipDesktopOnly>
          </div>
        </Row>
      </div>
    </div>
  )
}
export default WarningBrave
