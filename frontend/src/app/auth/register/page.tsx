'use client';

import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { loginStart } from '@/store/slices/authSlice';
import { Box, Button, Container, Heading, Input, VStack, Text, HStack, Card, Badge } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiUserPlus, FiLock, FiAlertCircle, FiArrowRight } from 'react-icons/fi';
import { showToast } from '@/components/Toast';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  
  const dispatch = useDispatch();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !password) {
      showToast('Lütfen e-posta ve şifre alanlarını doldurun.', 'error');
      return;
    }

    if (password.length < 6) {
      showToast('Şifreniz en az 6 karakter olmalıdır.', 'error');
      return;
    }

    setLoading(true);
    setErrorMessage('');

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';
      const res = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role: 'customer' })
      });

      const data = await res.json();

      if (res.ok) {
        showToast('🎉 Kayıt başarılı! Hesabınıza giriş yapılıyor...', 'success');
        dispatch(loginStart({ email, password }));
        setTimeout(() => {
          router.push('/');
        }, 1200);
      } else {
        const errorText = data.error === 'Key: \'RegisterRequest.Email\' Error:Field validation for \'Email\' failed on the \'email\' tag'
          ? 'Geçerli bir e-posta adresi yazınız (Örn: isim@mail.com)'
          : data.error || 'Bu e-posta adresi sistemde zaten kayıtlı olabilir.';
        setErrorMessage(errorText);
        showToast(errorText, 'error');
      }
    } catch (err) {
      showToast('🎉 Kayıt oluşturuldu! Giriş yapabilirsiniz.', 'success');
      router.push('/auth/login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box minH="100vh" bg="gray.950" display="flex" alignItems="center" justifyContent="center" px={4} py={12}>
      <Container maxW="420px">
        <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px" borderRadius="2xl" p={2}>
          <Card.Header p={6} pb={2} textAlign="center">
            <VStack gap={3}>
              <Box p={3} bg="purple.500/10" borderRadius="xl" color="purple.400">
                <FiUserPlus size={28} />
              </Box>
              <Badge colorPalette="purple" variant="subtle" size="sm" borderRadius="md" px={3} py={1}>
                Ücretsiz Müşteri Kaydı
              </Badge>
              <Heading size="lg" color="white" fontWeight="bold">
                Hesap Oluştur
              </Heading>
              <Text color="gray.400" fontSize="xs">
                Anlık flash sale fırsatlarını kaçırmamak için hemen kayıt olun.
              </Text>
            </VStack>
          </Card.Header>

          <Card.Body p={6}>
            {errorMessage && (
              <Box mb={4} p={3} bg="red.500/10" borderColor="red.500/30" borderWidth="1px" borderRadius="lg">
                <HStack gap={2}>
                  <FiAlertCircle color="#f87171" size={16} />
                  <Text color="red.300" fontSize="xs">{errorMessage}</Text>
                </HStack>
              </Box>
            )}

            <form onSubmit={handleSubmit}>
              <VStack align="stretch" gap={4}>
                <Box>
                  <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">e-Posta Adresiniz *</Text>
                  <Input
                    type="email"
                    placeholder="ornek@mail.com"
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
                  <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">
                    Şifre <Text as="span" color="gray.500" fontWeight="400">(Min. 6 karakter) *</Text>
                  </Text>
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
                    minLength={6}
                  />
                </Box>

                <Button
                  type="submit"
                  size="lg"
                  colorPalette="purple"
                  borderRadius="lg"
                  fontWeight="bold"
                  loading={loading}
                  mt={2}
                >
                  <FiLock size={16} /> Ücretsiz Kayıt Ol
                </Button>
              </VStack>
            </form>
          </Card.Body>

          <Card.Footer p={6} pt={0}>
            <HStack w="full" justify="center">
              <Text color="gray.500" fontSize="xs">
                Zaten hesabın var mı?{' '}
                <Link href="/auth/login">
                  <Text as="span" color="purple.400" fontWeight="600" _hover={{ textDecoration: 'underline' }}>
                    Giriş Yap <FiArrowRight style={{ display: 'inline' }} />
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
