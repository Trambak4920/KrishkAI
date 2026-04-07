import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, Image, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuth } from '../../utils/AuthContext';
import { apiCall } from '../../utils/api';
import { t } from '../../utils/translations';

export default function DetectScreen() {
  const { language } = useAuth();
  const [image, setImage] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const pickImage = async (useCamera: boolean) => {
    const permResult = useCamera
      ? await ImagePicker.requestCameraPermissionsAsync()
      : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permResult.granted) {
      Alert.alert('Permission needed', 'Please allow access to continue');
      return;
    }
    const pickerResult = useCamera
      ? await ImagePicker.launchCameraAsync({ base64: true, quality: 0.7 })
      : await ImagePicker.launchImageLibraryAsync({ base64: true, quality: 0.7, mediaTypes: ['images'] });
    if (!pickerResult.canceled && pickerResult.assets[0]) {
      setImage(pickerResult.assets[0].base64 || null);
      setResult(null);
    }
  };

  const handleAnalyze = async () => {
    if (!image) { Alert.alert('No Image', 'Please select or take a photo first'); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await apiCall('/disease/detect', {
        method: 'POST',
        body: JSON.stringify({ image_base64: image, description, language }),
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={[styles.hIcon, { backgroundColor: '#FFF3E0' }]}>
            <Ionicons name="scan" size={24} color="#E65100" />
          </View>
          <Text style={styles.headerTitle}>{t('disease_detect', language)}</Text>
        </View>

        {/* Image Preview */}
        <View style={styles.imageBox}>
          {image ? (
            <Image source={{ uri: `data:image/jpeg;base64,${image}` }} style={styles.preview} resizeMode="cover" />
          ) : (
            <View style={styles.placeholder}>
              <Ionicons name="camera-outline" size={56} color="#aaa" />
              <Text style={styles.placeholderText}>Upload or capture crop image</Text>
            </View>
          )}
        </View>

        {/* Camera/Gallery Buttons */}
        <View style={styles.btnRow}>
          <TouchableOpacity testID="detect-camera-btn" style={styles.pickBtn} onPress={() => pickImage(true)}>
            <Ionicons name="camera" size={22} color="#fff" />
            <Text style={styles.pickBtnText}>{t('take_photo', language)}</Text>
          </TouchableOpacity>
          <TouchableOpacity testID="detect-gallery-btn" style={[styles.pickBtn, { backgroundColor: '#F9A825' }]} onPress={() => pickImage(false)}>
            <Ionicons name="images" size={22} color="#fff" />
            <Text style={styles.pickBtnText}>{t('gallery', language)}</Text>
          </TouchableOpacity>
        </View>

        {/* Optional Description */}
        <TextInput
          testID="detect-description-input"
          style={styles.input}
          placeholder="Describe symptoms (optional)"
          placeholderTextColor="#aaa"
          value={description}
          onChangeText={setDescription}
          multiline
        />

        {/* Analyze Button */}
        <TouchableOpacity testID="detect-analyze-btn" style={styles.analyzeBtn} onPress={handleAnalyze} disabled={loading || !image}>
          {loading ? <ActivityIndicator color="#fff" /> : (
            <View style={styles.btnInner}>
              <Ionicons name="sparkles" size={20} color="#fff" />
              <Text style={styles.analyzeBtnText}>{loading ? t('analyzing', language) : t('scan_crop', language)}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Results */}
        {result && (
          <View style={styles.resultCard}>
            <View style={[styles.statusBadge, { backgroundColor: result.is_healthy ? '#E8F5E9' : '#FFEBEE' }]}>
              <Ionicons name={result.is_healthy ? 'checkmark-circle' : 'alert-circle'} size={24} color={result.is_healthy ? '#388E3C' : '#D32F2F'} />
              <Text style={[styles.statusText, { color: result.is_healthy ? '#388E3C' : '#D32F2F' }]}>
                {result.is_healthy ? 'Healthy Crop' : result.disease_name || 'Disease Detected'}
              </Text>
            </View>
            {result.confidence && <Badge label="Confidence" value={result.confidence} />}
            {result.severity && <Badge label="Severity" value={result.severity} />}
            {result.urgency && <Badge label="Urgency" value={result.urgency} />}
            {result.symptoms && <InfoBlock label="Symptoms" value={result.symptoms} icon="eye-outline" />}
            {result.cause && <InfoBlock label="Cause" value={result.cause} icon="help-circle-outline" />}
            {result.treatment && <InfoBlock label="Treatment" value={result.treatment} icon="medkit-outline" />}
            {result.organic_remedy && <InfoBlock label="Organic Remedy" value={result.organic_remedy} icon="leaf-outline" />}
            {result.prevention && <InfoBlock label="Prevention" value={result.prevention} icon="shield-checkmark-outline" />}
            {result.raw && !result.disease_name && <Text style={styles.rawText}>{result.raw}</Text>}
          </View>
        )}
        <View style={{ height: 30 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

function Badge({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.badge}>
      <Text style={styles.badgeLabel}>{label}:</Text>
      <Text style={styles.badgeValue}>{value}</Text>
    </View>
  );
}

function InfoBlock({ label, value, icon }: { label: string; value: string; icon: string }) {
  return (
    <View style={styles.infoBlock}>
      <View style={styles.infoHeader}>
        <Ionicons name={icon as any} size={18} color="#2E7D32" />
        <Text style={styles.infoLabel}>{label}</Text>
      </View>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  hIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 24, fontWeight: '800', color: '#1B5E20' },
  imageBox: { borderRadius: 20, overflow: 'hidden', backgroundColor: '#fff', borderWidth: 2, borderColor: '#E0E0E0', borderStyle: 'dashed', minHeight: 220 },
  preview: { width: '100%', height: 250, borderRadius: 18 },
  placeholder: { height: 220, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { marginTop: 12, fontSize: 15, color: '#999' },
  btnRow: { flexDirection: 'row', gap: 12, marginTop: 16 },
  pickBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: '#2E7D32', borderRadius: 14, paddingVertical: 14 },
  pickBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 16, color: '#333', borderWidth: 1.5, borderColor: '#E0E0E0', marginTop: 14, minHeight: 60 },
  analyzeBtn: { backgroundColor: '#E65100', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 16 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  analyzeBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resultCard: { marginTop: 24, backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#E0E0E0' },
  statusBadge: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 14, marginBottom: 16 },
  statusText: { fontSize: 18, fontWeight: '700' },
  badge: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  badgeLabel: { fontSize: 14, fontWeight: '600', color: '#666' },
  badgeValue: { fontSize: 14, fontWeight: '700', color: '#333' },
  infoBlock: { marginTop: 14, backgroundColor: '#F9FBF2', borderRadius: 12, padding: 14 },
  infoHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 6 },
  infoLabel: { fontSize: 14, fontWeight: '700', color: '#2E7D32' },
  infoValue: { fontSize: 14, color: '#555', lineHeight: 22 },
  rawText: { fontSize: 14, color: '#555', lineHeight: 22, marginTop: 10 },
});
