import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { ReactNode, useMemo, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled, { keyframes } from 'styled-components'

import SlippageControl from 'components/SlippageControl'
import SlippageWarningNote from 'components/SlippageWarningNote'
import { MouseoverTooltip, TextDashed } from 'components/Tooltip'
import { DEFAULT_SLIPPAGES, DEFAULT_SLIPPAGES_HIGH_VOTALITY } from 'constants/index'
import useTheme from 'hooks/useTheme'
import { useDefaultSlippageByPair, usePairCategory } from 'state/swap/hooks'
import { useDegenModeManager, useSlippageSettingByPage } from 'state/user/hooks'
import { ExternalLink } from 'theme'
import { SLIPPAGE_STATUS, SLIPPAGE_WARNING_MESSAGES, checkRangeSlippage, formatSlippage } from 'utils/slippage'

const highlight = keyframes`
  0% {
    box-shadow: 0 0 0 0 #31CB9E66;
  }

  70% {
    box-shadow: 0 0 0 3px #31CB9E66; 
  }

  100% {
    box-shadow: 0 0 0 0 #31CB9E66;
  }
`

//transition: transform 300ms;
const DropdownIcon = styled.div`
  margin-left: 6px;
  border-radius: 50%;
  width: 12px;
  height: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 2px;

  transition: all 0.2s ease-in-out;
  color: ${({ theme }) => theme.subText};
  &[data-flip='true'] {
    transform: rotate(180deg);
  }

  &[data-highlight='true'] {
    background: ${({ theme }) => rgba(theme.primary, 0.6)};
    animation: ${highlight} 2s infinite alternate ease-in-out;
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
  const slippageStatus = checkRangeSlippage(rawSlippage, pairCategory)
  const isWarningSlippage = slippageStatus !== SLIPPAGE_STATUS.NORMAL

  const msg = SLIPPAGE_WARNING_MESSAGES[slippageStatus]?.[pairCategory] || ''

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
              {msg ? (
                <MouseoverTooltip text={`Your slippage ${msg}`}>{formatSlippage(rawSlippage)}</MouseoverTooltip>
              ) : (
                formatSlippage(rawSlippage)
              )}
            </Text>

            <DropdownIcon data-flip={expanded} data-highlight={!expanded && defaultSlp !== rawSlippage}>
              <svg width="10" height="6" viewBox="0 0 6 4" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M3.70711 3.29289L5.29289 1.70711C5.92286 1.07714 5.47669 0 4.58579 0H1.41421C0.523309 0 0.0771406 1.07714 0.707105 1.70711L2.29289 3.29289C2.68342 3.68342 3.31658 3.68342 3.70711 3.29289Z"
                  fill="#FAFAFA"
                />
              </svg>
            </DropdownIcon>
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
            sx={{ gap: '4px', cursor: 'pointer' }}
            alignItems="center"
            marginTop="-12px"
            paddingX="4px"
            role="button"
            onClick={() => setRawSlippage(defaultSlp)}
          >
            <MouseoverTooltip text="Dynamic entry based on trading pair." placement="bottom">
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
