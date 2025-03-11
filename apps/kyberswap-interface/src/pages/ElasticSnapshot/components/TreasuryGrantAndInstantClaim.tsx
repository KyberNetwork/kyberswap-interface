import styled from 'styled-components'

import InstantClaim from './InstantClaim'
import SelectTreasuryGrant from './SelectTreasuryGrant'

const Wrapper = styled.div`
  margin-top: 1rem;
  padding-top: 32px;
  border-top: 1px solid ${({ theme }) => theme.border};
  display: grid;
  gap: 48px;
  grid-template-columns: 1fr 1fr;

  ${({ theme }) => theme.mediaWidth.upToLarge`
    grid-template-columns: 1fr;
  `}
`

export default function TreasuryGrantAndInstantClaim({ userHaveVestingData }: { userHaveVestingData: boolean }) {
  return (
    <Wrapper>
      <SelectTreasuryGrant userHaveVestingData={userHaveVestingData} />
      <InstantClaim />
    </Wrapper>
  )
}
