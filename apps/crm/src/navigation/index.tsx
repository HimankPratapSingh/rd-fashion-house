// src/navigation/index.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ActivityIndicator,
  useWindowDimensions, TouchableOpacity, Image, Platform, ImageSourcePropType,
} from 'react-native';

const LOGO_SRC: ImageSourcePropType = require('../assets/images/rd_logo.png');
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Colors, Fonts, Shadow } from '../theme';
import { AppUser, AuthStorage } from '../utils/auth';
import { pullAllFromCloud, pushAllToCloud } from '../utils/cloudSync';

import HomeScreen          from '../screens/HomeScreen';
import OrdersScreen        from '../screens/OrdersScreen';
import CustomersScreen     from '../screens/CustomersScreen';
import ReportsScreen       from '../screens/ReportsScreen';
import Step1CustomerScreen from '../screens/Step1CustomerScreen';
import Step2DesignScreen   from '../screens/Step2DesignScreen';
import Step3MeasureScreen  from '../screens/Step3MeasureScreen';
import Step4BillingScreen  from '../screens/Step4BillingScreen';
import BillSlipScreen      from '../screens/BillSlipScreen';
import OrderDetailScreen   from '../screens/OrderDetailScreen';
import KanbanScreen        from '../screens/KanbanScreen';
import FabricScreen        from '../screens/FabricScreen';
import SettingsScreen      from '../screens/SettingsScreen';
import LoginScreen         from '../screens/LoginScreen';
import EmployeesScreen     from '../screens/EmployeesScreen';
import EmployeeDetailScreen from '../screens/EmployeeDetailScreen';
import WorkManagementScreen from '../screens/WorkManagementScreen';
import AddWorkTaskScreen   from '../screens/AddWorkTaskScreen';
import DesignSketchScreen  from '../screens/DesignSketchScreen';
import ReadyMadeScreen     from '../screens/ReadyMadeScreen';
import AddReadyMadeItemScreen from '../screens/AddReadyMadeItemScreen';
import ReadyMadeSaleScreen from '../screens/ReadyMadeSaleScreen';
import AppointmentsScreen  from '../screens/AppointmentsScreen';
import CustomerDetailScreen from '../screens/CustomerDetailScreen';
import PermissionsScreen   from '../screens/PermissionsScreen';
import ExpenseScreen        from '../screens/ExpenseScreen';
import SuppliersScreen      from '../screens/SuppliersScreen';

// ── Auth Context ──────────────────────────────────────────────────────────────
interface AuthCtx {
  user: AppUser | null;
  signIn: (user: AppUser) => void;
  signOut: () => Promise<void>;
}
const AuthContext = createContext<AuthCtx>({ user: null, signIn: () => {}, signOut: async () => {} });
export function useAuth() { return useContext(AuthContext); }

// ── Tab / Stack Setup ─────────────────────────────────────────────────────────
const Tab   = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const TABS = [
  { name: 'Home',      emoji: '🏠', label: 'Home'     },
  { name: 'Orders',    emoji: '✂️',  label: 'Tailoring'},
  { name: 'Kanban',    emoji: '📊', label: 'Board'    },
  { name: 'Customers', emoji: '👥', label: 'CRM'      },
  { name: 'Reports',   emoji: '📈', label: 'Reports'  },
];

