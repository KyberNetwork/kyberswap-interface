import { Position } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import { rgba, saturate } from 'polished'
import React, { useCallback, useState } from 'react'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import Card, { OutlineCard } from 'components/Card'
import { AutoColumn } from 'components/Column'
import Divider from 'components/Divider'
import { Swap2 as SwapIcon } from 'components/Icons'
import InfoHelper from 'components/InfoHelper'
import { Chart } from 'components/LiquidityChartRangeInput/Chart'
import { RowBetween, RowFixed } from 'components/Row'
import { useColor } from 'hooks/useColor'
import useTheme from 'hooks/useTheme'
import { Bound } from 'state/mint/proamm/actions'
import { formatTickPrice } from 'utils/formatTickPrice'
import { unwrappedToken } from 'utils/wrappedCurrency'

const PriceRangeCard = styled(Card)`
  background-color: ${({ theme }) => rgba(theme.buttonGray, 0.6)};
`

const ChartWrapper = styled.div`
  position: relative;

  justify-content: center;
  align-content: center;
`

const props = {
  data: {
    series: [
      { activeLiquidity: 348413708506943940, price0: 0.01530171 },
      { activeLiquidity: 348413708506943940, price0: 0.01657607 },
      { activeLiquidity: 348413708506943940, price0: 0.02282701 },
      { activeLiquidity: 348413708506943940, price0: 0.02732864 },
      { activeLiquidity: 31479144744098963000, price0: 0.0320702 },
      { activeLiquidity: 281702965626325430000, price0: 0.03271803 },
      { activeLiquidity: 625658953498950900000, price0: 0.03615883 },
      { activeLiquidity: 625658953498950900000, price0: 0.04076873 },
      { activeLiquidity: 625911807836726600000, price0: 0.04243244 },
      { activeLiquidity: 625911807836726600000, price0: 0.04784216 },
      { activeLiquidity: 625911807836726600000, price0: 0.04880859 },
      { activeLiquidity: 625911807836726600000, price0: 0.05182659 },
      { activeLiquidity: 625911807836726600000, price0: 0.0528735 },
      { activeLiquidity: 625911807836726600000, price0: 0.05727695 },
      { activeLiquidity: 625911807836726600000, price0: 0.06721459 },
      { activeLiquidity: 625911807836726600000, price0: 0.07731464 },
      { activeLiquidity: 2.1827311990066685e21, price0: 0.08544546 },
      { activeLiquidity: 2.1827311990066685e21, price0: 0.08717149 },
      { activeLiquidity: 2.1827311990066685e21, price0: 0.08893238 },
      { activeLiquidity: 2.1827311990066685e21, price0: 0.09072884 },
      { activeLiquidity: 2.4578612092239825e21, price0: 0.09256159 },
      { activeLiquidity: 3.92963182556581e21, price0: 0.09443136 },
      { activeLiquidity: 3.933898679484833e21, price0: 0.09633891 },
      { activeLiquidity: 3.933898679484833e21, price0: 0.09828499 },
      { activeLiquidity: 3.967827042778321e21, price0: 0.10027037 },
      { activeLiquidity: 3.967827042778321e21, price0: 0.10229587 },
      { activeLiquidity: 3.967827042778321e21, price0: 0.10436228 },
      { activeLiquidity: 3.967827042778321e21, price0: 0.10647043 },
      { activeLiquidity: 3.967827042778321e21, price0: 0.10862116 },
      { activeLiquidity: 1.2144475312013672e22, price0: 0.11081535 },
      { activeLiquidity: 1.2144475312013672e22, price0: 0.11305385 },
      { activeLiquidity: 2.4062416406922167e23, price0: 0.11533758 },
      { activeLiquidity: 2.4680547071101456e23, price0: 0.11766743 },
      { activeLiquidity: 2.5023016636670577e23, price0: 0.12004435 },
      { activeLiquidity: 2.5023016636670577e23, price0: 0.12246929 },
      { activeLiquidity: 2.5023016636670577e23, price0: 0.1249432 },
      { activeLiquidity: 2.502399794710146e23, price0: 0.1274671 },
      { activeLiquidity: 2.502399794710146e23, price0: 0.13266886 },
      { activeLiquidity: 2.502399794710146e23, price0: 0.13534882 },
      { activeLiquidity: 2.502399794710146e23, price0: 0.13808291 },
      { activeLiquidity: 2.5096387768111592e23, price0: 0.14087222 },
      { activeLiquidity: 2.5096387768111592e23, price0: 0.14371789 },
      { activeLiquidity: 2.5096387768111592e23, price0: 0.14662104 },
      { activeLiquidity: 2.5096387768111592e23, price0: 0.14958283 },
      { activeLiquidity: 2.5096387768111592e23, price0: 0.15260445 },
      { activeLiquidity: 2.5096387768111592e23, price0: 0.15568711 },
      { activeLiquidity: 2.5811559077350407e23, price0: 0.15883204 },
      { activeLiquidity: 2.6385555186696024e23, price0: 0.16204049 },
      { activeLiquidity: 2.7413686480792357e23, price0: 0.16531376 },
      { activeLiquidity: 2.7491524422675473e23, price0: 0.16865316 },
      { activeLiquidity: 2.752176369181678e23, price0: 0.17206 },
      { activeLiquidity: 2.752959901720177e23, price0: 0.17553567 },
      { activeLiquidity: 2.784377038948833e23, price0: 0.17908155 },
      { activeLiquidity: 2.787780503554078e23, price0: 0.18269905 },
      { activeLiquidity: 2.7877803821944697e23, price0: 0.18638963 },
      { activeLiquidity: 2.7799960339284898e23, price0: 0.19015476 },
      { activeLiquidity: 2.7799960339284898e23, price0: 0.19399595 },
      { activeLiquidity: 2.7799960339284898e23, price0: 0.19791473 },
      { activeLiquidity: 2.6457657672902002e23, price0: 0.20191267 },
      { activeLiquidity: 2.774308583136482e23, price0: 0.20599137 },
      { activeLiquidity: 2.774308583136482e23, price0: 0.21015246 },
      { activeLiquidity: 2.7745966794592872e23, price0: 0.21439761 },
      { activeLiquidity: 2.7030795485354054e23, price0: 0.21872851 },
      { activeLiquidity: 2.6998556042573054e23, price0: 0.22314689 },
      { activeLiquidity: 2.816677469846578e23, price0: 0.22765453 },
      { activeLiquidity: 2.8161095245381846e23, price0: 0.23225323 },
      { activeLiquidity: 2.7587099136036228e23, price0: 0.23694482 },
      { activeLiquidity: 2.7642342020154982e23, price0: 0.24173118 },
      { activeLiquidity: 2.760794642136772e23, price0: 0.24661423 },
      { activeLiquidity: 2.760794642136772e23, price0: 0.25159591 },
      { activeLiquidity: 2.6330188188591673e23, price0: 0.25667823 },
      { activeLiquidity: 2.633000264201716e23, price0: 0.26186321 },
      { activeLiquidity: 2.633000264201716e23, price0: 0.26715293 },
      { activeLiquidity: 2.6325589052774174e23, price0: 0.27254951 },
      { activeLiquidity: 2.6262253347503597e23, price0: 0.27805509 },
      { activeLiquidity: 2.6039544603684928e23, price0: 0.2836719 },
      { activeLiquidity: 2.6039544603684928e23, price0: 0.28940216 },
      { activeLiquidity: 2.6039544603684928e23, price0: 0.29524818 },
      { activeLiquidity: 2.5102595567209863e23, price0: 0.30121228 },
      { activeLiquidity: 2.5102595567209863e23, price0: 0.31350436 },
      { activeLiquidity: 2.4946913628092866e23, price0: 0.31983725 },
      { activeLiquidity: 2.4936362739178043e23, price0: 0.33288939 },
      { activeLiquidity: 3.158590974185536e22, price0: 0.33961386 },
      { activeLiquidity: 3.158590974185536e22, price0: 0.34647417 },
      { activeLiquidity: 2.9163219986510135e22, price0: 0.35347306 },
      { activeLiquidity: 2.9163219986510135e22, price0: 0.36061333 },
      { activeLiquidity: 2.9163219986510135e22, price0: 0.36789783 },
      { activeLiquidity: 2.7416225166908505e22, price0: 0.37532949 },
      { activeLiquidity: 1.6711842671451708e22, price0: 0.38291126 },
      { activeLiquidity: 1.6711842671451708e22, price0: 0.40658795 },
      { activeLiquidity: 1.671625773998899e22, price0: 0.41480116 },
      { activeLiquidity: 1.671625773998899e22, price0: 0.43172865 },
      { activeLiquidity: 1.6716099078693702e22, price0: 0.44044971 },
      { activeLiquidity: 1.0534792436900805e22, price0: 0.4676842 },
      { activeLiquidity: 1.3513747850737098e21, price0: 0.47713157 },
      { activeLiquidity: 1.3513747850737098e21, price0: 0.49660268 },
      { activeLiquidity: 1.3076333174713837e21, price0: 0.50663422 },
      { activeLiquidity: 1.3076333174713837e21, price0: 0.51686839 },
      { activeLiquidity: 1.3076333174713837e21, price0: 0.5273093 },
      { activeLiquidity: 1.3076333174713837e21, price0: 0.53796111 },
      { activeLiquidity: 1.3076333174713837e21, price0: 0.5488281 },
      { activeLiquidity: 1.3076333174713837e21, price0: 0.5599146 },
      { activeLiquidity: 1.3076333174713837e21, price0: 0.60654582 },
      { activeLiquidity: 583735107370072300000, price0: 0.64405059 },
      { activeLiquidity: 583735107370072300000, price0: 0.65706062 },
      { activeLiquidity: 583735107370072300000, price0: 0.74082933 },
      { activeLiquidity: 583735107370072300000, price0: 0.7866373 },
      { activeLiquidity: 583735107370072300000, price0: 0.81873894 },
      { activeLiquidity: 250223820882226480000, price0: 0.86936432 },
      { activeLiquidity: 250223820882226480000, price0: 1.19720659 },
    ],
    current: 0.18655593,
  },
  dimensions: { width: 400, height: 200 },
  margins: { top: 10, right: 2, bottom: 20, left: 0 },
  styles: { area: { selection: '#31cb9e' }, brush: { handle: { west: '#04afa3', east: '#2856e0' } } },
  interactive: true,
  brushDomain: [0.0925616, 0.375329],
  zoomLevels: { initialMin: 0.5, initialMax: 2, min: 0.00001, max: 20 },
  ticksAtLimit: { LOWER: false, UPPER: false },
}

