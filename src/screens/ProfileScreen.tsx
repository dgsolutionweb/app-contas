import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Platform, Modal, ActivityIndicator
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppContext } from '../context/AppContext';
import { clearHistory } from '../database/messagesRepository';
import { AppHeader } from '../components/ui/AppHeader';
import { Icon } from '../components/ui/Icon';
import { exportFinancialSummaryPdf } from '../services/pdfReport';
import { deleteOpenAIKey, saveOpenAIKey } from '../services/openaiKey';

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

export function ProfileScreen() {
  const { T, themeMode, updateSetting, db, settings, user, signOut, refreshOpenAIKeyStatus } = useAppContext();
  const navigation = useNavigation<any>();
  const [dueDay, setDueDay] = useState(String(settings.defaultDueDay));
  const [closingDay, setClosingDay] = useState(String(settings.cardClosingDay || ''));
  const [userName, setUserName] = useState(settings.userName || '');
  const [editingName, setEditingName] = useState(false);
  const isSavingDueDayRef = useRef(false);
  const isSavingClosingDayRef = useRef(false);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportModalVisible, setIsExportModalVisible] = useState(false);
  const [openaiKey, setOpenaiKey] = useState('');
  const [showOpenaiKey, setShowOpenaiKey] = useState(false);
  const [isSavingOpenaiKey, setIsSavingOpenaiKey] = useState(false);

  const displayName = userName || 'Seu nome';
  const initials = (userName || 'U').charAt(0).toUpperCase();

  useEffect(() => {
    setDueDay(String(settings.defaultDueDay));
  }, [settings.defaultDueDay]);

  useEffect(() => {
    setClosingDay(settings.cardClosingDay ? String(settings.cardClosingDay) : '');
  }, [settings.cardClosingDay]);

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

  async function handleSaveClosingDay() {
    const trimmed = closingDay.trim();
    const day = trimmed ? parseInt(trimmed, 10) : 0;
    if (trimmed && (isNaN(day) || day < 1 || day > 31)) {
      Alert.alert('Dia inválido', 'Informe um dia entre 1 e 31.');
      return;
    }
    if (day === settings.cardClosingDay) {
      setClosingDay(day ? String(day) : '');
      return;
    }
    if (isSavingClosingDayRef.current) {
      return;
    }
    isSavingClosingDayRef.current = true;
    try {
      await updateSetting('card_closing_day', String(day));
      setClosingDay(day ? String(day) : '');
      Alert.alert(
        day ? 'Fechamento atualizado' : 'Fechamento desativado',
        day
          ? `Novas contas cadastradas depois do dia ${day} cairão no vencimento do próximo mês.`
          : 'O app voltou a usar apenas o dia padrão de vencimento.'
      );
    } finally {
      isSavingClosingDayRef.current = false;
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

  function handleSignOut() {
    Alert.alert('Sair da conta', 'Deseja encerrar sua sessão neste dispositivo?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        try {
          await signOut();
        } catch {
          Alert.alert('Erro', 'Não foi possível encerrar a sessão.');
        }
      }},
    ]);
  }

  async function handleSaveOpenAIKey() {
    const normalizedKey = openaiKey.trim();
    if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(normalizedKey)) {
      Alert.alert('Chave inválida', 'Informe uma chave da OpenAI válida, iniciada por sk-.');
      return;
    }

    setIsSavingOpenaiKey(true);
    try {
      await saveOpenAIKey(normalizedKey);
      setOpenaiKey('');
      setShowOpenaiKey(false);
      await refreshOpenAIKeyStatus();
      Alert.alert('Chave salva', 'Sua chave foi criptografada e vinculada somente à sua conta.');
    } catch (error) {
      console.error('Failed to save OpenAI key:', error);
      Alert.alert('Erro', 'Não foi possível salvar a chave da OpenAI.');
    } finally {
      setIsSavingOpenaiKey(false);
    }
  }

  function handleDeleteOpenAIKey() {
    Alert.alert('Remover chave', 'O assistente continuará funcionando no modo local.', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Remover', style: 'destructive', onPress: async () => {
        setIsSavingOpenaiKey(true);
        try {
          await deleteOpenAIKey();
          setOpenaiKey('');
          await refreshOpenAIKeyStatus();
          Alert.alert('Chave removida', 'A chave da OpenAI foi excluída da sua conta.');
        } catch (error) {
          console.error('Failed to delete OpenAI key:', error);
          Alert.alert('Erro', 'Não foi possível remover a chave da OpenAI.');
        } finally {
          setIsSavingOpenaiKey(false);
        }
      }},
    ]);
  }

  const handleExportPdf = () => {
    setIsExportModalVisible(true);
  };

  const executeExport = async (period: 'mensal' | 'completo') => {
    setIsExportModalVisible(false);
    if (!db || isExportingPdf) return;
    setIsExportingPdf(true);
    try {
      const result = await exportFinancialSummaryPdf({
        db,
        T,
        userName: settings.userName,
        defaultDueDay: settings.defaultDueDay,
        cardClosingDay: settings.cardClosingDay,
        period,
      });

      if (result.type === 'saved') {
        Alert.alert('Sucesso', 'PDF salvo em: ' + result.uri);
      }
    } catch (e) {
      console.error(e);
      Alert.alert('Erro', 'Ocorreu um erro ao gerar o PDF');
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
          <View style={{
            flexDirection: 'row', alignItems: 'center', gap: 14,
            paddingHorizontal: 20, paddingVertical: 14,
            borderBottomWidth: 1, borderBottomColor: T.border,
          }}>
            <Icon name="calendar" size={18} color={T.text} stroke={1.8}/>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: T.text, fontWeight: '500', letterSpacing: -0.15 }}>Dia de fechamento do cartão</Text>
              <Text style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
                Depois desse dia, novas contas vão para o próximo mês
              </Text>
            </View>
            <TextInput
              value={closingDay}
              onChangeText={setClosingDay}
              onBlur={handleSaveClosingDay}
              onSubmitEditing={handleSaveClosingDay}
              keyboardType="number-pad"
              maxLength={2}
              placeholder="-"
              placeholderTextColor={T.textFaint}
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
            paddingHorizontal: 20, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: T.border,
          }}>
            <Icon name="sparkle" size={18} color={T.text} stroke={1.8}/>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 14, color: T.text, fontWeight: '500', letterSpacing: -0.15 }}>Assistente IA</Text>
              <Text style={{ fontSize: 11, color: T.textDim, marginTop: 2 }}>
                {settings.openaiConfigured
                  ? `OpenAI GPT-5.5 · Chave final ${settings.openaiKeyHint}`
                  : 'Modo local · Cadastre sua chave abaixo'}
              </Text>
            </View>
            <Icon name={settings.openaiConfigured ? 'shield' : 'key'} size={18} color={settings.openaiConfigured ? T.success : T.warn} stroke={1.8}/>
          </View>
          <View style={{ paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: T.border }}>
            <Text style={{ fontSize: 13, color: T.text, fontWeight: '600', marginBottom: 8 }}>
              {settings.openaiConfigured ? 'Substituir chave da API' : 'Chave da API OpenAI'}
            </Text>
            <View style={{
              flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: T.bg, borderWidth: 1, borderColor: T.borderStrong,
              borderRadius: 12, paddingHorizontal: 12, minHeight: 46,
            }}>
              <Icon name="key" size={15} color={T.textFaint} stroke={1.8}/>
              <TextInput
                value={openaiKey}
                onChangeText={setOpenaiKey}
                onSubmitEditing={handleSaveOpenAIKey}
                secureTextEntry={!showOpenaiKey}
                autoCapitalize="none"
                autoCorrect={false}
                placeholder="sk-..."
                placeholderTextColor={T.textFaint}
                style={{ flex: 1, color: T.text, fontSize: 13, paddingVertical: 0 }}
              />
              <TouchableOpacity onPress={() => setShowOpenaiKey((value) => !value)} hitSlop={10}>
                <Icon name={showOpenaiKey ? 'eyeOff' : 'eye'} size={16} color={T.textDim} stroke={1.8}/>
              </TouchableOpacity>
            </View>
            <Text style={{ fontSize: 11, color: T.textFaint, lineHeight: 16, marginTop: 8 }}>
              A chave é criptografada no Supabase Vault. Depois de salva, ela não pode ser visualizada novamente.
            </Text>
            <View style={{ flexDirection: 'row', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                onPress={handleSaveOpenAIKey}
                disabled={isSavingOpenaiKey || !openaiKey.trim()}
                activeOpacity={0.8}
                style={{
                  flex: 1, minHeight: 42, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: T.accent, opacity: isSavingOpenaiKey || !openaiKey.trim() ? 0.5 : 1,
                }}
              >
                {isSavingOpenaiKey
                  ? <ActivityIndicator size="small" color={T.accentInk}/>
                  : <Text style={{ color: T.accentInk, fontSize: 13, fontWeight: '700' }}>Salvar chave</Text>}
              </TouchableOpacity>
              {settings.openaiConfigured && (
                <TouchableOpacity
                  onPress={handleDeleteOpenAIKey}
                  disabled={isSavingOpenaiKey}
                  activeOpacity={0.8}
                  style={{ minHeight: 42, paddingHorizontal: 16, borderRadius: 12, borderWidth: 1, borderColor: T.danger, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Text style={{ color: T.danger, fontSize: 13, fontWeight: '600' }}>Remover</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
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
          <SettingRow T={T} icon="shield" label="Privacidade" chevron onPress={() => Alert.alert('Privacidade', 'Contas, mensagens e preferências são isoladas por usuário no banco. A chave da OpenAI fica protegida no servidor e nunca é enviada ao navegador.')}/>
          <SettingRow T={T} icon="trash" label="Limpar histórico do chat" danger last onPress={handleClearChat}/>
        </Section>

        <Section T={T} label="Conta">
          <SettingRow T={T} icon="mail" label="E-mail" value={user?.email || ''}/>
          <SettingRow T={T} icon="logout" label="Sair da conta" danger last onPress={handleSignOut}/>
        </Section>

        <Text style={{ textAlign: 'center', paddingVertical: 8, color: T.textFaint, fontSize: 11 }}>
          Contas · v2.0.0
        </Text>
      </ScrollView>

      {/* Export Modal */}
      <Modal visible={isExportModalVisible} transparent animationType="fade" onRequestClose={() => setIsExportModalVisible(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', maxWidth: 400, backgroundColor: T.surface, borderRadius: 16, overflow: 'hidden', ...Platform.select({ web: { boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }, default: { elevation: 8 } }) }}>
            <View style={{ padding: 24, borderBottomWidth: 1, borderColor: T.borderStrong, alignItems: 'center' }}>
              <View style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: T.accent + '20', justifyContent: 'center', alignItems: 'center', marginBottom: 16 }}>
                <Icon name="copy" size={24} color={T.accent} stroke={2} />
              </View>
              <Text style={{ fontSize: 18, fontWeight: '600', color: T.text, marginBottom: 8, textAlign: 'center' }}>
                Exportar Relatório
              </Text>
              <Text style={{ fontSize: 14, color: T.textDim, textAlign: 'center', lineHeight: 20 }}>
                Selecione o tipo de relatório financeiro que você deseja salvar em PDF.
              </Text>
            </View>

            <TouchableOpacity style={{ padding: 20, flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderColor: T.borderStrong }} onPress={() => executeExport('mensal')}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: T.borderStrong, justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Icon name="calendar" size={20} color={T.textDim} stroke={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: T.text, marginBottom: 2 }}>Apenas Mês Atual</Text>
                <Text style={{ fontSize: 13, color: T.textFaint }}>Contas com vencimento neste mês</Text>
              </View>
              <Icon name="chevronRight" size={20} color={T.textFaint} stroke={1.5} />
            </TouchableOpacity>

            <TouchableOpacity style={{ padding: 20, flexDirection: 'row', alignItems: 'center' }} onPress={() => executeExport('completo')}>
              <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: T.accent + '15', justifyContent: 'center', alignItems: 'center', marginRight: 16 }}>
                <Icon name="database" size={20} color={T.accent} stroke={1.5} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 16, fontWeight: '500', color: T.text, marginBottom: 2 }}>Histórico Completo</Text>
                <Text style={{ fontSize: 13, color: T.textFaint }}>Todas as contas cadastradas</Text>
              </View>
              <Icon name="chevronRight" size={20} color={T.textFaint} stroke={1.5} />
            </TouchableOpacity>

            <TouchableOpacity style={{ padding: 16, backgroundColor: T.surfaceHi, alignItems: 'center', borderTopWidth: 1, borderColor: T.borderStrong }} onPress={() => setIsExportModalVisible(false)}>
              <Text style={{ fontSize: 14, fontWeight: '600', color: T.textDim }}>Cancelar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}
