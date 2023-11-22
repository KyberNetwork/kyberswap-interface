import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import mixpanel from 'mixpanel-browser'
import { useState } from 'react'
import { Plus, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BlinkIcon } from 'assets/svg/blink.svg'
import { ReactComponent as ZapIcon } from 'assets/svg/zap.svg'
import { ButtonLight, ButtonOutlined } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import Divider from 'components/Divider'
import QuickZap from 'components/ElasticZap/QuickZap'
import { FarmTag } from 'components/FarmTag'
import { MouseoverTooltip } from 'components/Tooltip'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { NETWORKS_INFO, isEVM } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import useTheme from 'hooks/useTheme'
import { ElasticPoolDetail } from 'types/pool'
import { formatDisplayNumber } from 'utils/numbers'

import { poolTimeframeText } from '../const'
import { Tag } from '../styleds'

const Wrapper = styled.div`
  width: 100%;
  border-radius: 20px;
  padding: 16px;
  background-color: ${({ theme }) => theme['greyscale-900']};
`
export default function ProAmmPoolCardItem({
  pool,
  onShared,
  timeframe,
}: {
  pool: ElasticPoolDetail
  onShared: (id: string) => void
  timeframe: '24h' | '7d' | '30d'
}) {
  const chainId = pool.chainId || ChainId.MAINNET

  const theme = useTheme()

  const [showQuickZap, setShowQuickZap] = useState(false)

  const token0 = pool.token0
  const token1 = pool.token1

  const nativeToken = NativeCurrencies[chainId]

  const isToken0WETH = token0.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const isToken1WETH = token1.address.toLowerCase() === WETH[chainId].address.toLowerCase()

  const token0Slug = isToken0WETH ? nativeToken.symbol : token0.address
  const token0Symbol = isToken0WETH ? nativeToken.symbol : token0.symbol

  const token1Slug = isToken1WETH ? nativeToken.symbol : token1.address
  const token1Symbol = isToken1WETH ? nativeToken.symbol : token1.symbol

  const isZapAvailable = isEVM(chainId) ? NETWORKS_INFO[chainId].elastic.zap : false
  const isFarmingPool = !!pool.farmAPR

  return (
    <Wrapper key={pool.address} data-testid={pool.address}>
      <QuickZap
        poolAddress={pool.address}
        isOpen={showQuickZap}
        onDismiss={() => setShowQuickZap(false)}
        expectedChainId={chainId}
      />

      <Flex as="td" sx={{ gap: '8px' }} padding="0">
        <Flex alignItems="center">
          <Flex alignItems="end">
            <CurrencyLogo
              currency={isToken0WETH ? nativeToken : pool.token0}
              size={'36px'}
              style={{ borderRadius: '50%' }}
            />
            <CurrencyLogo
              currency={isToken1WETH ? nativeToken : pool.token1}
              size={'36px'}
              style={{ marginLeft: '-6px', borderRadius: '50%' }}
            />
            <img
              src={NETWORKS_INFO[chainId].icon}
              alt={NETWORKS_INFO[chainId].name}
              width={18}
              height={18}
              style={{
                marginLeft: '-8px',
                zIndex: 1,
              }}
            />
          </Flex>
        </Flex>
        <Flex flexDirection="column" sx={{ gap: '4px' }}>
          <Flex alignItems="center" sx={{ gap: '8px' }}>
            <Text flex={1} maxWidth="fit-content">
              <MouseoverTooltip
                text={`${token0Symbol} - ${token1Symbol}`}
                width="fit-content"
                containerStyle={{ maxWidth: '100%' }}
                placement="top"
              >
                <Text
                  fontSize={14}
                  fontWeight="500"
                  lineHeight="20px"
                  flex={1}
                  sx={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {token0Symbol} - {token1Symbol}
                </Text>
              </MouseoverTooltip>
            </Text>
            <CopyHelper toCopy={pool.address} size={12} />
            <Flex
              onClick={() => {
                onShared(pool.address)
              }}
              sx={{
                cursor: 'pointer',
              }}
              role="button"
              color={theme.subText}
            >
              <Share2 size="12px" color={theme.subText} />
            </Flex>
          </Flex>
          <Flex sx={{ gap: '4px' }}>
            <Tag backgroundColor={theme['o-green-20']} color={theme['green-400']}>
              <Trans>Elastic</Trans>
            </Tag>
            <Tag backgroundColor={theme['o-grey-20']} color={theme['o-white-white']}>
              Fee {(pool.feeTier * 100) / ELASTIC_BASE_FEE_UNIT}%
            </Tag>

            <Flex alignItems="center" sx={{ gap: '4px' }}>
              {isFarmingPool && <FarmTag address={pool.address} noText padding="1px 4px" height="unset" />}
            </Flex>
          </Flex>
        </Flex>
      </Flex>

      <Text
        width="fit-content"
        lineHeight="16px"
        fontSize="12px"
        fontWeight="500"
        color={theme.subText}
        sx={{ borderBottom: `1px dashed ${theme.border}` }}
        marginTop="16px"
      >
        <MouseoverTooltip
          width="fit-content"
          placement="right"
          text={<APRTooltipContent farmAPR={pool.farmAPR || 0} poolAPR={pool.apr} />}
        >
          <Trans>APR</Trans>
        </MouseoverTooltip>
      </Text>

      <Flex alignItems="center" sx={{ gap: '8px' }} marginTop="4px">
        <Text fontSize="28px" fontWeight="500" color={theme.apr} lineHeight="32px">
          {formatDisplayNumber(((pool.farmAPR ?? 0) + pool.apr) / 100, { style: 'percent', fractionDigits: 2 })}
        </Text>
        {isFarmingPool && <BlinkIcon />}
      </Flex>

      <Flex
        justifyContent="space-between"
        color={theme.subText}
        fontSize="12px"
        fontWeight="500"
        marginTop="1rem"
        lineHeight="16px"
      >
        <Text>
          <Trans>Volume ({poolTimeframeText[timeframe]})</Trans>
        </Text>
        <Text>
          <Trans>Fees ({poolTimeframeText[timeframe]})</Trans>
        </Text>
      </Flex>

      <Flex
        justifyContent="space-between"
        fontSize="16px"
        fontWeight="500"
        marginTop="0.25rem"
        marginBottom="1rem"
        lineHeight="24px"
      >
        <Text>
          {formatDisplayNumber(pool.volumeUSDLast, { style: 'currency', fractionDigits: 2, significantDigits: 8 })}
        </Text>
        <Text>
          {formatDisplayNumber(pool.feeUSDLast, { style: 'currency', fractionDigits: 2, significantDigits: 8 })}
        </Text>
      </Flex>

      <Divider />

      <Flex
        justifyContent="space-between"
        color={theme.subText}
        fontSize="12px"
        fontWeight="500"
        marginTop="1rem"
        lineHeight="16px"
      >
        <Text>TVL</Text>
        <Text>My Liquidity</Text>
      </Flex>

      <Flex
        justifyContent="space-between"
        fontSize="16px"
        fontWeight="500"
        marginTop="0.25rem"
        marginBottom="1rem"
        lineHeight="24px"
      >
        <Text>{formatDisplayNumber(pool.tvlUSD, { style: 'currency', fractionDigits: 2, significantDigits: 8 })}</Text>
        <Text>
          {formatDisplayNumber(pool.allPositionsUSD, {
            style: 'currency',
            fractionDigits: 2,
            significantDigits: 7,
            fallback: '--',
          })}
        </Text>
      </Flex>

      <Flex justifyContent="space-between" fontSize="14px" style={{ gap: '16px' }}>
        <ButtonLight
          as={Link}
          padding="8px 16px"
          style={{ border: 'none' }}
          to={`/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${token0Slug}/${token1Slug}/${pool.feeTier}`}
        >
          <Plus size={20} />
          <Text width="max-content" fontSize="14px" marginLeft="4px" lineHeight="20px">
            <Trans>Add Liquidity</Trans>
          </Text>
        </ButtonLight>
        <ButtonOutlined
          padding="10px"
          style={{ height: '36px' }}
          onClick={() => {
            setShowQuickZap(true)
            mixpanel.track('Zap - Click Quick Zap', {
              token0: token0?.symbol || '',
              token1: token1?.symbol || '',
              source: 'pool_page',
            })
          }}
          disabled={!isZapAvailable}
        >
          <ZapIcon color={isZapAvailable ? '#FF9901' : 'unset'} />

          <Text width="max-content" fontSize="14px" marginLeft="4px">
            <Trans>Add Liquidity</Trans>
          </Text>
        </ButtonOutlined>
      </Flex>
    </Wrapper>
  )
}
