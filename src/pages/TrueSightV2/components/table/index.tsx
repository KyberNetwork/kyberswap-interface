import { Trans } from '@lingui/macro'
import { rgba } from 'polished'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import { ButtonLight } from 'components/Button'
import { AutoColumn } from 'components/Column'
import Icon from 'components/Icons/Icon'
import Pagination from 'components/Pagination'
import Row, { RowFit } from 'components/Row'
import useTheme from 'hooks/useTheme'

import { ContentWrapper } from '..'

const TableWrapper = styled(ContentWrapper)`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  overflow: hidden;
  padding: 0;
  font-size: 12px;
  margin-bottom: 40px;
`
const TableHeader = styled.div<{ gridTemplateColumns: string }>`
  display: grid;
  grid-template-columns: ${({ gridTemplateColumns }) => gridTemplateColumns};
  align-items: center;
  height: 48px;
  text-transform: uppercase;

  ${({ theme }) => css`
    background-color: ${theme.tableHeader};
    color: ${theme.subText};
  `};

  & > *:last-child {
    align-items: flex-end;
  }
`
const TableRow = styled(TableHeader)<{ height?: number }>`
  height: ${({ height }) => height || 72}px;
  font-size: 14px;
  text-transform: initial;
  ${({ theme }) => css`
    background-color: ${theme.background};
    color: ${theme.text};
    border-bottom: 1px solid ${theme.border};
  `};
`
const TableCell = styled.div`
  display: flex;
  flex-direction: column;
  padding: 16px;
  gap: 4px;
`

const ActionButton = styled(ButtonLight)<{ color: string }>`
  display: flex;
  align-items: center;
  height: 28px;
  width: 28px;

  ${({ theme, color }) => css`
    color: ${color || theme.primary};
    background-color: ${color ? rgba(color, 0.2) : rgba(theme.primary, 0.2)};
  `}
`
export const Top10HoldersTable = () => {
  const theme = useTheme()
  const gridTemplateColumns = '3fr 1fr 1fr 1fr 1fr'

  return (
    <TableWrapper>
      <TableHeader gridTemplateColumns={gridTemplateColumns}>
        <TableCell>Address</TableCell>
        <TableCell>Supply owned</TableCell>
        <TableCell>Amount held</TableCell>
        <TableCell>AVG AQUISITION PRICE</TableCell>
        <TableCell>Action</TableCell>
      </TableHeader>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i} gridTemplateColumns={gridTemplateColumns}>
          <TableCell>0x9E6A9b73C0603ea78aD24Efe0368Df8F95a43651</TableCell>
          <TableCell>75.26%</TableCell>
          <TableCell>1,000,0000</TableCell>
          <TableCell>
            <AutoColumn gap="4px">
              <Text>$1.2</Text>
              <Text fontSize={12} color={theme.primary}>
                +20.23%
              </Text>
            </AutoColumn>
          </TableCell>
          <TableCell>
            <RowFit gap="8px">
              <ActionButton color={theme.subText}>
                <Icon id="copy" size={16} />
              </ActionButton>
              <ActionButton color={theme.subText}>
                <Icon id="open-link" size={16} />
              </ActionButton>
            </RowFit>
          </TableCell>
        </TableRow>
      ))}
    </TableWrapper>
  )
}

