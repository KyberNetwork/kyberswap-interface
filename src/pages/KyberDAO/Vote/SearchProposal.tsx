import { t } from '@lingui/macro'
import styled, { css } from 'styled-components'

import Search from 'components/Icons/Search'
import { SearchIcon } from 'components/SearchModal/styleds'

const Wrapper = styled.div`
  font-size: 14px;
  font-weight: 500;
  border-radius: 20px;
  padding: 8px 12px;
  position: relative;
  display: flex;
  ${({ theme }) =>
    css`
      background-color: ${theme.background};
      color: ${theme.border};
    `}
`
const SearchInput = styled.input`
  border: none;
  outline: none;
  background-color: transparent;
  line-height: 18px;
  ${({ theme }) =>
    css`
      color: ${theme.subText};
      ::placeholder {
        color: ${theme.border};
      }
    `}
`
export default function SearchProposal() {
  return (
    <Wrapper>
      <SearchInput placeholder={t`Search proposals`} />
      <Search />
    </Wrapper>
  )
}
