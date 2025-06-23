import { ChainId } from '@kyberswap/ks-sdk-core'
import { Trans, t } from '@lingui/macro'
import React, { useEffect, useRef, useState } from 'react'
import { ArrowLeft } from 'react-feather'
import { Box, Flex, Text } from 'rebass'
import styled from 'styled-components'

import Checkbox from 'components/CheckBox'
import useDebounce from 'hooks/useDebounce'
import { useAllDexes, useExcludeDexes } from 'state/customizeDexes/hooks'

import { LiquiditySourceGroup } from './Group'
import SearchBar from './SearchBar'
import { ImageWrapper, Source, SourceName } from './styles'

type Props = {
  onBack: () => void
  chainId?: ChainId
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

const LiquiditySourcesPanel: React.FC<Props> = ({ onBack, chainId }) => {
  const [searchText, setSearchText] = useState('')
  const debouncedSearchText = useDebounce(searchText.toLowerCase(), 200).trim()

  const dexes = useAllDexes(chainId)
  const [excludeDexes, setExcludeDexes] = useExcludeDexes(chainId)

  const tagMap: { [key: number]: { name: string; id: number; logoURL: string } } = {}
  dexes?.forEach(item => {
    item.tags?.forEach(tag => {
      tagMap[tag.id] = tag
    })
  })

  const checkAllRef = useRef<HTMLInputElement | null>(null)

  useEffect(() => {
    const selectedDexes = dexes?.filter(item => !excludeDexes.includes(item.id)) || []

    if (!checkAllRef.current) return

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
          {Object.values(tagMap).map(tag => {
            return <LiquiditySourceGroup tag={tag} debouncedSearchText={debouncedSearchText} key={tag.id} />
          })}

          {dexes
            ?.filter(item => !item.tags && item.name.toLowerCase().includes(debouncedSearchText))
            .map(({ name, logoURL, id }) => (
              <Source key={id}>
                <Checkbox checked={!excludeDexes.includes(id)} onChange={() => handleToggleDex(id)} />

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
