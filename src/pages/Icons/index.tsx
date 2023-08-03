import { rgba } from 'polished'
import { useEffect, useState } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components'

import sprite from 'assets/svg/sprite.svg'
import * as IconComponents from 'components/Icons'
import { ICON_IDS } from 'constants/index'

const allSvgFiles = import.meta.glob('../../assets/svg/*')

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
  background-color: ${({ theme }) => rgba(theme.background, 0.8)};
  width: 120px;
  height: 100px;
  flex-direction: column;
  border-radius: 5px;
  box-shadow: 0 2px 2px 2px #050505;
  padding: 20px 10px;
  font-size: 12px;
  &:hover {
    transform: scale(1.5);
  }
  > svg {
    display: block;
    height: 24px;
    width: 24px;
    flex: 1;
  }
`

const IconWrapperV2 = styled(IconWrapper)`
  color: ${({ theme }) => theme.subText};
  gap: 8px;
  > svg {
    display: block;
    width: 100%;
  }
`

export default function Icons() {
  const [svgComponents, setSvgComponents] = useState<any>([])

  useEffect(() => {
    const array = Object.keys(allSvgFiles).map(key => ({ id: key.split('/').pop(), fn: allSvgFiles[key]() }))
    Promise.all(array.map(el => el.fn))
      .then(data => {
        setSvgComponents(
          data.map((e: any, i) => {
            const id = array[i].id
            return {
              render: !id?.endsWith('.svg')
                ? () => <img src={e.default} style={{ maxWidth: '100%' }} />
                : e.ReactComponent,
              id,
            }
          }),
        )
      })
      .catch(console.error)
  }, [])
  return (
    <>
      <h2>Svg sprite icon</h2>
      <Wrapper>
        {ICON_IDS.map((id: string) => (
          <IconWrapper key={id}>
            <svg>
              <use href={`${sprite}#${id}`} width="24" height="24" />
            </svg>
            {id}
          </IconWrapper>
        ))}
      </Wrapper>
      <h2>All Svg in: folder /assets/svg </h2>
      <Wrapper>
        {svgComponents.map((el: any) => {
          return (
            <IconWrapperV2 key={el.id}>
              {el.render?.()}
              <Text fontSize={10} style={{ wordBreak: 'break-all' }}>
                {el.id}
              </Text>
            </IconWrapperV2>
          )
        })}
      </Wrapper>
      <h2>All icons in: folder /components/Icons </h2>
      <Wrapper>
        {Object.entries(IconComponents).map(([key, component]) => {
          return (
            <IconWrapperV2 key={key}>
              {component?.({})}
              <Text fontSize={10} style={{ wordBreak: 'break-all' }}>
                {key}.tsx
              </Text>
            </IconWrapperV2>
          )
        })}
      </Wrapper>
    </>
  )
}
