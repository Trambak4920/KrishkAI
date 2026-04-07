import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuth } from '../utils/AuthContext';
import { apiCall } from '../utils/api';
import { t } from '../utils/translations';

export default function CreditScreen() {
  const router = useRouter();
  const { language } = useAuth();
  const [income, setIncome] = useState('');
  const [land, setLand] = useState('');
  const [experience, setExperience] = useState('');
  const [prevLoans, setPrevLoans] = useState('');
  const [repaid, setRepaid] = useState('');
  const [cropType, setCropType] = useState('');
  const [investment, setInvestment] = useState('');
  const [savings, setSavings] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleSubmit = async () => {
    if (!income || !land || !experience) {
      Alert.alert('Missing Info', 'Please fill income, land area, and experience');
      return;
    }
    setLoading(true);
    setResult(null);
    try {
      const res = await apiCall('/credit/assess', {
        method: 'POST',
        body: JSON.stringify({
          annual_income: parseFloat(income),
          land_area_acres: parseFloat(land),
          farming_experience_years: parseInt(experience),
          previous_loans: parseInt(prevLoans || '0'),
          loan_repaid: parseInt(repaid || '0'),
          crop_type: cropType,
          investment_amount: parseFloat(investment || '0'),
          savings: parseFloat(savings || '0'),
          language,
        }),
      });
      setResult(res.data);
    } catch (err: any) {
      Alert.alert('Error', err.message);
    } finally {
      setLoading(false);
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return '#388E3C';
    if (score >= 55) return '#F9A825';
    if (score >= 40) return '#E65100';
    return '#D32F2F';
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {/* Header with back button */}
          <View style={styles.headerRow}>
            <TouchableOpacity testID="credit-back-btn" onPress={() => router.back()} style={styles.backBtn}>
              <Ionicons name="arrow-back" size={24} color="#1B5E20" />
            </TouchableOpacity>
            <View style={[styles.hIcon, { backgroundColor: '#F3E5F5' }]}>
              <Ionicons name="card" size={24} color="#6A1B9A" />
            </View>
            <Text style={styles.headerTitle}>{t('credit_score', language)}</Text>
          </View>

          {/* Form */}
          <CreditInput label={t('annual_income', language)} value={income} onChangeText={setIncome} placeholder="e.g. 200000" testID="credit-income" />
          <CreditInput label={t('land_area', language)} value={land} onChangeText={setLand} placeholder="e.g. 3" testID="credit-land" />
          <CreditInput label={t('experience_years', language)} value={experience} onChangeText={setExperience} placeholder="e.g. 10" testID="credit-experience" />
          
          <View style={styles.row}>
            <View style={styles.half}>
              <CreditInput label="Previous Loans" value={prevLoans} onChangeText={setPrevLoans} placeholder="0" testID="credit-prev-loans" />
            </View>
            <View style={styles.half}>
              <CreditInput label="Loans Repaid" value={repaid} onChangeText={setRepaid} placeholder="0" testID="credit-repaid" />
            </View>
          </View>

          <CreditInput label="Crops Grown (comma separated)" value={cropType} onChangeText={setCropType} placeholder="Rice, Wheat" numeric={false} testID="credit-crops" />
          
          <View style={styles.row}>
            <View style={styles.half}>
              <CreditInput label="Investment (₹)" value={investment} onChangeText={setInvestment} placeholder="0" testID="credit-investment" />
            </View>
            <View style={styles.half}>
              <CreditInput label="Savings (₹)" value={savings} onChangeText={setSavings} placeholder="0" testID="credit-savings" />
            </View>
          </View>

          <TouchableOpacity testID="credit-submit-btn" style={styles.button} onPress={handleSubmit} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : (
              <View style={styles.btnInner}>
                <Ionicons name="calculator" size={20} color="#fff" />
                <Text style={styles.buttonText}>{t('check_eligibility', language)}</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* Results */}
          {result && (
            <View style={styles.resultCard}>
              {/* Score Circle */}
              <View style={styles.scoreSection}>
                <View style={[styles.scoreCircle, { borderColor: getScoreColor(result.credit_score) }]}>
                  <Text style={[styles.scoreNum, { color: getScoreColor(result.credit_score) }]}>{result.credit_score}</Text>
                  <Text style={styles.scoreMax}>/ {result.max_score}</Text>
                </View>
                <Text style={[styles.eligibility, { color: getScoreColor(result.credit_score) }]}>{result.eligibility}</Text>
              </View>

              {/* Loan Info */}
              <View style={styles.loanInfo}>
                <View style={styles.loanItem}>
                  <Text style={styles.loanLabel}>Max Loan Amount</Text>
                  <Text style={styles.loanValue}>₹{result.max_loan_amount?.toLocaleString()}</Text>
                </View>
                <View style={styles.loanItem}>
                  <Text style={styles.loanLabel}>Interest Range</Text>
                  <Text style={styles.loanValue}>{result.interest_range}</Text>
                </View>
              </View>

              {/* Score Breakdown */}
              {result.breakdown && (
                <View style={styles.breakdownSection}>
                  <Text style={styles.breakdownTitle}>Score Breakdown</Text>
                  {Object.entries(result.breakdown).map(([key, val]) => (
                    <View key={key} style={styles.breakdownRow}>
                      <Text style={styles.breakdownKey}>{key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Text>
                      <View style={styles.barBg}>
                        <View style={[styles.barFill, { width: `${((val as number) / 25) * 100}%` }]} />
                      </View>
                      <Text style={styles.breakdownVal}>{val as number}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Recommendations */}
              {result.recommendations && result.recommendations.length > 0 && (
                <View style={styles.recsSection}>
                  <Text style={styles.recsTitle}>Recommendations</Text>
                  {result.recommendations.map((rec: string, i: number) => (
                    <View key={i} style={styles.recRow}>
                      <Ionicons name="bulb" size={18} color="#F9A825" />
                      <Text style={styles.recText}>{rec}</Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Government Schemes */}
              {result.government_schemes && (
                <View style={styles.schemesSection}>
                  <Text style={styles.schemesTitle}>Government Schemes</Text>
                  {result.government_schemes.map((s: any, i: number) => (
                    <View key={i} style={styles.schemeCard}>
                      <View style={styles.schemeIcon}>
                        <Ionicons name="business" size={18} color="#1565C0" />
                      </View>
                      <View style={styles.schemeContent}>
                        <Text style={styles.schemeName}>{s.name}</Text>
                        <Text style={styles.schemeBenefit}>{s.benefit}</Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          )}
          <View style={{ height: 30 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function CreditInput({ label, value, onChangeText, placeholder, numeric = true, testID }: any) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        testID={testID}
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#aaa"
        keyboardType={numeric ? 'numeric' : 'default'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  scroll: { padding: 20 },
  headerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  backBtn: { marginRight: 12, padding: 4 },
  hIcon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 22, fontWeight: '800', color: '#1B5E20' },
  inputGroup: { marginBottom: 14 },
  label: { fontSize: 14, fontWeight: '600', color: '#555', marginBottom: 6 },
  input: { backgroundColor: '#fff', borderRadius: 14, padding: 14, fontSize: 16, color: '#333', borderWidth: 1.5, borderColor: '#E0E0E0' },
  row: { flexDirection: 'row', gap: 12 },
  half: { flex: 1 },
  button: { backgroundColor: '#6A1B9A', borderRadius: 16, paddingVertical: 18, alignItems: 'center', marginTop: 8 },
  btnInner: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  buttonText: { color: '#fff', fontSize: 17, fontWeight: '700' },
  resultCard: { marginTop: 24, backgroundColor: '#fff', borderRadius: 20, padding: 20, borderWidth: 1.5, borderColor: '#E0E0E0' },
  scoreSection: { alignItems: 'center', marginBottom: 20 },
  scoreCircle: { width: 120, height: 120, borderRadius: 60, borderWidth: 6, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  scoreNum: { fontSize: 36, fontWeight: '800' },
  scoreMax: { fontSize: 14, color: '#999' },
  eligibility: { fontSize: 20, fontWeight: '800' },
  loanInfo: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  loanItem: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 14, padding: 16, alignItems: 'center' },
  loanLabel: { fontSize: 12, color: '#888', marginBottom: 4 },
  loanValue: { fontSize: 18, fontWeight: '800', color: '#333' },
  breakdownSection: { marginBottom: 20 },
  breakdownTitle: { fontSize: 16, fontWeight: '700', color: '#1B5E20', marginBottom: 12 },
  breakdownRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  breakdownKey: { width: 110, fontSize: 12, color: '#666' },
  barBg: { flex: 1, height: 8, backgroundColor: '#E0E0E0', borderRadius: 4, marginHorizontal: 8 },
  barFill: { height: 8, backgroundColor: '#2E7D32', borderRadius: 4 },
  breakdownVal: { width: 30, fontSize: 13, fontWeight: '700', color: '#333', textAlign: 'right' },
  recsSection: { marginBottom: 20 },
  recsTitle: { fontSize: 16, fontWeight: '700', color: '#E65100', marginBottom: 10 },
  recRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
  recText: { flex: 1, fontSize: 14, color: '#555', lineHeight: 20 },
  schemesSection: {},
  schemesTitle: { fontSize: 16, fontWeight: '700', color: '#1565C0', marginBottom: 10 },
  schemeCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#E3F2FD', borderRadius: 12, padding: 14, marginBottom: 8 },
  schemeIcon: { width: 36, height: 36, borderRadius: 10, backgroundColor: '#BBDEFB', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  schemeContent: { flex: 1 },
  schemeName: { fontSize: 15, fontWeight: '700', color: '#1565C0' },
  schemeBenefit: { fontSize: 13, color: '#555', marginTop: 2 },
});
