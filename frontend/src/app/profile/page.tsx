'use client';

import { Box, Container, Heading, VStack, HStack, Text, Button, Badge } from '@chakra-ui/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/slices/authSlice';
import { clearCart } from '@/store/slices/cartSlice';
import { useEffect } from 'react';
import { FiUser, FiShield, FiPackage, FiLogOut, FiCheckCircle } from 'react-icons/fi';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state: RootState) => state.auth);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
  }, [token, router]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    dispatch(clearCart());
    router.push('/auth/login');
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return {
          title: 'Sistem Yöneticisi (Admin)',
          badge: 'Admin',
          colorPalette: 'pink',
          bg: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(124,58,237,0.2))',
          border: 'rgba(236,72,153,0.4)',
          color: '#f472b6',
          desc: 'Tüm sistem üzerinde tam yetki (Kampanya Ekle/Sil, Ürün Yönetimi, Kullanıcı Listeleme).',
        };
      case 'warehouse_manager':
        return {
          title: 'Depo Yöneticisi',
          badge: 'Depo Yöneticisi',
          colorPalette: 'cyan',
          bg: 'linear-gradient(135deg, rgba(6,182,212,0.2), rgba(59,130,246,0.2))',
          border: 'rgba(6,182,212,0.4)',
          color: '#38bdf8',
          desc: 'Depolara ürün ekleme, stok güncelleme ve lojistik takip yetkisi.',
        };
      default:
        return {
          title: 'Müşteri (Customer)',
          badge: 'Müşteri',
          colorPalette: 'emerald',
          bg: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.2))',
          border: 'rgba(16,185,129,0.4)',
          color: '#34d399',
          desc: 'Flash sale kampanyalarını inceleme, sepete ürün ekleme ve sipariş takibi yetkisi.',
        };
    }
  };

  const roleInfo = getRoleBadge(user.role);

  return (
    <Box position="relative" zIndex={1} minH="100vh" py={12} px={4}>
      <Container maxW="container.sm">
        <Box
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(30px)',
            WebkitBackdropFilter: 'blur(30px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '32px',
            padding: '48px 36px',
            boxShadow: '0 32px 80px rgba(0,0,0,0.4)',
          }}
        >
          <VStack gap={6} align="center">
            {/* Avatar */}
            <Box
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #7c3aed, #ec4899, #f97316)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '36px',
                fontWeight: '900',
                color: 'white',
                boxShadow: '0 12px 36px rgba(124,58,237,0.5)',
                border: '3px solid rgba(255,255,255,0.2)',
              }}
            >
              {user.email.charAt(0).toUpperCase()}
            </Box>

            <VStack gap={1} textAlign="center">
              <Heading size="xl" color="white" fontWeight="900">
                {user.email.split('@')[0]}
              </Heading>
              <Text color="whiteAlpha.600" fontSize="sm">
                {user.email}
              </Text>
            </VStack>

            {/* Role Badge Card */}
            <Box
              w="full"
              p={6}
              borderRadius="24px"
              style={{
                background: roleInfo.bg,
                border: `1px solid ${roleInfo.border}`,
              }}
            >
              <HStack justify="space-between" mb={3}>
                <HStack gap={2}>
                  <FiShield color={roleInfo.color} size={20} />
                  <Text fontWeight="800" color="white" fontSize="lg">
                    Rol & Yetki Seviyesi
                  </Text>
                </HStack>
                <Badge
                  style={{
                    background: roleInfo.border,
                    color: 'white',
                    padding: '6px 14px',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '800',
                  }}
                >
                  {roleInfo.badge}
                </Badge>
              </HStack>
              <Text color="whiteAlpha.800" fontSize="sm" lineHeight="1.6">
                {roleInfo.desc}
              </Text>
            </Box>

            {/* System Info Cards */}
            <VStack w="full" gap={3} align="stretch" mt={2}>
              <Box p={4} bg="rgba(0,0,0,0.3)" borderRadius="16px" border="1px solid rgba(255,255,255,0.05)">
                <HStack justify="space-between">
                  <HStack gap={2}>
                    <FiCheckCircle color="#34d399" />
                    <Text fontSize="sm" color="whiteAlpha.800">RBAC Erişim Kontrolü:</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="700" color="green.400">Aktif & Doğrulandı</Text>
                </HStack>
              </Box>

              <Box p={4} bg="rgba(0,0,0,0.3)" borderRadius="16px" border="1px solid rgba(255,255,255,0.05)">
                <HStack justify="space-between">
                  <HStack gap={2}>
                    <FiPackage color="#a855f7" />
                    <Text fontSize="sm" color="whiteAlpha.800">Kullanıcı Kimliği (ID):</Text>
                  </HStack>
                  <Text fontSize="xs" fontFamily="mono" color="whiteAlpha.600">
                    {user.id ? `${user.id.substring(0, 18)}...` : 'Aktif Oturum'}
                  </Text>
                </HStack>
              </Box>
            </VStack>

            {/* Action Buttons */}
            <VStack w="full" gap={3} mt={4}>
              {user.role === 'admin' && (
                <Button
                  w="full"
                  size="lg"
                  onClick={() => router.push('/admin')}
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    color: 'white',
                    fontWeight: '800',
                    borderRadius: '16px',
                    boxShadow: '0 8px 24px rgba(124,58,237,0.4)',
                  }}
                >
                  👑 Admin Paneline Git
                </Button>
              )}

              <Button
                w="full"
                size="lg"
                variant="outline"
                onClick={() => router.push('/orders')}
                style={{
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: 'white',
                  fontWeight: '700',
                  borderRadius: '16px',
                }}
              >
                🛒 Siparişlerimi Görüntüle
              </Button>

              <Button
                w="full"
                size="lg"
                onClick={handleLogout}
                style={{
                  background: 'rgba(239,68,68,0.12)',
                  border: '1px solid rgba(239,68,68,0.3)',
                  color: '#f87171',
                  fontWeight: '700',
                  borderRadius: '16px',
                  marginTop: '8px',
                }}
              >
                <HStack gap={2}>
                  <FiLogOut />
                  <Text>Oturumu Kapat</Text>
                </HStack>
              </Button>
            </VStack>
          </VStack>
        </Box>
      </Container>
    </Box>
  );
}
