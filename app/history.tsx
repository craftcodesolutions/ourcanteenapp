import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import axios from 'axios';

interface Loan {
  _id: string;
  loanApprover: string;
  restaurantId: string;
  restaurantName: string;
  userId: string;
  orderId: string;
  customerInfo: {
    name: string;
    phoneNumber: string;
    email: string;
    studentId?: string;
  };
  loanAmount: number;
  orderTotal: number;
  status: 'ACTIVE' | 'PAID' | 'CANCELLED';
  approvedAt: string;
  createdAt: string;
  updatedAt: string;
  description: string;
  paymentMethod: string;
  paidAt?: string;
  cancelledAt?: string;
  notes?: string;
}

interface Topup {
  _id: string;
  topupMaker: string;
  userId: string;
  name: string;
  phoneNumber: string;
  email: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  approvedAt?: string;
  notes?: string;
}

interface LoanStats {
  active: { count: number; totalAmount: number };
  paid: { count: number; totalAmount: number };
  cancelled: { count: number; totalAmount: number };
  total: { count: number; totalAmount: number };
}

interface TopupStats {
  pending: { count: number; totalAmount: number };
  approved: { count: number; totalAmount: number };
  rejected: { count: number; totalAmount: number };
  total: { count: number; totalAmount: number };
}

