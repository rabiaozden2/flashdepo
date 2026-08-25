'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Heading, VStack, HStack, Text, Button, Input, Card, Badge, SimpleGrid } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { FiBriefcase, FiSend, FiCheckCircle, FiClock, FiShield, FiPackage, FiZap } from 'react-icons/fi';
import { showToast } from '@/components/Toast';

export default function ApplyPage() {
  const router = useRouter();
  const { token, user } = useSelector((state: RootState) => state.auth);

  const [email, setEmail] = useState('');
  const [warehouseName, setWarehouseName] = useState('');
  const [location, setLocation] = useState('');
  const [taxId, setTaxId] = useState('');
  const [phone, setPhone] = useState('');
  const [reason, setReason] = useState('');
  const [submittedApp, setSubmittedApp] = useState<any>(null);

  useEffect(() => {
    if (user?.email) {
      setEmail(user.email);
      // Check existing application
      const savedApps = JSON.parse(localStorage.getItem('manager_applications') || '[]');
      const userApp = savedApps.find((a: any) => a.email === user.email);
      if (userApp) {
        setSubmittedApp(userApp);
      }
    }
  }, [user]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !warehouseName || !location || !taxId) {
      showToast('Lütfen zorunlu başvuru alanlarını doldurun.', 'error');
      return;
    }

    const newApp = {
      id: Date.now().toString(),
      email: email,
      userId: user?.id || 'guest',
      warehouseName,
      location,
      taxId,
      phone: phone || 'Belirtilmedi',
      reason: reason || 'Satıcı ve Depo Yönetimi',
      status: 'pending',
      date: new Date().toLocaleDateString('tr-TR'),
      time: new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' }),
    };

    const savedApps = JSON.parse(localStorage.getItem('manager_applications') || '[]');
    savedApps.push(newApp);
    localStorage.setItem('manager_applications', JSON.stringify(savedApps));

    setSubmittedApp(newApp);
    showToast('Satıcı başvurunuz başarıyla alındı! Admin istek kutusuna iletildi.', 'success');
  };

  return (
    <Box position="relative" zIndex={1} minH="100vh" py={12}>
      <Container maxW="container.md" px={6}>
        {/* Header */}
        <VStack align="center" textAlign="center" gap={3} mb={10}>
          <Badge colorPalette="cyan" variant="subtle" size="lg" borderRadius="full" px={4} py={1}>
            <HStack gap={2}>
              <FiBriefcase size={14} />
              <Text>Satıcı & Depo Yöneticisi Olun</Text>
            </HStack>
          </Badge>

          <Heading
            size="2xl"
            fontWeight="900"
            style={{
              background: 'linear-gradient(135deg, #ffffff 0%, #38bdf8 50%, #a855f7 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            Satıcı & Depo Başvuru Formu
          </Heading>
          
          <Text color="whiteAlpha.700" fontSize="md" maxW="2xl">
            FlashDepo platformunda kendi deponuzu kaydettirin, indirimli flash sale kampanyaları oluşturun ve binlerce müşteriye ürün satın.
          </Text>
        </VStack>

        {submittedApp ? (
          /* Application Submitted Status Card */
          <Card.Root bg="whiteAlpha.100" borderColor="cyan.500/40" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)" p={4}>
            <Card.Header p={6} pb={2}>
              <HStack justify="space-between">
                <HStack gap={3}>
                  <Box p={3} bg="cyan.500/20" borderRadius="2xl" color="cyan.300">
                    <FiCheckCircle size={28} />
                  </Box>
                  <Box>
                    <Card.Title color="white" fontSize="xl" fontWeight="bold">
                      Başvurunuz Admin İstek Kutusunda!
                    </Card.Title>
                    <Card.Description color="cyan.300" fontSize="sm">
                      {submittedApp.status === 'approved' 
                        ? '🎉 Tebrikler! Admin başvurunuzu onayladı. Hesabınız Satıcı / Depo Yöneticisi yapıldı.'
                        : '⏳ Başvurunuz inceleniyor. Admin onayının ardından satıcı yetkileriniz açılacaktır.'}
                    </Card.Description>
                  </Box>
                </HStack>

                <Badge colorPalette={submittedApp.status === 'approved' ? 'emerald' : 'amber'} variant="solid" size="lg" borderRadius="full" px={3} py={1}>
                  {submittedApp.status === 'approved' ? '✅ Onaylandı' : '⏳ Bekliyor'}
                </Badge>
              </HStack>
            </Card.Header>

            <Card.Body p={6}>
              <VStack align="stretch" gap={4} bg="blackAlpha.500" p={5} borderRadius="2xl" border="1px solid" borderColor="whiteAlpha.100">
                <HStack justify="space-between">
                  <Text color="whiteAlpha.600" fontSize="sm">Aday e-Posta:</Text>
                  <Text color="white" fontWeight="bold" fontSize="sm">{submittedApp.email}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="whiteAlpha.600" fontSize="sm">Depo Adı:</Text>
                  <Text color="cyan.300" fontWeight="bold" fontSize="sm">{submittedApp.warehouseName}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="whiteAlpha.600" fontSize="sm">Şehir / Konum:</Text>
                  <Text color="white" fontWeight="bold" fontSize="sm">{submittedApp.location}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="whiteAlpha.600" fontSize="sm">Vergi No / Sicil No:</Text>
                  <Text color="white" fontWeight="bold" fontSize="sm">{submittedApp.taxId}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="whiteAlpha.600" fontSize="sm">Başvuru Tarihi:</Text>
                  <Text color="whiteAlpha.800" fontSize="sm">{submittedApp.date} {submittedApp.time}</Text>
                </HStack>
              </VStack>

              <HStack justify="center" gap={4} mt={6}>
                <Button colorPalette="purple" size="lg" borderRadius="xl" onClick={() => router.push('/')}>
                  Anasayfaya Dön
                </Button>
                {submittedApp.status === 'approved' && (
                  <Button colorPalette="emerald" size="lg" borderRadius="xl" onClick={() => router.push('/admin')}>
                    <FiShield size={16} /> Satıcı Paneline Git
                  </Button>
                )}
              </HStack>
            </Card.Body>
          </Card.Root>
        ) : (
          /* Application Form Card */
          <Card.Root bg="whiteAlpha.100" borderColor="whiteAlpha.200" borderWidth="1px" borderRadius="3xl" backdropFilter="blur(20px)">
            <Card.Header p={6} pb={0}>
              <Card.Title color="white" fontSize="xl" fontWeight="bold">
                📝 Satıcı & Depo Kayıt Formu
              </Card.Title>
              <Card.Description color="whiteAlpha.600" fontSize="sm">
                Aşağıdaki işletme ve depo bilgilerini eksiksiz doldurarak başvurunuzu Admin istek kutusuna iletin.
              </Card.Description>
            </Card.Header>

            <Card.Body p={6}>
              <form onSubmit={handleSubmit}>
                <VStack align="stretch" gap={5}>
                  <Box>
                    <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">e-Posta Adresiniz *</Text>
                    <Input
                      placeholder="Örn: satici@firma.com"
                      type="email"
                      size="lg"
                      borderRadius="xl"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Depo / İşletme Adı *</Text>
                      <Input
                        placeholder="Örn: Marmara Lojistik Deposu"
                        size="lg"
                        borderRadius="xl"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={warehouseName}
                        onChange={e => setWarehouseName(e.target.value)}
                        required
                      />
                    </Box>
                    <Box>
                      <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Şehir / Konum *</Text>
                      <Input
                        placeholder="Örn: İstanbul / Kadıköy"
                        size="lg"
                        borderRadius="xl"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        required
                      />
                    </Box>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Vergi Kimlik No / Sicil No *</Text>
                      <Input
                        placeholder="Örn: 9876543210"
                        size="lg"
                        borderRadius="xl"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={taxId}
                        onChange={e => setTaxId(e.target.value)}
                        required
                      />
                    </Box>
                    <Box>
                      <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">İletişim Telefon Numarası</Text>
                      <Input
                        placeholder="Örn: 0532 123 45 67"
                        size="lg"
                        borderRadius="xl"
                        bg="blackAlpha.500"
                        borderColor="whiteAlpha.200"
                        color="white"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <Text color="whiteAlpha.800" fontSize="sm" mb={2} fontWeight="600">Satılacak Ürün Kategorileri & Açıklama</Text>
                    <Input
                      placeholder="Örn: Cep telefonu, kulaklık ve teknolojik aksesuar stoğu yöneteceğiz."
                      size="lg"
                      borderRadius="xl"
                      bg="blackAlpha.500"
                      borderColor="whiteAlpha.200"
                      color="white"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  </Box>

                  <Button
                    type="submit"
                    size="lg"
                    colorPalette="cyan"
                    borderRadius="xl"
                    height="54px"
                    fontWeight="bold"
                    fontSize="md"
                    mt={2}
                  >
                    <FiSend size={18} /> Başvuruyu Admin İstek Kutusuna İlet
                  </Button>
                </VStack>
              </form>
            </Card.Body>
          </Card.Root>
        )}
      </Container>
    </Box>
  );
}
