import styled from 'styled-components'
import bgimg from 'assets/images/black_friday_background.png'
import bgimg2 from 'assets/images/about_background.png'

export const Referralv2Wrapper = styled.div`
  width: 100%;
`
export const HeaderWrapper = styled.div`
  width: 100%;
  height: 380px;
  margin:auto;
  display:flex;
  justify-content: center;
  background-image: url('${bgimg}');
  background-repeat: no-repeat;
  background-position-y: bottom;
  background-size: cover;
`
export const Container = styled.div`
  width: 1016px;
  margin: auto;
`
export const CreateReferralBox = styled.div`
  background: ${({ theme }) => theme.buttonBlack};
  border-radius: 20px;
  padding: 24px;
  flex: 1;
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
`
export const CopyTextInput = styled.input`
  border: none;
  background: none;
  flex: 1;
`
