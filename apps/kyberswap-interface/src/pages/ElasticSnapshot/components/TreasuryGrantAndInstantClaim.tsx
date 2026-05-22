import InstantClaim from './InstantClaim'
import SelectTreasuryGrant from './SelectTreasuryGrant'

export default function TreasuryGrantAndInstantClaim({ userHaveVestingData }: { userHaveVestingData: boolean }) {
  return (
    <div className="mt-4 grid grid-cols-2 gap-12 border-t border-solid border-border pt-8 max-lg:grid-cols-1">
      <SelectTreasuryGrant userHaveVestingData={userHaveVestingData} />
      <InstantClaim />
    </div>
  )
}
