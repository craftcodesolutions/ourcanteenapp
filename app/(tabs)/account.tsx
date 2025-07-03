import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { LinearGradient } from 'expo-linear-gradient';
import React from "react";
import { ActivityIndicator, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const AVATAR_SIZE = 96;

export default function AccountScreen() {
  const { user, logout, isAuthLoaded } = useAuth();
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const iconColor = Colors[colorScheme].icon;
  const heroBg = colorScheme === 'light' ? '#ffe6eb' : '#18181b';
  const cardOverlayBg = colorScheme === 'light' ? 'rgba(255,255,255,0.98)' : 'rgba(30,30,32,0.98)';
  const avatarBorder = colorScheme === 'light' ? '#fff' : '#232323';
  const dividerColor = colorScheme === 'light' ? '#eee' : '#232323';
  const infoLabelColor = colorScheme === 'light' ? '#888' : '#aaa';
  const infoValueColor = colorScheme === 'light' ? '#222' : '#ececec';
  const heroNameColor = colorScheme === 'light' ? '#222' : '#ececec';
  const heroSubtitleColor = colorScheme === 'light' ? '#888' : '#aaa';

  // Config state for institutes
  const [config, setConfig] = React.useState<{ institutes: { _id: string; name: string }[] }>({ institutes: [] });
  const [configLoading, setConfigLoading] = React.useState(true);

  // Fetch config on mount
  React.useEffect(() => {
    let isMounted = true;
    setConfigLoading(true);
    axios.get('https://ourcanteennbackend.vercel.app/api/owner/config')
      .then(res => {
        if (isMounted) {
          setConfig(res.data);
        }
      })
      .catch(() => { })
      .finally(() => { if (isMounted) setConfigLoading(false); });
    return () => { isMounted = false; };
  }, []);

  // Helper to get institute name
  const getInstituteName = (instituteId: string | undefined) => {
    if (!instituteId) return '-';
    return config.institutes.find(inst => inst._id === instituteId)?.name || instituteId;
  };

  if (!isAuthLoaded) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color={primary} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: cardBg }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, padding: 0 }}>
        {/* Hero Section */}
        <LinearGradient
          colors={colorScheme === 'light' ? ['#ffe6eb', '#fff'] : ['#18181b', '#232323']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={[styles.hero, { backgroundColor: undefined }]}
        >
          <View style={[styles.avatarWrapper, { borderColor: avatarBorder, backgroundColor: cardBg, position: 'absolute', top: 38, zIndex: 10, alignSelf: 'center', shadowOpacity: 0.18, shadowRadius: 16, elevation: 8 }]}>
            <Ionicons name="person-circle" size={AVATAR_SIZE} color={primary} style={{ backgroundColor: 'transparent' }} />
          </View>
          <View style={{ height: AVATAR_SIZE / 2 + 20 }} />
          <ThemedText type="title" style={[styles.heroName, { color: heroNameColor, marginTop: AVATAR_SIZE, fontSize: 26, fontWeight: '800' }]}>{user?.name || 'User'}</ThemedText>
          <ThemedText type="subtitle" style={[styles.heroSubtitle, { color: heroSubtitleColor, fontSize: 16 }]}>{user?.email}</ThemedText>
        </LinearGradient>
        {/* Card Overlay */}
        <ThemedView style={[styles.cardOverlay, { backgroundColor: cardOverlayBg, marginTop: AVATAR_SIZE / 2 - 60, padding: 32, shadowOpacity: 0.16, shadowRadius: 24, elevation: 10 }]}>
          <ThemedText type="subtitle" style={styles.sectionHeader}>Account Details</ThemedText>
          <View style={[styles.divider, { backgroundColor: dividerColor }]} />
          <View style={styles.infoRow}>
            <Ionicons name="call-outline" size={20} color={iconColor} style={styles.icon} />
            <ThemedText style={[styles.infoLabel, { color: infoLabelColor, fontSize: 14 }]}>Phone:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: infoValueColor, fontSize: 14 }]}>{user?.phoneNumber || '-'}</ThemedText>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="school-outline" size={20} color={iconColor} style={styles.icon} />
            <ThemedText style={[styles.infoLabel, { color: infoLabelColor, fontSize: 14 }]}>Institute:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: infoValueColor, fontSize: 13 }]}>{configLoading ? '-' : getInstituteName(user?.institute)}</ThemedText>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="id-card-outline" size={20} color={iconColor} style={styles.icon} />
            <ThemedText style={[styles.infoLabel, { color: infoLabelColor, fontSize: 14 }]}>Student ID:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: infoValueColor, fontSize: 14 }]}>{user?.studentId || '-'}</ThemedText>
          </View>
          <View style={styles.rowDivider} />
          <View style={styles.infoRow}>
            <Ionicons name="star-outline" size={20} color={iconColor} style={styles.icon} />
            <ThemedText style={[styles.infoLabel, { color: infoLabelColor, fontSize: 14 }]}>Role:</ThemedText>
            <ThemedText style={[styles.infoValue, { color: infoValueColor, fontSize: 14 }]}>{user?.isOwner ? 'Owner' : 'User'}</ThemedText>
          </View>
          <TouchableOpacity
            style={[styles.logoutBtn, { backgroundColor: primary, width: '100%', marginTop: 28, shadowOpacity: 0.18, shadowRadius: 12, elevation: 6 }]}
            onPress={logout}
            activeOpacity={0.85}
          >
            <Ionicons name="log-out-outline" size={20} color={colorScheme === 'light' ? '#fff' : '#18181b'} style={{ marginRight: 12 }} />
            <ThemedText style={{ color: colorScheme === 'light' ? '#fff' : '#18181b', fontWeight: '800', fontSize: 16 }}>Logout</ThemedText>
          </TouchableOpacity>
        </ThemedView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 0,
    paddingBottom: 38,
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
    marginBottom: 0,
    zIndex: 2,
    minHeight: 220,
    overflow: 'visible',
  },
  avatarWrapper: {
    width: AVATAR_SIZE + 8,
    height: AVATAR_SIZE + 8,
    borderRadius: (AVATAR_SIZE + 8) / 2,
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 0,
    borderWidth: 4,
    borderColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
  heroName: {
    fontSize: 26,
    fontWeight: '800',
    marginTop: 0,
  },
  heroSubtitle: {
    fontSize: 16,
    marginTop: 2,
    marginBottom: 0,
    fontWeight: '400',
  },
  cardOverlay: {
    marginTop: -AVATAR_SIZE / 2 + 38,
    marginHorizontal: 12,
    borderRadius: 26,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 24,
    elevation: 10,
    zIndex: 3,
  },
  sectionHeader: {
    fontWeight: '800',
    marginBottom: 16,
    color: '#DC143C',
    fontSize: 20,
    letterSpacing: 0.2,
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 18,
    marginTop: 2,
    opacity: 0.7,
  },
  rowDivider: {
    height: 1,
    backgroundColor: '#eee',
    opacity: 0.3,
    marginVertical: 6,
    marginLeft: 36,
    borderRadius: 2,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 0,
    paddingVertical: 10,
  },
  infoLabel: {
    fontWeight: '600',
    fontSize: 16,
    marginRight: 8,
    color: '#888',
    minWidth: 100,
  },
  infoValue: {
    fontSize: 16,
    color: '#222',
    flex: 1,
    fontWeight: '500',
  },
  icon: {
    marginRight: 10,
  },
  logoutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 14,
    paddingVertical: 10,
    marginBottom: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 6,
    width: '100%',
    alignSelf: 'center',
    marginTop: 28,
  },
});