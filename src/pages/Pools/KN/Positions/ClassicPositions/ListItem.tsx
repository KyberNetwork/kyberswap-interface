import { ChainId, Fraction, WETH } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { rgba, transparentize } from 'polished'
import React from 'react'
import { Plus, Share2 } from 'react-feather'
import { Link } from 'react-router-dom'
import { Flex, Text } from 'rebass'

import { ReactComponent as BlinkIcon } from 'assets/svg/blink.svg'
import { ReactComponent as ZapIcon } from 'assets/svg/zap.svg'
import { ButtonEmpty } from 'components/Button'
import CopyHelper from 'components/Copy'
import CurrencyLogo from 'components/CurrencyLogo'
import { QuickZapButtonWrapper } from 'components/ElasticZap/QuickZap'
import { MoneyBag } from 'components/Icons'
import Loader from 'components/Loader'
import { AMPLiquidityAndTVLContainer, ButtonWrapper, DataText, TextTVL } from 'components/PoolList/styled'
import { MouseoverTooltip } from 'components/Tooltip'
import { APRTooltipContent } from 'components/YieldPools/FarmingPoolAPRCell'
import { APP_PATHS } from 'constants/index'
import { NETWORKS_INFO } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { ClassicPoolData, ClassicPosition } from 'hooks/pool/classic/type'
import useTheme from 'hooks/useTheme'
import { IconWrapper } from 'pages/Pools/Subgraph/styleds'
import { currencyId } from 'utils/currencyId'
import { formatDisplayNumber, parseFraction } from 'utils/numbers'

import { TableRow, Tag } from '../../styleds'

const ClassicListItem = ({
  pool,
  onShared,
}: {
  pool: ClassicPoolData
  onShared: (id: string) => void
  position: ClassicPosition
}) => {
  const chainId = pool.chainId || ChainId.MAINNET

  const amp = new Fraction(pool.amp).divide(JSBI.BigInt(10000))

  const isFarmingPool = !!pool.farmAPR

  const currency0 = pool.token0
  const currency1 = pool.token1
  const volume = pool.oneDayVolumeUSD ? pool.oneDayVolumeUSD : pool.oneDayVolumeUntracked

  const fee24H = pool.oneDayFeeUSD ? pool.oneDayFeeUSD : pool.oneDayFeeUntracked

  const ampLiquidity = formatDisplayNumber(amp.multiply(parseFraction(pool.reserveUSD)), {
    style: 'currency',
    significantDigits: 7,
    fractionDigits: 2,
  })
  const totalValueLocked = formatDisplayNumber(pool.reserveUSD, {
    style: 'currency',
    significantDigits: 7,
    fractionDigits: 2,
  })

  const theme = useTheme()

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
            {isFarmingPool && <BlinkIcon />}
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

  const isToken0WETH = pool.token0.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const isToken1WETH = pool.token1.address.toLowerCase() === WETH[chainId].address.toLowerCase()
  const nativeToken = NativeCurrencies[chainId]
  // const token0Slug = isToken0WETH ? nativeToken.symbol : pool.token0.address
  const token0Symbol = isToken0WETH ? nativeToken.symbol : pool.token0.symbol
  // const token1Slug = isToken1WETH ? nativeToken.symbol : pool.token1.address
  const token1Symbol = isToken1WETH ? nativeToken.symbol : pool.token1.symbol

  return (
    <TableRow>
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
            <Tag backgroundColor={theme['o-blue-20']} color={theme['blue-500']}>
              <Trans>Classic</Trans>
            </Tag>
            <Tag backgroundColor={theme['o-grey-20']} color={theme['o-white-white']}>
              AMP {formatDisplayNumber(amp, { significantDigits: 5 })}
            </Tag>

            {isFarmingPool && (
              <MouseoverTooltip placement="top" text={t`Available for yield farming`} width="fit-content">
                <Link
                  to={`${APP_PATHS.FARMS}/${NETWORKS_INFO[chainId].route}?tab=classic&type=active&search=${pool.id}`}
                >
                  <IconWrapper
                    style={{ background: transparentize(0.7, theme.primary), height: '16px', padding: '1px 4px' }}
                  >
                    <MoneyBag size={12} color={theme.apr} />
                  </IconWrapper>
                </Link>
              </MouseoverTooltip>
            )}
          </Flex>
        </Flex>
      </Flex>

      <DataText>
        {!pool ? (
          <Loader />
        ) : (
          <AMPLiquidityAndTVLContainer>
            <Text>{ampLiquidity}</Text>
            <TextTVL>{totalValueLocked}</TextTVL>
          </AMPLiquidityAndTVLContainer>
        )}
      </DataText>
      <DataText
        alignItems="flex-end"
        style={{
          color: theme.apr,
        }}
      >
        {renderPoolAPR()}
      </DataText>
      <DataText alignItems="flex-end">
        {!pool ? <Loader /> : formatDisplayNumber(volume, { style: 'currency', significantDigits: 6 })}
      </DataText>
      <DataText alignItems="flex-end">
        {!pool ? <Loader /> : formatDisplayNumber(fee24H, { style: 'currency', significantDigits: 6 })}
      </DataText>
      <DataText alignItems="flex-end">
        {formatDisplayNumber(pool.allPositionsUSD, { style: 'currency', significantDigits: 6, fractionDigits: 2 })}
      </DataText>
      <ButtonWrapper style={{ marginRight: '-3px' }}>
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
          to={`/${NETWORKS_INFO[chainId].route}${APP_PATHS.CLASSIC_ADD_LIQ}/${currencyId(
            currency0,
            chainId,
          )}/${currencyId(currency1, chainId)}/${pool.id}`}
          onClick={(e: React.MouseEvent) => {
            e.stopPropagation()
          }}
        >
          <Plus size={16} color={theme.primary} />
        </ButtonEmpty>
        <QuickZapButtonWrapper
          size={'small'}
          color={theme.warning}
          as={Link}
          to={`/${NETWORKS_INFO[chainId].route}${APP_PATHS.CLASSIC_ADD_LIQ}/${currencyId(
            currency0,
            chainId,
          )}/${currencyId(currency1, chainId)}/${pool.id}?tab=zap`}
        >
          <ZapIcon />
        </QuickZapButtonWrapper>
      </ButtonWrapper>
    </TableRow>
  )
}
export default ClassicListItem
