'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Heading, VStack, HStack, Button, Input, Select, Text } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';

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

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
        alert('Kampanya başarıyla eklendi!');
        setCampProductId(''); setCampDiscount(''); setCampStart(''); setCampEnd(''); setCampStock('');
        fetchCampaigns();
      } else {
        const err = await res.json();
        alert('Hata: ' + err.error);
      }
    } catch (e) {
      alert('Bağlantı hatası.');
    }
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) fetchCampaigns();
      else alert('Silinemedi.');
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
        alert('Kampanya yeniden başlatıldı!');
        fetchCampaigns();
      } else {
        alert('Güncellenemedi.');
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
        alert('Ürün başarıyla eklendi!');
        setProdWarehouseId(''); setProdName(''); setProdDesc(''); setProdPrice(''); setProdStock(''); setProdImage('');
        // Refresh products list for campaign tab
        const pRes = await fetch(`${API_URL}/api/products`);
        const pData = await pRes.json();
        if (pData && pData.data) setProducts(pData.data);
      } else {
        const err = await res.json();
        alert('Hata: ' + err.error);
      }
    } catch (e) {
      alert('Bağlantı hatası.');
    }
  };

  const [isAutoFilling, setIsAutoFilling] = useState(false);
  const handleAutoFill = async () => {
    if (!prodName) {
      alert('Lütfen önce Ürün Adı kutusuna bir isim (örn: AirPods 3) yazın!');
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
      } else {
        alert('Otomatik doldurma başarısız oldu.');
      }
    } catch (e) {
      console.error(e);
      alert('Otomatik doldurma sırasında hata.');
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
    <Box position="relative" zIndex={1} minH="100vh">
      <Container maxW="container.xl" py={12} px={6}>
        <Heading
          size="2xl"
          mb={8}
          style={{
            background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 50%, #ec4899 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Admin Paneli
        </Heading>

        <HStack gap={4} mb={8}>
          <Button 
            variant={tab === 'campaigns' ? 'solid' : 'outline'} 
            colorPalette="purple" 
            onClick={() => setTab('campaigns')}
          >
            Kampanyalar
          </Button>
          <Button 
            variant={tab === 'products' ? 'solid' : 'outline'} 
            colorPalette="purple" 
            onClick={() => setTab('products')}
          >
            Ürünler
          </Button>
        </HStack>

        <Box
          p={6}
          style={{
            background: 'rgba(255,255,255,0.03)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            borderRadius: '20px',
          }}
        >
          {tab === 'campaigns' ? (
            <VStack align="stretch" gap={4}>
              <Heading size="md" color="white">Yeni Kampanya Ekle</Heading>
              
              <Text color="whiteAlpha.700" fontSize="sm">Ürün Seçin</Text>
              <select 
                value={campProductId} 
                onChange={(e) => setCampProductId(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <option value="">-- Ürün Seç --</option>
                {products.map(p => (
                  <option key={p.id} value={p.id}>{p.name} (Stok: {p.stock} - {p.warehouse ? p.warehouse.name : 'Bilinmiyor'})</option>
                ))}
              </select>

              <HStack>
                <Input placeholder="İndirim Yüzdesi (örn: 20)" type="number" bg="blackAlpha.400" value={campDiscount} onChange={e => setCampDiscount(e.target.value)} />
                <Input placeholder="Kampanya Kotası (Adet)" type="number" bg="blackAlpha.400" value={campStock} onChange={e => setCampStock(e.target.value)} />
              </HStack>
              <HStack>
                <Box flex={1}>
                  <Text color="whiteAlpha.700" fontSize="sm" mb={1}>Başlangıç Zamanı</Text>
                  <Input type="datetime-local" bg="blackAlpha.400" value={campStart} onChange={e => setCampStart(e.target.value)} />
                </Box>
                <Box flex={1}>
                  <Text color="whiteAlpha.700" fontSize="sm" mb={1}>Bitiş Zamanı</Text>
                  <Input type="datetime-local" bg="blackAlpha.400" value={campEnd} onChange={e => setCampEnd(e.target.value)} />
                </Box>
              </HStack>
              <Button colorPalette="fuchsia" onClick={handleAddCampaign} disabled={!campProductId || !campDiscount || !campStock || !campStart || !campEnd}>Kampanya Oluştur</Button>

              <Box mt={8}>
                <Heading size="md" color="green.400" mb={2}>🟢 Aktif Kampanyalar</Heading>
                <Box bg="blackAlpha.400" p={4} borderRadius="xl" mb={4}>
                  {activeCampaigns.map(c => (
                    <HStack key={c.id} justify="space-between" py={2} borderBottom="1px solid rgba(255,255,255,0.1)">
                      <Text color="white">{c.product?.name} (%{c.discount_percentage} İndirim) - Kota: {c.campaign_stock}</Text>
                      <Button size="sm" colorPalette="red" onClick={() => handleDeleteCampaign(c.id)}>Sil</Button>
                    </HStack>
                  ))}
                  {activeCampaigns.length === 0 && <Text color="whiteAlpha.500" fontSize="sm">Yok</Text>}
                </Box>

                <Heading size="md" color="orange.400" mb={2}>⏳ Yaklaşan Kampanyalar</Heading>
                <Box bg="blackAlpha.400" p={4} borderRadius="xl" mb={4}>
                  {upcomingCampaigns.map(c => (
                    <HStack key={c.id} justify="space-between" py={2} borderBottom="1px solid rgba(255,255,255,0.1)">
                      <Text color="white">{c.product?.name} (%{c.discount_percentage} İndirim) - Kota: {c.campaign_stock}</Text>
                      <Button size="sm" colorPalette="red" onClick={() => handleDeleteCampaign(c.id)}>Sil</Button>
                    </HStack>
                  ))}
                  {upcomingCampaigns.length === 0 && <Text color="whiteAlpha.500" fontSize="sm">Yok</Text>}
                </Box>

                <Heading size="md" color="red.400" mb={2}>🔴 Süresi Biten Kampanyalar</Heading>
                <Box bg="blackAlpha.400" p={4} borderRadius="xl">
                  {expiredCampaigns.map(c => (
                    <HStack key={c.id} justify="space-between" py={2} borderBottom="1px solid rgba(255,255,255,0.1)">
                      <Text color="white">{c.product?.name}</Text>
                      <HStack>
                        <Button size="sm" colorPalette="blue" onClick={() => handleRestartCampaign(c.id)}>Yeniden Başlat</Button>
                        <Button size="sm" colorPalette="red" onClick={() => handleDeleteCampaign(c.id)}>Sil</Button>
                      </HStack>
                    </HStack>
                  ))}
                  {expiredCampaigns.length === 0 && <Text color="whiteAlpha.500" fontSize="sm">Yok</Text>}
                </Box>
              </Box>
            </VStack>
          ) : (
            <VStack align="stretch" gap={4}>
              <Heading size="md" color="white">Yeni Ürün Ekle</Heading>
              
              <Text color="whiteAlpha.700" fontSize="sm">Depo Seçin</Text>
              <select 
                value={prodWarehouseId} 
                onChange={(e) => setProdWarehouseId(e.target.value)}
                style={{ background: 'rgba(0,0,0,0.4)', color: 'white', padding: '10px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.2)' }}
              >
                <option value="">-- Depo Seç --</option>
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>

              <HStack>
                <Input placeholder="Ürün Adı (örn: iPhone 16)" bg="blackAlpha.400" value={prodName} onChange={e => setProdName(e.target.value)} />
                <Button colorPalette="blue" onClick={handleAutoFill} loading={isAutoFilling} disabled={isAutoFilling || !prodName}>
                  ✨ AI ile Doldur
                </Button>
              </HStack>
              <Input placeholder="Kısa Açıklama" bg="blackAlpha.400" value={prodDesc} onChange={e => setProdDesc(e.target.value)} />
              <Input placeholder="Fiyat (TL)" type="number" bg="blackAlpha.400" value={prodPrice} onChange={e => setProdPrice(e.target.value)} />
              <Input placeholder="Stok Adedi" type="number" bg="blackAlpha.400" value={prodStock} onChange={e => setProdStock(e.target.value)} />
              <Input placeholder="Resim URL (Webden kopyalanmış resim adresi)" bg="blackAlpha.400" value={prodImage} onChange={e => setProdImage(e.target.value)} />
              
              <Button colorPalette="fuchsia" onClick={handleAddProduct} disabled={!prodWarehouseId || !prodName || !prodPrice || !prodStock}>Ürün Ekle</Button>
            
              <Box mt={8}>
                <Heading size="md" color="white" mb={4}>Mevcut Ürünler (Envanter)</Heading>
                <Box overflowX="auto" bg="blackAlpha.400" p={4} borderRadius="xl">
                  <table style={{ width: '100%', textAlign: 'left', color: 'white' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)' }}>
                        <th style={{ padding: '8px' }}>Ürün Adı</th>
                        <th style={{ padding: '8px' }}>Fiyat</th>
                        <th style={{ padding: '8px' }}>Stok</th>
                        <th style={{ padding: '8px' }}>Depo / Konum</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(p => (
                        <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                          <td style={{ padding: '8px' }}>{p.name}</td>
                          <td style={{ padding: '8px' }}>₺{p.original_price}</td>
                          <td style={{ padding: '8px' }}>{p.stock}</td>
                          <td style={{ padding: '8px', color: '#a855f7' }}>{p.warehouse ? p.warehouse.name : 'Bilinmiyor'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            </VStack>
          )}
        </Box>
      </Container>
    </Box>
  );
}
