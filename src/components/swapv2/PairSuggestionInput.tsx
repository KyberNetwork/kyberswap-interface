import React, { FocusEvent, useCallback, useEffect, useRef, useState } from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { Star, Search, AlertTriangle } from 'react-feather'
import useTheme from 'hooks/useTheme'
import styled, { css } from 'styled-components'
import { Z_INDEXS } from 'constants/styles'
import Axios from 'axios'
import { debounce } from 'lodash'
import { ButtonPrimary } from 'components/Button'
import { ChainId, Token } from '@kyberswap/ks-sdk-core'
import Loader from 'components/Loader'
import TokenWarningModal from 'components/TokenWarningModal'
import { BrowserView, isMobile, MobileView } from 'react-device-detect'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { searchInactiveTokenLists, useAllTokens } from 'hooks/Tokens'
import { useAllLists, useInactiveListUrls } from 'state/lists/hooks'
import { filterTokens } from 'utils/filtering'

const Break = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  margin: 1em 0;
`

const Title = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.subText};
  margin-bottom: 5px;
`

const ItemWrapper = styled.div<{ isActive: boolean }>`
  cursor: pointer;
  display: flex;
  justify-content: space-between;
  background-color: ${({ theme, isActive }) => (isActive ? theme.bg3 : 'transparent')};
  padding: 1em;
`

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const WrapperPopup = styled(Wrapper)`
  height: 75vh;
  background-color: ${({ theme }) => theme.tableHeader};
`

const INPUT_HEIGHT = '50px'
const SearchWrapper = styled.div<{ showList: boolean }>`
  display: flex;
  align-items: center;
  gap: 5px;
  position: relative;
  width: 100%;
  border-radius: ${({ showList }) => (showList ? '10px 10px 0 0' : '10px')};
  border-bottom: ${({ showList, theme }) => (showList ? `1px solid ${theme.border}` : 'none')};
  background-color: ${({ theme }) => theme.tableHeader};
  height: ${INPUT_HEIGHT};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-bottom:none;
  `}
`
const SearchInput = styled.input<{ hasBorder?: boolean }>`
  ::placeholder {
    color: ${({ theme }) => theme.text3};
  }
  transition: border 100ms;
  color: ${({ theme }) => theme.text};
  background: none;
  border: none;
  outline: none;
  padding: 16px;
  padding-left: 35px;
  width: 100%;
  ${({ theme, hasBorder }) => theme.mediaWidth.upToMedium`
    ${
      hasBorder
        ? css`
            border-radius: 10px;
            border: 1px solid ${theme.primary};
          `
        : css`
            border: none;
          `
    }
    
`};
`

const SearchIcon = styled(Search)`
  position: absolute;
  left: 10px;
  color: ${({ theme }) => theme.text3};
  font-size: 14px;
`
const EscIcon = styled.div`
  background: ${({ theme }) => theme.bg1};
  padding: 3px 8px;
  margin-right: 10px;
  border-radius: 22px;
  font-size: 12px;
  color: ${({ theme }) => theme.text3};
  cursor: pointer;
`

const Container = styled.div`
  padding-left: 1em;
  padding-right: 1em;
  display: flex;
  flex-direction: column;
  row-gap: 1em;
`
const MenuFlyout = styled.div`
  overflow: auto;
  background-color: ${({ theme }) => theme.tableHeader};
  border-radius: 5px;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  position: absolute;
  top: ${INPUT_HEIGHT};
  left: 0;
  right: 0;
  z-index: ${Z_INDEXS.SUGGESTION_PAIR};
  ${({ theme }) => theme.mediaWidth.upToMedium`
     position: unset;
  `};
