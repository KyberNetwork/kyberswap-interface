import React, { useState } from 'react'
import styled, { keyframes } from 'styled-components'
import { Flex, Text, Image } from 'rebass'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import introImg from 'assets/buy-crypto/intro.png'
import visa from 'assets/buy-crypto/visa.svg'
import masterCard from 'assets/buy-crypto/master-card.svg'
import gPay from 'assets/buy-crypto/google-pay.svg'
import applePay from 'assets/buy-crypto/apple-pay.svg'
import bankTransfer from 'assets/buy-crypto/bank-transfer.svg'
import { ButtonPrimary, ButtonEmpty } from 'components/Button'
import Cart from 'components/Icons/Cart'
import { useMedia } from 'react-use'
import { ArrowDown, ChevronRight, ChevronDown } from 'react-feather'
import { ButtonText } from 'theme'

const IntroWrapper = styled.div`
  background: radial-gradient(88.77% 152.19% at 12.8% -49.11%, #237c71 0%, #251c72 31%, #0f054c 100%);
  width: 100%;
`

const IntroContent = styled.div`
  max-width: 1200px;
  padding: 100px 24px 48px;
  margin: auto;
  display: flex;
  align-items: center;

  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column-reverse;
    padding: 44px 16px 30px;
  `}
`

const StepItem = styled.div<{ active: boolean }>`
  border-radius: 50%;
  background: ${({ theme, active }) => (active ? theme.primary : 'transparent')};
  border: 1px solid ${({ theme, active }) => (active ? theme.primary : theme.border)};
  color: ${({ theme, active }) => (active ? theme.textReverse : theme.subText)};
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
`

const StepSeparator = styled.div<{ direction: 'vertical' | 'horizontal' }>`
  width: ${({ direction }) => (direction === 'vertical' ? '1px' : '16px')};
  height: ${({ direction }) => (direction === 'vertical' ? '16px' : '1px')};
  background: ${({ theme }) => theme.border};
`

const animation = keyframes`
  0% {
    transform: translate(0, 0);
  }
  20% {
    transform: translate(0, 10px);
  }
  40% {
    transform: translate(0, 0);
  }
`

const ScrollDownBtn = styled(ButtonText)`
  animation: ${animation} 1.5s infinite;
`

const Step = ({
  currentStep = 1,
  direction = 'vertical',
}: {
  currentStep: 1 | 2 | 3 | 4
  direction: 'vertical' | 'horizontal'
}) => {
  const steps = [1, 2, 3, 4]
  return (
    <Flex
      width="fit-content"
      flexDirection={direction === 'vertical' ? 'column' : 'row'}
      sx={{ gap: '4px' }}
      alignItems="center"
      justifyContent="center"
    >
      {steps.map((item, index) => (
        <React.Fragment key={item}>
          <StepItem active={currentStep === item}>{index + 1}</StepItem>
          {index !== steps.length - 1 && <StepSeparator direction={direction} />}
        </React.Fragment>
      ))}
    </Flex>
  )
}

function BuyCrypto() {
  const theme = useTheme()

  const upToMedium = useMedia('(max-width: 992px)')
  const upToSmall = useMedia('(max-width: 768px)')

  return (
    <IntroWrapper>
      <IntroContent>
        {!upToMedium && <Step currentStep={1} direction="vertical" />}
        <Flex flexDirection="column" flex={1} marginLeft={!upToMedium ? '68px' : 0}>
          <Text
            fontSize={upToMedium ? '28px' : '44px'}
            lineHeight={upToMedium ? '32px' : '60px'}
            data-aos="zoom-in"
            marginTop={upToMedium ? '40px' : undefined}
          >
            <Trans>Buy crypto easily with over 50+ currencies</Trans>
          </Text>

          <Text
            color={theme.subText}
            fontSize={upToMedium ? '16px' : '20px'}
            lineHeight={upToMedium ? '24px' : '28px'}
            marginTop={upToMedium ? '40px' : '48px'}
            data-aos="fade-up"
          >
            You can now seamlessly buy 100+ cryptocurrencies on over 10+ blockchains using a wide range of payment
            options!
          </Text>

          <Flex sx={{ gap: '28px' }} marginTop="24px" data-aos="fade-up">
            <Image src={visa} width={upToSmall ? '36px' : '64px'} />
            <Image src={masterCard} width={upToSmall ? '36px' : '64px'} />
            <Image src={gPay} width={upToSmall ? '36px' : '64px'} />
            <Image src={applePay} width={upToSmall ? '36px' : '64px'} />
            <Image src={bankTransfer} width={upToSmall ? '36px' : '64px'} />
          </Flex>

          <ButtonPrimary
            margin={upToMedium ? '40px 0 0' : '48px 0 0'}
            data-aos="zoom-in"
            width={upToSmall ? '100%' : '50%'}
          >
            <Cart />
            <Text fontSize="14px" marginLeft="8px">
              <Trans>Buy Crypto</Trans>
            </Text>
          </ButtonPrimary>

          <Flex justifyContent="space-between" marginTop={upToMedium ? '42px' : '64px'}>
            <ScrollDownBtn>
              {upToMedium ? (
                <ChevronDown size={36} color={theme.subText} />
              ) : (
                <ArrowDown size={48} color={theme.subText} />
              )}
            </ScrollDownBtn>

            {upToMedium && <Step direction="horizontal" currentStep={1} />}
          </Flex>
        </Flex>

        <Image
          src={introImg}
          sx={{ flex: 1, marginLeft: upToSmall ? 'auto' : '48px', maxWidth: upToMedium ? '252px' : '496px' }}
          data-aos="zoom-in"
        />
      </IntroContent>
    </IntroWrapper>
  )
}

export default BuyCrypto
