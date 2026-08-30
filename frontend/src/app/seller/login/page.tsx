'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { loginStart, loginSuccess } from '@/store/slices/authSlice';
import { Box, Button, Container, Heading, Input, VStack, Text, HStack, Card, Badge } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiBriefcase, FiLock, FiAlertCircle, FiArrowRight, FiZap, FiUser } from 'react-icons/fi';
import { showToast } from '@/components/Toast';

export default function SellerLoginPage() {
  const [managerName, setManagerName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token && user) {
      if (user.role === 'warehouse_manager' || user.role === 'seller') {
        router.push('/seller');
      } else if (user.role === 'admin') {
        router.push('/admin');
      } else {
        router.push('/');
      }
    }
  }, [token, user, router]);

  const handleSellerLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const finalEmail = email.trim() || 'rabia.ozden@flashdepo.com';
    const emailPrefix = finalEmail.split('@')[0];
    const derivedName = emailPrefix ? emailPrefix.split(/[\._\-0-9]+/).filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ') : 'Rabia Özden';
    const finalName = managerName.trim() || (derivedName === 'Depo Yoneticisi' ? 'Rabia Özden' : derivedName);

    const demoUser = {
      id: 'seller-1',
      name: finalName,
      email: finalEmail,
      role: 'warehouse_manager',
      managerTitle: finalName
    };
    const demoToken = 'demo-seller-token';
    localStorage.setItem('token', demoToken);
    localStorage.setItem('user', JSON.stringify(demoUser));
    dispatch(loginSuccess({ token: demoToken, user: demoUser }));
    showToast(`🏢 Hoş geldiniz ${finalName}! Depo Stok Paneline giriş yapıldı.`, 'success');
    router.push('/seller');
  };

  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" px={4} py={12}>
      <Container maxW="440px">
        <Card.Root bg="gray.900" borderColor="cyan.500/30" borderWidth="1px" borderRadius="2xl" p={2}>
          <Card.Header p={6} pb={2} textAlign="center">
            <VStack gap={3}>
              <Box p={3} bg="cyan.500/10" borderRadius="xl" color="cyan.400">
                <FiBriefcase size={28} />
              </Box>
              <Badge colorPalette="cyan" variant="subtle" size="sm" borderRadius="md" px={3} py={1}>
                Depo Yöneticisi Giriş Portalı
              </Badge>
              <Heading size="lg" color="white" fontWeight="bold">
                Depo Yöneticisi Girişi
              </Heading>
              <Text color="gray.400" fontSize="xs">
                Adınızı ve e-postanızı girerek Depo Stok Paneline yetkili girişi yapın.
              </Text>
            </VStack>
          </Card.Header>

          <Card.Body p={6}>
            <form onSubmit={handleSellerLogin}>
              <VStack gap={4}>
                <Box w="full">
                  <Text color="gray.300" fontSize="xs" fontWeight="bold" mb={1}>Depo Yetkilisi Adı Soyadı *</Text>
                  <Input
                    type="text"
                    placeholder="Örn: Ahmet Yılmaz veya Rabia Özden"
                    value={managerName}
                    onChange={(e) => setManagerName(e.target.value)}
                    bg="gray.950"
                    borderColor="cyan.500/50"
                    color="white"
                    borderRadius="xl"
                    size="md"
                  />
                </Box>

                <Box w="full">
                  <Text color="gray.300" fontSize="xs" fontWeight="bold" mb={1}>E-Posta Adresi</Text>
                  <Input
                    type="email"
                    placeholder="depo.yoneticisi@flashdepo.com"
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
                  size="lg"
                  colorPalette="cyan"
                  variant="solid"
                  borderRadius="xl"
                  fontWeight="900"
                  fontSize="sm"
                  boxShadow="0 4px 20px rgba(6,182,212,0.3)"
                  mt={2}
                >
                  <FiZap size={18} /> 🚀 DEPO YÖNETİCİSİ OLARAK GİRİŞ YAP
                </Button>
              </VStack>
            </form>
          </Card.Body>

          <Card.Footer p={6} pt={0} display="flex" flexDirection="column" gap={3}>
            <Text color="gray.500" fontSize="xs" textAlign="center">
              Satıcı hesabınız yok mu?{' '}
              <Link href="/apply">
                <Text color="cyan.400" as="span" fontWeight="bold" _hover={{ textDecoration: 'underline' }}>
                  Satıcı Başvurusu Yapın
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
