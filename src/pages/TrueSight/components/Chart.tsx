import React, { useState } from 'react'
import { Flex } from 'rebass'
import { TrueSightChartCategory, TrueSightTimeframe } from 'pages/TrueSight/index'
import { Trans } from '@lingui/macro'
import LineChart from 'components/LiveChart/LineChart'
import { LiveDataTimeframeEnum } from 'hooks/useLiveChartData'
import styled from 'styled-components'
import { rgba } from 'polished'
import useTheme from 'hooks/useTheme'
import { FormattedCoinGeckoChartData } from 'pages/TrueSight/hooks/useGetCoinGeckoChartData'
import { formattedNum } from 'utils'
import LocalLoader from 'components/LocalLoader'

const Chart = ({
  chartData: rawChartData,
  isLoading,
  chartCategory,
  setChartCategory,
  chartTimeframe,
  setChartTimeframe,
}: {
  chartData: FormattedCoinGeckoChartData
  isLoading: boolean
  chartCategory: TrueSightChartCategory
  setChartCategory: React.Dispatch<React.SetStateAction<TrueSightChartCategory>>
  chartTimeframe: TrueSightTimeframe
  setChartTimeframe: React.Dispatch<React.SetStateAction<TrueSightTimeframe>>
}) => {
  const theme = useTheme()
  const [hoverValue, setHoverValue] = useState<number | null>(null)
  const chartData =
    chartCategory === TrueSightChartCategory.TRADING_VOLUME ? rawChartData.totalVolumes : rawChartData.prices
  // const chartData = JSON.parse(
  //   `[{"time":1646126341000,"value":"0.6685864059659684715597537021396178"},{"time":1646127241000,"value":"0.6685864059659684715597537021396178"},{"time":1646128141000,"value":"0.6685864059659684715597537021396178"},{"time":1646129041000,"value":"0.6710443568098693735477274201399854"},{"time":1646129941000,"value":"0.6710443568098693735477274201399854"},{"time":1646130841000,"value":"0.6613350636790928273900365631865666"},{"time":1646131741000,"value":"0.6657188797572845754164707392819086"},{"time":1646132641000,"value":"0.6657188797572845754164707392819086"},{"time":1646133541000,"value":"0.6657188797572845754164707392819086"},{"time":1646134441000,"value":"0.6657605068597870382215147099488075"},{"time":1646135341000,"value":"0.6666183734033371586408288438993215"},{"time":1646136241000,"value":"0.6495518092444117587400896836396147"},{"time":1646137141000,"value":"0.6500055728572687641889400676391977"},{"time":1646138041000,"value":"0.6664034744803519918184661191624448"},{"time":1646138941000,"value":"0.6734390158090842353983262405716289"},{"time":1646139841000,"value":"0.6775774990681778427846668030493458"},{"time":1646140741000,"value":"0.6799568219382301643146508597312139"},{"time":1646141641000,"value":"0.682269981891427552145489672094245"},{"time":1646142541000,"value":"0.684614035236502233201484372631805"},{"time":1646143441000,"value":"0.684614035236502233201484372631805"},{"time":1646144341000,"value":"0.684614035236502233201484372631805"},{"time":1646145241000,"value":"0.68603232195856579348432938449102"},{"time":1646146141000,"value":"0.6634874089346620675135397321197705"},{"time":1646147041000,"value":"0.6219026285626242738089003967971791"},{"time":1646147941000,"value":"0.632697427252418044433234442502749"},{"time":1646148841000,"value":"0.632974604913102621884797872210761"},{"time":1646149741000,"value":"0.6334030737424421822936252486717351"},{"time":1646150641000,"value":"0.644651488790589564141687745041363"},{"time":1646151541000,"value":"0.6529021691412937818903477223802971"},{"time":1646152441000,"value":"0.6570598318282063076847845744738172"},{"time":1646153341000,"value":"0.6570245379705017105587447897063691"},{"time":1646154241000,"value":"0.666734366152716235562355732181541"},{"time":1646155141000,"value":"0.666734366152716235562355732181541"},{"time":1646156041000,"value":"0.6637491221940185026801549164860379"},{"time":1646156941000,"value":"0.6604402504264436687302193929017554"},{"time":1646157841000,"value":"0.6647268814734330590502550870348202"},{"time":1646158741000,"value":"0.6646012523593261738810178344824351"},{"time":1646159641000,"value":"0.6646012523593261738810178344824351"},{"time":1646160541000,"value":"0.6610529268270569311013513956831129"},{"time":1646161441000,"value":"0.657001262466551438191129217726318"},{"time":1646162341000,"value":"0.6570700832046211193984256178158919"},{"time":1646163241000,"value":"0.6565405157085626402543389677371328"},{"time":1646164141000,"value":"0.6565405157085626402543389677371328"},{"time":1646165041000,"value":"0.6565405157085626402543389677371328"},{"time":1646165941000,"value":"0.6565405157085626402543389677371328"},{"time":1646166841000,"value":"0.6564798586197893477541006867724653"},{"time":1646167741000,"value":"0.6564798586197893477541006867724653"},{"time":1646168641000,"value":"0.6564798586197893477541006867724653"},{"time":1646169541000,"value":"0.6567712118121675330840835719939483"},{"time":1646170441000,"value":"0.655529030077128505296217721646871"},{"time":1646171341000,"value":"0.6543216761594409512239185438514789"},{"time":1646172241000,"value":"0.6543216761594409512239185438514789"},{"time":1646173141000,"value":"0.6543216761594409512239185438514789"},{"time":1646174041000,"value":"0.6543216761594409512239185438514789"},{"time":1646174941000,"value":"0.6543216761594409512239185438514789"},{"time":1646175841000,"value":"0.6543216761594409512239185438514789"},{"time":1646176741000,"value":"0.6543216761594409512239185438514789"},{"time":1646177641000,"value":"0.6543216761594409512239185438514789"},{"time":1646178541000,"value":"0.6534585180833254870727616827002481"},{"time":1646179441000,"value":"0.6536773522817268306399570725874136"},{"time":1646180341000,"value":"0.6537459995324965514552137909961329"},{"time":1646181241000,"value":"0.6538037363642699760812418583669339"},{"time":1646182141000,"value":"0.6538037363642699760812418583669339"},{"time":1646183041000,"value":"0.6299270642590960305841133291875527"},{"time":1646183941000,"value":"0.6299943635252954043765467356088079"},{"time":1646184841000,"value":"0.6300798843179315079781247217243646"},{"time":1646185741000,"value":"0.6341475246833051099290480741944514"},{"time":1646186641000,"value":"0.6381792810853185408626123398443603"},{"time":1646187541000,"value":"0.6463847588282224831066709308064275"},{"time":1646188441000,"value":"0.6505989235273663791548775301214663"},{"time":1646189341000,"value":"0.6507357622173833839341243910449161"},{"time":1646190241000,"value":"0.6511771662846701354180147716233766"},{"time":1646191141000,"value":"0.6511771662846701354180147716233766"},{"time":1646192041000,"value":"0.6511771662846701354180147716233766"},{"time":1646192941000,"value":"0.6512456333891739337250840000043031"},{"time":1646193841000,"value":"0.6508154708449928028497424858105332"},{"time":1646194741000,"value":"0.6508154708449928028497424858105332"},{"time":1646195641000,"value":"0.6448641180170935375849957192919101"},{"time":1646196541000,"value":"0.6448641180170935375849957192919101"},{"time":1646197441000,"value":"0.6453386072039741307081615331906024"},{"time":1646198341000,"value":"0.6493679322333372168556697362227055"},{"time":1646199241000,"value":"0.6534295695743564822577456327440583"},{"time":1646200141000,"value":"0.6534295695743564822577456327440583"},{"time":1646201041000,"value":"0.6534295695743564822577456327440583"},{"time":1646201941000,"value":"0.649534798267985711688673268247087"},{"time":1646202841000,"value":"0.649534798267985711688673268247087"},{"time":1646203741000,"value":"0.649534798267985711688673268247087"},{"time":1646204641000,"value":"0.6491959662603866450013105742183955"},{"time":1646205541000,"value":"0.6491959662603866450013105742183955"},{"time":1646206441000,"value":"0.6459516995239370646135489796524765"},{"time":1646207341000,"value":"0.647594670509265416985122570984363"},{"time":1646208241000,"value":"0.6476630797542196493616673497228882"},{"time":1646209141000,"value":"0.6476630797542196493616673497228882"},{"time":1646210041000,"value":"0.6477134538097247062622711347025778"},{"time":1646210941000,"value":"0.6402251294689040943708661194638224"},{"time":1646211841000,"value":"0.6439332658023040925130554001805819"},{"time":1646212448046,"value":0.6442808064662432}]`,
  // )
  const oldestValue = chartData.length ? parseFloat(chartData[0].value) : undefined
  const latestValue = chartData.length ? parseFloat(chartData[chartData.length - 1].value) : undefined
  const mainValueNumber = hoverValue ?? latestValue
  const subValueNumber =
    oldestValue && latestValue ? (hoverValue ? hoverValue - latestValue : oldestValue - latestValue) : undefined
  const subValuePercent = subValueNumber && latestValue ? ((subValueNumber * 100) / latestValue).toFixed(2) : undefined

  const mainValue = mainValueNumber ? formattedNum(mainValueNumber.toString(), true) : '--'
  const subValue =
    subValueNumber !== undefined && subValuePercent !== undefined
      ? `${formattedNum(subValueNumber.toString())} (${subValuePercent}%)`
      : '--'

  return (
    <ChartContainer>
      {isLoading ? (
        <LocalLoader />
      ) : (
        <>
          <Flex justifyContent="space-between" alignItems="center">
            <ChartDataTypeContainer>
              <ChartDataTypeItem
                isActive={chartCategory === TrueSightChartCategory.TRADING_VOLUME}
                onClick={() => setChartCategory(TrueSightChartCategory.TRADING_VOLUME)}
              >
                <Trans>Trading Volume</Trans>
              </ChartDataTypeItem>
              <ChartDataTypeItem
                isActive={chartCategory === TrueSightChartCategory.PRICE}
                onClick={() => setChartCategory(TrueSightChartCategory.PRICE)}
              >
                <Trans>Price</Trans>
              </ChartDataTypeItem>
            </ChartDataTypeContainer>
            <ChartTimeframeContainer>
              <ChartTimeframeItem
                isActive={chartTimeframe === TrueSightTimeframe.ONE_DAY}
                onClick={() => setChartTimeframe(TrueSightTimeframe.ONE_DAY)}
              >
                <Trans>1D</Trans>
              </ChartTimeframeItem>
              <ChartTimeframeItem
                isActive={chartTimeframe === TrueSightTimeframe.ONE_WEEK}
                onClick={() => setChartTimeframe(TrueSightTimeframe.ONE_WEEK)}
              >
                <Trans>7D</Trans>
              </ChartTimeframeItem>
            </ChartTimeframeContainer>
          </Flex>
          <MainValue>{mainValue}</MainValue>
          <SubValue>{subValue}</SubValue>
          <div style={{ flex: 1, marginTop: '16px' }}>
            <LineChart
              data={chartData}
              color={theme.primary}
              setHoverValue={setHoverValue}
              timeFrame={LiveDataTimeframeEnum.DAY}
              minHeight={0}
              showYAsis
              unitYAsis="$"
            />
          </div>
        </>
      )}
    </ChartContainer>
  )
}

