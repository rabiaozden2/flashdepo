'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { registerStart } from '@/store/slices/authSlice';
import { Box, Button, VStack, Text, HStack, Heading } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [focused, setFocused] = useState<string | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (submitted && !loading && !error) {
      alert('Kayıt başarılı! Lütfen giriş yapın.');
      router.push('/auth/login');
    }
  }, [submitted, loading, error, router]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    dispatch(registerStart({ email, password, role: 'customer' }));
  };

  const inputStyle = (name: string) => ({
    background: focused === name ? 'rgba(236,72,153,0.15)' : 'rgba(255,255,255,0.05)',
    border: `1px solid ${focused === name ? 'rgba(236,72,153,0.6)' : 'rgba(255,255,255,0.1)'}`,
    borderRadius: '12px',
    color: 'white',
    height: '52px',
    fontSize: '15px',
    paddingLeft: '16px',
    transition: 'all 0.3s ease',
    outline: 'none',
    boxShadow: focused === name ? '0 0 20px rgba(236,72,153,0.2)' : 'none',
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
              background: 'linear-gradient(135deg, #ec4899, #f97316)',
              borderRadius: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '28px',
              boxShadow: '0 8px 24px rgba(236,72,153,0.5)',
            }}
          >
            🚀
          </Box>
          <Heading
            size="xl"
            fontWeight="900"
            style={{
              background: 'linear-gradient(135deg, #ffffff, #ec4899)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Hesap Oluştur
          </Heading>
          <Text color="whiteAlpha.500" fontSize="sm" textAlign="center">
            Ücretsiz kayıt ol, flash sale fırsatlarını yakala!
          </Text>
        </VStack>

        {/* Error */}
        {error && submitted && (
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
            <Text fontSize="sm" color="whiteAlpha.700" mb={2} fontWeight="600">
              Şifre <Text as="span" color="whiteAlpha.400" fontWeight="400">(Min. 6 karakter)</Text>
            </Text>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              onFocus={() => setFocused('password')}
              onBlur={() => setFocused(null)}
              required
              minLength={6}
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
                ? 'rgba(236,72,153,0.4)'
                : 'linear-gradient(135deg, #ec4899, #f97316)',
              border: 'none',
              borderRadius: '14px',
              color: 'white',
              fontWeight: '800',
              fontSize: '15px',
              height: '52px',
              boxShadow: loading ? 'none' : '0 8px 24px rgba(236,72,153,0.5)',
              transition: 'all 0.3s ease',
              cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Kayıt yapılıyor...' : '🚀 Kayıt Ol'}
          </Button>
        </VStack>

        {/* Divider */}
        <HStack gap={3} my={6}>
          <Box flex={1} h="1px" bg="rgba(255,255,255,0.08)" />
          <Text fontSize="xs" color="whiteAlpha.400">veya</Text>
          <Box flex={1} h="1px" bg="rgba(255,255,255,0.08)" />
        </HStack>

        {/* Login link */}
        <Text textAlign="center" color="whiteAlpha.500" fontSize="sm">
          Zaten hesabın var mı?{' '}
          <Link href="/auth/login">
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
              Giriş Yap →
            </Text>
          </Link>
        </Text>
      </Box>
    </Box>
  );
}
