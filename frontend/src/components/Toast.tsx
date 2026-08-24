'use client';

import { Box, HStack, Text } from '@chakra-ui/react';
import { useState, useEffect } from 'react';
import { FiCheckCircle, FiAlertCircle, FiInfo, FiX } from 'react-icons/fi';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'info';
  message: string;
}

let toastListener: ((toast: ToastMessage) => void) | null = null;

export const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
  if (toastListener) {
    toastListener({
      id: Math.random().toString(36).substring(2, 9),
      type,
      message,
    });
  }
};

export default function ToastContainer() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    toastListener = (toast: ToastMessage) => {
      setToasts(prev => [...prev, toast]);
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== toast.id));
      }, 4000);
    };

    return () => {
      toastListener = null;
    };
  }, []);

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <Box
      position="fixed"
      bottom="24px"
      right="24px"
      zIndex={9999}
      display="flex"
      flexDirection="column"
      gap="10px"
      maxW="380px"
      w="calc(100vw - 48px)"
      pointerEvents="none"
    >
      {toasts.map(toast => {
        const isSuccess = toast.type === 'success';
        const isError = toast.type === 'error';

        const bg = isSuccess
          ? 'linear-gradient(135deg, rgba(16,185,129,0.95), rgba(6,182,212,0.95))'
          : isError
          ? 'linear-gradient(135deg, rgba(239,68,68,0.95), rgba(225,29,72,0.95))'
          : 'linear-gradient(135deg, rgba(124,58,237,0.95), rgba(236,72,153,0.95))';

        const icon = isSuccess ? (
          <FiCheckCircle size={20} color="white" />
        ) : isError ? (
          <FiAlertCircle size={20} color="white" />
        ) : (
          <FiInfo size={20} color="white" />
        );

        return (
          <Box
            key={toast.id}
            pointerEvents="auto"
            style={{
              background: bg,
              backdropFilter: 'blur(16px)',
              borderRadius: '16px',
              padding: '14px 18px',
              color: 'white',
              boxShadow: '0 12px 32px rgba(0,0,0,0.4)',
              border: '1px solid rgba(255,255,255,0.2)',
              animation: 'slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            <HStack justify="space-between" align="center" gap={3}>
              <HStack gap={3}>
                <Box flexShrink={0}>{icon}</Box>
                <Text fontSize="14px" fontWeight="600" color="white" lineHeight="1.4">
                  {toast.message}
                </Text>
              </HStack>
              <Box
                cursor="pointer"
                onClick={() => removeToast(toast.id)}
                opacity={0.8}
                _hover={{ opacity: 1 }}
                p={1}
              >
                <FiX size={16} color="white" />
              </Box>
            </HStack>
          </Box>
        );
      })}
    </Box>
  );
}
