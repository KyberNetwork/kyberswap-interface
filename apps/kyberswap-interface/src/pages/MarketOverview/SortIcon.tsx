import { Flex } from 'rebass'

import useTheme from 'hooks/useTheme'

export enum Direction {
  ASC = 'asc',
  DESC = 'desc',
}

export default function SortIcon({ sorted }: { sorted?: Direction }) {
  const theme = useTheme()
  return (
    <Flex flexDirection="column" sx={{ gap: '2px' }}>
      <svg width="8" height="5" viewBox="0 0 8 5" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1.33333 3.91667L3.99999 1.25L6.66666 3.91667"
          stroke={sorted === Direction.ASC ? theme.text : theme.subText}
          strokeWidth={sorted === Direction.ASC ? 1.5 : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>

      <svg width="8" height="4" viewBox="0 0 8 4" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path
          d="M1.33333 0.583332L3.99999 3.25L6.66666 0.583332"
          stroke={sorted === Direction.DESC ? theme.text : theme.subText}
          strokeWidth={sorted === Direction.DESC ? 1.5 : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </Flex>
  )
}
