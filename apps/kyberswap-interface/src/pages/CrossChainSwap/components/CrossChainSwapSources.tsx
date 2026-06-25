import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'

import CheckBox from 'components/CheckBox'
import { HStack, Stack } from 'components/Stack'
import { BackIconWrapper, LiquiditySourceHeader, SourceList } from 'components/swapv2/LiquiditySourcesPanel'
import SearchBar from 'components/swapv2/LiquiditySourcesPanel/SearchBar'
import { ImageWrapper, Source, SourceName } from 'components/swapv2/LiquiditySourcesPanel/styles'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { CrossChainSwapFactory } from 'pages/CrossChainSwap/factory'
import { updateExcludedSources } from 'state/crossChainSwap'
import { useAppDispatch, useAppSelector } from 'state/hooks'

export const CrossChainSwapSources: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { trackingHandler } = useTracking()
  const [searchText, setSearchText] = useState('')

  const checkAllRef = useRef<HTMLInputElement | null>(null)

  const sources = CrossChainSwapFactory.getAllAdapters()
  const excludedSources = useAppSelector(state => state.crossChainSwap.excludedSources || [])
  const selectedSources = sources?.filter(item => !excludedSources.includes(item.getName())) || []
  const dispatch = useAppDispatch()

  const handleToggleSource = (sourceName: string) => {
    const isExclude = excludedSources.find(i => i === sourceName)
    const enabled = !!isExclude
    if (isExclude) {
      dispatch(updateExcludedSources(excludedSources.filter(ex => ex !== sourceName)))
    } else {
      dispatch(updateExcludedSources([...excludedSources, sourceName]))
    }
    trackingHandler(TRACKING_EVENT_TYPE.CC_ROUTING_SOURCE_TOGGLED, {
      source_name: sourceName,
      enabled,
      total_enabled: enabled
        ? sources.length - excludedSources.length + 1
        : sources.length - excludedSources.length - 1,
      total_available: sources.length,
    })
  }
  useEffect(() => {
    if (!checkAllRef.current) return
    if (selectedSources.length === sources.length) {
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    } else if (!selectedSources.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = false
    } else if (selectedSources.length < sources.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = true
    }
  }, [selectedSources.length, sources.length])

  return (
    <Stack className="w-full gap-5">
      <HStack className="items-center gap-1">
        <BackIconWrapper onClick={onBack} />
        <span className="text-lg font-medium text-text">
          <Trans>Liquidity Sources</Trans>
        </span>
      </HStack>

      <SearchBar text={searchText} setText={setSearchText} />

      <LiquiditySourceHeader>
        <HStack className="items-center gap-3">
          <CheckBox
            ref={checkAllRef}
            className="cursor-pointer"
            onChange={e => {
              if (!e.currentTarget.checked) {
                dispatch(updateExcludedSources(sources.map(item => item.getName())))
              } else {
                dispatch(updateExcludedSources([]))
              }
            }}
          />
          <span>
            <Trans>Liquidity Sources</Trans>
          </span>
        </HStack>
        <span className="text-subText">
          {selectedSources.length}/{sources.length}
        </span>
      </LiquiditySourceHeader>

      <SourceList>
        {sources
          ?.filter(item => item.getName().toLowerCase().includes(searchText.toLowerCase().trim()))
          .map(item => (
            <Source key={item.getName()} onClick={() => handleToggleSource(item.getName())}>
              <CheckBox
                checked={!excludedSources.includes(item.getName())}
                onChange={() => handleToggleSource(item.getName())}
                onClick={e => e.stopPropagation()}
              />

              <ImageWrapper>
                <img src={item.getIcon()} alt="" />
              </ImageWrapper>

              <SourceName>{item.getName()}</SourceName>
            </Source>
          ))}
      </SourceList>
    </Stack>
  )
}
