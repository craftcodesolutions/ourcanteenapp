import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import axios from 'axios';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const day = date.getDate();
  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
};

export default function TopupsByDatePage() {
  const colorScheme = useColorScheme() ?? 'light';
  const colors = Colors[colorScheme];
  const cardBg = colors.background;
  const textColor = colors.text;
  const dividerColor = colorScheme === 'light' ? '#ececec' : '#232323';
  const itemBg = colorScheme === 'light' ? '#fff' : '#232323';
  const itemShadow = colorScheme === 'light' ? '#000' : '#000';
  const nameColor = colorScheme === 'light' ? '#222' : '#ececec';
  const amountColor = colorScheme === 'light' ? '#555' : '#bbb';
  const summaryBg = colorScheme === 'light' ? '#f2f2f2' : '#222';
  const errorColor = colorScheme === 'light' ? '#d32f2f' : '#ff6b6b';
  const emptyIconColor = colorScheme === 'light' ? '#e0e0e0' : '#333';
  const emptyTextColor = colorScheme === 'light' ? '#888' : '#aaa';
  const router = useRouter();
  const { token, logout } = useAuth();
  const params = useLocalSearchParams();
  const date = params.date as string;

  const [dayData, setDayData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopups = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await axios.get('https://ourcanteennbackend.vercel.app/api/owner/topup', {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        const data = response.data;
        if (data.success) {
          const foundDay = (data.days || []).find((d: any) => d.date === date);
          setDayData(foundDay || null);
        } else {
          setError(data.error || 'Failed to fetch topups.');
        }
      } catch (error: any) {
        console.log(error);
        
        if (error.response?.status === 403) {
          logout();
          router.push("/(auth)/signin");
          return;
        }
        
        setError('Network error.');
      }
      setLoading(false);
    };
    if (token && date) fetchTopups();
  }, [token, date, logout, router]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}> 
        <ActivityIndicator size="large" color={errorColor} />
        <Text style={{ color: textColor, marginTop: 12 }}>Loading topups...</Text>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}> 
        <MaterialIcons name="error-outline" size={48} color={errorColor} style={{ marginBottom: 16 }} />
        <Text style={{ color: textColor, fontSize: 16, textAlign: 'center' }}>{error}</Text>
      </SafeAreaView>
    );
  }

  if (!dayData) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}> 
        <MaterialIcons name="account-balance-wallet" size={64} color={emptyIconColor} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: emptyTextColor }]}>No topups for this day.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}> 
      <View style={styles.headerWrapper}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={24} color={errorColor} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: textColor }]}>Topups for {formatDate(date)}</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <View style={{ flexDirection: 'row', marginLeft: 0, gap: 12, marginTop: 8, marginBottom: 16, paddingHorizontal: 16 }}>
        <View style={{ flex: 1, backgroundColor: summaryBg, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: amountColor, fontSize: 13, fontWeight: '600' }}>Total Topups</Text>
          <Text style={{ color: amountColor, fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{dayData.count}</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: summaryBg, borderRadius: 10, paddingVertical: 12, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={{ color: amountColor, fontSize: 13, fontWeight: '600' }}>Total Amount</Text>
          <Text style={{ color: amountColor, fontSize: 18, fontWeight: 'bold', marginTop: 2 }}>{dayData.totalAmount}</Text>
        </View>
      </View>
      <FlatList
        data={dayData.topups}
        keyExtractor={item => item._id}
        contentContainerStyle={{ paddingBottom: 48 }}
        renderItem={({ item }) => (
          <View style={[styles.topupContainer, { backgroundColor: itemBg, shadowColor: itemShadow }]}> 
            <View style={styles.topupHeader}>
              <Text style={[styles.name, { color: nameColor }]}>{item.name || item.email || item.phoneNumber || item.userId}</Text>
              <Text style={[styles.amount, { color: amountColor }]}>৳{item.amount}</Text>
            </View>
            <Text style={[styles.time, { color: amountColor }]}>Time: {new Date(item.createdAt).toLocaleTimeString()}</Text>
            {/* <Text style={[styles.by, { color: amountColor }]}>By: {item.topupMaker}</Text> */}
          </View>
        )}
        ListEmptyComponent={<Text style={{ color: textColor, textAlign: 'center', marginTop: 30 }}>No topups for this day.</Text>}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 0,
  },
  headerWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
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
  topupContainer: {
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 22,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  topupHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  amount: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  time: {
    fontSize: 13,
    marginBottom: 2,
  },
  by: {
    fontSize: 13,
  },
}); 