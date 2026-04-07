import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { TouchableOpacity } from 'react-native';
import { apiCall } from '../../utils/api';

export default function PaymentScreen() {
  const router = useRouter();
  const { session_id, order_id } = useLocalSearchParams<{ session_id: string; order_id: string }>();
  const [status, setStatus] = useState<'checking' | 'paid' | 'failed'>('checking');
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (session_id) pollStatus();
  }, [session_id]);

  const pollStatus = async () => {
    if (attempts >= 5) { setStatus('failed'); return; }
    try {
      const res = await apiCall(`/market/checkout/status/${session_id}`);
      if (res.status === 'paid') {
        setStatus('paid');
      } else {
        setAttempts((a) => a + 1);
        setTimeout(pollStatus, 2000);
      }
    } catch {
      setAttempts((a) => a + 1);
      setTimeout(pollStatus, 2000);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.center}>
        {status === 'checking' && (
          <>
            <ActivityIndicator size="large" color="#2E7D32" />
            <Text style={s.title}>Processing Payment...</Text>
            <Text style={s.sub}>Please wait while we confirm your payment</Text>
          </>
        )}
        {status === 'paid' && (
          <>
            <View style={s.successCircle}>
              <Ionicons name="checkmark-circle" size={72} color="#2E7D32" />
            </View>
            <Text style={s.successTitle}>Payment Successful!</Text>
            <Text style={s.sub}>Your order has been confirmed</Text>
            <TouchableOpacity testID="view-order-btn" style={s.btn} onPress={() => router.replace(`/marketplace/order?id=${order_id}`)}>
              <Text style={s.btnText}>View Order</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="back-market-btn" style={s.btnOutline} onPress={() => router.replace('/marketplace')}>
              <Text style={s.btnOutlineText}>Back to Marketplace</Text>
            </TouchableOpacity>
          </>
        )}
        {status === 'failed' && (
          <>
            <View style={s.failCircle}>
              <Ionicons name="close-circle" size={72} color="#D32F2F" />
            </View>
            <Text style={s.failTitle}>Payment Status Unknown</Text>
            <Text style={s.sub}>Please check your order for the latest status</Text>
            <TouchableOpacity testID="check-order-btn" style={s.btn} onPress={() => router.replace(`/marketplace/order?id=${order_id}`)}>
              <Text style={s.btnText}>Check Order</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  title: { fontSize: 20, fontWeight: '700', color: '#333', marginTop: 24 },
  sub: { fontSize: 15, color: '#888', marginTop: 8, textAlign: 'center' },
  successCircle: { marginBottom: 8 },
  successTitle: { fontSize: 24, fontWeight: '800', color: '#2E7D32', marginTop: 8 },
  failCircle: { marginBottom: 8 },
  failTitle: { fontSize: 22, fontWeight: '800', color: '#D32F2F', marginTop: 8 },
  btn: { backgroundColor: '#2E7D32', borderRadius: 16, paddingVertical: 16, paddingHorizontal: 40, marginTop: 24 },
  btnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  btnOutline: { borderWidth: 2, borderColor: '#2E7D32', borderRadius: 16, paddingVertical: 14, paddingHorizontal: 40, marginTop: 12 },
  btnOutlineText: { color: '#2E7D32', fontSize: 16, fontWeight: '700' },
});