function BoutiqueTabBar({ state, navigation }: any) {
  const { width } = useWindowDimensions();
  const isMobile = width < 480;
  const iconBoxW = isMobile ? 44 : 38;
  const iconBoxH = isMobile ? 32 : 28;
  const labelSize = isMobile ? 10 : 9;
  const paddingBottom = isMobile ? 12 : 16;
  const paddingTop = isMobile ? 8 : 6;

  return (
    <View style={[tabStyles.bar, { paddingBottom, paddingTop, width: '100%' }]}>
      {state.routes.map((route: any, i: number) => {
        const tab     = TABS.find(t => t.name === route.name) || TABS[0];
        const focused = state.index === i;
        return (
          <TouchableOpacity
            key={route.key}
            style={tabStyles.tab}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <View style={[tabStyles.iconBox, focused && tabStyles.iconBoxFocused, { width: iconBoxW, height: iconBoxH }]}>
              <Text style={[tabStyles.emoji, focused && tabStyles.emojiFocused]}>{tab.emoji}</Text>
            </View>
            <Text style={[tabStyles.label, focused && tabStyles.labelFocused, { fontSize: labelSize }]}>{tab.label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
      tabBar={props => <BoutiqueTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Home"      component={HomeScreen} />
      <Tab.Screen name="Orders"    component={OrdersScreen} />
      <Tab.Screen name="Kanban"    component={KanbanScreen} />
      <Tab.Screen name="Customers" component={CustomersScreen} />
      <Tab.Screen name="Reports"   component={ReportsScreen} />
    </Tab.Navigator>
  );
}

// ── Splash ────────────────────────────────────────────────────────────────────
function SplashView() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{
        width: 240, height: 120, borderRadius: 16,
        borderWidth: 1.5, borderColor: 'rgba(201,168,76,0.4)',
        backgroundColor: '#F5F3EF',
        alignItems: 'center', justifyContent: 'center',
        marginBottom: 32, overflow: 'hidden',
      }}>
        <Image
          source={LOGO_SRC}
          style={{ width: 230, height: 110 }}
          resizeMode="contain"
        />
      </View>
      <ActivityIndicator color={Colors.gold} size="small" />
    </View>
  );
}

// ── Root Navigator ────────────────────────────────────────────────────────────
export default function AppNavigator() {
  const [user,    setUser]    = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AuthStorage.getCurrentSession().then(async u => {
      setUser(u);
      // On startup: push local data first (so nothing is lost), then pull cloud data
      if (u) pushAllToCloud().catch(() => {}).finally(() => pullAllFromCloud().catch(() => {}));
      setLoading(false);
    });
  }, []);

  const signIn  = (u: AppUser) => setUser(u);
  const signOut = async () => { await AuthStorage.logout(); setUser(null); };

  if (loading) return <SplashView />;

  return (
    <AuthContext.Provider value={{ user, signIn, signOut }}>
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
          {!user ? (
            <Stack.Screen name="Login" component={LoginScreen} />
          ) : (
            <>
              <Stack.Screen name="MainTabs"       component={MainTabs} />
              <Stack.Screen name="NewOrder"        component={Step1CustomerScreen} />
              <Stack.Screen name="Step2Design"     component={Step2DesignScreen} />
              <Stack.Screen name="Step3Measure"    component={Step3MeasureScreen} />
              <Stack.Screen name="Step4Billing"    component={Step4BillingScreen} />
              <Stack.Screen name="BillSlip"        component={BillSlipScreen}        options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="OrderDetail"     component={OrderDetailScreen} />
              <Stack.Screen name="Fabric"          component={FabricScreen} />
              <Stack.Screen name="Settings"        component={SettingsScreen} />
              <Stack.Screen name="Employees"       component={EmployeesScreen} />
              <Stack.Screen name="EmployeeDetail"  component={EmployeeDetailScreen} />
              <Stack.Screen name="WorkManagement"  component={WorkManagementScreen} />
              <Stack.Screen name="AddWorkTask"     component={AddWorkTaskScreen} />
              <Stack.Screen name="DesignSketch"    component={DesignSketchScreen}    options={{ animation: 'slide_from_bottom' }} />
              <Stack.Screen name="ReadyMade"       component={ReadyMadeScreen} />
              <Stack.Screen name="AddReadyMadeItem" component={AddReadyMadeItemScreen} />
              <Stack.Screen name="ReadyMadeSale"   component={ReadyMadeSaleScreen} />
              <Stack.Screen name="Appointments"    component={AppointmentsScreen} />
              <Stack.Screen name="CustomerDetail"  component={CustomerDetailScreen} />
              <Stack.Screen name="Permissions"     component={PermissionsScreen} />
              <Stack.Screen name="Expenses"        component={ExpenseScreen} />
              <Stack.Screen name="Suppliers"       component={SuppliersScreen} />
            </>
          )}
        </Stack.Navigator>
      </NavigationContainer>
    </AuthContext.Provider>
  );
}

// ── Boutique Tab Bar Styles ───────────────────────────────────────────────────
const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: Colors.dark,
    borderTopWidth: 1,
    borderTopColor: 'rgba(201,168,76,0.18)',
    ...Shadow.deep,
  },
  tab: {
    flex: 1, alignItems: 'center', gap: 3,
  },
  iconBox: {
    alignItems: 'center', justifyContent: 'center',
    borderRadius: 10,
  },
  iconBoxFocused: {
    backgroundColor: 'rgba(201,168,76,0.15)',
  },
  emoji: {
    fontSize: 20,
    opacity: 0.4,
  },
  emojiFocused: { opacity: 1 },
  label: {
    fontFamily: Fonts.bodyBold,
    color: 'rgba(255,255,255,0.35)',
    letterSpacing: 0.3,
  },
  labelFocused: {
    color: Colors.gold,
  },
});
