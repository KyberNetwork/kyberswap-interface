import React, { FocusEvent, useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { t, Trans } from '@lingui/macro'
import { Flex, Text } from 'rebass'
import { Star, Search, AlertTriangle, Command } from 'react-feather'
import useTheme from 'hooks/useTheme'
import styled, { css } from 'styled-components'
import { Z_INDEXS } from 'constants/styles'
import { reqAddFavoritePair, reqGetSuggestionPair, reqRemoveFavoritePair, SuggestionPairData } from './request'
import { debounce } from 'lodash'
import PairSuggestionItem from './PairSuggestionItem'
import { ChainId, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import { BrowserView, isMobile, MobileView } from 'react-device-detect'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { searchInactiveTokenLists, useAllTokens } from 'hooks/Tokens'
import { useAllLists, useInactiveListUrls } from 'state/lists/hooks'
import { filterTokens } from 'utils/filtering'
import { getTokenLogoURL } from 'utils'
import { ETHER_ADDRESS } from 'constants/index'
import { nativeOnChain } from 'constants/tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory } from 'react-router-dom'
import { stringify } from 'qs'
const Break = styled.div`
  border-top: 1px solid ${({ theme }) => theme.border};
  margin: 1em 0;
`

const Title = styled.div`
  font-size: 13px;
  color: ${({ theme }) => theme.subText};
  margin-bottom: 5px;
`

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const WrapperPopup = styled(Wrapper)`
  height: 75vh;
  background-color: ${({ theme }) => theme.background};
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
  background-color: ${({ theme }) => theme.background};
  height: ${INPUT_HEIGHT};
  ${({ theme }) => theme.mediaWidth.upToMedium`
    border-bottom:none;
  `}
`
const SearchInput = styled.input<{ hasBorder?: boolean }>`
  ::placeholder {
    color: ${({ theme }) => theme.border};
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
  color: ${({ theme }) => theme.subText};
  font-size: 14px;
`
const InputIcon = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  padding: 3px 8px;
  margin-right: 10px;
  border-radius: 22px;
  font-size: 12px;
  color: ${({ theme }) => theme.subText};
  cursor: pointer;
`

const Container = styled.div`
  padding-left: 1em;
  padding-right: 1em;
  display: flex;
  flex-direction: column;
  row-gap: 1em;
`
const MenuFlyout = styled.div<{ position: string }>`
  overflow: auto;
  background-color: ${({ theme }) => theme.background};
  border-radius: 5px;
  padding: 1rem 0;
  display: flex;
  flex-direction: column;
  font-size: 14px;
  position: ${({ position }) => position};
  top: ${INPUT_HEIGHT};
  left: 0;
  right: 0;
  z-index: ${Z_INDEXS.SUGGESTION_PAIR};
`

const MAX_FAVORITE_PAIRS = 3

const TextWithIcon = ({ text, icon, color }: { text: string; icon: JSX.Element; color: string }) => (
  <>
    <Flex justifyContent="center">
      {icon}
      <span style={{ marginLeft: 7, color }}>
        <Trans>{text}</Trans>...
      </span>
    </Flex>
    <Break />
  </>
)

type Props = {
  onSelectSuggestedPair: (
    fromToken: NativeCurrency | Token | undefined | null,
    toToken: NativeCurrency | Token | undefined | null,
    amount: string,
  ) => void
  setShowModalImportToken: (val: boolean) => void
}
export type PairSuggestionHandle = {
  onConfirmImportToken: () => void
}
export default forwardRef<PairSuggestionHandle, Props>(function PairSuggestionInput(
  { onSelectSuggestedPair, setShowModalImportToken },
  ref,
) {
  const [searchQuery, setSearchQuery] = useState('')

  const [activeIndex, setActiveIndex] = useState(0) // index selected when press up/down arrow
  const [showList, setShowList] = useState(false)
  const [loading, setLoading] = useState(false)

  const [suggestedPairs, setSuggestions] = useState<SuggestionPairData[]>([])
  const [favoritePairs, setListFavorite] = useState<SuggestionPairData[]>([])
  const [suggestedAmount, setSuggestedAmount] = useState<string>('')

  const { account, chainId } = useActiveWeb3React()
  const theme = useTheme()

  const refLoading = useRef(false) // prevent spam call api
  const refInput = useRef<HTMLInputElement>(null) // input fill text
  const refInput2 = useRef<HTMLInputElement>(null) // input trigger popup

  const refIsInited = useRef(false)

  const activeList = useAllLists()
  const inactiveUrls = useInactiveListUrls()
  const activeTokens = useAllTokens(true)

  const findToken = (search: string): NativeCurrency | Token | undefined => {
    // search active first and then search inactive
    if (search.toLowerCase() === ETHER_ADDRESS.toLowerCase()) {
      return nativeOnChain(chainId as ChainId)
    }
    return (
      filterTokens(Object.values(activeTokens), search)[0] ||
      searchInactiveTokenLists({
        search,
        minResults: 1,
        activeList,
        inactiveUrls,
        chainId,
        activeTokens: activeTokens,
      })[0]
    )
  }

  const findLogo = (list: SuggestionPairData[]) => {
    return list.map(token => {
      if (!token.tokenInImgUrl) {
        token.tokenInImgUrl = getTokenLogoURL(token.tokenIn, chainId)
      }
      if (!token.tokenOutImgUrl) {
        token.tokenOutImgUrl = getTokenLogoURL(token.tokenOut, chainId)
      }
      return token
    })
  }

  const searchSuggestionPair = (keyword = '') => {
    setLoading(true)
    reqGetSuggestionPair(chainId, account, keyword)
      .then(({ recommendedPairs = [], favoritePairs = [], amount }) => {
        setSuggestions(findLogo(recommendedPairs))
        setListFavorite(findLogo(favoritePairs))
        amount && setSuggestedAmount(amount)
      })
      .catch(e => {
        console.log(e)
        setSuggestions([])
        setListFavorite([])
      })
      .finally(() => {
        setLoading(false)
      })
  }

  const addToFavorite = (item: SuggestionPairData, index: number) => {
    refInput.current?.focus()
    if (favoritePairs.length === MAX_FAVORITE_PAIRS || refLoading.current) return
    refLoading.current = true
    reqAddFavoritePair(item, account, chainId)
      .then(() => {
        setListFavorite(favoritePairs.concat(item))
        setSuggestions(suggestedPairs.filter((_, i) => i !== index))
      })
      .catch(console.error)
      .finally(() => {
        refLoading.current = false
      })
  }

  const removeFavorite = (item: SuggestionPairData, index: number) => {
    refInput.current?.focus()
    if (refLoading.current) return
    refLoading.current = true
    reqRemoveFavoritePair(item, account, chainId)
      .then(() => {
        setListFavorite(favoritePairs.filter((_, i) => i !== index))
        setSuggestions(suggestedPairs.concat(item))
      })
      .catch(console.error)
      .finally(() => {
        refLoading.current = false
      })
  }

  const searchDebounce = useCallback(debounce(searchSuggestionPair, 300), [])

  const hideListView = () => {
    setShowList(false)
    setActiveIndex(0)
    setTimeout(
      () => {
        refInput.current?.blur()
        refInput2.current?.blur()
      },
      isMobile ? 500 : 0,
    )
  }
  const showListView = () => {
    setShowList(true)
    refInput.current?.focus()
  }

  useEffect(() => {
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

  useEffect(() => {
    if (showList && !refIsInited.current) {
      searchDebounce() // get default data
      refIsInited.current = true
    }
  }, [showList, searchDebounce])

  useEffect(() => {
    setSearchQuery('')
    refIsInited.current = false
  }, [chainId])

  const onChangeInput = (event: React.FormEvent<HTMLInputElement>) => {
    const { value: keyword } = event.currentTarget
    setSearchQuery(keyword)
    searchDebounce(keyword)
  }

  const isTokenInWhiteList = (address: string) =>
    address.toLowerCase() === ETHER_ADDRESS.toLowerCase() ? true : activeTokens[address]

  const qs = useParsedQueryString()
  const history = useHistory()

  const onSelectPair = (item: SuggestionPairData) => {
    const token1Active = isTokenInWhiteList(item.tokenIn)
    const token2Active = isTokenInWhiteList(item.tokenOut)
    if (!token1Active || !token2Active) {
      // import
      const newQs = { ...qs, inputCurrency: item.tokenIn, outputCurrency: item.tokenOut, pairSuggest: 1 }
      history.push({
        search: stringify(newQs),
      })
      setShowModalImportToken(true)
    } else {
      // select
      const fromToken = findToken(item.tokenIn)
      const toToken = findToken(item.tokenOut)
      onSelectSuggestedPair(fromToken, toToken, suggestedAmount)
      setShowList(false)
    }
  }

  useImperativeHandle(ref, () => ({
    onConfirmImportToken() {
      setShowList(false)
      if (suggestedAmount) {
        onSelectSuggestedPair(null, null, suggestedAmount) // fill input amount
      }
    },
  }))

  const onEscape = () => {
    hideListView()
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

  const onBlurInput = (e: FocusEvent) => {
    if (isMobile) return
    const relate = e.relatedTarget as HTMLDivElement
    if (relate && relate.classList.contains('no-blur')) {
      return // press star / import icon
    }
    hideListView()
  }

  const isNotfound = !loading && searchQuery && !suggestedPairs.length

  const ListView = () =>
    showList ? (
      <MenuFlyout tabIndex={0} className="no-blur" position={isMobile ? 'unset' : 'absolute'}>
        {loading
          ? null
          : isNotfound && (
              <TextWithIcon
                color={theme.subText}
                text="We could not find anything. Try again."
                icon={<AlertTriangle color={theme.subText} size={17} />}
              />
            )}
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
              <PairSuggestionItem
                onSelectPair={() => onSelectPair(item)}
                removeFavorite={() => removeFavorite(item, i)}
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
                <PairSuggestionItem
                  onSelectPair={() => onSelectPair(item)}
                  addToFavorite={() => addToFavorite(item, i)}
                  removeFavorite={() => removeFavorite(item, i)}
                  amount={suggestedAmount}
                  isActive={activeIndex === favoritePairs.length + i}
                  data={item}
                  key={item.tokenIn + item.tokenOut}
                  isFavorite={favoritePairs.some(
                    ({ tokenIn, tokenOut }) => item.tokenIn === tokenIn && item.tokenOut === tokenOut,
                  )}
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
      {showList && !isMobile && <InputIcon onClick={onEscape}>Esc</InputIcon>}
      {!showList && !isMobile && (
        <InputIcon onClick={showListView}>
          <Flex>
            <Command size={13} />
            <span style={{ marginLeft: 3 }}>K</span>
          </Flex>
        </InputIcon>
      )}
    </SearchWrapper>
  )

  return (
    <Wrapper>
      {Search({ refInput: isMobile ? refInput2 : refInput })}

      <BrowserView>
        <ListView />
      </BrowserView>
      <MobileView>
        <Modal isOpen={showList} onDismiss={hideListView} enableInitialFocusInput={true}>
          <WrapperPopup>
            <Container style={{ paddingTop: 20 }}>{Search({ hasBorder: true, refInput })}</Container>
            <ListView />
          </WrapperPopup>
        </Modal>
      </MobileView>
    </Wrapper>
  )
})
