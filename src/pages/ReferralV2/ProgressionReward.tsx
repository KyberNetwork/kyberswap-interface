import React, { useState } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import useTheme from 'hooks/useTheme'
import questIcon from 'assets/images/quest.png'
import { ButtonPrimary } from 'components/Button'
import { Trans } from '@lingui/macro'
import { SectionWrapper } from './styled'
import { useMedia } from 'react-use'
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
  background-color: ${({ theme }) => theme.warning};
  width: ${({ value }) => value || 0}%;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
`

export default function ProgressionReward() {
  const theme = useTheme()
  const [value, setValue] = useState(40)
  const above768 = useMedia('(min-width: 768px)')

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
              Use your referrers's code & complete more than $500 in trading volume on KyberSwap to unlock your referral
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
              {value}%
            </Text>
            <ProgressionValue value={value} />
          </ProgressionWrapper>
        </Flex>
        <ButtonPrimary width={above768 ? '104px' : '100%'} height={'44px'}>
          {value < 100 ? 'Swap' : 'Claim'}
        </ButtonPrimary>
      </Flex>
    </SectionWrapper>
  )
}
