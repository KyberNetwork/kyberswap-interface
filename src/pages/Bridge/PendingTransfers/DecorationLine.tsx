import styled from 'styled-components'

type Props = {
  className?: string
}

const SubLine = styled.div`
  flex: 1 1 100%;
  height: 100%;
  background-color: ${({ theme }) => theme.border};
`

const IconWrapper = styled.div`
  width: 12px;
  height: 12px;

  display: flex;
  justify-content: center;
  align-items: center;

  svg {
    width: 100%;
    height: 100%;
  }
`

const DecorationLine: React.FC<Props> = ({ className }) => {
  return (
    <div className={className}>
      <SubLine />
      <IconWrapper>
        <svg width="5" height="10" viewBox="0 0 5 10" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 10L5 5L0 0V10Z" fill="currentColor" />
        </svg>
      </IconWrapper>
      <SubLine />
    </div>
  )
}

export default styled(DecorationLine)`
  position: absolute;
  top: 50%;
  left: 0;
  transform: translateY(-50%);

  width: 100%;
  height: 2px;

  display: flex;
  align-items: center;
  gap: 8px;

  color: ${({ theme }) => theme.primary};
`
