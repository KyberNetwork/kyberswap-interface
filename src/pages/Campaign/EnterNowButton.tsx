import React, { useRef, useState } from 'react'
import { CampaignData } from 'state/campaigns/actions'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import { Trans } from '@lingui/macro'
import styled, { css } from 'styled-components'
import { Button } from 'theme'
import useTheme from 'hooks/useTheme'
import { useOnClickOutside } from 'hooks/useOnClickOutside'
import { OptionsContainer } from 'pages/TrueSight/styled'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { NETWORKS_INFO } from 'constants/networks'
import { Flex, Text } from 'rebass'
import { ReactComponent as Down } from 'assets/svg/down.svg'

export default function EnterNowButton({ campaign }: { campaign: CampaignData | undefined }) {
  const { mixpanelHandler } = useMixpanel()
  const theme = useTheme()
  const [isShowNetworks, setIsShowNetworks] = useState(false)
  const containerRef = useRef<HTMLButtonElement>(null)
  useOnClickOutside(containerRef, () => {
    console.log('click')
    setIsShowNetworks(false)
  })

  const chainIds: ChainId[] = campaign ? campaign.chainIds.split(',').map(item => +item) : []

  return (
    <StyledEnterNowButton
      onClick={e => {
        e.stopPropagation()
        setIsShowNetworks(prev => !prev)
      }}
      ref={containerRef}
    >
      <Text flex={1} textAlign="center" marginLeft="6px">
        <Trans>Enter now</Trans>
      </Text>
      <Down
        style={{
          transform: `rotate(${isShowNetworks ? '-180deg' : 0})`,
          transition: 'transform 0.2s',
        }}
      />

      {isShowNetworks && (
        <OptionsContainer style={{ margin: '0 12px', width: 'calc(100% - 24px)' }}>
          {chainIds.map(chainId => {
            return (
              <Flex
                key={chainId}
                alignItems="center"
                onClick={() => {
                  mixpanelHandler(MIXPANEL_TYPE.CAMPAIGN_ENTER_NOW_CLICKED, { campaign_name: campaign?.name })
                  window.open(campaign?.enterNowUrl + '?networkId=' + chainId)
                }}
              >
                <img src={NETWORKS_INFO[chainId].icon} alt="Network" style={{ minWidth: '16px', width: '16px' }} />
                <Text marginLeft="4px" color={theme.subText} fontSize="12px" fontWeight={500} minWidth="fit-content">
                  <Trans>Swap on {NETWORKS_INFO[chainId].name}</Trans>
                </Text>
              </Flex>
            )
          })}
        </OptionsContainer>
      )}
    </StyledEnterNowButton>
  )
}

const StyledEnterNowButton = styled(Button)`
  position: relative;
  display: flex;
  align-items: center;
  padding: 10px;
  min-width: 196px;
  font-weight: 500;
  font-size: 14px;

  color: ${({ theme }) => theme.textReverse};
  ${({ theme }) => theme.mediaWidth.upToSmall`
    ${css`
      flex: 1;
    `}
  `}
`
