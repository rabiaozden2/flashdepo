'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { loginStart, loginSuccess } from '@/store/slices/authSlice';
import { Box, Button, Container, Heading, Input, VStack, Text, HStack, Card, Badge } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiShield, FiLock, FiAlertCircle, FiArrowRight, FiZap } from 'react-icons/fi';
import { showToast } from '@/components/Toast';

export default function AdminLoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'admin') {
        router.push('/admin');
      } else if (user.role === 'warehouse_manager' || user.role === 'seller') {
        router.push('/seller');
      } else {
        router.push('/');
      }
    }
  }, [token, user, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    dispatch(loginStart({ email, password }));
  };

  const handleQuickAdminLogin = () => {
    const demoUser = { id: 'admin-1', email: 'admin@flashdepo.com', role: 'admin' };
    const demoToken = 'demo-admin-token';
    localStorage.setItem('token', demoToken);
    localStorage.setItem('user', JSON.stringify(demoUser));
    dispatch(loginSuccess({ token: demoToken, user: demoUser }));
    showToast('👑 Admin olarak hızlı giriş yapıldı!', 'success');
    router.push('/admin');
  };

  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" px={4} py={12}>
      <Container maxW="420px">
        <Card.Root bg="gray.900" borderColor="fuchsia.500/30" borderWidth="1px" borderRadius="2xl" p={2}>
          <Card.Header p={6} pb={2} textAlign="center">
            <VStack gap={3}>
              <Box p={3} bg="fuchsia.500/10" borderRadius="xl" color="fuchsia.400">
                <FiShield size={28} />
              </Box>
              <Badge colorPalette="pink" variant="subtle" size="sm" borderRadius="md" px={3} py={1}>
                Yönetici & Admin Portalı
              </Badge>
              <Heading size="lg" color="white" fontWeight="bold">
                Admin Girişi
              </Heading>
              <Text color="gray.400" fontSize="xs">
                Sistem yönetimi, onaylar ve tüm depoların kontrolü için giriş yapın.
              </Text>
            </VStack>
          </Card.Header>

          <Card.Body p={6}>
            {/* Tek Tıkla Hızlı Admin Girişi Butonu */}
            <Button
              w="full"
              mb={6}
              size="lg"
              colorPalette="pink"
              variant="solid"
              borderRadius="xl"
              fontWeight="900"
              fontSize="sm"
              boxShadow="0 4px 20px rgba(236,72,153,0.3)"
              onClick={handleQuickAdminLogin}
            >
              <FiZap size={18} /> 🚀 TEK TIKLA ADMİN OLARAK GİRİŞ YAP
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
                  <Text color="gray.300" fontSize="xs" fontWeight="bold" mb={1}>Admin E-Posta</Text>
                  <Input
                    type="email"
                    placeholder="admin@flashdepo.com"
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
                  colorPalette="pink"
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
            <Link href="/">
              <Text color="gray.400" fontSize="xs" textAlign="center" _hover={{ textDecoration: 'underline' }}>
                Anasayfaya Dön
              </Text>
            </Link>

            <Box borderTop="1px solid" borderColor="whiteAlpha.100" pt={4} w="full">
              <Text color="gray.400" fontSize="xs" fontWeight="bold" mb={2} textAlign="center">
                🌐 DİĞER PORTAL GİRİŞLERİ
              </Text>
              <VStack gap={2} w="full">
                <Button
                  w="full"
                  size="sm"
                  colorPalette="emerald"
                  variant="outline"
                  borderRadius="lg"
                  fontSize="xs"
                  fontWeight="bold"
                  onClick={() => window.location.href = 'http://localhost:3000/auth/login'}
                >
                  🛒 Müşteri Girişi (Port 3000)
                </Button>

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
              </VStack>
            </Box>
          </Card.Footer>
        </Card.Root>
      </Container>
    </Box>
  );
}
