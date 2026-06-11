import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppProvider, useAppContext } from './src/context/AppContext';
import { Icon } from './src/components/ui/Icon';

import { OnboardingScreen } from './src/screens/OnboardingScreen';
import { HomeScreen } from './src/screens/HomeScreen';
import { BillsScreen } from './src/screens/BillsScreen';
import { BillDetailScreen } from './src/screens/BillDetailScreen';
import { ChatScreen } from './src/screens/ChatScreen';
import { SummaryScreen } from './src/screens/SummaryScreen';
import { ProfileScreen } from './src/screens/ProfileScreen';
import { ExampleCommandsScreen } from './src/screens/ExampleCommandsScreen';
import { AuthScreen } from './src/screens/AuthScreen';
import { LandingScreen } from './src/screens/LandingScreen';

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `
    html,body,#root{height:100%;display:flex;flex-direction:column;flex:1;}
    body{margin:0;overscroll-behavior:none;}
    *{box-sizing:border-box;}
    button,[role="button"]{cursor:pointer;}
    ::selection{background:#C5FF4D;color:#0A0A0B;}
  `;
  document.head.appendChild(style);
}

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TAB_DEFS = [
  { name: 'Home',    label: 'Início',  icon: 'home2' },
  { name: 'Bills',   label: 'Contas',  icon: 'list' },
  { name: 'Chat',    label: 'Chat',    icon: 'sparkle' },
  { name: 'Profile', label: 'Perfil',  icon: 'user' },
];

