import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'
import { Box, Flex, Text } from 'rebass'

import CheckBox from 'components/CheckBox'
import { BackIconWrapper, LiquiditySourceHeader, SourceList } from 'components/swapv2/LiquiditySourcesPanel'
import SearchBar from 'components/swapv2/LiquiditySourcesPanel/SearchBar'
import { ImageWrapper, Source, SourceName } from 'components/swapv2/LiquiditySourcesPanel/styles'
import useTheme from 'hooks/useTheme'
import { updateExcludedSources } from 'state/crossChainSwap'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { CrossChainSwapFactory } from '../factory'

export const CrossChainSwapSources: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const theme = useTheme()
  const [searchText, setSearchText] = useState('')

  const checkAllRef = useRef<HTMLInputElement | null>(null)

  const sources = CrossChainSwapFactory.getAllAdapters()
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources || [])
  const dispatch = useAppDispatch()

  useEffect(() => {
    const selected = sources?.filter(item => !excludedSources.includes(item.getName())) || []

    if (!checkAllRef.current) return
    if (selected.length === sources.length) {
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    } else if (!selected.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = false
    } else if (selected.length < sources.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = true
    }
  }, [excludedSources, sources])

  return (
    <Box width="100%">
      <Flex
        width={'100%'}
        flexDirection={'column'}
        sx={{
          rowGap: '20px',
        }}
      >
        <Flex
          alignItems="center"
          sx={{
            // this is to make the arrow stay exactly where it stays in Swap panel
            marginTop: '5px',
          }}
        >
          <BackIconWrapper onClick={onBack}></BackIconWrapper>
          <Text color={theme.text} fontWeight={500} fontSize={18}>
            <Trans>Liquidity Sources</Trans>
          </Text>
        </Flex>

        <SearchBar text={searchText} setText={setSearchText} />

        <LiquiditySourceHeader>
          <CheckBox
            ref={checkAllRef}
            onChange={e => {
              if (!e.currentTarget.checked) {
                dispatch(updateExcludedSources(sources.map(item => item.getName())))
              } else {
                dispatch(updateExcludedSources([]))
              }
            }}
          />
          <Text>
            <Trans>Liquidity Sources</Trans>
          </Text>
        </LiquiditySourceHeader>

        <SourceList>
          {sources
            ?.filter(item => item.getName().toLowerCase().includes(searchText.toLowerCase().trim()))
            .map(item => (
              <Source key={item.getName()}>
                <CheckBox
                  checked={!excludedSources.includes(item.getName())}
                  onChange={() => {
                    const isExclude = excludedSources.find(i => i === item.getName())
                    if (isExclude) {
                      dispatch(updateExcludedSources(excludedSources.filter(ex => ex !== item.getName())))
                    } else {
                      dispatch(updateExcludedSources([...excludedSources, item.getName()]))
                    }
                  }}
                />

                <ImageWrapper>
                  <img src={item.getIcon()} alt="" />
                </ImageWrapper>

                <SourceName>{item.getName()}</SourceName>
              </Source>
            ))}
        </SourceList>
      </Flex>
    </Box>
  )
}
