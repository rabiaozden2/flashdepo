'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { loginStart } from '@/store/slices/authSlice';
import { Box, Button, Container, Heading, Input, VStack, Text, HStack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [focused, setFocused] = useState<string | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token) router.push('/');
  }, [token, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginStart({ email, password }));
  };

  const fillDemoAccount = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
  };

  const inputStyle = (name: string) => ({
    background: focused === name ? 'rgba(124,58,237,0.15)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${focused === name ? 'rgba(124,58,237,0.6)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '12px',
    color: 'white',
    height: '52px',
    fontSize: '15px',
    paddingLeft: '16px',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxShadow: focused === name ? '0 0 20px rgba(124,58,237,0.2)' : 'none',
    width: '100%',
  });

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      zIndex={1}
      px={4}
    >
      <Box
        w="full"
        maxW="420px"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '28px',
          padding: '48px 40px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Header */}
        <VStack gap={2} mb={8}>
          <Box
            mb={3}
            style={{
              width: '64px',
              height: '64px',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 24px rgba(124,58,237,0.5)',
            }}
          >
            ⚡
          </Box>
          <Heading
            size="xl"
            fontWeight="900"
            style={{
              background: 'linear-gradient(135deg, #ffffff, #a855f7)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Hoş Geldin
          </Heading>
          <Text color="whiteAlpha.500" fontSize="sm" textAlign="center">
            Hesabına giriş yap ve fırsatları yakala
          </Text>
        </VStack>

        {/* Error */}
        {error && (
          <Box
            mb={4}
            p={3}
            style={{
              background: 'rgba(239,68,68,0.12)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '12px',
            }}
          >
            <Text color="red.400" fontSize="sm" textAlign="center">{error}</Text>
          </Box>
        )}

        {/* Form */}
        <VStack as="form" onSubmit={handleSubmit} gap={4} align="stretch">
          <Box>
            <Text fontSize="sm" color="whiteAlpha.700" mb={2} fontWeight="600">E-posta</Text>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              onFocus={() => setFocused('email')}
              onBlur={() => setFocused(null)}
              required
              placeholder="ornek@mail.com"
              style={inputStyle('email')}
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="whiteAlpha.700" mb={2} fontWeight="600">Şifre</Text>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              required
              placeholder="••••••••"
              style={inputStyle('password')}
            />
          </Box>

          <Button
            type="submit"
            width="full"
            size="lg"
            disabled={loading}
            mt={2}
            style={{
              background: loading
                ? 'rgba(124,58,237,0.4)'
                : 'linear-gradient(135deg, #7c3aed, #ec4899)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontWeight: '800',
              fontSize: '15px',
              height: '52px',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(124,58,237,0.5)',
              transition: 'all 0.3s ease',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Giriş yapılıyor...' : '⚡ Giriş Yap'}
          </Button>
        </VStack>

        {/* Quick Demo Fill Buttons */}
        <Box mt={5} pt={4} borderTop="1px solid rgba(255,255,255,0.06)">
          <Text fontSize="xs" color="whiteAlpha.400" mb={2} textAlign="center" fontWeight="500">
            Hızlı Test İçin Örnek Hesaplar:
          </Text>
          <HStack gap={2} justify="center" flexWrap="wrap">
            <Button
              size="xs"
              variant="outline"
              onClick={() => fillDemoAccount('admin@flashdepo.com', 'admin123')}
              style={{ background: 'rgba(236,72,153,0.1)', border: '1px solid rgba(236,72,153,0.3)', color: '#f472b6', borderRadius: '8px' }}
            >
              👑 Admin
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => fillDemoAccount('manager1@flashdepo.com', 'manager123')}
              style={{ background: 'rgba(6,182,212,0.1)', border: '1px solid rgba(6,182,212,0.3)', color: '#38bdf8', borderRadius: '8px' }}
            >
              🏢 Depo Yöneticisi
            </Button>
            <Button
              size="xs"
              variant="outline"
              onClick={() => fillDemoAccount('customer@flashdepo.com', 'customer123')}
              style={{ background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.3)', color: '#34d399', borderRadius: '8px' }}
            >
              🛍️ Müşteri
            </Button>
          </HStack>
        </Box>

        {/* Divider */}
        <HStack gap={3} my={6}>
          <Box flex={1} h="1px" bg="rgba(255,255,255,0.08)" />
          <Text fontSize="xs" color="whiteAlpha.400">veya</Text>
          <Box flex={1} h="1px" bg="rgba(255,255,255,0.08)" />
        </HStack>

        {/* Register link */}
        <Text textAlign="center" color="whiteAlpha.500" fontSize="sm">
          Hesabın yok mu?{' '}
          <Link href="/auth/register">
            <Text
              as="span"
              fontWeight="700"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                cursor: 'pointer',
              }}
            >
              Kayıt Ol →
            </Text>
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
