import { Trans } from '@lingui/macro'
import { Severity } from '@sentry/react'
import React, { ErrorInfo, PropsWithChildren } from 'react'
import { Text } from 'rebass'
import styled from 'styled-components/macro'
import { UAParser } from 'ua-parser-js'

import { reportException } from 'utils/sentry'

import { ExternalLink } from '../../theme'
import { AutoColumn } from '../Column'
import { AutoRow } from '../Row'

const parser = new UAParser(window.navigator.userAgent)

const userAgent = parser.getResult()

const FallbackWrapper = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  align-items: center;
  z-index: 1;
`

const BodyWrapper = styled.div<{ margin?: string }>`
  padding: 1rem;
  width: 100%;
  margin: auto;
  white-space: ;
`

const CodeBlockWrapper = styled.div`
  overflow: auto;
  white-space: pre;
  box-shadow: 0px 0px 1px rgba(0, 0, 0, 0.01), 0px 4px 8px rgba(0, 0, 0, 0.04), 0px 16px 24px rgba(0, 0, 0, 0.04),
    0px 24px 32px rgba(0, 0, 0, 0.01);
  border-radius: 24px;
  padding: 18px 24px;
`

const LinkWrapper = styled.div`
  padding: 6px 24px;
`

const SomethingWentWrongWrapper = styled.div`
  padding: 6px 24px;
`

type ErrorBoundaryState = {
  error: Error | null
}

export default class ErrorBoundary extends React.Component<PropsWithChildren<unknown>, ErrorBoundaryState> {
  constructor(props: PropsWithChildren<unknown>) {
    super(props)
    this.state = { error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const e = new Error(`Page Crash: ${error.toString()} ${errorInfo.toString()}`, {
      cause: error,
    })
    e.name = 'AppCrash'
    reportException(e, { level: Severity.Fatal })
  }

  render() {
    const { error } = this.state

    if (error !== null) {
      const encodedBody = encodeURIComponent(issueBody(error))

      return (
        <FallbackWrapper>
          <BodyWrapper>
            <AutoColumn gap={'md'}>
              <SomethingWentWrongWrapper>
                <Text>
                  <Trans>Oops! Something went wrong</Trans>
                </Text>
              </SomethingWentWrongWrapper>
              <CodeBlockWrapper>
                <code>
                  <Text fontSize={10}>{error.stack}</Text>
                </code>
              </CodeBlockWrapper>
              <AutoRow>
                <LinkWrapper>
                  <ExternalLink
                    id="create-github-issue-link"
                    href={`https://github.com/KyberNetwork/kyberswap-interface/issues/new?assignees=&labels=bug&body=${encodedBody}&title=${encodeURIComponent(
                      `Crash report: \`${error.name}${error.message && `: ${error.message}`}\``,
                    )}`}
                    target="_blank"
                  >
                    <Text fontSize={16}>
                      <Trans>Create an issue on GitHub</Trans>
                      <span>↗</span>
                    </Text>
                  </ExternalLink>
                </LinkWrapper>
              </AutoRow>
            </AutoColumn>
          </BodyWrapper>
        </FallbackWrapper>
      )
    }
    return this.props.children
  }
}

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
