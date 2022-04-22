import styled from 'styled-components'
import { Text } from 'rebass'

export const ModalContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  padding: 24px 20px;
  background-color: ${({ theme }) => theme.background};
`

export const Title = styled(Text)<{ border?: boolean }>`
  font-size: 20px;
  line-height: 32px;
  font-weight: 500;
  border-bottom: 0.5px dashed ${({ theme, border }) => (border ? theme.subText : 'transparent')};
`

export const TableHeader = styled.div`
  display: grid;
  grid-template-columns: 18px 90px 1.5fr repeat(3, 1fr);
  border-top-left-radius: 8px;
  border-top-right-radius: 8px;
  background: ${({ theme }) => theme.tableHeader};
  gap: 16px;
  font-size: 12px;
  text-transform: uppercase;
  margin-top: 20px;
  padding: 16px;
  font-weight: 500;
  color: ${({ theme }) => theme.subText};
  align-items: center;
`

export const TableRow = styled(TableHeader)`
  background: ${({ theme }) => theme.background};
  boder-radius: 0;
  text-transform: none;
  margin-top: 0;
  font-weight: 400;
  color: ${({ theme }) => theme.text};

  border-bottom: 1px solid ${({ theme }) => theme.border};
`

export const Checkbox = styled.input`
  position: relative;
  transform: scale(1.35);
  accent-color: ${({ theme }) => theme.primary};

  :indeterminate::before {
    content: '';
    display: block;
    color: ${({ theme }) => theme.textReverse};
    width: 13px;
    height: 13px;
    background-color: ${({ theme }) => theme.primary};
    border-radius: 2px;
  }
  :indeterminate::after {
    content: '';
    display: block;
    width: 7px;
    height: 7px;
    border: solid ${({ theme }) => theme.textReverse};
    border-width: 2px 0 0 0;
    position: absolute;
    top: 5.5px;
    left: 3px;
  }
`