interface TabBarProps { state: any; navigation: any; desktop?: boolean; }
function CustomTabBar({ state, navigation, desktop = false }: TabBarProps) {
  const { T } = useAppContext();
  const { bottom } = useSafeAreaInsets();

  if (desktop) {
    return (
      <View style={[styles.desktopSidebar, { backgroundColor: T.bg, borderRightColor: T.border }]}>
        <View style={styles.brandRow}>
          <View style={[styles.brandMark, { backgroundColor: T.accent }]}>
            <Text style={{ color: T.accentInk, fontWeight: '800', fontSize: 15 }}>C</Text>
          </View>
          <View>
            <Text style={{ color: T.text, fontWeight: '700', fontSize: 17, letterSpacing: -0.5 }}>Contas</Text>
            <Text style={{ color: T.textFaint, fontSize: 10, marginTop: 2, letterSpacing: 0.7, textTransform: 'uppercase' }}>
              Finanças pessoais
            </Text>
          </View>
        </View>

        <View style={styles.desktopNav}>
          <Text style={[styles.navLabel, { color: T.textFaint }]}>Navegação</Text>
          {state.routes.map((route: any, index: number) => {
            const tab = TAB_DEFS.find(t => t.name === route.name) || TAB_DEFS[0];
            const isActive = state.index === index;
            return (
              <TouchableOpacity
                key={route.key}
                activeOpacity={0.75}
                onPress={() => navigation.navigate(route.name)}
                style={[
                  styles.desktopNavItem,
                  { backgroundColor: isActive ? T.surface : 'transparent' },
                ]}
              >
                <View style={[styles.desktopIcon, { backgroundColor: isActive ? T.accent : T.chipBg }]}>
                  <Icon
                    name={tab.icon}
                    size={17}
                    color={isActive ? T.accentInk : T.textDim}
                    stroke={isActive ? 2.3 : 1.8}
                  />
                </View>
                <Text style={{ flex: 1, color: isActive ? T.text : T.textDim, fontSize: 14, fontWeight: isActive ? '600' : '500' }}>
                  {tab.label}
                </Text>
                {isActive && <View style={[styles.activeDot, { backgroundColor: T.accent }]}/>}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.sidebarFooter, { borderTopColor: T.border }]}>
          <View style={[styles.syncDot, { backgroundColor: T.success }]}/>
          <View style={{ flex: 1 }}>
            <Text style={{ color: T.text, fontSize: 12, fontWeight: '600' }}>Dados sincronizados</Text>
            <Text style={{ color: T.textFaint, fontSize: 10, marginTop: 2 }}>Android e web</Text>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.tabBar, { backgroundColor: T.bg, borderTopColor: T.border, paddingBottom: bottom || 4 }]}>
      {state.routes.map((route: any, index: number) => {
        const tab = TAB_DEFS.find(t => t.name === route.name) || TAB_DEFS[0];
        const isActive = state.index === index;
        const isChat = route.name === 'Chat';

        return (
          <TouchableOpacity
            key={route.key}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(route.name)}
            style={styles.tabItem}
          >
            {isChat ? (
              <View style={[styles.chatPill, { backgroundColor: T.accent }]}>
                <Icon name="sparkle" size={16} color={T.accentInk} stroke={2.5}/>
              </View>
            ) : (
              <Icon name={tab.icon} size={22} color={isActive ? T.text : T.textFaint} stroke={isActive ? 2.2 : 1.8}/>
            )}
            <Text style={{ fontSize: 10, fontWeight: '500', color: isActive ? T.text : T.textFaint, letterSpacing: -0.05, marginTop: 4 }}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  const { T } = useAppContext();
  const { width } = useWindowDimensions();
  const desktop = Platform.OS === 'web' && width >= 900;

  return (
    <View style={[styles.mainShell, { backgroundColor: T.bg, paddingLeft: desktop ? 248 : 0 }]}>
      <View style={[styles.contentShell, desktop && styles.desktopContentShell]}>
        <Tab.Navigator
          tabBar={(props: TabBarProps) => <CustomTabBar {...props} desktop={desktop}/>}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Home" component={HomeScreen}/>
          <Tab.Screen name="Bills" component={BillsScreen}/>
          <Tab.Screen name="Chat" component={ChatScreen}/>
          <Tab.Screen name="Profile" component={ProfileScreen}/>
        </Tab.Navigator>
      </View>
    </View>
  );
}

function RootNavigator() {
  const { T, isDark, isLoading, session, onboarded, setOnboarded } = useAppContext();
  const [showAuth, setShowAuth] = React.useState(Platform.OS !== 'web');

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: T.bg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'}/>
        <View style={[styles.loadingDot, { backgroundColor: T.accent }]}/>
      </SafeAreaView>
    );
  }

  if (!session) {
    return (
      <>
        <StatusBar style={isDark ? 'light' : 'dark'}/>
        {showAuth ? <AuthScreen/> : <LandingScreen onEnter={() => setShowAuth(true)}/>}
      </>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'}/>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {!onboarded ? (
            <Stack.Screen name="Onboarding">
              {() => <OnboardingScreen onDone={setOnboarded}/>}
            </Stack.Screen>
          ) : null}
          <Stack.Screen name="Main" component={MainTabs}/>
          <Stack.Screen name="BillDetail" component={BillDetailScreen}/>
          <Stack.Screen name="Summary" component={SummaryScreen}/>
          <Stack.Screen name="ExampleCommands" component={ExampleCommandsScreen}/>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppProvider>
        <RootNavigator/>
      </AppProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  mainShell: { flex: 1 },
  contentShell: { flex: 1, width: '100%' },
  desktopContentShell: { maxWidth: 1280, alignSelf: 'center' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingDot: { width: 8, height: 8, borderRadius: 4 },
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4, gap: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingBottom: 4 },
  chatPill: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  desktopSidebar: {
    position: 'absolute', left: -248, top: 0, bottom: 0, width: 248,
    borderRightWidth: 1, paddingHorizontal: 16, paddingTop: 24, paddingBottom: 20,
  },
  brandRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 8 },
  brandMark: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  desktopNav: { flex: 1, marginTop: 42, gap: 6 },
  navLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1.2, textTransform: 'uppercase', paddingHorizontal: 12, marginBottom: 8 },
  desktopNavItem: { minHeight: 52, borderRadius: 16, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 10 },
  desktopIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  activeDot: { width: 5, height: 5, borderRadius: 3 },
  sidebarFooter: { borderTopWidth: 1, paddingHorizontal: 8, paddingTop: 18, flexDirection: 'row', alignItems: 'center', gap: 10 },
  syncDot: { width: 7, height: 7, borderRadius: 4 },
});
