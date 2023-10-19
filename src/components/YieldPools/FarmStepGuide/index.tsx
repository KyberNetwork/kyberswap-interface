import { Trans, t } from '@lingui/macro'
import { FC, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'
import { ExternalLink } from 'theme'

import v1Step1 from './images/v1/step1.png'
import v1Step2 from './images/v1/step2.png'
import v1Step3 from './images/v1/step3.png'
import v1Step4 from './images/v1/step4.png'
import v1Step5 from './images/v1/step5.png'
import v1Step6 from './images/v1/step6.png'
import v1Step7 from './images/v1/step7.png'
import v2example from './images/v2/example.png'
import step1 from './images/v2/step_1.png'
import step2 from './images/v2/step_2.png'
import step3 from './images/v2/step_3.png'
import step4 from './images/v2/step_4.png'
import step5 from './images/v2/step_5.png'
import step6 from './images/v2/step_6.png'

interface FarmStepGuideProps {
  onChangeVersion: (version: 'v1' | 'v2' | null) => void
  version: 'v1' | 'v2' | null
}

const Left = styled.div`
  background: ${({ theme }) => theme.tableHeader};
  padding: 20px;
  flex: 2;
  display: flex;
  flex-direction: column;
`

const Right = styled.div<{ img: string }>`
  background: ${({ theme }) => theme.buttonBlack};
  flex: 3;
  transition: all 0.2s ease-in-out;
  background-image: ${({ img }) => `url(${img})`};
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
  padding: 1rem;
  background-origin: content-box;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: none
  `}
`

const Image = styled.img`
  display: none;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    display: block;
    max-height: 250px;
    object-fit: contain;
    margin: auto;
    width: 100%;
 `};
`

const Tabs = styled.div`
  margin-top: 0.75rem;
  border-radius: 999px;
  display: flex;
  font-size: 14px;
  font-weight: 500;
  gap: 8px;
  align-items: center;
  color: ${({ theme }) => theme.subText};
`
const Tab = styled.div<{ isActive: boolean }>`
  cursor: pointer;
  color: ${({ isActive, theme }) => (!isActive ? theme.subText : theme.primary)};
`

const Row = styled.div`
  padding: 12px 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};

  :nth-last-child(2) {
    border-bottom: none;
  }
`

const Btn = styled.button<{ show: boolean }>`
  border: none;
  outline: none;
  line-height: 0;
  cursor: pointer;
  background: transparent;
  color: ${({ theme }) => theme.text};
  transform: rotate(${({ show }) => (show ? '-180deg' : 0)});
  transition: transform 0.2s;
  margin-right: -12px;
`

