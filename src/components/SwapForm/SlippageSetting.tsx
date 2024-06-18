import { Trans, t } from '@lingui/macro'
import { ReactNode, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import SlippageControl from 'components/SlippageControl'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import useTheme from 'hooks/useTheme'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { checkWarningSlippage, formatSlippage, getDefaultSlippage } from 'utils/slippage'

const DropdownIcon = styled(DropdownSVG)`
  transition: transform 300ms;
  color: ${({ theme }) => theme.subText};
  &[data-flip='true'] {
    transform: rotate(180deg);
  }
`

type Props = {
  isStablePairSwap: boolean
  isCorrelatedPair: boolean
  rightComponent?: ReactNode
  tooltip?: ReactNode
}
const SlippageSetting = ({ isStablePairSwap, isCorrelatedPair, rightComponent, tooltip }: Props) => {
  const theme = useTheme()
  const [expanded, setExpanded] = useState(false)
  const [isDegenMode] = useDegenModeManager()

  const { rawSlippage, setRawSlippage, isSlippageControlPinned } = useSlippageSettingByPage()
  const defaultRawSlippage = getDefaultSlippage(isStablePairSwap, isCorrelatedPair)

  const isWarningSlippage = checkWarningSlippage(rawSlippage, isStablePairSwap, isCorrelatedPair)
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
                    ? isStablePairSwap
                      ? t`Your slippage setting might be high compared to typical stable pair trades. Consider adjusting it to reduce the risk of front-running.`
                      : isCorrelatedPair
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
          defaultRawSlippage={defaultRawSlippage}
        />

        <SlippageWarningNote
          rawSlippage={rawSlippage}
          isStablePairSwap={isStablePairSwap}
          isCorrelatedPair={isCorrelatedPair}
        />
      </Flex>
      {isDegenMode && expanded && (
        <Text fontSize="12px" fontWeight="500" color={theme.subText} padding="4px 6px">
          Maximum Slippage allow for Degen mode is 50%
        </Text>
      )}
    </Flex>
  )
}

export default SlippageSetting
