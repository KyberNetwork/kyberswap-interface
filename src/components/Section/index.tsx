import React, { Dispatch, ReactNode, SetStateAction, useRef } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import { RowBetween, RowFit } from 'components/Row'
import TabDraggable, { TabITem } from 'components/Section/TabDraggable'
import useTheme from 'hooks/useTheme'

const SectionTitle = styled.div`
  font-size: 16px;
  line-height: 20px;
  font-weight: 500;
  margin: 0px -16px;
  padding: 0px 16px 16px 16px;
  border-bottom: 1px solid ${({ theme }) => theme.border + '80'};
  color: ${({ theme }) => theme.text};
`

const StyledSectionWrapper = styled.div<{ show?: boolean }>`
  display: ${({ show }) => (show ?? 'auto' ? 'auto' : 'none !important')};
  content-visibility: auto;
  padding: 16px;
  border-radius: 20px;
  border: 1px solid ${({ theme }) => theme.border};
  background: linear-gradient(332deg, rgb(32 32 32) 0%, rgba(15, 15, 15, 1) 80%);
  margin-bottom: 36px;
  display: flex;
  flex-direction: column;
  gap: 16px;
`

export type SectionProps = {
  title?: ReactNode
  id?: string
  children: ReactNode
  style?: React.CSSProperties
  actions: ReactNode
  tabs?: TabITem[]
  activeTab?: string
  onTabClick?: (val: string) => void | Dispatch<SetStateAction<string>>
}

export default function Section({
  title = '',
  id,
  children,
  style,
  actions,
  tabs,
  activeTab,
  onTabClick,
}: SectionProps) {
  const theme = useTheme()
  const ref = useRef<HTMLDivElement>(null)

  return (
    <StyledSectionWrapper ref={ref} id={id} style={style} className="section-wrapper">
      <SectionTitle style={{ padding: tabs ? `0px 16px 0 16px` : undefined }}>
        <RowBetween style={{ flexWrap: 'wrap', gap: '12px' }}>
          {tabs && activeTab ? (
            <RowFit
              style={{
                margin: '-16px -16px 0 -16px',
                paddingRight: '16px',
                color: theme.subText,
                background: theme.background,
              }}
            >
              <TabDraggable tabs={tabs} activeTab={activeTab} onChange={onTabClick} />
              {actions}
            </RowFit>
          ) : (
            <>
              <Text style={{ whiteSpace: 'nowrap' }}>{title}</Text>
              <RowFit color={theme.subText} gap="12px" style={{ marginTop: tabs ? '-16px' : undefined }}>
                {actions}
              </RowFit>
            </>
          )}
        </RowBetween>
      </SectionTitle>
      {children}
    </StyledSectionWrapper>
  )
}
