'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { fetchCampaignsStart, updateStock } from '@/store/slices/campaignSlice';
import { addToCart } from '@/store/slices/cartSlice';
import { Box, Container, Heading, SimpleGrid, Grid, Text, Button, Badge, VStack, HStack } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import CountdownTimer from '@/components/CountdownTimer';
import { showToast } from '@/components/Toast';

const CARD_GRADIENTS = [
  'linear-gradient(135deg, rgba(124,58,237,0.3), rgba(236,72,153,0.2))',
  'linear-gradient(135deg, rgba(6,182,212,0.3), rgba(59,130,246,0.2))',
  'linear-gradient(135deg, rgba(249,115,22,0.3), rgba(234,179,8,0.2))',
  'linear-gradient(135deg, rgba(16,185,129,0.3), rgba(6,182,212,0.2))',
];

const CARD_BORDERS = [
  'rgba(124,58,237,0.4)',
  'rgba(6,182,212,0.4)',
  'rgba(249,115,22,0.4)',
  'rgba(16,185,129,0.4)',
];

const CARD_GLOWS = [
  '0 8px 32px rgba(124,58,237,0.2)',
  '0 8px 32px rgba(6,182,212,0.2)',
  '0 8px 32px rgba(249,115,22,0.2)',
  '0 8px 32px rgba(16,185,129,0.2)',
];

const BTN_GRADIENTS = [
  'linear-gradient(135deg, #7c3aed, #ec4899)',
  'linear-gradient(135deg, #06b6d4, #3b82f6)',
  'linear-gradient(135deg, #f97316, #eab308)',
  'linear-gradient(135deg, #10b981, #06b6d4)',
];

