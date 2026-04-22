import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform } from 'react-native';
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

if (Platform.OS === 'web' && typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = `html,body,#root{height:100%;display:flex;flex-direction:column;flex:1;}`;
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

interface TabBarProps { state: any; navigation: any; }
function CustomTabBar({ state, navigation }: TabBarProps) {
  const { T } = useAppContext();
  const { bottom } = useSafeAreaInsets();

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
  return (
    <Tab.Navigator tabBar={(props: TabBarProps) => <CustomTabBar {...props}/>} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={HomeScreen}/>
      <Tab.Screen name="Bills" component={BillsScreen}/>
      <Tab.Screen name="Chat" component={ChatScreen}/>
      <Tab.Screen name="Profile" component={ProfileScreen}/>
    </Tab.Navigator>
  );
}

function RootNavigator() {
  const { T, isDark, isLoading, onboarded, setOnboarded } = useAppContext();

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.loading, { backgroundColor: T.bg }]}>
        <StatusBar style={isDark ? 'light' : 'dark'}/>
        <View style={[styles.loadingDot, { backgroundColor: T.accent }]}/>
      </SafeAreaView>
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
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingDot: { width: 8, height: 8, borderRadius: 4 },
  tabBar: {
    flexDirection: 'row', borderTopWidth: 1,
    paddingHorizontal: 8, paddingTop: 8, paddingBottom: 4, gap: 4,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 8, paddingBottom: 4 },
  chatPill: { width: 44, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});
