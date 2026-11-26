import { Tabs } from 'expo-router';

import { TabIcon, type TabIconName } from '@/components/TabIcon';
import { navigationCopy as copy } from '@/content/navigation';
import { colors, minTouchTarget } from '@/design/tokens';
import { useReducedMotion } from '@/design/useReducedMotion';

const TABS: { name: string; title: string; icon: TabIconName }[] = [
  { name: 'index', title: copy.tabToday, icon: 'today' },
  { name: 'progress', title: copy.tabProgress, icon: 'progress' },
  { name: 'community', title: copy.tabCommunity, icon: 'community' },
  { name: 'settings', title: copy.tabSettings, icon: 'settings' },
];

/**
 * The signed-in home base (#149): a calm bottom tab bar for the four places
 * people return to. Everything else pushes over it from the (app) stack. It sits
 * inside the protected (app) group, so the auth guard is unchanged.
 */
export default function TabsLayout() {
  const reduceMotion = useReducedMotion();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        animation: reduceMotion ? 'none' : 'fade',
        tabBarActiveTintColor: colors.terracotta,
        tabBarInactiveTintColor: colors.plum,
        tabBarHideOnKeyboard: true,
        tabBarAllowFontScaling: true,
        tabBarLabelStyle: { fontFamily: 'Manrope', fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.ivory,
          borderTopColor: colors.mutedSage,
          minHeight: minTouchTarget + 8,
        },
        sceneStyle: { backgroundColor: colors.ivory },
      }}
    >
      {TABS.map((tab) => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarAccessibilityLabel: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <TabIcon name={tab.icon} color={color} focused={focused} />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}
