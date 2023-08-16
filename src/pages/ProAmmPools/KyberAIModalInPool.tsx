import { Currency } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useState } from 'react'
import { Repeat, X } from 'react-feather'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight, ButtonPrimary } from 'components/Button'
import CurrencyLogo from 'components/CurrencyLogo'
import DropdownIcon from 'components/Icons/DropdownIcon'
import Icon from 'components/Icons/Icon'
import Modal from 'components/Modal'
import Row, { RowBetween, RowFit } from 'components/Row'
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS } from 'constants/index'
import { useActiveWeb3React } from 'hooks'
import { MIXPANEL_TYPE, useMixpanelKyberAI } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import KyberScoreMeter from 'pages/TrueSightV2/components/KyberScoreMeter'
import SimpleTooltip from 'pages/TrueSightV2/components/SimpleTooltip'
import { SUPPORTED_NETWORK_KYBERAI } from 'pages/TrueSightV2/constants/index'
import { useTokenDetailQuery } from 'pages/TrueSightV2/hooks/useKyberAIData'
import { calculateValueToColor, formatTokenPrice, navigateToSwapPage } from 'pages/TrueSightV2/utils'
import { useIsWhiteListKyberAI } from 'state/user/hooks'

const Wrapper = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 20px;
  background-color: ${({ theme }) => theme.tableHeader};
`

const TokenTab = styled(RowFit)<{ active?: boolean }>`
  padding: 8px 12px;
  gap: 4px;
  border: 1px solid transparent;
  cursor: pointer;
  border-radius: 20px;
  font-size: 14px;
  line-height: 18px;
  :hover {
    filter: brightness(0.9);
  }
  :active {
    filter: brightness(1.2);
  }

  ${({ active, theme }) =>
    active
      ? css`
          background-color: ${theme.primary + '30'};
          color: ${theme.primary};
        `
      : css`
          border-color: ${theme.border};
          color: ${theme.subText};
        `}
`

const ButtonX = styled.div`
  cursor: pointer;
  color: ${({ theme }) => theme.subText};
  :hover {
    filter: brightness(0.9);
  }
  :active {
    filter: brightness(1.2);
  }
`

const PriceTag = styled(RowFit)<{ down?: boolean }>`
  padding: 4px 6px;
  border-radius: 12px;
  white-space: nowrap;
  font-size: 12px;
  line-height: 16px;
  ${({ down, theme }) =>
    down
      ? css`
          color: ${theme.red};
          background-color: ${theme.red + '30'};
        `
      : css`
          color: ${theme.primary};
          background-color: ${theme.primary + '30'};
        `}
