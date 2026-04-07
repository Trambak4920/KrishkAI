import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '../../utils/api';

export default function CreateListing() {
  const router = useRouter();
  const [cropName, setCropName] = useState('');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');
  const [minOrder, setMinOrder] = useState('1');
  const [location, setLocation] = useState('');
  const [harvestDate, setHarvestDate] = useState('');
  const [organic, setOrganic] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleCreate = async () => {
    if (!cropName || !quantity || !price) { Alert.alert('Missing Info', 'Crop name, quantity and price are required'); return; }
    setLoading(true);
    try {
      await apiCall('/market/listings', { method: 'POST', body: JSON.stringify({ crop_name: cropName, description, quantity_kg: parseFloat(quantity), price_per_kg: parseFloat(price), min_order_kg: parseFloat(minOrder || '1'), location, harvest_date: harvestDate, organic }) });
      Alert.alert('Success', 'Listing created!', [{ text: 'OK', onPress: () => router.back() }]);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={s.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.headerRow}>
            <TouchableOpacity onPress={() => router.back()} style={s.backBtn}><Ionicons name="arrow-back" size={24} color="#1B5E20" /></TouchableOpacity>
            <Text style={s.headerTitle}>List Your Produce</Text>
          </View>

          <View style={s.form}>
            <FInput label="Crop Name *" value={cropName} onChangeText={setCropName} placeholder="e.g. Basmati Rice" testID="create-crop" icon="leaf" />
            <FInput label="Description" value={description} onChangeText={setDescription} placeholder="Quality, variety, grade..." testID="create-desc" icon="document-text" multiline />
            <View style={s.row}>
              <View style={s.half}><FInput label="Quantity (kg) *" value={quantity} onChangeText={setQuantity} placeholder="e.g. 500" numeric testID="create-qty" icon="cube" /></View>
              <View style={s.half}><FInput label="Price/kg (₹) *" value={price} onChangeText={setPrice} placeholder="e.g. 45" numeric testID="create-price" icon="cash" /></View>
            </View>
            <View style={s.row}>
              <View style={s.half}><FInput label="Min Order (kg)" value={minOrder} onChangeText={setMinOrder} placeholder="1" numeric testID="create-min" icon="remove-circle" /></View>
              <View style={s.half}><FInput label="Harvest Date" value={harvestDate} onChangeText={setHarvestDate} placeholder="2025-03" testID="create-harvest" icon="calendar" /></View>
            </View>
            <FInput label="Location" value={location} onChangeText={setLocation} placeholder="Village, District" testID="create-location" icon="location" />
            
            <View style={s.switchRow}>
              <Ionicons name="leaf" size={22} color="#2E7D32" />
              <Text style={s.switchLabel}>Organic Produce</Text>
              <Switch testID="create-organic-switch" value={organic} onValueChange={setOrganic} trackColor={{ true: '#2E7D32', false: '#ccc' }} />
            </View>

            {/* Price Summary */}
            {quantity && price && (
              <View style={s.summary}>
                <Text style={s.summaryTitle}>Listing Summary</Text>
                <View style={s.summaryRow}><Text style={s.summaryLabel}>Total Value:</Text><Text style={s.summaryValue}>₹{(parseFloat(quantity) * parseFloat(price)).toLocaleString()}</Text></View>
                <View style={s.summaryRow}><Text style={s.summaryLabel}>Platform Fee (5%):</Text><Text style={s.summaryFee}>₹{(parseFloat(quantity) * parseFloat(price) * 0.05).toLocaleString()}</Text></View>
                <View style={s.summaryRow}><Text style={s.summaryLabel}>You Receive:</Text><Text style={s.summaryReceive}>₹{(parseFloat(quantity) * parseFloat(price) * 0.95).toLocaleString()}</Text></View>
                <Text style={s.freeNote}>First 2 months: 0% commission!</Text>
              </View>
            )}
          </View>

          <TouchableOpacity testID="create-submit-btn" style={s.submitBtn} onPress={handleCreate} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={s.btnInner}><Ionicons name="add-circle" size={22} color="#fff" /><Text style={s.submitText}>Create Listing</Text></View>
            )}
          </TouchableOpacity>
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FInput({ label, value, onChangeText, placeholder, numeric, testID, icon, multiline }: any) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <Ionicons name={icon} size={20} color="#888" style={s.inputIcon} />
        <TextInput testID={testID} style={[s.input, multiline && { minHeight: 60 }]} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#aaa" keyboardType={numeric ? 'numeric' : 'default'} multiline={multiline} />
      </View>
    </View>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 12, padding: 4 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  form: { gap: 4 },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  switchRow: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#E8F5E9', borderRadius: 14, padding: 16, marginBottom: 12 },
  switchLabel: { flex: 1, fontSize: 16, fontWeight: '600', color: '#333' },
  summary: { backgroundColor: '#fff', borderRadius: 16, padding: 18, borderWidth: 1.5, borderColor: '#C8E6C9', marginBottom: 8 },
  summaryTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20', marginBottom: 12 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  summaryLabel: { fontSize: 14, color: '#666' },
  summaryValue: { fontSize: 16, fontWeight: '700', color: '#333' },
  summaryFee: { fontSize: 15, fontWeight: '600', color: '#E65100' },
  summaryReceive: { fontSize: 17, fontWeight: '800', color: '#2E7D32' },
  freeNote: { fontSize: 13, color: '#2E7D32', fontWeight: '600', textAlign: 'center', marginTop: 8, backgroundColor: '#E8F5E9', padding: 8, borderRadius: 8 },
  submitBtn: { backgroundColor: '#2E7D32', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 12 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
