import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { useAppContext } from '../context/AppContext';
import { clearHistory } from '../database/messagesRepository';
import { formatWelcome } from '../utils/formatter';

export function SettingsScreen({ navigation }: { navigation: any }) {
  const { colors, settings, updateSetting, db } = useAppContext();
  const [dueDay, setDueDay] = useState(String(settings.defaultDueDay));
  const [closingDay, setClosingDay] = useState(settings.cardClosingDay ? String(settings.cardClosingDay) : '');
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [useAI, setUseAI] = useState(!!settings.geminiApiKey);

  async function handleSaveDay() {
    const day = parseInt(dueDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Dia inválido', 'Informe um dia entre 1 e 31.');
      return;
    }
    await updateSetting('default_due_day', String(day));
    Alert.alert('Salvo!', `Dia padrão de vencimento: ${day}`);
  }

  async function handleSaveClosingDay() {
    const trimmed = closingDay.trim();
    const day = trimmed ? parseInt(trimmed, 10) : 0;
    if (trimmed && (isNaN(day) || day < 1 || day > 31)) {
      Alert.alert('Dia inválido', 'Informe um dia entre 1 e 31.');
      return;
    }
    await updateSetting('card_closing_day', String(day));
    Alert.alert(
      day ? 'Salvo!' : 'Fechamento desativado',
      day
        ? `Dia de fechamento do cartão: ${day}`
        : 'O app voltou a usar apenas o dia padrão de vencimento.'
    );
  }

  async function handleSaveApiKey() {
    const trimmed = apiKey.trim();
    await updateSetting('gemini_api_key', trimmed);
    setUseAI(!!trimmed);
    Alert.alert(
      trimmed ? 'IA ativada!' : 'IA desativada',
      trimmed
        ? 'O Gemini 2.5 Flash agora vai interpretar suas mensagens.'
        : 'Voltando ao modo manual. Use comandos como "adicionar conta R$100 dia 10".'
    );
  }

  function handleClearChat() {
    Alert.alert(
      'Limpar chat',
      'Todo o histórico de conversas será apagado.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Limpar',
          style: 'destructive',
          onPress: async () => {
            if (!db) return;
            await clearHistory(db);
            Alert.alert('Chat limpo', 'O histórico foi apagado.');
            setTimeout(() => navigation.navigate('Chat'), 200);
          },
        },
      ]
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        Inteligência Artificial
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <View style={[styles.toggleRow, { borderBottomColor: colors.border }]}>
          <Text style={[styles.toggleLabel, { color: colors.text }]}>
            Usar Gemini 2.5 Flash
          </Text>
          <Switch
            value={useAI}
            onValueChange={(val) => setUseAI(val)}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        {useAI && (
          <View style={styles.apiSection}>
            <Text style={[styles.subLabel, { color: colors.text }]}>
              API Key
            </Text>
            <Text style={[styles.description, { color: colors.textMuted }]}>
              Obtenha gratuitamente em aistudio.google.com
            </Text>
            <View style={styles.row}>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.background,
                    color: colors.text,
                  },
                ]}
                value={apiKey}
                onChangeText={setApiKey}
                placeholder="Cole sua API key aqui"
                placeholderTextColor={colors.textMuted}
                secureTextEntry={!showApiKey}
                autoCapitalize="none"
                autoCorrect={false}
              />
              <TouchableOpacity
                style={styles.eyeBtn}
                onPress={() => setShowApiKey((v) => !v)}
              >
                <Text style={{ fontSize: 18 }}>{showApiKey ? '🙈' : '👁'}</Text>
              </TouchableOpacity>
            </View>
            <TouchableOpacity
              style={[styles.saveBtn, { backgroundColor: colors.primary, marginTop: 12 }]}
              onPress={handleSaveApiKey}
              activeOpacity={0.8}
            >
              <Text style={styles.saveBtnText}>Salvar</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        Preferências
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.label, { color: colors.text }]}>
          Dia padrão de vencimento
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Quando nenhuma data for informada, será usado o dia {settings.defaultDueDay}.
        </Text>
        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
              },
            ]}
            value={dueDay}
            onChangeText={setDueDay}
            placeholder="Ex: 10"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveDay}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        </View>
        <View style={[styles.divider, { backgroundColor: colors.border }]} />
        <Text style={[styles.label, { color: colors.text }]}>
          Dia de fechamento do cartão
        </Text>
        <Text style={[styles.description, { color: colors.textMuted }]}>
          Depois do dia {settings.cardClosingDay || '-'}, novas contas sem data caem no vencimento do próximo mês.
        </Text>
        <View style={styles.row}>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
              },
            ]}
            value={closingDay}
            onChangeText={setClosingDay}
            placeholder="Ex: 5"
            placeholderTextColor={colors.textMuted}
            keyboardType="number-pad"
            maxLength={2}
          />
          <TouchableOpacity
            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
            onPress={handleSaveClosingDay}
            activeOpacity={0.8}
          >
            <Text style={styles.saveBtnText}>Salvar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        Exemplos de comandos
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <Text style={[styles.description, { color: colors.textMuted, marginBottom: 10 }]}>
          Com IA ativa, fale naturalmente:
        </Text>
        {[
          '"comprei uma pizza ontem por 45 reais"',
          '"a conta de luz veio 180, vence dia 22"',
          '"paguei o aluguel"',
          '"quanto gastei esse mês?"',
          '"remove a conta do spotify"',
        ].map((ex, i) => (
          <Text key={i} style={[styles.example, { color: colors.text }]}>
            • {ex}
          </Text>
        ))}
      </View>

      <Text style={[styles.sectionHeader, { color: colors.textMuted }]}>
        Dados
      </Text>
      <View style={[styles.card, { backgroundColor: colors.surface }]}>
        <TouchableOpacity
          style={styles.dangerRow}
          onPress={handleClearChat}
          activeOpacity={0.6}
        >
          <Text style={[styles.dangerLabel, { color: colors.danger }]}>
            Limpar histórico do chat
          </Text>
          <Text style={{ color: colors.danger, fontSize: 16 }}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 8,
  },
  card: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
  },
  divider: {
    height: 1,
    marginTop: 16,
  },
  label: {
    fontSize: 17,
    fontWeight: '600',
    padding: 16,
    paddingBottom: 0,
  },
  subLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    padding: 16,
    paddingTop: 4,
  },
  example: {
    fontSize: 14,
    lineHeight: 22,
    paddingHorizontal: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  toggleLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
  apiSection: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: 10,
    paddingHorizontal: 14,
    fontSize: 16,
  },
  eyeBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  saveBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  dangerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  dangerLabel: {
    fontSize: 17,
    fontWeight: '400',
  },
});
