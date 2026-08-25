'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Heading, VStack, Text, Badge, HStack, Spinner, Image, SimpleGrid, Grid, Button } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';

export default function OrdersPage() {
  const router = useRouter();
  const { token } = useSelector((state: RootState) => state.auth);
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    const fetchOrders = async () => {
      try {
        const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';
        const res = await fetch(`${API_URL}/api/orders`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        if (res.status === 401 || data.error === 'Invalid token') {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          router.push('/auth/login');
          return;
        }
        if (res.ok) {
          setOrders(data.data || []);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [token, router]);

  if (!token || loading) return (
    <Box minH="100vh" display="flex" alignItems="center" justifyContent="center">
      <VStack gap={4}>
        <Spinner size="xl" color="purple.400" />
        <Text color="whiteAlpha.600">Siparişleriniz yükleniyor...</Text>
      </VStack>
    </Box>
  );

  return (
    <Box position="relative" zIndex={1} minH="100vh">
      <Container maxW="container.xl" py={12} px={6}>
        <VStack gap={4} mb={12} textAlign="center">
          <Badge
            style={{
              background: 'rgba(236,72,153,0.2)',
              border: '1px solid rgba(236,72,153,0.4)',
              color: '#f472b6',
              borderRadius: '999px',
              padding: '4px 16px',
              fontSize: '12px',
              fontWeight: '700',
              letterSpacing: '2px',
              textTransform: 'uppercase',
            }}
          >
            Sipariş Geçmişi
          </Badge>
          <Heading
            size="4xl"
            fontWeight="900"
            lineHeight="1.1"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #ec4899 50%, #8b5cf6 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            Siparişlerim
          </Heading>
          <Text color="whiteAlpha.600" fontSize="lg" maxW="500px">
            Yakaldığınız tüm efsane fırsatlar ve geçmiş siparişleriniz.
          </Text>
        </VStack>

        {orders.length === 0 ? (
          <VStack py={20} gap={4} bg="rgba(0,0,0,0.3)" borderRadius="2xl" border="1px dashed rgba(255,255,255,0.1)">
            <Text fontSize="6xl">🛒</Text>
            <Text color="whiteAlpha.600" fontSize="lg">Henüz bir siparişiniz bulunmamaktadır.</Text>
            <Button mt={4} colorPalette="fuchsia" onClick={() => router.push('/')}>Fırsatları Keşfet</Button>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1 }} gap={6}>
            {orders.map(order => {
              const campaign = order.campaign || order.Campaign;
              const product = campaign?.product || campaign?.Product || order.product;
              const date = new Date(order.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });
              
              let statusColor = 'yellow.400';
              let statusText = 'Hazırlanıyor';
              let statusGradient = 'linear-gradient(135deg, rgba(234,179,8,0.2), rgba(234,179,8,0.05))';
              let statusBorder = 'rgba(234,179,8,0.3)';

              if (order.status === 'completed') {
                statusColor = 'green.400';
                statusText = 'Onaylandı / Teslim Edildi';
                statusGradient = 'linear-gradient(135deg, rgba(34,197,94,0.2), rgba(34,197,94,0.05))';
                statusBorder = 'rgba(34,197,94,0.3)';
              } else if (order.status === 'cancelled' || order.status === 'failed') {
                statusColor = 'red.400';
                statusText = 'İptal Edildi';
                statusGradient = 'linear-gradient(135deg, rgba(239,68,68,0.2), rgba(239,68,68,0.05))';
                statusBorder = 'rgba(239,68,68,0.3)';
              }

              return (
                <Box
                  key={order.id}
                  p={{ base: 5, md: 8 }}
                  style={{
                    background: 'rgba(255,255,255,0.02)',
                    backdropFilter: 'blur(20px)',
                    border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: '24px',
                    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
                  }}
                  _hover={{
                    transform: 'translateY(-4px)',
                    boxShadow: '0 12px 40px rgba(0,0,0,0.4)',
                    border: '1px solid rgba(255,255,255,0.15)',
                  }}
                >
                  <Grid templateColumns={{ base: "1fr", md: "150px 1fr" }} gap={8} alignItems="center">
                    
                    {/* Product Image */}
                    <Box 
                      w="100%" h="150px" 
                      bg="rgba(0,0,0,0.5)" 
                      borderRadius="xl" 
                      overflow="hidden"
                      display="flex" alignItems="center" justifyContent="center"
                      border="1px solid rgba(255,255,255,0.05)"
                    >
                      {product?.image_url ? (
                        <Image src={product.image_url} alt={product.name} objectFit="contain" w="100%" h="100%" p={4} />
                      ) : (
                        <Text color="whiteAlpha.300" fontSize="sm">Görsel Yok</Text>
                      )}
                    </Box>

                    {/* Order Details */}
                    <Box w="100%">
                      <HStack justify="space-between" align="flex-start" mb={2} flexWrap="wrap" gap={4}>
                        <Box>
                          <Badge mb={3} bg="whiteAlpha.200" color="whiteAlpha.800" borderRadius="full" px={3} py={1}>
                            Sipariş Tarihi: {date}
                          </Badge>
                          <Heading size="lg" color="white" fontWeight="800" mb={2}>
                            {product?.name || 'Bilinmeyen Ürün'}
                          </Heading>
                          <Text color="whiteAlpha.600" fontSize="md">
                            Sipariş No: <Text as="span" fontFamily="mono" color="whiteAlpha.800">#{order.id.split('-')[0].toUpperCase()}</Text>
                          </Text>
                        </Box>
                        
                        <Box textAlign={{ base: "left", md: "right" }}>
                          <Box 
                            px={4} py={2} 
                            borderRadius="xl" 
                            style={{ background: statusGradient, border: `1px solid ${statusBorder}` }}
                          >
                            <Text color={statusColor} fontWeight="800" fontSize="sm" letterSpacing="1px" textTransform="uppercase">
                              {statusText}
                            </Text>
                          </Box>
                        </Box>
                      </HStack>

                      <HStack justify="space-between" align="flex-end" mt={6} pt={6} borderTop="1px solid rgba(255,255,255,0.05)">
                        <Box>
                          <Text fontSize="xs" color="whiteAlpha.500" mb={1} textTransform="uppercase" letterSpacing="1px">Adet</Text>
                          <Text fontSize="xl" fontWeight="700" color="white">{order.quantity}x</Text>
                        </Box>
                        <Box textAlign="right">
                          <Text fontSize="xs" color="whiteAlpha.500" mb={1} textTransform="uppercase" letterSpacing="1px">Toplam Tutar</Text>
                          <Text fontSize="3xl" fontWeight="900" color="white">
                            ₺{order.total_price.toLocaleString('tr-TR', { minimumFractionDigits: 0 })}
                          </Text>
                        </Box>
                      </HStack>

                      {/* Progress Tracker Line */}
                      {order.status !== 'failed' && order.status !== 'cancelled' && (
                        <Box mt={8} position="relative">
                          <Box position="absolute" top="10px" left="0" right="0" height="2px" bg="whiteAlpha.100" zIndex={0} />
                          <Box 
                            position="absolute" top="10px" left="0" 
                            height="2px" zIndex={0}
                            style={{
                              background: 'linear-gradient(90deg, #ec4899, #8b5cf6)',
                              width: order.status === 'completed' ? '100%' : '50%',
                              transition: 'width 1s ease-in-out'
                            }} 
                          />
                          
                          <HStack justify="space-between" position="relative" zIndex={1}>
                            <VStack gap={2}>
                              <Box w={5} h={5} borderRadius="full" bg="#ec4899" boxShadow="0 0 10px rgba(236,72,153,0.5)" />
                              <Text fontSize="xs" color="whiteAlpha.800" fontWeight="600">Sipariş Alındı</Text>
                            </VStack>
                            
                            <VStack gap={2}>
                              <Box w={5} h={5} borderRadius="full" bg={order.status === 'completed' || order.status === 'pending' ? '#c084fc' : 'gray.700'} boxShadow={order.status === 'completed' || order.status === 'pending' ? "0 0 10px rgba(192,132,252,0.5)" : "none"} />
                              <Text fontSize="xs" color={order.status === 'completed' || order.status === 'pending' ? 'whiteAlpha.800' : 'whiteAlpha.400'} fontWeight="600">Hazırlanıyor</Text>
                            </VStack>

                            <VStack gap={2}>
                              <Box w={5} h={5} borderRadius="full" bg={order.status === 'completed' ? '#8b5cf6' : 'gray.700'} boxShadow={order.status === 'completed' ? "0 0 10px rgba(139,92,246,0.5)" : "none"} />
                              <Text fontSize="xs" color={order.status === 'completed' ? 'whiteAlpha.800' : 'whiteAlpha.400'} fontWeight="600">Kargoya Verildi</Text>
                            </VStack>
                          </HStack>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Box>
              );
            })}
          </SimpleGrid>
        )}
      </Container>
    </Box>
  );
}
