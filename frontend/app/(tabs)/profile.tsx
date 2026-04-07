import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../../utils/AuthContext';
import { t, LANGUAGES } from '../../utils/translations';

export default function ProfileScreen() {
  const router = useRouter();
  const { user, language, setLanguage, logout } = useAuth();
  const [showLangPicker, setShowLangPicker] = useState(false);

  const handleLogout = () => {
    Alert.alert(t('logout', language), 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: t('logout', language), style: 'destructive', onPress: () => { logout(); router.replace('/login'); } },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Profile Header */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{(user?.name || 'F')[0].toUpperCase()}</Text>
          </View>
          <Text style={styles.name}>{user?.name || 'Farmer'}</Text>
          <Text style={styles.phone}>{user?.phone || ''}</Text>
          {user?.state ? <Text style={styles.location}>{user.district ? `${user.district}, ` : ''}{user.state}</Text> : null}
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <TouchableOpacity testID="profile-credit-btn" style={styles.menuItem} onPress={() => router.push('/credit')}>
          <View style={[styles.menuIcon, { backgroundColor: '#F3E5F5' }]}>
            <Ionicons name="card" size={22} color="#6A1B9A" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>{t('credit_score', language)}</Text>
            <Text style={styles.menuDesc}>{t('check_eligibility', language)}</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        {/* Language Selector */}
        <Text style={styles.sectionTitle}>{t('language', language)}</Text>
        <TouchableOpacity testID="profile-lang-toggle" style={styles.menuItem} onPress={() => setShowLangPicker(!showLangPicker)}>
          <View style={[styles.menuIcon, { backgroundColor: '#E3F2FD' }]}>
            <Ionicons name="globe" size={22} color="#1565C0" />
          </View>
          <View style={styles.menuContent}>
            <Text style={styles.menuLabel}>{t('language', language)}</Text>
            <Text style={styles.menuDesc}>{LANGUAGES.find((l) => l.code === language)?.native || 'English'}</Text>
          </View>
          <Ionicons name={showLangPicker ? 'chevron-up' : 'chevron-down'} size={20} color="#ccc" />
        </TouchableOpacity>

        {showLangPicker && (
          <View style={styles.langGrid}>
            {LANGUAGES.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                testID={`lang-${lang.code}`}
                style={[styles.langChip, language === lang.code && styles.langChipActive]}
                onPress={() => { setLanguage(lang.code); setShowLangPicker(false); }}
              >
                <Text style={[styles.langChipNative, language === lang.code && styles.langChipTextActive]}>{lang.native}</Text>
                <Text style={[styles.langChipLabel, language === lang.code && styles.langChipTextActive]}>{lang.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* About */}
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <View style={styles.aboutRow}>
            <Ionicons name="leaf" size={20} color="#2E7D32" />
            <Text style={styles.aboutTitle}>KrishkAI v1.0</Text>
          </View>
          <Text style={styles.aboutDesc}>AI-powered farming assistant for Indian farmers. Get crop recommendations, disease detection, and financial guidance.</Text>
        </View>

        {/* Logout */}
        <TouchableOpacity testID="profile-logout-btn" style={styles.logoutBtn} onPress={handleLogout}>
          <Ionicons name="log-out" size={22} color="#D32F2F" />
          <Text style={styles.logoutText}>{t('logout', language)}</Text>
        </TouchableOpacity>

        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  scroll: { padding: 20 },
  profileCard: { alignItems: 'center', backgroundColor: '#1B5E20', borderRadius: 24, padding: 30, marginBottom: 24 },
  avatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#F9A825', alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  avatarText: { fontSize: 32, fontWeight: '800', color: '#1B5E20' },
  name: { fontSize: 22, fontWeight: '800', color: '#fff' },
  phone: { fontSize: 15, color: '#C8E6C9', marginTop: 4 },
  location: { fontSize: 14, color: '#A5D6A7', marginTop: 4 },
  sectionTitle: { fontSize: 17, fontWeight: '700', color: '#1B5E20', marginTop: 20, marginBottom: 12 },
  menuItem: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 10 },
  menuIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 14 },
  menuContent: { flex: 1 },
  menuLabel: { fontSize: 16, fontWeight: '700', color: '#333' },
  menuDesc: { fontSize: 13, color: '#888', marginTop: 2 },
  langGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 4, marginBottom: 8 },
  langChip: { paddingHorizontal: 18, paddingVertical: 12, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E0E0', minWidth: '30%', alignItems: 'center' },
  langChipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  langChipNative: { fontSize: 16, fontWeight: '700', color: '#333' },
  langChipLabel: { fontSize: 12, color: '#888', marginTop: 2 },
  langChipTextActive: { color: '#fff' },
  aboutCard: { backgroundColor: '#fff', borderRadius: 16, padding: 18 },
  aboutRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  aboutTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20' },
  aboutDesc: { fontSize: 14, color: '#666', lineHeight: 22 },
  logoutBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, backgroundColor: '#FFEBEE', borderRadius: 16, paddingVertical: 16, marginTop: 24 },
  logoutText: { fontSize: 17, fontWeight: '700', color: '#D32F2F' },
});
