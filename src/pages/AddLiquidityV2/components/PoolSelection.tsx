import { ChainId, Currency, Price, Token, WETH } from '@kyberswap/ks-sdk-core'
import { FeeAmount } from '@kyberswap/ks-sdk-elastic'
import { Trans, t } from '@lingui/macro'
import mixpanel from 'mixpanel-browser'
import { useCallback, useState } from 'react'
import { Repeat } from 'react-feather'
import { generatePath, useNavigate, useParams } from 'react-router-dom'
import { useMedia } from 'react-use'
import { Text } from 'rebass'
import styled from 'styled-components'

import { ReactComponent as DropdownSVG } from 'assets/svg/down.svg'
import { ButtonLight } from 'components/Button'
import CurrencyInputPanel from 'components/CurrencyInputPanel'
import FeeSelector from 'components/FeeSelector'
import NetworkModal from 'components/Header/web3/NetworkModal'
import { Swap as SwapIcon } from 'components/Icons'
import { RowBetween } from 'components/Row'
import { APP_PATHS } from 'constants/index'
import { ELASTIC_NOT_SUPPORTED, MAINNET_NETWORKS } from 'constants/networks'
import { NativeCurrencies } from 'constants/tokens'
import { useKyberChainId } from 'hooks'
import { NETWORKS_INFO } from 'hooks/useChainsConfig'
import useTheme from 'hooks/useTheme'
import { Bound, Field } from 'state/mint/proamm/type'
import { ExternalLink, MEDIA_WIDTHS, StyledInternalLink } from 'theme'
import { currencyId } from 'utils/currencyId'
import { formatDisplayNumber } from 'utils/numbers'

import { ArrowWrapper, DynamicSection } from '../styled'

const SelectNetwork = styled.div`
  border: 999px;
  font-size: 14px;
  font-weight: 500;
  padding: 6px 12px;
  display: flex;
  align-items: center;
  gap: 8px;

  color: ${({ theme }) => theme.subText};
  background: ${({ theme }) => theme.tabActive};
  border-radius: 999px;
  cursor: pointer;
`

