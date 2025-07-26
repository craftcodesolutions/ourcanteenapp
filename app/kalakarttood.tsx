import { Colors } from "@/constants/Colors";
import { useAuth } from "@/context/AuthContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface MemberInfo {
  id: string;
  isActive: boolean;
  title: string;
  name: string;
  email: string;
  phoneNumber: string;
}

interface TopupTrack {
  _id: string;
  topupMaker: string;
  amount: number;
  createdAt: string;
}

interface OrderTrack {
  _id: string;
  succeededBy: string;
  amount: number;
  updatedAt: string;
}

interface MemberDayData {
  info: MemberInfo;
  topupTracks: TopupTrack[];
  ordersTracks: OrderTrack[];
  topupStat: { count: number; amount: number };
  orderStat: { count: number; amount: number };
}

interface CategorizedByDate {
  [date: string]: {
    [memberId: string]: MemberDayData;
  };
}

const KalakarToodPage = () => {
  const { token, isAuthLoaded, logout } = useAuth();
  const [categorizedByDate, setCategorizedByDate] = useState<CategorizedByDate>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const colorScheme = useColorScheme() ?? 'light';
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const dividerColor = colorScheme === 'light' ? '#ececec' : '#232323';
  const itemBg = colorScheme === 'light' ? '#fff' : '#232323';
  const itemShadow = colorScheme === 'light' ? '#000' : '#000';
  const nameColor = colorScheme === 'light' ? '#222' : '#ececec';
  const statColor = colorScheme === 'light' ? '#555' : '#bbb';
  const statusColor = colorScheme === 'light' ? '#DC143C' : '#fff';
  const emptyIconColor = colorScheme === 'light' ? '#e0e0e0' : '#333';
  const emptyTextColor = colorScheme === 'light' ? '#888' : '#aaa';
  const router = useRouter();

  useEffect(() => {
    if (!isAuthLoaded) return;
    if (!token) {
      setError('You must be logged in to view this page.');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    axios.get('https://ourcanteennbackend.vercel.app/api/owner/accounts', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })
      .then((response) => {

        console.log(JSON.stringify(response.data))
        setCategorizedByDate(response.data.categorizedByDate || {});
        setLoading(false);
      })
      .catch((error) => {

        if (error.response?.status === 403) {
          logout();
          router.push("/(auth)/signin");
        } else {
          const errorMessage = error.response?.data?.message || error.response?.data || error.message || 'Failed to fetch data';
          setError(typeof errorMessage === 'string' ? errorMessage : 'Failed to fetch data');
          setLoading(false);
        }
      });
  }, [token, isAuthLoaded, logout, router]);

  const dateKeys = Object.keys(categorizedByDate).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}>
        <ActivityIndicator size="large" color={statusColor} />
        <Text style={{ color: textColor, marginTop: 12 }}>Loading data...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}>
        <MaterialIcons name="error-outline" size={48} color={statusColor} style={{ marginBottom: 16 }} />
        <Text style={{ color: textColor, fontSize: 16, textAlign: 'center' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!dateKeys.length) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}>
        <MaterialIcons name="receipt" size={64} color={emptyIconColor} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: emptyTextColor }]}>No transactions found.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}>
      <View style={[styles.headerWrapper, { flexDirection: 'row', alignItems: 'center' }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <MaterialIcons name="arrow-back" size={24} color={statusColor} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: textColor }]}>Top-ups & Orders by Date</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <FlatList
        data={dateKeys}
        keyExtractor={(date) => date}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 48 }}
        renderItem={({ item: date }) => {
          const members = Object.values(categorizedByDate[date]);
          // Sum stats for all members
          const totalTopupCount = members.reduce((sum, m) => sum + (m.topupStat?.count || 0), 0);
          const totalTopupAmount = members.reduce((sum, m) => sum + (m.topupStat?.amount || 0), 0);
          const totalOrderCount = members.reduce((sum, m) => sum + (m.orderStat?.count || 0), 0);
          const totalOrderAmount = members.reduce((sum, m) => sum + (m.orderStat?.amount || 0), 0);
          // Format date as '12 March 2025'
          const dateObj = new Date(date + 'T00:00:00');
          const monthNames = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
          const formattedDate = `${dateObj.getDate()} ${monthNames[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
          return (
            <TouchableOpacity
              onPress={() => router.push({ pathname: '/kalakarttood/[date]', params: { date } })}
              style={{ marginBottom: 18, marginHorizontal: 12, borderRadius: 14, backgroundColor: itemBg, shadowColor: itemShadow, shadowOpacity: 0.07, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2, padding: 16 }}
              activeOpacity={0.85}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                <MaterialIcons name="calendar-today" size={20} color={statusColor} style={{ marginRight: 8 }} />
                <Text style={{ color: nameColor, fontSize: 18, fontWeight: 'bold' }}>{formattedDate}</Text>
              </View>
              <View style={{ flexDirection: 'row', marginLeft: 0, gap: 12, marginTop: 8 }}>
                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#e6f7ff' : '#1e2a3a', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: statColor, fontSize: 13, fontWeight: '600' }}>Top-ups</Text>
                  <Text style={{ color: statColor, fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>{totalTopupCount} / ৳{totalTopupAmount}</Text>
                </View>
                <View style={{ flex: 1, backgroundColor: colorScheme === 'light' ? '#fffbe6' : '#333', borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ color: statColor, fontSize: 13, fontWeight: '600' }}>Orders</Text>
                  <Text style={{ color: statColor, fontSize: 15, fontWeight: 'bold', marginTop: 2 }}>{totalOrderCount} / ৳{totalOrderAmount}</Text>
                </View>
              </View>
            </TouchableOpacity>
          );
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  headerWrapper: {
    paddingTop: 18,
    paddingBottom: 8,
    paddingHorizontal: 24,
    backgroundColor: 'transparent',
  },
  pageTitle: {
    fontSize: 22,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  divider: {
    height: 1.5,
    width: '100%',
    marginBottom: 2,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 18,
    marginTop: 8,
  },
});

export default KalakarToodPage;
