import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { HTMLAttributes, PropsWithChildren, useEffect, useState } from 'react'
import { ChevronLeft } from 'react-feather'

import { ReactComponent as Coingecko } from 'assets/svg/coingecko_color.svg'
import { ReactComponent as GoplusLogo } from 'assets/svg/logo_goplus.svg'
import { ReactComponent as SecurityInfoIcon } from 'assets/svg/security_info.svg'
import { ReactComponent as ZiczacIcon } from 'assets/svg/ziczac.svg'
import { ButtonEmpty } from 'components/Button'
import IconButton from 'components/Button/IconButton'
import CurrencyLogo from 'components/CurrencyLogo'
import { HStack } from 'components/Stack'
import { TextDashed } from 'components/Text'
import MarketInfo from 'components/TokenInfo/MarketInfo'
import SecurityInfo from 'components/TokenInfo/SecurityInfo'
import { MouseoverTooltip } from 'components/Tooltip'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { Field } from 'state/swap/actions'
import { cn } from 'utils/cn'
import { useCurrencyConvertedToNative } from 'utils/dmm'

type ContainerProps = PropsWithChildren<HTMLAttributes<HTMLDivElement>>

export const Container = ({ children, className, ...rest }: ContainerProps) => (
  <div className={cn('flex flex-col px-4', className)} {...rest}>
    {children}
  </div>
)

export const HeaderPanel = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('flex h-10 items-center justify-between bg-subText-20 px-4', className)}>{children}</div>
)

export const PoweredBy = ({ children }: PropsWithChildren) => (
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

const tabBaseClass =
  'relative z-[1] flex w-full min-w-[80px] items-center justify-center gap-1 rounded-full bg-transparent px-2 py-1.5 text-xs font-medium hover:no-underline'

type TokenTabButtonProps = {
  currency?: Currency
  isActive: boolean
  onClick: () => void
}

export const TokenTabButton = ({ currency, isActive, onClick }: TokenTabButtonProps) => (
  <ButtonEmpty padding="0" onClick={onClick} className={cn(tabBaseClass, !isActive && 'hover:bg-tabActive/40')}>
    <CurrencyLogo currency={currency} size="16px" />
    <span className={cn('whitespace-nowrap', isActive ? 'text-text' : 'text-subText')}>{currency?.symbol}</span>
  </ButtonEmpty>
)

const TokenInfo = ({ currencies, onBack }: { currencies: { [field in Field]?: Currency }; onBack?: () => void }) => {
  const { chainId } = useActiveWeb3React()
  const theme = useTheme()
  const inputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.INPUT])
  const outputNativeCurrency = useCurrencyConvertedToNative(currencies[Field.OUTPUT])
  const inputToken = inputNativeCurrency?.wrapped
  const outputToken = outputNativeCurrency?.wrapped

  const [activeTab, setActiveTab] = useState(TAB.TOKEN_IN)

  const selectedToken = activeTab === TAB.TOKEN_OUT ? outputToken : inputToken
  const isOneToken = !!inputToken?.address && inputToken.address === outputToken?.address
  const isActiveTokenIn = activeTab === TAB.TOKEN_IN
  const isActiveTokenOut = activeTab === TAB.TOKEN_OUT

  useEffect(() => {
    inputToken?.address && setActiveTab(TAB.TOKEN_IN)
  }, [chainId, inputToken?.address])

  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between p-4">
        {onBack && (
          <HStack className="items-center gap-1">
            <IconButton aria-label="Back" className="hover:brightness-125" onClick={onBack}>
              <ChevronLeft size={26} />
            </IconButton>
            <HStack className="items-baseline gap-2">
              {isOneToken ? (
                <span className="font-medium">{inputToken?.symbol}</span>
              ) : (
                <span className="text-xl font-medium text-text">{t`Token Info`}</span>
              )}
              {isOneToken && <span className="text-sm font-medium text-subText">{inputToken?.name}</span>}
            </HStack>
          </HStack>
        )}
        {!isOneToken && (
          <div className="relative grid min-w-[160px] grid-cols-2 rounded-full bg-tabBackground p-0.5">
            <div
              className={cn(
                'pointer-events-none absolute inset-y-0.5 left-0.5 w-[calc(50%-2px)] rounded-full bg-tabActive transition-transform duration-200 ease-out',
                isActiveTokenOut && 'translate-x-full',
              )}
            />
            <TokenTabButton
              currency={inputNativeCurrency}
              isActive={isActiveTokenIn}
              onClick={() => setActiveTab(TAB.TOKEN_IN)}
            />
            <TokenTabButton
              currency={outputNativeCurrency}
              isActive={isActiveTokenOut}
              onClick={() => setActiveTab(TAB.TOKEN_OUT)}
            />
          </div>
        )}
      </div>
      <HeaderPanel>
        <div className="flex items-center gap-2">
          <ZiczacIcon />
          <Trans>Market Info</Trans>
        </div>
        <PoweredBy>
          <Coingecko style={{ height: 16, width: 'fit-content' }} />
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
          <GoplusLogo style={{ height: 16, width: 'fit-content' }} />
        </PoweredBy>
      </HeaderPanel>
      <SecurityInfo token={selectedToken} />
    </div>
  )
}

export default TokenInfo
