import { Currency, CurrencyAmount, Token } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import { rgba } from 'polished'
import React, { CSSProperties, MutableRefObject, useCallback, useMemo } from 'react'
import { Star, Trash } from 'react-feather'
import InfiniteScroll from 'react-infinite-scroll-component'
import { FixedSizeList } from 'react-window'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import TokenListLogo from 'assets/svg/tokenlist.svg'
import { LightGreyCard } from 'components/Card'
import QuestionHelper from 'components/QuestionHelper'
import { useActiveWeb3React } from 'hooks'
import useTheme from 'hooks/useTheme'
import { WrappedTokenInfo } from 'state/lists/wrappedTokenInfo'
import { useUserAddedTokens, useUserFavoriteTokens } from 'state/user/hooks'
import { useCurrencyBalances } from 'state/wallet/hooks'
import { TYPE } from 'theme'
import { useCurrencyConvertedToNative } from 'utils/dmm'

import Column from '../Column'
import CurrencyLogo from '../CurrencyLogo'
import Loader from '../Loader'
import { RowBetween, RowFixed } from '../Row'
import { MouseoverTooltip } from '../Tooltip'
import ImportRow from './ImportRow'

function currencyKey(currency: Currency): string {
  return currency?.isNative ? 'ETHER' : currency?.address || ''
}

const StyledBalanceText = styled(Text)`
  white-space: nowrap;
  overflow: hidden;
  max-width: 5rem;
  text-overflow: ellipsis;
`

const FavoriteButton = styled(Star)`
  width: 20px;
  height: 20px;
  color: ${({ theme }) => theme.subText};

  :hover {
    color: ${({ theme }) => theme.primary};
  }

  &[data-active='true'] {
    color: ${({ theme }) => theme.primary};
    fill: currentColor;
  }
`
const DeleteButton = styled(Trash)`
  width: 16px;
  height: 20px;
  fill: currentColor;
  color: ${({ theme }) => theme.subText};
  :hover {
    color: ${({ theme }) => theme.text};
  }
`

const CurrencyRowWrapper = styled(RowBetween)`
  padding: 4px 20px;
  height: 56px;
  display: flex;
  gap: 16px;
  cursor: pointer;

  &[data-selected='true'] {
    background: ${({ theme }) => rgba(theme.bg8, 0.15)};
  }

  @media (hover: hover) {
    :hover {
      background: ${({ theme }) => theme.buttonBlack};
    }
  }
`

const Tag = styled.div`
  background-color: ${({ theme }) => theme.bg3};
  color: ${({ theme }) => theme.text2};
  font-size: 14px;
  border-radius: 4px;
  padding: 0.25rem 0.3rem 0.25rem 0.3rem;
  max-width: 6rem;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  justify-self: flex-end;
  margin-right: 4px;
`

const FixedContentRow = styled.div`
  padding: 4px 20px;
  height: 56px;
  display: grid;
  grid-gap: 16px;
  align-items: center;
`

function Balance({ balance }: { balance: CurrencyAmount<Currency> }) {
  return <StyledBalanceText title={balance.toExact()}>{balance.toSignificant(10)}</StyledBalanceText>
}

const TagContainer = styled.div`
  display: flex;
  justify-content: flex-end;
`

const TokenListLogoWrapper = styled.img`
  height: 20px;
`

const DescText = styled.div`
  margin-left: 0;
  font-size: 12px;
  font-weight: 300;
  color: ${({ theme }) => theme.subText};
`

function TokenTags({ currency }: { currency: Currency }) {
  if (!(currency instanceof WrappedTokenInfo)) {
    return <span />
  }

  const tags = currency.tags
  if (!tags || tags.length === 0) return <span />

  const tag = tags[0]

  return (
    <TagContainer>
      <MouseoverTooltip text={tag.description}>
        <Tag key={tag.id}>{tag.name}</Tag>
      </MouseoverTooltip>
      {tags.length > 1 ? (
        <MouseoverTooltip
          text={tags
            .slice(1)
            .map(({ name, description }) => `${name}: ${description}`)
            .join('; \n')}
        >
          <Tag>...</Tag>
        </MouseoverTooltip>
      ) : null}
    </TagContainer>
  )
}

function CurrencyRow({
  currency,
  isImportedTab,
  currencyBalance,
  onSelect,
  isSelected,
  otherSelected,
  style,
  handleClickFavorite,
  removeImportedToken,
}: {
  isImportedTab: boolean
  currency: Currency
  currencyBalance: CurrencyAmount<Currency>
  onSelect: () => void
  isSelected: boolean
  otherSelected: boolean
  style: CSSProperties
  handleClickFavorite: (e: React.MouseEvent, currency: Currency) => void
  removeImportedToken: (token: Token) => void
}) {
  const { chainId, account } = useActiveWeb3React()
  const balance = currencyBalance

  const nativeCurrency = useCurrencyConvertedToNative(currency || undefined)
  // only show add or remove buttons if not on selected list

  const { favoriteTokens } = useUserFavoriteTokens(chainId)
  const onClickRemove = (e: React.MouseEvent) => {
    e.stopPropagation()
    removeImportedToken(currency as Token)
  }

  const isFavorite = (() => {
    if (!chainId || !favoriteTokens) {
      return false
    }

    if (currency.isNative) {
      return !!favoriteTokens.includeNativeToken
    }

    if (currency.isToken) {
      const addr = (currency as Token).address
      return !!favoriteTokens.addresses?.includes(addr)
    }

    return false
  })()
  const balanceComponent = balance ? <Balance balance={balance} /> : account ? <Loader /> : null
  return (
    <CurrencyRowWrapper style={style} onClick={() => onSelect()} data-selected={isSelected || otherSelected}>
      <Flex alignItems="center" style={{ gap: 8 }}>
        <CurrencyLogo currency={currency} size={'24px'} />
        <Column>
          <Text title={currency.name} fontWeight={500}>
            {nativeCurrency?.symbol}
          </Text>
          <DescText>{isImportedTab ? balanceComponent : nativeCurrency?.name}</DescText>
        </Column>
        <TokenTags currency={currency} />
      </Flex>
      <RowFixed style={{ justifySelf: 'flex-end', gap: 15 }}>
        {isImportedTab ? <DeleteButton onClick={onClickRemove} /> : balanceComponent}
        <FavoriteButton onClick={e => handleClickFavorite(e, currency)} data-active={isFavorite} />
      </RowFixed>
    </CurrencyRowWrapper>
  )
}

