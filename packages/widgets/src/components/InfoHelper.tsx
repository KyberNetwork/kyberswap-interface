import { Placement } from "@popperjs/core";
import { CSSProperties, ReactNode, useCallback, useState } from "react";
import styled from "styled-components";
import { ReactComponent as Info } from "../assets/info.svg";

import Tooltip from "./Tooltip";

const InfoWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  border: none;
  background: none;
  outline: none;
  cursor: default;
  border-radius: 36px;
  color: ${({ theme }) => theme.subText};

  :hover,
  :focus {
    opacity: 0.7;
  }
`;

const InfoHelperWrapper = styled.span`
  display: inline-flex;
  justify-content: center;
  margin-left: 0.25rem;
  align-items: center;
  line-height: 100%;
  vertical-align: middle;
`;

export default function InfoHelper({
  text,
  size = 14,
  placement,
  style,
  color,
}: {
  text: string | ReactNode;
  size?: number;
  isActive?: boolean;
  placement?: Placement;
  style?: CSSProperties;
  color?: string;
}) {
  const [show, setShow] = useState<boolean>(false);

  const open = useCallback(() => setShow(true), [setShow]);
  const close = useCallback(() => setShow(false), [setShow]);

  return (
    <InfoHelperWrapper style={style}>
      <Tooltip text={text} show={show} placement={placement} size={size}>
        <InfoWrapper onClick={open} onMouseEnter={open} onMouseLeave={close}>
          <Info style={{ color, width: size, height: size }} />
        </InfoWrapper>
      </Tooltip>
    </InfoHelperWrapper>
  );
}
