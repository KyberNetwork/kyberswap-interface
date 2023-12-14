import campaignApi from 'services/campaign'

import SingleProgram from './SingleProgram'

const LatestProgram = () => {
  const { data } = campaignApi.useGetGrantProgramQuery({ id: 'latest' })
  return <SingleProgram program={data} isLatest />
}

export default LatestProgram