export default function HistoryScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [topups, setTopups] = useState<Topup[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [loanStats, setLoanStats] = useState<LoanStats | null>(null);
  const [topupStats, setTopupStats] = useState<TopupStats | null>(null);
  const [selectedItem, setSelectedItem] = useState<Loan | Topup | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [initialized, setInitialized] = useState(false);
  
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const fetchHistory = async (reset = false) => {
    // Don't fetch if we don't have a token yet
    if (!token) {
      console.log('No token available, skipping fetch');
      setLoading(false);
      return;
    }

    try {
      // Set loading state for initial loads or resets
      if (reset || !initialized) {
        setLoading(true);
      }

      if (reset) {
        setPage(1);
        setHasMore(true);
      }
      
      const statusParam = selectedStatus === 'ALL' ? '' : selectedStatus;
      const currentPage = reset ? 1 : page;
      
      console.log('Fetching history:', { 
        type: selectedType, 
        status: statusParam, 
        page: currentPage,
        token: token ? 'present' : 'missing'
      });

      const response = await axios.get(
        `https://ourcanteennbackend.vercel.app/api/user/history?type=${selectedType}&status=${statusParam}&page=${currentPage}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      console.log('History response:', response.data,"hshhshhshhshhshshhshhsh", response.data.data.topups);

      if (response.data.success) {
        const { loans: newLoans, topups: newTopups, statistics } = response.data.data;
        
        if (reset) {
          setLoans(newLoans || []);
          setTopups(newTopups || []);
        } else {
          setLoans(prev => [...prev, ...(newLoans || [])]);
          setTopups(prev => [...prev, ...(newTopups || [])]);
        }
        
        setLoanStats(statistics.loans);
        setTopupStats(statistics.topups);
        setHasMore(response.data.data.pagination.currentPage < response.data.data.pagination.totalPages);
        
        if (!reset) {
          setPage(prev => prev + 1);
        }

        setInitialized(true);
      }
    } catch (err: any) {
      console.error('Error fetching history:', err);
      if (err.response?.status === 403 || err.response?.status === 401) {
        logout();
        router.push("/(auth)/signin");
      } else {
        Alert.alert('Error', err.response?.data?.error || 'Failed to fetch history');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchHistory(false);
    }
  };

  // Initial load when token becomes available
  useEffect(() => {
    if (token && !initialized) {
      fetchHistory(true);
    }
  }, [token]);

  // Refetch when filters change, but only if already initialized
  useEffect(() => {
    if (initialized && token) {
      fetchHistory(true);
    }
  }, [selectedType, selectedStatus]);

  const getStatusColor = (status: string, type: 'loan' | 'topup') => {
    if (type === 'loan') {
      switch (status) {
        case 'ACTIVE': return '#ff6b35';
        case 'PAID': return '#4CAF50';
        case 'CANCELLED': return '#f44336';
        default: return theme.text;
      }
    } else {
      switch (status) {
        case 'pending': return '#ff9800';
        case 'approved': return '#4CAF50';
        case 'rejected': return '#f44336';
        default: return theme.text;
      }
    }
  };

  const getStatusIcon = (status: string, type: 'loan' | 'topup') => {
    if (type === 'loan') {
      switch (status) {
        case 'ACTIVE': return 'pending';
        case 'PAID': return 'check-circle';
        case 'CANCELLED': return 'cancel';
        default: return 'help';
      }
    } else {
      switch (status) {
        case 'pending': return 'hourglass-empty';
        case 'approved': return 'check-circle';
        case 'rejected': return 'cancel';
        default: return 'help';
      }
    }
  };

  // Combine and sort loans and topups by date
  const getCombinedData = () => {
    const combinedData: Array<(Loan | Topup) & { itemType: 'loan' | 'topup' }> = [];
    
    if (selectedType === 'ALL' || selectedType === 'LOANS') {
      loans.forEach(loan => combinedData.push({ ...loan, itemType: 'loan' }));
    }
    
    if (selectedType === 'ALL' || selectedType === 'TOPUPS') {
      topups.forEach(topup => combinedData.push({ ...topup, itemType: 'topup' }));
    }
    
    return combinedData.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  };

  const renderHistoryItem = ({ item }: { item: (Loan | Topup) & { itemType: 'loan' | 'topup' } }) => {
    const isLoan = item.itemType === 'loan';
    const loan = isLoan ? item as Loan : null;
    const topup = !isLoan ? item as Topup : null;

    return (
      <TouchableOpacity
        style={[styles.historyCard, { 
          backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
          borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
        }]}
        onPress={() => {
          setSelectedItem(item);
          setModalVisible(true);
        }}
      >
        <View style={styles.cardHeader}>
          <View style={styles.cardInfo}>
            <View style={styles.typeIndicator}>
              <MaterialIcons 
                name={isLoan ? 'account-balance-wallet' : 'add-card'} 
                size={18} 
                color={isLoan ? '#ff6b35' : '#9C27B0'} 
              />
              <Text style={[styles.typeText, { color: isLoan ? '#ff6b35' : '#9C27B0' }]}>
                {isLoan ? 'LOAN' : 'TOPUP'}
              </Text>
            </View>
            {isLoan && (
              <Text style={[styles.restaurantName, { color: theme.text }]}>
                {loan?.restaurantName || 'Unknown Restaurant'}
              </Text>
            )}
          </View>
          <View style={styles.statusBadge}>
            <MaterialIcons 
              name={getStatusIcon(isLoan ? loan!.status : topup!.status, item.itemType) as any} 
              size={16} 
              color={getStatusColor(isLoan ? loan!.status : topup!.status, item.itemType)} 
            />
            <Text style={[styles.statusText, { 
              color: getStatusColor(isLoan ? loan!.status : topup!.status, item.itemType) 
            }]}>
              {isLoan ? loan!.status : topup!.status.toUpperCase()}
            </Text>
          </View>
        </View>
        
        <View style={styles.cardDetails}>
          <View style={styles.amountRow}>
            <Text style={[styles.amount, { color: isLoan ? '#ff6b35' : '#9C27B0' }]}>
              ৳{(isLoan ? loan!.loanAmount : topup!.amount).toFixed(2)}
            </Text>
            <Text style={[styles.date, { color: theme.tabIconDefault }]}>
              {new Date(item.createdAt).toLocaleDateString()}
            </Text>
          </View>
          
          {isLoan && loan!.orderId && (
            <Text style={[styles.orderId, { color: theme.tabIconDefault }]}>
              Order #{loan!.orderId.slice(-8).toUpperCase()}
            </Text>
          )}
        </View>
        
        <MaterialIcons name="chevron-right" size={20} color={theme.tabIconDefault} style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const StatCard = ({ title, count, amount, color }: { title: string; count: number; amount: number; color: string }) => (
    <View style={[styles.statCard, { 
      backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
    }]}>
      <Text style={[styles.statTitle, { color: theme.tabIconDefault }]}>{title}</Text>
      <Text style={[styles.statCount, { color: color }]}>{count}</Text>
      <Text style={[styles.statAmount, { color: theme.text }]}>৳{amount.toFixed(2)}</Text>
    </View>
  );

  // Show loading screen during initial load
  if (loading && !initialized) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8e24aa" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading history...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Show loading if no token yet
  if (!token) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8e24aa" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Authenticating...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={[styles.header, { 
        backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
        borderBottomColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
      }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Transaction History</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Statistics */}
      {(loanStats || topupStats) && (
        <View style={styles.statsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {loanStats && (
              <>
                <StatCard title="Total Loans" count={loanStats.total.count} amount={loanStats.total.totalAmount} color="#ff6b35" />
                <StatCard title="Active Loans" count={loanStats.active.count} amount={loanStats.active.totalAmount} color="#ff6b35" />
                <StatCard title="Paid Loans" count={loanStats.paid.count} amount={loanStats.paid.totalAmount} color="#4CAF50" />
              </>
            )}
            {topupStats && (
              <>
                <StatCard title="Total Topups" count={topupStats.total.count} amount={topupStats.total.totalAmount} color="#9C27B0" />
                <StatCard title="Approved" count={topupStats.approved.count} amount={topupStats.approved.totalAmount} color="#4CAF50" />
                <StatCard title="Pending" count={topupStats.pending.count} amount={topupStats.pending.totalAmount} color="#ff9800" />
              </>
            )}
          </ScrollView>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'LOANS', 'TOPUPS'].map((type) => (
            <TouchableOpacity
              key={type}
              style={[
                styles.filterTab,
                selectedType === type && styles.activeFilterTab,
                { 
                  backgroundColor: selectedType === type ? '#8e24aa' : 'transparent',
                  borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
                }
              ]}
              onPress={() => setSelectedType(type)}
            >
              <Text style={[
                styles.filterTabText,
                { color: selectedType === type ? '#fff' : theme.text }
              ]}>
                {type === 'ALL' ? 'All History' : type}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Status Filter for Loans */}
      {selectedType === 'LOANS' && (
        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['', 'ACTIVE', 'PAID', 'CANCELLED'].map((status) => (
              <TouchableOpacity
                key={status}
                style={[
                  styles.filterTab,
                  selectedStatus === status && styles.activeFilterTab,
                  { 
                    backgroundColor: selectedStatus === status ? '#ff6b35' : 'transparent',
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
                  }
                ]}
                onPress={() => setSelectedStatus(status)}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: selectedStatus === status ? '#fff' : theme.text }
                ]}>
                  {status === '' ? 'All Loans' : status}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}

      {/* History List */}
      <FlatList
        data={getCombinedData()}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => `${item.itemType}-${item._id}`}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loading && initialized ? (
            <ActivityIndicator size="small" color="#8e24aa" style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          !loading ? (
            <View style={styles.emptyContainer}>
              <MaterialIcons name="history" size={64} color={theme.tabIconDefault} />
              <Text style={[styles.emptyText, { color: theme.text }]}>No history found</Text>
              <Text style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>
                Your loans and topups will appear here
              </Text>
            </View>
          ) : null
        }
      />

      {/* Loading Overlay for filter changes */}
      {loading && initialized && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#8e24aa" />
          <Text style={[styles.loadingText, { color: theme.text, marginTop: 8 }]}>
            Updating history...
          </Text>
        </View>
      )}

      {/* Detail Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, { 
            backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a' 
          }]}>
            {selectedItem && (
              <>
                <View style={[styles.modalHeader, { 
                  borderBottomColor: colorScheme === 'light' ? '#e0e0e0' : '#333' 
                }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>
                    {(selectedItem as any).itemType === 'loan' ? 'Loan Details' : 'Topup Details'}
                  </Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalContent}>
                  <View style={[styles.detailSection, { 
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                  }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>
                      {(selectedItem as any).itemType === 'loan' ? 'Loan Information' : 'Topup Information'}
                    </Text>
                    
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Amount:</Text>
                      <Text style={[styles.infoValue, { 
                        color: (selectedItem as any).itemType === 'loan' ? '#ff6b35' : '#9C27B0', 
                        fontWeight: 'bold' 
                      }]}>
                        ৳{((selectedItem as any).itemType === 'loan' ? 
                          (selectedItem as Loan).loanAmount : 
                          (selectedItem as Topup).amount
                        ).toFixed(2)}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Status:</Text>
                      <Text style={[styles.infoValue, { 
                        color: getStatusColor(
                          (selectedItem as any).itemType === 'loan' ? 
                            (selectedItem as Loan).status : 
                            (selectedItem as Topup).status, 
                          (selectedItem as any).itemType
                        ), 
                        fontWeight: 'bold' 
                      }]}>
                        {(selectedItem as any).itemType === 'loan' ? 
                          (selectedItem as Loan).status : 
                          (selectedItem as Topup).status.toUpperCase()}
                      </Text>
                    </View>
                    
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Created:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>
                        {new Date(selectedItem.createdAt).toLocaleString()}
                      </Text>
                    </View>

                    {(selectedItem as any).itemType === 'loan' && (
                      <>
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Restaurant:</Text>
                          <Text style={[styles.infoValue, { color: theme.text }]}>
                            {(selectedItem as Loan).restaurantName}
                          </Text>
                        </View>
                        
                        <View style={styles.infoRow}>
                          <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Order ID:</Text>
                          <Text style={[styles.infoValue, { color: theme.text }]}>
                            #{(selectedItem as Loan).orderId.slice(-8).toUpperCase()}
                          </Text>
                        </View>
                      </>
                    )}

                    {selectedItem.notes && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Notes:</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>
                          {selectedItem.notes}
                        </Text>
                      </View>
                    )}
                  </View>
                </ScrollView>
              </>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  statsContainer: {
    paddingVertical: 16,
  },
  statCard: {
    marginHorizontal: 8,
    marginLeft: 16,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 120,
    alignItems: 'center',
  },
  statTitle: {
    fontSize: 12,
    marginBottom: 4,
  },
  statCount: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  filterContainer: {
    paddingVertical: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    marginLeft: 16,
    borderRadius: 20,
    borderWidth: 1,
  },
  activeFilterTab: {
    borderWidth: 0,
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '600',
  },
  listContainer: {
    padding: 16,
  },
  historyCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardHeader: {
    flex: 1,
  },
  cardInfo: {
    marginBottom: 12,
  },
  typeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  typeText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 6,
  },
  restaurantName: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  cardDetails: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  amount: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  date: {
    fontSize: 12,
  },
  orderId: {
    fontSize: 12,
  },
  chevron: {
    marginLeft: 8,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 32,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxHeight: '80%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 16,
  },
  detailSection: {
    borderRadius: 8,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 14,
    flex: 1,
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 2,
    textAlign: 'right',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
});
