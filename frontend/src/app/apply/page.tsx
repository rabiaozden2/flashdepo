'use client';

import { useState, useEffect } from 'react';
import { Box, Container, Heading, VStack, HStack, Text, Button, Input, Card, Badge, SimpleGrid } from '@chakra-ui/react';
import { useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { useRouter } from 'next/navigation';
import { FiBriefcase, FiSend, FiCheckCircle, FiClock, FiShield, FiFileText } from 'react-icons/fi';
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
      showToast('Lütfen tüm zorunlu başvuru alanlarını doldurun.', 'error');
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
    <Box minH="100vh" py={12} bg="gray.950">
      <Container maxW="container.md" px={6}>
        {/* Clean Header */}
        <VStack align="start" gap={2} mb={8}>
          <Badge colorPalette="cyan" variant="subtle" size="md" borderRadius="md" px={3} py={1}>
            <HStack gap={1.5}>
              <FiBriefcase size={12} />
              <Text>Satıcı & Depo Yöneticisi Başvurusu</Text>
            </HStack>
          </Badge>

          <Heading size="xl" color="white" fontWeight="bold">
            Satıcı & Depo Kayıt Formu
          </Heading>
          
          <Text color="gray.400" fontSize="sm">
            Kendi deponuzu platforma eklemek ve flash sale kampanyaları düzenlemek için başvuru bilgilerini doldurun.
          </Text>
        </VStack>

        {submittedApp ? (
          /* Clean Chakra UI Submitted Card */
          <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px" borderRadius="xl">
            <Card.Header p={6} pb={4}>
              <HStack justify="space-between" align="start">
                <HStack gap={3}>
                  <Box p={2.5} bg="cyan.500/10" borderRadius="lg" color="cyan.400">
                    <FiCheckCircle size={24} />
                  </Box>
                  <Box>
                    <Card.Title color="white" fontSize="lg" fontWeight="bold">
                      Başvurunuz İletildi
                    </Card.Title>
                    <Card.Description color="gray.400" fontSize="sm">
                      {submittedApp.status === 'approved' 
                        ? 'Tebrikler! Admin başvurunuzu onayladı. Satıcı yetkileriniz aktif.'
                        : 'Başvurunuz Admin istek kutusuna düştü. İncelemenin ardından yetkilendirileceksiniz.'}
                    </Card.Description>
                  </Box>
                </HStack>

                <Badge colorPalette={submittedApp.status === 'approved' ? 'emerald' : 'amber'} variant="subtle" size="md" borderRadius="md">
                  {submittedApp.status === 'approved' ? 'Onaylandı' : 'Bekliyor'}
                </Badge>
              </HStack>
            </Card.Header>

            <Card.Body p={6}>
              <VStack align="stretch" gap={3} bg="gray.950" p={4} borderRadius="lg" border="1px solid" borderColor="gray.800">
                <HStack justify="space-between">
                  <Text color="gray.400" fontSize="sm">e-Posta:</Text>
                  <Text color="white" fontWeight="600" fontSize="sm">{submittedApp.email}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.400" fontSize="sm">Depo / Mağaza Adı:</Text>
                  <Text color="cyan.300" fontWeight="600" fontSize="sm">{submittedApp.warehouseName}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.400" fontSize="sm">Şehir / Konum:</Text>
                  <Text color="white" fontWeight="600" fontSize="sm">{submittedApp.location}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.400" fontSize="sm">Vergi No / Sicil No:</Text>
                  <Text color="white" fontWeight="600" fontSize="sm">{submittedApp.taxId}</Text>
                </HStack>
                <HStack justify="space-between">
                  <Text color="gray.400" fontSize="sm">Başvuru Zamanı:</Text>
                  <Text color="gray.300" fontSize="xs">{submittedApp.date} {submittedApp.time}</Text>
                </HStack>
              </VStack>

              <HStack justify="start" gap={3} mt={6}>
                <Button colorPalette="purple" variant="subtle" size="md" borderRadius="lg" onClick={() => router.push('/')}>
                  Anasayfaya Dön
                </Button>
                {submittedApp.status === 'approved' && (
                  <Button colorPalette="emerald" size="md" borderRadius="lg" onClick={() => router.push('/admin')}>
                    <FiShield size={16} /> Satıcı Paneline Git
                  </Button>
                )}
              </HStack>
            </Card.Body>
          </Card.Root>
        ) : (
          /* Clean Chakra UI Form Card */
          <Card.Root bg="gray.900" borderColor="gray.800" borderWidth="1px" borderRadius="xl">
            <Card.Header p={6} pb={2}>
              <Card.Title color="white" fontSize="lg" fontWeight="bold">
                <HStack gap={2}>
                  <FiFileText color="#38bdf8" size={18} />
                  <Text>İşletme ve Depo Detayları</Text>
                </HStack>
              </Card.Title>
              <Card.Description color="gray.400" fontSize="sm">
                Admin onayının ardından hesabınıza depo ekleme yetkisi tanımlanacaktır.
              </Card.Description>
            </Card.Header>

            <Card.Body p={6}>
              <form onSubmit={handleSubmit}>
                <VStack align="stretch" gap={4}>
                  <Box>
                    <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">e-Posta Adresiniz *</Text>
                    <Input
                      placeholder="Örn: satici@firma.com"
                      type="email"
                      size="md"
                      borderRadius="lg"
                      bg="gray.950"
                      borderColor="gray.800"
                      color="white"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      required
                    />
                  </Box>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">Depo / İşletme Adı *</Text>
                      <Input
                        placeholder="Örn: Marmara Lojistik Deposu"
                        size="md"
                        borderRadius="lg"
                        bg="gray.950"
                        borderColor="gray.800"
                        color="white"
                        value={warehouseName}
                        onChange={e => setWarehouseName(e.target.value)}
                        required
                      />
                    </Box>
                    <Box>
                      <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">Şehir / Konum *</Text>
                      <Input
                        placeholder="Örn: İstanbul / Kadıköy"
                        size="md"
                        borderRadius="lg"
                        bg="gray.950"
                        borderColor="gray.800"
                        color="white"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                        required
                      />
                    </Box>
                  </SimpleGrid>

                  <SimpleGrid columns={{ base: 1, md: 2 }} gap={4}>
                    <Box>
                      <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">Vergi Kimlik No / Sicil No *</Text>
                      <Input
                        placeholder="Örn: 9876543210"
                        size="md"
                        borderRadius="lg"
                        bg="gray.950"
                        borderColor="gray.800"
                        color="white"
                        value={taxId}
                        onChange={e => setTaxId(e.target.value)}
                        required
                      />
                    </Box>
                    <Box>
                      <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">İletişim Telefon Numarası</Text>
                      <Input
                        placeholder="Örn: 0532 123 45 67"
                        size="md"
                        borderRadius="lg"
                        bg="gray.950"
                        borderColor="gray.800"
                        color="white"
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                      />
                    </Box>
                  </SimpleGrid>

                  <Box>
                    <Text color="gray.300" fontSize="xs" mb={1.5} fontWeight="600">Açıklama & Satılacak Ürün Kategorisi</Text>
                    <Input
                      placeholder="Örn: Elektronik, kulaklık ve teknolojik aksesuar stoğu."
                      size="md"
                      borderRadius="lg"
                      bg="gray.950"
                      borderColor="gray.800"
                      color="white"
                      value={reason}
                      onChange={e => setReason(e.target.value)}
                    />
                  </Box>

                  <Button
                    type="submit"
                    size="lg"
                    colorPalette="cyan"
                    borderRadius="lg"
                    fontWeight="bold"
                    mt={2}
                  >
                    <FiSend size={16} /> Başvuruyu Gönder
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
