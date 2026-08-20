'use client';

import { ChakraProvider as Provider, defaultSystem } from '@chakra-ui/react';

export function ChakraProvider({ children }: { children: React.ReactNode }) {
    return <Provider value={defaultSystem}>{children}</Provider>;
}
