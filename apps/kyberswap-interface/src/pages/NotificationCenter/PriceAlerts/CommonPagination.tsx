import Pagination from 'components/Pagination'
import { cn } from 'utils/cn'

type Props = React.ComponentProps<typeof Pagination>

const CommonPagination = ({ className, ...rest }: Props) => (
  <Pagination className={cn('border-t border-solid border-border pt-4 max-md:mx-4 max-md:p-4', className)} {...rest} />
)

export default CommonPagination
