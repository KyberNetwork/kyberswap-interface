import { Trans, t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { Checkbox } from 'components/YieldPools/ProMMFarmModals/styled'
import { DexConfig, dexListConfig } from 'constants/dexes'
import { useActiveWeb3React } from 'hooks'
import useAggregatorStats from 'hooks/useAggregatorStats'
import useDebounce from 'hooks/useDebounce'
import { useLiquiditySources } from 'state/user/hooks'

import SearchBar from './SearchBar'

type Props = {
  onBack: () => void
}

type DexInfo = DexConfig & { id: string }

export const extractUniqueDEXes = (dexIDs: string[]): DexInfo[] => {
  const visibleDEXes = dexIDs.map(id => ({ ...dexListConfig[id], id })).filter(Boolean)

  // Names of different IDs can be the same
  const dexConfigByName = visibleDEXes.reduce((acc, dex) => {
    acc[dex.name] = dex

    // Kyberswap Classic have 2 factory contract, we treat it as one to show on UI
    if (dex.id === 'kyberswap' || dex.id === 'kyberswap-static') {
      acc[dex.name].id = 'kyberswapv1'
    }

    return acc
  }, {} as Record<string, DexInfo>)

  return Object.values(dexConfigByName)
}

const BackIconWrapper = styled(ArrowLeft)`
  height: 20px;
  width: 20px;
  margin-right: 10px;
  cursor: pointer;
  path {
    stroke: ${({ theme }) => theme.text} !important;
  }
`

const BackText = styled.span`
  font-size: 18px;
  font-weight: 500;
  color: ${({ theme }) => theme.text};
`

const SourceList = styled.div`
  width: 100%;
  height: 300px;
  max-height: 300px;
  overflow-y: scroll;
  overflow-x: hidden;

  display: flex;
  flex-direction: column;
  row-gap: 24px;

  /* width */
  ::-webkit-scrollbar {
    display: unset;
    width: 8px;
    border-radius: 999px;
  }

  /* Track */
  ::-webkit-scrollbar-track {
    background: transparent;
    border-radius: 999px;
  }

  /* Handle */
  ::-webkit-scrollbar-thumb {
    background: ${({ theme }) => theme.disableText};
    border-radius: 999px;
  }
`

const Source = styled.div`
  width: 100%;
  height: 32px;

  display: flex;
  align-items: center;
  column-gap: 16px;
  padding: 12px;
`

const ImageWrapper = styled.div`
  width: 32px;
  height: 32px;

  display: flex;
  align-items: center;

  img {
    width: 100%;
    height: auto;
  }
`

const SourceName = styled.span`
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
`

const LiquiditySourceHeader = styled.div`
  border-top-right-radius: 8px;
  border-top-left-radius: 8px;
  background: ${({ theme }) => theme.tableHeader};
  text-transform: uppercase;
  font-size: 12px;
  font-weight: 500;
  padding: 12px;
  color: ${({ theme }) => theme.subText};
  display: flex;
  gap: 1rem;
  align-items: center;
`

const LiquiditySourcesPanel: React.FC<Props> = ({ onBack }) => {
  const { chainId } = useActiveWeb3React()
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.toLowerCase(), 200)

  const [liquiditySources, setLiquiditySoures] = useLiquiditySources()

  const neverTouch = liquiditySources === undefined

  const checkAllRef = useRef<any>()

  const { data, error } = useAggregatorStats(chainId)
  const dexIDs = Object.keys(data?.pools || [])

  const visibleDEXes = extractUniqueDEXes(dexIDs).filter(({ name }) => name.toLowerCase().includes(debouncedSearchText))

  const sources = visibleDEXes.map(item => item.id)

  useEffect(() => {
    if (!checkAllRef.current) return
    if (neverTouch) {
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    } else if (sources.length === liquiditySources.length) {
      setLiquiditySoures(undefined)
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    } else if (liquiditySources.length !== 0 && liquiditySources.length < sources.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = true
    } else {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = false
    }
  }, [neverTouch, liquiditySources, sources.length, setLiquiditySoures])

  if (error || !data || !dexIDs.length) {
    onBack()
    return null
  }

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
          <BackText>{t`Liquidity Sources`}</BackText>
        </Flex>

        <SearchBar text={searchText} setText={setSearchText} />

        <LiquiditySourceHeader>
          <Checkbox
            type="checkbox"
            ref={checkAllRef}
            onChange={e => {
              if (e.currentTarget.checked) {
                setLiquiditySoures(undefined)
              } else {
                setLiquiditySoures('')
              }
            }}
          />
          <Text>
            <Trans>Liquidity Sources</Trans>
          </Text>
        </LiquiditySourceHeader>

        <SourceList>
          {visibleDEXes.map(({ name, icon, id }) => (
            <Source key={name}>
              <Checkbox
                type="checkbox"
                checked={neverTouch || liquiditySources?.includes(id)}
                onChange={e => {
                  if (!liquiditySources) {
                    const newSources = sources.filter(item => item !== id)
                    setLiquiditySoures(newSources.join(','))
                  } else if (liquiditySources.includes(id)) {
                    const newSources = liquiditySources.filter(item => item !== id)
                    setLiquiditySoures(newSources.join(','))
                  } else {
                    const newSources = [...liquiditySources, id]
                    setLiquiditySoures(newSources.join(','))
                  }
                }}
              />

              <ImageWrapper>
                <img src={icon} alt="" />
              </ImageWrapper>

              <SourceName>{name}</SourceName>
            </Source>
          ))}
        </SourceList>
      </Flex>
    </Box>
  )
}

export default LiquiditySourcesPanel
