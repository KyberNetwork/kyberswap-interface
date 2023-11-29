import { ChainId, Price, Token, WETH } from '@kyberswap/ks-sdk-core'
import { Trans } from '@lingui/macro'
import JSBI from 'jsbi'
import { rgba } from 'polished'
import { useState } from 'react'
import { ChevronsUp, Info, Minus, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import QuickZap from 'components/ElasticZap/QuickZap'
import { FarmTag } from 'components/FarmTag'
import PriceVisualize from 'components/ProAmm/PriceVisualizeAlignCurrent'
// import PriceVisualize from 'components/ProAmm/PriceVisualize' // todo namgold
import { MouseoverTooltip } from 'components/Tooltip'
import { APP_PATHS, ELASTIC_BASE_FEE_UNIT } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import useTheme from 'hooks/useTheme'
import { ElasticPoolDetail, ElasticPosition } from 'types/pool'
import { getTickToPrice } from 'utils/getTickToPrice'
import { formatDisplayNumber, parseFraction } from 'utils/numbers'

import { TableRow, Tag } from '../../styleds'

export const Q96 = JSBI.exponentiate(JSBI.BigInt(2), JSBI.BigInt(96))
export const Q192 = JSBI.exponentiate(Q96, JSBI.BigInt(2))

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
  position,
  onShared,
}: {
  pool: ElasticPoolDetail
  position: ElasticPosition
  onShared: (id: string) => void
}) {
  const chainId = pool.chainId || ChainId.MAINNET
  const theme = useTheme()
  const [showQuickZap, setShowQuickZap] = useState(false)

  const isToken0WETH = pool.token0.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const isToken1WETH = pool.token1.address.toLowerCase() === WETH[chainId].address.toLowerCase()

  const nativeToken = NativeCurrencies[chainId]

  const token0Slug = isToken0WETH ? nativeToken.symbol : pool.token0.address
  const token0Symbol = isToken0WETH ? nativeToken.symbol : pool.token0.symbol

  const token1Slug = isToken1WETH ? nativeToken.symbol : pool.token1.address
  const token1Symbol = isToken1WETH ? nativeToken.symbol : pool.token1.symbol

  const isFarmingPool = !!pool.farmAPR
  const priceLower = getTickToPrice(pool.token0, pool.token1, Number(position.tickLower)) as Price<Token, Token>
  const priceUpper = getTickToPrice(pool.token0, pool.token1, Number(position.tickUpper)) as Price<Token, Token>
  const ticksAtLimit = useIsTickAtLimit(pool.feeTier, Number(position.tickLower), Number(position.tickUpper))

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
            <Tag backgroundColor={theme['o-green-20']} color={theme['green-400']}>
              <Info size={12} />
              &nbsp;<Trans>ID {position.id}</Trans>
            </Tag>

            <Flex alignItems="center" sx={{ gap: '4px' }}>
              {isFarmingPool && <FarmTag address={pool.address} noText padding="1px 4px" height="unset" />}
            </Flex>
          </Flex>
        </Flex>
      </Flex>
      <DataText alignItems="flex-end">
        {formatDisplayNumber(position.amountUSD, {
          style: 'currency',
          fractionDigits: 2,
          significantDigits: 7,
          fallback: '--',
        })}
      </DataText>
      <DataText alignItems="flex-end">
        pnl
        {/* todo namgold */}
        {/* {formatDisplayNumber(position., { style: 'currency', significantDigits: 7, fractionDigits: 2 })} */}
      </DataText>
      <DataText justifySelf="flex-end" width="80%">
        <PriceVisualize
          priceLower={priceLower}
          priceUpper={priceUpper}
          price={
            new Price(
              pool.token0,
              pool.token1,
              Q192,
              JSBI.multiply(JSBI.BigInt(pool.sqrtPrice), JSBI.BigInt(pool.sqrtPrice)),
            )
          }
          ticksAtLimit={ticksAtLimit}
          center
        />
      </DataText>
      <DataText alignItems="flex-end">
        {formatDisplayNumber(parseFraction(position.myPoolApr).divide(100), { style: 'percent', fractionDigits: 2 })}
      </DataText>
      <DataText alignItems="flex-end">
        {formatDisplayNumber(parseFraction(undefined).divide(100), {
          style: 'percent',
          fractionDigits: 2,
          allowDisplayZero: false,
          fallback: '--',
        })}
      </DataText>
      <ButtonWrapper>
        <MouseoverTooltip text={<Trans>Increase liquidity</Trans>} placement="top" width="fit-content">
          <ButtonEmpty
            padding="0"
            style={{
              background: rgba(theme.primary, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px',
            }}
            as={Link}
            to={`/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_INCREASE_LIQ}/${token0Slug}/${token1Slug}/${pool.feeTier}/${position.id}`}
          >
            <ChevronsUp size={16} color={theme.primary} />
          </ButtonEmpty>
        </MouseoverTooltip>
        <MouseoverTooltip text={<Trans>Remove liquidity</Trans>} placement="top" width="fit-content">
          <ButtonEmpty
            padding="0"
            style={{
              background: rgba(theme.red, 0.2),
              minWidth: '28px',
              minHeight: '28px',
              width: '28px',
              height: '28px',
            }}
            as={Link}
            to={`/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_REMOVE_POOL}/${position.id}`}
          >
            <Minus size={16} color={theme.red} />
          </ButtonEmpty>
        </MouseoverTooltip>
      </ButtonWrapper>
    </TableRow>
  )
}
