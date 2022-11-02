import { Trans } from '@lingui/macro'
import { lighten } from 'polished'
import { Link } from 'react-router-dom'
import { Text } from 'rebass'
import styled, { css } from 'styled-components'

import bgimg from 'assets/images/about_background.png'
import governancePNG from 'assets/images/kyberdao/governance.png'
import kyberCrystal from 'assets/images/kyberdao/kyber_crystal.png'
import kyberdaoPNG from 'assets/images/kyberdao/kyberdao.png'
import migratePNG from 'assets/images/kyberdao/migrate.png'
import stakevotePNG from 'assets/images/kyberdao/stake_vote.png'
import useTheme from 'hooks/useTheme'
import { ApplicationModal } from 'state/application/actions'
import { useToggleModal } from 'state/application/hooks'

import MigrateModal from './MigrateModal'
import StakeKNCComponent from './StakeKNCComponent'

const Wrapper = styled.div`
  width: 100%;
  background-image: url(${bgimg}), url(${bgimg});
  background-size: cover, cover;
  background-repeat: no-repeat, no-repeat;
  z-index: 1;
  background-color: transparent, transparent;
  background-position: top, bottom;
`
const Container = styled.div`
  margin: auto;
  width: 992px;
  min-height: 1100px;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  align-content: flex-start;
  justify-content: flex-start;
  gap: 40px;
  padding-top: 60px;
  padding-bottom: 160px;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    flex-direction: column;
    width: 100%;
    align-items: center;
    align-content: center;
  `}
`

const Information = styled.div`
  display: flex;
  flex-direction: column;
  width: 548px;
  order: 1;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100vw;
    padding: 0 16px;
  `}
`
const CardGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 548px;
  order: 3;

  ${({ theme }) => theme.mediaWidth.upToExtraSmall`
    width: 100vw;
    padding: 0 16px;
  `}
`
const Card = styled.div`
  display: flex;
  border: 1px solid ${({ theme }) => theme.border};
  border-radius: 20px;
  gap: 12px;
  width: 100%;
  padding: 24px 16px;
`
const Image = styled.img`
  height: 44px;
  width: 44px;
`
const KyberImageWrapper = styled.div`
  width: 404px;
  display: flex;
  justify-content: center;
  order: 2;
  ${({ theme }) => theme.mediaWidth.upToMedium`
    display: none;
  `}
`
const CardInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`
const TextButton = styled.button`
  border: none;
  outline: none;
  background: none;
  cursor: pointer;
  padding: 0;
  ${({ theme }) => css`
    color: ${theme.primary};
    :hover {
      color: ${lighten(0.2, theme.primary)};
    }
  `}
`
export default function StakeKNC() {
  const theme = useTheme()
  const toggleMigrationModal = useToggleModal(ApplicationModal.MIGRATE_KNC)
  return (
    <Wrapper>
      <Container>
        <Information>
          <Text fontSize={36} lineHeight="42px" fontWeight={500} marginBottom="36px">
            <Trans>
              Stake{' '}
              <Text as="span" color={theme.primary}>
                KNC
              </Text>
            </Trans>
          </Text>
          <Text fontSize={16} lineHeight="24px" fontWeight={400} color={theme.subText} marginBottom="24px">
            <Trans>
              Kyber Network and its products like KyberSwap are governed by the community through KyberDAO, a
              Decentralized Autonomous Organization.
            </Trans>
          </Text>
          <Text fontSize={16} lineHeight="24px" fontWeight={400} color={theme.subText}>
            <Trans>
              KNC holders stake KNC tokens to vote on governance proposals that shape Kyber&lsquo;s future and earn KNC
              rewards from trading fees.
            </Trans>
          </Text>
        </Information>
        <KyberImageWrapper>
          <img src={kyberCrystal} alt="KyberDAO" />
        </KyberImageWrapper>
        <CardGroup>
          <Card>
            <Image src={governancePNG} alt="DAO Governance" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                DAO Governance
              </Text>
              <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText}>
                KNC holders can stake their tokens to vote on proposals and receive rewards in KNC
              </Text>
            </CardInfo>
          </Card>
          <Card>
            <Image src={stakevotePNG} alt="Stake + Vote" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                Stake + Vote
              </Text>
              <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText}>
                The more you stake and vote, the more KNC you will earn.{' '}
                <Link to="/kyberdao/vote" style={{ textDecoration: 'none' }}>
                  Vote now ↗
                </Link>
              </Text>
            </CardInfo>
          </Card>
          <Card>
            <Image src={migratePNG} alt="Migrate" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                Migrate
              </Text>
              <TextButton></TextButton>
              <TextButton onClick={toggleMigrationModal}>
                <Text fontSize={12} lineHeight="16px" fontWeight={500} textAlign="left">
                  Migrate your KNCL tokens to KNC
                </Text>
              </TextButton>
            </CardInfo>
          </Card>
          <Card>
            <Image src={kyberdaoPNG} alt="KyberDAO v1" />
            <CardInfo>
              <Text fontSize={20} lineHeight="24px" fontWeight={500} color={theme.text}>
                KyberDAO v1
              </Text>
              <Text fontSize={12} lineHeight="16px" fontWeight={500} color={theme.subText}>
                You can access legacy KyberDAO v1 to read about previous KIPs{' '}
                <a href="https://legacy.kyber.org/vote" target="_blank" rel="noreferrer">
                  here ↗
                </a>
              </Text>
            </CardInfo>
          </Card>
          <Text fontSize={12} lineHeight="14px" fontWeight={400} color={theme.subText} fontStyle="italic">
            Note: Staking KNC is only available on Ethereum chain
          </Text>
        </CardGroup>

        <StakeKNCComponent />
      </Container>
      <MigrateModal />
    </Wrapper>
  )
}
