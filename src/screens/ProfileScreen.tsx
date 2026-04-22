import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { clearHistory } from '../database/messagesRepository';
import { AppHeader } from '../components/ui/AppHeader';
import { Icon } from '../components/ui/Icon';
import { exportFinancialSummaryPdf } from '../services/pdfReport';

function Section({ T, label, children }: { T: any; label: string; children: React.ReactNode }) {
  return (
    <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
      <Text style={{ fontSize: 11, color: T.textFaint, textTransform: 'uppercase', letterSpacing: 1.2, fontWeight: '600', paddingHorizontal: 4, paddingBottom: 10 }}>
        {label}
      </Text>
      <View style={{ backgroundColor: T.surface, borderWidth: 1, borderColor: T.border, borderRadius: 18, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

function SettingRow({ T, icon, label, value, chevron, last, danger, onPress }: {
  T: any; icon: string; label: string; value?: string;
  chevron?: boolean; last?: boolean; danger?: boolean; onPress?: () => void;
}) {
  return (
    <TouchableOpacity onPress={onPress} activeOpacity={onPress ? 0.7 : 1} style={{
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: 20, paddingVertical: 14,
      borderBottomWidth: last ? 0 : 1, borderBottomColor: T.border,
    }}>
      <Icon name={icon} size={18} color={danger ? T.danger : T.text} stroke={1.8}/>
      <Text style={{ flex: 1, fontSize: 14, color: danger ? T.danger : T.text, fontWeight: '500', letterSpacing: -0.15 }}>{label}</Text>
      {value && <Text style={{ fontSize: 13, color: T.textDim }}>{value}</Text>}
      {(chevron || value) && <Icon name="chevR" size={16} color={T.textFaint} stroke={2}/>}
    </TouchableOpacity>
  );
}

function Toggle({ T, on, onToggle }: { T: any; on: boolean; onToggle?: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={{
      width: 44, height: 26, borderRadius: 13,
      backgroundColor: on ? T.accent : T.borderStrong,
      justifyContent: 'center',
    }}>
      <View style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 20, height: 20, borderRadius: 10,
        backgroundColor: on ? T.accentInk : '#fff',
      }}/>
    </TouchableOpacity>
  );
}

export function ProfileScreen() {
  const { T, themeMode, updateSetting, db, settings } = useAppContext();
  const navigation = useNavigation<any>();
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState(settings.geminiApiKey);
  const [dueDay, setDueDay] = useState(String(settings.defaultDueDay));
  const [aiEnabled, setAiEnabled] = useState(!!settings.geminiApiKey);
  const [userName, setUserName] = useState(settings.userName || '');
  const [editingName, setEditingName] = useState(false);
  const isSavingDueDayRef = useRef(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);

  const displayName = userName || 'Seu nome';
  const initials = (userName || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    setDueDay(String(settings.defaultDueDay));
  }, [settings.defaultDueDay]);

  async function handleSaveApiKey() {
    const trimmed = apiKey.trim();
    await updateSetting('gemini_api_key', trimmed);
    setAiEnabled(!!trimmed);
  }

  async function handleSaveDay() {
    const day = parseInt(dueDay, 10);
    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('Dia inválido', 'Informe um dia entre 1 e 31.');
      return;
    }
    if (day === settings.defaultDueDay) {
      setDueDay(String(day));
      return;
    }
    if (isSavingDueDayRef.current) {
      return;
    }
    isSavingDueDayRef.current = true;
    try {
      await updateSetting('default_due_day', String(day));
      setDueDay(String(day));
      Alert.alert('Dia padrão atualizado', `Novo dia padrão de vencimento: ${day}`);
    } finally {
      isSavingDueDayRef.current = false;
    }
  }

  async function handleSaveName() {
    setEditingName(false);
    await updateSetting('user_name', userName.trim());
  }

  function handleClearChat() {
    Alert.alert('Limpar chat', 'Todo o histórico será apagado.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Limpar', style: 'destructive', onPress: async () => {
        if (!db) return;
        await clearHistory(db);
        Alert.alert('Pronto', 'Histórico apagado.');
      }},
    ]);
  }

  async function handleExportPdf() {
    if (!db || isExportingPdf) return;

    setIsExportingPdf(true);
    try {
      const result = await exportFinancialSummaryPdf({
        db,
        T,
        userName: settings.userName,
        defaultDueDay: settings.defaultDueDay,
      });

      if (result.type === 'print_dialog') {
        Alert.alert(
          'Resumo pronto',
          'A janela de impressão foi aberta. Escolha "Salvar em PDF" ou a opção de download do navegador.'
        );
      } else if (result.type === 'saved') {
        Alert.alert(
          'PDF gerado',
          `O relatório foi salvo em:\n${result.uri}`
        );
      }
    } catch (error) {
      console.error('handleExportPdf error:', error);
      Alert.alert('Erro ao exportar', 'Não foi possível gerar o resumo em PDF agora.');
    } finally {
      setIsExportingPdf(false);
    }
  }

  return (
    <View style={{ flex: 1, backgroundColor: T.bg }}>
      <AppHeader title="Perfil" T={T}/>
      <ScrollView contentContainerStyle={{ paddingBottom: 40 }}>
        {/* Profile card */}
        <View style={{ paddingHorizontal: 20, paddingBottom: 20 }}>
          <View style={{
            backgroundColor: T.surface, borderWidth: 1, borderColor: T.border,
            borderRadius: 20, padding: 20,
            flexDirection: 'row', alignItems: 'center', gap: 14,
          }}>
            <View style={{
              width: 56, height: 56, borderRadius: 28,
              backgroundColor: T.accent,
              alignItems: 'center', justifyContent: 'center',
            }}>
              <Text style={{ color: T.accentInk, fontWeight: '700', fontSize: 22, letterSpacing: -0.4 }}>{initials}</Text>
            </View>
            <View style={{ flex: 1 }}>
              {editingName ? (
                <TextInput
                  value={userName}
                  onChangeText={setUserName}
                  onBlur={handleSaveName}
                  onSubmitEditing={handleSaveName}
                  autoFocus
                  style={{
                    fontSize: 17, fontWeight: '600', color: T.text,
                    letterSpacing: -0.3, borderBottomWidth: 1, borderBottomColor: T.accent,
                    paddingVertical: 2,
                  }}
                  placeholder="Seu nome"
                  placeholderTextColor={T.textDim}
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7}>
                  <Text style={{ fontSize: 17, fontWeight: '600', color: T.text, letterSpacing: -0.3 }}>
                    {displayName}
                  </Text>
                  <Text style={{ fontSize: 12, color: T.textDim, marginTop: 2 }}>Toque para editar</Text>
                </TouchableOpacity>
              )}
            </View>
            <TouchableOpacity onPress={() => setEditingName(true)} activeOpacity={0.7}>
              <Icon name="pencil" size={16} color={T.textFaint} stroke={2}/>
            </TouchableOpacity>
          </View>
        </View>

        {/* Preferências */}
        <Section T={T} label="Preferências">
          <SettingRow T={T} icon={themeMode === 'dark' ? 'moon' : 'sun'}
            label="Aparência" value={themeMode === 'dark' ? 'Escuro' : 'Claro'}
            onPress={() => updateSetting('theme_mode', themeMode === 'dark' ? 'light' : 'dark')}/>
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: T.border,
          }}>
            <Icon name="calendar" size={18} color={T.text} stroke={1.8}/>
            <Text style={{ flex: 1, fontSize: 14, color: T.text, fontWeight: '500', letterSpacing: -0.15 }}>Dia padrão de vencimento</Text>
            <TextInput
              value={dueDay}
              onChangeText={setDueDay}
              onBlur={handleSaveDay}
              onSubmitEditing={handleSaveDay}
              keyboardType="number-pad"
              maxLength={2}
              style={{ fontSize: 13, color: T.textDim, textAlign: 'right', minWidth: 32, padding: 0 }}
            />
            <Icon name="chevR" size={16} color={T.textFaint} stroke={2}/>
          </View>
          <SettingRow T={T} icon="bell" label="Notificações" value="2 dias antes"/>
          <SettingRow T={T} icon="globe" label="Idioma" value="Português" last/>
        </Section>

        {/* IA */}
        <Section T={T} label="Inteligência artificial">
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: T.border,
          }}>
            <Icon name="sparkle" size={18} color={T.text} stroke={1.8}/>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: T.text, fontWeight: '500', letterSpacing: -0.15 }}>Assistente IA</Text>
              <Text style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>Gemini 2.5 Flash · {aiEnabled ? 'Ativo' : 'Inativo'}</Text>
            </View>
            <Toggle T={T} on={aiEnabled} onToggle={() => {
              if (aiEnabled) { setAiEnabled(false); updateSetting('gemini_api_key', ''); setApiKey(''); }
              else setAiEnabled(true);
            }}/>
          </View>

          {aiEnabled && (
            <View style={{ paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border }}>
              <Text style={{ fontSize: 13, color: T.text, fontWeight: '500', marginBottom: 8, letterSpacing: -0.15 }}>Chave da API</Text>
              <View style={{
                flexDirection: 'row', alignItems: 'center', gap: 10,
                backgroundColor: T.bg, borderWidth: 1, borderColor: T.border,
                borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10,
              }}>
                <Icon name="key" size={14} color={T.textFaint} stroke={1.8}/>
                <TextInput
                  value={apiKey}
                  onChangeText={setApiKey}
                  onBlur={handleSaveApiKey}
                  onSubmitEditing={handleSaveApiKey}
                  secureTextEntry={!showKey}
                  autoCapitalize="none"
                  autoCorrect={false}
                  placeholder="Cole sua API key aqui"
                  placeholderTextColor={T.textDim}
                  style={{ flex: 1, fontSize: 13, color: T.text, letterSpacing: 0.5, padding: 0 }}
                />
                <TouchableOpacity onPress={() => setShowKey(v => !v)} activeOpacity={0.7}>
                  <Icon name={showKey ? 'eyeOff' : 'eye'} size={16} color={T.textDim} stroke={1.8}/>
                </TouchableOpacity>
              </View>
              <Text style={{ fontSize: 11, color: T.textFaint, marginTop: 8 }}>
                Grátis em aistudio.google.com
              </Text>
            </View>
          )}

          <SettingRow T={T} icon="zap" label="Comandos de exemplo" chevron last
            onPress={() => navigation.navigate('ExampleCommands')}/>
        </Section>

        {/* Dados */}
        <Section T={T} label="Dados">
          <SettingRow
            T={T}
            icon="copy"
            label="Exportar resumo em PDF"
            value={isExportingPdf ? 'Gerando...' : 'PDF'}
            chevron
            onPress={handleExportPdf}
          />
          <SettingRow T={T} icon="shield" label="Privacidade" chevron onPress={() => Alert.alert('Privacidade', 'Todos os seus dados ficam no dispositivo. Nenhum dado é enviado a servidores, exceto as mensagens ao Gemini quando a IA está ativa.')}/>
          <SettingRow T={T} icon="trash" label="Limpar histórico do chat" danger last onPress={handleClearChat}/>
        </Section>

        <Text style={{ textAlign: 'center', paddingVertical: 8, color: T.textFaint, fontSize: 11 }}>
          Contas · v2.0.0
        </Text>
      </ScrollView>
    </View>
  );
}
