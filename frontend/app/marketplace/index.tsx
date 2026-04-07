import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, FlatList, TextInput, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { apiCall } from '../../utils/api';

type MarketProfile = { seller: any; buyer: any };
type Listing = { id: string; crop_name: string; seller_name: string; price_per_kg: number; quantity_kg: number; available_kg: number; location: string; organic: boolean; bid_count: number; created_at: string };

export default function MarketplaceIndex() {
  const router = useRouter();
  const { language } = useAuth();
  const [tab, setTab] = useState<'browse' | 'sell' | 'orders'>('browse');
  const [profile, setProfile] = useState<MarketProfile | null>(null);
  const [listings, setListings] = useState<Listing[]>([]);
  const [myListings, setMyListings] = useState<Listing[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [profileRes, listingsRes] = await Promise.all([
        apiCall('/market/profile').catch(() => null),
        apiCall(`/market/listings?search=${search}`),
      ]);
      if (profileRes) setProfile(profileRes);
      setListings(listingsRes.listings || []);
      if (profileRes?.seller) {
        const myRes = await apiCall('/market/my-listings');
        setMyListings(myRes.listings || []);
      }
    } catch (err) {
      console.log('Load error', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [search]);

  useEffect(() => { loadData(); }, [loadData]);

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const renderListing = ({ item }: { item: Listing }) => (
    <TouchableOpacity testID={`listing-${item.id}`} style={s.listingCard} onPress={() => router.push(`/marketplace/listing?id=${item.id}`)} activeOpacity={0.7}>
      <View style={s.listingHeader}>
        <View style={[s.cropBadge, item.organic ? { backgroundColor: '#E8F5E9' } : {}]}>
          <Ionicons name={item.organic ? 'leaf' : 'nutrition'} size={20} color={item.organic ? '#2E7D32' : '#E65100'} />
        </View>
        <View style={s.listingInfo}>
          <Text style={s.cropName}>{item.crop_name}</Text>
          <Text style={s.sellerName}>{item.seller_name} • {item.location}</Text>
        </View>
        {item.organic && <View style={s.organicTag}><Text style={s.organicText}>Organic</Text></View>}
      </View>
      <View style={s.listingFooter}>
        <View style={s.priceBox}>
          <Text style={s.priceLabel}>Price</Text>
          <Text style={s.priceValue}>₹{item.price_per_kg}/kg</Text>
        </View>
        <View style={s.qtyBox}>
          <Text style={s.priceLabel}>Available</Text>
          <Text style={s.qtyValue}>{item.available_kg} kg</Text>
        </View>
        <View style={s.bidBox}>
          <Ionicons name="chatbox" size={16} color="#1565C0" />
          <Text style={s.bidText}>{item.bid_count} bids</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (loading) return <SafeAreaView style={s.safe}><View style={s.center}><ActivityIndicator size="large" color="#2E7D32" /></View></SafeAreaView>;

  return (
    <SafeAreaView style={s.safe}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#1B5E20" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Marketplace</Text>
        {profile?.seller && (
          <TouchableOpacity testID="create-listing-btn" style={s.addBtn} onPress={() => router.push('/marketplace/create')}>
            <Ionicons name="add" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* Registration Prompt */}
      {(!profile?.seller || !profile?.buyer) && (
        <TouchableOpacity testID="register-marketplace-btn" style={s.regBanner} onPress={() => router.push('/marketplace/register')}>
          <Ionicons name="storefront" size={24} color="#1565C0" />
          <View style={s.regBannerText}>
            <Text style={s.regTitle}>Join the Marketplace</Text>
            <Text style={s.regDesc}>
              {!profile?.seller && !profile?.buyer ? 'Register as buyer or seller' : !profile?.seller ? 'Also register as seller' : 'Also register as buyer'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#999" />
        </TouchableOpacity>
      )}

      {/* Tabs */}
      <View style={s.tabs}>
        {(['browse', 'sell', 'orders'] as const).map((t) => (
          <TouchableOpacity key={t} testID={`market-tab-${t}`} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>
              {t === 'browse' ? 'Browse' : t === 'sell' ? 'My Listings' : 'Orders'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Browse Tab */}
      {tab === 'browse' && (
        <>
          <View style={s.searchRow}>
            <Ionicons name="search" size={20} color="#888" style={s.searchIcon} />
            <TextInput testID="market-search" style={s.searchInput} placeholder="Search crops, location..." placeholderTextColor="#aaa" value={search} onChangeText={setSearch} onSubmitEditing={loadData} returnKeyType="search" />
          </View>
          <FlatList data={listings} renderItem={renderListing} keyExtractor={(i) => i.id} contentContainerStyle={s.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
            ListEmptyComponent={<View style={s.empty}><Ionicons name="leaf-outline" size={48} color="#ccc" /><Text style={s.emptyText}>No listings found</Text></View>}
          />
        </>
      )}

      {/* Sell Tab */}
      {tab === 'sell' && (
        <FlatList data={myListings} renderItem={renderListing} keyExtractor={(i) => i.id} contentContainerStyle={s.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#2E7D32']} />}
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="storefront-outline" size={48} color="#ccc" />
              <Text style={s.emptyText}>{profile?.seller ? 'No listings yet' : 'Register as seller first'}</Text>
              {profile?.seller && <TouchableOpacity style={s.emptyBtn} onPress={() => router.push('/marketplace/create')}><Text style={s.emptyBtnText}>Create Listing</Text></TouchableOpacity>}
            </View>
          }
        />
      )}

      {/* Orders Tab */}
      {tab === 'orders' && (
        <View style={s.center}>
          <TouchableOpacity testID="view-orders-btn" style={s.orderBtn} onPress={() => router.push('/marketplace/orders')}>
            <Ionicons name="receipt" size={24} color="#fff" />
            <Text style={s.orderBtnText}>View All Orders</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { flex: 1, fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  addBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  regBanner: { flexDirection: 'row', alignItems: 'center', margin: 16, marginTop: 0, backgroundColor: '#E3F2FD', borderRadius: 14, padding: 16, borderWidth: 1, borderColor: '#BBDEFB' },
  regBannerText: { flex: 1, marginLeft: 12 },
  regTitle: { fontSize: 16, fontWeight: '700', color: '#1565C0' },
  regDesc: { fontSize: 13, color: '#666', marginTop: 2 },
  tabs: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 12, padding: 4 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  tabActive: { backgroundColor: '#2E7D32' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#666' },
  tabTextActive: { color: '#fff' },
  searchRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginBottom: 12, backgroundColor: '#fff', borderRadius: 14, paddingHorizontal: 14, borderWidth: 1, borderColor: '#E0E0E0' },
  searchIcon: { marginRight: 8 },
  searchInput: { flex: 1, paddingVertical: 12, fontSize: 16, color: '#333' },
  listContent: { paddingHorizontal: 16, paddingBottom: 20 },
  listingCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E8E8E8' },
  listingHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  cropBadge: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#FFF3E0', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  listingInfo: { flex: 1 },
  cropName: { fontSize: 17, fontWeight: '700', color: '#333' },
  sellerName: { fontSize: 13, color: '#888', marginTop: 2 },
  organicTag: { backgroundColor: '#E8F5E9', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  organicText: { fontSize: 11, fontWeight: '700', color: '#2E7D32' },
  listingFooter: { flexDirection: 'row', gap: 10 },
  priceBox: { flex: 1, backgroundColor: '#FFF8E1', borderRadius: 10, padding: 10, alignItems: 'center' },
  priceLabel: { fontSize: 11, color: '#888' },
  priceValue: { fontSize: 16, fontWeight: '800', color: '#E65100', marginTop: 2 },
  qtyBox: { flex: 1, backgroundColor: '#E8F5E9', borderRadius: 10, padding: 10, alignItems: 'center' },
  qtyValue: { fontSize: 16, fontWeight: '700', color: '#2E7D32', marginTop: 2 },
  bidBox: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: '#E3F2FD', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10 },
  bidText: { fontSize: 13, fontWeight: '600', color: '#1565C0' },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  emptyText: { fontSize: 16, color: '#aaa', marginTop: 12 },
  emptyBtn: { backgroundColor: '#2E7D32', borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12, marginTop: 16 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  orderBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#2E7D32', borderRadius: 16, paddingHorizontal: 32, paddingVertical: 16 },
  orderBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
