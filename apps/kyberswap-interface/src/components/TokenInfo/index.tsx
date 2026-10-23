import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { PropsWithChildren, useMemo, useState } from 'react'
import { ChevronLeft } from 'react-feather'

import { ReactComponent as Coingecko } from 'assets/svg/coingecko_color.svg'
import { ReactComponent as GoplusLogo } from 'assets/svg/logo_goplus.svg'
import { ReactComponent as SecurityInfoIcon } from 'assets/svg/security_info.svg'
import { ReactComponent as ZiczacIcon } from 'assets/svg/ziczac.svg'
import IconButton from 'components/Button/IconButton'
import CurrencyLogo from 'components/CurrencyLogo'
import SegmentedControl from 'components/SegmentedControl'
import { HStack } from 'components/Stack'
import { TextDashed } from 'components/Text'
import MarketInfo from 'components/TokenInfo/MarketInfo'
import SecurityInfo from 'components/TokenInfo/SecurityInfo'
import { MouseoverTooltip } from 'components/Tooltip'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { cn } from 'utils/cn'
import { isTokenNative } from 'utils/tokenInfo'

const HeaderPanel = ({ children, className }: PropsWithChildren<{ className?: string }>) => (
  <div className={cn('flex h-10 items-center justify-between bg-subText-20 px-4', className)}>{children}</div>
)

const PoweredBy = ({ children }: PropsWithChildren) => (
  <div className="flex items-center justify-end gap-1">
    <span className="text-[10px] font-normal text-subText">
      <Trans>Powered by</Trans>
    </span>
    {children}
  </div>
)

const getTokenKey = (currency: Currency) => `${currency.chainId}:${currency.wrapped.address.toLowerCase()}`

const TokenTabLabel = ({ currency }: { currency: Currency }) => (
  <span className="flex h-[18px] min-w-16 items-center justify-center gap-1.5">
    <span className="relative flex size-[18px] shrink-0 items-center justify-center">
      <CurrencyLogo currency={currency} size="16px" />
      <img
        src={NETWORKS_INFO[currency.chainId].icon}
        alt={NETWORKS_INFO[currency.chainId].name}
        title={NETWORKS_INFO[currency.chainId].name}
        className="absolute bottom-0 right-0 size-2 rounded-full ring-1 ring-tabBackground"
      />
    </span>
    <span className="whitespace-nowrap leading-none">{currency.symbol}</span>
  </span>
)

/** Owns selection within the supplied EVM token list, independently of the swap pair.
 * Deduplicates by chain/wrapped address; selection survives reorder and falls back when removed. */
const TokenInfo = ({ tokens, onBack }: { tokens: Array<Currency | undefined>; onBack?: () => void }) => {
  const theme = useTheme()
  const currencies = useMemo(
    () =>
      tokens.reduce<Currency[]>((result, token) => {
        if (!token) return result
        const currency = isTokenNative(token) ? NativeCurrencies[token.chainId] : token
        if (result.some(item => getTokenKey(item) === getTokenKey(currency))) return result
        return [...result, currency]
      }, []),
    [tokens],
  )
  const [selectedKey, setSelectedKey] = useState<string>()
  const selectedCurrency = currencies.find(currency => getTokenKey(currency) === selectedKey) ?? currencies[0]
  const selectedToken = selectedCurrency?.wrapped

  return (
    <div className="flex flex-col">
      <HStack className="flex-wrap items-center justify-between gap-2 p-4">
        <HStack className="max-w-full shrink-0 items-center gap-1">
          {onBack && (
            <IconButton aria-label="Back" className="hover:brightness-125" onClick={onBack}>
              <ChevronLeft size={26} />
            </IconButton>
          )}
          <span className="text-xl font-medium text-text">{t`Token Info`}</span>
        </HStack>
        {currencies.length > 0 && (
          <div className="max-w-full shrink-0 overflow-x-auto" aria-label={t`Token information selector`}>
            <div className="w-max">
              <SegmentedControl
                size="xs"
                value={selectedCurrency ? getTokenKey(selectedCurrency) : undefined}
                onChange={setSelectedKey}
                options={currencies.map(currency => ({
                  value: getTokenKey(currency),
                  label: <TokenTabLabel currency={currency} />,
                }))}
              />
            </div>
          </div>
        )}
      </HStack>
      {!selectedToken ? (
        <div className="px-4 pb-4 text-sm text-subText">{t`Select a token to view its information.`}</div>
      ) : (
        <>
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
        </>
      )}
    </div>
  )
}

export default TokenInfo
