import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/AuthContext';
import { apiCall } from '../../utils/api';
import { t } from '../../utils/translations';

const TERRAIN_TYPES = ['Plains', 'Hills', 'Plateau', 'Coastal', 'Desert', 'River Basin'];
const SOIL_TYPES = ['Alluvial', 'Black/Regur', 'Red', 'Laterite', 'Sandy', 'Clay', 'Loamy'];

export default function CropScreen() {
  const { language } = useAuth();
  const [terrain, setTerrain] = useState('');
  const [soil, setSoil] = useState('');
  const [temp, setTemp] = useState('');
  const [humidity, setHumidity] = useState('');
  const [rainfall, setRainfall] = useState('');
  const [fertilizer, setFertilizer] = useState('');
  const [problems, setProblems] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!terrain || !soil || !temp || !humidity || !rainfall) {
      Alert.alert('Missing Info', 'Please fill terrain, soil, temperature, humidity and rainfall');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await apiCall('/crop/recommend', {
        method: 'POST',
        body: JSON.stringify({
          terrain_type: terrain, soil_type: soil,
          temperature: parseFloat(temp), humidity: parseFloat(humidity),
          rainfall: parseFloat(rainfall), fertilizer_used: fertilizer,
          problems, language,
        }),
      });
      setResult(res.data || { raw: res.raw });
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={[styles.hIcon, { backgroundColor: '#E8F5E9' }]}>
              <Ionicons name="leaf" size={24} color="#2E7D32" />
            </View>
            <Text style={styles.headerTitle}>{t('crop_recommend', language)}</Text>
          </View>

          {/* Terrain Picker */}
          <Text style={styles.label}>{t('terrain', language)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {TERRAIN_TYPES.map((tt) => (
              <TouchableOpacity key={tt} testID={`terrain-${tt}`} onPress={() => setTerrain(tt)}
                style={[styles.chip, terrain === tt && styles.chipActive]}>
                <Text style={[styles.chipText, terrain === tt && styles.chipTextActive]}>{tt}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Soil Picker */}
          <Text style={styles.label}>{t('soil', language)}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
            {SOIL_TYPES.map((s) => (
              <TouchableOpacity key={s} testID={`soil-${s}`} onPress={() => setSoil(s)}
                style={[styles.chip, soil === s && styles.chipActive]}>
                <Text style={[styles.chipText, soil === s && styles.chipTextActive]}>{s}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Number Inputs */}
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t('temperature', language)}</Text>
              <TextInput testID="crop-temp-input" style={styles.input} keyboardType="numeric" value={temp} onChangeText={setTemp} placeholder="e.g. 28" placeholderTextColor="#aaa" />
            </View>
            <View style={styles.halfInput}>
              <Text style={styles.label}>{t('humidity', language)}</Text>
              <TextInput testID="crop-humidity-input" style={styles.input} keyboardType="numeric" value={humidity} onChangeText={setHumidity} placeholder="e.g. 65" placeholderTextColor="#aaa" />
            </View>
          </View>

          <Text style={styles.label}>{t('rainfall', language)}</Text>
          <TextInput testID="crop-rainfall-input" style={styles.input} keyboardType="numeric" value={rainfall} onChangeText={setRainfall} placeholder="e.g. 120" placeholderTextColor="#aaa" />

          <Text style={styles.label}>{t('fertilizer', language)}</Text>
          <TextInput testID="crop-fertilizer-input" style={styles.input} value={fertilizer} onChangeText={setFertilizer} placeholder="e.g. Urea, DAP" placeholderTextColor="#aaa" />

          <Text style={styles.label}>{t('problems', language)}</Text>
          <TextInput testID="crop-problems-input" style={[styles.input, { minHeight: 70 }]} value={problems} onChangeText={setProblems} placeholder="Any issues?" placeholderTextColor="#aaa" multiline />

          <TouchableOpacity testID="crop-submit-btn" style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={styles.btnInner}>
                <Ionicons name="sparkles" size={20} color="#fff" />
                <Text style={styles.buttonText}>{t('get_recommendation', language)}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Results */}
          {result && (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>AI Recommendation</Text>
              {result.best_crop && (
                <View style={styles.bestCrop}>
                  <Ionicons name="trophy" size={22} color="#F9A825" />
                  <Text style={styles.bestCropText}>Best: {result.best_crop}</Text>
                </View>
              )}
              {result.recommended_crops && (
                <View style={styles.resultSection}>
                  <Text style={styles.resultLabel}>Recommended Crops:</Text>
                  <View style={styles.cropChips}>
                    {result.recommended_crops.map((c: string, i: number) => (
                      <View key={i} style={styles.cropChip}><Text style={styles.cropChipText}>{c}</Text></View>
                    ))}
                  </View>
                </View>
              )}
              {result.reasoning && <ResultItem label="Reasoning" value={result.reasoning} />}
              {result.soil_tips && <ResultItem label="Soil Tips" value={result.soil_tips} />}
              {result.water_management && <ResultItem label="Water Management" value={result.water_management} />}
              {result.fertilizer_advice && <ResultItem label="Fertilizer Advice" value={result.fertilizer_advice} />}
              {result.expected_yield && <ResultItem label="Expected Yield" value={result.expected_yield} />}
              {result.season_info && <ResultItem label="Season" value={result.season_info} />}
              {result.warnings && <ResultItem label="Warnings" value={result.warnings} icon="warning" color="#D32F2F" />}
              {result.raw && !result.best_crop && <Text style={styles.rawText}>{result.raw}</Text>}
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ResultItem({ label, value, icon, color }: { label: string; value: string; icon?: string; color?: string }) {
  return (
    <View style={styles.resultSection}>
      <View style={styles.resultLabelRow}>
        {icon && <Ionicons name={icon as any} size={16} color={color || '#2E7D32'} />}
        <Text style={[styles.resultLabel, color ? { color } : {}]}>{label}</Text>
      </View>
      <Text style={styles.resultValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  hIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  label: { fontSize: 15, fontWeight: '600', color: '#333', marginBottom: 8, marginTop: 14 },
  chipScroll: { marginBottom: 4 },
  chip: { paddingHorizontal: 18, paddingVertical: 10, borderRadius: 25, backgroundColor: '#fff', marginRight: 10, borderWidth: 1.5, borderColor: '#E0E0E0' },
  chipActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  chipText: { fontSize: 14, color: '#555', fontWeight: '600' },
  chipTextActive: { color: '#fff' },
  row: { flexDirection: 'row', gap: 12 },
  halfInput: { flex: 1 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 16, color: '#333', borderWidth: 1.5, borderColor: '#E0E0E0' },
  button: { backgroundColor: '#2E7D32', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 20 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resultCard: { marginTop: 24, backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#C8E6C9' },
  resultTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20', marginBottom: 16 },
  bestCrop: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFF8E1', padding: 14, borderRadius: 12, marginBottom: 16 },
  bestCropText: { fontSize: 18, fontWeight: '700', color: '#E65100' },
  resultSection: { marginBottom: 14 },
  resultLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  resultLabel: { fontSize: 14, fontWeight: '700', color: '#2E7D32', marginBottom: 4 },
  resultValue: { fontSize: 14, color: '#555', lineHeight: 22 },
  cropChips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  cropChip: { backgroundColor: '#E8F5E9', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  cropChipText: { fontSize: 14, color: '#2E7D32', fontWeight: '600' },
  rawText: { fontSize: 14, color: '#555', lineHeight: 22 },
});
