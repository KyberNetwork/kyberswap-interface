import { Trans, t } from '@lingui/macro'
import { FC, useEffect, useState } from 'react'
import { isMobile } from 'react-device-detect'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonPrimary } from 'components/Button'
import Modal from 'components/Modal'
import useTheme from 'hooks/useTheme'

interface FarmStepGuideProps {
  onChangeVersion: (verison: 'v1' | 'v2' | null) => void
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
  transition: all 0.3s ease-in-out;
  background-image: ${({ img }) => `url(${img})`};
  background-size: contain;
  background-position: center;
  background-repeat: no-repeat;
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
  border-radius: 999px;
  background: ${({ theme }) => theme.buttonBlack};
  padding: 2px;
  display: flex;
  width: 116px;
  font-size: 12px;
  font-weight: 500;
`
const Tab = styled.div<{ isActive: boolean }>`
  border-radius: 999px;
  background: ${({ theme, isActive }) => (isActive ? theme.tableHeader : theme.buttonBlack)};
  cursor: pointer;
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
  padding: 4px;
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
      title: t`Step 1: Select the Farm`,
      img: 'https://avatars.githubusercontent.com/u/11427213?v=4',
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
      img: 'https://i.ytimg.com/vi/E9iP8jdtYZ0/maxresdefault.jpg',
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
      img: 'https://i.pinimg.com/736x/97/d0/2a/97d02ad83bbf9161f2a4d73ff8b95195.jpg',
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
      title: t`Step 4: Stake in a farm`,
      img: 'https://avatars.githubusercontent.com/u/11427213?v=4',
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
      img: 'https://i.ytimg.com/vi/E9iP8jdtYZ0/maxresdefault.jpg',
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
      img: 'https://avatars.githubusercontent.com/u/11427213?v=4',
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
  ]

  const v1Steps = [
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
      img: 'https://avatars.githubusercontent.com/u/11427213?v=4',
    },
    {
      title: t`Step 2: Approve the Farming contract`,
      img: 'https://i.ytimg.com/vi/E9iP8jdtYZ0/maxresdefault.jpg',
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
      img: 'https://i.ytimg.com/vi/E9iP8jdtYZ0/maxresdefault.jpg',
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
      img: 'https://i.ytimg.com/vi/E9iP8jdtYZ0/maxresdefault.jpg',
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
      img: 'https://i.ytimg.com/vi/E9iP8jdtYZ0/maxresdefault.jpg',
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
      img: 'https://i.ytimg.com/vi/E9iP8jdtYZ0/maxresdefault.jpg',
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
      img: 'https://i.ytimg.com/vi/E9iP8jdtYZ0/maxresdefault.jpg',
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
          <Flex alignItems="center" sx={{ gap: '0.5rem' }}>
            <Text fontSize="1rem" fontWeight="500">
              <Trans>Farming Guide</Trans>
            </Text>

            <Tabs>
              <Tab isActive={version === 'v2'} onClick={() => onChangeVersion('v2')} role="button">
                V2
              </Tab>
              <Tab isActive={version === 'v1'} onClick={() => onChangeVersion('v1')} role="button">
                V1
              </Tab>
            </Tabs>
          </Flex>

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
        <Right img={steps[currentStep].img} />
      </Flex>
    </Modal>
  )
}

export default FarmStepGuide
