import { Trans } from '@lingui/macro'
import { useEffect, useRef, useState } from 'react'

import CheckBox from 'components/CheckBox'
import { BackIconWrapper, LiquiditySourceHeader, SourceList } from 'components/swapv2/LiquiditySourcesPanel'
import SearchBar from 'components/swapv2/LiquiditySourcesPanel/SearchBar'
import { ImageWrapper, Source, SourceName } from 'components/swapv2/LiquiditySourcesPanel/styles'
import useTracking, { TRACKING_EVENT_TYPE } from 'hooks/useTracking'
import { updateExcludedSources } from 'state/crossChainSwap'
import { useAppDispatch, useAppSelector } from 'state/hooks'

import { CrossChainSwapFactory } from '../factory'

export const CrossChainSwapSources: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  const { trackingHandler } = useTracking()
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
    <div className="w-full">
      <div className="flex w-full flex-col gap-y-5">
        <div className="mt-[5px] flex items-center">
          <BackIconWrapper onClick={onBack}></BackIconWrapper>
          <span className="text-lg font-medium text-text">
            <Trans>Liquidity Sources</Trans>
          </span>
        </div>

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
          <span>
            <Trans>Liquidity Sources</Trans>
          </span>
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
                    const enabled = !!isExclude
                    if (isExclude) {
                      dispatch(updateExcludedSources(excludedSources.filter(ex => ex !== item.getName())))
                    } else {
                      dispatch(updateExcludedSources([...excludedSources, item.getName()]))
                    }
                    trackingHandler(TRACKING_EVENT_TYPE.CC_ROUTING_SOURCE_TOGGLED, {
                      source_name: item.getName(),
                      enabled,
                      total_enabled: enabled
                        ? sources.length - excludedSources.length + 1
                        : sources.length - excludedSources.length - 1,
                      total_available: sources.length,
                    })
                  }}
                />

                <ImageWrapper>
                  <img src={item.getIcon()} alt="" />
                </ImageWrapper>

                <SourceName>{item.getName()}</SourceName>
              </Source>
            ))}
        </SourceList>
      </div>
    </div>
  )
}
