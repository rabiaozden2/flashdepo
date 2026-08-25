'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { loginStart } from '@/store/slices/authSlice';
import { Box, Button, Container, Heading, Input, VStack, Text, HStack, Card, Badge } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiShield, FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { showToast } from '@/components/Toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'admin' || user.role === 'warehouse_manager') {
        router.push('/admin');
      } else {
        showToast('Bu portal sadece Admin ve Depo Yöneticileri içindir.', 'error');
      }
    }
  }, [token, user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginStart({ email, password }));
  };

  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" px={4} py={12}>
      <Container maxW="420px">
        <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px" borderRadius="2xl" p={2}>
          <Card.Header p={6} pb={2} textAlign="center">
            <VStack gap={3}>
              <Box p={3} bg="pink.500/10" borderRadius="xl" color="pink.400">
                <FiShield size={28} />
              </Box>
              <Badge colorPalette="pink" variant="subtle" size="sm" borderRadius="md" px={3} py={1}>
                Yönetici & Admin Portalı
              </Badge>
              <Heading size="lg" color="white" fontWeight="bold">
                Yönetici Girişi
              </Heading>
              <Text color="gray.400" fontSize="xs">
                Sistem yöneticileri ve yetkili depo yöneticileri için güvenli yönetim portalı.
              </Text>
            </VStack>
          </Card.Header>

          <Card.Body p={6}>
            {error && (
              <Box mb={4} p={3} bg="red.500/10" borderColor="red.500/30" borderWidth="1px" borderRadius="lg">
                <HStack gap={2}>
                  <FiAlertCircle color="#f87171" size={16} />
                  <Text color="red.300" fontSize="xs">{error}</Text>
                </HStack>
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">Yönetici e-Posta</Text>
                  <Input
                    type="email"
                    placeholder="admin@flashdepo.com"
                    size="md"
                    borderRadius="lg"
                    bg="gray.950"
                    borderColor="gray.800"
                    color="white"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                  />
                </Box>

                <Box>
                  <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">Şifre</Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    size="md"
                    borderRadius="lg"
                    bg="gray.950"
                    borderColor="gray.800"
                    color="white"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                  />
                </Box>

                <Button
                  type="submit"
                  size="lg"
                  colorPalette="pink"
                  borderRadius="lg"
                  fontWeight="bold"
                  loading={loading}
                  mt={2}
                >
                  <FiLock size={16} /> Admin Paneline Giriş Yap
                </Button>
              </VStack>
            </form>
          </Card.Body>

          <Card.Footer p={6} pt={0}>
            <HStack w="full" justify="center">
              <Text color="gray.500" fontSize="xs">
                Müşteri misiniz?{' '}
                <Link href="/auth/login">
                  <Text as="span" color="cyan.400" fontWeight="600" _hover={{ textDecoration: 'underline' }}>
                    Müşteri Girişi Yap <FiArrowRight style={{ display: 'inline' }} />
                  </Text>
                </Link>
              </Text>
            </HStack>
          </Card.Footer>
        </Card.Root>
      </Container>
    </Box>
  );
}
