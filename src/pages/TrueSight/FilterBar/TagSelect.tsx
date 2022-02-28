import React, { CSSProperties, useRef, useState } from 'react'
import { Flex, Text } from 'rebass'
import { Trans } from '@lingui/macro'
import useTheme from 'hooks/useTheme'
import { ChevronDown } from 'react-feather'
import styled from 'styled-components'
import { useOnClickOutside } from 'hooks/useOnClickOutside'

const OptionsContainer = styled(Flex)`
  position: absolute;
  bottom: -4px;
  left: 0;
  flex-direction: column;
  z-index: 9999;
  width: 100%;
  transform: translateY(100%);
  border-radius: 4px;
  background: ${({ theme }) => theme.tableHeader};

  & > * {
    padding: 12px;
    &:hover {
      background: ${({ theme }) => theme.background};
    }
  }
`

const TagSelectContainer = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  padding: 10px 12px;
  position: relative;
  border-radius: 4px;
  background: ${({ theme }) => theme.background};
  min-width: 124px;
  cursor: pointer;
`

const TAGS = ['Stable Coin', 'Payments', 'Things', 'Other Things']

const TagSelect = ({ style }: { style?: CSSProperties }) => {
  const theme = useTheme()
  const [isShowTags, setIsShowTags] = useState(false)
  const [selectedTag, setSelectTag] = useState<string>()
  const containerRef = useRef<HTMLDivElement>(null)

  useOnClickOutside(containerRef, () => setIsShowTags(false))

  return (
    <TagSelectContainer onClick={() => setIsShowTags(prev => !prev)} ref={containerRef} style={style}>
      <Text color={selectedTag ? theme.text : theme.disableText} fontSize="12px">
        {selectedTag ?? <Trans>Filter by Tag</Trans>}
      </Text>
      <ChevronDown size={16} color={theme.disableText} />
      <OptionsContainer>
        {isShowTags &&
          TAGS.map((tag, index) => (
            <Text
              key={index}
              color={theme.subText}
              fontSize="12px"
              onClick={() => {
                setSelectTag(tag)
              }}
            >
              <Trans>{tag}</Trans>
            </Text>
          ))}
      </OptionsContainer>
    </TagSelectContainer>
  )
}

export default TagSelect
