import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { ArrowLeft } from 'react-feather'

import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { GAS_TOKENS, NativeCurrencies } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { usePaymentToken } from 'state/user/hooks'
import { useCurrencyBalances, useNativeBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'
import { cn } from 'utils/cn'

export default function GasTokenSetting({ onBack }: { onBack: () => void }) {
  const theme = useTheme()
  const ethBalance = useNativeBalance()
  const balances = useCurrencyBalances(GAS_TOKENS)

  const [paymentToken, setPaymentToken] = usePaymentToken()
  const { trackingHandler } = useTracking()

  return (
    <>
      <div className="flex cursor-pointer items-center gap-1.5" role="button" onClick={onBack}>
        <ArrowLeft size="24px" color={theme.subText} />
        <span className="text-xl font-medium">Gas Token</span>
      </div>

      <div className="mb-2 mt-3 flex justify-between text-sm text-subText">
        <span>
          <Trans>Token</Trans>
        </span>
        <span>
          <Trans>Balance</Trans>
        </span>
      </div>

      <Divider className="-mx-4" />

      <div
        role="button"
        onClick={() => {
          trackingHandler(TRACKING_EVENT_TYPE.GAS_TOKEN_CHANGED, {
            previous_gas_token: paymentToken?.symbol || 'ETH',
            new_gas_token: 'ETH',
          })
          setPaymentToken(null)
          onBack()
        }}
        className={cn(
          '-mx-4 flex cursor-pointer justify-between px-4 py-2 hover:bg-buttonBlack',
          !paymentToken && 'bg-primary-15',
        )}
      >
        <div className="flex items-center gap-1.5">
          <CurrencyLogo currency={NativeCurrencies[ChainId.ZKSYNC]} size="24px" />
          <div>
            <span className="text-base">ETH</span>
          </div>
        </div>
        <span className="text-sm">{ethBalance?.toSignificant(6)}</span>
      </div>

      <Divider className="-mx-4" />

      <div className="mt-3 flex items-center gap-2">
        <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="EvStationRoundedIcon" width="24px">
          <path
            d="m19.77 7.23.01-.01-3.19-3.19c-.29-.29-.77-.29-1.06 0-.29.29-.29.77 0 1.06l1.58 1.58c-1.05.4-1.76 1.47-1.58 2.71.16 1.1 1.1 1.99 2.2 2.11.47.05.88-.03 1.27-.2v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v15c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-6.5h1.5v4.86c0 1.31.94 2.5 2.24 2.63 1.5.15 2.76-1.02 2.76-2.49V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 16.12V13.5H6.83c-.38 0-.62-.4-.44-.74l2.67-5c.24-.45.94-.28.94.24v3h1.14c.38 0 .62.41.43.75l-2.64 4.62c-.25.44-.93.26-.93-.25z"
            fill="white"
          />
        </svg>

        <TextDashed fontSize={14} fontWeight="500" lineHeight="20px">
          <MouseoverTooltip
            text={
              <span>
                <Trans>
                  The PayMaster module & contracts are developed and operated by HoldStations,{' '}
                  <ExternalLink href="https://docs.kyberswap.com/reference/third-party-integrations#what-is-paymaster">
                    details
                  </ExternalLink>
                </Trans>
              </span>
            }
          >
            Paymaster
          </MouseoverTooltip>
        </TextDashed>
      </div>
      <p className="mb-4 mt-1 text-sm text-subText">
        <Trans>Pay network fees in the token of your choice.</Trans>
      </p>

      {GAS_TOKENS.map((item, index) => (
        <div
          key={item.address}
          role="button"
          onClick={() => {
            trackingHandler(TRACKING_EVENT_TYPE.GAS_TOKEN_CHANGED, {
              previous_gas_token: paymentToken?.symbol || 'ETH',
              new_gas_token: item.symbol || '',
            })
            setPaymentToken(item)
            onBack()
          }}
          className={cn(
            '-mx-4 flex cursor-pointer justify-between px-4 py-2 hover:bg-buttonBlack',
            paymentToken?.address === item.address && 'bg-primary-15',
          )}
        >
          <div className="flex items-center gap-1.5">
            <CurrencyLogo currency={item} size="24px" />
            <div className="flex items-center gap-1.5">
              <span className="text-base">{item.symbol}</span>
              {index === 0 && (
                <div className="rounded-full bg-primary-20 px-2 py-1 text-xs font-medium text-primary">20% OFF</div>
              )}
            </div>
          </div>
          <span className="text-sm">{balances[index]?.toSignificant(6) || '0'}</span>
        </div>
      ))}
    </>
  )
}
