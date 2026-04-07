import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { apiCall } from '../../utils/api';

const BACKEND_URL = process.env.EXPO_PUBLIC_BACKEND_URL;

export default function OrderDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [paying, setPaying] = useState(false);

  useEffect(() => { if (id) loadOrder(); }, [id]);

  const loadOrder = async () => {
    try {
      const res = await apiCall(`/market/orders/${id}`);
      setOrder(res.order);
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setLoading(false); }
  };

  const updateStatus = async (status: string) => {
    setUpdating(true);
    try {
      await apiCall(`/market/orders/${id}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
      Alert.alert('Updated', `Order status: ${status.replace(/_/g, ' ')}`);
      loadOrder();
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setUpdating(false); }
  };

  const handlePayment = async () => {
    setPaying(true);
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : BACKEND_URL;
      const res = await apiCall('/market/checkout', { method: 'POST', body: JSON.stringify({ order_id: id, origin_url: origin }) });
      if (res.checkout_url) {
        if (typeof window !== 'undefined') {
          window.location.href = res.checkout_url;
        } else {
          await Linking.openURL(res.checkout_url);
        }
      }
    } catch (err: any) { Alert.alert('Error', err.message); }
    finally { setPaying(false); }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color="#2E7D32" /></View></SafeAreaView>;
  if (!order) return <SafeAreaView style={s.safe}><View style={s.center}><Text style={{ color: '#999' }}>Order not found</Text></View></SafeAreaView>;

  const isSeller = order.seller_id === user?.id;
  const isBuyer = order.buyer_id === user?.id;
  const canPay = (order.status === 'pending_payment' && isBuyer && order.payment_method === 'online') ||
                 (order.status === 'pending_seller_fee' && isSeller && order.payment_method === 'direct_contact');

  const nextStatuses: Record<string, string[]> = {
    confirmed: ['shipped'],
    shipped: ['in_transit', 'delivered'],
    in_transit: ['delivered'],
  };

  return (
    <SafeAreaView style={s.safe}>
      <ScrollView contentContainerStyle={s.scroll}>
        <View style={s.headerRow}>
          <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#1B5E20" /></TouchableOpacity>
          <Text style={s.headerTitle}>Order Details</Text>
        </View>

        {/* Order Summary */}
        <View style={s.summaryCard}>
          <Text style={s.orderId}>Order #{order.id.slice(0, 8)}</Text>
          <View style={s.cropRow}>
            <Ionicons name="leaf" size={24} color="#2E7D32" />
            <Text style={s.cropName}>{order.crop_name}</Text>
          </View>
          <View style={s.detailGrid}>
            <DetailItem label="Quantity" value={`${order.quantity_kg} kg`} />
            <DetailItem label="Price/kg" value={`₹${order.price_per_kg}`} />
            <DetailItem label="Total" value={`₹${order.total_amount.toLocaleString()}`} highlight />
            <DetailItem label="Platform Fee" value={`₹${order.platform_fee.toLocaleString()}`} warn />
          </View>
          
          <View style={s.partyRow}>
            <View style={s.party}>
              <Text style={s.partyLabel}>Seller</Text>
              <Text style={s.partyName}>{order.seller_name}</Text>
              <Text style={s.partyPhone}>{order.seller_phone}</Text>
            </View>
            <Ionicons name="swap-horizontal" size={24} color="#ccc" />
            <View style={s.party}>
              <Text style={s.partyLabel}>Buyer</Text>
              <Text style={s.partyName}>{order.buyer_name}</Text>
              <Text style={s.partyPhone}>{order.buyer_phone}</Text>
            </View>
          </View>

          {/* Payment Method */}
          <View style={[s.methodBadge, { backgroundColor: order.payment_method === 'online' ? '#E3F2FD' : '#FFF8E1' }]}>
            <Ionicons name={order.payment_method === 'online' ? 'card' : 'call'} size={20} color={order.payment_method === 'online' ? '#1565C0' : '#E65100'} />
            <Text style={[s.methodText, { color: order.payment_method === 'online' ? '#1565C0' : '#E65100' }]}>
              {order.payment_method === 'online' ? 'Online Payment' : 'Direct Contact'}
            </Text>
          </View>

          {/* Commission */}
          <View style={s.commissionCard}>
            <Text style={s.commLabel}>Seller Receives: <Text style={s.commGreen}>₹{order.seller_receives.toLocaleString()}</Text></Text>
            {order.commission_details?.is_free_period && <Text style={s.freeBadge}>FREE PERIOD - No fees!</Text>}
          </View>
        </View>

        {/* Terms Agreement */}
        <View style={s.termsCard}>
          <Ionicons name="document-text" size={18} color="#666" />
          <Text style={s.termsText}>{order.terms_agreement}</Text>
        </View>

        {/* Payment Button */}
        {canPay && (
          <TouchableOpacity testID="pay-order-btn" style={s.payBtn} onPress={handlePayment} disabled={paying}>
            {paying ? <ActivityIndicator color="#fff" /> : (
              <View style={s.payInner}>
                <Ionicons name="card" size={22} color="#fff" />
                <Text style={s.payText}>
                  {isBuyer ? `Pay ₹${order.total_amount.toLocaleString()}` : `Pay Commission ₹${order.platform_fee.toLocaleString()}`}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        )}

        {/* Seller: Update Status */}
        {isSeller && nextStatuses[order.status] && (
          <View style={s.actionSection}>
            <Text style={s.actionTitle}>Update Order Status</Text>
            <View style={s.actionRow}>
              {nextStatuses[order.status].map((st) => (
                <TouchableOpacity key={st} testID={`update-${st}`} style={s.actionBtn} onPress={() => updateStatus(st)} disabled={updating}>
                  <Text style={s.actionBtnText}>{st.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Order Tracking */}
        <Text style={s.trackingTitle}>Order Tracking</Text>
        {(order.tracking || []).map((t: any, i: number) => (
          <View key={i} style={s.trackingItem}>
            <View style={s.trackingDot} />
            {i < (order.tracking.length - 1) && <View style={s.trackingLine} />}
            <View style={s.trackingContent}>
              <Text style={s.trackingStatus}>{t.status}</Text>
              <Text style={s.trackingNote}>{t.note}</Text>
              <Text style={s.trackingTime}>{new Date(t.timestamp).toLocaleString()}</Text>
            </View>
          </View>
        ))}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function DetailItem({ label, value, highlight, warn }: { label: string; value: string; highlight?: boolean; warn?: boolean }) {
  return (
    <View style={s.detailItem}>
      <Text style={s.detailLabel}>{label}</Text>
      <Text style={[s.detailValue, highlight && { color: '#1B5E20', fontWeight: '800' }, warn && { color: '#E65100' }]}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  summaryCard: { backgroundColor: '#fff', borderRadius: 20, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  orderId: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 8 },
  cropRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 16 },
  cropName: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  detailGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  detailItem: { width: '48%', backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12 },
  detailLabel: { fontSize: 12, color: '#888' },
  detailValue: { fontSize: 16, fontWeight: '700', color: '#333', marginTop: 4 },
  partyRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  party: { flex: 1, alignItems: 'center' },
  partyLabel: { fontSize: 12, color: '#888' },
  partyName: { fontSize: 15, fontWeight: '700', color: '#333', marginTop: 2 },
  partyPhone: { fontSize: 13, color: '#2E7D32', marginTop: 2 },
  methodBadge: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 12, marginBottom: 12 },
  methodText: { fontSize: 15, fontWeight: '600' },
  commissionCard: { backgroundColor: '#E8F5E9', borderRadius: 12, padding: 12 },
  commLabel: { fontSize: 14, color: '#555' },
  commGreen: { fontWeight: '800', color: '#2E7D32', fontSize: 16 },
  freeBadge: { fontSize: 13, fontWeight: '700', color: '#2E7D32', marginTop: 4 },
  termsCard: { flexDirection: 'row', gap: 8, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 14, marginBottom: 16 },
  termsText: { flex: 1, fontSize: 13, color: '#666', lineHeight: 20 },
  payBtn: { backgroundColor: '#1565C0', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginBottom: 16 },
  payInner: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  payText: { color: '#fff', fontSize: 18, fontWeight: '700' },
  actionSection: { marginBottom: 16 },
  actionTitle: { fontSize: 16, fontWeight: '700', color: '#333', marginBottom: 10 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, backgroundColor: '#2E7D32', borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  actionBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  trackingTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20', marginBottom: 16 },
  trackingItem: { flexDirection: 'row', marginBottom: 0, minHeight: 60 },
  trackingDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: '#2E7D32', marginTop: 4, marginRight: 14, zIndex: 1 },
  trackingLine: { position: 'absolute', left: 6, top: 18, width: 2, height: '100%', backgroundColor: '#C8E6C9' },
  trackingContent: { flex: 1, paddingBottom: 16 },
  trackingStatus: { fontSize: 15, fontWeight: '700', color: '#333' },
  trackingNote: { fontSize: 13, color: '#888', marginTop: 2 },
  trackingTime: { fontSize: 12, color: '#aaa', marginTop: 4 },
});