export const PoolSelection = ({
  tokenA,
  tokenB,
  formattedAmounts,
  onFieldAInput,
  onFieldBInput,
  currencies,
  estimatedUsdCurrencyA,
  estimatedUsdCurrencyB,
  pricesAtTicks,
  onLeftRangeInput,
  onRightRangeInput,
}: {
  tokenA: Token | undefined
  tokenB: Token | undefined
  formattedAmounts: {
    [key: string]: string
  }
  pricesAtTicks: {
    [bound in Bound]?: Price<Token, Token> | undefined
  }

  onFieldAInput: (val: string) => void
  onFieldBInput: (val: string) => void
  currencies: { [field in Field]?: Currency }
  estimatedUsdCurrencyA: number
  estimatedUsdCurrencyB: number
  onLeftRangeInput: (typedValue: string) => void
  onRightRangeInput: (typedValue: string) => void
}) => {
  const chainId = useKyberChainId()
  const params = useParams()
  const { currencyIdA, currencyIdB, feeAmount: feeAmountFromUrl, network } = params

  // fee selection from url
  const feeAmount: FeeAmount =
    feeAmountFromUrl && Object.values(FeeAmount).includes(parseFloat(feeAmountFromUrl))
      ? parseFloat(feeAmountFromUrl)
      : FeeAmount.MOST_PAIR

  const theme = useTheme()

  const { [Field.CURRENCY_A]: currencies_A, [Field.CURRENCY_B]: currencies_B } = currencies
  const { [Bound.LOWER]: priceLower, [Bound.UPPER]: priceUpper } = pricesAtTicks
  const isSorted = tokenA && tokenB && tokenA.sortsBefore(tokenB)
  const leftPrice = isSorted ? priceLower : priceUpper?.invert()
  const rightPrice = isSorted ? priceUpper : priceLower?.invert()

  const upToXL = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXL}px)`)
  const upToLarge = useMedia(`(max-width: ${MEDIA_WIDTHS.upToLarge}px)`)
  const upToMedium = useMedia(`(max-width: ${MEDIA_WIDTHS.upToMedium}px)`)
  const upToXXSmall = useMedia(`(max-width: ${MEDIA_WIDTHS.upToXXSmall}px)`)
  const [rotate, setRotate] = useState(false)

  const tightTokenSelect = !upToMedium && upToLarge

  const navigate = useNavigate()

  const handleCurrencySelect = useCallback(
    (currencyNew: Currency, currencyIdOther?: string): (string | undefined)[] => {
      const currencyIdNew = currencyId(currencyNew, chainId)

      if (currencyIdNew === currencyIdOther) {
        // not ideal, but for now clobber the other if the currency ids are equal
        return [currencyIdNew, undefined]
      } else {
        // prevent weth + eth
        const isETHOrWETHNew = currencyNew.isNative || (chainId && currencyIdNew === WETH[chainId]?.address)
        const isETHOrWETHOther =
          !!currencyIdOther &&
          ((chainId && currencyIdOther === NativeCurrencies[chainId].symbol) ||
            (chainId && currencyIdOther === WETH[chainId]?.address))

        if (isETHOrWETHNew && isETHOrWETHOther) {
          return [currencyIdNew, undefined]
        } else {
          return [currencyIdNew, currencyIdOther]
        }
      }
    },
    [chainId],
  )

  const handleCurrencyASelect = useCallback(
    (currencyANew: Currency) => {
      const [idA, idB] = handleCurrencySelect(currencyANew, currencyIdB)
      if (idB === undefined) {
        navigate(`/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${idA}`)
      } else {
        navigate(`/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdB, navigate, chainId],
  )

  const handleCurrencyBSelect = useCallback(
    (currencyBNew: Currency) => {
      const [idB, idA] = handleCurrencySelect(currencyBNew, currencyIdA)
      if (idA === undefined) {
        navigate(`/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${idB}`)
      } else {
        navigate(`/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${idA}/${idB}`)
      }
    },
    [handleCurrencySelect, currencyIdA, navigate, chainId],
  )

  const handleFeePoolSelect = useCallback(
    (newFeeAmount: FeeAmount) => {
      onLeftRangeInput('')
      onRightRangeInput('')
      navigate(
        `/${NETWORKS_INFO[chainId].route}${APP_PATHS.ELASTIC_CREATE_POOL}/${currencyIdA}/${currencyIdB}/${newFeeAmount}`,
      )
    },
    [currencyIdA, currencyIdB, navigate, chainId, onLeftRangeInput, onRightRangeInput],
  )

  const [isOpenNetworkModal, setIsOpenNetworkModal] = useState(false)
  const openNetworkModal = () => {
    setIsOpenNetworkModal(true)
  }

  const handleSelectNetwork = (chainId: ChainId) => {
    const path = generatePath(`/:network${APP_PATHS.ELASTIC_CREATE_POOL}`, {
      ...params,
      network: NETWORKS_INFO[chainId].route,
    } as any)
    navigate(path, { replace: true })
  }

  const activeChainIds = MAINNET_NETWORKS.filter(item => !ELASTIC_NOT_SUPPORTED[item])

  return (
    <>
      <NetworkModal
        activeChainIds={activeChainIds}
        selectedId={+chainId}
        customOnSelectNetwork={handleSelectNetwork}
        isOpen={isOpenNetworkModal}
        customToggleModal={() => setIsOpenNetworkModal(prev => !prev)}
        disabledMsg={t`Elastic is not supported on this network`}
      />
      <RowBetween>
        <Text fontSize={20}>
          <Trans>Choose pool</Trans>
        </Text>
        <div>
          <ButtonLight
            padding="2px 8px"
            as={ExternalLink}
            href={`${APP_PATHS.SWAP}/${network}?${currencyIdA ? `inputCurrency=${currencyIdA}` : ''}${
              currencyIdB ? `&outputCurrency=${currencyIdB}` : ''
            }`}
            onClick={() => {
              if (tokenA?.symbol && tokenB?.symbol)
                mixpanel.track('Elastic - Add Liquidity page - Click Swap', {
                  token_1: tokenA?.symbol,
                  token_2: tokenB?.symbol,
                })
            }}
          >
            <Repeat size={16} />
            <Text marginLeft="4px">
              <Trans>Swap</Trans>
            </Text>
          </ButtonLight>
        </div>
      </RowBetween>

      <RowBetween>
        <Text fontSize="12px" fontWeight="500" color={theme.subText}>
          <Trans>Choose a chain</Trans>
        </Text>

        <SelectNetwork role="button" onClick={openNetworkModal}>
          <img src={NETWORKS_INFO[chainId].icon} alt="Network" style={{ height: '20px', width: '20px' }} />
          <Text>{NETWORKS_INFO[chainId].name}</Text>
          <DropdownSVG />
        </SelectNetwork>
      </RowBetween>

      <RowBetween
        sx={{ gap: upToXL ? (upToMedium ? '8px' : '4px') : '20px' }}
        flexDirection={upToXXSmall ? 'column' : 'row'}
      >
        <CurrencyInputPanel
          hideBalance
          value={formattedAmounts[Field.CURRENCY_A]}
          onUserInput={onFieldAInput}
          hideInput={true}
          onMax={null}
          onHalf={null}
          onCurrencySelect={handleCurrencyASelect}
          currency={currencies_A ?? null}
          id="add-liquidity-input-tokena"
          showCommonBases
          estimatedUsd={formatDisplayNumber(estimatedUsdCurrencyA, { style: 'decimal', significantDigits: 6 })}
          maxCurrencySymbolLength={6}
          customChainId={chainId}
          tight={tightTokenSelect}
        />

        <ArrowWrapper
          isVertical={!upToXXSmall}
          rotated={rotate}
          onClick={() => {
            if (!!rightPrice) {
              onLeftRangeInput(rightPrice?.invert().toString())
            }
            if (!!leftPrice) {
              onRightRangeInput(leftPrice?.invert().toString())
            }
            setRotate(prev => !prev)
          }}
        >
          {!currencyIdA && !currencyIdB ? (
            <SwapIcon size={upToMedium ? 12 : 24} color={theme.subText} />
          ) : (
            <StyledInternalLink
              replace
              to={`/${network}${APP_PATHS.ELASTIC_CREATE_POOL}/${currencyIdB}/${currencyIdA}/${feeAmount}`}
              style={{ color: 'inherit', display: 'flex' }}
            >
              <SwapIcon size={24} color={theme.subText} />
            </StyledInternalLink>
          )}
        </ArrowWrapper>

        <CurrencyInputPanel
          customChainId={chainId}
          hideBalance
          value={formattedAmounts[Field.CURRENCY_B]}
          hideInput={true}
          onUserInput={onFieldBInput}
          onCurrencySelect={handleCurrencyBSelect}
          onMax={null}
          onHalf={null}
          positionMax="top"
          currency={currencies_B ?? null}
          id="add-liquidity-input-tokenb"
          showCommonBases
          estimatedUsd={formatDisplayNumber(estimatedUsdCurrencyB, { style: 'currency', significantDigits: 6 })}
          maxCurrencySymbolLength={6}
          tight={tightTokenSelect}
        />
      </RowBetween>

      <DynamicSection disabled={!currencyIdA || !currencyIdB} gap="md">
        <Text fontWeight={500} fontSize="12px">
          <Trans>Select fee tier</Trans>
        </Text>
        <FeeSelector
          feeAmount={feeAmount}
          onChange={handleFeePoolSelect}
          currencyA={currencies_A}
          currencyB={currencies_B}
        />
      </DynamicSection>
    </>
  )
}
