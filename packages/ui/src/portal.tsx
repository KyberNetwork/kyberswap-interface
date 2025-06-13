import { useEffect, useRef } from 'react';

import { createPortal } from 'react-dom';

export const Portal: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const portalContainer = useRef<HTMLElement | null>(null);

  // Dynamically create a new div element for each instance of Portal
  useEffect(() => {
    const kyberPortal = document.createElement('kyber-portal');
    kyberPortal.className = 'ks-lw-style ks-lw-migration-style';
    document.body.appendChild(kyberPortal);
    portalContainer.current = kyberPortal;

    // Cleanup when the component unmounts
    return () => {
      if (portalContainer.current && document.body.contains(portalContainer.current)) {
        document.body.removeChild(portalContainer.current);
      }
    };
  }, []);

  if (!portalContainer.current) return null;

  return createPortal(children, portalContainer.current);
};
