import { Fragment } from 'react'
import { ChevronRight } from 'react-feather'
import { useNavigate } from 'react-router-dom'
import styled from 'styled-components'

const Wrapper = styled.div`
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
`

const ItemWrapper = styled.div`
  cursor: pointer;
  user-select: none;
  font-size: 14px;
  line-height: 16px;
  font-weight: 500;
  white-space: nowrap;
  color: ${({ theme }) => theme.text};
  :hover {
    color: ${({ theme }) => theme.primary};
  }
`
export type BreadcrumbItem = { path?: string; title: string; onClick?: () => void }

const Item = ({ data: { title, path, onClick } }: { data: BreadcrumbItem }) => {
  const navigate = useNavigate()
  return <ItemWrapper onClick={() => (onClick ? onClick() : path && navigate(path))}>{title}</ItemWrapper>
}

export default function Breadcrumb({ items }: { items: BreadcrumbItem[] }) {
  if (!items.length) return null
  return (
    <Wrapper>
      {items.map((el, i) => (
        <Fragment key={i}>
          <Item data={el} />
          {i !== items.length - 1 && <ChevronRight size={18} style={{ minWidth: 18 }} />}
        </Fragment>
      ))}
    </Wrapper>
  )
}
