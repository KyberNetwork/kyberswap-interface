import { ReactElement } from 'react';

import ReactDOM from 'react-dom';

const Modal = ({
  isOpen,
  children,
  onClick,
  modalContentClass,
}: {
  isOpen: boolean;
  children: React.ReactNode;
  onClick?: () => void;
  modalContentClass?: string;
}) => {
  if (!isOpen) return <></>;

  return ReactDOM.createPortal(
    <div className="ks-lw-modal-overlay" onClick={onClick}>
      <div className={`ks-lw-modal-content ${modalContentClass || ''}`} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>,
    // already created in Widget/index.ts
    document.getElementById('ks-lw-modal-root')!,
  ) as ReactElement;
};

export default Modal;
