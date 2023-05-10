import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import Logo from 'components/Logo'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { formattedNumLong } from 'utils'

type Props = {
  feesEarnedTodayUSD: number
  feesEarnedTokens: Array<{
    logoUrl: string
    amount: number
    symbol: string
  }>
  disabled: boolean
}
const CollectFeesPanel: React.FC<Props> = ({ feesEarnedTodayUSD, feesEarnedTokens, disabled }) => {
  const theme = useTheme()

  return (
    <Flex
      sx={{
        alignItems: 'center',
        justifyContent: 'space-between',
        borderRadius: '20px',
        background: disabled ? theme.background : rgba(theme.apr, 0.3),
        padding: '16px',
      }}
    >
      <Flex
        sx={{
          flexDirection: 'column',
        }}
      >
        <Text
          as="span"
          sx={{
            fontWeight: 500,
            fontSize: '12px',
            lineHeight: '16px',
            color: theme.subText,
            width: 'fit-content',
            borderBottom: '1px dashed transparent',
            borderBottomColor: theme.subText,
          }}
        >
          <MouseoverTooltip
            width="200px"
            text={<Trans>Your fees are being automatically compounded so you earn more</Trans>}
            placement="top"
          >
            <Trans>Fees Earned</Trans>
          </MouseoverTooltip>
        </Text>

        <HoverDropdown
          anchor={
            <Text as="span" fontSize="16px" fontWeight={500} lineHeight={'20px'}>
              {formatUSDValue(feesEarnedTodayUSD, true)}
            </Text>
          }
          disabled={!feesEarnedTokens.length}
          text={
            <>
              {feesEarnedTokens.map((token, index) => (
                <Flex
                  alignItems="center"
                  key={index}
                  sx={{
                    gap: '4px',
                  }}
                >
                  <Logo srcs={[token.logoUrl]} style={{ flex: '0 0 16px', height: '16px', borderRadius: '999px' }} />
                  <Text fontSize={12}>
                    {formattedNumLong(token.amount, false)} {token.symbol}
                  </Text>
                </Flex>
              ))}
            </>
          }
        />
      </Flex>

      <ButtonPrimary
        disabled={disabled}
        style={{
          height: '36px',
          width: 'fit-content',
          flexWrap: 'nowrap',
          padding: '0 12px',
        }}
      >
        Collect Fees
      </ButtonPrimary>
    </Flex>
  )
}

export default CollectFeesPanel
