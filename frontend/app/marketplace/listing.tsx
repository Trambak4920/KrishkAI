import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { apiCall } from '../../utils/api';

export default function ListingDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const [listing, setListing] = useState<any>(null);
  const [bids, setBids] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bidPrice, setBidPrice] = useState('');
  const [bidQty, setBidQty] = useState('');
  const [bidMsg, setBidMsg] = useState('');
  const [bidding, setBidding] = useState(false);
  const [accepting, setAccepting] = useState('');

  useEffect(() => { if (id) loadListing(); }, [id]);

  const loadListing = async () => {
    try {
      const res = await apiCall(`/market/listings/${id}`);
      setListing(res.listing);
      setBids(res.bids || []);
      setBidPrice(String(res.listing.price_per_kg));
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBid = async () => {
    if (!bidPrice || !bidQty) { Alert.alert('Error', 'Price and quantity required'); return; }
    setBidding(true);
    try {
      await apiCall('/market/bids', { method: 'POST', body: JSON.stringify({ listing_id: id, offered_price_per_kg: parseFloat(bidPrice), quantity_kg: parseFloat(bidQty), message: bidMsg }) });
      Alert.alert('Success', 'Bid placed!');
      setBidMsg('');
      setBidQty('');
      loadListing();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setBidding(false);
    }
  };

  const handleAcceptBid = async (bidId: string, method: string) => {
    setAccepting(bidId);
    try {
      const res = await apiCall('/market/accept-bid', { method: 'POST', body: JSON.stringify({ bid_id: bidId, payment_method: method }) });
      Alert.alert('Order Created', `Order ID: ${res.order.id.slice(0, 8)}`, [{ text: 'View Order', onPress: () => router.push(`/marketplace/order?id=${res.order.id}`) }]);
      loadListing();
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setAccepting('');
    }
  };

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color="#2E7D32" /></View></SafeAreaView>;
  if (!listing) return <SafeAreaView style={s.safe}><View style={s.center}><Text style={{ color: '#999' }}>Listing not found</Text></View></SafeAreaView>;

  const isSeller = listing.seller_id === user?.id;

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#1B5E20" /></TouchableOpacity>
            <Text style={s.headerTitle} numberOfLines={1}>{listing.crop_name}</Text>
            {listing.organic && <View style={s.organicTag}><Text style={s.organicText}>Organic</Text></View>}
          </View>

          {/* Listing Info */}
          <View style={s.infoCard}>
            <View style={s.infoRow}>
              <Ionicons name="person" size={18} color="#2E7D32" />
              <Text style={s.infoLabel}>Seller:</Text>
              <Text style={s.infoValue}>{listing.seller_name} ({listing.farm_name})</Text>
            </View>
            <View style={s.infoRow}>
              <Ionicons name="location" size={18} color="#E65100" />
              <Text style={s.infoLabel}>Location:</Text>
              <Text style={s.infoValue}>{listing.location || 'Not specified'}</Text>
            </View>
            {listing.description ? <Text style={s.desc}>{listing.description}</Text> : null}
            
            <View style={s.priceGrid}>
              <View style={s.priceItem}>
                <Text style={s.priceLabel}>Price/kg</Text>
                <Text style={s.priceVal}>₹{listing.price_per_kg}</Text>
              </View>
              <View style={s.priceItem}>
                <Text style={s.priceLabel}>Available</Text>
                <Text style={s.qtyVal}>{listing.available_kg} kg</Text>
              </View>
              <View style={s.priceItem}>
                <Text style={s.priceLabel}>Min Order</Text>
                <Text style={s.minVal}>{listing.min_order_kg} kg</Text>
              </View>
            </View>

            {isSeller && (
              <View style={s.sellerBadge}>
                <Ionicons name="checkmark-circle" size={18} color="#2E7D32" />
                <Text style={s.sellerBadgeText}>Your Listing</Text>
              </View>
            )}
          </View>

          {/* Place Bid (for buyers) */}
          {!isSeller && (
            <View style={s.bidSection}>
              <Text style={s.sectionTitle}>Place a Bid</Text>
              <View style={s.bidRow}>
                <View style={s.bidHalf}>
                  <Text style={s.bidLabel}>Price/kg (₹)</Text>
                  <TextInput testID="bid-price" style={s.bidInput} value={bidPrice} onChangeText={setBidPrice} keyboardType="numeric" placeholder="Price" placeholderTextColor="#aaa" />
                </View>
                <View style={s.bidHalf}>
                  <Text style={s.bidLabel}>Quantity (kg)</Text>
                  <TextInput testID="bid-qty" style={s.bidInput} value={bidQty} onChangeText={setBidQty} keyboardType="numeric" placeholder="Qty" placeholderTextColor="#aaa" />
                </View>
              </View>
              <TextInput testID="bid-message" style={s.bidMsgInput} value={bidMsg} onChangeText={setBidMsg} placeholder="Message to seller (optional)" placeholderTextColor="#aaa" multiline />
              {bidPrice && bidQty && (
                <Text style={s.bidTotal}>Total: ₹{(parseFloat(bidPrice || '0') * parseFloat(bidQty || '0')).toLocaleString()}</Text>
              )}
              <TouchableOpacity testID="place-bid-btn" style={s.bidBtn} onPress={handleBid} disabled={bidding}>
                {bidding ? <ActivityIndicator color="#fff" /> : <Text style={s.bidBtnText}>Place Bid</Text>}
              </TouchableOpacity>
            </View>
          )}

          {/* Bids List */}
          <Text style={s.sectionTitle}>Bids ({bids.length})</Text>
          {bids.length === 0 ? (
            <View style={s.noBids}><Text style={s.noBidsText}>No bids yet</Text></View>
          ) : (
            bids.map((bid) => (
              <View key={bid.id} style={s.bidCard}>
                <View style={s.bidCardHeader}>
                  <View>
                    <Text style={s.bidBuyerName}>{bid.buyer_name}</Text>
                    {bid.business_name ? <Text style={s.bidBiz}>{bid.business_name}</Text> : null}
                  </View>
                  <View style={[s.bidStatus, { backgroundColor: bid.status === 'accepted' ? '#E8F5E9' : bid.status === 'rejected' ? '#FFEBEE' : '#FFF8E1' }]}>
                    <Text style={[s.bidStatusText, { color: bid.status === 'accepted' ? '#2E7D32' : bid.status === 'rejected' ? '#D32F2F' : '#E65100' }]}>{bid.status}</Text>
                  </View>
                </View>
                <View style={s.bidDetails}>
                  <Text style={s.bidDetailText}>₹{bid.offered_price_per_kg}/kg × {bid.quantity_kg}kg = <Text style={{ fontWeight: '800', color: '#1B5E20' }}>₹{bid.total_amount.toLocaleString()}</Text></Text>
                </View>
                {bid.message ? <Text style={s.bidMessage}>"{bid.message}"</Text> : null}
                
                {isSeller && bid.status === 'pending' && (
                  <View style={s.acceptRow}>
                    <TouchableOpacity testID={`accept-online-${bid.id}`} style={s.acceptBtn} onPress={() => handleAcceptBid(bid.id, 'online')} disabled={!!accepting}>
                      {accepting === bid.id ? <ActivityIndicator size="small" color="#fff" /> : (
                        <><Ionicons name="card" size={16} color="#fff" /><Text style={s.acceptText}>Accept (Online Pay)</Text></>
                      )}
                    </TouchableOpacity>
                    <TouchableOpacity testID={`accept-direct-${bid.id}`} style={[s.acceptBtn, { backgroundColor: '#F9A825' }]} onPress={() => handleAcceptBid(bid.id, 'direct_contact')} disabled={!!accepting}>
                      <Ionicons name="call" size={16} color="#fff" /><Text style={s.acceptText}>Accept (Direct)</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            ))
          )}

          {/* Contact Seller */}
          {!isSeller && listing.seller_phone && (
            <View style={s.contactCard}>
              <Ionicons name="call" size={22} color="#2E7D32" />
              <View style={{ flex: 1, marginLeft: 12 }}>
                <Text style={s.contactTitle}>Contact Seller Directly</Text>
                <Text style={s.contactPhone}>{listing.seller_phone}</Text>
              </View>
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 16 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { flex: 1, fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  organicTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8 },
  organicText: { fontSize: 12, fontWeight: '700', color: '#2E7D32' },
  infoCard: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1, borderColor: '#E0E0E0' },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  infoLabel: { fontSize: 14, fontWeight: '600', color: '#888' },
  infoValue: { flex: 1, fontSize: 14, color: '#333' },
  desc: { fontSize: 14, color: '#666', lineHeight: 22, marginVertical: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#F0F0F0' },
  priceGrid: { flexDirection: 'row', gap: 10, marginTop: 12 },
  priceItem: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, alignItems: 'center' },
  priceLabel: { fontSize: 11, color: '#888' },
  priceVal: { fontSize: 18, fontWeight: '800', color: '#E65100', marginTop: 4 },
  qtyVal: { fontSize: 18, fontWeight: '700', color: '#2E7D32', marginTop: 4 },
  minVal: { fontSize: 18, fontWeight: '700', color: '#555', marginTop: 4 },
  sellerBadge: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 12, backgroundColor: '#E8F5E9', padding: 10, borderRadius: 10 },
  sellerBadgeText: { fontSize: 14, fontWeight: '600', color: '#2E7D32' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#1B5E20', marginBottom: 12, marginTop: 8 },
  bidSection: { backgroundColor: '#fff', borderRadius: 18, padding: 18, marginBottom: 16, borderWidth: 1.5, borderColor: '#C8E6C9' },
  bidRow: { flexDirection: 'row', gap: 12 },
  bidHalf: { flex: 1 },
  bidLabel: { fontSize: 13, fontWeight: '600', color: '#555', marginBottom: 4 },
  bidInput: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, fontSize: 16, color: '#333', borderWidth: 1, borderColor: '#E0E0E0' },
  bidMsgInput: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 12, fontSize: 15, color: '#333', borderWidth: 1, borderColor: '#E0E0E0', marginTop: 10, minHeight: 50 },
  bidTotal: { fontSize: 16, fontWeight: '700', color: '#1B5E20', marginTop: 10, textAlign: 'center' },
  bidBtn: { backgroundColor: '#2E7D32', borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 12 },
  bidBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  noBids: { backgroundColor: '#F5F5F5', borderRadius: 12, padding: 24, alignItems: 'center', marginBottom: 16 },
  noBidsText: { color: '#aaa', fontSize: 15 },
  bidCard: { backgroundColor: '#fff', borderRadius: 14, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: '#E8E8E8' },
  bidCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  bidBuyerName: { fontSize: 15, fontWeight: '700', color: '#333' },
  bidBiz: { fontSize: 12, color: '#888' },
  bidStatus: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  bidStatusText: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase' },
  bidDetails: { marginBottom: 6 },
  bidDetailText: { fontSize: 14, color: '#555' },
  bidMessage: { fontSize: 13, color: '#888', fontStyle: 'italic', marginTop: 4 },
  acceptRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  acceptBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, backgroundColor: '#2E7D32', borderRadius: 10, paddingVertical: 10 },
  acceptText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  contactCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E8F5E9', borderRadius: 14, padding: 16, marginTop: 12, borderWidth: 1, borderColor: '#C8E6C9' },
  contactTitle: { fontSize: 14, fontWeight: '600', color: '#333' },
  contactPhone: { fontSize: 16, fontWeight: '700', color: '#2E7D32', marginTop: 2 },
});
