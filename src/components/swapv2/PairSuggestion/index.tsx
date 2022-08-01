import React, { useCallback, useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import styled from 'styled-components'
import { reqAddFavoritePair, reqGetSuggestionPair, reqRemoveFavoritePair, SuggestionPairData } from './request'
import { debounce } from 'lodash'
import ListPair from './ListPair'
import SearchInput from './SearchInput'
import { ChainId, NativeCurrency, Token } from '@kyberswap/ks-sdk-core'
import { BrowserView, isMobile, MobileView } from 'react-device-detect'
import Modal from 'components/Modal'
import { useActiveWeb3React } from 'hooks'
import { filterTokens } from 'utils/filtering'
import { ETHER_ADDRESS } from 'constants/index'
import { nativeOnChain } from 'constants/tokens'
import useParsedQueryString from 'hooks/useParsedQueryString'
import { useHistory } from 'react-router-dom'
import { stringify } from 'qs'
import { findLogoAndSortPair, getAddressParam, isActivePair, isFavoritePair } from './utils'
import { useAllTokens } from 'hooks/Tokens'

const Wrapper = styled.div`
  position: relative;
  width: 100%;
`

const WrapperPopup = styled(Wrapper)`
  height: 75vh;
  background-color: ${({ theme }) => theme.tabActive};
`

export const Container = styled.div`
  padding-left: 1em;
  padding-right: 1em;
  display: flex;
  flex-direction: column;
  row-gap: 1em;
`

export const MAX_FAVORITE_PAIRS = 3

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

  const [selectedIndex, setSelectedIndex] = useState(0) // index selected when press up/down arrow
  const [isShowListPair, setIsShowListPair] = useState(false)

  const [suggestedPairs, setSuggestions] = useState<SuggestionPairData[]>([])
  const [favoritePairs, setListFavorite] = useState<SuggestionPairData[]>([])
  const [suggestedAmount, setSuggestedAmount] = useState<string>('')

  const { account, chainId } = useActiveWeb3React()
  const qs = useParsedQueryString()
  const history = useHistory()

  const refLoading = useRef(false) // prevent spam call api
  const refInput = useRef<HTMLInputElement>(null)

  const activeTokens = useAllTokens(true)

  const findToken = (search: string): NativeCurrency | Token | undefined => {
    if (search.toLowerCase() === ETHER_ADDRESS.toLowerCase()) {
      return nativeOnChain(chainId as ChainId)
    }
    return filterTokens(Object.values(activeTokens), search)[0]
  }

  const searchSuggestionPair = (keyword = '') => {
    reqGetSuggestionPair(chainId, account, keyword)
      .then(({ recommendedPairs = [], favoritePairs = [], amount }) => {
        setSuggestions(findLogoAndSortPair(activeTokens, recommendedPairs, chainId))
        setListFavorite(findLogoAndSortPair(activeTokens, favoritePairs, chainId))
        setSuggestedAmount(amount || '')
      })
      .catch(e => {
        console.log(e)
        setSuggestions([])
        setListFavorite([])
      })
  }

  const searchDebounce = useCallback(debounce(searchSuggestionPair, 300), [chainId, account])

  const addToFavorite = (item: SuggestionPairData) => {
    refInput.current?.focus()
    if (favoritePairs.length === MAX_FAVORITE_PAIRS || refLoading.current) return // prevent spam api
    refLoading.current = true
    reqAddFavoritePair(item, account, chainId)
      .then(() => {
        searchSuggestionPair(searchQuery)
      })
      .catch(console.error)
      .finally(() => {
        refLoading.current = false
      })
  }

  const removeFavorite = (item: SuggestionPairData) => {
    refInput.current?.focus()
    if (refLoading.current) return // prevent spam api
    refLoading.current = true
    reqRemoveFavoritePair(item, account, chainId)
      .then(() => {
        searchSuggestionPair(searchQuery)
      })
      .catch(console.error)
      .finally(() => {
        refLoading.current = false
      })
  }

  const onClickStar = (item: SuggestionPairData) => {
    if (isFavoritePair(favoritePairs, item)) {
      removeFavorite(item)
    } else {
      addToFavorite(item)
    }
  }

  const hideListView = () => {
    setIsShowListPair(false)
    setSelectedIndex(0)
    refInput.current?.blur()
  }
  const showListView = () => {
    setIsShowListPair(true)
    refInput.current?.focus()
  }

  useEffect(() => {
    function onKeydown(e: KeyboardEvent) {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        // cmd+k or ctrl+k
        e.preventDefault()
        showListView()
      }
    }
    window.addEventListener('keydown', onKeydown)
    return () => {
      window.removeEventListener('keydown', onKeydown)
    }
  }, [])

  useEffect(() => {
    if (isShowListPair) {
      searchSuggestionPair(searchQuery)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isShowListPair])

  useEffect(() => {
    setSearchQuery('')
  }, [chainId])

  const onChangeInput = (value: string) => {
    setSearchQuery(value)
    searchDebounce(value)
  }

  const onSelectPair = (item: SuggestionPairData) => {
    if (!isActivePair(activeTokens, item)) {
      // show import modal
      const newQs = {
        ...qs,
        inputCurrency: getAddressParam(item.tokenIn, chainId),
        outputCurrency: getAddressParam(item.tokenOut, chainId),
      }
      history.push({
        search: stringify(newQs),
      })
      setShowModalImportToken(true)
      return
    }
    // select pair fill input swap form
    const fromToken = findToken(item.tokenIn)
    const toToken = findToken(item.tokenOut)
    onSelectSuggestedPair(fromToken, toToken, suggestedAmount)
    setIsShowListPair(false)
  }

  useImperativeHandle(ref, () => ({
    onConfirmImportToken() {
      setIsShowListPair(false)
      if (suggestedAmount) {
        onSelectSuggestedPair(null, null, suggestedAmount) // fill input amount
      }
    },
  }))

  const onKeyPressInput = (e: React.KeyboardEvent) => {
    const lastIndex = suggestedPairs.length + favoritePairs.length - 1
    switch (e.key) {
      case 'ArrowDown':
        if (selectedIndex < lastIndex) {
          setSelectedIndex(prev => prev + 1)
        } else setSelectedIndex(0)
        break
      case 'ArrowUp':
        if (selectedIndex > 0) {
          setSelectedIndex(prev => prev - 1)
        } else setSelectedIndex(lastIndex)
        break
      case 'Escape':
        hideListView()
        break
      case 'Enter':
        const selectedPair = favoritePairs.concat(suggestedPairs)[selectedIndex]
        onSelectPair(selectedPair)
        break
      default:
        break
    }
  }

  const propsListPair = {
    suggestedAmount,
    selectedIndex,
    isSearch: !!searchQuery,
    isShowListPair,
    suggestedPairs,
    favoritePairs,
    onClickStar,
    onSelectPair,
  }

  const propsSearch = {
    isShowListPair,
    value: searchQuery,
    showListView,
    hideListView,
    onChangeInput,
    onKeyPressInput,
  }

  return (
    <Wrapper>
      <SearchInput ref={refInput} {...propsSearch} disabled={isMobile} />
      <BrowserView>
        <ListPair {...propsListPair} hasShadow />
      </BrowserView>
      <MobileView>
        <Modal isOpen={isShowListPair} onDismiss={hideListView} enableInitialFocusInput={true}>
          <WrapperPopup>
            <Container style={{ paddingTop: 20 }}>
              <SearchInput ref={refInput} hasBorder {...propsSearch} />
            </Container>
            <ListPair {...propsListPair} />
          </WrapperPopup>
        </Modal>
      </MobileView>
    </Wrapper>
  )
})
