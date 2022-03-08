import React, { CSSProperties } from 'react'
import styled from 'styled-components'
import { Flex, Text } from 'rebass'
import { rgba } from 'polished'

const MAX_TAGS = 5

const Tags = ({ tags, style }: { tags: string[] | null; style?: CSSProperties }) => {
  return (
    <TagContainer style={style}>
      {(tags ?? []).slice(0, MAX_TAGS).map(tag => (
        <Tag key={tag}>{tag}</Tag>
      ))}
    </TagContainer>
  )
}

export default Tags

const Tag = styled(Text)`
  font-size: 10px;
  color: ${({ theme }) => theme.subText};
  padding: 5px 8px;
  border-radius: 24px;
  background: ${({ theme }) => rgba(theme.subText, 0.2)};
  cursor: pointer;
  min-width: max-content !important;

  &:hover {
    background: ${({ theme }) => rgba(theme.subText, 0.1)};
  }
`

const TagContainer = styled(Flex)`
  align-items: center;
  gap: 4px;
  flex: 1;
  overflow: auto;
  position: relative;

  &::-webkit-scrollbar {
    display: none;
  }

  scrollbar-width: none;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    overflow: unset;
    flex-wrap: wrap;
  `}
`