`

const enum TokenTabType {
  First,
  Second,
}

const KyberAIModalInPool = ({ currency0, currency1 }: { currency0?: Currency; currency1?: Currency }) => {
  const theme = useTheme()
  const { chainId } = useActiveWeb3React()
  const mixpanelHandler = useMixpanelKyberAI()
  const { isWhiteList } = useIsWhiteListKyberAI()
  const [tab, setTab] = useState<TokenTabType>(TokenTabType.First)
  const [openTruesightModal, setOpenTruesightModal] = useState(false)

  const { data: token0Overview } = useTokenDetailQuery(
    { address: currency0?.wrapped?.address, chain: SUPPORTED_NETWORK_KYBERAI[chainId] },
    { skip: !currency0?.wrapped?.address && !isWhiteList, refetchOnMountOrArgChange: true },
  )
  const { data: token1Overview } = useTokenDetailQuery(
    { address: currency1?.wrapped?.address, chain: SUPPORTED_NETWORK_KYBERAI[chainId] },
    { skip: !currency1?.wrapped?.address && !isWhiteList, refetchOnMountOrArgChange: true },
  )

  const token = tab === TokenTabType.First ? token0Overview || token1Overview : token1Overview

  if (!isWhiteList || !token) return null

  const kbsColor = calculateValueToColor(token.kyberScore.score || 0, theme)
  return (
    <>
      <SimpleTooltip text={t`Explore pool tokens in KyberAI`} hideOnMobile>
        <RowFit
          gap="4px"
          style={{ cursor: 'pointer' }}
          onClick={() => {
            mixpanelHandler(MIXPANEL_TYPE.KYBERAI_POOL_INSIGHT_CLICK, {
              token_1: currency0?.wrapped?.symbol?.toUpperCase(),
              token_2: currency1?.wrapped?.symbol?.toUpperCase(),
            })
            setOpenTruesightModal(true)
          }}
        >
          <Icon id="truesight-v2" size={14} />
          <Trans>KyberAI</Trans>
        </RowFit>
      </SimpleTooltip>
      <Modal isOpen={openTruesightModal} onDismiss={() => setOpenTruesightModal(false)}>
        <Wrapper>
          <RowBetween marginBottom="20px">
            <RowFit gap="8px">
              {token0Overview && (
                <TokenTab active={tab === TokenTabType.First} onClick={() => setTab(TokenTabType.First)}>
                  <CurrencyLogo currency={currency0} size="16px" />
                  {currency0?.symbol}
                </TokenTab>
              )}
              {token1Overview && (
                <TokenTab active={tab === TokenTabType.Second} onClick={() => setTab(TokenTabType.Second)}>
                  <CurrencyLogo currency={currency1} size="16px" />
                  {currency1?.symbol}
                </TokenTab>
              )}
            </RowFit>
            <ButtonX onClick={() => setOpenTruesightModal(false)}>
              <X />
            </ButtonX>
          </RowBetween>
          <RowBetween marginBottom="20px">
            <RowFit gap="4px">
              <Text fontSize="24px" lineHeight="28px">
                ${formatTokenPrice(token.price, 6)}
              </Text>
              <PriceTag down>
                <DropdownIcon size={16} /> 23.32%
              </PriceTag>
            </RowFit>
            <RowFit>
              <ButtonLight
                height="24px"
                onClick={() =>
                  navigateToSwapPage({ address: token.address, chain: SUPPORTED_NETWORK_KYBERAI[chainId] })
                }
              >
                <RowFit gap="4px">
                  <Repeat size={14} />
                  <Trans>Swap</Trans>
                </RowFit>
              </ButtonLight>
            </RowFit>
          </RowBetween>
          <Row marginBottom="16px">
            <MouseoverTooltip
              text={t`KyberScore algorithm measures the current trend of a token by taking into account multiple on-chain and off-chain indicators. The score ranges from 0 to 100. Higher the score, more bullish the token`}
              placement="top"
              width="350px"
            >
              <Text fontSize="14px" lineHeight="20px">
                KyberScore
              </Text>
            </MouseoverTooltip>
          </Row>
          <Row justify="center" marginBottom="12px">
            <KyberScoreMeter key={tab} value={token.kyberScore.score || 0} />
          </Row>
          <Row justify="center" marginBottom="16px">
            <Text fontSize="24px" lineHeight="28px" fontWeight={500} color={kbsColor}>
              {token.kyberScore.label}
            </Text>
          </Row>
          <Row justify="center" marginBottom="24px">
            {token.kyberScore.label ? (
              <Text fontSize="14px" lineHeight="20px" color={theme.text} textAlign="center" width="80%">
                {token.symbol} seems to be a{' '}
                <span style={{ color: kbsColor, fontWeight: 500 }}>{token.kyberScore.label}</span> with a KyberScore of{' '}
                <span style={{ color: kbsColor }}>{token.kyberScore.score?.toFixed(1)}</span> / 100
              </Text>
            ) : (
              <Text fontSize={24} color={theme.subText}>
                <Trans>Not Available</Trans>
              </Text>
            )}
          </Row>
          <Row justify="center" marginBottom="12px">
            <Text fontSize="12px" lineHeight="16px" color={theme.subText}>
              <Trans>Want to know more? Explore KNC in KyberAI!</Trans>
            </Text>
          </Row>
          <ButtonPrimary
            height="36px"
            onClick={() => {
              mixpanelHandler(MIXPANEL_TYPE.KYBERAI_POOL_EXPLORE_TOKEN_IN_POPUP_INSIGHT, {
                token_name: token.symbol?.toUpperCase(),
              })
              window.open(
                APP_PATHS.KYBERAI_EXPLORE + '/' + SUPPORTED_NETWORK_KYBERAI[chainId] + '/' + token.address,
                '_blank',
              )
            }}
          >
            Explore {tab === TokenTabType.First ? currency0?.symbol : currency1?.symbol}
          </ButtonPrimary>
        </Wrapper>
      </Modal>
    </>
  )
}

export default React.memo(KyberAIModalInPool)
