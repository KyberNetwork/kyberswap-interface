import { ChainId, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import mixpanel from 'mixpanel-browser'
import { rgba } from 'polished'
import { useState } from 'react'
import { Plus, Share2 } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as BlinkIcon } from 'assets/svg/blink.svg'
import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import QuickZap, { QuickZapButton } from 'components/ElasticZap/QuickZap'
import { FarmTag } from 'components/FarmTag'
import { MouseoverTooltip } from 'components/Tooltip'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import useMixpanel, { MIXPANEL_TYPE } from 'hooks/useMixpanel'
import useTheme from 'hooks/useTheme'
import { ElasticPoolDetail } from 'types/pool'
import { formatDisplayNumber } from 'utils/numbers'

import { TableRow, Tag } from '../styleds'

const DataText = styled(Flex)`
  color: ${({ theme }) => theme.text};
  flex-direction: column;
  justify-content: center;
`

const ButtonWrapper = styled(Flex)`
  justify-content: flex-end;
  gap: 4px;
  align-items: center;
`

export default function ProAmmPoolListItem({
  pool,
  onShared,
}: {
  pool: ElasticPoolDetail
  onShared: (id: string) => void
}) {
  const chainId = pool.chainId || ChainId.MAINNET
  const theme = useTheme()
  const navigate = useNavigate()
  const [showQuickZap, setShowQuickZap] = useState(false)

  const isToken0WETH = pool.token0.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const isToken1WETH = pool.token1.address.toLowerCase() === WETH[chainId].address.toLowerCase()

  const nativeToken = NativeCurrencies[chainId]

  const token0Slug = isToken0WETH ? nativeToken.symbol : pool.token0.address
  const token0Symbol = isToken0WETH ? nativeToken.symbol : pool.token0.symbol

  const token1Slug = isToken1WETH ? nativeToken.symbol : pool.token1.address
  const token1Symbol = isToken1WETH ? nativeToken.symbol : pool.token1.symbol

  const { mixpanelHandler } = useMixpanel()

  const isFarmingPool = !!pool.farmAPR

  const renderPoolAPR = () => {
    if (isFarmingPool) {
      return (
        <MouseoverTooltip
          width="fit-content"
          placement="right"
          text={<APRTooltipContent farmAPR={pool.farmAPR ?? 0} poolAPR={pool.apr} />}
        >
          <Flex
            alignItems="center"
            sx={{
              gap: '4px',
              borderBottom: `1px dashed ${theme.border}`,
            }}
          >
            <Text as="span">
              {formatDisplayNumber(((pool.farmAPR ?? 0) + pool.apr) / 100, { style: 'percent', fractionDigits: 2 })}
            </Text>
            <BlinkIcon />
          </Flex>
        </MouseoverTooltip>
      )
    }

    return (
      <Flex alignItems="center" paddingRight="16px">
        {formatDisplayNumber(pool.apr / 100, { style: 'percent', fractionDigits: 2 })}
      </Flex>
    )
  }

  return (
    <TableRow>
      <QuickZap
        poolAddress={pool.address}
        isOpen={showQuickZap}
        onDismiss={() => setShowQuickZap(false)}
        expectedChainId={chainId}
      />
      <Flex as="td" sx={{ gap: '8px' }}>
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
      <DataText alignItems="flex-end">
        {formatDisplayNumber(pool.tvlUSD, { style: 'currency', significantDigits: 7, fractionDigits: 2 })}
      </DataText>
      <DataText alignItems="flex-end" color={theme.apr}>
        {renderPoolAPR()}
      </DataText>
      <DataText alignItems="flex-end">
        {formatDisplayNumber(pool.volumeUSDLast, { style: 'currency', fractionDigits: 2 })}
      </DataText>
      <DataText alignItems="flex-end">
        {formatDisplayNumber(pool.volumeUSDLast * (pool.feeTier / ELASTIC_BASE_FEE_UNIT), {
          style: 'currency',
          fractionDigits: 2,
        })}
      </DataText>
      <DataText alignItems="flex-end">
        {formatDisplayNumber(pool.allPositionsUSD, {
          style: 'currency',
          fractionDigits: 2,
          significantDigits: 7,
          fallback: '--',
        })}
      </DataText>
      <ButtonWrapper>
        <MouseoverTooltip text={<Trans> Add liquidity </Trans>} placement="top" width="fit-content">
          <ButtonEmpty
            padding="0"
            style={{
              background: rgba(theme.primary, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px',
            }}
            onClick={(e: React.MouseEvent) => {
              e.stopPropagation()

              const url = `/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${token0Slug}/${token1Slug}/${pool.feeTier}`
              mixpanelHandler(MIXPANEL_TYPE.ELASTIC_ADD_LIQUIDITY_IN_LIST_INITIATED, {
                token_1: token0Symbol,
                token_2: token1Symbol,
                fee_tier: pool.feeTier / ELASTIC_BASE_FEE_UNIT,
              })
              navigate(url)
            }}
          >
            <Plus size={16} color={theme.primary} />
          </ButtonEmpty>
        </MouseoverTooltip>
        <QuickZapButton
          onClick={() => {
            mixpanel.track('Zap - Click Quick Zap', {
              token0: pool.token0?.symbol || '',
              token1: pool.token1?.symbol || '',
              source: 'pool_page',
            })
            setShowQuickZap(true)
          }}
          size="small"
          customChainId={chainId}
        />
      </ButtonWrapper>
    </TableRow>
  )
}
