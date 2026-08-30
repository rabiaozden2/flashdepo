'use client';

import { Box, Container, Heading, VStack, HStack, Text, Button, Badge, Input, Card } from '@chakra-ui/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { logout } from '@/store/slices/authSlice';
import { clearCart } from '@/store/slices/cartSlice';
import { useEffect, useState } from 'react';
import { FiUser, FiShield, FiPackage, FiLogOut, FiCheckCircle, FiBriefcase, FiSend, FiClock, FiShoppingBag } from 'react-icons/fi';
import { showToast } from '@/components/Toast';

export default function ProfilePage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state: RootState) => state.auth);

  // Application form state
  const [showAppForm, setShowAppForm] = useState(false);
  const [appWarehouse, setAppWarehouse] = useState('');
  const [appLocation, setAppLocation] = useState('');
  const [appTaxId, setAppTaxId] = useState('');
  const [appReason, setAppReason] = useState('');
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
    }
    // Check if user already applied
    if (user?.email) {
      const savedApps = JSON.parse(localStorage.getItem('manager_applications') || '[]');
      const userApp = savedApps.find((a: any) => a.email === user.email);
      if (userApp) setHasApplied(true);
    }
  }, [token, router, user]);

  if (!user) return null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    dispatch(clearCart());
    router.push('/auth/login');
  };

  const handleApplyManager = () => {
    if (!appWarehouse || !appLocation || !appTaxId) {
      showToast('Lütfen tüm zorunlu alanları doldurun.', 'error');
      return;
    }
    const newApp = {
      id: Date.now().toString(),
      email: user.email,
      userId: user.id,
      warehouseName: appWarehouse,
      location: appLocation,
      taxId: appTaxId,
      reason: appReason || 'Depo Yönetimi & Satış',
      status: 'pending',
      date: new Date().toLocaleDateString('tr-TR'),
    };

    const savedApps = JSON.parse(localStorage.getItem('manager_applications') || '[]');
    savedApps.push(newApp);
    localStorage.setItem('manager_applications', JSON.stringify(savedApps));

    setHasApplied(true);
    setShowAppForm(false);
    showToast('Depo Yöneticisi başvurunuz alındı! Admin onayının ardından hesabınız yetkilendirilecektir.', 'success');
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

            {/* Depo Yöneticisi Başvuru Kartı (Müşteri Yetkisinde Olanlar İçin) */}
            {user.role === 'customer' && (
              <Box w="full" p={5} bg="blackAlpha.400" borderRadius="2xl" border="1px solid rgba(6,182,212,0.3)">
                <VStack align="stretch" gap={3}>
                  <HStack justify="space-between">
                    <HStack gap={2}>
                      <FiBriefcase color="#38bdf8" size={20} />
                      <Text color="white" fontWeight="bold" fontSize="md">Depo Yöneticisi Olmak İster Mısınız?</Text>
                    </HStack>
                    {hasApplied && (
                      <Badge colorPalette="amber" variant="subtle">
                        <FiClock size={11} /> Bekliyor
                      </Badge>
                    )}
                  </HStack>

                  {hasApplied ? (
                    <Box p={3} bg="amber.500/10" borderRadius="xl" border="1px solid rgba(245,158,11,0.3)">
                      <Text color="amber.300" fontSize="xs" fontWeight="600">
                        ⏳ Depo Yöneticisi başvurunuz alındı. Sistem admininin incelemesinin ardından hesabınıza depo yönetim yetkisi tanımlanacaktır.
                      </Text>
                    </Box>
                  ) : (
                    <>
                      <Text color="whiteAlpha.600" fontSize="xs">
                        Kendi deponuzun stoklarını eklemek, anlık flash sale indirimi tanımlamak ve satıcı olmak için başvuru yapın.
                      </Text>

                      {!showAppForm ? (
                        <Button
                          size="md"
                          colorPalette="cyan"
                          variant="solid"
                          borderRadius="xl"
                          onClick={() => setShowAppForm(true)}
                        >
                          <FiBriefcase size={16} /> Satıcı & Depo Yöneticisi Başvurusu Yap
                        </Button>
                      ) : (
                        <VStack align="stretch" gap={3} mt={2} p={4} bg="blackAlpha.600" borderRadius="xl">
                          <Input
                            placeholder="Depo / İşletme Adı (Örn: Kadıköy Lojistik Deposu)"
                            size="md"
                            bg="blackAlpha.500"
                            borderColor="whiteAlpha.200"
                            color="white"
                            borderRadius="lg"
                            value={appWarehouse}
                            onChange={e => setAppWarehouse(e.target.value)}
                          />
                          <Input
                            placeholder="Şehir / Konum (Örn: İstanbul)"
                            size="md"
                            bg="blackAlpha.500"
                            borderColor="whiteAlpha.200"
                            color="white"
                            borderRadius="lg"
                            value={appLocation}
                            onChange={e => setAppLocation(e.target.value)}
                          />
                          <Input
                            placeholder="Vergi Kimlik No / İşletme No (Örn: 9876543210)"
                            size="md"
                            bg="blackAlpha.500"
                            borderColor="whiteAlpha.200"
                            color="white"
                            borderRadius="lg"
                            value={appTaxId}
                            onChange={e => setAppTaxId(e.target.value)}
                          />
                          <Input
                            placeholder="Açıklama / Ürün Türü (İsteğe bağlı)"
                            size="md"
                            bg="blackAlpha.500"
                            borderColor="whiteAlpha.200"
                            color="white"
                            borderRadius="lg"
                            value={appReason}
                            onChange={e => setAppReason(e.target.value)}
                          />
                          <HStack gap={2} pt={2}>
                            <Button
                              flex={1}
                              size="md"
                              colorPalette="cyan"
                              borderRadius="lg"
                              onClick={handleApplyManager}
                            >
                              <FiSend size={15} /> Başvuruyu Gönder
                            </Button>
                            <Button
                              size="md"
                              variant="subtle"
                              colorPalette="gray"
                              borderRadius="lg"
                              onClick={() => setShowAppForm(false)}
                            >
                              İptal
                            </Button>
                          </HStack>
                        </VStack>
                      )}
                    </>
                  )}
                </VStack>
              </Box>
            )}

            {/* System Info Cards */}
            <VStack w="full" gap={3} align="stretch">
              <Box p={4} bg="rgba(0,0,0,0.3)" borderRadius="16px" border="1px solid rgba(255,255,255,0.05)">
                <HStack justify="space-between">
                  <HStack gap={2}>
                    <FiCheckCircle color="#34d399" />
                    <Text fontSize="sm" color="whiteAlpha.800">RBAC Erişim Kontrolü:</Text>
                  </HStack>
                  <Text fontSize="sm" fontWeight="700" color="green.400">Aktif & Doğrulandı</Text>
                </HStack>
              </Box>
            </VStack>

            {/* Action Buttons */}
            <VStack w="full" gap={3} mt={2}>
              {user.role === 'admin' && (
                <Button
                  w="full"
                  size="lg"
                  colorPalette="pink"
                  variant="solid"
                  borderRadius="xl"
                  onClick={() => router.push('/admin')}
                >
                  <FiShield size={16} /> Admin Paneline Git
                </Button>
              )}

              {(user.role === 'warehouse_manager' || user.role === 'seller') && (
                <Button
                  w="full"
                  size="lg"
                  colorPalette="cyan"
                  variant="solid"
                  borderRadius="xl"
                  onClick={() => router.push('/seller')}
                >
                  <FiBriefcase size={16} /> Depo Stok Paneline Git
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
                <HStack gap={2}>
                  <FiShoppingBag size={16} />
                  <Text>Siparişlerimi Görüntüle</Text>
                </HStack>
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