const FarmStepGuide: FC<FarmStepGuideProps> = ({ version, onChangeVersion }) => {
  const theme = useTheme()

  const v2Steps = [
    {
      title: t`About Static Farms`,
      img: step1,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px">
          <Trans>
            Static farms incentivize farmers that provide liquidity to a pool in a pre-configured farming price range
            that is set by the farm administrator. Learn more{' '}
            <ExternalLink href="https://docs.kyberswap.com/liquidity-solutions/kyberswap-elastic/user-guides/yield-farming-on-static-farms">
              here ↗
            </ExternalLink>
          </Trans>
        </Text>
      ),
    },

    {
      title: t`Step 1: Select the Farm`,
      img: step1,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px">
          <Trans>
            Identify the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Elastic farm
            </Text>{' '}
            you would like to participate in
          </Trans>
        </Text>
      ),
    },

    {
      title: t`Step 2: Approve the Farming contract`,
      img: step2,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            To join the Farm, you must approve the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              KyberSwap Farming contract
            </Text>{' '}
            to let it access your liquidity positions.
          </Trans>
        </Text>
      ),
    },
    {
      title: t`Step 3: Stake in a farm`,
      img: step3,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            After viewing the details of a Farm that you want to participate in, you can click on the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Stake
            </Text>{' '}
            button and choose the NFT position that you want to stake in the Farm. After staking, you will start
            receiving rewards.
          </Trans>
        </Text>
      ),
    },
    {
      title: t`Step 4: Claim Rewards`,
      img: step4,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            You can claim your reward by clicking on the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Harvest
            </Text>{' '}
            button
          </Trans>
        </Text>
      ),
    },

    {
      title: t`Step 5: Change Farming Range`,
      img: step5,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            In case a farm has multiple farming range, you can check other ranges by clicking on{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Farming Ranges
            </Text>{' '}
            button and choose the appropriate range for your strategy
          </Trans>
        </Text>
      ),
    },
    {
      title: t`Step 6: Unstake liquidity from a farm`,
      img: step6,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            If you wish to unstake your liquidity position from the farm, click on the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Unstake{' '}
            </Text>{' '}
            button on the card. Any rewards you have earned will be automatically harvested and sent to your wallet.
            <Text marginTop="6px">
              If you can’t find your Liquidity, you can check the{' '}
              <Text as="span" color={theme.text} fontWeight="500">
                Ended
              </Text>{' '}
              or{' '}
              <Text as="span" color={theme.text} fontWeight="500">
                My Farms
              </Text>{' '}
              tab.
            </Text>
          </Trans>
        </Text>
      ),
    },

    {
      title: t`Example`,
      img: v2example,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            For a farm with a pre-configured price range of 0.6-0.8, your liquidity positions lower range must be ≤0.6
            and upper range must be ≥0.8
          </Trans>
          <Flex marginTop="12px" sx={{ gap: '4px' }}>
            <Text color={theme.primary} fontWeight="500">
              <Trans>Eligible</Trans>:
            </Text>
            <Text>0.6-0.8, 0.5-0.8, 0.5-0.9</Text>
          </Flex>
          <Flex marginTop="12px" sx={{ gap: '4px' }}>
            <Text color={theme.warning} fontWeight="500">
              <Trans>Not Eligible</Trans>:
            </Text>
            <Text>0.6-0.7, 0.7-0.8, 0.65-0.75</Text>
          </Flex>
        </Text>
      ),
    },
  ]

  const v1Steps = [
    {
      title: t`About Dynamic Farms`,
      img: step1,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px">
          <Trans>
            Dynamic farms incentivize farmers that provide liquidity to a pool in a customizable price range that
            supports the current price of the pool. Each farmer can choose their own price range. Learn more{' '}
            <ExternalLink href="https://docs.kyberswap.com/liquidity-solutions/kyberswap-elastic/user-guides/yield-farming-on-dynamic-farms">
              here ↗
            </ExternalLink>
            .
          </Trans>
        </Text>
      ),
    },

    {
      title: t`Step 1: Select the Farm`,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px">
          <Trans>
            Identify the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Elastic farm
            </Text>{' '}
            you would like to participate in
          </Trans>
        </Text>
      ),
      img: v1Step1,
    },
    {
      title: t`Step 2: Approve the Farming contract`,
      img: v1Step2,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            To join the Farm, you must approve the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              KyberSwap Farming contract
            </Text>{' '}
            to let it access your liquidity positions.
          </Trans>
        </Text>
      ),
    },
    {
      title: t`Step 3: Deposit liquidity to Farming contract`,
      img: v1Step3,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            Deposit your{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              liquidity position
            </Text>{' '}
            (NFT token) into the farming contract.
          </Trans>
        </Text>
      ),
    },

    {
      title: t`Step 4: Stake in a farm`,
      img: v1Step4,

      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            On the Farm page, click the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Stake
            </Text>{' '}
            button on the card of the farm you would like to participate in and deposit your liquidity
          </Trans>
        </Text>
      ),
    },

    {
      title: t`Step 5: Harvest your farming rewards`,
      img: v1Step5,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            You can harvest your farming rewards whenever you want by clicking the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Harvest
            </Text>{' '}
            button. Your rewards will automatically be sent to your wallet.{' '}
          </Trans>
        </Text>
      ),
    },

    {
      title: t`Step 6: Unstake liquidity from a farm`,
      img: v1Step6,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            You can unstake your liquidity from a farm anytime you want by clicking the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Unstake
            </Text>{' '}
            button on the card.
            <Text marginTop="6px">
              If you can’t find your Liquidity, you can check the{' '}
              <Text as="span" color={theme.text} fontWeight="500">
                Ended
              </Text>{' '}
              or{' '}
              <Text as="span" color={theme.text} fontWeight="500">
                My Farms
              </Text>{' '}
              tab.
            </Text>
          </Trans>
        </Text>
      ),
    },
    {
      title: t`Step 7: Withdraw your liquidty`,
      img: v1Step7,
      description: (
        <Text fontSize="12px" color={theme.subText} paddingTop="12px" lineHeight="1rem">
          <Trans>
            Once you have unstaked your liquidity from the farm, you can finally withdraw your liquidity (from the
            farming contract) by clicking the{' '}
            <Text as="span" color={theme.text} fontWeight="500">
              Withdraw
            </Text>{' '}
            button.
          </Trans>
        </Text>
      ),
    },
  ]

  const steps = version === 'v1' ? v1Steps : v2Steps

  const [currentStep, setCurrentStep] = useState(0)

  useEffect(() => {
    setCurrentStep(0)
  }, [version])

  return (
    <Modal
      isOpen={!!version}
      onDismiss={() => onChangeVersion(null)}
      maxWidth="900px"
      minHeight={isMobile ? 90 : '650px'}
      width="800px"
    >
      <Flex
        width="100%"
        sx={{ border: `1px solid ${theme.border}`, overflow: 'hidden', borderRadius: '20px' }}
        overflowY="scroll"
      >
        <Left>
          <Text fontSize="1rem" fontWeight="500">
            <Trans>Farming Guide</Trans>
          </Text>

          <Tabs>
            <Tab isActive={version === 'v1'} onClick={() => onChangeVersion('v1')} role="button">
              <Trans>Dynamic Farm</Trans>
            </Tab>

            <Text>|</Text>
            <Tab isActive={version === 'v2'} onClick={() => onChangeVersion('v2')} role="button">
              <Trans>Static Farm</Trans>
            </Tab>
          </Tabs>

          {steps.map((item, index) => (
            <Row key={index}>
              <Flex justifyContent="space-between" alignItems="center">
                <Text fontSize="12px" fontWeight="500">
                  {item.title}
                </Text>
                <Btn onClick={() => setCurrentStep(index)} show={currentStep === index}>
                  <DropdownSVG />
                </Btn>
              </Flex>
              <Flex
                flexDirection="column"
                sx={{
                  transition: 'max-height 300ms ease-in-out, transform 300ms',
                  maxHeight: currentStep === index ? '500px' : 0,
                  overflow: 'hidden',
                  gap: '6px',
                }}
              >
                {item.description}
                <Image src={item.img} />
              </Flex>
            </Row>
          ))}

          <ButtonPrimary style={{ marginTop: 'auto' }} onClick={() => onChangeVersion(null)}>
            Okay
          </ButtonPrimary>
        </Left>
        <Right img={steps[currentStep]?.img} />
      </Flex>
    </Modal>
  )
}

export default FarmStepGuide
