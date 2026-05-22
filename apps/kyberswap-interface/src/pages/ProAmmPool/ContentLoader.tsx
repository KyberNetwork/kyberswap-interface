import Divider from 'components/Divider'

export const Loading = ({ className, ...rest }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    className={`rounded-[20px] bg-[linear-gradient(90deg,var(--ks-buttonGray)_8%,rgba(41,41,41,0.6)_18%,var(--ks-buttonGray)_33%)] bg-[length:200%_100%] [animation:ks-shine_1.5s_linear_infinite] ${
      className ?? ''
    }`}
    {...rest}
  />
)

function ContentLoader() {
  return (
    <div className="relative flex flex-col gap-4 overflow-hidden rounded-[20px] border-0 bg-background px-5 pb-4 pt-7">
      <Loading style={{ height: '41px' }} />
      <Loading style={{ height: '28px', borderRadius: '999px' }} />
      <Loading style={{ height: '185px' }} />
      <Loading style={{ height: '160px' }} />

      <div className="flex">
        <Loading style={{ height: '36px', flex: 1, borderRadius: '999px' }} />
        <Loading style={{ height: '36px', flex: 1, marginLeft: '1rem', borderRadius: '999px' }} />
      </div>

      <Divider />

      <Loading style={{ height: '15px', width: '80px', borderRadius: '999px' }} />
    </div>
  )
}

export default ContentLoader
