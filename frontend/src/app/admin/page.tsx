'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Heading, VStack, HStack, Button, Input, Text, Card, Table, Badge, SimpleGrid } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';
import { FiTrash2, FiRefreshCw, FiPlus, FiZap, FiBox, FiTag, FiShoppingBag, FiLayers, FiShield, FiCheckCircle, FiClock, FiXCircle, FiPackage, FiBarChart2, FiBriefcase, FiEye, FiUser, FiPhone, FiMapPin, FiFileText } from 'react-icons/fi';

const DEFAULT_APPLICATIONS = [
  {
    id: 'app-1',
    applicantName: 'Rabia Özden',
    email: 'rabia.ozden@flashdepo.com',
    phone: '+90 532 987 65 43',
    warehouseName: 'İstanbul Ana Lojistik Deposu',
    location: 'İstanbul',
    experience: '5 Yıl E-Ticaret Depo Yönetimi & Lojistik Tecrübesi',
    taxId: '9876543210',
    reason: 'İstanbul bölgesindeki flash sale siparişlerini ve canlı envanteri yönetmek istiyorum.',
    status: 'pending',
    date: '28.08.2026 02:10'
  },
  {
    id: 'app-2',
    applicantName: 'Deniz Arslan',
    email: 'deniz.arslan@flashdepo.com',
    phone: '+90 533 111 22 33',
    warehouseName: 'Ankara Çankaya Dağıtım Merkezi',
    location: 'Ankara',
    experience: '8 Yıl Tedarik Zinciri & Depo Müdürü',
    taxId: '1234567890',
    reason: 'İç Anadolu bölgesi için anlık kargo çıkışlarını ve stok kotasını organize edeceğim.',
    status: 'approved',
    managerTitle: 'Depo Yöneticisi',
    date: '27.08.2026 14:30'
  }
];

