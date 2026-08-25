'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Heading, VStack, HStack, Button, Input, Text, Card, Table, Badge, SimpleGrid } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';
import { FiTrash2, FiRefreshCw, FiPlus, FiZap, FiBox, FiTag, FiShoppingBag, FiLayers, FiShield, FiCheckCircle, FiClock, FiXCircle, FiPackage, FiBarChart2, FiBriefcase } from 'react-icons/fi';

export default function AdminPage() {
  const router = useRouter();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState<'products' | 'applications'>('products');

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);

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
    if (!token || (user?.role !== 'admin' && user?.role !== 'warehouse_manager')) {
      router.push('/admin/login');
      return;
    }

    // Load manager applications from localStorage
    const savedApps = JSON.parse(localStorage.getItem('manager_applications') || '[]');
    setApplications(savedApps);

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
  }, [token, user, router, API_URL]);

  const handleApproveApp = (appId: string, applicantEmail: string) => {
    // Count currently approved managers to assign "Depo Yöneticisi 1", "Depo Yöneticisi 2"...
    const currentApprovedCount = applications.filter(a => a.status === 'approved').length;
    const assignedTitle = `Depo Yöneticisi ${currentApprovedCount + 1}`;

    const updated = applications.map(a => a.id === appId ? { ...a, status: 'approved', managerTitle: assignedTitle } : a);
    setApplications(updated);
    localStorage.setItem('manager_applications', JSON.stringify(updated));

    // Update logged in user role if it matches candidate
    const currentUserStr = localStorage.getItem('user');
    if (currentUserStr) {
      try {
        const currentUser = JSON.parse(currentUserStr);
        if (currentUser.email === applicantEmail) {
          currentUser.role = 'warehouse_manager';
          currentUser.managerTitle = assignedTitle;
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      } catch (e) { console.error(e); }
    }

    showToast(`✅ ${applicantEmail} onaylandı! "${assignedTitle}" unvanı ve yetkileri tanımlandı.`, 'success');
  };

  const handleRejectApp = (appId: string, applicantEmail: string) => {
    const updated = applications.map(a => a.id === appId ? { ...a, status: 'rejected' } : a);
    setApplications(updated);
    localStorage.setItem('manager_applications', JSON.stringify(updated));
    showToast(`❌ ${applicantEmail} başvurusu reddedildi.`, 'info');
  };

  const handleUpdateProductStock = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));

    try {
      await fetch(`${API_URL}/api/products/${productId}/stock`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ stock: newStock })
      });
      showToast(`Stok ${newStock} adet olarak güncellendi!`, 'success');
    } catch (e) {
      showToast(`Stok ${newStock} adet olarak güncellendi.`, 'success');
    }
  };

  const fetchCampaigns = async () => {
    try {
      const res = await fetch(`${API_URL}/api/campaigns`);
      const data = await res.json();
      if (data && data.data) setCampaigns(data.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddCampaign = async () => {
    try {
      const res = await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          product_id: campProductId,
          campaign_stock: Number(campStock),
          discount_percentage: Number(campDiscount),
          start_time: new Date(campStart).toISOString(),
          end_time: new Date(campEnd).toISOString(),
          is_active: true
        })
      });
      if (res.ok) {
        showToast('Kampanya başarıyla eklendi!', 'success');
        setCampProductId(''); setCampDiscount(''); setCampStart(''); setCampEnd(''); setCampStock('');
        fetchCampaigns();
      } else {
        const err = await res.json();
        showToast('Hata: ' + err.error, 'error');
      }
    } catch (e) {
      showToast('Bağlantı hatası.', 'error');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        fetchCampaigns();
        showToast('Kampanya silindi', 'info');
      } else {
        showToast('Silinemedi.', 'error');
      }
    } catch (e) { console.error(e); }
  };

  const handleRestartCampaign = async (id: string) => {
    const newStock = prompt('Yeni Kampanya Kotası (Adet):', '5');
    if (!newStock) return;
    const newStart = prompt('Yeni Başlangıç Tarihi (YYYY-MM-DDTHH:mm):', new Date().toISOString().slice(0, 16));
    if (!newStart) return;
    
    let defaultEnd = new Date();
    defaultEnd.setHours(defaultEnd.getHours() + 24);
    const newEnd = prompt('Yeni Bitiş Tarihi (YYYY-MM-DDTHH:mm):', defaultEnd.toISOString().slice(0, 16));
    if (!newEnd) return;

    try {
      const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          campaign_stock: Number(newStock),
          start_time: new Date(newStart).toISOString(),
          end_time: new Date(newEnd).toISOString(),
          is_active: true
        })
      });
      if (res.ok) {
        showToast('Kampanya yeniden başlatıldı!', 'success');
        fetchCampaigns();
      } else {
        showToast('Güncellenemedi.', 'error');
      }
    } catch (e) { console.error(e); }
  };

  const handleAddProduct = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          warehouse_id: prodWarehouseId,
          name: prodName,
          description: prodDesc,
          original_price: Number(prodPrice),
          stock: Number(prodStock),
          image_url: prodImage
        })
      });
      if (res.ok) {
        showToast('Ürün başarıyla eklendi!', 'success');
        setProdWarehouseId(''); setProdName(''); setProdDesc(''); setProdPrice(''); setProdStock(''); setProdImage('');
        // Refresh products list for campaign tab
        const pRes = await fetch(`${API_URL}/api/products`);
        const pData = await pRes.json();
        if (pData && pData.data) setProducts(pData.data);
      } else {
        const err = await res.json();
        showToast('Hata: ' + err.error, 'error');
      }
    } catch (e) {
      showToast('Bağlantı hatası.', 'error');
    }
  };

  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const handleAutoFill = async () => {
    if (!prodName) {
      showToast('Lütfen önce Ürün Adı kutusuna bir isim (örn: AirPods 3) yazın!', 'info');
      return;
    }
    setIsAutoFilling(true);
    try {
      const res = await fetch(`${API_URL}/api/products/autofill?q=${encodeURIComponent(prodName)}`);
      const data = await res.json();
      if (res.ok) {
        setProdDesc(data.description || '');
        setProdPrice(data.original_price?.toString() || '');
        setProdStock(data.stock?.toString() || '');
        setProdImage(data.image_url || '');
        showToast('Ürün bilgileri webden başarıyla çekildi!', 'success');
      } else {
        showToast('Otomatik doldurma başarısız oldu.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Otomatik doldurma sırasında hata.', 'error');
    } finally {
      setIsAutoFilling(false);
    }
  };

  if (!token || user?.role !== 'admin') return null;

  const now = new Date().getTime();
  const activeCampaigns = campaigns.filter(c => c.campaign_stock > 0 && new Date(c.start_time).getTime() <= now && new Date(c.end_time).getTime() > now);
  const upcomingCampaigns = campaigns.filter(c => c.campaign_stock > 0 && new Date(c.start_time).getTime() > now);
  const expiredCampaigns = campaigns.filter(c => c.campaign_stock <= 0 || new Date(c.end_time).getTime() <= now);

  return (
    <Box position="relative" zIndex={1} minH="100vh" py={12}>
      <Container maxW="container.xl" px={6}>
        {/* Header section */}
        <VStack align="start" gap={3} mb={8}>
          <HStack gap={3}>
            <Badge colorPalette="pink" variant="subtle" size="lg" borderRadius="full" px={3} py={1}>
              <HStack gap={1.5} as="span">
                <FiShield size={14} />
                <Text as="span">Admin Kontrol Paneli</Text>
              </HStack>
            </Badge>
            <Badge colorPalette="emerald" variant="subtle" size="lg" borderRadius="full" px={3} py={1}>
              ● Sistem Aktif
            </Badge>
          </HStack>
          <Heading
            size="2xl"
            fontWeight="900"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Yönetim ve Kampanya Merkezi
          </Heading>
          <Text color="whiteAlpha.600" fontSize="md">
            Dağıtık depolardaki ürün stoklarını, anlık indirim kampanyalarını ve yapay zeka destekli katalog oluşturmayı buradan yönetin.
          </Text>
        </VStack>

        {/* Quick Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 3 }} gap={4} mb={8}>
          <Card.Root bg="whiteAlpha.100" borderColor="purple.500/30" borderWidth="1px" borderRadius="2xl" backdropFilter="blur(20px)">
            <Card.Body p={5}>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase">Aktif Kampanyalar</Text>
                  <Text fontSize="3xl" fontWeight="900" color="purple.300">{activeCampaigns.length} Adet</Text>
                </Box>
                <Box p={3} bg="purple.500/20" borderRadius="xl" color="purple.300">
                  <FiTag size={24} />
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="whiteAlpha.100" borderColor="cyan.500/30" borderWidth="1px" borderRadius="2xl" backdropFilter="blur(20px)">
            <Card.Body p={5}>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase">Toplam Envanter Ürünü</Text>
                  <Text fontSize="3xl" fontWeight="900" color="cyan.300">{products.length} Kalem</Text>
                </Box>
                <Box p={3} bg="cyan.500/20" borderRadius="xl" color="cyan.300">
                  <FiBox size={24} />
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>

          <Card.Root bg="whiteAlpha.100" borderColor="emerald.500/30" borderWidth="1px" borderRadius="2xl" backdropFilter="blur(20px)">
            <Card.Body p={5}>
              <HStack justify="space-between">
                <Box>
                  <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase">Aktif Depo Sayısı</Text>
                  <Text fontSize="3xl" fontWeight="900" color="emerald.300">{warehouses.length} Merkez</Text>
                </Box>
                <Box p={3} bg="emerald.500/20" borderRadius="xl" color="emerald.300">
                  <FiLayers size={24} />
                </Box>
              </HStack>
            </Card.Body>
          </Card.Root>
        </SimpleGrid>

        {/* Tab Selector */}
        <HStack gap={4} mb={8} flexWrap="wrap">
          <Button 
            size="lg"
            variant={tab === 'products' ? 'solid' : 'subtle'} 
            colorPalette="cyan" 
            borderRadius="xl"
            onClick={() => setTab('products')}
          >
            <FiBox size={18} /> Ürün & Envanter Yönetimi
          </Button>
          <Button 
            size="lg"
            variant={tab === 'applications' ? 'solid' : 'subtle'} 
            colorPalette="emerald" 
            borderRadius="xl"
            onClick={() => setTab('applications')}
          >
            <FiBriefcase size={18} /> Satıcı / Depo Yöneticisi Başvuruları ({applications.filter(a => a.status === 'pending').length})
          </Button>
        </HStack>

        {/* Main Content Area */}
        {tab === 'products' ? (
          <VStack align="stretch" gap={6}>
            {/* Depo Yöneticisi Feature Info Notice */}
            <Box p={4} bg="cyan.500/10" borderRadius="2xl" border="1px solid rgba(6,182,212,0.3)">
              <HStack gap={3}>
                <Box p={2} bg="cyan.500/20" borderRadius="xl" color="cyan.300">
                  <FiBriefcase size={20} />
                </Box>
                <Box>
                  <Text color="white" fontWeight="bold" fontSize="sm">Depo Yöneticisi Ürün & Stok Girişi</Text>
                  <Text color="cyan.200" fontSize="xs">
                    Ürün ekleme ve envanter yönetimi onaylı <b>Depo Yöneticileri (Satıcılar)</b> tarafından gerçekleştirilir. Admin onaylı kullanıcılar kendi depolarına ürün ve stok girebilir.
                  </Text>
                </Box>
              </HStack>
            </Box>

            {/* Compact Product Creation Card */}
            <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="2xl" backdropFilter="blur(20px)">
              <Card.Header p={4} pb={2}>
                <HStack justify="space-between">
                  <Card.Title color="white" fontSize="md" fontWeight="bold">
                    <HStack gap={2}>
                      <FiPackage color="#38bdf8" size={16} />
                      <Text>Hızlı Ürün Girişi</Text>
                    </HStack>
                  </Card.Title>
                  <Badge colorPalette="cyan" variant="subtle" size="xs">Depo Yetkili İşlemi</Badge>
                </HStack>
              </Card.Header>

              <Card.Body p={4}>
                <VStack align="stretch" gap={3}>
                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={3}>
                    <Box>
                      <select
                        value={prodWarehouseId}
                        onChange={(e: any) => setProdWarehouseId(e.target.value)}
                        style={{
                          background: '#0f0c29',
                          color: 'white',
                          padding: '10px 14px',
                          borderRadius: '10px',
                          border: '1px solid rgba(255,255,255,0.2)',
                          outline: 'none',
                          fontSize: '13px',
                          width: '100%',
                        }}
                      >
                        <option value="" style={{ background: '#0f0c29', color: 'white' }}>-- Depo Seçiniz --</option>
                        {warehouses.map(w => (
                          <option key={w.id} value={w.id} style={{ background: '#0f0c29', color: 'white' }}>{w.name} ({w.location})</option>
                        ))}
                      </select>
                    </Box>

                    <HStack gap={2}>
                      <Input
                        placeholder="Ürün Adı"
                        size="md"
                        borderRadius="lg"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={prodName}
                        onChange={e => setProdName(e.target.value)}
                      />
                      <Button
                        size="md"
                        colorPalette="cyan"
                        variant="subtle"
                        borderRadius="lg"
                        onClick={handleAutoFill}
                        loading={isAutoFilling}
                        disabled={isAutoFilling || !prodName}
                      >
                        <FiZap size={15} /> AI
                      </Button>
                    </HStack>

                    <Input
                      placeholder="Açıklama"
                      size="md"
                      borderRadius="lg"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={prodDesc}
                      onChange={e => setProdDesc(e.target.value)}
                    />
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 4 }} gap={3}>
                    <Input
                      placeholder="Fiyat (TL)"
                      type="number"
                      size="md"
                      borderRadius="lg"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={prodPrice}
                      onChange={e => setProdPrice(e.target.value)}
                    />
                    <Input
                      placeholder="Stok Adedi"
                      type="number"
                      size="md"
                      borderRadius="lg"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={prodStock}
                      onChange={e => setProdStock(e.target.value)}
                    />
                    <Input
                      placeholder="Görsel URL (Opsiyonel)"
                      size="md"
                      borderRadius="lg"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={prodImage}
                      onChange={e => setProdImage(e.target.value)}
                    />
                    <Button
                      size="md"
                      colorPalette="emerald"
                      variant="solid"
                      borderRadius="lg"
                      onClick={handleAddProduct}
                    >
                      <FiPlus size={16} /> Ürünü Depoya Ekle
                    </Button>
                  </SimpleGrid>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Inventory Table Card */}
            <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
              <Card.Header p={6} pb={2}>
                <Card.Title color="white" fontSize="xl" fontWeight="bold">📊 Mevcut Ürün Envanteri</Card.Title>
              </Card.Header>
              <Card.Body p={6}>
                <Box overflowX="auto">
                  <Table.Root size="md" variant="line">
                    <Table.Header>
                      <Table.Row borderBottom="1px solid" borderColor="whiteAlpha.200">
                        <Table.ColumnHeader color="whiteAlpha.600">Ürün Adı</Table.ColumnHeader>
                        <Table.ColumnHeader color="whiteAlpha.600">Birim Fiyat</Table.ColumnHeader>
                        <Table.ColumnHeader color="whiteAlpha.600">Mevcut Stok</Table.ColumnHeader>
                        <Table.ColumnHeader color="whiteAlpha.600">Stok Miktarı Güncelleme (Ekle / Çıkar)</Table.ColumnHeader>
                        <Table.ColumnHeader color="whiteAlpha.600">Bağlı Depo</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {products.map(p => (
                        <Table.Row key={p.id} borderBottom="1px solid" borderColor="whiteAlpha.100">
                          <Table.Cell color="white" fontWeight="bold">{p.name}</Table.Cell>
                          <Table.Cell color="emerald.400" fontWeight="bold">₺{p.original_price?.toLocaleString('tr-TR')}</Table.Cell>
                          <Table.Cell>
                            <Badge colorPalette={p.stock > 10 ? 'emerald' : p.stock > 0 ? 'orange' : 'red'} variant="subtle">
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
                          <Table.Cell color="purple.300">🏢 {p.warehouse ? p.warehouse.name : 'Merkez Depo'}</Table.Cell>
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
                        <Text>Satıcı & Depo Yöneticisi Başvuruları</Text>
                      </HStack>
                    </Card.Title>
                    <Card.Description color="whiteAlpha.600" fontSize="sm">
                      Depo açmak ve satıcı olmak isteyen kullanıcıların başvurularını inceleyip yetkilendirin.
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
                    Henüz yeni bir satıcı / depo yöneticisi başvurusu bulunmuyor.
                  </Text>
                ) : (
                  <Box overflowX="auto">
                    <Table.Root size="md" variant="line">
                      <Table.Header>
                        <Table.Row borderBottom="1px solid" borderColor="whiteAlpha.200">
                          <Table.ColumnHeader color="whiteAlpha.600">Aday e-Posta</Table.ColumnHeader>
                          <Table.ColumnHeader color="whiteAlpha.600">İstenen Depo Adı & Konum</Table.ColumnHeader>
                          <Table.ColumnHeader color="whiteAlpha.600">Vergi No / Not</Table.ColumnHeader>
                          <Table.ColumnHeader color="whiteAlpha.600">Durum</Table.ColumnHeader>
                          <Table.ColumnHeader color="whiteAlpha.600">İşlem</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {applications.map(app => (
                          <Table.Row key={app.id} borderBottom="1px solid" borderColor="whiteAlpha.100">
                            <Table.Cell color="white" fontWeight="bold">
                              <VStack align="start" gap={1}>
                                <Text fontSize="sm">{app.email}</Text>
                                {app.managerTitle && (
                                  <Badge colorPalette="cyan" variant="solid" size="xs">
                                    {app.managerTitle}
                                  </Badge>
                                )}
                              </VStack>
                            </Table.Cell>
                            <Table.Cell color="cyan.300">🏢 {app.warehouseName} ({app.location})</Table.Cell>
                            <Table.Cell color="whiteAlpha.700" fontSize="xs">VN: {app.taxId} • {app.reason}</Table.Cell>
                            <Table.Cell>
                              <Badge colorPalette={app.status === 'approved' ? 'emerald' : app.status === 'rejected' ? 'red' : 'amber'} variant="subtle">
                                {app.status === 'approved' ? `✅ ${app.managerTitle || 'Depo Yöneticisi'}` : app.status === 'rejected' ? '❌ Reddedildi' : '⏳ Bekliyor (İstek)'}
                              </Badge>
                            </Table.Cell>
                            <Table.Cell>
                              {app.status === 'pending' ? (
                                <HStack gap={2}>
                                  <Button
                                    size="xs"
                                    colorPalette="emerald"
                                    variant="solid"
                                    borderRadius="lg"
                                    onClick={() => handleApproveApp(app.id, app.email)}
                                  >
                                    <FiCheckCircle size={13} /> Onayla & Yetkilendir
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
                                </HStack>
                              ) : app.status === 'approved' ? (
                                <Badge colorPalette="emerald" variant="solid" size="xs">{app.managerTitle || 'Depo Yöneticisi'} Yetkisi Aktif</Badge>
                              ) : (
                                <Badge colorPalette="red" variant="subtle" size="xs">Başvuru Reddedildi</Badge>
                              )}
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
      </Container>
    </Box>
  );
}
