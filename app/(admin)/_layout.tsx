import { useColorScheme } from '@/hooks/useColorScheme';
import { Tabs, Redirect } from 'expo-router';
import React, { useState } from 'react';
import { LayoutChangeEvent, StyleSheet, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';

import { HapticTab } from '@/components/HapticTab';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';

// Custom Tab Bar with Animated Indicator
type CustomTabBarProps = {
  state: any;
  descriptors: any;
  navigation: any;
  position?: any;
};

type Layout = { x: number; width: number };

function CustomTabBar({ state, descriptors, navigation, position }: CustomTabBarProps) {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const insets = useSafeAreaInsets();

  // Theme colors
  const tabBarBg = isDark ? '#18181b' : '#fff';
  // const borderColor = isDark ? '#27272a' : '#eee';
  const indicatorColor = isDark ? '#f43f5e' : 'red';
  const textActive = isDark ? '#f43f5e' : 'red';
  const textInactive = isDark ? '#a1a1aa' : '#888';

  const TAB_HORIZONTAL_PADDING = 16; // px
  const [layout, setLayout] = useState<Layout[]>(Array(state.routes.length).fill({ x: 0, width: 0 }));
  const indicatorLeft = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);

  React.useEffect(() => {
    if (layout[state.index]) {
      // Indicator is 50% of tab width, centered
      const indicatorW = layout[state.index].width * 0.5;
      const indicatorL = layout[state.index].x + (layout[state.index].width - indicatorW) / 2;
      indicatorLeft.value = withTiming(indicatorL, { duration: 250 });
      indicatorWidth.value = withTiming(indicatorW, { duration: 250 });
    }
  }, [state.index, layout, indicatorLeft, indicatorWidth]);

  const indicatorStyle = useAnimatedStyle(() => ({
    left: indicatorLeft.value,
    width: indicatorWidth.value,
  }));

  return (
    <SafeAreaView edges={["bottom"]} style={[styles.tabBarContainer, { backgroundColor: 'transparent' }]}>
      <View style={[styles.tabBar, {
        backgroundColor: tabBarBg,
        borderTopColor: 'transparent',
        position: 'absolute',
        left: 16,
        right: 16,
        bottom: insets.bottom + 2,
        borderRadius: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
        elevation: 10,
      }]}>
        <Animated.View style={[styles.indicator, { backgroundColor: indicatorColor, shadowColor: indicatorColor }, indicatorStyle]} />
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
                ? options.title
                : route.name;
          const isFocused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };
          return (
            <HapticTab
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? { selected: true } : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={options.tabBarTestID}
              onPress={onPress}
              style={[styles.tabItem, { paddingHorizontal: TAB_HORIZONTAL_PADDING }]}
              onLayout={(e: LayoutChangeEvent) => {
                const { x, width } = e.nativeEvent.layout;
                setLayout(prev => {
                  const next = [...prev];
                  next[index] = { x, width };
                  return next;
                });
              }}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                {options.tabBarIcon
                  ? options.tabBarIcon({ color: isFocused ? textActive : textInactive, size: 20 })
                  : null}
                <Animated.Text
                  style={{
                    marginTop: 4,
                    fontSize: 12,
                    color: isFocused ? textActive : textInactive,
                    fontWeight: isFocused ? 'bold' : 'normal',
                  }}
                >
                  {label}
                </Animated.Text>
              </View>
            </HapticTab>
          );
        })}
      </View>
    </SafeAreaView>
  );
}

export default function TabLayout() {
  const { user, isAuthLoaded } = useAuth();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const tabBarBg = isDark ? '#18181b' : '#fff';
  const borderColor = isDark ? '#27272a' : '#eee';

  // Authentication guard for admin routes
  if (!isAuthLoaded) {
    return null; // Show loading
  }

  if (!user) {
    return <Redirect href="/(auth)/signin" />;
  }

  // Check if user is an owner
  if (!user.isOwner) {
    // Redirect based on user type
    if (user.staff && user.staff.isStaff) {
      return <Redirect href="/(staff)/manage" />;
    } else {
      return <Redirect href="/(tabs)" />;
    }
  }

  return (
    <Tabs
      tabBar={props => <CustomTabBar {...props} />}
      screenOptions={{
        tabBarActiveTintColor: isDark ? '#f43f5e' : 'red',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: tabBarBg,
          borderTopWidth: 1,
          borderTopColor: borderColor,
          height: 56,
        },
      }}>

      <Tabs.Screen
        name="restaurants"
        options={{
          title: 'Canteen',
          tabBarIcon: ({ color }) => <MaterialIcons name="restaurant" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="menu"
        options={{
          title: 'Menu',
          tabBarIcon: ({ color }) => <MaterialIcons name="menu-book" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="manage"
        options={{
          title: 'Manage',
          tabBarIcon: ({ color }) => <MaterialIcons name="dns" size={18} color={color} />,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: 'Account',
          tabBarIcon: ({ color }) => <FontAwesome name="user" size={18} color={color} />,
        }}
      />

    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    width: '100%',
    backgroundColor: 'transparent',
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    pointerEvents: 'box-none',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    height: 56,
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  tabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    minWidth: 80,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'red',
    zIndex: 2,
    shadowColor: 'red',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
});