export const FundingRateTable = () => {
  const theme = useTheme()
  const gridTemplateColumns = '1fr 1fr 1fr 1fr 1fr'

  return (
    <TableWrapper>
      <TableHeader gridTemplateColumns={gridTemplateColumns}>
        <TableCell></TableCell>
        <TableCell>
          <svg width="80" height="16" viewBox="0 0 80 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_9_2878)">
              <path
                d="M4.82371 6.72333L7.93093 3.61624L11.0398 6.72498L12.8478 4.91698L7.93093 0L3.01572 4.91534L4.82371 6.72333Z"
                fill="#F3BA2F"
              />
              <path
                d="M3.54692 7.99986L1.73895 6.19189L-0.0690999 7.99995L1.73886 9.80791L3.54692 7.99986Z"
                fill="#F3BA2F"
              />
              <path
                d="M4.82371 9.27691L7.93093 12.384L11.0397 9.27539L12.8487 11.0824L12.8478 11.0834L7.93093 16.0002L3.01559 11.085L3.01306 11.0825L4.82371 9.27691Z"
                fill="#F3BA2F"
              />
              <path
                d="M14.1231 9.80854L15.9312 8.00049L14.1232 6.19252L12.3151 8.00058L14.1231 9.80854Z"
                fill="#F3BA2F"
              />
              <path
                d="M9.76484 7.99921H9.7656L7.93094 6.16455L6.5751 7.52039H6.57498L6.41929 7.6762L6.09793 7.99757L6.0954 8.00009L6.09793 8.00275L7.93094 9.83576L9.7656 8.00111L9.76648 8.00009L9.76484 7.99921Z"
                fill="#F3BA2F"
              />
              <path
                d="M18.7497 3.87695H22.682C23.658 3.87695 24.396 4.12742 24.8962 4.62836C25.2832 5.01632 25.4767 5.49716 25.4767 6.07076V6.09502C25.4767 6.3374 25.4468 6.5516 25.3865 6.73737C25.3263 6.92339 25.246 7.09083 25.1455 7.24033C25.0453 7.38995 24.9288 7.52125 24.7963 7.63422C24.6638 7.74745 24.5214 7.84451 24.3688 7.92513C24.8594 8.11115 25.2456 8.36351 25.5271 8.68273C25.8086 9.00207 25.9495 9.44449 25.9495 10.01V10.0341C25.9495 10.4221 25.8749 10.7614 25.7257 11.0524C25.5764 11.3432 25.3626 11.5857 25.0842 11.7797C24.8058 11.9737 24.4711 12.119 24.0798 12.2161C23.6886 12.313 23.255 12.3614 22.7792 12.3614H18.7497V3.87695ZM22.2889 7.30705C22.7011 7.30705 23.0284 7.23653 23.2707 7.095C23.513 6.95359 23.6342 6.72524 23.6342 6.41019V6.38593C23.6342 6.10324 23.5291 5.88714 23.3191 5.73752C23.1089 5.58802 22.8059 5.51321 22.4101 5.51321H20.5677V7.30705H22.2889ZM22.7859 10.7253C23.198 10.7253 23.521 10.6507 23.7555 10.5011C23.9898 10.3516 24.1071 10.1192 24.1071 9.80402V9.77988C24.1071 9.49706 23.9979 9.27288 23.7798 9.10708C23.5616 8.94166 23.2101 8.85876 22.7252 8.85876H20.5677V10.7254H22.7859V10.7253Z"
                fill="#F3BA2F"
              />
              <path d="M28.2914 3.87695H30.1581V12.3617H28.2914V3.87695Z" fill="#F3BA2F" />
              <path
                d="M32.9854 3.87695H34.7064L38.6821 9.10114V3.87695H40.5245V12.3617H38.9368L34.8277 6.96787V12.3617H32.9854V3.87695Z"
                fill="#F3BA2F"
              />
              <path
                d="M46.1758 3.81641H47.8969L51.5333 12.3616H49.5818L48.806 10.4587H45.2182L44.4425 12.3616H42.5392L46.1758 3.81641ZM48.1394 8.8101L47.012 6.05874L45.8851 8.8101H48.1394Z"
                fill="#F3BA2F"
              />
              <path
                d="M53.5483 3.87695H55.2696L59.2452 9.10114V3.87695H61.0875V12.3617H59.4998L55.3907 6.96787V12.3617H53.5483V3.87695Z"
                fill="#F3BA2F"
              />
              <path
                d="M67.8054 12.5069C67.1829 12.5069 66.6054 12.3937 66.072 12.1676C65.5386 11.9415 65.0781 11.6323 64.6902 11.2403C64.3023 10.8484 63.9991 10.3858 63.7813 9.85249C63.563 9.31908 63.4539 8.7494 63.4539 8.14332V8.11918C63.4539 7.51311 63.563 6.94557 63.7813 6.4162C63.9992 5.88696 64.3023 5.42229 64.6902 5.02233C65.0779 4.62236 65.5427 4.30707 66.084 4.07682C66.6252 3.84657 67.2236 3.73145 67.8781 3.73145C68.2738 3.73145 68.6353 3.76392 68.9626 3.82837C69.2899 3.8932 69.5868 3.98191 69.8536 4.09502C70.1204 4.20824 70.3666 4.34561 70.5932 4.50711C70.819 4.66887 71.0293 4.84655 71.2233 5.04053L70.0356 6.41014C69.7039 6.11127 69.3667 5.87672 69.0234 5.70713C68.6798 5.53754 68.2941 5.45262 67.8658 5.45262C67.5102 5.45262 67.1809 5.52137 66.8781 5.65873C66.5751 5.7961 66.3144 5.98591 66.0961 6.22829C65.8781 6.47067 65.7084 6.75159 65.587 7.07068C65.466 7.39002 65.4055 7.73135 65.4055 8.09492V8.11906C65.4055 8.48263 65.466 8.82623 65.587 9.14924C65.7084 9.47262 65.8757 9.75531 66.0902 9.99769C66.3041 10.2401 66.5628 10.4322 66.8657 10.5736C67.169 10.7151 67.5023 10.7856 67.8658 10.7856C68.3508 10.7856 68.7605 10.6968 69.0959 10.519C69.4313 10.3414 69.7648 10.0989 70.096 9.79171L71.2839 10.9917C71.0657 11.2262 70.8391 11.4363 70.6052 11.6219C70.3708 11.808 70.1142 11.9674 69.8353 12.1009C69.5567 12.2341 69.2514 12.3353 68.9204 12.4038C68.5888 12.4724 68.2173 12.5069 67.8054 12.5069Z"
                fill="#F3BA2F"
              />
              <path
                d="M73.4808 3.87695H79.8685V5.5376H75.3233V7.25878H79.3232V8.9193H75.3233V10.7011H79.9294V12.3617H73.4808V3.87695Z"
                fill="#F3BA2F"
              />
            </g>
            <defs>
              <clipPath id="clip0_9_2878">
                <rect width="79.8684" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </TableCell>
        <TableCell>
          <svg width="41" height="16" viewBox="0 0 41 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <g clipPath="url(#clip0_9_2879)">
              <path d="M29.1804 11.9327V1.41162H31.2951V11.9327H29.1804Z" fill="#F7A600" />
              <path
                d="M4.53368 15.0581H0V4.53711H4.35137C6.46616 4.53711 7.6984 5.68967 7.6984 7.49254C7.6984 8.65955 6.90701 9.41372 6.35925 9.66482C7.01308 9.96021 7.85002 10.625 7.85002 12.0295C7.85002 13.9941 6.46617 15.0581 4.53368 15.0581ZM4.18398 6.36976H2.11478V8.79315H4.18398C5.08146 8.79315 5.58362 8.30543 5.58362 7.58106C5.58362 6.85748 5.08146 6.36976 4.18398 6.36976ZM4.32071 10.6403H2.11478V13.2263H4.32071C5.27948 13.2263 5.73525 12.6356 5.73525 11.9257C5.73525 11.2166 5.27864 10.6403 4.32071 10.6403Z"
                fill="white"
              />
              <path
                d="M14.3003 10.7433V15.0581H12.2005V10.7433L8.94461 4.53711H11.2417L13.2653 8.77786L15.2583 4.53711H17.5554L14.3003 10.7433Z"
                fill="white"
              />
              <path
                d="M23.5509 15.0581H19.0172V4.53711H23.3686C25.4834 4.53711 26.7156 5.68967 26.7156 7.49254C26.7156 8.65955 25.9242 9.41372 25.3765 9.66482C26.0303 9.96021 26.8673 10.625 26.8673 12.0295C26.8673 13.9941 25.4834 15.0581 23.5509 15.0581ZM23.2012 6.36976H21.132V8.79315H23.2012C24.0987 8.79315 24.6008 8.30543 24.6008 7.58106C24.6008 6.85748 24.0987 6.36976 23.2012 6.36976ZM23.3379 10.6403H21.132V13.2263H23.3379C24.2967 13.2263 24.7525 12.6356 24.7525 11.9257C24.7525 11.2166 24.2967 10.6403 23.3379 10.6403Z"
                fill="white"
              />
              <path d="M38.1111 6.36976V15.0589H35.9963V6.36976H33.1664V4.53711H40.941V6.36976H38.1111Z" fill="white" />
            </g>
            <defs>
              <clipPath id="clip0_9_2879">
                <rect width="40.9412" height="16" fill="white" />
              </clipPath>
            </defs>
          </svg>
        </TableCell>
        <TableCell>
          <svg width="70" height="16" viewBox="0 0 70 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="mask0_538_2447" maskUnits="userSpaceOnUse" x="0" y="0" width="70" height="16">
              <path d="M0 0H69.869V16H0V0Z" fill="white" />
            </mask>
            <g mask="url(#mask0_538_2447)">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M57.8423 4.75523H59.8266V2.77051H57.8423V4.75523ZM47.2956 8.06043C47.6748 7.0548 48.6457 6.33878 49.7841 6.33878C50.9225 6.33878 51.8934 7.0548 52.2727 8.06043H47.2956ZM49.7841 4.49348C47.2969 4.49348 45.28 6.51057 45.28 8.99885C45.28 11.4871 47.2969 13.5039 49.7841 13.5039C51.491 13.5039 52.9757 12.5547 53.74 11.1555L52.0757 10.3479C51.6133 11.1321 50.7603 11.6586 49.7841 11.6586C48.5507 11.6586 47.514 10.8188 47.2131 9.67968H52.355C52.3547 9.68051 52.3545 9.68167 52.3543 9.68266H54.2375C54.2715 9.4596 54.2891 9.23121 54.2891 8.99885C54.2891 6.51057 52.2722 4.49348 49.7841 4.49348ZM54.8122 13.2637H56.7964V11.279H54.8122V13.2637ZM57.8423 13.2637H59.8266V5.62775H57.8423V13.2637ZM65.3648 11.6586C63.8961 11.6586 62.7056 10.4677 62.7056 8.99885C62.7056 7.52965 63.8961 6.33878 65.3648 6.33878C66.8335 6.33878 68.0241 7.52965 68.0241 8.99885C68.0241 10.4677 66.8335 11.6586 65.3648 11.6586ZM65.364 4.49348C62.8768 4.49348 60.8598 6.51057 60.8598 8.99885C60.8598 11.4871 62.8768 13.5039 65.364 13.5039C67.852 13.5039 69.869 11.4871 69.869 8.99885C69.869 6.51057 67.852 4.49348 65.364 4.49348ZM23.8779 7.33811V9.39022H26.6524C26.5075 9.9766 26.2211 10.5021 25.8104 10.9218C25.191 11.555 24.3321 11.9039 23.3917 11.9039C21.4405 11.9039 19.8528 10.316 19.8528 8.36417C19.8528 6.41231 21.4405 4.82427 23.3917 4.82427C24.437 4.82427 25.3977 5.27174 26.0638 6.04352L27.6523 4.74527C26.5991 3.51075 25.0365 2.772 23.3917 2.772C20.3092 2.772 17.8012 5.2807 17.8012 8.36417C17.8012 11.4476 20.3092 13.9562 23.3917 13.9562C24.8885 13.9562 26.2682 13.4167 27.277 12.3857C28.1234 11.5203 28.6844 10.3132 28.7923 9.10391C28.8449 8.51404 28.8497 7.92815 28.8187 7.33811H23.8779ZM33.9847 11.6591C32.516 11.6591 31.3253 10.4679 31.3253 8.99885C31.3253 7.52948 32.516 6.33862 33.9847 6.33862C35.4536 6.33862 36.6444 7.52948 36.6444 8.99885C36.6444 10.4679 35.4536 11.6591 33.9847 11.6591ZM36.6447 5.37149C35.8991 4.82477 34.9799 4.50112 33.9847 4.50112C31.4975 4.50112 29.4813 6.51804 29.4813 9.00582C29.4813 11.4939 31.4975 13.5105 33.9847 13.5105C34.9799 13.5105 35.8991 13.187 36.6447 12.6403V13.2637H38.4884V4.74809H36.6447V5.37149ZM42.4463 2.77067H40.6024V4.75523H39.4973V6.4958H40.6024V11.0508C40.6024 11.5212 40.6615 11.9168 40.7787 12.2274C40.8941 12.5346 41.0707 12.7751 41.2806 12.963C41.4933 13.1537 41.7429 13.3022 42.0388 13.3865C42.3394 13.4712 42.6711 13.5039 43.0218 13.5039C43.3847 13.5039 43.7082 13.4662 43.9844 13.3917C44.2407 13.3228 44.4865 13.2254 44.7151 13.1016V11.6991C44.3514 11.8564 44.0114 11.9134 43.6234 11.9314C43.2139 11.9507 42.9717 11.8337 42.77 11.6415C42.5588 11.4402 42.4463 11.1778 42.4463 10.7376V6.4958H44.7151V4.75523H42.4463V2.77067Z"
                fill="white"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.99826 12.4001C5.5688 12.4001 3.59931 10.4303 3.59931 8.00012C3.59931 5.57009 5.5688 3.59998 7.99826 3.59998V0C3.58089 0 0 3.58172 0 8.00012C0 12.4183 3.58089 16.0001 7.99826 16.0001C12.4155 16.0001 15.9965 12.4183 15.9965 8.00012H12.3972C12.3972 10.4303 10.4277 12.4001 7.99826 12.4001Z"
                fill="#2354E6"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M7.99823 8.00007H12.3972V3.6001H7.99823V8.00007Z"
                fill="#17E6A1"
              />
            </g>
          </svg>
        </TableCell>
        <TableCell>
          <svg width="54" height="16" viewBox="0 0 54 16" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M15.6441 0H0.355501C0.261215 0 0.170786 0.0374293 0.104143 0.104144C0.0374282 0.170787 0 0.261215 0 0.355573V15.6441C0 15.7384 0.0374282 15.8289 0.104143 15.8955C0.170786 15.9622 0.261215 15.9996 0.355501 15.9996H15.6441C15.7384 15.9996 15.8289 15.9622 15.8955 15.8955C15.9622 15.8289 15.9996 15.7384 15.9996 15.6441V0.355573C15.9996 0.261215 15.9622 0.170787 15.8955 0.104144C15.8289 0.0374293 15.7384 0 15.6441 0ZM10.6664 10.3109C10.6664 10.4052 10.629 10.4956 10.5623 10.5623C10.4956 10.629 10.4052 10.6665 10.3109 10.6665H5.68874C5.59445 10.6665 5.50402 10.629 5.43731 10.5623C5.37067 10.4956 5.33324 10.4052 5.33324 10.3109V5.68874C5.33324 5.59445 5.37067 5.50402 5.43731 5.43738C5.50402 5.37067 5.59445 5.33324 5.68874 5.33324H10.3109C10.4052 5.33324 10.4956 5.37067 10.5623 5.43738C10.629 5.50402 10.6664 5.59445 10.6664 5.68874V10.3109Z"
              fill="white"
            />
            <path
              d="M47.6523 5.33398H43.0302C42.8338 5.33398 42.6746 5.49313 42.6746 5.68949V10.3116C42.6746 10.508 42.8338 10.6672 43.0302 10.6672H47.6523C47.8486 10.6672 48.0079 10.508 48.0079 10.3116V5.68949C48.0079 5.49313 47.8486 5.33398 47.6523 5.33398Z"
              fill="white"
            />
            <path
              d="M42.3169 0.000488281H37.6948C37.4985 0.000488281 37.3392 0.159632 37.3392 0.356061V4.97815C37.3392 5.17451 37.4985 5.33372 37.6948 5.33372H42.3169C42.5133 5.33372 42.6725 5.17451 42.6725 4.97815V0.356061C42.6725 0.159632 42.5133 0.000488281 42.3169 0.000488281Z"
              fill="white"
            />
            <path
              d="M52.9834 0.000488281H48.3613C48.1649 0.000488281 48.0057 0.159632 48.0057 0.356061V4.97815C48.0057 5.17451 48.1649 5.33372 48.3613 5.33372H52.9834C53.1798 5.33372 53.3389 5.17451 53.3389 4.97815V0.356061C53.3389 0.159632 53.1798 0.000488281 52.9834 0.000488281Z"
              fill="white"
            />
            <path
              d="M42.3169 10.667H37.6948C37.4985 10.667 37.3392 10.8261 37.3392 11.0225V15.6447C37.3392 15.841 37.4985 16.0002 37.6948 16.0002H42.3169C42.5133 16.0002 42.6725 15.841 42.6725 15.6447V11.0225C42.6725 10.8261 42.5133 10.667 42.3169 10.667Z"
              fill="white"
            />
            <path
              d="M52.9834 10.667H48.3613C48.1649 10.667 48.0057 10.8261 48.0057 11.0225V15.6447C48.0057 15.841 48.1649 16.0002 48.3613 16.0002H52.9834C53.1798 16.0002 53.3389 15.841 53.3389 15.6447V11.0225C53.3389 10.8261 53.1798 10.667 52.9834 10.667Z"
              fill="white"
            />
            <path
              d="M34.3104 0.000488281H29.6883C29.4919 0.000488281 29.3327 0.159632 29.3327 0.356061V4.97815C29.3327 5.17451 29.4919 5.33372 29.6883 5.33372H34.3104C34.5067 5.33372 34.6659 5.17451 34.6659 4.97815V0.356061C34.6659 0.159632 34.5067 0.000488281 34.3104 0.000488281Z"
              fill="white"
            />
            <path
              d="M34.3104 10.667H29.6883C29.4919 10.667 29.3327 10.8261 29.3327 11.0225V15.6447C29.3327 15.841 29.4919 16.0002 29.6883 16.0002H34.3104C34.5067 16.0002 34.6659 15.841 34.6659 15.6447V11.0225C34.6659 10.8261 34.5067 10.667 34.3104 10.667Z"
              fill="white"
            />
            <path
              d="M29.3327 5.68474C29.3327 5.59045 29.2952 5.50002 29.2286 5.43338C29.1619 5.36667 29.0714 5.32924 28.9772 5.32924H23.9995V0.355573C23.9995 0.261215 23.962 0.170787 23.8954 0.104144C23.8286 0.0374293 23.7382 0 23.6439 0H19.0218C18.9275 0 18.837 0.0374293 18.7704 0.104144C18.7037 0.170787 18.6663 0.261215 18.6663 0.355573V15.6361C18.6663 15.7304 18.7037 15.8209 18.7704 15.8875C18.837 15.9542 18.9275 15.9916 19.0218 15.9916H23.6439C23.7382 15.9916 23.8286 15.9542 23.8954 15.8875C23.962 15.8209 23.9995 15.7304 23.9995 15.6361V10.6625H28.9772C29.0714 10.6625 29.1619 10.625 29.2286 10.5583C29.2952 10.4916 29.3327 10.4012 29.3327 10.3069V5.68474Z"
              fill="white"
            />
          </svg>
        </TableCell>
        <TableCell></TableCell>
      </TableHeader>
      <TableRow gridTemplateColumns={gridTemplateColumns}>
        <TableCell>
          <Text>BTC</Text>
          <Text color={theme.subText} fontSize={12}>
            Bitcoin
          </Text>
        </TableCell>
        <TableCell>
          <Text color={theme.red}>-0.0049%</Text>
        </TableCell>
        <TableCell>
          <Text color={theme.warning}>0.0%</Text>
        </TableCell>
        <TableCell>
          <Text color={theme.warning}>0.0%</Text>
        </TableCell>
        <TableCell>
          <Text color={theme.red}>-0.0049%</Text>
        </TableCell>
        <TableCell></TableCell>
      </TableRow>
    </TableWrapper>
  )
}

export const LiveDEXTrades = () => {
  const theme = useTheme()
  const gridTemplateColumns = '1.4fr 1fr 1.2fr 2fr 2fr 1.5fr 1fr'

  return (
    <TableWrapper>
      <TableHeader gridTemplateColumns={gridTemplateColumns}>
        <TableCell>Date</TableCell>
        <TableCell>Type</TableCell>
        <TableCell>Price ($)</TableCell>
        <TableCell>Amount In</TableCell>
        <TableCell>Amount Out</TableCell>
        <TableCell>Trader</TableCell>
        <TableCell>Transaction</TableCell>
      </TableHeader>
      {[...Array(10)].map((_, i) => (
        <TableRow key={i} gridTemplateColumns={gridTemplateColumns}>
          <TableCell>
            <Text>16/10/2021</Text>
            <Text fontSize={12} color={theme.subText}>
              11:25:42 AM
            </Text>
          </TableCell>
          <TableCell>
            <Text color={theme.primary}>Buy</Text>
          </TableCell>
          <TableCell>$0.12345</TableCell>
          <TableCell>
            <Row>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M15.7605 9.9353C14.6919 14.221 10.3507 16.8292 6.06401 15.7605C1.77905 14.692 -0.829473 10.351 0.239641 6.06559C1.30775 1.77938 5.64897 -0.829093 9.93442 0.239396C14.2209 1.30789 16.8292 5.64934 15.7605 9.9353Z"
                  fill="#F7931A"
                />
              </svg>{' '}
              <Text color={theme.primary}> + 232,232 BTC</Text>
            </Row>
            <Text color={theme.subText} fontSize={12}>
              $0.16
            </Text>
          </TableCell>
          <TableCell>
            <Row>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <rect width="16" height="16" fill="url(#pattern0)" />
                <defs>
                  <pattern id="pattern0" patternContentUnits="objectBoundingBox" width="1" height="1">
                    <use transform="scale(0.00460829)" />
                  </pattern>
                  <image id="image0_538_1271" width="217" height="217" />
                </defs>
              </svg>
              <Text color={theme.subText}>- 1,123,324.23 USDT</Text>
            </Row>
            <Text color={theme.subText} fontSize={12}>
              $0.16
            </Text>
          </TableCell>
          <TableCell>
            <Text color={theme.primary}>0x9E6A...3651</Text>
          </TableCell>
          <TableCell>
            <Row justify="flex-end" gap="8px">
              <ActionButton color={theme.subText}>
                <Icon id="copy" size={16} />
              </ActionButton>
              <ActionButton color={theme.subText}>
                <Icon id="open-link" size={16} />
              </ActionButton>
            </Row>
          </TableCell>
        </TableRow>
      ))}
      <Pagination currentPage={1} pageSize={10} totalCount={100} onPageChange={page => console.log(page)} />
    </TableWrapper>
  )
}

export const WidgetTable = () => {
  const theme = useTheme()
  const gridTemplateColumns = '1fr 1fr 1fr 1fr 2fr 1.5fr'

  return (
    <TableWrapper style={{ borderRadius: '0' }}>
      <TableHeader gridTemplateColumns={gridTemplateColumns} style={{ backgroundColor: theme.background }}>
        <TableCell>
          <Trans>Token</Trans>
        </TableCell>
        <TableCell>
          <Trans>Chain</Trans>
        </TableCell>
        <TableCell>
          <Trans>Price</Trans>
        </TableCell>
        <TableCell>
          <Trans>24 Change</Trans>
        </TableCell>
        <TableCell>
          <Trans>Last 7 days</Trans>
        </TableCell>
        <TableCell>
          <Trans>Action</Trans>
        </TableCell>
      </TableHeader>
      {[...Array(5)].map((_, i) => (
        <TableRow
          key={i}
          gridTemplateColumns={gridTemplateColumns}
          height={64}
          style={{ backgroundColor: theme.tableHeader }}
        >
          <TableCell>
            <Icon id="star" size={16} />
          </TableCell>
          <TableCell>
            <Icon id="star" size={16} />
          </TableCell>
          <TableCell>
            <Icon id="star" size={16} />
          </TableCell>
          <TableCell>
            <Icon id="star" size={16} />
          </TableCell>
          <TableCell>
            <Icon id="star" size={16} />
          </TableCell>
          <TableCell>
            <Icon id="star" size={16} />
          </TableCell>
        </TableRow>
      ))}
    </TableWrapper>
  )
}
