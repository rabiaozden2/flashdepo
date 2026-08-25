'use client';

import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { loginStart } from '@/store/slices/authSlice';
import { Box, Button, Container, Heading, Input, VStack, Text, HStack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FiShield, FiBriefcase, FiUser, FiZap } from 'react-icons/fi';

export default function LoginPage() {
  const [portalRole, setPortalRole] = useState<'customer' | 'warehouse_manager' | 'admin'>('customer');
  const [email, setEmail] = useState('customer@flashdepo.com');
  const [password, setPassword] = useState('customer123');
  const [focused, setFocused] = useState<string | null>(null);
  const dispatch = useDispatch();
  const router = useRouter();
  const { loading, error, token } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (token) router.push('/');
  }, [token, router]);

  const handleRoleSwitch = (role: 'customer' | 'warehouse_manager' | 'admin') => {
    setPortalRole(role);
    if (role === 'customer') {
      setEmail('customer@flashdepo.com');
      setPassword('customer123');
    } else if (role === 'warehouse_manager') {
      setEmail('manager1@flashdepo.com');
      setPassword('manager123');
    } else {
      setEmail('admin@flashdepo.com');
      setPassword('admin123');
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(loginStart({ email, password }));
  };

  return (
    <Box
      minH="100vh"
      display="flex"
      alignItems="center"
      justifyContent="center"
      position="relative"
      zIndex={1}
      px={4}
      py={10}
    >
      <Box
        w="full"
        maxW="440px"
        style={{
          background: 'rgba(255,255,255,0.04)',
          backdropFilter: 'blur(30px)',
          WebkitBackdropFilter: 'blur(30px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '28px',
          padding: '40px 32px',
          boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
        }}
      >
        {/* Role Portal Selection Tabs */}
        <VStack gap={3} mb={6}>
          <Text fontSize="xs" color="whiteAlpha.500" fontWeight="700" textTransform="uppercase" letterSpacing="1px">
            Giriş Yapılacak Portalı Seçin
          </Text>
          <HStack gap={1.5} w="full">
            <Button
              flex={1}
              size="xs"
              colorPalette="emerald"
              variant={portalRole === 'customer' ? 'solid' : 'subtle'}
              borderRadius="xl"
              onClick={() => handleRoleSwitch('customer')}
              py={2.5}
            >
              <FiUser size={12} /> Müşteri
            </Button>
            <Button
              flex={1}
              size="xs"
              colorPalette="cyan"
              variant={portalRole === 'warehouse_manager' ? 'solid' : 'subtle'}
              borderRadius="xl"
              onClick={() => handleRoleSwitch('warehouse_manager')}
              py={2.5}
            >
              <FiBriefcase size={12} /> Depo Yön.
            </Button>
            <Button
              flex={1}
              size="xs"
              colorPalette="pink"
              variant={portalRole === 'admin' ? 'solid' : 'subtle'}
              borderRadius="xl"
              onClick={() => handleRoleSwitch('admin')}
              py={2.5}
            >
              <FiShield size={12} /> Admin
            </Button>
          </HStack>
        </VStack>

        {/* Header */}
        <VStack gap={2} mb={6}>
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
            {portalRole === 'admin' ? 'Admin Girişi' : portalRole === 'warehouse_manager' ? 'Depo Yöneticisi Girişi' : 'Müşteri Girişi'}
          </Heading>
          <Text color="whiteAlpha.600" fontSize="xs" textAlign="center" px={2}>
            {portalRole === 'admin'
              ? 'Tüm sistem verilerini, depoları ve satışları yönetmek için giriş yapın.'
              : portalRole === 'warehouse_manager'
              ? 'Kendi deponuzun stoklarını ve ürünlerini yönetmek için giriş yapın.'
              : 'Aktif flash sale kampanyalarını inceleyin ve anlık sipariş oluşturun.'}
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
            <Input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              placeholder="ornek@mail.com"
              size="lg"
              borderRadius="xl"
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.200"
              color="white"
              _focus={{ borderColor: "purple.400", bg: "whiteAlpha.200", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
              _placeholder={{ color: "whiteAlpha.400" }}
              h="52px"
            />
          </Box>

          <Box>
            <Text fontSize="sm" color="whiteAlpha.700" mb={2} fontWeight="600">Şifre</Text>
            <Input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              size="lg"
              borderRadius="xl"
              bg="whiteAlpha.100"
              borderColor="whiteAlpha.200"
              color="white"
              _focus={{ borderColor: "purple.400", bg: "whiteAlpha.200", boxShadow: "0 0 20px rgba(124,58,237,0.3)" }}
              _placeholder={{ color: "whiteAlpha.400" }}
              h="52px"
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
