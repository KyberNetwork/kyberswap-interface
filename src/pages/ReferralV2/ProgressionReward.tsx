import React, { useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import questIcon from 'assets/images/quest.png'
import { ButtonPrimary } from 'components/Button'
import { Trans, t } from '@lingui/macro'
import { SectionWrapper } from './styled'
import { useMedia } from 'react-use'
import { RefereeInfo } from 'hooks/useReferralV2'
import { useHistory } from 'react-router-dom'
import { animated, useTransition } from 'react-spring'
import InfoHelper from 'components/InfoHelper'

const AnimatedWrapper = styled(animated(Flex))``

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
const TRADE_GOAL = 0.45
export default function ProgressionReward({
  refereeInfo,
  onUnlock,
  isShow,
  isTesting,
}: {
  refereeInfo: RefereeInfo
  onUnlock?: () => void
  isShow?: boolean
  isTesting?: boolean
}) {
  const theme = useTheme()
  const above768 = useMedia('(min-width: 768px)')
  const progressPercent = refereeInfo?.tradeVolume ? Math.floor((refereeInfo?.tradeVolume / TRADE_GOAL) * 100) : 0
  const history = useHistory()
  const fadeTransition = useTransition(isShow, null, {
    config: { friction: 15, tension: 50, clamp: true },
    from: { opacity: 1, transform: 'translateX(0%)' },
    leave: { opacity: 0, transform: 'translateX(105%)' },
    trail: 1000,
  })
  const { isEligible } = refereeInfo
  return (
    <>
      <SectionWrapper style={{ overflow: 'hidden' }}>
        {fadeTransition.map(
          ({ item, key, props }) =>
            item && (
              <AnimatedWrapper
                backgroundColor={theme.background}
                style={{ borderRadius: '20px', padding: '20px', gap: '20px', ...props }}
                key={key}
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
                      Use your referrers' code & complete more than $500 in trading volume on KyberSwap to unlock your
                      referral reward!
                    </Trans>
                    <InfoHelper
                      size={12}
                      text={t`There may be a delay in reflecting the transaction here`}
                      placement="top"
                    />
                  </Flex>
                  <ProgressionWrapper>
                    <Text
                      color={theme.textReverse}
                      fontSize={'12px'}
                      fontWeight={700}
                      style={{ position: 'absolute', left: '50%', transform: 'translateX(-50%)' }}
                    >
                      {progressPercent > 100 ? 100 : progressPercent}%
                    </Text>
                    <ProgressionValue value={progressPercent} />
                  </ProgressionWrapper>
                </Flex>
                {isTesting ? (
                  <ButtonPrimary width={above768 ? '104px' : '100%'} height={'44px'} onClick={onUnlock}>
                    <Trans>Unlock</Trans>
                  </ButtonPrimary>
                ) : !isEligible ? (
                  <ButtonPrimary
                    width={above768 ? '104px' : '100%'}
                    height={'44px'}
                    onClick={() => history.push('/swap')}
                  >
                    <Trans>Swap</Trans>
                  </ButtonPrimary>
                ) : (
                  <ButtonPrimary width={above768 ? '104px' : '100%'} height={'44px'} onClick={onUnlock}>
                    <Trans>Unlock</Trans>
                  </ButtonPrimary>
                )}
              </AnimatedWrapper>
            ),
        )}
      </SectionWrapper>
    </>
  )
}
