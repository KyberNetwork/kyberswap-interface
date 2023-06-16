import { Currency, CurrencyAmount } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Flex, Text } from 'rebass'

import { ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import { formatUSDValue } from 'components/EarningAreaChart/utils'
import { MouseoverTooltip } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import HoverDropdown from 'pages/MyEarnings/HoverDropdown'
import { formattedNumLong } from 'utils'

type Props = {
  feeReward0: CurrencyAmount<Currency>
  feeReward1: CurrencyAmount<Currency>
  feeUsd: number
}
const CollectFeesPanel: React.FC<Props> = ({ feeUsd, feeReward0, feeReward1 }) => {
  const theme = useTheme()
  const disabled = !(feeReward0?.greaterThan(0) || feeReward1?.greaterThan(0))

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
              {formatUSDValue(feeUsd, true)}
            </Text>
          }
          disabled={disabled}
          text={
            <>
              {[feeReward0, feeReward1].map((fee, index) => (
                <Flex
                  alignItems="center"
                  key={index}
                  sx={{
                    gap: '4px',
                  }}
                >
                  <CurrencyLogo currency={fee.currency} size="14px" />
                  <Text fontSize={12}>
                    {formattedNumLong(+fee.toExact(), false)} {fee.currency.symbol}
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
