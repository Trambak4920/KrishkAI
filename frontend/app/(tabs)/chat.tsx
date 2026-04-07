import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../utils/AuthContext';
import { apiCall } from '../../utils/api';
import { t } from '../../utils/translations';

type Message = { id: string; text: string; isUser: boolean; timestamp: string };

const QUICK_PROMPTS = [
  { icon: 'leaf', text: 'Best crops for summer?' },
  { icon: 'water', text: 'How to save water in farming?' },
  { icon: 'bug', text: 'Natural pest control tips?' },
  { icon: 'cash', text: 'Government schemes for farmers?' },
];

export default function ChatScreen() {
  const { language } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState(() => `chat_${Date.now()}`);
  const flatListRef = useRef<FlatList>(null);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput('');

    const userMsg: Message = { id: `u_${Date.now()}`, text: msg, isUser: true, timestamp: new Date().toISOString() };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await apiCall('/chat/message', {
        method: 'POST',
        body: JSON.stringify({ message: msg, session_id: sessionId, language }),
      });
      const aiMsg: Message = { id: `a_${Date.now()}`, text: res.response, isUser: false, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errMsg: Message = { id: `e_${Date.now()}`, text: 'Sorry, something went wrong. Please try again.', isUser: false, timestamp: new Date().toISOString() };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (messages.length > 0) {
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }, [messages]);

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.msgRow, item.isUser ? styles.userRow : styles.aiRow]}>
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <Ionicons name="leaf" size={18} color="#2E7D32" />
        </View>
      )}
      <View style={[styles.bubble, item.isUser ? styles.userBubble : styles.aiBubble]}>
        <Text style={[styles.msgText, item.isUser ? styles.userText : styles.aiText]}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <View style={styles.headerIcon}>
          <Ionicons name="chatbubbles" size={22} color="#1565C0" />
        </View>
        <View>
          <Text style={styles.headerTitle}>{t('knowledge_hub', language)}</Text>
          <Text style={styles.headerSub}>Ask anything about farming</Text>
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.flex} keyboardVerticalOffset={90}>
        {messages.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="sparkles" size={48} color="#F9A825" />
            </View>
            <Text style={styles.emptyTitle}>How can I help you?</Text>
            <Text style={styles.emptyDesc}>Ask me about crops, diseases, schemes, or farming tips</Text>
            <View style={styles.prompts}>
              {QUICK_PROMPTS.map((p, i) => (
                <TouchableOpacity key={i} testID={`quick-prompt-${i}`} style={styles.promptBtn} onPress={() => sendMessage(p.text)}>
                  <Ionicons name={p.icon as any} size={18} color="#2E7D32" />
                  <Text style={styles.promptText}>{p.text}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.messageList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          />
        )}

        {loading && (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color="#2E7D32" />
            <Text style={styles.typingText}>KrishkAI is thinking...</Text>
          </View>
        )}

        <View style={styles.inputBar}>
          <TextInput
            testID="chat-input"
            style={styles.textInput}
            placeholder={t('type_message', language)}
            placeholderTextColor="#999"
            value={input}
            onChangeText={setInput}
            multiline
            maxLength={1000}
          />
          <TouchableOpacity testID="chat-send-btn" style={[styles.sendBtn, (!input.trim() || loading) && styles.sendBtnDisabled]} onPress={() => sendMessage()} disabled={!input.trim() || loading}>
            <Ionicons name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F1F8E9' },
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: '#fff' },
  headerIcon: { width: 40, height: 40, borderRadius: 12, backgroundColor: '#E3F2FD', alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  headerTitle: { fontSize: 20, fontWeight: '800', color: '#1B5E20' },
  headerSub: { fontSize: 13, color: '#888' },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 30 },
  emptyIcon: { width: 80, height: 80, borderRadius: 40, backgroundColor: '#FFF8E1', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 22, fontWeight: '800', color: '#1B5E20', marginBottom: 8 },
  emptyDesc: { fontSize: 15, color: '#888', textAlign: 'center', marginBottom: 24 },
  prompts: { width: '100%', gap: 10 },
  promptBtn: { flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#fff', padding: 16, borderRadius: 14, borderWidth: 1.5, borderColor: '#E0E0E0' },
  promptText: { fontSize: 15, color: '#333', fontWeight: '500' },
  messageList: { padding: 16, paddingBottom: 8 },
  msgRow: { marginBottom: 12, flexDirection: 'row', alignItems: 'flex-end' },
  userRow: { justifyContent: 'flex-end' },
  aiRow: { justifyContent: 'flex-start' },
  aiAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E8F5E9', alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  bubble: { maxWidth: '78%', padding: 14, borderRadius: 18 },
  userBubble: { backgroundColor: '#2E7D32', borderBottomRightRadius: 4 },
  aiBubble: { backgroundColor: '#fff', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#E0E0E0' },
  msgText: { fontSize: 15, lineHeight: 22 },
  userText: { color: '#fff' },
  aiText: { color: '#333' },
  typingRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 20, paddingVertical: 8 },
  typingText: { fontSize: 13, color: '#888' },
  inputBar: { flexDirection: 'row', alignItems: 'flex-end', paddingHorizontal: 14, paddingVertical: 10, backgroundColor: '#fff', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  textInput: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 24, paddingHorizontal: 18, paddingVertical: 12, fontSize: 16, color: '#333', maxHeight: 100, marginRight: 10 },
  sendBtn: { width: 48, height: 48, borderRadius: 24, backgroundColor: '#2E7D32', alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.5 },
});
