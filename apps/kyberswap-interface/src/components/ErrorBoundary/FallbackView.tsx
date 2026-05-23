import { Trans, t } from '@lingui/macro'
import React from 'react'
import UAParser from 'ua-parser-js'

import { ButtonPrimary } from 'components/Button'
import { AutoColumn } from 'components/Column'
import { AutoRow } from 'components/Row'
import { removeAllReduxPersist } from 'state'
import { ExternalLink } from 'theme'

const parser = new UAParser(window.navigator.userAgent)
const userAgent = parser.getResult()

const predefinedErrors = () => [
  {
    name: 'LocalStorageAccessDenied',
    match: (e: Error) => {
      return e.message.match(/localStorage.*Access is denied/)
    },
    title: t`Permission needed`,
    description: t`We need access to your local storage. The reason can be that you may have accidentally blocked cookies from this site. Please find it in your settings and turn it off.`,
  },
]

function issueBody(error: Error): string {
  const deviceData = userAgent
  return `## URL

${window.location.href}

${
  error.name &&
  `## Error

\`\`\`
${error.name}${error.message && `: ${error.message}`}
\`\`\`
`
}
${
  error.stack &&
  `## Stacktrace

\`\`\`
${error.stack}
\`\`\`
`
}
${
  deviceData &&
  `## Device data

\`\`\`json
${JSON.stringify(deviceData, null, 2)}
\`\`\`
`
}
`
}

type Props = {
  error: Error
}
const FallbackView: React.FC<Props> = ({ error }) => {
  const encodedBody = encodeURIComponent(issueBody(error))
  const foundError = predefinedErrors().find(err => err.match(error))

  return (
    <div className="z-[1] flex w-full flex-col items-center justify-center">
      <div className="m-auto w-full px-6 pb-[18px] pt-12">
        <AutoColumn gap={'lg'} justify="center">
          <p className="max-w-[600px] text-center text-2xl">
            {foundError?.title || <Trans>Oops! Something went wrong</Trans>}
          </p>

          {foundError?.description ? (
            <p className="mt-4 max-w-[600px] text-center text-base">{foundError.description}</p>
          ) : (
            <>
              <div className="overflow-auto whitespace-pre-line">
                <code>
                  <span className="text-[10px]">{error.stack}</span>
                </code>
              </div>
              <AutoRow>
                <div className="m-auto">
                  <ExternalLink
                    id="create-github-issue-link"
                    href={`https://github.com/KyberNetwork/kyberswap-interface/issues/new?assignees=&labels=bug&body=${encodedBody}&title=${encodeURIComponent(
                      `Crash report: \`${error.name}${error.message && `: ${error.message}`}\``,
                    )}`}
                    target="_blank"
                  >
                    <span className="text-base">
                      <Trans>Create an issue on GitHub</Trans>
                      <span>↗</span>
                    </span>
                  </ExternalLink>
                </div>
              </AutoRow>
            </>
          )}

          <ButtonPrimary
            margin="auto"
            width="fit-content"
            onClick={() => {
              removeAllReduxPersist()
              window.location.reload()
            }}
          >
            <Trans>Refresh</Trans>
          </ButtonPrimary>
        </AutoColumn>
      </div>
    </div>
  )
}

export default FallbackView
