import React, { useState } from 'react';
import {
  ActivityIndicator, KeyboardAvoidingView, Platform, Pressable, SafeAreaView,
  ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View,
} from 'react-native';
import { Icon } from '../components/ui/Icon';
import { useAppContext } from '../context/AppContext';
import { supabase } from '../services/supabase';

type AuthMode = 'signIn' | 'signUp';

function translateAuthError(message: string): string {
  const normalized = message.toLowerCase();
  if (normalized.includes('invalid login credentials')) return 'E-mail ou senha incorretos.';
  if (normalized.includes('email not confirmed')) return 'Confirme seu e-mail antes de entrar.';
  if (normalized.includes('user already registered')) return 'Este e-mail já possui uma conta.';
  if (normalized.includes('password should be')) return 'A senha deve ter pelo menos 6 caracteres.';
  if (normalized.includes('rate limit')) return 'Muitas tentativas. Aguarde um momento e tente novamente.';
  return message;
}

export function AuthScreen() {
  const { T, isDark } = useAppContext();
  const [mode, setMode] = useState<AuthMode>('signIn');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const submit = async () => {
    const normalizedEmail = email.trim().toLowerCase();
    setError('');
    setSuccess('');

    if (!normalizedEmail || !normalizedEmail.includes('@')) {
      setError('Informe um e-mail válido.');
      return;
    }
    if (password.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }
    if (mode === 'signUp' && !name.trim()) {
      setError('Informe seu nome.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signIn') {
        const { error: authError } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });
        if (authError) throw authError;
      } else {
        const emailRedirectTo = Platform.OS === 'web' && typeof window !== 'undefined'
          ? window.location.origin
          : undefined;
        const { data, error: authError } = await supabase.auth.signUp({
          email: normalizedEmail,
          password,
          options: {
            data: { full_name: name.trim() },
            emailRedirectTo,
          },
        });
        if (authError) throw authError;
        if (!data.session) {
          setSuccess('Cadastro criado. Confirme o e-mail recebido e depois entre no app.');
          setMode('signIn');
          setPassword('');
        }
      }
    } catch (authError: any) {
      setError(translateAuthError(authError?.message || 'Não foi possível autenticar.'));
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (nextMode: AuthMode) => {
    setMode(nextMode);
    setError('');
    setSuccess('');
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: T.bg }]}> 
      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.shell}>
            <View style={styles.brand}>
              <View style={[styles.brandMark, { backgroundColor: T.accent }]}>
                <Text style={[styles.brandLetter, { color: T.accentInk }]}>C</Text>
              </View>
              <View>
                <Text style={[styles.brandName, { color: T.text }]}>Contas</Text>
                <Text style={[styles.brandCaption, { color: T.textFaint }]}>FINANÇAS PESSOAIS</Text>
              </View>
            </View>

            <View style={[styles.card, { backgroundColor: T.surface, borderColor: T.border }]}> 
              <View style={styles.heading}>
                <View style={[styles.securityIcon, { backgroundColor: isDark ? 'rgba(197,255,77,0.12)' : T.surfaceLo }]}> 
                  <Icon name="shield" size={22} color={T.accent} stroke={1.8}/>
                </View>
                <Text style={[styles.title, { color: T.text }]}>
                  {mode === 'signIn' ? 'Acesse suas finanças' : 'Crie sua conta'}
                </Text>
                <Text style={[styles.subtitle, { color: T.textDim }]}> 
                  Seus dados ficam separados e protegidos pela sua conta.
                </Text>
              </View>

              <View style={[styles.tabs, { backgroundColor: T.surfaceLo }]}> 
                <Pressable onPress={() => changeMode('signIn')} style={[styles.tab, mode === 'signIn' && { backgroundColor: T.surface }]}> 
                  <Text style={[styles.tabText, { color: mode === 'signIn' ? T.text : T.textFaint }]}>Entrar</Text>
                </Pressable>
                <Pressable onPress={() => changeMode('signUp')} style={[styles.tab, mode === 'signUp' && { backgroundColor: T.surface }]}> 
                  <Text style={[styles.tabText, { color: mode === 'signUp' ? T.text : T.textFaint }]}>Cadastrar</Text>
                </Pressable>
              </View>

              {mode === 'signUp' && (
                <View style={styles.field}>
                  <Text style={[styles.label, { color: T.textDim }]}>Nome</Text>
                  <View style={[styles.inputWrap, { backgroundColor: T.bg, borderColor: T.borderStrong }]}> 
                    <Icon name="user" size={17} color={T.textFaint} stroke={1.8}/>
                    <TextInput value={name} onChangeText={setName} placeholder="Seu nome" placeholderTextColor={T.textFaint} autoComplete="name" style={[styles.input, { color: T.text }]}/>
                  </View>
                </View>
              )}

              <View style={styles.field}>
                <Text style={[styles.label, { color: T.textDim }]}>E-mail</Text>
                <View style={[styles.inputWrap, { backgroundColor: T.bg, borderColor: T.borderStrong }]}> 
                  <Icon name="mail" size={17} color={T.textFaint} stroke={1.8}/>
                  <TextInput value={email} onChangeText={setEmail} placeholder="voce@email.com" placeholderTextColor={T.textFaint} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" style={[styles.input, { color: T.text }]}/>
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: T.textDim }]}>Senha</Text>
                <View style={[styles.inputWrap, { backgroundColor: T.bg, borderColor: T.borderStrong }]}> 
                  <Icon name="lock" size={17} color={T.textFaint} stroke={1.8}/>
                  <TextInput value={password} onChangeText={setPassword} placeholder="Mínimo de 6 caracteres" placeholderTextColor={T.textFaint} secureTextEntry={!showPassword} autoCapitalize="none" autoComplete={mode === 'signIn' ? 'current-password' : 'new-password'} onSubmitEditing={submit} style={[styles.input, { color: T.text }]}/>
                  <TouchableOpacity onPress={() => setShowPassword((value) => !value)} hitSlop={10}>
                    <Icon name={showPassword ? 'eyeOff' : 'eye'} size={17} color={T.textFaint} stroke={1.8}/>
                  </TouchableOpacity>
                </View>
              </View>

              {!!error && <Text style={[styles.feedback, { color: T.danger }]}>{error}</Text>}
              {!!success && <Text style={[styles.feedback, { color: T.success }]}>{success}</Text>}

              <TouchableOpacity disabled={loading} onPress={submit} activeOpacity={0.85} style={[styles.submit, { backgroundColor: T.accent, opacity: loading ? 0.65 : 1 }]}> 
                {loading ? <ActivityIndicator color={T.accentInk}/> : <Text style={[styles.submitText, { color: T.accentInk }]}>{mode === 'signIn' ? 'Entrar' : 'Criar conta'}</Text>}
              </TouchableOpacity>
            </View>

            <View style={styles.footer}>
              <Icon name="lock" size={13} color={T.textFaint} stroke={1.8}/>
              <Text style={[styles.footerText, { color: T.textFaint }]}>Conexão segura e dados protegidos por usuário</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 }, safeArea: { flex: 1 },
  scroll: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 20, paddingVertical: 32 },
  shell: { width: '100%', maxWidth: 460, alignSelf: 'center' },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28, alignSelf: 'center' },
  brandMark: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  brandLetter: { fontSize: 18, fontWeight: '800' }, brandName: { fontSize: 20, fontWeight: '700', letterSpacing: -0.5 },
  brandCaption: { fontSize: 9, fontWeight: '700', letterSpacing: 1.1, marginTop: 2 },
  card: { borderWidth: 1, borderRadius: 24, padding: 24 }, heading: { alignItems: 'center', marginBottom: 22 },
  securityIcon: { width: 46, height: 46, borderRadius: 15, alignItems: 'center', justifyContent: 'center', marginBottom: 14 },
  title: { fontSize: 23, fontWeight: '700', letterSpacing: -0.7, textAlign: 'center' },
  subtitle: { fontSize: 13, lineHeight: 19, textAlign: 'center', marginTop: 7, maxWidth: 300 },
  tabs: { flexDirection: 'row', padding: 4, borderRadius: 13, marginBottom: 20 },
  tab: { flex: 1, minHeight: 38, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  tabText: { fontSize: 13, fontWeight: '600' }, field: { marginBottom: 15 },
  label: { fontSize: 12, fontWeight: '600', marginBottom: 7, marginLeft: 2 },
  inputWrap: { minHeight: 50, borderWidth: 1, borderRadius: 13, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 15, paddingVertical: 0 }, feedback: { fontSize: 12, lineHeight: 18, marginBottom: 14 },
  submit: { height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginTop: 3 },
  submitText: { fontSize: 15, fontWeight: '700' }, footer: { flexDirection: 'row', gap: 7, justifyContent: 'center', alignItems: 'center', marginTop: 18 },
  footerText: { fontSize: 11 },
});
