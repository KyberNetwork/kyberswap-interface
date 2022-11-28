import styled from 'styled-components'

import sprite from 'assets/svg/sprite.svg'

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  flex-wrap: wrap;
  margin: auto;
  width: 1000px;
  color: ${({ theme }) => theme.subText};
  gap: 10px;
  margin: 20px 0;
`
const IconWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${({ theme }) => theme.background};
  width: 120px;
  height: 100px;
  flex-direction: column;
  border-radius: 5px;
  box-shadow: 0 2px 2px 2px #050505;
  padding: 20px 10px;
  font-size: 12px;
  > svg {
    display: block;
    height: 24px;
    width: 24px;
    flex: 1;
  }
`
const iconIds = [
  'truesight-v2',
  'notification-2',
  'bullish',
  'bearish',
  'trending-soon',
  'flame',
  'download',
  'upload',
  'coin-bag',
  'speaker',
  'share',
  'swap',
]

export default function Icons() {
  return (
    <Wrapper>
      {iconIds.map((id: string) => (
        <IconWrapper key={id}>
          <svg>
            <use href={`${sprite}#${id}`} width="24" height="24" />
          </svg>
          {id}
        </IconWrapper>
      ))}
    </Wrapper>
  )
}
