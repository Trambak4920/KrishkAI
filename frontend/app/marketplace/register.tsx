import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { apiCall } from '../../utils/api';

export default function MarketRegister() {
  const router = useRouter();
  const [role, setRole] = useState<'seller' | 'buyer'>('seller');
  const [loading, setLoading] = useState(false);
  const [terms, setTerms] = useState<any>(null);
  const [acceptTerms, setAcceptTerms] = useState(false);
  
  // Seller fields
  const [farmName, setFarmName] = useState('');
  const [farmAddress, setFarmAddress] = useState('');
  const [farmSize, setFarmSize] = useState('');
  const [cropsGrown, setCropsGrown] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [ifsc, setIfsc] = useState('');
  
  // Buyer fields
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [address, setAddress] = useState('');

  useEffect(() => {
    apiCall('/market/terms').then(r => setTerms(r.terms)).catch(() => {});
  }, []);

  const handleRegister = async () => {
    if (!acceptTerms) { Alert.alert('Terms Required', 'Please accept the terms and conditions'); return; }
    setLoading(true);
    try {
      if (role === 'seller') {
        if (!farmName) { Alert.alert('Error', 'Farm name is required'); setLoading(false); return; }
        await apiCall('/market/register-seller', { method: 'POST', body: JSON.stringify({ farm_name: farmName, farm_address: farmAddress, farm_size_acres: parseFloat(farmSize || '0'), crops_grown: cropsGrown, bank_account: bankAccount, ifsc_code: ifsc, accept_terms: true }) });
        Alert.alert('Success', 'Registered as seller! You can now list produce.', [{ text: 'OK', onPress: () => router.back() }]);
      } else {
        if (!businessName) { Alert.alert('Error', 'Business/Buyer name is required'); setLoading(false); return; }
        await apiCall('/market/register-buyer', { method: 'POST', body: JSON.stringify({ business_name: businessName, business_type: businessType, address, accept_terms: true }) });
        Alert.alert('Success', 'Registered as buyer! You can now bid on produce.', [{ text: 'OK', onPress: () => router.back() }]);
      }
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
            <Text style={s.headerTitle}>Marketplace Registration</Text>
          </View>

          {/* Role Toggle */}
          <View style={s.roleToggle}>
            <TouchableOpacity testID="role-seller-btn" style={[s.roleBtn, role === 'seller' && s.roleBtnActive]} onPress={() => setRole('seller')}>
              <Ionicons name="storefront" size={20} color={role === 'seller' ? '#fff' : '#666'} />
              <Text style={[s.roleText, role === 'seller' && s.roleTextActive]}>Seller</Text>
            </TouchableOpacity>
            <TouchableOpacity testID="role-buyer-btn" style={[s.roleBtn, role === 'buyer' && s.roleBtnActive]} onPress={() => setRole('buyer')}>
              <Ionicons name="cart" size={20} color={role === 'buyer' ? '#fff' : '#666'} />
              <Text style={[s.roleText, role === 'buyer' && s.roleTextActive]}>Buyer</Text>
            </TouchableOpacity>
          </View>

          {role === 'seller' ? (
            <View style={s.form}>
              <FormInput label="Farm Name *" value={farmName} onChangeText={setFarmName} placeholder="Your farm name" testID="reg-farm-name" icon="leaf" />
              <FormInput label="Farm Address" value={farmAddress} onChangeText={setFarmAddress} placeholder="Village, District, State" testID="reg-farm-addr" icon="location" />
              <FormInput label="Farm Size (Acres)" value={farmSize} onChangeText={setFarmSize} placeholder="e.g. 5" numeric testID="reg-farm-size" icon="resize" />
              <FormInput label="Crops Grown" value={cropsGrown} onChangeText={setCropsGrown} placeholder="Rice, Wheat, Cotton..." testID="reg-crops" icon="nutrition" />
              <FormInput label="Bank Account" value={bankAccount} onChangeText={setBankAccount} placeholder="Account number (for payouts)" testID="reg-bank" icon="card" />
              <FormInput label="IFSC Code" value={ifsc} onChangeText={setIfsc} placeholder="e.g. SBIN0001234" testID="reg-ifsc" icon="document-text" />
            </View>
          ) : (
            <View style={s.form}>
              <FormInput label="Business/Buyer Name *" value={businessName} onChangeText={setBusinessName} placeholder="Your business name" testID="reg-biz-name" icon="business" />
              <FormInput label="Business Type" value={businessType} onChangeText={setBusinessType} placeholder="Retailer, Wholesaler, Consumer..." testID="reg-biz-type" icon="briefcase" />
              <FormInput label="Address" value={address} onChangeText={setAddress} placeholder="Your address" testID="reg-biz-addr" icon="location" />
            </View>
          )}

          {/* Terms */}
          {terms && (
            <View style={s.termsCard}>
              <Text style={s.termsTitle}>{terms.title}</Text>
              {terms.sections.map((sec: any, i: number) => (
                <View key={i} style={s.termsSection}>
                  <Text style={s.termsHeading}>{sec.heading}</Text>
                  <Text style={s.termsContent}>{sec.content}</Text>
                </View>
              ))}
            </View>
          )}

          <View style={s.acceptRow}>
            <Switch testID="accept-terms-switch" value={acceptTerms} onValueChange={setAcceptTerms} trackColor={{ true: '#2E7D32', false: '#ccc' }} />
            <Text style={s.acceptText}>I accept the Terms & Conditions and agree to the commission structure</Text>
          </View>

          <TouchableOpacity testID="register-market-submit" style={[s.submitBtn, !acceptTerms && { opacity: 0.5 }]} onPress={handleRegister} disabled={loading || !acceptTerms}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Register as {role === 'seller' ? 'Seller' : 'Buyer'}</Text>}
          </TouchableOpacity>
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function FormInput({ label, value, onChangeText, placeholder, numeric, testID, icon }: any) {
  return (
    <View style={s.inputGroup}>
      <Text style={s.label}>{label}</Text>
      <View style={s.inputRow}>
        <Ionicons name={icon} size={20} color="#888" style={s.inputIcon} />
        <TextInput testID={testID} style={s.input} value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor="#aaa" keyboardType={numeric ? 'numeric' : 'default'} />
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
  roleToggle: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, borderRadius: 14, backgroundColor: '#fff', borderWidth: 1.5, borderColor: '#E0E0E0' },
  roleBtnActive: { backgroundColor: '#2E7D32', borderColor: '#2E7D32' },
  roleText: { fontSize: 16, fontWeight: '700', color: '#666' },
  roleTextActive: { color: '#fff' },
  form: { gap: 4 },
  inputGroup: { marginBottom: 12 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  inputRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fff', borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0', paddingHorizontal: 14 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: '#333' },
  termsCard: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginTop: 16, marginBottom: 12, borderWidth: 1, borderColor: '#E0E0E0' },
  termsTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20', marginBottom: 12 },
  termsSection: { marginBottom: 10 },
  termsHeading: { fontSize: 14, fontWeight: '700', color: '#333', marginBottom: 4 },
  termsContent: { fontSize: 13, color: '#666', lineHeight: 20 },
  acceptRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 16, paddingRight: 32 },
  acceptText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 20 },
  submitBtn: { backgroundColor: '#2E7D32', borderRadius: 16, paddingVertical: 18, alignItems: 'center' },
  submitText: { color: '#fff', fontSize: 17, fontWeight: '700' },
});