export default function ProAmmPriceRange({
  position,
  ticksAtLimit,
  layout = 0,
}: {
  position: Position
  ticksAtLimit: { [bound: string]: boolean | undefined }
  layout?: number
}) {
  const theme = useTheme()

  const currency0 = unwrappedToken(position.pool.token0)
  const currency1 = unwrappedToken(position.pool.token1)

  const tokenAColor = useColor(currency0?.wrapped)
  const tokenBColor = useColor(currency1?.wrapped)

  //   track which currency should be base
  const [baseCurrency, setBaseCurrency] = useState(currency0)

  const sorted = baseCurrency.symbol === currency0.symbol
  const quoteCurrency = sorted ? currency1 : currency0
  const price = sorted ? position.pool.priceOf(position.pool.token0) : position.pool.priceOf(position.pool.token1)

  const priceLower = sorted ? position.token0PriceLower : position.token0PriceUpper.invert()
  const priceUpper = sorted ? position.token0PriceUpper : position.token0PriceLower.invert()
  const handleRateChange = useCallback(() => {
    setBaseCurrency(quoteCurrency)
  }, [quoteCurrency])
  return (
    <OutlineCard marginTop="1rem" padding="1rem">
      <AutoColumn gap="13px">
        {layout === 0 && (
          <>
            {' '}
            <Text fontSize="16px" fontWeight="500">
              Pool Information
            </Text>
            <Divider />
          </>
        )}

        <RowBetween>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>{layout === 0 ? 'CURRENT PRICE' : 'Current Price'}</Trans>
          </Text>
          <RowFixed>
            <Text fontSize={layout === 0 ? '14px' : '12px'} style={{ textAlign: 'right' }}>{`${price.toSignificant(
              10,
            )} ${quoteCurrency.symbol} per ${baseCurrency.symbol}`}</Text>
            <span onClick={handleRateChange} style={{ marginLeft: '2px', cursor: 'pointer' }}>
              <SwapIcon size={layout === 0 ? 16 : 14} />
            </span>
          </RowFixed>
        </RowBetween>
        <Divider />

        <ChartWrapper>
          <Chart
            data={{ series: props.data.series, current: props.data.current }}
            dimensions={{ width: 400, height: 200 }}
            margins={{ top: 10, right: 2, bottom: 20, left: 0 }}
            styles={{
              area: {
                selection: theme.blue1,
              },
              brush: {
                handle: {
                  west: saturate(0.1, tokenAColor) ?? theme.red1,
                  east: saturate(0.1, tokenBColor) ?? theme.blue1,
                },
              },
            }}
            interactive={props.interactive}
            brushLabels={() => ''}
            brushDomain={props.brushDomain as [number, number]}
            onBrushDomainChange={() => {
              // empty
            }}
            zoomLevels={{
              initialMin: 0.999,
              initialMax: 1.001,
              min: 0.00001,
              max: 1.5,
            }}
            ticksAtLimit={props.ticksAtLimit}
          />
        </ChartWrapper>

        <Divider />
        <Flex>
          <Text fontSize={12} fontWeight={500} color={theme.subText}>
            <Trans>{layout === 0 ? 'SELECTED PRICE RANGE' : 'Selected Price Range'}</Trans>
          </Text>
          <InfoHelper
            text={t`Represents the range where all your liquidity is concentrated. When market price of your token pair is no longer between your selected price range, your liquidity becomes inactive and you stop earning fees`}
            placement={'right'}
            size={12}
          ></InfoHelper>
        </Flex>
        <RowBetween style={{ gap: '12px' }}>
          <PriceRangeCard width="48%" padding="12px 8px">
            <AutoColumn gap="10px" justify="center">
              <Flex>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>MIN PRICE</Trans>
                </Text>
                <InfoHelper
                  text={t`Your position will be 100% composed of ${baseCurrency?.symbol} at this price`}
                  placement={'right'}
                  size={12}
                ></InfoHelper>
              </Flex>
              <Text textAlign="center" fontWeight="500" fontSize="20px">{`${formatTickPrice(
                priceLower,
                ticksAtLimit,
                Bound.LOWER,
              )}`}</Text>
              <Text textAlign="center" fontSize="12px" fontWeight="500" color={theme.subText}>
                <Trans>
                  {quoteCurrency.symbol} per {baseCurrency.symbol}
                </Trans>
              </Text>
            </AutoColumn>
          </PriceRangeCard>
          <PriceRangeCard width="48%" padding="12px 8px">
            <AutoColumn gap="10px" justify="center">
              <Flex>
                <Text fontSize="12px" fontWeight={500} color={theme.subText}>
                  <Trans>MAX PRICE</Trans>
                </Text>
                <InfoHelper
                  text={t`Your position will be 100% composed of ${quoteCurrency?.symbol} at this price`}
                  placement={'right'}
                  size={12}
                ></InfoHelper>
              </Flex>
              <Text fontSize="20px" textAlign="center" fontWeight="500">{`${formatTickPrice(
                priceUpper,
                ticksAtLimit,
                Bound.UPPER,
              )}`}</Text>
              <Text textAlign="center" fontSize="12px" fontWeight="500" color={theme.subText}>
                <Trans>
                  {quoteCurrency.symbol} per {baseCurrency.symbol}
                </Trans>
              </Text>
            </AutoColumn>
          </PriceRangeCard>
        </RowBetween>
      </AutoColumn>
    </OutlineCard>
  )
}
