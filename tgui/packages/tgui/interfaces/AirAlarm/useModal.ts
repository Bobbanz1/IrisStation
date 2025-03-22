import { createContext, Dispatch, SetStateAction, useContext } from 'react';

import { ActiveModal } from './types';

type ModalContextType = [ActiveModal, Dispatch<SetStateAction<ActiveModal>>];

export const ModalContext = createContext<ModalContextType>([
  undefined,
  () => {},
]);

export function useAlarmModal() {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useAlarmModal must be used within a ModalProvider');
  }

  return context;
}
