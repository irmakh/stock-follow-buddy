

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import Modal from '../components/ui/Modal';
import Button from '../components/ui/Button';

interface ModalContent {
  title: string;
  content: ReactNode;
  footer?: ReactNode;
}

interface ModalContextType {
  showAlert: (title: string, content: ReactNode) => void;
  showConfirm: (title: string, content: ReactNode, onConfirm: () => void, confirmText?: string, confirmVariant?: 'primary' | 'danger' | 'secondary') => void;
  hideModal: () => void;
}

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<ModalContent | null>(null);

  const hideModal = useCallback(() => {
    setModalState(null);
  }, []);

  const showAlert = useCallback((title: string, content: ReactNode) => {
    setModalState({
      title,
      content,
      footer: <Button onClick={hideModal}>OK</Button>,
    });
  }, [hideModal]);

  const showConfirm = useCallback((
      title: string,
      content: ReactNode,
      onConfirm: () => void,
      confirmText = 'Confirm',
      confirmVariant: 'primary' | 'danger' | 'secondary' = 'primary'
    ) => {
    setModalState({
      title,
      content,
      footer: (
        <>
          <Button variant="secondary" onClick={hideModal}>Cancel</Button>
          <Button variant={confirmVariant} onClick={() => {
            onConfirm();
            hideModal();
          }}>
            {confirmText}
          </Button>
        </>
      ),
    });
  }, [hideModal]);

  return (
    <ModalContext.Provider value={{ showAlert, showConfirm, hideModal }}>
      {children}
      <Modal
        isOpen={!!modalState}
        onClose={hideModal}
        title={modalState?.title || ''}
        footer={modalState?.footer}
      >
        {modalState?.content}
      </Modal>
    </ModalContext.Provider>
  );
};

export const useModal = (): ModalContextType => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};