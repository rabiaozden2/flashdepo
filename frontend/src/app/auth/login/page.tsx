'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { loginStart, loginSuccess } from '@/store/slices/authSlice';
import { Box, Button, Container, Heading, Input, VStack, Text, HStack, Card, Badge } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUser, FiLock, FiAlertCircle, FiArrowRight, FiZap } from 'react-icons/fi';
import { showToast } from '@/components/Toast';

export default function CustomerLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'customer') {
        router.push('/');
      } else if (user.role === 'warehouse_manager' || user.role === 'seller') {
        router.push('/seller');
      } else if (user.role === 'admin') {
        router.push('/admin');
      }
    }
  }, [token, user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginStart({ email, password }));
  };

  const handleQuickCustomerLogin = () => {
    const demoUser = { id: 'cust-1', email: 'musteri@flashdepo.com', role: 'customer' };
    const demoToken = 'demo-customer-token';
    localStorage.setItem('token', demoToken);
    localStorage.setItem('user', JSON.stringify(demoUser));
    dispatch(loginSuccess({ token: demoToken, user: demoUser }));
    showToast('🛒 Müşteri olarak hızlı giriş yapıldı!', 'success');
    router.push('/');
  };

  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" px={4} py={12}>
      <Container maxW="420px">
        <Card.Root bg="gray.900" borderColor="emerald.500/30" borderWidth="1px" borderRadius="2xl" p={2}>
          <Card.Header p={6} pb={2} textAlign="center">
            <VStack gap={3}>
              <Box p={3} bg="emerald.500/10" borderRadius="xl" color="emerald.400">
                <FiUser size={28} />
              </Box>
              <Badge colorPalette="emerald" variant="subtle" size="sm" borderRadius="md" px={3} py={1}>
                Müşteri Giriş Portalı
              </Badge>
              <Heading size="lg" color="white" fontWeight="bold">
                Müşteri Girişi
              </Heading>
              <Text color="gray.400" fontSize="xs">
                Anlık flash sale fırsatlarını incelemek ve sipariş vermek için giriş yapın.
              </Text>
            </VStack>
          </Card.Header>

          <Card.Body p={6}>
            {/* Tek Tıkla Hızlı Müşteri Girişi Butonu */}
            <Button
              w="full"
              mb={6}
              size="lg"
              colorPalette="emerald"
              variant="solid"
              borderRadius="xl"
              fontWeight="900"
              fontSize="sm"
              boxShadow="0 4px 20px rgba(16,185,129,0.3)"
              onClick={handleQuickCustomerLogin}
            >
              <FiZap size={18} /> 🚀 TEK TIKLA MÜŞTERİ OLARAK GİRİŞ YAP
            </Button>

            <Box borderBottom="1px solid" borderColor="whiteAlpha.100" mb={6} textAlign="center" position="relative">
              <Text position="absolute" top="-10px" left="50%" transform="translateX(-50%)" bg="gray.900" px={3} color="whiteAlpha.400" fontSize="xs">
                veya E-Posta ile
              </Text>
            </Box>

            {error && (
              <Box mb={4} p={3} bg="red.500/10" borderColor="red.500/30" borderWidth="1px" borderRadius="lg">
                <HStack gap={2}>
                  <FiAlertCircle color="#f87171" size={16} />
                  <Text color="red.400" fontSize="xs">{error}</Text>
                </HStack>
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <VStack gap={4}>
                <Box w="full">
                  <Text color="gray.300" fontSize="xs" fontWeight="bold" mb={1}>E-Posta Adresi</Text>
                  <Input
                    type="email"
                    placeholder="musteri@flashdepo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    bg="gray.950"
                    borderColor="gray.800"
                    color="white"
                    borderRadius="xl"
                    size="md"
                  />
                </Box>

                <Box w="full">
                  <Text color="gray.300" fontSize="xs" fontWeight="bold" mb={1}>Şifre</Text>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    bg="gray.950"
                    borderColor="gray.800"
                    color="white"
                    borderRadius="xl"
                    size="md"
                  />
                </Box>

                <Button
                  type="submit"
                  w="full"
                  size="md"
                  colorPalette="emerald"
                  variant="subtle"
                  borderRadius="xl"
                  loading={loading}
                  mt={2}
                >
                  <HStack gap={2}>
                    <Text>Giriş Yap</Text>
                    <FiArrowRight size={16} />
                  </HStack>
                </Button>
              </VStack>
            </form>
          </Card.Body>

          <Card.Footer p={6} pt={0} display="flex" flexDirection="column" gap={3}>
            <Text color="gray.500" fontSize="xs" textAlign="center">
              Hesabınız yok mu?{' '}
              <Link href="/auth/register">
                <Text color="emerald.400" as="span" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                  Kayıt Olun
                </Text>
              </Link>
            </Text>

            <Box borderTop="1px solid" borderColor="whiteAlpha.100" pt={4} w="full">
              <Text color="gray.400" fontSize="xs" fontWeight="bold" mb={2} textAlign="center">
                🌐 DİĞER PORTAL GİRİŞLERİ
              </Text>
              <VStack gap={2} w="full">
                <Button
                  w="full"
                  size="sm"
                  colorPalette="cyan"
                  variant="outline"
                  borderRadius="lg"
                  fontSize="xs"
                  fontWeight="bold"
                  onClick={() => window.location.href = 'http://localhost:3001'}
                >
                  🏢 Depo Yöneticisi Girişi (Port 3001)
                </Button>

                <Button
                  w="full"
                  size="sm"
                  colorPalette="pink"
                  variant="outline"
                  borderRadius="lg"
                  fontSize="xs"
                  fontWeight="bold"
                  onClick={() => window.location.href = 'http://localhost:3002'}
                >
                  👑 Admin Girişi (Port 3002)
                </Button>
              </VStack>
            </Box>
          </Card.Footer>
        </Card.Root>
      </Container>
    </Box>
  );
}
