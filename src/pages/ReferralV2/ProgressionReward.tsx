import React, { useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import questIcon from 'assets/images/quest.png'
import { ButtonPrimary } from 'components/Button'
import { Trans } from '@lingui/macro'
import { SectionWrapper } from './styled'
import { useMedia } from 'react-use'
import { RefereeInfo } from 'hooks/useReferralV2'
import { useHistory } from 'react-router-dom'
const ProgressionWrapper = styled.div`
  background-color: ${({ theme }) => theme.subText};
  border-radius: 16px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  width: 90%;
  height: 20px;
  overflow: hidden;
  position: relative;
  display: flex;
  align-items: center;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    text-align: center;
    width: 100%;
  `}
`
const ProgressionValue = styled.div<{ value: number }>`
  height: 100%;
  border-radius: 16px;
  background-color: ${({ theme, value }) => (value >= 100 ? theme.primary : theme.warning)};
  width: ${({ value }) => value || 0}%;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
`

export default function ProgressionReward({
  refereeInfo,
  onUnlock,
}: {
  refereeInfo?: RefereeInfo
  onUnlock?: () => void
}) {
  const theme = useTheme()
  const above768 = useMedia('(min-width: 768px)')
  const tradeVolume = refereeInfo?.tradeVolume || 0
  const history = useHistory()
  return (
    <SectionWrapper>
      <Flex
        backgroundColor={theme.background}
        style={{ borderRadius: '20px', padding: '20px', gap: '20px' }}
        alignItems="center"
        flexDirection={above768 ? 'row' : 'column'}
      >
        {above768 && (
          <div style={{ height: '44px' }}>
            <img src={questIcon} />
          </div>
        )}
        <Flex flex={1} flexDirection={'column'} style={{ gap: '8px' }}>
          <Flex fontSize={'12px'} color={theme.subText}>
            {!above768 && (
              <div style={{ height: '44px', marginRight: '8px' }}>
                <img src={questIcon} />
              </div>
            )}
            <Trans>
              Use your referrers' code & complete more than $500 in trading volume on KyberSwap to unlock your referral
              reward!
            </Trans>
          </Flex>
          <ProgressionWrapper>
            <Text
              color={theme.textReverse}
              fontSize={'12px'}
              fontWeight={700}
              style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
            >
              {Math.floor(tradeVolume / 5)}%
            </Text>
            <ProgressionValue value={tradeVolume} />
          </ProgressionWrapper>
        </Flex>
        {tradeVolume < 500 ? (
          <ButtonPrimary width={above768 ? '104px' : '100%'} height={'44px'} onClick={() => history.push('/swap')}>
            <Trans>Swap</Trans>
          </ButtonPrimary>
        ) : (
          <ButtonPrimary width={above768 ? '104px' : '100%'} height={'44px'} onClick={onUnlock}>
            <Trans>Unlock</Trans>
          </ButtonPrimary>
        )}
      </Flex>
    </SectionWrapper>
  )
}
