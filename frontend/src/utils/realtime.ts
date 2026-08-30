// Real-time stock & event synchronizer for FlashDepo

type StockChangeEvent = {
  campaignId?: string;
  productId?: string;
  newStock?: number;
  delta?: number;
  type: 'STOCK_UPDATE' | 'ORDER_PLACED' | 'PRODUCT_ADDED';
};

const CHANNEL_NAME = 'flashdepo_realtime_sync';

let broadcastChannel: BroadcastChannel | null = null;
if (typeof window !== 'undefined' && 'BroadcastChannel' in window) {
  try {
    broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
  } catch (e) {
    console.error('BroadcastChannel initialization error:', e);
  }
}

export const broadcastRealtimeEvent = (event: StockChangeEvent) => {
  if (broadcastChannel) {
    try {
      broadcastChannel.postMessage(event);
    } catch (e) {
      console.error('Broadcast message failed:', e);
    }
  }
};

export const subscribeRealtimeEvents = (callback: (event: StockChangeEvent) => void) => {
  if (!broadcastChannel && typeof window !== 'undefined' && 'BroadcastChannel' in window) {
    try {
      broadcastChannel = new BroadcastChannel(CHANNEL_NAME);
    } catch (e) {}
  }

  if (broadcastChannel) {
    const handleMessage = (msgEvent: MessageEvent) => {
      if (msgEvent.data) {
        callback(msgEvent.data as StockChangeEvent);
      }
    };
    broadcastChannel.addEventListener('message', handleMessage);
    return () => {
      broadcastChannel?.removeEventListener('message', handleMessage);
    };
  }
  return () => {};
};
