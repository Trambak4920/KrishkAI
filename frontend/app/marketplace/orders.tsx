import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '../../utils/api';

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  pending_payment: { bg: '#FFF8E1', text: '#E65100' },
  pending_seller_fee: { bg: '#FFF8E1', text: '#E65100' },
  confirmed: { bg: '#E3F2FD', text: '#1565C0' },
  shipped: { bg: '#F3E5F5', text: '#6A1B9A' },
  in_transit: { bg: '#E8F5E9', text: '#2E7D32' },
  delivered: { bg: '#E8F5E9', text: '#388E3C' },
  cancelled: { bg: '#FFEBEE', text: '#D32F2F' },
};

export default function OrdersList() {
  const router = useRouter();
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'all' | 'buyer' | 'seller'>('all');

  const loadOrders = async () => {
    try {
      const res = await apiCall(`/market/orders?role=${filter}`);
      setOrders(res.orders || []);
    } catch (err) {
      console.log(err);
    } finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { loadOrders(); }, [filter]);

  const renderOrder = ({ item }: { item: any }) => {
    const sc = STATUS_COLORS[item.status] || { bg: '#F5F5F5', text: '#666' };
    return (
      <TouchableOpacity testID={`order-${item.id}`} style={s.card} onPress={() => router.push(`/marketplace/order?id=${item.id}`)} activeOpacity={0.7}>
        <View style={s.cardTop}>
          <View style={s.cropInfo}>
            <Ionicons name="leaf" size={20} color="#2E7D32" />
            <Text style={s.cropName}>{item.crop_name}</Text>
          </View>
          <View style={[s.statusBadge, { backgroundColor: sc.bg }]}>
            <Text style={[s.statusText, { color: sc.text }]}>{item.status.replace(/_/g, ' ')}</Text>
          </View>
        </View>
        <View style={s.cardMid}>
          <Text style={s.orderDetail}>{item.quantity_kg}kg × ₹{item.price_per_kg}/kg</Text>
          <Text style={s.orderTotal}>₹{item.total_amount.toLocaleString()}</Text>
        </View>
        <View style={s.cardBottom}>
          <Text style={s.roleText}>
            {item.payment_method === 'online' ? '💳 Online' : '📞 Direct'} • 
            Fee: ₹{item.platform_fee.toLocaleString()}
          </Text>
          <Text style={s.dateText}>{new Date(item.created_at).toLocaleDateString()}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color="#2E7D32" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#1B5E20" /></TouchableOpacity>
        <Text style={s.headerTitle}>My Orders</Text>
      </View>

      <View style={s.filters}>
        {(['all', 'buyer', 'seller'] as const).map((f) => (
          <TouchableOpacity key={f} testID={`filter-${f}`} style={[s.filterBtn, filter === f && s.filterActive]} onPress={() => { setFilter(f); setLoading(true); }}>
            <Text style={[s.filterText, filter === f && s.filterActiveText]}>{f === 'all' ? 'All' : f === 'buyer' ? 'As Buyer' : 'As Seller'}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList data={orders} renderItem={renderOrder} keyExtractor={(i) => i.id}
        contentContainerStyle={s.list}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadOrders(); }} colors={['#2E7D32']} />}
        ListEmptyComponent={<View style={s.empty}><Ionicons name="receipt-outline" size={48} color="#ccc" /><Text style={s.emptyText}>No orders yet</Text></View>}
      />
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  filters: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, gap: 8 },
  filterBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, backgroundColor: '#fff', alignItems: 'center', borderWidth: 1, borderColor: '#E0E0E0' },
  filterActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#666' },
  filterActiveText: { color: '#fff' },
  list: { paddingHorizontal: 16, paddingBottom: 20 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E8E8E8' },
  cardTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  cropInfo: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  cropName: { fontSize: 17, fontWeight: '700', color: '#333' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  statusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  cardMid: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  orderDetail: { fontSize: 14, color: '#666' },
  orderTotal: { fontSize: 18, fontWeight: '800', color: '#1B5E20' },
  cardBottom: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F0F0F0', paddingTop: 8 },
  roleText: { fontSize: 13, color: '#888' },
  dateText: { fontSize: 13, color: '#aaa' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12 },
});
