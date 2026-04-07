import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { t } from '../../utils/translations';

const FEATURES = [
  { key: 'crop', icon: 'leaf', color: '#2E7D32', bg: '#E8F5E9', route: '/(tabs)/crop' },
  { key: 'detect', icon: 'scan', color: '#E65100', bg: '#FFF3E0', route: '/(tabs)/detect' },
  { key: 'chat', icon: 'chatbubbles', color: '#1565C0', bg: '#E3F2FD', route: '/(tabs)/chat' },
  { key: 'market', icon: 'storefront', color: '#00695C', bg: '#E0F2F1', route: '/marketplace' },
  { key: 'credit', icon: 'card', color: '#6A1B9A', bg: '#F3E5F5', route: '/credit' },
];

const LABELS: Record<string, string> = {
  crop: 'crop_recommend',
  detect: 'disease_detect',
  chat: 'knowledge_hub',
  market: 'marketplace',
  credit: 'credit_score',
};

const TIPS = [
  { icon: 'water', text: 'Water crops early morning for best results', color: '#0288D1' },
  { icon: 'sunny', text: 'Check weather before applying pesticides', color: '#F9A825' },
  { icon: 'nutrition', text: 'Rotate crops every season for soil health', color: '#388E3C' },
];

export default function HomeScreen() {
  const router = useRouter();
  const { user, language } = useAuth();

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting}>{t('welcome', language)},</Text>
            <Text style={styles.userName}>{user?.name || 'Farmer'}</Text>
          </View>
          <View style={styles.headerBadge}>
            <Ionicons name="leaf" size={28} color="#fff" />
          </View>
        </View>

        {/* Banner */}
        <View style={styles.banner}>
          <View style={styles.bannerContent}>
            <Text style={styles.bannerTitle}>KrishkAI</Text>
            <Text style={styles.bannerText}>Your AI-powered farming companion for smarter agriculture</Text>
          </View>
          <Ionicons name="sparkles" size={48} color="#F9A825" />
        </View>

        {/* Feature Grid */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.grid}>
          {FEATURES.map((f) => (
            <TouchableOpacity
              key={f.key}
              testID={`home-feature-${f.key}`}
              style={[styles.featureCard, { backgroundColor: f.bg }]}
              onPress={() => router.push(f.route as any)}
              activeOpacity={0.7}
            >
              <View style={[styles.featureIcon, { backgroundColor: f.color }]}>
                <Ionicons name={f.icon as any} size={28} color="#fff" />
              </View>
              <Text style={[styles.featureLabel, { color: f.color }]}>{t(LABELS[f.key], language)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Tips */}
        <Text style={styles.sectionTitle}>Farming Tips</Text>
        {TIPS.map((tip, i) => (
          <View key={i} style={styles.tipCard}>
            <View style={[styles.tipIcon, { backgroundColor: tip.color + '20' }]}>
              <Ionicons name={tip.icon as any} size={22} color={tip.color} />
            </View>
            <Text style={styles.tipText}>{tip.text}</Text>
          </View>
        ))}

        {/* Offline Knowledge */}
        <TouchableOpacity
          testID="home-offline-knowledge"
          style={styles.offlineCard}
          onPress={() => router.push('/(tabs)/chat')}
          activeOpacity={0.8}
        >
          <Ionicons name="cloud-offline" size={28} color="#2E7D32" />
          <View style={styles.offlineText}>
            <Text style={styles.offlineTitle}>{t('offline_data', language)}</Text>
            <Text style={styles.offlineDesc}>Access farming knowledge anytime</Text>
          </View>
          <Ionicons name="chevron-forward" size={22} color="#999" />
        </TouchableOpacity>

        <View style={{ height: 20 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingTop: 12, paddingBottom: 8 },
  headerLeft: { flex: 1 },
  greeting: { fontSize: 15, color: '#666' },
  userName: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  headerBadge: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  banner: { margin: 20, marginTop: 12, backgroundColor: '#1B5E20', borderRadius: 20, padding: 24, flexDirection: 'row', alignItems: 'center' },
  bannerContent: { flex: 1, marginRight: 16 },
  bannerTitle: { fontSize: 26, fontWeight: '800', color: '#F9A825', marginBottom: 6 },
  bannerText: { fontSize: 14, color: '#C8E6C9', lineHeight: 20 },
  sectionTitle: { fontSize: 20, fontWeight: '700', color: '#1B5E20', marginHorizontal: 20, marginTop: 20, marginBottom: 12 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 14, gap: 12 },
  featureCard: { width: '47%', borderRadius: 20, padding: 20, alignItems: 'center', marginHorizontal: '1.5%' },
  featureIcon: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  featureLabel: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  tipCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginBottom: 10, backgroundColor: '#fff', borderRadius: 14, padding: 14 },
  tipIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  tipText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 20 },
  offlineCard: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 20, marginTop: 16, backgroundColor: '#E8F5E9', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#C8E6C9' },
  offlineText: { flex: 1, marginLeft: 14 },
  offlineTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  offlineDesc: { fontSize: 13, color: '#666', marginTop: 2 },
});
