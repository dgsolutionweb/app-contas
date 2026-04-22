import React, { useCallback, useEffect, useRef } from 'react';
import {
  Alert, View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, Keyboard,
  StyleSheet, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent,
} from 'expo-speech-recognition';

import { useAppContext } from '../context/AppContext';
import { useDatabase } from '../hooks/useDatabase';
import { useChat } from '../hooks/useChat';
import { MessageList } from '../components/chat/MessageList';
import { markAsPaid } from '../database/contasRepository';
import { Icon } from '../components/ui/Icon';
import type { Conta } from '../types';

const SUGGESTIONS = [
  { label: 'Resumo do mês',     cmd: 'resumo do mês' },
  { label: 'Listar pendentes',  cmd: 'listar pendentes' },
  { label: 'Quanto já paguei?', cmd: 'quanto já paguei esse mês' },
  { label: 'Adicionar conta',   cmd: 'adicionar ' },
];

export function ChatScreen() {
  const { T, settings } = useAppContext();
  const { db, isReady } = useDatabase();
  const { messages, isLoading, isProcessing, sendMessage, handleConfirm, handleCancel } = useChat(
    isReady ? db : null,
    settings
  );
  const insets = useSafeAreaInsets();
  const messageListRef = useRef<{ scrollToEnd: () => void }>(null);
  const [inputText, setInputText] = React.useState('');
  const [isListening, setIsListening] = React.useState(false);
  const inputRef = useRef<TextInput>(null);
  const speechBaseRef = useRef('');
  const permissionAlertLockRef = useRef(false);
  const showSuggestions = messages.length <= 2 && !isProcessing;

  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      setTimeout(() => messageListRef.current?.scrollToEnd(), 100);
    });
    return () => sub.remove();
  }, []);

  useEffect(() => {
    return () => {
      ExpoSpeechRecognitionModule.abort();
    };
  }, []);

  useSpeechRecognitionEvent('start', () => {
    setIsListening(true);
    permissionAlertLockRef.current = false;
  });

  useSpeechRecognitionEvent('end', () => {
    setIsListening(false);
    speechBaseRef.current = '';
  });

  useSpeechRecognitionEvent('result', (event) => {
    const transcript = event.results?.[0]?.transcript?.trim();
    if (!transcript) return;
    const prefix = speechBaseRef.current;
    setInputText(prefix ? `${prefix}${transcript}` : transcript);
  });

  useSpeechRecognitionEvent('error', (event) => {
    setIsListening(false);
    speechBaseRef.current = '';

    if (event.error === 'not-allowed') {
      if (permissionAlertLockRef.current) return;
      permissionAlertLockRef.current = true;
      Alert.alert('Permissão necessária', 'Autorize o microfone para usar a fala no chat.');
      return;
    }

    if (event.error === 'aborted') {
      return;
    }

    Alert.alert('Falha no microfone', event.message || 'Não foi possível reconhecer sua fala.');
  });

  const handleMarkPaid = useCallback(async (conta: Conta) => {
    if (!db) return;
    await markAsPaid(db, conta.id);
    await sendMessage(`paguei ${conta.descricao}`);
  }, [db, sendMessage]);

  const handleSend = useCallback(() => {
    const trimmed = inputText.trim();
    if (!trimmed || !isReady) return;
    if (isListening) {
      ExpoSpeechRecognitionModule.stop();
    }
    sendMessage(trimmed);
    setInputText('');
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [inputText, isListening, isReady, sendMessage]);

  const handleToggleMic = useCallback(async () => {
    if (!isReady) return;

    if (isListening) {
      await ExpoSpeechRecognitionModule.stop();
      return;
    }

    const permission = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão necessária', 'Autorize o microfone para usar a fala no chat.');
      return;
    }

    const baseText = inputText.trim();
    speechBaseRef.current = baseText ? `${baseText} ` : '';

    try {
      ExpoSpeechRecognitionModule.start({
        lang: 'pt-BR',
        interimResults: true,
        maxAlternatives: 1,
        continuous: false,
        addsPunctuation: true,
      });
    } catch (error) {
      console.error('handleToggleMic error:', error);
      speechBaseRef.current = '';
      Alert.alert('Falha no microfone', 'Não foi possível iniciar a escuta agora.');
    }
  }, [inputText, isListening, isReady]);

  const keyboardOffset = insets.top + 56;

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: T.bg }]} edges={['bottom']}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: T.border, paddingTop: insets.top + 12 }]}>
        <View style={[styles.aiAvatar, { backgroundColor: T.accent }]}>
          <Icon name="sparkle" size={18} color={T.accentInk} stroke={2.5}/>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 15, fontWeight: '600', color: T.text, letterSpacing: -0.3 }}>Assistente</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: T.success }}/>
            <Text style={{ fontSize: 12, color: T.success }}>online · Gemini 2.5</Text>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={keyboardOffset}
      >
        <MessageList
          ref={messageListRef}
          messages={messages}
          isLoading={isLoading || !isReady}
          isProcessing={isProcessing}
          onMarkPaid={handleMarkPaid}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          onRefresh={() => sendMessage('listar pendentes')}
        />

        {/* Suggestions */}
        {showSuggestions && (
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={[styles.suggestions, { gap: 8 }]}
          >
            {SUGGESTIONS.map(s => (
              <TouchableOpacity
                key={s.label}
                onPress={() => sendMessage(s.cmd)}
                activeOpacity={0.7}
                style={[styles.suggestionChip, { backgroundColor: T.surface, borderColor: T.border }]}
              >
                <Text
                  numberOfLines={1}
                  style={{ color: T.text, fontSize: 11, fontWeight: '600', letterSpacing: -0.08 }}
                >
                  {s.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {/* Input bar */}
        <View style={[styles.inputBar, { paddingBottom: 12 }]}>
          <View style={[styles.inputWrap, { backgroundColor: T.surface, borderColor: T.border }]}>
            <TextInput
              ref={inputRef}
              style={[styles.input, { color: T.text }]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Fale naturalmente…"
              placeholderTextColor={T.textDim}
              returnKeyType="send"
              onSubmitEditing={handleSend}
              blurOnSubmit={false}
              editable={isReady}
              multiline
              numberOfLines={1}
              textAlignVertical="center"
            />
            <TouchableOpacity
              onPress={handleToggleMic}
              activeOpacity={0.75}
              style={[
                styles.micBtn,
                {
                  backgroundColor: isListening ? T.accent : T.chipBg,
                  borderColor: isListening ? 'transparent' : T.border,
                },
              ]}
            >
              <Icon
                name="mic"
                size={16}
                color={isListening ? T.accentInk : T.textDim}
                stroke={1.8}
              />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={handleSend}
            activeOpacity={0.85}
            disabled={!inputText.trim() || !isReady}
            style={[styles.sendBtn, { backgroundColor: inputText.trim() ? T.accent : T.chipBg }]}
          >
            <Icon name="arrUp" size={18} color={inputText.trim() ? T.accentInk : T.textFaint} stroke={2.5}/>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 12,
    borderBottomWidth: 1, gap: 12,
  },
  aiAvatar: {
    width: 36, height: 36, borderRadius: 18,
    alignItems: 'center', justifyContent: 'center',
  },
  suggestions: {
    paddingHorizontal: 16, paddingTop: 6, paddingBottom: 6, flexDirection: 'row',
  },
  suggestionChip: {
    minWidth: 112,
    paddingHorizontal: 14, paddingVertical: 6,
    borderRadius: 18, borderWidth: 1,
  },
  inputBar: {
    paddingHorizontal: 16, paddingTop: 8,
    flexDirection: 'row', gap: 8, alignItems: 'flex-end',
  },
  inputWrap: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    borderRadius: 24, borderWidth: 1,
    paddingHorizontal: 14, paddingVertical: 10, gap: 8,
  },
  input: {
    flex: 1, fontSize: 14, letterSpacing: -0.1,
    minHeight: 20, maxHeight: 100,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0,
  },
  micBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
});
