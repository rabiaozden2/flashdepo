'use client';

import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { fetchCampaignsStart, updateStock } from '@/store/slices/campaignSlice';
import { addToCart } from '@/store/slices/cartSlice';
import { Box, Container, Heading, SimpleGrid, Grid, Text, Button, Badge, VStack, HStack, Spinner, Card } from '@chakra-ui/react';
import { useRouter } from 'next/navigation';
import CountdownTimer from '@/components/CountdownTimer';
import { showToast } from '@/components/Toast';
import { FiTrash2 } from 'react-icons/fi';

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
    let ws: WebSocket | null = null;

    const connectWS = () => {
      try {
        ws = new WebSocket(WS_URL);
        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            const targetCampaignId = data.campaignId || data.campaign_id || data.id;
            const newStock = Number(data.stock ?? data.new_stock ?? data.campaign_stock);
            
            if (targetCampaignId && !isNaN(newStock)) {
              dispatch(updateStock({ campaignId: targetCampaignId, newStock }));
            } else {
              dispatch(fetchCampaignsStart());
            }
            fetchProducts();
          } catch (e) {
            console.error('WS parse error:', e);
          }
        };
      } catch (e) {
        console.error('WS error:', e);
      }
    };

    connectWS();

    return () => {
      if (ws) ws.close();
    };
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
        // Instant local stock reduction for zero-latency UI update
        const targetCamp = campaigns.find(c => c.id === campaignId);
        if (targetCamp) {
          const currentStock = targetCamp.campaign_stock;
          const newStock = Math.max(0, currentStock - 1);
          dispatch(updateStock({ campaignId, newStock }));
        }
        showToast('Siparişiniz başarıyla alındı! Stok anında güncellendi.', 'success');
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
            <Spinner size="xl" color="purple.400" />
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
                <Card.Root
                  key={camp.id}
                  bg={isOutOfStock ? "whiteAlpha.50" : "whiteAlpha.100"}
                  borderColor={isOutOfStock ? "whiteAlpha.100" : idx === 0 ? "purple.500/40" : idx === 1 ? "cyan.500/40" : idx === 2 ? "orange.500/40" : "emerald.500/40"}
                  borderWidth="1px"
                  borderRadius="3xl"
                  overflow="hidden"
                  backdropFilter="blur(20px)"
                  shadow={isOutOfStock ? "none" : "xl"}
                  transition="all 0.3s ease"
                  opacity={isOutOfStock ? 0.6 : 1}
                  _hover={{ transform: isOutOfStock ? "none" : "translateY(-6px)", shadow: "2xl" }}
                >
                  <Card.Body p={6}>
                    <Box borderRadius="2xl" overflow="hidden" h="200px" mb={4} border="1px solid" borderColor="whiteAlpha.100" bg="blackAlpha.300">
                      <img
                        src={camp.product.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80'}
                        alt={camp.product.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                      />
                    </Box>

                    <HStack justify="space-between" mb={3}>
                      <Text fontSize="xs" color="whiteAlpha.500" fontWeight="600" textTransform="uppercase" letterSpacing="wider">
                        {camp.product.description}
                      </Text>
                      {!isOutOfStock && (
                        <Badge colorPalette={idx === 0 ? "purple" : idx === 1 ? "cyan" : idx === 2 ? "orange" : "emerald"} variant="solid" borderRadius="full" px={3} py={1} fontSize="xs" fontWeight="800">
                          %{camp.discount_percentage} İNDİRİM
                        </Badge>
                      )}
                    </HStack>

                    <HStack justify="space-between" align="start" mb={4}>
                      <Card.Title color="white" fontSize="2xl" fontWeight="800">
                        {camp.product.name}
                      </Card.Title>
                      {user?.role === 'admin' && (
                        <Button size="xs" colorPalette="red" variant="subtle" onClick={() => handleDeleteCampaign(camp.id)}>
                          <FiTrash2 size={13} /> Sil
                        </Button>
                      )}
                    </HStack>

                    <Card.Description as="div" mb={4} p={4} bg="blackAlpha.400" borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                      <HStack justify="space-between" align="flex-end">
                        <Box>
                          <Text fontSize="xs" color="whiteAlpha.500" mb={1}>İndirimli Fiyat</Text>
                          <Text fontSize="3xl" fontWeight="900" color={isOutOfStock ? "gray.500" : "white"}>
                            ₺{discountedPrice.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                          </Text>
                        </Box>
                        <Box textAlign="right">
                          <Text fontSize="xs" color="whiteAlpha.400" mb={1}>Normal Fiyat</Text>
                          <Text fontSize="md" color="whiteAlpha.400" textDecoration="line-through" fontWeight="500">
                            ₺{camp.product.original_price.toLocaleString('tr-TR')}
                          </Text>
                        </Box>
                      </HStack>
                    </Card.Description>

                    <HStack justify="space-between" mb={5}>
                      <HStack gap={2}>
                        <Badge colorPalette={isOutOfStock ? "red" : "emerald"} variant="subtle" size="sm" borderRadius="md" px={2} py={1}>
                          {isOutOfStock ? "Kota Doldu" : `Kota: ${camp.campaign_stock} adet`}
                        </Badge>
                      </HStack>
                      {!isOutOfStock && camp.campaign_stock < 20 && (
                        <Text fontSize="xs" color="orange.400" fontWeight="700">
                          ⚠️ Son {camp.campaign_stock} adet!
                        </Text>
                      )}
                    </HStack>

                    <Button
                      width="full"
                      size="lg"
                      disabled={isOutOfStock || isBuying}
                      onClick={() => handleAddToCart(camp)}
                      bg={isOutOfStock ? "whiteAlpha.100" : (isSuccess || cartSuccessId === camp.id) ? "emerald.500" : "linear-gradient(135deg, #7c3aed, #ec4899)"}
                      color={isOutOfStock ? "whiteAlpha.400" : "white"}
                      borderRadius="xl"
                      fontWeight="800"
                      fontSize="15px"
                      height="52px"
                      border="none"
                      boxShadow={isOutOfStock ? "none" : "0 8px 25px rgba(124,58,237,0.4)"}
                      _hover={{
                        bg: isOutOfStock ? "whiteAlpha.100" : (isSuccess || cartSuccessId === camp.id) ? "emerald.600" : "linear-gradient(135deg, #6d28d9, #db2777)",
                        transform: isOutOfStock ? "none" : "translateY(-2px)",
                        boxShadow: isOutOfStock ? "none" : "0 12px 30px rgba(124,58,237,0.6)",
                      }}
                    >
                      {isOutOfStock 
                        ? 'Stok Tükendi' 
                        : cartSuccessId === camp.id 
                          ? '✅ Sepete Eklendi!' 
                          : '🛒 Sepete Ekle'}
                    </Button>

                    <Box mt={4}>
                      <CountdownTimer endTime={camp.end_time} />
                    </Box>
                  </Card.Body>
                </Card.Root>
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
