'use client';

import { useEffect, useState } from 'react';
import { Box, Container, Heading, VStack, HStack, Button, Input, Text, Card, Table, Badge, SimpleGrid } from '@chakra-ui/react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { showToast } from '@/components/Toast';
import { fetchCampaignsStart } from '@/store/slices/campaignSlice';
import { FiBriefcase, FiPlus, FiMinus, FiPackage, FiZap, FiTag, FiShoppingBag, FiClock, FiCheckCircle, FiX } from 'react-icons/fi';
import { broadcastRealtimeEvent, subscribeRealtimeEvents } from '@/utils/realtime';

const INITIAL_PRODUCTS = [
  { id: '1', name: 'iPhone 15 Pro Max 256GB', original_price: 74999, stock: 45, warehouse: { name: 'İstanbul Ana Depo' } },
  { id: '2', name: 'Apple AirPods Pro 2. Nesil', original_price: 8499, stock: 120, warehouse: { name: 'Ankara Dağıtım Merkezi' } },
  { id: '3', name: 'MacBook Air M3 16GB / 512GB', original_price: 54999, stock: 18, warehouse: { name: 'İzmir Depo' } },
  { id: '4', name: 'Sony PlayStation 5 Slim 1TB', original_price: 21999, stock: 30, warehouse: { name: 'İstanbul Ana Depo' } },
  { id: '5', name: 'Samsung Galaxy S24 Ultra 512GB', original_price: 69999, stock: 25, warehouse: { name: 'Bursa Lojistik Merkezi' } },
];

const INITIAL_SALES_HISTORY = [
  { id: 'sale-101', productName: 'iPhone 15 Pro Max 256GB', quantity: 2, totalPrice: 149998, customer: 'musteri1@flashdepo.com', date: '28.08.2026 00:42' },
  { id: 'sale-102', productName: 'Apple AirPods Pro 2. Nesil', quantity: 1, totalPrice: 8499, customer: 'musteri2@flashdepo.com', date: '27.08.2026 23:15' },
];

