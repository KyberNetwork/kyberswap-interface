import styled from 'styled-components'
import bgimg from 'assets/images/black_friday_background.png'
import bgimg2 from 'assets/images/about_background.png'

export const Referralv2Wrapper = styled.div`
  width: 100%;
`
export const HeaderWrapper = styled.div`
  width: 100%;
  padding-top: 64px;
  padding-bottom: 60px;
  margin: auto;
  display: flex;
  justify-content: center;
  background-image: url('${bgimg}');
  background-repeat: no-repeat;
  background-position-y: bottom;
  background-size: cover;
  ${({ theme }) => theme.mediaWidth.upToSmall`
    text-align: center;
  `}
`
export const Container = styled.div`
  max-width: 100vw;
  width: 1056px;
  padding: 0px 20px;
  margin: auto;
`
export const CreateReferralBox = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  padding: 24px;
  flex: 1;

  ${({ theme }) => theme.mediaWidth.upToSmall`
    background: inherit;
    width: 100%;
    padding: 0;
    margin-top: 70px;
  `}
`
export const ContentWrapper = styled.div`
  padding-top: 80px;
  padding-bottom: 80px;
  color: ${({ theme }) => theme.text};
  background-image: url(${bgimg2});
  background-size: cover;
  background-repeat: no-repeat;
  z-index: 1;
  background-color: transparent;
  background-position: top;
`
export const SectionWrapper = styled.div`
  margin-bottom: 80px;
`
export const SectionTitle = styled.div`
  font-size: 36px;
  font-weight: 500;
  line-height: 42px;
  margin-bottom: 28px;
`

export const CopyTextWrapper = styled.div`
  background-color: ${({ theme }) => theme.background};
  border-radius: 8px;
  border: none;
  width: 100%;
  height: 60px;
  margin-top: 16px;
  padding: 20px 16px;
  display: flex;
  align-items: center;
`
export const CopyTextInput = styled.input`
  border: none;
  background: none;
  flex: 1;
  color: ${({ theme }) => theme.text};
  text-align: right;
  margin-right: 15px;
`
export const PlaceholderText = styled.span`
  color: ${({ theme }) => theme.stroke};
  left: 0;
  font-size: 14px;
  width: 100px;
`
