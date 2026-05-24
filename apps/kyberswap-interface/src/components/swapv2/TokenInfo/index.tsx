import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'

import { ReactComponent as Coingecko } from 'assets/svg/coingecko_color.svg'
import { ReactComponent as GoplusLogo } from 'assets/svg/logo_goplus.svg'
import { ReactComponent as SecurityInfoIcon } from 'assets/svg/security_info.svg'
import { ReactComponent as ZiczacIcon } from 'assets/svg/ziczac.svg'
import { ButtonEmpty } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import MarketInfo from 'components/swapv2/TokenInfo/MarketInfo'
import SecurityInfo from 'components/swapv2/TokenInfo/SecurityInfo'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'

export const Container = ({ children, className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col gap-3.5 px-3.5', className)} {...rest}>
    {children}
  </div>
)

const HeaderPanel = ({ children }: { children: React.ReactNode }) => (
  <div className="flex h-10 items-center justify-between bg-subText-20 px-4">{children}</div>
)

const PoweredBy = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center justify-end gap-1">
    <span className="text-[10px] font-normal text-subText">
      <Trans>Powered by</Trans>
    </span>
    {children}
  </div>
)

enum TAB {
  TOKEN_IN,
  TOKEN_OUT,
}
const TokenInfoTab = ({ currencies, onBack }: { currencies: { [field in Field]?: Currency }; onBack?: () => void }) => {
  const { chainId } = useActiveWeb3React()
  const inputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT])
  const outputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT])
  const inputToken = inputNativeCurrency?.wrapped
  const outputToken = outputNativeCurrency?.wrapped
  const [activeTab, setActiveTab] = useState(TAB.TOKEN_IN)
  const selectedToken = activeTab === TAB.TOKEN_OUT ? outputToken : inputToken
  const isOneToken = inputToken?.address === outputToken?.address

  useEffect(() => {
    inputToken?.address && setActiveTab(TAB.TOKEN_IN)
  }, [chainId, inputToken])

  const isActiveTokenIn = activeTab === TAB.TOKEN_IN
  const isActiveTokenOut = activeTab === TAB.TOKEN_OUT
  const theme = useTheme()

  const tabBaseClass =
    'flex w-fit min-w-[80px] items-center justify-center gap-1 rounded-full px-2 py-1.5 text-xs font-medium hover:no-underline'

  return (
    <div className="flex flex-col gap-3.5 py-4">
      <div className="flex items-center justify-between px-4">
        {onBack && (
          <div className="flex items-center gap-1">
            <ChevronLeft onClick={onBack} className="text-subText" cursor={'pointer'} size={26} />
            {isOneToken ? (
              <span className="font-medium">{inputToken?.symbol}</span>
            ) : (
              <span className="text-xl font-medium leading-[22px] text-text">{t`Token Info`}</span>
            )}
            {isOneToken && <span className="mt-1 text-xs text-subText">{inputToken?.name}</span>}
          </div>
        )}
        {!isOneToken && (
          <div className="flex min-w-[160px] rounded-full bg-tabBackground p-0.5">
            <ButtonEmpty
              padding="0"
              onClick={() => setActiveTab(TAB.TOKEN_IN)}
              className={cn(tabBaseClass, isActiveTokenIn ? 'bg-tabActive' : 'bg-tabBackground')}
            >
              <CurrencyLogo currency={inputNativeCurrency} size="16px" />
              <span className={cn('whitespace-nowrap', isActiveTokenIn ? 'text-text' : 'text-subText')}>
                {inputNativeCurrency?.symbol}
              </span>
            </ButtonEmpty>
            <ButtonEmpty
              padding="0"
              onClick={() => setActiveTab(TAB.TOKEN_OUT)}
              className={cn(tabBaseClass, isActiveTokenOut ? 'bg-tabActive' : 'bg-tabBackground')}
            >
              <CurrencyLogo currency={outputNativeCurrency} size="16px" />
              <span className={cn('whitespace-nowrap', isActiveTokenOut ? 'text-text' : 'text-subText')}>
                {outputNativeCurrency?.symbol}
              </span>
            </ButtonEmpty>
          </div>
        )}
      </div>
      <HeaderPanel>
        <div className="flex items-center gap-2">
          <ZiczacIcon />
          <Trans>Market Info</Trans>
        </div>
        <PoweredBy>
          <Coingecko style={{ width: 56 }} />
        </PoweredBy>
      </HeaderPanel>
      <MarketInfo token={selectedToken} />
      <HeaderPanel>
        <div className="flex items-center gap-2">
          <SecurityInfoIcon />

          <TextDashed underlineColor={theme.text}>
            <MouseoverTooltip
              text={t`Token security info provided by Goplus. Please conduct your own research before trading`}
            >
              <Trans>Security Info</Trans>
            </MouseoverTooltip>
          </TextDashed>
        </div>
        <PoweredBy>
          <GoplusLogo style={{ width: 56 }} />
        </PoweredBy>
      </HeaderPanel>
      <SecurityInfo token={selectedToken} />
    </div>
  )
}

export default TokenInfoTab