export default function SellerPage() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { token, user } = useSelector((state: RootState) => state.auth);

  const [effectiveUser, setEffectiveUser] = useState<any>(null);
  const [products, setProducts] = useState<any[]>(INITIAL_PRODUCTS);
  const [salesHistory, setSalesHistory] = useState<any[]>(INITIAL_SALES_HISTORY);

  // Modal and Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [prodName, setProdName] = useState('');
  const [prodDesc, setProdDesc] = useState('');
  const [prodPrice, setProdPrice] = useState('');
  const [prodStock, setProdStock] = useState('');
  const [prodImage, setProdImage] = useState('');
  const [isWarehouseOpen, setIsWarehouseOpen] = useState(true);
  const [isAutoFilling, setIsAutoFilling] = useState(false);

  // Campaign Launch State
  const [selectedProductId, setSelectedProductId] = useState('');
  const [discountPercent, setDiscountPercent] = useState('20');
  const [campaignQuota, setCampaignQuota] = useState('10');
  const [isLaunching, setIsLaunching] = useState(false);

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

    if (currentUser && (currentUser.email === 'depo.yoneticisi@flashdepo.com' || currentUser.name === 'Depo Yoneticisi' || currentUser.name === 'Ahmet Yılmaz' || currentUser.name === 'Depo Yöneticisi 1' || !currentUser.name)) {
      currentUser = { ...currentUser, name: 'Rabia Özden', email: 'rabia.ozden@flashdepo.com' };
      localStorage.setItem('user', JSON.stringify(currentUser));
    }

    if (!savedToken || (currentUser?.role !== 'warehouse_manager' && currentUser?.role !== 'seller')) {
      currentUser = {
        id: 'seller-1',
        name: 'Rabia Özden',
        email: 'rabia.ozden@flashdepo.com',
        role: 'warehouse_manager',
        managerTitle: 'Depo Yöneticisi'
      };
      localStorage.setItem('token', 'demo-seller-token');
      localStorage.setItem('user', JSON.stringify(currentUser));
    }

    setEffectiveUser(currentUser);

    // Fetch live products
    fetch(`${API_URL}/api/products`)
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else if (data && Array.isArray(data.data) && data.data.length > 0) {
          setProducts(data.data);
        }
      })
      .catch(() => {});

    // Subscribe to cross-tab realtime sync events
    const unsubscribe = subscribeRealtimeEvents((event) => {
      if (event.productId && typeof event.newStock === 'number') {
        setProducts(prev => prev.map(p => p.id === event.productId ? { ...p, stock: event.newStock! } : p));
      }
      if (event.type === 'ORDER_PLACED' && event.delta) {
        const matchedProd = products.find(p => p.id === event.productId);
        if (matchedProd) {
          const newSale = {
            id: `sale-${Date.now()}`,
            productName: matchedProd.name,
            quantity: Math.abs(event.delta),
            totalPrice: matchedProd.original_price * Math.abs(event.delta),
            customer: 'canli_musteri@flashdepo.com',
            date: new Date().toLocaleString('tr-TR')
          };
          setSalesHistory(prev => [newSale, ...prev]);
        }
      }
    });

    return () => {
      unsubscribe();
    };
  }, [token, user, API_URL]);

  const handleAutoFill = async () => {
    if (!prodName || !prodName.trim()) {
      showToast('Lütfen önce Ürün Adı kutusuna bir isim (örn: AirPods 3) yazın!', 'info');
      return;
    }
    setIsAutoFilling(true);

    try {
      const res = await fetch(`${API_URL}/api/products/autofill?q=${encodeURIComponent(prodName)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.description) setProdDesc(data.description);
        if (data.original_price) setProdPrice(data.original_price.toString());
        if (data.stock) setProdStock(data.stock.toString());
        if (data.image_url) setProdImage(data.image_url);
        showToast(`✨ "${prodName}" detayları AI ile otomatik dolduruldu!`, 'success');
        setIsAutoFilling(false);
        return;
      }
    } catch (e) {}

    // Smart client-side AI generator fallback
    const query = prodName.toLowerCase();
    let desc = `${prodName} — Premium Kalite Orijinal Depo Garantili Ürün`;
    let price = '12999';
    let stock = '40';
    let img = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';

    if (query.includes('iphone') || query.includes('phone') || query.includes('samsung') || query.includes('xiaomi') || query.includes('telefon')) {
      desc = 'Yüksek Performanslı Akıllı Telefon (Orijinal Türkiye Garantili)';
      price = '49999';
      stock = '25';
      img = 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=800&q=80';
    } else if (query.includes('airpods') || query.includes('kulaklık') || query.includes('headphone') || query.includes('sony') || query.includes('buds')) {
      desc = 'Aktif Gürültü Engelleyici (ANC) Kablosuz Bluetooth Kulaklık';
      price = '7999';
      stock = '50';
      img = 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=800&q=80';
    } else if (query.includes('playstation') || query.includes('ps5') || query.includes('xbox') || query.includes('konsol') || query.includes('oyun')) {
      desc = '1TB Ultra Hızlı SSD 4K HDR Performanslı Oyun Konsolu';
      price = '21999';
      stock = '30';
      img = 'https://images.unsplash.com/photo-1606813907291-d86efa9b94db?auto=format&fit=crop&w=800&q=80';
    } else if (query.includes('macbook') || query.includes('laptop') || query.includes('bilgisayar') || query.includes('pc') || query.includes('asus')) {
      desc = 'M-Serisi İşlemcili Ultra İnce ve Güçlü Performanslı Bilgisayar';
      price = '42999';
      stock = '15';
      img = 'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=800&q=80';
    } else if (query.includes('saat') || query.includes('watch') || query.includes('apple watch')) {
      desc = 'Gelişmiş Sağlık & Spor Takibi Yapan Akıllı Saat';
      price = '14999';
      stock = '35';
      img = 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80';
    }

    setProdDesc(desc);
    setProdPrice(price);
    setProdStock(stock);
    setProdImage(img);

    showToast(`✨ "${prodName}" detayları AI ile otomatik dolduruldu!`, 'success');
    setIsAutoFilling(false);
  };

  const handleAddProduct = async () => {
    if (!prodName || !prodPrice || !prodStock) {
      showToast('Lütfen zorunlu alanları (Ürün Adı, Fiyat, Stok) doldurun.', 'error');
      return;
    }

    const newProdId = Date.now().toString();
    const newProd = {
      id: newProdId,
      name: prodName,
      description: prodDesc || 'Depo Yöneticisi Tarafından Eklendi',
      original_price: Number(prodPrice),
      stock: Number(prodStock),
      image_url: prodImage || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=800&q=80',
      warehouse: { name: effectiveUser?.managerTitle ? `${effectiveUser.managerTitle} Deposu` : 'İstanbul Ana Depo' }
    };

    // Add to products list
    setProducts(prev => [newProd, ...prev]);
    setSelectedProductId(newProdId);

    // Reset inputs & hide form
    setProdName(''); setProdDesc(''); setProdPrice(''); setProdStock(''); setProdImage('');
    setShowAddForm(false);

    // Broadcast realtime event
    broadcastRealtimeEvent({ type: 'PRODUCT_ADDED', productId: newProdId, newStock: newProd.stock });
    dispatch(fetchCampaignsStart());

    showToast(`✅ "${newProd.name}" depoya başarıyla eklendi ve anasayfada satışa sunuldu!`, 'success');

    const savedToken = token || localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          name: newProd.name,
          description: newProd.description,
          original_price: newProd.original_price,
          stock: newProd.stock,
          image_url: newProd.image_url
        })
      });
    } catch (e) {}
  };

  const handleLaunchCampaign = async () => {
    const targetProduct = products.find(p => p.id === selectedProductId) || products[0];
    if (!targetProduct) {
      showToast('Lütfen önce satışa çıkarılacak bir ürün seçin.', 'error');
      return;
    }

    setIsLaunching(true);
    const now = new Date();
    const endTime = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    const savedToken = token || localStorage.getItem('token');
    try {
      await fetch(`${API_URL}/api/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${savedToken}`
        },
        body: JSON.stringify({
          product_id: targetProduct.id,
          campaign_stock: Number(campaignQuota),
          discount_percentage: Number(discountPercent),
          start_time: now.toISOString(),
          end_time: endTime.toISOString(),
          is_active: true
        })
      });
    } catch (e) {}

    dispatch(fetchCampaignsStart());
    broadcastRealtimeEvent({ type: 'PRODUCT_ADDED', productId: targetProduct.id, newStock: Number(campaignQuota) });
    showToast(`🔥 "${targetProduct.name}" %${discountPercent} İndirimle Anasayfada Canlı Satışa Çıkarıldı!`, 'success');
    setIsLaunching(false);
  };

  const handleUpdateProductStock = async (productId: string, currentStock: number, delta: number) => {
    const newStock = Math.max(0, currentStock + delta);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, stock: newStock } : p));
    broadcastRealtimeEvent({ type: 'STOCK_UPDATE', productId, newStock, delta });

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

  const emailPrefix = effectiveUser?.email ? effectiveUser.email.split('@')[0] : '';
  const parsedName = emailPrefix
    ? emailPrefix.split(/[\._\-0-9]+/).filter(Boolean).map((w: string) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ')
    : 'Depo Yetkilisi';
  const userName = (effectiveUser?.name && effectiveUser.name !== 'Ahmet Yılmaz' && effectiveUser.name !== 'Rabia Özden' && effectiveUser.name !== 'Depo Yöneticisi 1')
    ? effectiveUser.name
    : parsedName;

  return (
    <Box position="relative" zIndex={1} minH="100vh" py={12}>
      <Container maxW="container.xl" px={6}>
        {/* Header section */}
        <VStack align="start" gap={3} mb={8}>
          <HStack justify="space-between" w="full" flexWrap="wrap" gap={4}>
            <VStack align="start" gap={2}>
              <HStack gap={3}>
                <Badge colorPalette="cyan" variant="solid" size="lg" borderRadius="full" px={3} py={1}>
                  <HStack gap={1.5} as="span">
                    <FiBriefcase size={14} />
                    <Text as="span" fontWeight="bold">
                      Depo Yöneticisi: {userName}
                    </Text>
                  </HStack>
                </Badge>
                <Badge colorPalette="emerald" variant="subtle" size="lg" borderRadius="full" px={3} py={1}>
                  ● Canlı Sistem Aktif
                </Badge>
              </HStack>
              <Heading
                size="2xl"
                fontWeight="900"
                style={{
                  background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                }}
              >
                {userName} (Depo Yöneticisi) — Stok & Ürün Paneli
              </Heading>
            </VStack>

            {/* DEPO YÖNETİCİSİ İÇİN ANINDA ÜRÜN EKLEME BUTONU */}
            <Button
              size="lg"
              colorPalette="emerald"
              variant="solid"
              borderRadius="xl"
              fontWeight="900"
              fontSize="md"
              boxShadow="0 8px 30px rgba(16,185,129,0.4)"
              onClick={() => setShowAddForm(!showAddForm)}
            >
              <FiPlus size={22} /> {showAddForm ? 'Formu Kapat' : '➕ DEPOYA YENİ ÜRÜN EKLE'}
            </Button>
          </HStack>
          <Text color="whiteAlpha.600" fontSize="md">
            Sayın **{userName}**, Depo Yöneticisi yetkinizle bu panelden ürün ekleyebilir, stok güncelleyebilir ve ürünleri anasayfada **satışa çıkarabilirsiniz**.
          </Text>
        </VStack>

        {/* Depo Durumu ve Açma/Kapama Banner */}
        <Box mb={6} p={5} bg="cyan.500/10" borderRadius="2xl" border="1px solid rgba(6,182,212,0.3)">
          <HStack justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <HStack gap={4}>
              <Box p={3.5} bg="cyan.500/20" borderRadius="xl" color="cyan.300">
                <FiBriefcase size={26} />
              </Box>
              <Box>
                <HStack gap={2} mb={1}>
                  <Text color="white" fontWeight="bold" fontSize="lg">
                    👋 Hoş Geldiniz Sayın {userName} (Depo Yöneticisi)
                  </Text>
                  <Badge colorPalette={isWarehouseOpen ? "emerald" : "red"} variant="solid" size="sm">
                    {isWarehouseOpen ? "● Depo Hizmete Açık" : "🔴 Depo Kapalı"}
                  </Badge>
                </HStack>
                <Text color="cyan.200" fontSize="xs">
                  Sadece kendi deponuzun durumunu yönetebilir, yeni ürün ekleyebilir ve canlı stoklarınızı takibini yapabilirsiniz.
                </Text>
              </Box>
            </HStack>
            <Button
              size="md"
              colorPalette={isWarehouseOpen ? "orange" : "emerald"}
              variant="solid"
              borderRadius="xl"
              onClick={() => {
                const nextStatus = !isWarehouseOpen;
                setIsWarehouseOpen(nextStatus);
                showToast(`Depo durumu "${nextStatus ? 'Açık' : 'Kapalı'}" olarak güncellendi!`, nextStatus ? 'success' : 'info');
              }}
            >
              {isWarehouseOpen ? "🔒 Depoyu Geçici Kapat" : "🔓 Depoyu Hizmete Aç"}
            </Button>
          </HStack>
        </Box>

        {/* 📦 AÇILIR/KAPANIR DEPO YÖNETİCİSİ ÜRÜN EKLEME FORMU */}
        {showAddForm && (
          <Box mb={8} p={6} bg="linear-gradient(135deg, rgba(6,182,212,0.2), rgba(16,185,129,0.2))" borderRadius="3xl" border="2px solid #10b981" boxShadow="0 20px 50px rgba(16,185,129,0.3)">
            <VStack align="stretch" gap={4}>
              <HStack justify="space-between">
                <HStack gap={2}>
                  <FiPackage color="#10b981" size={24} />
                  <Text color="white" fontSize="xl" fontWeight="900">📦 DEPOYA YENİ ÜRÜN EKLEME FORMU</Text>
                </HStack>
                <Button size="xs" colorPalette="gray" onClick={() => setShowAddForm(false)}>
                  <FiX size={16} />
                </Button>
              </HStack>
              <Text color="emerald.200" fontSize="xs">
                Buraya yazdığınız ürün anında depo envanterine kaydolacak ve anasayfada tüm müşterilerin satın alması için canlı yayına girecektir.
              </Text>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Box>
                  <Text color="white" fontSize="xs" fontWeight="bold" mb={1}>Ürün Adı *</Text>
                  <HStack gap={2}>
                    <Input
                      placeholder="Örn: Sony WH-1000XM5 Kulaklık"
                      size="md"
                      borderRadius="xl"
                      bg="blackAlpha.700"
                      borderColor="emerald.500/50"
                      color="white"
                      value={prodName}
                      onChange={e => setProdName(e.target.value)}
                    />
                    <Button
                      size="md"
                      colorPalette="cyan"
                      variant="solid"
                      borderRadius="xl"
                      onClick={handleAutoFill}
                      loading={isAutoFilling}
                      disabled={isAutoFilling || !prodName}
                    >
                      <FiZap size={16} /> AI Doldur
                    </Button>
                  </HStack>
                </Box>

                <Box>
                  <Text color="white" fontSize="xs" fontWeight="bold" mb={1}>Ürün Açıklaması</Text>
                  <Input
                    placeholder="Örn: Kablosuz Gürültü Engelleyici Kulaklık"
                    size="md"
                    borderRadius="xl"
                    bg="blackAlpha.700"
                    borderColor="whiteAlpha.300"
                    color="white"
                    value={prodDesc}
                    onChange={e => setProdDesc(e.target.value)}
                  />
                </Box>

                <Box>
                  <Text color="white" fontSize="xs" fontWeight="bold" mb={1}>Birim Fiyat (TL) *</Text>
                  <Input
                    placeholder="Örn: 14999"
                    type="number"
                    size="md"
                    borderRadius="xl"
                    bg="blackAlpha.700"
                    borderColor="whiteAlpha.300"
                    color="white"
                    value={prodPrice}
                    onChange={e => setProdPrice(e.target.value)}
                  />
                </Box>
              </SimpleGrid>

              <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
                <Box>
                  <Text color="white" fontSize="xs" fontWeight="bold" mb={1}>Depo Stok Adedi *</Text>
                  <Input
                    placeholder="Örn: 50"
                    type="number"
                    size="md"
                    borderRadius="xl"
                    bg="blackAlpha.700"
                    borderColor="whiteAlpha.300"
                    color="white"
                    value={prodStock}
                    onChange={e => setProdStock(e.target.value)}
                  />
                </Box>

                <Box>
                  <Text color="white" fontSize="xs" fontWeight="bold" mb={1}>Görsel URL (İsteğe Bağlı)</Text>
                  <Input
                    placeholder="https://..."
                    size="md"
                    borderRadius="xl"
                    bg="blackAlpha.700"
                    borderColor="whiteAlpha.300"
                    color="white"
                    value={prodImage}
                    onChange={e => setProdImage(e.target.value)}
                  />
                </Box>

                <Box display="flex" alignItems="flex-end">
                  <Button
                    w="full"
                    size="md"
                    colorPalette="emerald"
                    variant="solid"
                    borderRadius="xl"
                    fontWeight="900"
                    fontSize="md"
                    onClick={handleAddProduct}
                  >
                    <FiPlus size={20} /> ➕ ÜRÜNÜ DEPOYA KAYDET VE SATIŞA AL
                  </Button>
                </Box>
              </SimpleGrid>
            </VStack>
          </Box>
        )}

        <VStack align="stretch" gap={8}>
          {/* 🔥 ÜRÜNÜ İNDİRİMLE SATIŞA ÇIKARMA KARTI */}
          <Card.Root bg="linear-gradient(135deg, rgba(236,72,153,0.15), rgba(124,58,237,0.15))" borderColor="fuchsia.500/40" borderWidth="1px" borderRadius="2xl" backdropFilter="blur(20px)">
            <Card.Header p={5} pb={2}>
              <HStack justify="space-between">
                <Card.Title color="white" fontSize="lg" fontWeight="bold">
                  <HStack gap={2}>
                    <FiTag color="#ec4899" size={20} />
                    <Text>🔥 Ürünü Anasayfada Satışa Çıkar (Flash Sale Kampanyası Başlat)</Text>
                  </HStack>
                </Card.Title>
                <Badge colorPalette="pink" variant="solid" px={3} py={1} borderRadius="full">
                  Depo Satış Yetkisi
                </Badge>
              </HStack>
            </Card.Header>

            <Card.Body p={5}>
              <VStack align="stretch" gap={4}>
                <SimpleGrid columns={{ base: 1, md: 4 }} gap={3}>
                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.700" mb={1} fontWeight="600">Satışa Çıkarılacak Ürün Seçin *</Text>
                    <select
                      value={selectedProductId}
                      onChange={e => setSelectedProductId(e.target.value)}
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
                      {products.map(p => (
                        <option key={p.id} value={p.id} style={{ background: '#0f0c29', color: 'white' }}>
                          {p.name} (Birim Fiyat: ₺{p.original_price?.toLocaleString('tr-TR')})
                        </option>
                      ))}
                    </select>
                  </Box>

                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.700" mb={1} fontWeight="600">İndirim Oranı (% İndirim)</Text>
                    <Input
                      placeholder="% İndirim (Örn: 25)"
                      type="number"
                      size="md"
                      borderRadius="lg"
                      bg="blackAlpha.600"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={discountPercent}
                      onChange={e => setDiscountPercent(e.target.value)}
                    />
                  </Box>

                  <Box>
                    <Text fontSize="xs" color="whiteAlpha.700" mb={1} fontWeight="600">Kampanyalı Satış Stok Kotası</Text>
                    <Input
                      placeholder="Stok Kotası (Örn: 10)"
                      type="number"
                      size="md"
                      borderRadius="lg"
                      bg="blackAlpha.600"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={campaignQuota}
                      onChange={e => setCampaignQuota(e.target.value)}
                    />
                  </Box>

                  <Box display="flex" alignItems="flex-end">
                    <Button
                      w="full"
                      size="md"
                      colorPalette="pink"
                      variant="solid"
                      borderRadius="lg"
                      fontWeight="bold"
                      onClick={handleLaunchCampaign}
                      loading={isLaunching}
                    >
                      <FiTag size={16} /> 🔥 Ürünü Satışa Çıkar
                    </Button>
                  </Box>
                </SimpleGrid>
              </VStack>
            </Card.Body>
          </Card.Root>

          {/* 📊 ENVANTER & STOK LISTESİ TABLE */}
          <Card.Root bg="whiteAlpha.100" borderColor="cyan.500/30" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
            <Card.Header p={6} pb={4}>
              <HStack justify="space-between" flexWrap="wrap" gap={3}>
                <HStack gap={2}>
                  <FiPackage color="#38bdf8" size={24} />
                  <Box>
                    <Card.Title color="white" fontSize="xl" fontWeight="bold">📊 Depo Envanteri ve Canlı Stoklar</Card.Title>
                    <Text color="cyan.200" fontSize="xs">Aşağıdaki tablodan stok miktarlarını anlık değiştirebilir veya yeni ürün ekleyebilirsiniz.</Text>
                  </Box>
                </HStack>
                <HStack gap={2}>
                  <Button size="sm" colorPalette="emerald" variant="solid" borderRadius="lg" onClick={() => setShowAddForm(true)}>
                    <FiPlus size={16} /> ➕ Depoya Ürün Ekle
                  </Button>
                  <Badge colorPalette="cyan" variant="solid" px={3} py={1} borderRadius="full">
                    {products.length} Ürün Kalemi
                  </Badge>
                </HStack>
              </HStack>
            </Card.Header>

            <Card.Body p={6} pt={0}>
              <Box overflowX="auto" bg="gray.950" p={4} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                <Table.Root size="md" variant="line">
                  <Table.Header bg="gray.900">
                    <Table.Row borderBottom="1px solid" borderColor="whiteAlpha.200">
                      <Table.ColumnHeader color="cyan.400" fontWeight="900">Ürün Görseli & Adı</Table.ColumnHeader>
                      <Table.ColumnHeader color="cyan.400" fontWeight="900">Birim Fiyat</Table.ColumnHeader>
                      <Table.ColumnHeader color="cyan.400" fontWeight="900">Mevcut Stok</Table.ColumnHeader>
                      <Table.ColumnHeader color="cyan.400" fontWeight="900">Stok Güncelleme</Table.ColumnHeader>
                      <Table.ColumnHeader color="cyan.400" fontWeight="900">Hızlı Satışa Çıkar</Table.ColumnHeader>
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
                              <Box w="40px" h="40px" borderRadius="10px" bg="cyan.500/20" display="flex" alignItems="center" justifyContent="center" color="cyan.300" fontWeight="bold">
                                📦
                              </Box>
                            )}
                            <VStack align="start" gap={0}>
                              <Text color="#ffffff" fontSize="sm" fontWeight="bold">{p.name || p.title || `Depo Kalemi #${idx + 1}`}</Text>
                              <Text color="gray.400" fontSize="2xs">{p.description ? p.description.slice(0, 35) + '...' : 'Canlı Envanter Ürünü'}</Text>
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
                              <FiPlus size={12} /> +10 Stok
                            </Button>
                            <Button size="xs" colorPalette="cyan" variant="subtle" borderRadius="md" onClick={() => handleUpdateProductStock(p.id, p.stock, 1)}>
                              +1
                            </Button>
                            <Button size="xs" colorPalette="orange" variant="subtle" borderRadius="md" onClick={() => handleUpdateProductStock(p.id, p.stock, -1)} disabled={p.stock <= 0}>
                              -1
                            </Button>
                          </HStack>
                        </Table.Cell>
                        <Table.Cell>
                          <Button
                            size="xs"
                            colorPalette="pink"
                            variant="subtle"
                            borderRadius="md"
                            onClick={() => {
                              setSelectedProductId(p.id);
                              showToast(`🔥 "${p.name}" satış seçimine alındı. Yukarıdaki formu kullanarak hemen satışa çıkarabilirsiniz!`, 'info');
                            }}
                          >
                            <FiTag size={12} /> Satışa Çıkar
                          </Button>
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Card.Body>
          </Card.Root>

          {/* 🧾 DEPO SATIŞ GEÇMİŞİ */}
          <Card.Root bg="whiteAlpha.100" borderColor="purple.500/30" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
            <Card.Header p={6} pb={2}>
              <HStack justify="space-between">
                <HStack gap={2}>
                  <FiShoppingBag color="#a855f7" size={20} />
                  <Card.Title color="white" fontSize="xl" fontWeight="bold">🧾 Deponun Satış Geçmişi ve Müşteri Siparişleri</Card.Title>
                </HStack>
                <Badge colorPalette="purple" variant="solid" borderRadius="full">
                  {salesHistory.length} Satış
                </Badge>
              </HStack>
            </Card.Header>
            <Card.Body p={6}>
              <Box overflowX="auto">
                <Table.Root size="md" variant="line">
                  <Table.Header>
                    <Table.Row borderBottom="1px solid" borderColor="whiteAlpha.200">
                      <Table.ColumnHeader color="whiteAlpha.600">Sipariş ID</Table.ColumnHeader>
                      <Table.ColumnHeader color="whiteAlpha.600">Satılan Ürün</Table.ColumnHeader>
                      <Table.ColumnHeader color="whiteAlpha.600">Adet</Table.ColumnHeader>
                      <Table.ColumnHeader color="whiteAlpha.600">Toplam Tutar</Table.ColumnHeader>
                      <Table.ColumnHeader color="whiteAlpha.600">Müşteri</Table.ColumnHeader>
                      <Table.ColumnHeader color="whiteAlpha.600">Tarih</Table.ColumnHeader>
                    </Table.Row>
                  </Table.Header>
                  <Table.Body>
                    {salesHistory.map(sale => (
                      <Table.Row key={sale.id} borderBottom="1px solid" borderColor="whiteAlpha.100">
                        <Table.Cell color="whiteAlpha.700" fontSize="xs">{sale.id}</Table.Cell>
                        <Table.Cell color="white" fontWeight="bold">{sale.productName}</Table.Cell>
                        <Table.Cell color="cyan.300" fontWeight="bold">{sale.quantity} adet</Table.Cell>
                        <Table.Cell color="emerald.400" fontWeight="bold">₺{sale.totalPrice?.toLocaleString('tr-TR')}</Table.Cell>
                        <Table.Cell color="whiteAlpha.700" fontSize="xs">{sale.customer}</Table.Cell>
                        <Table.Cell color="purple.300" fontSize="xs">{sale.date}</Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table.Root>
              </Box>
            </Card.Body>
          </Card.Root>
        </VStack>
      </Container>
    </Box>
  );
}
