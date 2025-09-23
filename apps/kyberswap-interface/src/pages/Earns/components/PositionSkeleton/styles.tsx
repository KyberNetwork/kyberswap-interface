import styled from 'styled-components'

export const SkeletonWrapper = styled.div`
  position: relative;
`

export const SkeletonText = styled.div`
  position: absolute;
  font-size: 10px;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  color: ${({ theme }) => theme.subText};
`
