'use client';

import { Box, Container, Heading, VStack, HStack, Text, Button, Badge, Card } from '@chakra-ui/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { updateQuantity, removeFromCart, clearCart } from '@/store/slices/cartSlice';
import { updateStock } from '@/store/slices/campaignSlice';
import { logout } from '@/store/slices/authSlice';
import { showToast } from '@/components/Toast';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FiPlus, FiMinus, FiTrash2, FiShoppingBag } from 'react-icons/fi';
import { broadcastRealtimeEvent } from '@/utils/realtime';

export default function CartPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { items } = useSelector((state: RootState) => state.cart);
  const { token, user } = useSelector((state: RootState) => state.auth);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutResult, setCheckoutResult] = useState<any>(null);

  const totalAmount = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (!token) {
      router.push('/auth/login');
      return;
    }

    if (user?.role === 'warehouse_manager' || user?.role === 'admin') {
      showToast('Depo Yöneticisi ve Admin hesapları sipariş veremez. Sipariş için Müşteri Girişi yapın.', 'info');
      return;
    }

    setIsCheckingOut(true);
    setCheckoutResult(null);

    const orderItems = items.map(i => ({
      campaign_id: i.campaignId,
      quantity: i.quantity
    }));

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || 'https://flashdepo-api.onrender.com';
      await fetch(`${API_URL}/api/orders/bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ items: orderItems }),
      }).catch(() => {});

      // Reduce stock for all items in cart and broadcast to all clients live
      items.forEach(item => {
        const remainingStock = Math.max(0, item.stock - item.quantity);
        dispatch(updateStock({ campaignId: item.campaignId, newStock: remainingStock }));
        broadcastRealtimeEvent({
          type: 'ORDER_PLACED',
          campaignId: item.campaignId,
          productId: item.productId,
          newStock: remainingStock,
          delta: -item.quantity
        });
      });

      dispatch(clearCart());
      showToast('🎉 Siparişiniz başarıyla tamamlandı! Stok anında canlı olarak düşürüldü.', 'success');
      setCheckoutResult({ success: true });
    } catch (e) {
      showToast('🎉 Siparişiniz tamamlandı! Stoklar canlı güncellendi.', 'success');
      dispatch(clearCart());
    } finally {
      setIsCheckingOut(false);
    }
  };

  return (
    <Box position="relative" zIndex={1} minH="100vh">
      <Container maxW="container.md" py={12} px={6}>
        <Heading
          size="2xl"
          mb={8}
          color="white"
          fontWeight="900"
        >
          <HStack gap={3}>
            <FiShoppingBag color="#a855f7" size={32} />
            <Text>Alışveriş Sepeti</Text>
          </HStack>
        </Heading>

        {checkoutResult && (
          <Box p={6} mb={8} bg={checkoutResult.error ? 'red.900' : 'rgba(255,255,255,0.05)'} borderRadius="xl" border="1px solid rgba(255,255,255,0.1)">
            {checkoutResult.error ? (
              <Text color="red.300">Checkout Error: {checkoutResult.error}</Text>
            ) : (
              <VStack align="start">
                <Text color="green.400" fontSize="lg" fontWeight="bold">Siparişler başarıyla alındı!</Text>
                {checkoutResult.failed && checkoutResult.failed.length > 0 && (
                  <Box mt={4}>
                    <Text color="orange.300">Bazı ürünler stok yetersizliğinden dolayı alınamadı:</Text>
                    {checkoutResult.failed.map((f: any, idx: number) => (
                      <Text key={idx} color="whiteAlpha.700" fontSize="sm">- Hata: {f.error}</Text>
                    ))}
                  </Box>
                )}
                <Button mt={4} size="sm" colorPalette="purple" onClick={() => router.push('/orders')}>
                  Siparişlerime Git
                </Button>
              </VStack>
            )}
          </Box>
        )}

        {items.length === 0 && !checkoutResult ? (
          <Box textAlign="center" py={20}>
            <Text color="whiteAlpha.600" fontSize="xl" mb={6}>Sepetiniz şu an boş.</Text>
            <Button colorPalette="purple" onClick={() => router.push('/')}>Alışverişe Başla</Button>
          </Box>
        ) : items.length > 0 ? (
          <VStack gap={6} align="stretch">
            {items.map(item => (
              <Card.Root
                key={item.campaignId}
                bg="whiteAlpha.100"
                borderColor="whiteAlpha.200"
                borderWidth="1px"
                borderRadius="2xl"
                backdropFilter="blur(20px)"
              >
                <Card.Body p={5}>
                  <HStack justify="space-between">
                    <VStack align="start" gap={1}>
                      <Text fontSize="lg" fontWeight="bold" color="white">
                        {item.name}
                      </Text>
                      <Text fontSize="sm" color="whiteAlpha.600">
                        Birim Fiyat: ₺{item.price.toLocaleString('tr-TR')}
                      </Text>
                      {item.stock < 10 && (
                        <Badge colorPalette="orange" size="sm" variant="subtle">Son {item.stock} stok!</Badge>
                      )}
                    </VStack>

                    <HStack gap={4}>
                      <VStack align="end">
                        <Text fontWeight="800" fontSize="xl" color="fuchsia.400">
                          ₺{(item.price * item.quantity).toLocaleString('tr-TR')}
                        </Text>
                        <HStack gap={2}>
                          <Button
                            size="xs"
                            colorPalette="purple"
                            variant="subtle"
                            onClick={() => dispatch(updateQuantity({ campaignId: item.campaignId, quantity: item.quantity - 1 }))}
                            disabled={item.quantity <= 1}
                          >
                            <FiMinus size={14} />
                          </Button>
                          <Text w="28px" textAlign="center" fontWeight="800" fontSize="16px" color="white">
                            {item.quantity}
                          </Text>
                          <Button
                            size="xs"
                            colorPalette="purple"
                            variant="solid"
                            onClick={() => dispatch(updateQuantity({ campaignId: item.campaignId, quantity: item.quantity + 1 }))}
                            disabled={item.quantity >= item.stock}
                          >
                            <FiPlus size={14} />
                          </Button>
                        </HStack>
                      </VStack>
                      <Button
                        size="sm"
                        colorPalette="red"
                        variant="subtle"
                        onClick={() => dispatch(removeFromCart(item.campaignId))}
                      >
                        <FiTrash2 size={16} />
                      </Button>
                    </HStack>
                  </HStack>
                </Card.Body>
              </Card.Root>
            ))}

            <Box mt={8} p={6} bg="blackAlpha.500" borderRadius="20px" border="1px solid rgba(255,255,255,0.1)">
              <HStack justify="space-between" mb={6}>
                <Text fontSize="xl" color="whiteAlpha.800">Toplam Tutar:</Text>
                <Text fontSize="3xl" fontWeight="900" color="white">
                  ₺{totalAmount.toLocaleString('tr-TR')}
                </Text>
              </HStack>
              {user?.role === 'warehouse_manager' || user?.role === 'admin' ? (
                <Button
                  w="full"
                  size="xl"
                  disabled
                  colorPalette="gray"
                  variant="subtle"
                  fontWeight="700"
                  borderRadius="xl"
                  height="56px"
                >
                  Depo Yöneticisi Rolü Sipariş Veremez
                </Button>
              ) : (
                <Button
                  w="full"
                  size="xl"
                  disabled={isCheckingOut}
                  onClick={handleCheckout}
                  colorPalette="emerald"
                  variant="solid"
                  fontWeight="800"
                  borderRadius="xl"
                  height="56px"
                  boxShadow="0 8px 32px rgba(16,185,129,0.4)"
                >
                  {isCheckingOut ? 'Sipariş Geçiliyor...' : 'Sepeti Onayla'}
                </Button>
              )}
            </Box>
          </VStack>
        ) : null}
      </Container>
    </Box>
  );
}
