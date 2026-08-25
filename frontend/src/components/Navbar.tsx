'use client';

import { Box, Flex, Heading, Button, HStack, Text, Badge } from '@chakra-ui/react';
import Link from 'next/link';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store/store';
import { logout, initializeAuth } from '@/store/slices/authSlice';
import { clearCart } from '@/store/slices/cartSlice';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FiShoppingBag, FiUser, FiLogOut, FiShield, FiBriefcase, FiZap } from 'react-icons/fi';

export default function Navbar() {
  const dispatch = useDispatch();
  const router = useRouter();
  const { token, user } = useSelector((state: RootState) => state.auth);
  const cartItems = useSelector((state: RootState) => state.cart.items);
  const totalCartItems = cartItems.reduce((sum, item) => sum + item.quantity, 0);

  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    const savedUserStr = localStorage.getItem('user');
    if (savedToken && savedUserStr) {
      try {
        const savedUser = JSON.parse(savedUserStr);
        dispatch(initializeAuth({ token: savedToken, user: savedUser }));
      } catch (e) {
        console.error('Failed to parse user from localStorage');
      }
    }
  }, [dispatch]);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    dispatch(logout());
    dispatch(clearCart());
    router.push('/auth/login');
  };

  return (
    <Box
      position="sticky"
      top={0}
      zIndex={100}
      style={{
        background: 'rgba(15, 12, 41, 0.8)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      {/* Flash sale ticker bar */}
      <Box
        overflow="hidden"
        style={{
          background: 'linear-gradient(90deg, #7c3aed, #ec4899, #f97316, #ec4899, #7c3aed)',
          backgroundSize: '200% auto',
          animation: 'shimmer 3s linear infinite',
          padding: '5px 0',
        }}
      >
        <Text
          fontSize="xs"
          fontWeight="bold"
          color="white"
          textAlign="center"
          letterSpacing="wider"
          textTransform="uppercase"
        >
          ⚡ Anlık Flash Sale — Fırsatları Kaçırma! ⚡ Anlık Flash Sale — Fırsatları Kaçırma! ⚡
        </Text>
      </Box>

      <Flex
        h={16}
        alignItems="center"
        justifyContent="space-between"
        maxW="container.xl"
        mx="auto"
        px={6}
      >
        {/* Logo */}
        <Link href="/" style={{ textDecoration: 'none' }}>
          <HStack gap={2} cursor="pointer">
            <Box
              style={{
                background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                borderRadius: '10px',
                padding: '6px 10px',
                boxShadow: '0 4px 15px rgba(124,58,237,0.5)',
              }}
            >
              <Text fontSize="lg" fontWeight="black" color="white">⚡</Text>
            </Box>
            <Heading
              size="lg"
              style={{
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontWeight: '900',
              }}
            >
              FlashDepo
            </Heading>
          </HStack>
        </Link>

        {/* Nav links */}
        <HStack gap={8} display={{ base: 'none', md: 'flex' }}>
          <Link href="/">
            <Text color="whiteAlpha.700" fontWeight="500" fontSize="sm" _hover={{ color: 'white' }}
              style={{ transition: 'color 0.2s' }}>
              Kampanyalar
            </Text>
          </Link>
          {token && (
            <Link href="/orders">
              <Text color="whiteAlpha.700" fontWeight="500" fontSize="sm" _hover={{ color: 'white' }}
                style={{ transition: 'color 0.2s' }}>
                Siparişlerim
              </Text>
            </Link>
          )}
          {token && user?.role === 'admin' && (
            <Link href="/admin">
              <Text color="fuchsia.400" fontWeight="600" fontSize="sm" _hover={{ color: 'fuchsia.300' }}
                style={{ transition: 'color 0.2s' }}>
                Admin Paneli
              </Text>
            </Link>
          )}
        </HStack>

        <HStack gap={5}>
          {/* Cart Icon */}
          <Link href="/cart">
            <Box
              position="relative"
              cursor="pointer"
              p={2.5}
              borderRadius="14px"
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: '1px solid rgba(255,255,255,0.12)',
                transition: 'all 0.2s ease',
              }}
              _hover={{ bg: 'rgba(255,255,255,0.12)' }}
            >
              <FiShoppingBag size={22} color="#ffffff" />
              {totalCartItems > 0 && (
                <Box
                  position="absolute"
                  top="-6px"
                  right="-6px"
                  style={{
                    background: '#ef4444',
                    color: '#ffffff',
                    borderRadius: '999px',
                    fontSize: '12px',
                    fontWeight: '900',
                    minWidth: '22px',
                    height: '22px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '2px solid #ffffff',
                    boxShadow: '0 4px 12px rgba(239,68,68,0.8)',
                    padding: '0 5px',
                    lineHeight: 1,
                    zIndex: 10,
                  }}
                >
                  {totalCartItems}
                </Box>
              )}
            </Box>
          </Link>

          {/* Auth section */}
          {token && user ? (
            <HStack gap={3}>
              <Link href="/profile" style={{ textDecoration: 'none' }}>
                <HStack
                  gap={2}
                  cursor="pointer"
                  p="4px 10px 4px 4px"
                  borderRadius="999px"
                  bg="rgba(255,255,255,0.05)"
                  border="1px solid rgba(255,255,255,0.1)"
                  _hover={{ bg: 'rgba(255,255,255,0.1)' }}
                  style={{ transition: 'all 0.2s' }}
                >
                  <Box
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      color: 'white',
                    }}
                  >
                    {user.email.charAt(0).toUpperCase()}
                  </Box>
                  <Text color="white" fontSize="sm" fontWeight="600">
                    {user.email.split('@')[0]}
                  </Text>
                  <Badge
                    colorPalette={user.role === 'admin' ? 'pink' : user.role === 'warehouse_manager' ? 'cyan' : 'emerald'}
                    variant="subtle"
                    size="sm"
                    borderRadius="full"
                    px={2.5}
                    py={0.5}
                  >
                    <HStack gap={1}>
                      {user.role === 'admin' ? <FiShield size={11} /> : user.role === 'warehouse_manager' ? <FiBriefcase size={11} /> : <FiUser size={11} />}
                      <Text>{user.role === 'admin' ? 'Admin' : user.role === 'warehouse_manager' ? 'Depo Yön.' : 'Müşteri'}</Text>
                    </HStack>
                  </Badge>
                </HStack>
              </Link>
              <Button
                size="sm"
                onClick={handleLogout}
                style={{
                  background: 'rgba(239,68,68,0.15)',
                  border: '1px solid rgba(239,68,68,0.4)',
                  color: '#f87171',
                  borderRadius: '10px',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                }}
              >
                <FiLogOut size={14} />
              </Button>
            </HStack>
          ) : (
            <HStack gap={2}>
              <Link href="/auth/login">
                <Button
                  size="sm"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: '600',
                    transition: 'all 0.2s',
                  }}
                >
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button
                  size="sm"
                  style={{
                    background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
                    border: 'none',
                    color: 'white',
                    borderRadius: '10px',
                    fontWeight: '700',
                    boxShadow: '0 4px 15px rgba(124,58,237,0.4)',
                    transition: 'all 0.2s',
                  }}
                >
                  Kayıt Ol
                </Button>
              </Link>
            </HStack>
          )}
        </HStack>
      </Flex>
    </Box>
  );
}