export default function Home() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { campaigns, loading, error } = useSelector((state: RootState) => state.campaign);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [buyingId, setBuyingId] = useState<string | null>(null);
  const [successId, setSuccessId] = useState<string | null>(null);
  const [cartSuccessId, setCartSuccessId] = useState<string | null>(null);
  const [products, setProducts] = useState<any[]>([]);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';

  const fetchProducts = async () => {
    try {
      const res = await fetch(`${API_URL}/api/products`);
      const data = await res.json();
      if (data && data.data) setProducts(data.data);
    } catch (err) {
      console.error('Failed to fetch products', err);
    }
  };

  useEffect(() => {
    dispatch(fetchCampaignsStart());
    fetchProducts();

    const WS_URL = API_URL.replace(/^http/, 'ws') + '/api/ws';
    const ws = new WebSocket(WS_URL);
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'STOCK_UPDATE') {
          dispatch(updateStock({ campaignId: data.campaignId, newStock: data.stock }));
          fetchProducts(); // Refetch products to update inventory table
        }
      } catch (e) {
        console.error(e);
      }
    };
    return () => ws.close();
  }, [dispatch, API_URL]);

  const handleBuy = async (campaignId: string) => {
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setBuyingId(campaignId);
    try {
      const res = await fetch(`${API_URL}/api/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ campaign_id: campaignId, quantity: 1 }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccessId(campaignId);
        showToast('Siparişiniz başarıyla alındı!', 'success');
        setTimeout(() => setSuccessId(null), 3000);
      } else {
        showToast(data.error || 'Sipariş oluşturulamadı', 'error');
      }
    } catch {
      showToast('Bağlantı hatası.', 'error');
    } finally {
      setBuyingId(null);
    }
  };

  const handleAddToCart = (camp: any) => {
    dispatch(addToCart({
      campaignId: camp.id,
      productId: camp.product_id,
      name: camp.product.name,
      price: camp.product.original_price * (1 - camp.discount_percentage / 100),
      quantity: 1,
      stock: camp.product.stock
    }));
    setCartSuccessId(camp.id);
    showToast(`${camp.product.name} sepete eklendi!`, 'success');
    setTimeout(() => setCartSuccessId(null), 2000);
  };

  const handleDeleteCampaign = async (id: string) => {
    if (!confirm('Bu kampanyayı silmek istediğinize emin misiniz?')) return;
    try {
      const res = await fetch(`${API_URL}/api/campaigns/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        dispatch(fetchCampaignsStart());
        showToast('Kampanya silindi', 'info');
      } else {
        showToast('Silinemedi.', 'error');
      }
    } catch (e) {
      console.error(e);
      showToast('Bağlantı hatası.', 'error');
    }
  };

  const now = new Date().getTime();
  const activeCampaigns = campaigns.filter(c => c.campaign_stock > 0 && new Date(c.start_time).getTime() <= now && new Date(c.end_time).getTime() > now);
  const upcomingCampaigns = campaigns.filter(c => c.campaign_stock > 0 && new Date(c.start_time).getTime() > now);
  const expiredCampaigns = campaigns.filter(c => c.campaign_stock <= 0 || new Date(c.end_time).getTime() <= now);

  return (
    <Box position="relative" zIndex={1} minH="100vh">
      <Container maxW="container.xl" py={12} px={6}>
        <Grid templateColumns={{ base: "1fr", lg: "3fr 1fr" }} gap={8}>
          <Box>

        {/* Hero Section */}
        <VStack gap={4} mb={12} textAlign="center">
          <Badge
            style={{
              background: 'rgba(124,58,237,0.2)',
              border: '1px solid rgba(124,58,237,0.4)',
              color: '#a78bfa',
              borderRadius: '999px',
              padding: '4px 16px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            🔥 Canlı Flash Sale
          </Badge>

          <Heading
            size="4xl"
            fontWeight="900"
            lineHeight="1.1"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #a855f7 50%, #ec4899 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Aktif Kampanyalar
          </Heading>

          <Text color="whiteAlpha.600" fontSize="lg" maxW="500px">
            Sınırlı stok, sınırlı süre. Her saniye fark yaratır — fırsatı kaçırma!
          </Text>

          {/* Live indicator */}
          <HStack gap={2}>
            <Box position="relative" w={3} h={3}>
              <Box
                position="absolute"
                inset={0}
                bg="green.400"
                borderRadius="full"
                style={{ animation: 'pulse-ring 1.5s ease-out infinite' }}
              />
              <Box w={3} h={3} bg="green.400" borderRadius="full" />
            </Box>
            <Text fontSize="sm" color="green.400" fontWeight="600">
              Gerçek zamanlı stok takibi aktif
            </Text>
          </HStack>
        </VStack>

        {/* Loading */}
        {loading && (
          <VStack gap={4} py={20}>
            <Box
              w={12} h={12}
              style={{
                border: '3px solid rgba(124,58,237,0.3)',
                borderTop: '3px solid #7c3aed',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <Text color="whiteAlpha.600">Kampanyalar yükleniyor...</Text>
          </VStack>
        )}

        {/* Error */}
        {error && (
          <Box
            p={6}
            style={{
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.3)',
              borderRadius: '16px',
            }}
          >
            <Text color="red.400" textAlign="center">{error}</Text>
          </Box>
        )}

        {/* Campaign Cards */}
        {!loading && !error && (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} gap={6}>
            {activeCampaigns.map((camp, i) => {
              const idx = i % CARD_GRADIENTS.length;
              const discountedPrice = camp.product.original_price * (1 - camp.discount_percentage / 100);
              const isOutOfStock = camp.campaign_stock <= 0;
              const isBuying = buyingId === camp.id;
              const isSuccess = successId === camp.id;

              return (
                <Box
                  key={camp.id}
                  style={{
                    background: isOutOfStock
                      ? 'rgba(255,255,255,0.03)'
                      : CARD_GRADIENTS[idx],
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    border: `1px solid ${isOutOfStock ? 'rgba(255,255,255,0.06)' : CARD_BORDERS[idx]}`,
                    borderRadius: '24px',
                    padding: '28px',
                    boxShadow: isOutOfStock ? 'none' : CARD_GLOWS[idx],
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                    opacity: isOutOfStock ? 0.6 : 1,
                    cursor: 'default',
                  }}
                  onMouseEnter={e => {
                    if (!isOutOfStock) {
                      (e.currentTarget as HTMLElement).style.transform = 'translateY(-8px)';
                      (e.currentTarget as HTMLElement).style.boxShadow = CARD_GLOWS[idx].replace('0.2', '0.45');
                    }
                  }}
                  onMouseLeave={e => {
                    (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                    (e.currentTarget as HTMLElement).style.boxShadow = isOutOfStock ? 'none' : CARD_GLOWS[idx];
                  }}
                >
                  <Box
                    mb={6}
                    borderRadius="16px"
                    overflow="hidden"
                    height="200px"
                    position="relative"
                    style={{
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <img
                      src={camp.product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'}
                      alt={camp.product.name}
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                        filter: isOutOfStock ? 'grayscale(100%)' : 'none',
                        transition: 'transform 0.5s ease',
                      }}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLImageElement).style.transform = 'scale(1.05)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLImageElement).style.transform = 'scale(1)';
                      }}
                    />
                  </Box>

                  {/* Top row: name + discount badge */}
                  <HStack justify="space-between" mb={4}>
                    <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
                      {camp.product.description}
                    </Text>
                    {!isOutOfStock && (
                      <Box
                        style={{
                          background: 'linear-gradient(90deg, #f97316, #ec4899, #7c3aed, #ec4899, #f97316)',
                          backgroundSize: '200% auto',
                          animation: 'shimmer 3s linear infinite',
                          borderRadius: '999px',
                          padding: '2px 12px',
                          fontSize: '11px',
                          fontWeight: '800',
                          color: 'white',
                          letterSpacing: '0.5px',
                        }}
                      >
                        %{camp.discount_percentage} İNDİRİM
                      </Box>
                    )}
                  </HStack>

                  <HStack justify="space-between" align="start" mb={5}>
                    <Heading size="xl" color="white" fontWeight="800" lineHeight="1.2">
                      {camp.product.name}
                    </Heading>
                    {user?.role === 'admin' && (
                      <Button size="xs" colorPalette="red" variant="solid" onClick={() => handleDeleteCampaign(camp.id)}>
                        Sil
                      </Button>
                    )}
                  </HStack>

                  {/* Price section */}
                  <Box
                    mb={5}
                    p={4}
                    style={{
                      background: 'rgba(0,0,0,0.25)',
                      borderRadius: '16px',
                      border: '1px solid rgba(255,255,255,0.06)',
                    }}
                  >
                    <HStack justify="space-between" align="flex-end">
                      <Box>
                        <Text fontSize="xs" color="whiteAlpha.500" mb={1}>İndirimli Fiyat</Text>
                        <Text
                          fontSize="3xl"
                          fontWeight="900"
                          style={{
                            background: isOutOfStock
                              ? 'none'
                              : `linear-gradient(135deg, ${CARD_BORDERS[idx].replace('0.4', '1')}, white)`,
                            WebkitBackgroundClip: isOutOfStock ? 'none' : 'text',
                            WebkitTextFillColor: isOutOfStock ? 'gray' : 'transparent',
                            backgroundClip: isOutOfStock ? 'none' : 'text',
                            color: isOutOfStock ? 'gray' : undefined,
                          }}
                        >
                          ₺{discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                        </Text>
                      </Box>
                      <Box textAlign="right">
                        <Text fontSize="xs" color="whiteAlpha.400" mb={1}>Normal Fiyat</Text>
                        <Text
                          fontSize="md"
                          color="whiteAlpha.400"
                          textDecoration="line-through"
                          fontWeight="500"
                        >
                          ₺{camp.product.original_price.toLocaleString('tr-TR')}
                        </Text>
                      </Box>
                    </HStack>
                  </Box>

                  {/* Stock indicator */}
                  <HStack justify="space-between" mb={5}>
                    <HStack gap={2}>
                      {!isOutOfStock ? (
                        <>
                          <Box
                            position="relative"
                            w={2}
                            h={2}
                          >
                            <Box
                              position="absolute"
                              inset={0}
                              bg="green.400"
                              borderRadius="full"
                              style={{ animation: 'pulse-ring 1.5s ease-out infinite', opacity: 0.6 }}
                            />
                            <Box w={2} h={2} bg="green.400" borderRadius="full" />
                          </Box>
                          <Text fontSize="sm" color="green.400" fontWeight="600">
                            Kampanya Kotası: {camp.campaign_stock} adet
                          </Text>
                        </>
                      ) : (
                        <>
                          <Box w={2} h={2} bg="red.400" borderRadius="full" />
                          <Text fontSize="sm" color="red.400" fontWeight="600">Kota Doldu</Text>
                        </>
                      )}
                    </HStack>

                    {!isOutOfStock && camp.campaign_stock < 20 && (
                      <Text fontSize="xs" color="orange.400" fontWeight="700">
                        ⚠️ Son {camp.campaign_stock} adet!
                      </Text>
                    )}
                  </HStack>

                  {/* CTA Button */}
                  <Button
                    width="full"
                    size="lg"
                    disabled={isOutOfStock || isBuying}
                    onClick={() => handleAddToCart(camp)}
                    style={{
                      background: (isSuccess || cartSuccessId === camp.id)
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : isOutOfStock
                          ? 'rgba(255,255,255,0.05)'
                          : BTN_GRADIENTS[idx],
                      border: 'none',
                      borderRadius: '14px',
                      color: isOutOfStock ? 'rgba(255,255,255,0.3)' : 'white',
                      fontWeight: '800',
                      fontSize: '15px',
                      letterSpacing: '0.5px',
                      boxShadow: isOutOfStock
                        ? 'none'
                        : `0 8px 24px ${CARD_BORDERS[idx].replace('0.4', '0.5')}`,
                      transition: 'all 0.3s ease',
                      height: '52px',
                    }}
                  >
                    {isOutOfStock 
                      ? 'Stok Tükendi' 
                      : cartSuccessId === camp.id 
                        ? '✅ Sepete Eklendi!' 
                        : '🛒 Sepete Ekle'}
                  </Button>
                  <Box mt={6}>
                    <CountdownTimer endTime={camp.end_time} />
                  </Box>
                </Box>
              );
            })}
          </SimpleGrid>
        )}

        {!loading && !error && activeCampaigns.length === 0 && (
          <VStack py={20} gap={4}>
            <Text fontSize="5xl">🎯</Text>
            <Text color="whiteAlpha.500" fontSize="lg">Şu an aktif kampanya yok</Text>
          </VStack>
        )}

          </Box>
          <Box>
            {/* Sidebar: Upcoming Campaigns */}
            <VStack align="stretch" gap={6} position="sticky" top="24px">
              <Box bg="rgba(0,0,0,0.4)" p={6} borderRadius="2xl" border="1px solid rgba(255,255,255,0.1)">
                <Heading size="md" mb={4} color="orange.400">⏳ Yaklaşan Fırsatlar</Heading>
                <VStack align="stretch" gap={4}>
                  {upcomingCampaigns.map(camp => (
                    <Box key={camp.id} p={4} bg="rgba(255,255,255,0.02)" borderRadius="xl" border="1px dashed rgba(249,115,22,0.3)">
                      <HStack justify="space-between" mb={2}>
                        <Text color="white" fontWeight="bold" fontSize="sm">{camp.product.name}</Text>
                        {user?.role === 'admin' && (
                          <Button size="xs" colorPalette="red" variant="solid" onClick={() => handleDeleteCampaign(camp.id)}>Sil</Button>
                        )}
                      </HStack>
                      <Text color="orange.400" fontSize="sm" fontWeight="bold" mb={2}>
                        ₺{(camp.product.original_price * (1 - camp.discount_percentage / 100)).toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                      </Text>
                      <CountdownTimer endTime={camp.start_time} mode="start" />
                    </Box>
                  ))}
                  {upcomingCampaigns.length === 0 && <Text color="whiteAlpha.500" fontSize="sm">Şu an planlanan kampanya yok.</Text>}
                </VStack>
              </Box>

              {/* Sidebar: Expired Campaigns */}
              <Box bg="rgba(0,0,0,0.4)" p={6} borderRadius="2xl" border="1px solid rgba(255,255,255,0.1)">
                <Heading size="md" mb={4} color="red.400">🔴 Kaçan Fırsatlar</Heading>
                <VStack align="stretch" gap={3}>
                  {expiredCampaigns.slice(0, 5).map(camp => (
                    <Box key={camp.id} p={3} bg="rgba(255,255,255,0.02)" borderRadius="lg" opacity={0.6}>
                      <HStack justify="space-between">
                        <Box>
                          <Text color="white" fontWeight="600" fontSize="xs" textDecoration="line-through">{camp.product.name}</Text>
                          <Text color="red.400" fontSize="xs">{camp.campaign_stock <= 0 ? 'Tükendi' : 'Süresi Bitti'}</Text>
                        </Box>
                        {user?.role === 'admin' && (
                          <Button size="xs" colorPalette="red" variant="solid" onClick={() => handleDeleteCampaign(camp.id)}>Sil</Button>
                        )}
                      </HStack>
                    </Box>
                  ))}
                  {expiredCampaigns.length === 0 && <Text color="whiteAlpha.500" fontSize="sm">Yok.</Text>}
                </VStack>
              </Box>
            </VStack>
          </Box>
        </Grid>
        {/* Inventory Tracker */}
        <Box mt={20} p={6} bg="rgba(0,0,0,0.4)" borderRadius="2xl" border="1px solid rgba(255,255,255,0.1)">
          <VStack gap={4} mb={8}>
            <Heading size="xl" color="white">Stok Takip (Canlı Envanter)</Heading>
            <Text color="whiteAlpha.600">Fırsatlar tükenmeden stok durumlarını anlık takip edin.</Text>
          </VStack>
          
          <Box overflowX="auto">
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', color: 'white' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.2)', color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', fontSize: '12px', letterSpacing: '1px' }}>
                  <th style={{ padding: '16px' }}>Ürün</th>
                  <th style={{ padding: '16px' }}>Depo / Konum</th>
                  <th style={{ padding: '16px', textAlign: 'right' }}>Mevcut Stok</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => (
                  <tr key={p.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                    <td style={{ padding: '16px', fontWeight: 'bold' }}>{p.name}</td>
                    <td style={{ padding: '16px' }}>
                      <Badge colorPalette={p.warehouse?.name.includes('Ankara') ? 'blue' : 'purple'}>
                        📍 {p.warehouse?.name || 'Bilinmiyor'}
                      </Badge>
                    </td>
                    <td style={{ padding: '16px', textAlign: 'right' }}>
                      <Text 
                        fontWeight="800" 
                        color={p.stock > 50 ? 'green.400' : p.stock > 10 ? 'orange.400' : 'red.400'}
                      >
                        {p.stock} adet
                      </Text>
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ padding: '16px', textAlign: 'center', color: 'gray' }}>Envanterde ürün bulunamadı.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </Box>
        </Box>
      </Container>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.5); opacity: 0; }
        }
      `}</style>
    </Box>
  );
}
