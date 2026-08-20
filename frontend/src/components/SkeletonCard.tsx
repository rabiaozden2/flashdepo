'use client';

import { Box, HStack, Skeleton, VStack } from '@chakra-ui/react';

export default function SkeletonCard() {
  return (
    <Box
      p={7}
      style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.05)',
        borderRadius: '24px',
      }}
    >
      <HStack justify="space-between" mb={6}>
        <Skeleton height="12px" width="40%" />
        <Skeleton height="16px" width="20%" borderRadius="full" />
      </HStack>
      <Skeleton height="28px" width="80%" mb={8} />
      
      <Box
        p={4}
        mb={6}
        style={{
          background: 'rgba(0,0,0,0.1)',
          borderRadius: '16px',
        }}
      >
        <HStack justify="space-between" align="flex-end">
          <VStack align="start" gap={2}>
            <Skeleton height="10px" width="60px" />
            <Skeleton height="24px" width="100px" />
          </VStack>
          <VStack align="end" gap={2}>
            <Skeleton height="10px" width="60px" />
            <Skeleton height="14px" width="60px" />
          </VStack>
        </HStack>
      </Box>

      <HStack justify="space-between" mb={8}>
        <Skeleton height="14px" width="30%" />
      </HStack>

      <Skeleton height="52px" width="100%" borderRadius="14px" />
    </Box>
  );
}
