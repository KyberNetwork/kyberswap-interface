import React, { useState } from 'react'
import { VERSION } from 'constants/v2'
import { ProMMFarmGuideWrapper, ProMMFarmGuide, ShowGuideBtn, ChevronRight, GuideWrapper, GuideItem } from './styleds'
import { Flex, Text } from 'rebass'
import { ExternalLink } from 'theme'
import { Trans } from '@lingui/macro'
import { ChevronDown, Eye } from 'react-feather'
import useTheme from 'hooks/useTheme'
import { Drop, MoneyBag } from 'components/Icons'
import Deposit from 'components/Icons/Deposit'
import AgriCulture from 'components/Icons/AgriCulture'
import { useMedia } from 'react-use'

function FarmGuide({ farmType }: { farmType: VERSION }) {
  const [show, setShow] = useState(true)
  const theme = useTheme()
  const upToMedium = useMedia('(max-width: 992px)')

  const step2Text =
    farmType === VERSION.CLASSIC ? (
      <Trans>Add liquidity to the corresponding Classic pool to receive Liquidity Provider (LP) tokens</Trans>
    ) : (
      <Trans>
        Add liquidity to the corresponding Elastic pool to receive a NFT token that represents your liquidity position
      </Trans>
    )
  const step3Text =
    farmType === VERSION.CLASSIC ? (
      <Trans>Stake your LP tokens in the farm you identified earlier</Trans>
    ) : (
      <Trans>Deposit your liquidity position (NFT token) and then stake it into the farm you identified earlier </Trans>
    )

  return (
    <ProMMFarmGuideWrapper>
      <Flex justifyContent="space-between" alignItems="center">
        <ProMMFarmGuide>
          {farmType === VERSION.ELASTIC ? (
            <>
              <Trans>Deposit your liquidity & then stake it to earn even more attractive rewards</Trans>.{' '}
              {!upToMedium && (
                <ExternalLink href="https://docs.kyberswap.com/guides/how-to-farm">
                  <Trans>Learn More ↗</Trans>
                </ExternalLink>
              )}
            </>
          ) : (
            <>
              <Trans>Deposit your liquidity to earn even more attractive rewards</Trans>.{' '}
              {!upToMedium && (
                <ExternalLink href="https://docs.kyberswap.com/classic/guides/yield-farming-guide">
                  <Trans>Learn More ↗</Trans>
                </ExternalLink>
              )}
            </>
          )}
        </ProMMFarmGuide>

        <ShowGuideBtn onClick={() => setShow(prev => !prev)} show={show}>
          <ChevronDown />
        </ShowGuideBtn>
      </Flex>

      <GuideWrapper show={show}>
        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }}>
            <Eye size={20} color={theme.primary} />
            <Flex>
              <Text color={theme.text} fontWeight="500">
                STEP 1
              </Text>
              {upToMedium && (
                <>
                  : <Trans>Identify the Elastic farm you would like to participate in</Trans>
                </>
              )}
            </Flex>
          </Flex>
          {!upToMedium && <Trans>Identify the Elastic farm you would like to participate in</Trans>}
        </GuideItem>
        <ChevronRight />

        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }}>
            <Drop size={20} />
            <Flex>
              <Text fontWeight="500" color={theme.text}>
                STEP 2
              </Text>
              {upToMedium && <>: {step2Text}</>}
            </Flex>
          </Flex>
          {!upToMedium && step2Text}
        </GuideItem>
        <ChevronRight />

        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }} color={theme.primary}>
            <Deposit width={20} height={20} />
            <Flex color={theme.subText}>
              <Text fontWeight="500" color={theme.text}>
                STEP 3
              </Text>
              {upToMedium && <>: {step3Text}</>}
            </Flex>
          </Flex>
          {!upToMedium && step3Text}
        </GuideItem>

        <ChevronRight />

        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }}>
            <AgriCulture color={theme.primary} width={20} height={20} />
            <Flex>
              <Text fontWeight="500" color={theme.text}>
                STEP 4
              </Text>

              {upToMedium && (
                <>
                  : <Trans>Harvest your farming rewards whenever you want</Trans>
                </>
              )}
            </Flex>
          </Flex>
          {!upToMedium && <Trans>Harvest your farming rewards whenever you want</Trans>}
        </GuideItem>

        <ChevronRight />
        <GuideItem>
          <Flex marginBottom="0.5rem" alignItems="center" sx={{ gap: '8px' }}>
            <MoneyBag size={20} color={theme.primary} />
            <Flex>
              <Text fontWeight="500" color={theme.text}>
                STEP 5
              </Text>
              {upToMedium && (
                <>
                  : <Trans>Claim your farming rewards! (Note: some farms may have a vesting period)</Trans>
                </>
              )}
            </Flex>
          </Flex>
          {!upToMedium && <Trans>Claim your farming rewards! (Note: some farms may have a vesting period)</Trans>}
        </GuideItem>

        {upToMedium && (
          <Flex justifyContent="flex-end">
            {farmType === VERSION.ELASTIC ? (
              <ExternalLink href="https://docs.kyberswap.com/guides/how-to-farm">
                <Trans>Learn More ↗</Trans>
              </ExternalLink>
            ) : (
              <ExternalLink href="https://docs.kyberswap.com/classic/guides/yield-farming-guide">
                <Trans>Learn More ↗</Trans>
              </ExternalLink>
            )}
          </Flex>
        )}
      </GuideWrapper>
    </ProMMFarmGuideWrapper>
  )
}

export default FarmGuide
