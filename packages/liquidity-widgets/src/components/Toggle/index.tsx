import React, { CSSProperties, ReactNode } from "react";
import "./Toggle.scss";

export interface ToggleProps {
  id?: string;
  isActive: boolean;
  toggle: () => void;
  style?: CSSProperties;
  icon?: ReactNode;
}

const Toggle: React.FC<ToggleProps> = ({
  id,
  isActive,
  toggle,
  style,
  icon,
}) => {
  return (
    <div
      id={id}
      onClick={toggle}
      style={style}
      data-active={isActive}
      className="ks-lw-toggle"
    >
      <div className="dot">{isActive && icon}</div>
    </div>
  );
};

export default Toggle;