`

export type SuggestionPairData = {
  tokenIn: string
  tokenInSymbol: string
  tokenInImgUrl: string
  tokenOut: string
  tokenOutSymbol: string
  tokenOutImgUrl: string
}

type PropsType = {
  addToFavorite?: () => void
  removeFavorite?: () => void
  onSelectPair: () => void
  onImportToken: () => void
  data: SuggestionPairData
  isActive: boolean
  amount: string
  isFavorite?: boolean
}
function SuggestItem({
  data,
  isFavorite,
  isActive,
  amount,
  addToFavorite,
  removeFavorite,
  onSelectPair,
  onImportToken,
}: PropsType) {
  const theme = useTheme()
  const defaultTokens = useAllTokens()
  const { tokenIn, tokenOut, tokenInSymbol, tokenOutSymbol, tokenInImgUrl, tokenOutImgUrl } = data

  const onClickStar = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (addToFavorite) addToFavorite()
    else if (removeFavorite) removeFavorite()
  }

  const isTokenInWhiteList = (address: string) => address && defaultTokens[address]
  const isTokenNotImport = !isTokenInWhiteList(tokenIn) || !isTokenInWhiteList(tokenOut)

  return (
    <ItemWrapper onClick={onSelectPair} isActive={isActive}>
      <Flex alignItems="center" style={{ gap: 10 }}>
        <div>
          <img style={{ marginRight: 5 }} src={tokenInImgUrl} height={20} width={20} alt="kyber swap" />
          <img src={tokenOutImgUrl} height={20} width={20} alt="kyber swap" />
        </div>
        <div>
          <Text color={theme.text}>
            {amount} {tokenInSymbol} - {tokenOutSymbol}
          </Text>
          <Text color={theme.text3} fontSize={14}>
            kyber xxx - ether xxx
          </Text>
        </div>
      </Flex>
      <div tabIndex={0} className="no-blur">
        {isTokenNotImport ? (
          <ButtonPrimary
            tabIndex={0}
            className="no-blur"
            altDisabledStyle={true}
            borderRadius="20px"
            padding="4px 7px 5px 7px"
            onClick={e => {
              e.stopPropagation()
              onImportToken()
            }}
          >
            <Trans>Import</Trans>
          </ButtonPrimary>
        ) : (
          <Star onClick={onClickStar} size={20} color={isFavorite ? theme.primary : theme.subText} />
        )}
      </div>
    </ItemWrapper>
  )
}

// todo split component
// const SUGGEST_PAIR_API = 'https://tns.kyberengineering.io/api/v1/favorite-pairs'
const SUGGEST_PAIR_API = 'https://campaigns.dev.kyberengineering.io/api/v1/campaigns?limit=10000&offset=0'

function reqGetSuggestionPair(
  chainId: ChainId | undefined,
  keyword: string,
  wallet: string | null | undefined,
): Promise<{ favoritePairs: SuggestionPairData[]; suggestedPairs: SuggestionPairData[]; amount: string }> {
  const data = new Array(5).fill({
    tokenIn: '0xA2120b9e674d3fC3875f415A7DF52e382F141225',
    tokenInSymbol: 'ATA',
    tokenInImgUrl: 'https://raw.githubusercontent.com/KyberNetwork/dmm-interface/main/src/assets/images/KNC.svg',
    tokenOut: '0x0Eb3a705fc54725037CC9e008bDede697f62F335',
    tokenOutSymbol: 'ATOM',
    tokenOutImgUrl: 'https://raw.githubusercontent.com/KyberNetwork/dmm-interface/main/src/assets/images/KNC.svg',
  })
  return Promise.resolve({
    amount: '10',
    favoritePairs: data.slice(0, 3),
    suggestedPairs: data.slice(0, 5),
  })
  return Axios.get(SUGGEST_PAIR_API, { params: { chainId, keyword, wallet } }).then(({ data }) => data.data)
}

function reqRemoveFavoritePair(
  item: SuggestionPairData,
  wallet: string | null | undefined,
  chainId: ChainId | undefined,
): Promise<any> {
  return Axios.delete(SUGGEST_PAIR_API, {
    data: { wallet, chainId, tokenIn: item.tokenIn, tokenOut: item.tokenOut },
  })
}
function reqAddFavoritePair(
  item: SuggestionPairData,
  wallet: string | null | undefined,
  chainId: ChainId | undefined,
): Promise<any> {
  return Axios.post(SUGGEST_PAIR_API, {
    data: { wallet, chainId, tokenIn: item.tokenIn, tokenOut: item.tokenOut },
  })
}

const MAX_FAVORITE_PAIRS = 3

const TextWithIcon = ({ text, icon }: { text: string; icon: JSX.Element }) => (
  <>
    <Flex justifyContent="center">
      {icon}
      <span style={{ marginLeft: 7 }}>
        <Trans>{text}</Trans>...
      </span>
    </Flex>
    <Break />
  </>
)

type Props = {
  onSelectSuggestedPair: (fromToken: Token | undefined, toToken: Token | undefined, amount: string) => void
}
export default function PairSuggestionInput({ onSelectSuggestedPair }: Props) {
  const [searchQuery, setSearchQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(0) // index selected when press up/down arrow
  const [showList, setShowList] = useState(false)
  const [loading, setLoading] = useState(false)

  const [suggestedPairs, setSuggestions] = useState<SuggestionPairData[]>([])
  const [favoritePairs, setListFavorite] = useState<SuggestionPairData[]>([])
  const [suggestedAmount, setSuggestedAmount] = useState<string>('')

  const [tokensNotInDefault, setTokensNotInDefault] = useState<Token[]>([])
  const { account, chainId } = useActiveWeb3React()
  const theme = useTheme()

  const refLoading = useRef(false) // prevent spam call api
  const refSelectedPair = useRef<SuggestionPairData | null>(null)
  const refInput = useRef<HTMLInputElement>(null)

  const searchSuggestionPair = (keyword: string) => {
    setLoading(true)
    setSuggestions([])
    setListFavorite([])
    setTimeout(() => {
      // todo
      reqGetSuggestionPair(chainId, keyword, account)
        .then(({ favoritePairs, suggestedPairs, amount }) => {
          setSuggestions(suggestedPairs)
          setListFavorite(favoritePairs)
          amount && setSuggestedAmount(amount)
        })
        .catch(e => {
          console.log(e)
        })
        .finally(() => {
          setLoading(false)
        })
    }, 2000)
  }

  const addToFavorite = (item: SuggestionPairData, index: number) => {
    refInput.current?.focus()
    if (favoritePairs.length === MAX_FAVORITE_PAIRS || refLoading.current) return
    setListFavorite(favoritePairs.concat(item))
    setSuggestions(suggestedPairs.filter((_, i) => i !== index))
    return
    refLoading.current = true
    reqAddFavoritePair(item, account, chainId)
      .then(data => {
        console.log(data)
      })
      .catch(console.error)
      .finally(() => {
        refLoading.current = false
      })
  }

  const removeFavorite = (item: SuggestionPairData, index: number) => {
    refInput.current?.focus()
    if (refLoading.current) return
    setListFavorite(favoritePairs.filter((_, i) => i !== index))
    setSuggestions(suggestedPairs.concat(item))
    return
    refLoading.current = true
    reqRemoveFavoritePair(item, account, chainId)
      .then(data => {
        console.log(data)
      })
      .catch(console.error)
      .finally(() => {
        refLoading.current = false
      })
  }

  const hideListView = () => {
    setShowList(false)
    setActiveIndex(0)
  }
  const showListView = () => {
    setShowList(true)
    refInput.current?.focus()
  }

  useEffect(() => {
    searchSuggestionPair('') // get init data

    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // cmd+k/ctrl+k
        showListView()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [])

  const searchDebounce = useCallback(debounce(searchSuggestionPair, 350), [])

  const onChangeInput = (event: React.FormEvent<HTMLInputElement>) => {
    const { value: keyword } = event.currentTarget
    setSearchQuery(keyword)
    searchDebounce(keyword)
  }

  const activeList = useAllLists()
  const inactiveUrls = useInactiveListUrls()
  const activeTokens = useAllTokens()

  const findToken = (
    search: string,
  ): Token | undefined => // search active first and then search inactive
    filterTokens(Object.values(activeTokens), search)[0] ||
    searchInactiveTokenLists({ search, minResults: 1, activeList, inactiveUrls, chainId, activeTokens })[0]

  const onSelectPair = (item: SuggestionPairData) => {
    const fromToken = findToken(item.tokenIn)
    const toToken = findToken(item.tokenOut)
    onSelectSuggestedPair(fromToken, toToken, suggestedAmount)
    setShowList(false)
  }

  const onEscape = () => {
    setSearchQuery('')
  }

  const onKeyPress = (e: React.KeyboardEvent) => {
    const lastIndex = suggestedPairs.length + favoritePairs.length - 1
    switch (e.key) {
      case 'ArrowDown':
        if (activeIndex < lastIndex) {
          setActiveIndex(prev => prev + 1)
        } else setActiveIndex(0)
        break
      case 'ArrowUp':
        if (activeIndex > 0) {
          setActiveIndex(prev => prev - 1)
        } else setActiveIndex(lastIndex)
        break
      case 'Escape':
        onEscape()
        break
      default:
        break
    }
  }

  const onImportToken = (item: SuggestionPairData) => {
    const list = [findToken(item.tokenIn), findToken(item.tokenOut)].filter(Boolean) as Token[]
    if (list.length) {
      setTokensNotInDefault(list)
      refSelectedPair.current = item
    }
  }

  const hideModalImport = () => {
    setTokensNotInDefault([])
  }

  const onConfirmModalImport = () => {
    hideListView()
    if (refSelectedPair.current) {
      onSelectPair(refSelectedPair.current)
      refSelectedPair.current = null
    }
    setTokensNotInDefault([])
  }

  const onBlurInput = (e: FocusEvent) => {
    if (isMobile) return
    const relate = e.relatedTarget as HTMLDivElement
    console.log(123, relate)

    if (relate && relate.classList.contains('no-blur')) {
      return // press star / import icon
    }
    hideListView()
  }

  const isNotfound = !loading && searchQuery && !suggestedPairs.length

  const ListView = () =>
    showList ? (
      <MenuFlyout tabIndex={0} className="no-blur">
        {loading ? (
          <TextWithIcon text="Loading tokens" icon={<Loader stroke={theme.text} />} />
        ) : isNotfound ? (
          <TextWithIcon
            text="We could not find anything. Try again."
            icon={<AlertTriangle color={theme.text} size={17} />}
          />
        ) : null}
        {!searchQuery && (
          <>
            {favoritePairs.length > 0 && (
              <Container>
                <Title>
                  <Flex justifyContent="space-between">
                    <Trans>Favourites</Trans>
                    <div>
                      {favoritePairs.length}/{MAX_FAVORITE_PAIRS}
                    </div>
                  </Flex>
                </Title>
              </Container>
            )}
            {favoritePairs.map((item, i) => (
              <SuggestItem
                onSelectPair={() => onSelectPair(item)}
                removeFavorite={() => removeFavorite(item, i)}
                onImportToken={() => onImportToken(item)}
                amount={suggestedAmount}
                isActive={activeIndex === i}
                data={item}
                isFavorite
                key={item.tokenIn + item.tokenOut}
              />
            ))}
            <Container>
              {!favoritePairs.length && (
                <Flex alignItems="center">
                  <Star color={theme.text3} size={20} />
                  <Text color={theme.text3} marginLeft="7px">
                    <Trans>Your favourite pairs will appear here</Trans>
                  </Text>
                </Flex>
              )}
            </Container>
            <Break />
          </>
        )}
        <div>
          {suggestedPairs.length > 0 && (
            <>
              <Container>
                <Title>
                  <Trans>Top traded pairs</Trans>
                </Title>
              </Container>
              {suggestedPairs.map((item, i) => (
                <SuggestItem
                  onSelectPair={() => onSelectPair(item)}
                  addToFavorite={() => addToFavorite(item, i)}
                  onImportToken={() => onImportToken(item)}
                  amount={suggestedAmount}
                  isActive={activeIndex === favoritePairs.length + i}
                  data={item}
                  key={item.tokenIn + item.tokenOut}
                />
              ))}
              <Break />
            </>
          )}
        </div>
        <Container>
          <Text color={theme.subText}>
            <Trans>You can try &quot;10 ETH to KNC&quot;</Trans>
          </Text>
        </Container>
      </MenuFlyout>
    ) : null

  const Search = ({
    hasBorder = false,
    refInput,
  }: {
    hasBorder?: boolean
    refInput: React.RefObject<HTMLInputElement> | null
  }) => (
    <SearchWrapper showList={showList}>
      <SearchIcon size={18} />
      <SearchInput
        ref={refInput}
        hasBorder={hasBorder}
        onBlur={onBlurInput}
        onClick={showListView}
        type="text"
        placeholder={t`You can try "10 ETH to KNC"`}
        value={searchQuery}
        onChange={onChangeInput}
        autoComplete="off"
        onKeyDown={onKeyPress}
      />
      {showList && !isMobile && <EscIcon onClick={onEscape}>Esc</EscIcon>}
    </SearchWrapper>
  )

  return (
    <Wrapper>
      {Search({ refInput: isMobile ? null : refInput })}

      <BrowserView>
        <ListView />
      </BrowserView>
      <MobileView>
        <Modal isOpen={showList} onDismiss={hideListView}>
          <WrapperPopup>
            <Container style={{ background: theme.tableHeader, paddingTop: 20 }}>
              {Search({ hasBorder: true, refInput })}
            </Container>
            <ListView />
          </WrapperPopup>
        </Modal>
      </MobileView>

      {tokensNotInDefault.length && (
        <TokenWarningModal
          isOpen={true}
          tokens={tokensNotInDefault}
          onConfirm={onConfirmModalImport}
          onDismiss={hideModalImport}
        />
      )}
    </Wrapper>
  )
}
