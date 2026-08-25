'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Heading, VStack, HStack, Button, Input, Text, Card, Table, Badge, SimpleGrid } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';
import { FiTrash2, FiRefreshCw, FiPlus, FiZap, FiBox, FiTag, FiShoppingBag, FiLayers, FiShield, FiCheckCircle, FiClock, FiXCircle, FiPackage, FiBarChart2 } from 'react-icons/fi';

export default function AdminPage() {
  const router = useRouter();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [tab, setTab] = useState<'campaigns' | 'products'>('campaigns');

  const [products, setProducts] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [campaigns, setCampaigns] = useState<any[]>([]);

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
    if (!token || user?.role !== 'admin') {
      router.push('/');
      return;
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
  }, [token, user, router, API_URL]);

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
        <HStack gap={4} mb={8}>
          <Button 
            size="lg"
            variant={tab === 'campaigns' ? 'solid' : 'subtle'} 
            colorPalette="purple" 
            borderRadius="xl"
            onClick={() => setTab('campaigns')}
          >
            <FiTag size={18} /> Kampanya Yönetimi
          </Button>
          <Button 
            size="lg"
            variant={tab === 'products' ? 'solid' : 'subtle'} 
            colorPalette="cyan" 
            borderRadius="xl"
            onClick={() => setTab('products')}
          >
            <FiBox size={18} /> Ürün & Envanter Yönetimi
          </Button>
        </HStack>

        {/* Main Content Area */}
        {tab === 'campaigns' ? (
          <VStack align="stretch" gap={8}>
            {/* Create Campaign Form Card */}
            <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
              <Card.Header p={6} pb={0}>
                <Card.Title color="white" fontSize="xl" fontWeight="bold">
                  <HStack gap={2}>
                    <FiZap color="#a855f7" size={20} />
                    <Text>Yeni Flash Sale Kampanyası Oluştur</Text>
                  </HStack>
                </Card.Title>
                <Card.Description color="whiteAlpha.600" fontSize="sm">
                  Depodaki mevcut bir ürünü seçerek anlık indirim oranı ve stok kotası tanımlayın.
                </Card.Description>
              </Card.Header>

              <Card.Body p={6}>
                <VStack align="stretch" gap={5}>
                  <Box>
                    <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Hedef Ürün Seçin</Text>
                    <select
                      value={campProductId}
                      onChange={(e: any) => setCampProductId(e.target.value)}
                      style={{
                        background: '#0f0c29',
                        color: 'white',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        outline: 'none',
                        fontSize: '14px',
                        width: '100%',
                      }}
                    >
                      <option value="" style={{ background: '#0f0c29', color: 'white' }}>-- Seçiniz --</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id} style={{ background: '#0f0c29', color: 'white' }}>
                          {p.name} (Stok: {p.stock} adet - Depo: {p.warehouse ? p.warehouse.name : 'Genel'})
                        </option>
                      ))}
                    </select>
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">İndirim Oranı (%)</Text>
                      <Input
                        placeholder="Örn: 25 (%25 İndirim)"
                        type="number"
                        size="lg"
                        borderRadius="xl"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={campDiscount}
                        onChange={e => setCampDiscount(e.target.value)}
                      />
                    </Box>
                    <Box>
                      <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Kampanya Satış Kotası (Adet)</Text>
                      <Input
                        placeholder="Örn: 50"
                        type="number"
                        size="lg"
                        borderRadius="xl"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={campStock}
                        onChange={e => setCampStock(e.target.value)}
                      />
                    </Box>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Başlangıç Tarih & Saati</Text>
                      <Input
                        type="datetime-local"
                        size="lg"
                        borderRadius="xl"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={campStart}
                        onChange={e => setCampStart(e.target.value)}
                      />
                    </Box>
                    <Box>
                      <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Bitiş Tarih & Saati</Text>
                      <Input
                        type="datetime-local"
                        size="lg"
                        borderRadius="xl"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={campEnd}
                        onChange={e => setCampEnd(e.target.value)}
                      />
                    </Box>
                  </SimpleGrid>

                  <Button
                    size="lg"
                    colorPalette="purple"
                    borderRadius="xl"
                    height="50px"
                    fontWeight="bold"
                    onClick={handleAddCampaign}
                    disabled={!campProductId || !campDiscount || !campStock || !campStart || !campEnd}
                  >
                    <FiPlus size={18} /> Kampanyayı Canlıya Al
                  </Button>
                </VStack>
              </Card.Body>
            </Card.Root>

            {/* Campaign Lists */}
            <SimpleGrid columns={{ base: 1, lg: 3 }} gap={6}>
              {/* Active */}
              <Card.Root bg="whiteAlpha.100" borderColor="emerald.500/30" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
                <Card.Header p={5} pb={2}>
                  <HStack justify="space-between">
                    <Card.Title color="emerald.300" fontSize="lg" fontWeight="bold">
                      <HStack gap={2}>
                        <FiCheckCircle color="#34d399" size={18} />
                        <Text>Aktif Kampanyalar</Text>
                      </HStack>
                    </Card.Title>
                    <Badge colorPalette="emerald" variant="solid" borderRadius="full">{activeCampaigns.length}</Badge>
                  </HStack>
                </Card.Header>
                <Card.Body p={5}>
                  <VStack align="stretch" gap={3}>
                    {activeCampaigns.map(c => (
                      <HStack key={c.id} justify="space-between" p={3} bg="blackAlpha.400" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                        <Box>
                          <Text color="white" fontWeight="bold" fontSize="sm">{c.product?.name}</Text>
                          <Text color="emerald.400" fontSize="xs">%{c.discount_percentage} İndirim • Kota: {c.campaign_stock}</Text>
                        </Box>
                        <Button size="xs" colorPalette="red" variant="subtle" onClick={() => handleDeleteCampaign(c.id)}>
                          <FiTrash2 size={13} /> Sil
                        </Button>
                      </HStack>
                    ))}
                    {activeCampaigns.length === 0 && <Text color="whiteAlpha.400" fontSize="sm" py={4} textAlign="center">Aktif kampanya bulunmuyor.</Text>}
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Upcoming */}
              <Card.Root bg="whiteAlpha.100" borderColor="amber.500/30" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
                <Card.Header p={5} pb={2}>
                  <HStack justify="space-between">
                    <Card.Title color="amber.300" fontSize="lg" fontWeight="bold">
                      <HStack gap={2}>
                        <FiClock color="#fbbf24" size={18} />
                        <Text>Yaklaşan Kampanyalar</Text>
                      </HStack>
                    </Card.Title>
                    <Badge colorPalette="amber" variant="solid" borderRadius="full">{upcomingCampaigns.length}</Badge>
                  </HStack>
                </Card.Header>
                <Card.Body p={5}>
                  <VStack align="stretch" gap={3}>
                    {upcomingCampaigns.map(c => (
                      <HStack key={c.id} justify="space-between" p={3} bg="blackAlpha.400" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                        <Box>
                          <Text color="white" fontWeight="bold" fontSize="sm">{c.product?.name}</Text>
                          <Text color="amber.400" fontSize="xs">%{c.discount_percentage} İndirim • Kota: {c.campaign_stock}</Text>
                        </Box>
                        <Button size="xs" colorPalette="red" variant="subtle" onClick={() => handleDeleteCampaign(c.id)}>
                          <FiTrash2 size={13} /> Sil
                        </Button>
                      </HStack>
                    ))}
                    {upcomingCampaigns.length === 0 && <Text color="whiteAlpha.400" fontSize="sm" py={4} textAlign="center">Yaklaşan kampanya bulunmuyor.</Text>}
                  </VStack>
                </Card.Body>
              </Card.Root>

              {/* Expired */}
              <Card.Root bg="whiteAlpha.100" borderColor="red.500/30" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
                <Card.Header p={5} pb={2}>
                  <HStack justify="space-between">
                    <Card.Title color="red.300" fontSize="lg" fontWeight="bold">
                      <HStack gap={2}>
                        <FiXCircle color="#f87171" size={18} />
                        <Text>Biten Kampanyalar</Text>
                      </HStack>
                    </Card.Title>
                    <Badge colorPalette="red" variant="solid" borderRadius="full">{expiredCampaigns.length}</Badge>
                  </HStack>
                </Card.Header>
                <Card.Body p={5}>
                  <VStack align="stretch" gap={3}>
                    {expiredCampaigns.map(c => (
                      <HStack key={c.id} justify="space-between" p={3} bg="blackAlpha.400" borderRadius="xl" border="1px solid" borderColor="whiteAlpha.100">
                        <Box>
                          <Text color="white" fontWeight="bold" fontSize="sm">{c.product?.name}</Text>
                          <Text color="red.400" fontSize="xs">Süre doldu / Kota tükendi</Text>
                        </Box>
                        <HStack gap={1}>
                          <Button size="xs" colorPalette="blue" variant="subtle" onClick={() => handleRestartCampaign(c.id)}>
                            <FiRefreshCw size={13} />
                          </Button>
                          <Button size="xs" colorPalette="red" variant="subtle" onClick={() => handleDeleteCampaign(c.id)}>
                            <FiTrash2 size={13} />
                          </Button>
                        </HStack>
                      </HStack>
                    ))}
                    {expiredCampaigns.length === 0 && <Text color="whiteAlpha.400" fontSize="sm" py={4} textAlign="center">Biten kampanya bulunmuyor.</Text>}
                  </VStack>
                </Card.Body>
              </Card.Root>
            </SimpleGrid>
          </VStack>
        ) : (
          <VStack align="stretch" gap={8}>
            {/* Create Product Card */}
            <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
              <Card.Header p={6} pb={0}>
                <HStack justify="space-between" flexWrap="wrap">
                  <Box>
                    <Card.Title color="white" fontSize="xl" fontWeight="bold">📦 Yeni Ürün Tanımla</Card.Title>
                    <Card.Description color="whiteAlpha.600" fontSize="sm">Depoya yeni ürün ekleyin veya Yapay Zeka ile otomatik katalog bilgisi çekin.</Card.Description>
                  </Box>
                </HStack>
              </Card.Header>

              <Card.Body p={6}>
                <VStack align="stretch" gap={5}>
                  <Box>
                    <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Bağlı Olduğu Depo</Text>
                    <select
                      value={prodWarehouseId}
                      onChange={(e: any) => setProdWarehouseId(e.target.value)}
                      style={{
                        background: '#0f0c29',
                        color: 'white',
                        padding: '14px 16px',
                        borderRadius: '12px',
                        border: '1px solid rgba(255,255,255,0.2)',
                        outline: 'none',
                        fontSize: '14px',
                        width: '100%',
                      }}
                    >
                      <option value="" style={{ background: '#0f0c29', color: 'white' }}>-- Depo Seçiniz --</option>
                      {warehouses.map(w => (
                        <option key={w.id} value={w.id} style={{ background: '#0f0c29', color: 'white' }}>{w.name} ({w.location})</option>
                      ))}
                    </select>
                  </Box>

                  <HStack gap={3}>
                    <Input
                      placeholder="Ürün Adı (Örn: iPhone 16 Pro Max)"
                      size="lg"
                      borderRadius="xl"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={prodName}
                      onChange={e => setProdName(e.target.value)}
                    />
                    <Button
                      size="lg"
                      colorPalette="cyan"
                      variant="solid"
                      borderRadius="xl"
                      onClick={handleAutoFill}
                      loading={isAutoFilling}
                      disabled={isAutoFilling || !prodName}
                    >
                      <FiZap size={18} /> AI ile Doldur
                    </Button>
                  </HStack>

                  <Input
                    placeholder="Açıklama / Özellikler"
                    size="lg"
                    borderRadius="xl"
                    bg="blackAlpha.500"
                    borderColor="whiteAlpha.200"
                    color="white"
                    value={prodDesc}
                    onChange={e => setProdDesc(e.target.value)}
                  />

                  <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                    <Input
                      placeholder="Orijinal Fiyat (TL)"
                      type="number"
                      size="lg"
                      borderRadius="xl"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={prodPrice}
                      onChange={e => setProdPrice(e.target.value)}
                    />
                    <Input
                      placeholder="Stok Adedi"
                      type="number"
                      size="lg"
                      borderRadius="xl"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={prodStock}
                      onChange={e => setProdStock(e.target.value)}
                    />
                    <Input
                      placeholder="Görsel URL (İsteğe bağlı)"
                      size="lg"
                      borderRadius="xl"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={prodImage}
                      onChange={e => setProdImage(e.target.value)}
                    />
                  </SimpleGrid>

                  <Button
                    size="lg"
                    colorPalette="cyan"
                    borderRadius="xl"
                    height="50px"
                    fontWeight="bold"
                    onClick={handleAddProduct}
                    disabled={!prodWarehouseId || !prodName || !prodPrice || !prodStock}
                  >
                    <FiPlus size={18} /> Ürünü Kaydet
                  </Button>
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
                        <Table.ColumnHeader color="whiteAlpha.600">Bağlı Depo</Table.ColumnHeader>
                      </Table.Row>
                    </Table.Header>
                    <Table.Body>
                      {products.map(p => (
                        <Table.Row key={p.id} borderBottom="1px solid" borderColor="whiteAlpha.100">
                          <Table.Cell color="white" fontWeight="bold">{p.name}</Table.Cell>
                          <Table.Cell color="emerald.400" fontWeight="bold">₺{p.original_price?.toLocaleString('tr-TR')}</Table.Cell>
                          <Table.Cell>
                            <Badge colorPalette={p.stock > 10 ? 'emerald' : 'orange'} variant="subtle">
                              {p.stock} adet
                            </Badge>
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
        )}
      </Container>
    </Box>
  );
}
