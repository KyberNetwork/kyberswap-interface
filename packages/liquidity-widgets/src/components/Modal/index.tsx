import ReactDOM from "react-dom";
import "./Modal.scss";
import { ReactElement } from "react";

const Modal = ({
  isOpen,
  children,
  onClick,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  onClick?: () => void;
}) => {
  if (!isOpen) return <></>;

  return ReactDOM.createPortal(
    <div className="ks-lw-modal-overlay" onClick={onClick}>
      <div className="ks-lw-modal-content" onClick={(e) => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    // already created in Widget/index.ts
    document.getElementById("ks-lw-modal-root")!
  ) as ReactElement;
};

export default Modal;
