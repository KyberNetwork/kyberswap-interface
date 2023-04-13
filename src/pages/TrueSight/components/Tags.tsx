import { rgba } from 'polished'
import { CSSProperties } from 'react'
import { useMedia } from 'react-use'
import { Flex, Text } from 'rebass'
import styled from 'styled-components'

import HorizontalScroll from 'components/HorizontalScroll'

import { TrueSightFilter } from '..'

const Tags = ({
  tags,
  setFilter,
  style,
  backgroundColor,
}: {
  tags: string[] | null
  setFilter?: React.Dispatch<React.SetStateAction<TrueSightFilter>>
  style?: CSSProperties
  backgroundColor?: string
}) => {
  const above1200 = useMedia('(min-width: 1200px)')

  if (above1200) {
    return (
      <HorizontalScroll
        items={tags}
        backgroundColor={backgroundColor}
        style={style}
        renderItem={tag => {
          return (
            <Tag
              key={tag}
              onClick={() =>
                setFilter && setFilter(prev => ({ ...prev, selectedTag: tag, selectedTokenData: undefined }))
              }
            >
              {tag}
            </Tag>
          )
        }}
      />
    )
  }

  return (
    <TagContainer style={style}>
      {(tags ?? []).map(tag => (
        <Tag
          key={tag}
          onClick={() => {
            setFilter && setFilter(prev => ({ ...prev, selectedTag: tag, selectedTokenData: undefined }))
          }}
        >
          {tag}
        </Tag>
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

  ${({ theme }) => theme.mediaWidth.upToLarge`
    overflow: unset;
    flex-wrap: wrap;
  `}
`
