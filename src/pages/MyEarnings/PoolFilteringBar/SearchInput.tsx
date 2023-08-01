import { t } from '@lingui/macro'
import { useDispatch } from 'react-redux'

import Search from 'components/Search'
import { useAppSelector } from 'state/hooks'
import { setSearchText } from 'state/myEarnings/actions'

const SearchInput = () => {
  const dispatch = useDispatch()
  const searchText = useAppSelector(state => state.myEarnings.searchText)

  const handleChange = (v: string) => {
    dispatch(setSearchText(v))
  }

  return (
    <Search
      searchValue={searchText}
      onSearch={handleChange}
      placeholder={t`Search by token name or pool address`}
      minWidth={'280px'}
    />
  )
}

export default SearchInput
