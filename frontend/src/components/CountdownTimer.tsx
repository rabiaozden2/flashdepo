'use client';

import { useEffect, useState } from 'react';
import { Box, HStack, Text } from '@chakra-ui/react';

interface CountdownTimerProps {
  endTime: string;
  mode?: 'start' | 'end';
}

interface TimeLeft {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

function calculateTimeLeft(endTime: string): TimeLeft {
  const diff = new Date(endTime).getTime() - Date.now();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  return {
    days: Math.floor(diff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((diff / 1000 / 60) % 60),
    seconds: Math.floor((diff / 1000) % 60),
    expired: false,
  };
}

const TimeBlock = ({ value, label }: { value: number; label: string }) => (
  <Box textAlign="center">
    <Box
      style={{
        background: 'rgba(0,0,0,0.4)',
        border: '1px solid rgba(249,115,22,0.4)',
        borderRadius: '8px',
        padding: '4px 8px',
        minWidth: '36px',
        fontVariantNumeric: 'tabular-nums',
        fontWeight: '800',
        fontSize: '15px',
        color: '#fb923c',
        letterSpacing: '1px',
      }}
    >
      {String(value).padStart(2, '0')}
    </Box>
    <Text fontSize="9px" color="rgba(249,115,22,0.6)" fontWeight="600" mt="2px" textTransform="uppercase">
      {label}
    </Text>
  </Box>
);

export default function CountdownTimer({ endTime, mode = 'end' }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState<TimeLeft>(calculateTimeLeft(endTime));

  useEffect(() => {
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft(endTime));
    }, 1000);
    return () => clearInterval(interval);
  }, [endTime]);

  if (timeLeft.expired) {
    return (
      <Box
        style={{
          background: 'rgba(239,68,68,0.15)',
          border: '1px solid rgba(239,68,68,0.3)',
          borderRadius: '10px',
          padding: '6px 12px',
          textAlign: 'center',
        }}
      >
        <Text fontSize="12px" color="red.400" fontWeight="700">
          {mode === 'end' ? '🏁 Kampanya Sona Erdi' : '🚀 Kampanya Başladı!'}
        </Text>
      </Box>
    );
  }

  return (
    <Box>
      <Text fontSize="10px" color="rgba(249,115,22,0.7)" fontWeight="600" mb={1} textTransform="uppercase" letterSpacing="wider">
        {mode === 'end' ? '⏱ Bitiş Süresi' : '⏱ Başlama Süresi'}
      </Text>
      <HStack gap={1}>
        {timeLeft.days > 0 && <TimeBlock value={timeLeft.days} label="Gün" />}
        <TimeBlock value={timeLeft.hours} label="Saat" />
        <Text color="rgba(249,115,22,0.5)" fontWeight="800" fontSize="14px" mb={3}>:</Text>
        <TimeBlock value={timeLeft.minutes} label="Dak" />
        <Text color="rgba(249,115,22,0.5)" fontWeight="800" fontSize="14px" mb={3}>:</Text>
        <TimeBlock value={timeLeft.seconds} label="Sn" />
      </HStack>
    </Box>
  );
}
