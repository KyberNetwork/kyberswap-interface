import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ArrowLeft } from 'react-feather'
import { Box, Flex, Text } from 'rebass'

import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { GAS_TOKENS, NativeCurrencies } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { usePaymentToken } from 'state/user/hooks'
import { useCurrencyBalances, useNativeBalance } from 'state/wallet/hooks'
import { ExternalLink } from 'theme'

export default function GasTokenSetting({ onBack }: { onBack: () => void }) {
  const theme = useTheme()
  const ethBalance = useNativeBalance()
  const balances = useCurrencyBalances(GAS_TOKENS)

  const [paymentToken, setPaymentToken] = usePaymentToken()

  return (
    <>
      <Flex sx={{ gap: '6px', cursor: 'pointer' }} alignItems="center" role="button" onClick={onBack}>
        <ArrowLeft size="24px" color={theme.subText} />
        <Text fontSize="20px" fontWeight="500">
          Gas Token
        </Text>
      </Flex>

      <Flex
        color={theme.subText}
        justifyContent="space-between"
        fontSize={14}
        marginTop="0.75rem"
        marginBottom="0.5rem"
      >
        <Text>
          <Trans>Token</Trans>
        </Text>
        <Text>
          <Trans>Balance</Trans>
        </Text>
      </Flex>

      <Divider marginX="-1rem" />

      <Flex
        justifyContent="space-between"
        padding="0.5rem 1rem"
        marginX="-1rem"
        role="button"
        onClick={() => {
          setPaymentToken(null)
          onBack()
        }}
        sx={{
          cursor: 'pointer',
          background: !paymentToken ? rgba(theme.primary, 0.15) : 'transparent',
          '&:hover': {
            background: theme.buttonBlack,
          },
        }}
      >
        <Flex alignItems="center" sx={{ gap: '6px' }}>
          <CurrencyLogo currency={NativeCurrencies[ChainId.ZKSYNC]} size="24px" />
          <div>
            <Text fontSize={16}>ETH</Text>
          </div>
        </Flex>
        <Text fontSize={14}>{ethBalance?.toSignificant(6)}</Text>
      </Flex>

      <Divider marginX="-1rem" />

      <Flex marginTop="0.75rem" alignItems="center" sx={{ gap: '8px' }}>
        <svg focusable="false" aria-hidden="true" viewBox="0 0 24 24" data-testid="EvStationRoundedIcon" width="24px">
          <path
            d="m19.77 7.23.01-.01-3.19-3.19c-.29-.29-.77-.29-1.06 0-.29.29-.29.77 0 1.06l1.58 1.58c-1.05.4-1.76 1.47-1.58 2.71.16 1.1 1.1 1.99 2.2 2.11.47.05.88-.03 1.27-.2v7.21c0 .55-.45 1-1 1s-1-.45-1-1V14c0-1.1-.9-2-2-2h-1V5c0-1.1-.9-2-2-2H6c-1.1 0-2 .9-2 2v15c0 .55.45 1 1 1h8c.55 0 1-.45 1-1v-6.5h1.5v4.86c0 1.31.94 2.5 2.24 2.63 1.5.15 2.76-1.02 2.76-2.49V9c0-.69-.28-1.32-.73-1.77zM18 10c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zM8 16.12V13.5H6.83c-.38 0-.62-.4-.44-.74l2.67-5c.24-.45.94-.28.94.24v3h1.14c.38 0 .62.41.43.75l-2.64 4.62c-.25.44-.93.26-.93-.25z"
            fill="white"
          />
        </svg>

        <TextDashed fontSize={14} fontWeight="500" lineHeight="20px">
          <MouseoverTooltip
            text={
              <Text>
                <Trans>
                  The PayMaster module & contracts are developed and operated by HoldStations,{' '}
                  <ExternalLink href="https://docs.kyberswap.com/reference/third-party-integrations#what-is-paymaster">
                    details
                  </ExternalLink>
                </Trans>
              </Text>
            }
          >
            Paymaster
          </MouseoverTooltip>
        </TextDashed>
      </Flex>
      <Text fontSize={14} color={theme.subText} marginTop="4px" marginBottom="1rem">
        <Trans>Pay network fees in the token of your choice.</Trans>
      </Text>

      {GAS_TOKENS.map((item, index) => (
        <Flex
          justifyContent="space-between"
          key={item.address}
          role="button"
          onClick={() => {
            setPaymentToken(item)
            onBack()
          }}
          padding="8px 16px"
          marginX="-1rem"
          sx={{
            cursor: 'pointer',
            background: paymentToken?.address === item.address ? rgba(theme.primary, 0.15) : 'transparent',
            '&:hover': {
              background: theme.buttonBlack,
            },
          }}
        >
          <Flex alignItems="center" sx={{ gap: '6px' }}>
            <CurrencyLogo currency={item} size="24px" />
            <Flex alignItems="center" sx={{ gap: '6px' }}>
              <Text fontSize={16}>{item.symbol}</Text>
              {index === 0 && (
                <Box
                  sx={{
                    borderRadius: '999px',
                    background: rgba(theme.primary, 0.2),
                    color: theme.primary,
                    fontSize: '12px',
                    fontWeight: 500,
                    padding: '4px 8px',
                  }}
                >
                  20% OFF
                </Box>
              )}
            </Flex>
          </Flex>
          <Text fontSize={14}>{balances[index]?.toSignificant(6) || '0'}</Text>
        </Flex>
      ))}
    </>
  )
}
