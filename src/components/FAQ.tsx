import { rgba } from 'polished'
import { Fragment, ReactNode, useState } from 'react'
import { ChevronDown } from 'react-feather'
import { Flex, Text } from 'rebass'
import styled, { CSSProperties } from 'styled-components'

import useTheme from 'hooks/useTheme'

const Title = styled.span`
  font-weight: 500;
  font-size: 16px;
  line-height: 20px;
  color: ${({ theme }) => theme.text};
  max-width: calc(100% - 20px - 8px);
`

type PanelProps = {
  isExpanded: boolean
  toggleExpand: () => void
  title: string
  content: ReactNode
}

const DetailPanel: React.FC<PanelProps> = ({ isExpanded, title, content, toggleExpand }) => {
  const theme = useTheme()

  return (
    <>
      <Flex
        role="button"
        onClick={() => {
          toggleExpand()
        }}
        sx={{
          height: '56px',
          alignItems: 'center',
          justifyContent: 'space-between',
          cursor: 'pointer',
        }}
      >
        <Title>{title}</Title>

        <Flex
          role="button"
          onClick={toggleExpand}
          sx={{
            width: '20px',
            height: '20px',
            cursor: 'pointer',
            transition: 'all 150ms linear',
            transform: isExpanded ? 'rotate(180deg)' : undefined,
          }}
        >
          <ChevronDown size="20" color={theme.text} />
        </Flex>
      </Flex>

      {isExpanded && (
        <Text fontSize={14} marginBottom="16px" lineHeight="20px" color={theme.text}>
          {content}
        </Text>
      )}
    </>
  )
}

const DetailsContainer = styled.div`
  padding: 16px 24px;
  height: fit-content;
  display: flex;
  flex-direction: column;
  background: ${({ theme }) => rgba(theme.background, 0.8)};
  border-radius: 20px;
`

const Separator = styled.div`
  width: 100%;
  height: 0;
  border-bottom: 1px solid ${({ theme }) => theme.border};
  margin: 8px 0;
`

type Question = { title: string; content: ReactNode }
const FAQ = ({ questions, style }: { questions: Question[]; style?: CSSProperties }) => {
  const [expandedPanel, setExpandedPanel] = useState<number | undefined>()

  const handleToggleExpand = (index: number) => {
    setExpandedPanel(expandedPanel === index ? undefined : index)
  }

  return (
    <DetailsContainer style={style}>
      {questions.map((q, i) => (
        <Fragment key={i}>
          <DetailPanel
            toggleExpand={() => handleToggleExpand(i)}
            isExpanded={expandedPanel === i}
            title={q.title}
            content={q.content}
          />
          {i !== questions.length - 1 && <Separator />}
        </Fragment>
      ))}
    </DetailsContainer>
  )
}

export default FAQ