interface TokenRowProps {
  data: {
    currencies: Array<Currency | Token | undefined>
    currencyBalances: Array<CurrencyAmount<Currency>>
  }
  index: number
  style: CSSProperties
}

export default function CurrencyList({
  height,
  currencies,
  inactiveTokens,
  selectedCurrency,
  isImportedTab,
  onCurrencySelect,
  otherCurrency,
  fixedListRef,
  showImportView,
  setImportToken,
  breakIndex,
  handleClickFavorite,
  removeImportedToken,
  loadMoreRows,
  totalItems,
}: {
  height: number
  isImportedTab: boolean
  currencies: Currency[]
  inactiveTokens: Token[]
  selectedCurrency?: Currency | null
  onCurrencySelect: (currency: Currency) => void
  otherCurrency?: Currency | null
  fixedListRef?: MutableRefObject<FixedSizeList | undefined>
  showImportView: () => void
  setImportToken: (token: Token) => void
  breakIndex: number | undefined
  handleClickFavorite: (e: React.MouseEvent, currency: Currency) => void
  removeImportedToken: (token: Token) => void
  loadMoreRows: () => Promise<void>
  totalItems: number
}) {
  const { account } = useActiveWeb3React()
  const itemCurrencies: (Currency | undefined)[] = useMemo(() => {
    let formatted: (Currency | undefined)[] = currencies
    if (breakIndex !== undefined) {
      formatted = [...formatted.slice(0, breakIndex), undefined, ...formatted.slice(breakIndex, formatted.length)]
    }
    return formatted
  }, [breakIndex, currencies])
  const itemCurrencyBalances = useCurrencyBalances(account || undefined, itemCurrencies)
  const itemData = useMemo(
    () => ({ currencies: itemCurrencies, currencyBalances: itemCurrencyBalances }),
    [itemCurrencies, itemCurrencyBalances],
  )

  const theme = useTheme()

  // TODO(viet-nv): check typescript for this
  const Row: any = useCallback(
    function TokenRow({ data, index, style }: TokenRowProps) {
      const currency: Currency | undefined = data.currencies[index]
      const currencyBalance: CurrencyAmount<Currency> = data.currencyBalances[index]
      const isSelected = Boolean(selectedCurrency && currency && selectedCurrency.equals(currency))
      const otherSelected = Boolean(otherCurrency && currency && otherCurrency.equals(currency))
      const handleSelect = () => currency && onCurrencySelect(currency)

      const token = currency?.wrapped as any
      const extendCurrency = currency as any
      const tokenImports = useUserAddedTokens()
      const showImport =
        token &&
        !extendCurrency?.isWhitelisted &&
        !tokenImports.find(importedToken => importedToken.address === token.address)

      if (index === breakIndex || !data) {
        return (
          <FixedContentRow style={style}>
            <LightGreyCard padding="8px 12px" borderRadius="8px">
              <RowBetween>
                <RowFixed>
                  <TokenListLogoWrapper src={TokenListLogo} />
                  <TYPE.main ml="6px" fontSize="12px" color={theme.text}>
                    <Trans>Expanded results from inactive Token Lists</Trans>
                  </TYPE.main>
                </RowFixed>
                <QuestionHelper
                  text={t`Tokens from inactive lists. Import specific tokens below or click 'Manage' to activate more lists`}
                />
              </RowBetween>
            </LightGreyCard>
          </FixedContentRow>
        )
      }

      if (showImport && token) {
        return (
          <ImportRow
            style={style}
            token={token}
            showImportView={showImportView}
            setImportToken={setImportToken}
            dim={true}
          />
        )
      }

      if (currency) {
        return (
          <CurrencyRow
            isImportedTab={isImportedTab}
            handleClickFavorite={handleClickFavorite}
            removeImportedToken={removeImportedToken}
            style={style}
            currency={currency}
            currencyBalance={currencyBalance}
            isSelected={isSelected}
            onSelect={handleSelect}
            otherSelected={otherSelected}
          />
        )
      }

      return null
    },
    [
      onCurrencySelect,
      otherCurrency,
      selectedCurrency,
      setImportToken,
      showImportView,
      breakIndex,
      theme.text,
      handleClickFavorite,
      isImportedTab,
      removeImportedToken,
    ],
  )

  return (
    <InfiniteScroll
      dataLength={inactiveTokens.length}
      next={loadMoreRows}
      hasMore={inactiveTokens.length < totalItems}
      height={500}
      loader={<h4>Loading...</h4>}
      scrollableTarget="scrollableDiv"
    >
      {inactiveTokens.map((item, index) => (
        <Row key={item?.address} index={index} data={itemData} style={{ height: 56 }} />
      ))}
    </InfiniteScroll>
  )
}