export default Chart

const ChartContainer = styled.div`
  flex: 1;
  width: 100%;
  background: ${({ theme }) => rgba(theme.buttonBlack, 0.4)};
  border-radius: 8px;
  padding: 16px;
  display: flex;
  flex-direction: column;

  &,
  & * {
    user-select: none;
  }
`

const MainValue = styled.div`
  color: ${({ theme }) => theme.subText};
  font-size: 18px;
  font-weight: 500;
  line-height: 20px;
  margin-top: 12px;
`

const SubValue = styled.div<{ up?: boolean }>`
  color: ${({ theme, up }) => (up ? theme.green : theme.red)};
  font-size: 12px;
  font-weight: 400;
  line-height: 14px;
  margin-top: 4px;
`

const ChartDataTypeContainer = styled.div`
  display: flex;
  border-radius: 14px;
  background: ${({ theme }) => theme.buttonBlack};
  background: ${({ theme }) => theme.buttonBlack};
`

const ChartDataTypeItem = styled.div<{ isActive?: boolean }>`
  padding: 7px 12px;
  border-radius: 14px;
  background: ${({ theme, isActive }) => (isActive ? theme.primary : theme.buttonBlack)};
  color: ${({ theme, isActive }) => (isActive ? theme.text14 : theme.subText)};
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
`

const ChartTimeframeContainer = styled.div`
  display: flex;
  gap: 4px;
`

const ChartTimeframeItem = styled.div<{ isActive?: boolean }>`
  padding: 7px 6px;
  background: ${({ theme, isActive }) => (isActive ? theme.primary : theme.buttonBlack)};
  color: ${({ theme, isActive }) => (isActive ? theme.text14 : theme.subText)};
  font-size: 12px;
  font-weight: 500;
  border-radius: 4px;
  cursor: pointer;
`
