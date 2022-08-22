import { Trans, t } from '@lingui/macro'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import { Checkbox } from 'components/YieldPools/ProMMFarmModals/styled'
import useDebounce from 'hooks/useDebounce'
import { useAllDexes, useExcludeDexes } from 'state/user/hooks'

import SearchBar from './SearchBar'

type Props = {
  onBack: () => void
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
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.toLowerCase(), 200).trim()

  const dexes = useAllDexes()
  const [excludeDexes, setExcludeDexes] = useExcludeDexes()

  const checkAllRef = useRef<any>()
  const kyberSwapRef = useRef<any>()

  const kyberswapDexes = useMemo(() => {
    return [
      {
        name: 'KyberSwap Elastic',
        id: 'kyberswapv2',
        logoURL: 'https://kyberswap.com/favicon.ico',
      },
      {
        name: 'KyberSwap Classic',
        id: 'kyberswapv1',
        logoURL: 'https://kyberswap.com/favicon.ico',
      },
    ]
  }, [])

  useEffect(() => {
    const selectedDexes = dexes?.filter(item => !excludeDexes.includes(item.id)) || []

    if (selectedDexes.length === dexes?.length) {
      checkAllRef.current.checked = true
      checkAllRef.current.indeterminate = false
    } else if (!selectedDexes.length) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = false
    } else if (selectedDexes.length < (dexes?.length || 0)) {
      checkAllRef.current.checked = false
      checkAllRef.current.indeterminate = true
    }
  }, [excludeDexes, dexes])

  useEffect(() => {
    if (excludeDexes.includes('kyberswapv2') && excludeDexes.includes('kyberswapv1')) {
      kyberSwapRef.current.checked = false
      kyberSwapRef.current.indeterminate = false
    } else if (!excludeDexes.includes('kyberswapv1') && !excludeDexes.includes('kyberswapv2')) {
      kyberSwapRef.current.checked = true
      kyberSwapRef.current.indeterminate = false
    } else {
      kyberSwapRef.current.checked = false
      kyberSwapRef.current.indeterminate = true
    }
  }, [excludeDexes, kyberswapDexes])

  const handleToggleDex = (id: string) => {
    const isExclude = excludeDexes.find(item => item === id)
    if (isExclude) {
      setExcludeDexes(excludeDexes.filter(item => item !== id))
    } else {
      setExcludeDexes([...excludeDexes, id])
    }
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
              if (!e.currentTarget.checked) {
                setExcludeDexes(dexes?.map(item => item.id) || [])
              } else {
                setExcludeDexes([])
              }
            }}
          />
          <Text>
            <Trans>Liquidity Sources</Trans>
          </Text>
        </LiquiditySourceHeader>

        <SourceList>
          {!!kyberswapDexes.length &&
            !!kyberswapDexes.filter(item => item.name.toLowerCase().includes(debouncedSearchText)).length && (
              <>
                <Source>
                  <Checkbox
                    type="checkbox"
                    ref={kyberSwapRef}
                    onChange={e => {
                      if (e.target.checked) {
                        setExcludeDexes([])
                      } else {
                        setExcludeDexes(['kyberswap', 'kyberswapv2', 'kyberswap-static'])
                      }
                    }}
                  />
                  <ImageWrapper>
                    <img src="https://kyberswap.com/favicon.ico" alt="ks logo" />
                  </ImageWrapper>
                  <SourceName>Kyberswap - All</SourceName>
                </Source>

                {kyberswapDexes
                  .filter(item => item.name.toLowerCase().includes(debouncedSearchText))
                  .map(({ name, logoURL, id }) => {
                    return (
                      <Source key={name} style={{ padding: '12px 48px' }}>
                        <Checkbox
                          type="checkbox"
                          checked={!excludeDexes.includes(id)}
                          onChange={() => handleToggleDex(id)}
                        />

                        <ImageWrapper>
                          <img src={logoURL} alt="" />
                        </ImageWrapper>

                        <SourceName>{name}</SourceName>
                      </Source>
                    )
                  })}
              </>
            )}
          {dexes
            ?.filter(item => item.name.toLowerCase().includes(debouncedSearchText))
            .map(({ name, logoURL, id }) => (
              <Source key={name}>
                <Checkbox type="checkbox" checked={!excludeDexes.includes(id)} onChange={() => handleToggleDex(id)} />

                <ImageWrapper>
                  <img src={logoURL} alt="" />
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
