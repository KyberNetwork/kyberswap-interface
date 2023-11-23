import React, { Dispatch, ReactNode, SetStateAction, useRef } from 'react'
import { isMobile } from 'react-device-detect'
import { Text } from 'rebass'
import styled from 'styled-components'

import { RowBetween, RowFit } from 'components/Row'
import TabDraggable, { TabITem } from 'components/Section/TabDraggable'
import useTheme from 'hooks/useTheme'

const SectionTitle = styled.div`
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
  padding: 16px 16px 16px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border + '80'};
  color: ${({ theme }) => theme.text};
`

const Content = styled.div`
  padding: 16px 16px 16px 16px;
`

const StyledSectionWrapper = styled.div<{ show?: boolean }>`
  display: ${({ show }) => (show ?? 'auto' ? 'auto' : 'none !important')};
  content-visibility: auto;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  background: linear-gradient(332deg, rgb(32 32 32) 0%, rgba(15, 15, 15, 1) 80%);
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
`

export type SectionProps<T extends string = string> = {
  title?: ReactNode
  id?: string
  children: ReactNode
  style?: React.CSSProperties
  contentStyle?: React.CSSProperties
  actions?: ReactNode
  tabs?: TabITem<T>[]
  activeTab?: T
  onTabClick?: (val: T) => void | Dispatch<SetStateAction<T>>
}

export default function Section<T extends string = string>({
  title = '',
  id,
  children,
  style,
  contentStyle,
  actions,
  tabs,
  activeTab,
  onTabClick,
}: SectionProps<T>) {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)
  const renderAction = () =>
    actions ? (
      <RowFit color={theme.subText} gap="12px" style={{ zIndex: 1 }}>
        {actions}
      </RowFit>
    ) : null
  return (
    <StyledSectionWrapper ref={ref} id={id} style={style} className="section-wrapper">
      <SectionTitle
        style={{
          padding: tabs ? `0px 16px 0 0` : undefined,
          background: isMobile && tabs ? theme.background : undefined,
        }}
      >
        {tabs && activeTab ? (
          <RowBetween gap="12px">
            <RowFit
              style={{
                color: theme.subText,
              }}
            >
              <TabDraggable tabs={tabs} activeTab={activeTab} onChange={onTabClick} />
            </RowFit>
            {renderAction()}
          </RowBetween>
        ) : (
          <RowBetween style={{ flexWrap: 'wrap', gap: '12px' }}>
            <Text style={{ whiteSpace: 'nowrap' }}>{title}</Text>
            {renderAction()}
          </RowBetween>
        )}
      </SectionTitle>
      <Content style={contentStyle}>{children}</Content>
    </StyledSectionWrapper>
  )
}
