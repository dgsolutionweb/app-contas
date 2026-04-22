import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { useAppContext } from '../../context/AppContext';

interface Props {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export function InputBar({ onSend, disabled }: Props) {
  const { colors } = useAppContext();
  const { width } = useWindowDimensions();
  const [text, setText] = useState('');
  const inputRef = useRef<TextInput>(null);
  const compact = width < 380;

  useEffect(() => {
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  function handleSend() {
    const trimmed = text.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setText('');
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.inputContainer,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
            shadowColor: '#000',
            shadowOpacity: 0.08,
            shadowRadius: 18,
            shadowOffset: { width: 0, height: 6 },
            elevation: 6,
          },
        ]}
      >
        <TextInput
          ref={inputRef}
          style={[styles.input, compact ? styles.inputCompact : null, { color: colors.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Mensagem..."
          placeholderTextColor={colors.textMuted}
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
          editable={!disabled}
          multiline
          numberOfLines={1}
          textAlignVertical="center"
        />
        <TouchableOpacity
          style={[
            styles.sendBtn,
            compact ? styles.sendBtnCompact : null,
            { backgroundColor: text.trim() ? colors.primary : colors.border },
          ]}
          onPress={handleSend}
          disabled={!text.trim() || disabled}
          activeOpacity={0.7}
        >
          <Text style={styles.sendIcon}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 6,
    paddingBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 24,
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 4,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    letterSpacing: -0.2,
    minHeight: 38,
    maxHeight: 100,
  },
  inputCompact: {
    fontSize: 15,
    paddingHorizontal: 10,
  },
  sendBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnCompact: {
    width: 34,
    height: 34,
    borderRadius: 17,
  },
  sendIcon: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginTop: -1,
  },
});
