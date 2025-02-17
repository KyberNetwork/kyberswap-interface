import { Trans, t } from '@lingui/macro'
import { ReactNode, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import SlippageControl from 'components/SlippageControl'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY, PAIR_CATEGORY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { checkWarningSlippage, formatSlippage } from 'utils/slippage'

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.subText};
  &[data-flip='true'] {
    transform: rotate(180deg);
  }
`

type Props = {
  rightComponent?: ReactNode
  tooltip?: ReactNode
}
const SlippageSetting = ({ rightComponent, tooltip }: Props) => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [isDegenMode] = useDegenModeManager()

  const { rawSlippage, setRawSlippage, isSlippageControlPinned } = useSlippageSettingByPage()

  const pairCategory = usePairCategory()
  const defaultSlp = useDefaultSlippageByPair()
  const isWarningSlippage = checkWarningSlippage(rawSlippage, pairCategory)

  const options = useMemo(
    () => (pairCategory === 'highVolatilityPair' ? DEFAULT_SLIPPAGES_HIGH_VOTALITY : DEFAULT_SLIPPAGES),
    [pairCategory],
  )

  if (!isSlippageControlPinned) {
    return null
  }

  return (
    <Flex
      sx={{
        flexDirection: 'column',
        width: '100%',
      }}
    >
      <Flex
        sx={{
          alignItems: 'center',
          color: theme.subText,
          gap: '4px',
          justifyContent: 'space-between',
        }}
      >
        <Flex sx={{ gap: '4px' }} alignItems="center">
          <TextDashed
            color={theme.subText}
            fontSize={12}
            fontWeight={500}
            sx={{
              display: 'flex',
              alignItems: 'center',
              lineHeight: '1',
              height: 'fit-content',
            }}
          >
            <MouseoverTooltip
              placement="right"
              text={
                tooltip || (
                  <Text>
                    <Trans>
                      During your swap if the price changes by more than this %, your transaction will revert. Read more{' '}
                      <ExternalLink
                        href={
                          'https://docs.kyberswap.com/getting-started/foundational-topics/decentralized-finance/slippage'
                        }
                      >
                        here ↗
                      </ExternalLink>
                    </Trans>
                  </Text>
                )
              }
            >
              <Trans>Max Slippage</Trans>:
            </MouseoverTooltip>
          </TextDashed>
          <Flex
            sx={{
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
            role="button"
            onClick={() => setExpanded(e => !e)}
          >
            <Text
              sx={{
                fontSize: '14px',
                fontWeight: 500,
                lineHeight: '1',
                color: isWarningSlippage ? theme.warning : theme.text,
                borderBottom: isWarningSlippage ? `1px dashed ${theme.warning}` : 'none',
              }}
            >
              <MouseoverTooltip
                text={
                  isWarningSlippage
                    ? pairCategory === PAIR_CATEGORY.STABLE
                      ? t`Your slippage setting might be high compared to typical stable pair trades. Consider adjusting it to reduce the risk of front-running.`
                      : pairCategory === PAIR_CATEGORY.CORRELATED
                      ? t`Your slippage setting might be high compared with other similar trades. You might want to adjust it to avoid potential front-running.`
                      : t`Your slippage setting might be high. You might want to adjust it to avoid potential front-running.`
                    : ''
                }
              >
                {formatSlippage(rawSlippage)}
              </MouseoverTooltip>
            </Text>

            <DropdownIcon data-flip={expanded} />
          </Flex>
        </Flex>
        {rightComponent}
      </Flex>
      <Flex
        sx={{
          transition: 'all 100ms linear',
          paddingTop: expanded ? '8px' : '0px',
          height: expanded ? 'max-content' : '0px',
          overflow: 'hidden',
          flexDirection: 'column',
          gap: '1rem',
        }}
      >
        <SlippageControl
          rawSlippage={rawSlippage}
          setRawSlippage={setRawSlippage}
          isWarning={isWarningSlippage}
          options={options}
        />
        {isDegenMode && expanded && (
          <Text fontSize="12px" fontWeight="500" color={theme.subText} padding="4px 6px" marginTop="-12px">
            Maximum Slippage allow for Degen mode is 50%
          </Text>
        )}
        {Math.abs(defaultSlp - rawSlippage) / defaultSlp > 0.2 && (
          <Flex
            fontSize={12}
            color={theme.primary}
            sx={{ gap: '4px' }}
            alignItems="center"
            marginTop="-12px"
            paddingX="4px"
          >
            <MouseoverTooltip text="Dynamic entry based on trading pair.">
              <Text sx={{ borderBottom: `1px dotted ${theme.primary}` }}>Suggestion</Text>
            </MouseoverTooltip>
            {(defaultSlp * 100) / 10_000}%
          </Flex>
        )}

        <SlippageWarningNote rawSlippage={rawSlippage} />
      </Flex>
    </Flex>
  )
}

export default SlippageSetting