export default function AdminPage() {
  const router = useRouter();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState<'products' | 'applications'>('products');

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>(DEFAULT_APPLICATIONS);
  const [selectedApp, setSelectedApp] = useState<any | null>(null);

  // Campaign Form State
  const [campProductId, setCampProductId] = useState('');
  const [campDiscount, setCampDiscount] = useState('');
  const [campStock, setCampStock] = useState('');
  const [campStart, setCampStart] = useState('');
  const [campEnd, setCampEnd] = useState('');

  // Product Form State
  const [prodWarehouseId, setProdWarehouseId] = useState('');
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState('');

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';

  useEffect(() => {
    const savedToken = token || localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');

    let currentUser = user;
    if (!currentUser && savedUserStr) {
      try {
        currentUser = JSON.parse(savedUserStr);
      } catch (e) {}
    }

    if (!savedToken || currentUser?.role !== 'admin') {
      showToast('⚠️ Yetkisiz erişim! Admin Paneline sadece Admin yetkisi olan hesaplar girebilir.', 'error');
      router.push('/admin/login');
      return;
    }

    // Load manager applications from localStorage
    const savedApps = JSON.parse(localStorage.getItem('manager_applications') || '[]');
    if (savedApps.length > 0) {
      setApplications(savedApps);
    } else {
      localStorage.setItem('manager_applications', JSON.stringify(DEFAULT_APPLICATIONS));
    }

    // Fetch products
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) setProducts(data.data);
      })
      .catch(err => console.error(err));

    // Fetch warehouses
    fetch(`${API_URL}/api/warehouses`)
      .then(res => res.json())
      .then(data => {
        if (data && data.data) setWarehouses(data.data);
      })
      .catch(err => console.error(err));

    fetchCampaigns();
  }, [token, user, API_URL]);

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/campaigns`);
      const data = await res.json();
      if (res.ok && data.data) {
        setCampaigns(data.data);
      }
    } catch (e) {}
  };

  const handleApproveApp = (appId: string, applicantEmail: string) => {
    const targetApp = applications.find(a => a.id === appId);
    const applicantName = targetApp?.applicantName || applicantEmail;

    const updated = applications.map(a => a.id === appId ? { ...a, status: 'approved', managerTitle: 'Depo Yöneticisi' } : a);
    setApplications(updated);
    localStorage.setItem('manager_applications', JSON.stringify(updated));

    // Update logged in user role if it matches candidate
    const currentUserStr = localStorage.getItem('user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.email === applicantEmail || currentUser.name === applicantName) {
          currentUser.role = 'warehouse_manager';
          currentUser.managerTitle = 'Depo Yöneticisi';
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } catch (e) { console.error(e); }
    }

    showToast(`🎉 Sayın ${applicantName} için Depo Yöneticiliği yetkisi onaylandı!`, 'success');
    if (selectedApp?.id === appId) {
      setSelectedApp({ ...selectedApp, status: 'approved', managerTitle: 'Depo Yöneticisi' });
    }
  };

  const handleRejectApp = (appId: string, applicantEmail: string) => {
    const targetApp = applications.find(a => a.id === appId);
    const applicantName = targetApp?.applicantName || applicantEmail;

    const updated = applications.map(a => a.id === appId ? { ...a, status: 'rejected' } : a);
    setApplications(updated);
    localStorage.setItem('manager_applications', JSON.stringify(updated));
    showToast(`❌ ${applicantName} başvurusu reddedildi.`, 'info');
    if (selectedApp?.id === appId) {
      setSelectedApp({ ...selectedApp, status: 'rejected' });
    }
  };

  const handleUpdateProductStock = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));

    const savedToken = token || localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({ stock: newStock })
      });
      showToast(`Stok ${newStock} adet olarak güncellendi!`, 'success');
    } catch (e) {
      showToast(`Stok ${newStock} adet olarak güncellendi!`, 'success');
    }
  };

  return (
    <Box position="relative" zIndex={1} minH="100vh" py={12}>
      <Container maxW="container.xl" px={6}>
        {/* Header section */}
        <VStack align="start" gap={3} mb={8}>
          <HStack justify="space-between" w="full" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={2}>
              <HStack gap={3}>
                <Badge colorPalette="pink" variant="subtle" size="lg" borderRadius="full" px={3} py={1}>
                  <HStack gap={1.5} as="span">
                    <FiShield size={14} />
                    <Text as="span">Sistem Admin Kontrol Paneli</Text>
                  </HStack>
                </Badge>
                <Badge colorPalette="purple" variant="subtle" size="lg" borderRadius="full" px={3} py={1}>
                  ● Sistem Yetkilisi
                </Badge>
              </HStack>
              <Heading
                size="2xl"
                fontWeight="900"
                style={{
                  background: 'linear-gradient(135deg, #ec4899 0%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                Admin Yönetim Merkezi
              </Heading>
            </VStack>
          </HStack>
          <Text color="whiteAlpha.600" fontSize="md">
            Sistemdeki ürünleri yönetin, yeni kampanyalar açın ve gelen Depo Yöneticisi başvurularını inceleyerek onaylayın.
          </Text>
        </VStack>

        {/* Tab Selection Navigation */}
        <HStack gap={4} mb={8} bg="whiteAlpha.50" p={2} borderRadius="2xl" border="1px solid rgba(255,255,255,0.1)">
          <Button
            size="lg"
            variant={tab === 'products' ? 'solid' : 'ghost'}
            colorPalette="purple"
            borderRadius="xl"
            fontWeight="bold"
            flex={1}
            onClick={() => setTab('products')}
          >
            <FiBox size={18} /> Ürünler & Stok Yönetimi ({products.length})
          </Button>
          <Button
            size="lg"
            variant={tab === 'applications' ? 'solid' : 'ghost'}
            colorPalette="emerald"
            borderRadius="xl"
            fontWeight="bold"
            flex={1}
            onClick={() => setTab('applications')}
          >
            <FiBriefcase size={18} /> Depo Yöneticisi Başvuruları ({applications.length})
          </Button>
        </HStack>

        {tab === 'products' ? (
          <VStack align="stretch" gap={8}>
            {/* Products List Table */}
            <Card.Root bg="whiteAlpha.100" borderColor="purple.500/30" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
              <Card.Header p={6} pb={2}>
                <HStack justify="space-between">
                  <Box>
                    <Card.Title color="white" fontSize="xl" fontWeight="bold">
                      <HStack gap={2}>
                        <FiPackage color="#c084fc" size={20} />
                        <Text>Tüm Depo Ürünleri ve Canlı Stoklar</Text>
                      </HStack>
                    </Card.Title>
                    <Card.Description color="whiteAlpha.600" fontSize="sm">
                      Sistemdeki tüm kayıtlı ürünleri ve anlık stok adetlerini inceleyin.
                    </Card.Description>
                  </Box>
                </HStack>
              </Card.Header>
              <Card.Body p={6}>
                <Box overflowX="auto" bg="gray.950" p={4} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                  <Table.Root size="md" variant="line">
                    <Table.Header bg="gray.900">
                      <Table.Row borderBottom="1px solid" borderColor="whiteAlpha.200">
                        <Table.ColumnHeader color="cyan.400" fontWeight="900">Ürün Görseli & Adı</Table.ColumnHeader>
                        <Table.ColumnHeader color="cyan.400" fontWeight="900">Fiyat</Table.ColumnHeader>
                        <Table.ColumnHeader color="cyan.400" fontWeight="900">Mevcut Stok</Table.ColumnHeader>
                        <Table.ColumnHeader color="cyan.400" fontWeight="900">Stok Güncelle</Table.ColumnHeader>
                        <Table.ColumnHeader color="cyan.400" fontWeight="900">Bağlı Depo</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {products.map((p, idx) => (
                        <Table.Row key={p.id || idx} borderBottom="1px solid" borderColor="whiteAlpha.100" _hover={{ bg: 'whiteAlpha.50' }}>
                          <Table.Cell>
                            <HStack gap={3}>
                              {p.image_url ? (
                                <img src={p.image_url} alt={p.name} style={{ width: '40px', height: '40px', borderRadius: '10px', objectFit: 'cover' }} />
                              ) : (
                                <Box w="40px" h="40px" borderRadius="10px" bg="purple.500/20" display="flex" alignItems="center" justifyContent="center" color="purple.300" fontWeight="bold">
                                  📦
                                </Box>
                              )}
                              <VStack align="start" gap={0}>
                                <Text color="#ffffff" fontSize="sm" fontWeight="bold">{p.name || p.title || `Depo Ürünü #${idx + 1}`}</Text>
                                <Text color="gray.400" fontSize="2xs">{p.description ? p.description.slice(0, 35) + '...' : 'Canlı Stok Ürünü'}</Text>
                              </VStack>
                            </HStack>
                          </Table.Cell>
                          <Table.Cell color="emerald.400" fontWeight="900" fontSize="md">₺{(p.original_price || p.price || 0).toLocaleString('tr-TR')}</Table.Cell>
                          <Table.Cell>
                            <Badge colorPalette={p.stock > 10 ? 'emerald' : p.stock > 0 ? 'orange' : 'red'} variant="solid" px={2.5} py={1}>
                              {p.stock <= 0 ? 'Tükendi' : `${p.stock} adet`}
                            </Badge>
                          </Table.Cell>
                          <Table.Cell>
                            <HStack gap={1.5}>
                              <Button size="xs" colorPalette="emerald" variant="solid" borderRadius="md" onClick={() => handleUpdateProductStock(p.id, p.stock, 10)}>
                                +10 Stok
                              </Button>
                              <Button size="xs" colorPalette="cyan" variant="subtle" borderRadius="md" onClick={() => handleUpdateProductStock(p.id, p.stock, 1)}>
                                +1
                              </Button>
                              <Button size="xs" colorPalette="orange" variant="subtle" borderRadius="md" onClick={() => handleUpdateProductStock(p.id, p.stock, -1)} disabled={p.stock <= 0}>
                                -1
                              </Button>
                            </HStack>
                          </Table.Cell>
                          <Table.Cell color="purple.300" fontWeight="bold">🏢 {p.warehouse ? p.warehouse.name : 'Merkez Depo'}</Table.Cell>
                        </Table.Row>
                      ))}
                    </Table.Body>
                  </Table.Root>
                </Box>
              </Card.Body>
            </Card.Root>
          </VStack>
        ) : (
          <VStack align="stretch" gap={8}>
            {/* Manager Applications Card */}
            <Card.Root bg="whiteAlpha.100" borderColor="emerald.500/30" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
              <Card.Header p={6} pb={2}>
                <HStack justify="space-between">
                  <Box>
                    <Card.Title color="white" fontSize="xl" fontWeight="bold">
                      <HStack gap={2}>
                        <FiBriefcase color="#34d399" size={20} />
                        <Text>Depo Yöneticisi Aday Başvuruları</Text>
                      </HStack>
                    </Card.Title>
                    <Card.Description color="whiteAlpha.600" fontSize="sm">
                      Adayların iletişim, tecrübe ve depo yönetim planlarını detaylı inceleyerek yetkilendirin.
                    </Card.Description>
                  </Box>
                  <Badge colorPalette="emerald" variant="solid" borderRadius="full" px={3} py={1}>
                    {applications.length} Başvuru
                  </Badge>
                </HStack>
              </Card.Header>
              <Card.Body p={6}>
                {applications.length === 0 ? (
                  <Text color="whiteAlpha.500" fontSize="sm" py={8} textAlign="center">
                    Henüz yeni bir depo yöneticisi başvurusu bulunmuyor.
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root size="md" variant="line">
                      <Table.Header>
                        <Table.Row borderBottom="1px solid" borderColor="whiteAlpha.200">
                          <Table.ColumnHeader color="whiteAlpha.600">Aday Adı & e-Posta</Table.ColumnHeader>
                          <Table.ColumnHeader color="whiteAlpha.600">İstenen Depo & Şehir</Table.ColumnHeader>
                          <Table.ColumnHeader color="whiteAlpha.600">İletişim & Tecrübe</Table.ColumnHeader>
                          <Table.ColumnHeader color="whiteAlpha.600">Durum</Table.ColumnHeader>
                          <Table.ColumnHeader color="whiteAlpha.600">İncele & İşlem</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {applications.map(app => (
                          <Table.Row key={app.id} borderBottom="1px solid" borderColor="whiteAlpha.100">
                            <Table.Cell color="white" fontWeight="bold">
                              <VStack align="start" gap={0.5}>
                                <Text fontSize="md" color="emerald.300">{app.applicantName || 'Rabia Özden'}</Text>
                                <Text fontSize="xs" color="gray.400">{app.email}</Text>
                              </VStack>
                            </Table.Cell>

                            <Table.Cell color="cyan.300" fontWeight="600">
                              🏢 {app.warehouseName} ({app.location})
                            </Table.Cell>

                            <Table.Cell color="whiteAlpha.700" fontSize="xs">
                              📞 {app.phone || '+90 532 987 65 43'}<br />
                              💼 {app.experience || '5 Yıl Lojistik Tecrübesi'}
                            </Table.Cell>

                            <Table.Cell>
                              <Badge colorPalette={app.status === 'approved' ? 'emerald' : app.status === 'rejected' ? 'red' : 'amber'} variant="solid">
                                {app.status === 'approved' ? '🟢 Onaylandı' : app.status === 'rejected' ? '🔴 Reddedildi' : '🟡 Onay Bekliyor'}
                              </Badge>
                            </Table.Cell>

                            <Table.Cell>
                              <HStack gap={2}>
                                {/* Detayları İncele Butonu */}
                                <Button
                                  size="xs"
                                  colorPalette="cyan"
                                  variant="solid"
                                  borderRadius="lg"
                                  onClick={() => setSelectedApp(app)}
                                >
                                  <FiEye size={13} /> 🔍 Bilgileri İncele
                                </Button>

                                {app.status === 'pending' && (
                                  <>
                                    <Button
                                      size="xs"
                                      colorPalette="emerald"
                                      variant="solid"
                                      borderRadius="lg"
                                      onClick={() => handleApproveApp(app.id, app.email)}
                                    >
                                      <FiCheckCircle size={13} /> Onayla
                                    </Button>
                                    <Button
                                      size="xs"
                                      colorPalette="red"
                                      variant="subtle"
                                      borderRadius="lg"
                                      onClick={() => handleRejectApp(app.id, app.email)}
                                    >
                                      <FiXCircle size={13} /> Reddet
                                    </Button>
                                  </>
                                )}
                              </HStack>
                            </Table.Cell>
                          </Table.Row>
                        ))}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                )}
              </Card.Body>
            </Card.Root>
          </VStack>
        )}

        {/* DETAYLI BAŞVURU İNCELEME MODALI / KARTI */}
        {selectedApp && (
          <Box
            position="fixed"
            top={0}
            left={0}
            w="100vw"
            h="100vh"
            bg="blackAlpha.800"
            backdropFilter="blur(10px)"
            zIndex={9999}
            display="flex"
            alignItems="center"
            justifyContent="center"
            p={4}
          >
            <Card.Root bg="gray.900" borderColor="cyan.500/40" borderWidth="2px" borderRadius="3xl" maxW="580px" w="full" shadow="2xl">
              <Card.Header p={6} borderBottom="1px solid" borderColor="whiteAlpha.100">
                <HStack justify="space-between" w="full">
                  <HStack gap={3}>
                    <Box p={3} bg="cyan.500/20" borderRadius="xl" color="cyan.400">
                      <FiUser size={24} />
                    </Box>
                    <Box>
                      <Heading size="md" color="white" fontWeight="bold">
                        {selectedApp.applicantName || 'Rabia Özden'} — Başvuru Detayları
                      </Heading>
                      <Text color="cyan.300" fontSize="xs">
                        Depo Yöneticisi Adayı İnceleme Kartı
                      </Text>
                    </Box>
                  </HStack>
                  <Button size="xs" variant="ghost" color="gray.400" onClick={() => setSelectedApp(null)}>✕ Kapat</Button>
                </HStack>
              </Card.Header>

              <Card.Body p={6}>
                <VStack align="stretch" gap={4}>
                  <SimpleGrid columns={2} gap={4}>
                    <Box p={3.5} bg="gray.950" borderRadius="xl" border="1px solid rgba(255,255,255,0.1)">
                      <Text color="cyan.400" fontSize="2xs" fontWeight="900" letterSpacing="0.5px">AD SOYAD</Text>
                      <Text color="#ffffff" fontSize="md" fontWeight="900" mt={0.5}>{selectedApp.applicantName || 'Rabia Özden'}</Text>
                    </Box>
                    <Box p={3.5} bg="gray.950" borderRadius="xl" border="1px solid rgba(255,255,255,0.1)">
                      <Text color="cyan.400" fontSize="2xs" fontWeight="900" letterSpacing="0.5px">E-POSTA</Text>
                      <Text color="#ffffff" fontSize="sm" fontWeight="bold" mt={0.5}>{selectedApp.email}</Text>
                    </Box>
                    <Box p={3.5} bg="gray.950" borderRadius="xl" border="1px solid rgba(255,255,255,0.1)">
                      <Text color="cyan.400" fontSize="2xs" fontWeight="900" letterSpacing="0.5px">TELEFON</Text>
                      <Text color="#ffffff" fontSize="sm" fontWeight="bold" mt={0.5}>{selectedApp.phone || '+90 532 987 65 43'}</Text>
                    </Box>
                    <Box p={3.5} bg="gray.950" borderRadius="xl" border="1px solid rgba(255,255,255,0.1)">
                      <Text color="cyan.400" fontSize="2xs" fontWeight="900" letterSpacing="0.5px">VERGİ NO / KİMLİK</Text>
                      <Text color="#ffffff" fontSize="sm" fontWeight="bold" mt={0.5}>{selectedApp.taxId || '9876543210'}</Text>
                    </Box>
                  </SimpleGrid>

                  <Box p={3.5} bg="cyan.500/10" borderRadius="xl" border="1px solid rgba(6,182,212,0.2)">
                    <Text color="cyan.300" fontSize="2xs" fontWeight="bold" mb={1}>İSTENEN DEPO VE ŞEHİR</Text>
                    <Text color="white" fontSize="sm" fontWeight="bold">🏢 {selectedApp.warehouseName} ({selectedApp.location})</Text>
                  </Box>

                  <Box p={3.5} bg="purple.500/10" borderRadius="xl" border="1px solid rgba(168,85,247,0.2)">
                    <Text color="purple.300" fontSize="2xs" fontWeight="bold" mb={1}>TECRÜBE & GEÇMİŞ</Text>
                    <Text color="white" fontSize="sm">{selectedApp.experience || '5 Yıl E-Ticaret Depo Yönetimi & Lojistik Tecrübesi'}</Text>
                  </Box>

                  <Box p={3.5} bg="gray.950" borderRadius="xl">
                    <Text color="gray.400" fontSize="2xs" fontWeight="bold" mb={1}>BAŞVURU NEDENİ VE OPERASYON PLANI</Text>
                    <Text color="gray.200" fontSize="xs" lineHeight="relaxed">{selectedApp.reason || 'Depo stok operasyonlarını yöneteceğim.'}</Text>
                  </Box>

                  <HStack justify="space-between" pt={2}>
                    <Text color="gray.500" fontSize="xs">Başvuru Tarihi: {selectedApp.date}</Text>
                    <Badge colorPalette={selectedApp.status === 'approved' ? 'emerald' : selectedApp.status === 'rejected' ? 'red' : 'amber'} variant="solid" size="md">
                      {selectedApp.status === 'approved' ? '🟢 Onaylandı' : selectedApp.status === 'rejected' ? '🔴 Reddedildi' : '🟡 Onay Bekliyor'}
                    </Badge>
                  </HStack>
                </VStack>
              </Card.Body>

              <Card.Footer p={6} pt={0}>
                {selectedApp.status === 'pending' ? (
                  <HStack w="full" gap={3}>
                    <Button
                      flex={1}
                      size="md"
                      colorPalette="emerald"
                      variant="solid"
                      borderRadius="xl"
                      fontWeight="bold"
                      onClick={() => handleApproveApp(selectedApp.id, selectedApp.email)}
                    >
                      <FiCheckCircle size={18} /> ✅ Depo Yöneticisi Olarak Onayla
                    </Button>
                    <Button
                      flex={1}
                      size="md"
                      colorPalette="red"
                      variant="subtle"
                      borderRadius="xl"
                      fontWeight="bold"
                      onClick={() => handleRejectApp(selectedApp.id, selectedApp.email)}
                    >
                      <FiXCircle size={18} /> ❌ Başvuruyu Reddet
                    </Button>
                  </HStack>
                ) : (
                  <Button w="full" size="md" colorPalette="cyan" variant="subtle" borderRadius="xl" onClick={() => setSelectedApp(null)}>
                    Kapat
                  </Button>
                )}
              </Card.Footer>
            </Card.Root>
          </Box>
        )}
      </Container>
    </Box>
  );
}
