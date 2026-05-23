import { Pair } from '@kyberswap/ks-sdk-classic'
import { Currency, TokenAmount } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import JSBI from 'jsbi'
import { useCallback, useEffect, useState } from 'react'
import { Plus } from 'react-feather'

import { ButtonDropdownLight } from 'components/Button'
import { LightCard } from 'components/Card'
import { AutoColumn, ColumnCenter } from 'components/Column'
import CurrencyLogo from 'components/CurrencyLogo'
import { FindPoolTabs } from 'components/NavigationTabs'
import { NarrowPositionCard } from 'components/PositionCard'
import Row from 'components/Row'
import CurrencySearchModal from 'components/SearchModal/CurrencySearchModal'
import { APP_PATHS } from 'constants/index'
import { NativeCurrencies } from 'constants/tokens'
import { PairState, usePair } from 'data/Reserves'
import { useActiveWeb3React } from 'hooks'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import AppBody from 'pages/AppBody'
import { Dots } from 'pages/MyPool/styleds'
import { usePairAdderByTokens } from 'state/user/hooks'
import { useTokenBalances } from 'state/wallet/hooks'
import { StyledInternalLink } from 'theme'
import { useCurrencyConvertedToNative } from 'utils/dmm'

enum Fields {
  TOKEN0 = 0,
  TOKEN1 = 1,
}

export default function PoolFinder() {
  const { account, chainId, networkInfo } = useActiveWeb3React()

  const [showSearch, setShowSearch] = useState<boolean>(false)
  const [activeField, setActiveField] = useState<number>(Fields.TOKEN1)

  const [currency0, setCurrency0] = useState<Currency | null>(NativeCurrencies[chainId])
  const [currency1, setCurrency1] = useState<Currency | null>(null)

  // pairs: {PairState, Pair, isStaticFeePair}[]
  const pairs: [PairState, Pair | null][] = usePair(currency0 ?? undefined, currency1 ?? undefined)

  const addPair = usePairAdderByTokens()
  useEffect(() => {
    if (pairs.length > 0) {
      const token0 = currency0?.wrapped
      const token1 = currency1?.wrapped
      if (!!(token0 && token1)) {
        addPair(token0, token1)
      }
    }
  }, [pairs, addPair, currency0, currency1, chainId])

  const positions: { [tokenAddress: string]: TokenAmount | undefined } = useTokenBalances(
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    pairs.every(([, pair]) => pair) ? pairs.map(([, pair]) => pair!.liquidityToken) : undefined,
  )

  const handleCurrencySelect = useCallback(
    (currency: Currency) => {
      if (activeField === Fields.TOKEN0) {
        setCurrency0(currency)
      } else {
        setCurrency1(currency)
      }
    },
    [activeField],
  )

  const myPairs = pairs
    .filter(([pairState, pair]) => {
      // const validPairNoLiquidity: boolean =
      //   pairState === PairState.NOT_EXISTS ||
      //   Boolean(
      //     pairState === PairState.EXISTS &&
      //       pair &&
      //       JSBI.equal(pair.reserve0.raw, JSBI.BigInt(0)) &&
      //       JSBI.equal(pair.reserve1.raw, JSBI.BigInt(0))
      //   )
      let hasPosition = false
      if (pair && pair.liquidityToken.address && positions[pair.liquidityToken.address]) {
        hasPosition = Boolean(
          positions[pair.liquidityToken.address] &&
            JSBI.greaterThan((positions[pair.liquidityToken.address] as TokenAmount).quotient, JSBI.BigInt(0)),
        )
      }
      return pairState === PairState.EXISTS && hasPosition && pair
    })
    .map(([_, pair], index) => !!pair && <NarrowPositionCard key={index} pair={pair} border="1px solid #CED0D9" />)

  const handleSearchDismiss = useCallback(() => {
    setShowSearch(false)
  }, [setShowSearch])

  const prerequisiteMessage = (
    <LightCard className="px-2.5 py-[45px]">
      <p className="text-center">
        {!account ? t`Connect to a wallet to find pools` : t`Select a token to find your liquidity.`}
      </p>
    </LightCard>
  )

  const native0 = useCurrencyConvertedToNative(currency0 || undefined)
  const native1 = useCurrencyConvertedToNative(currency1 || undefined)

  const { trackingHandler } = useTracking()
  useEffect(() => {
    trackingHandler(TRACKING_EVENT_TYPE.IMPORT_POOL_INITIATED)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppBody>
      <FindPoolTabs />
      <AutoColumn gap="md">
        <ButtonDropdownLight
          onClick={() => {
            setShowSearch(true)
            setActiveField(Fields.TOKEN0)
          }}
        >
          {native0 ? (
            <Row>
              <CurrencyLogo currency={currency0 || undefined} />
              <span className="ml-3 text-xl font-medium">{native0?.symbol}</span>
            </Row>
          ) : (
            <span className="ml-3 text-xl font-medium">
              <Trans>Select a token</Trans>
            </span>
          )}
        </ButtonDropdownLight>

        <ColumnCenter>
          <Plus size="16" color="#888D9B" />
        </ColumnCenter>

        <ButtonDropdownLight
          onClick={() => {
            setShowSearch(true)
            setActiveField(Fields.TOKEN1)
          }}
        >
          {native1 ? (
            <Row>
              <CurrencyLogo currency={currency1 || undefined} />
              <span className="ml-3 text-xl font-medium">{native1?.symbol}</span>
            </Row>
          ) : (
            <span className="ml-3 text-xl font-medium">
              <Trans>Select a token</Trans>
            </span>
          )}
        </ButtonDropdownLight>
        {pairs.filter(([pairState]) => pairState === PairState.LOADING).length > 0 && (
          <LightCard className="px-2.5 py-[45px]">
            <AutoColumn gap="sm" justify="center">
              <p className="text-center">
                <Trans>Loading</Trans>
                <Dots />
              </p>
            </AutoColumn>
          </LightCard>
        )}

        {currency0 && currency1
          ? myPairs.length > 0 && (
              <>
                <ColumnCenter
                  style={{ justifyItems: 'center', backgroundColor: '', padding: '12px 0px', borderRadius: '12px' }}
                >
                  <p className="text-center font-medium">
                    <Trans>Pool Found!</Trans>
                  </p>
                  <StyledInternalLink to={`${APP_PATHS.MY_POOLS}/${networkInfo.route}?tab=classic`}>
                    <p className="text-center">
                      <Trans>Manage your pools.</Trans>
                    </p>
                  </StyledInternalLink>
                </ColumnCenter>
                {myPairs}
              </>
            )
          : prerequisiteMessage}
      </AutoColumn>

      <CurrencySearchModal
        isOpen={showSearch}
        onCurrencySelect={handleCurrencySelect}
        onDismiss={handleSearchDismiss}
        showCommonBases
        selectedCurrency={(activeField === Fields.TOKEN0 ? currency1 : currency0) ?? undefined}
      />
    </AppBody>
  )
}
