import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Alert,
  RefreshControl,
  FlatList,
  TextInput
} from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useAuth } from '@/context/AuthContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Colors } from '@/constants/Colors';
import axios from 'axios';

interface Loan {
  _id: string;
  loanApprover: string;
  restaurantId: string;
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

interface LoanStats {
  active: { count: number; totalAmount: number };
  paid: { count: number; totalAmount: number };
  cancelled: { count: number; totalAmount: number };
  total: { count: number; totalAmount: number };
}

export default function LoansScreen() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<Loan | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [updateModalVisible, setUpdateModalVisible] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [notes, setNotes] = useState('');
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  
  const router = useRouter();
  const { user, token, logout } = useAuth();
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme ?? 'light'];

  const fetchLoans = async (reset = false) => {
    try {
      if (reset) {
        setPage(1);
        setHasMore(true);
      }
      
      const statusParam = selectedStatus === 'ALL' ? '' : selectedStatus;
      const currentPage = reset ? 1 : page;
      
      const response = await axios.get(
        `https://ourcanteennbackend.vercel.app/api/owner/loans?status=${statusParam}&page=${currentPage}&limit=20`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        if (reset) {
          setLoans(response.data.loans);
        } else {
          setLoans(prev => [...prev, ...response.data.loans]);
        }
        setStats(response.data.statistics);
        setHasMore(response.data.pagination.currentPage < response.data.pagination.totalPages);
        if (!reset) {
          setPage(prev => prev + 1);
        }
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else {
        console.error('Error fetching loans:', err);
        Alert.alert('Error', 'Failed to fetch loans');
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchLoans(true);
  };

  const loadMore = () => {
    if (!loading && hasMore) {
      fetchLoans(false);
    }
  };

  useEffect(() => {
    fetchLoans(true);
  }, [selectedStatus]);

  const handleUpdateLoan = async (status: 'PAID' | 'CANCELLED') => {
    if (!selectedLoan) return;
    
    setUpdating(true);
    try {
      const response = await axios.put(
        'https://ourcanteennbackend.vercel.app/api/owner/loans',
        {
          loanId: selectedLoan._id,
          status: status,
          notes: notes.trim() || undefined
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        Alert.alert('Success', `Loan marked as ${status.toLowerCase()}`);
        setUpdateModalVisible(false);
        setSelectedLoan(null);
        setNotes('');
        fetchLoans(true);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else {
        Alert.alert('Error', err?.response?.data?.error || 'Failed to update loan');
      }
    }
    setUpdating(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return '#ff6b35';
      case 'PAID': return '#4CAF50';
      case 'CANCELLED': return '#f44336';
      default: return theme.text;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'pending';
      case 'PAID': return 'check-circle';
      case 'CANCELLED': return 'cancel';
      default: return 'help';
    }
  };

  const renderLoanItem = ({ item }: { item: Loan }) => (
    <TouchableOpacity
      style={[styles.loanCard, { 
        backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a',
        borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
      }]}
      onPress={() => {
        setSelectedLoan(item);
        setModalVisible(true);
      }}
    >
      <View style={styles.loanHeader}>
        <View style={styles.loanInfo}>
          <Text style={[styles.customerName, { color: theme.text }]}>
            {item.customerInfo.name || 'Unknown Customer'}
          </Text>
          <Text style={[styles.orderId, { color: theme.tabIconDefault }]}>
            Order #{item.orderId.slice(-8).toUpperCase()}
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <MaterialIcons 
            name={getStatusIcon(item.status) as any} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>
            {item.status}
          </Text>
        </View>
      </View>
      
      <View style={styles.loanDetails}>
        <View style={styles.detailRow}>
          <MaterialIcons name="phone" size={14} color={theme.tabIconDefault} />
          <Text style={[styles.detailText, { color: theme.tabIconDefault }]}>
            {item.customerInfo.phoneNumber || 'N/A'}
          </Text>
        </View>
        {item.customerInfo.studentId && (
          <View style={styles.detailRow}>
            <MaterialIcons name="badge" size={14} color={theme.tabIconDefault} />
            <Text style={[styles.detailText, { color: theme.tabIconDefault }]}>
              {item.customerInfo.studentId}
            </Text>
          </View>
        )}
      </View>
      
      <View style={styles.loanFooter}>
        <View style={styles.amountInfo}>
          <Text style={[styles.loanAmount, { color: '#ff6b35' }]}>
            ৳{item.loanAmount.toFixed(2)}
          </Text>
          <Text style={[styles.loanDate, { color: theme.tabIconDefault }]}>
            {new Date(item.approvedAt).toLocaleDateString()}
          </Text>
        </View>
        <MaterialIcons name="chevron-right" size={20} color={theme.tabIconDefault} />
      </View>
    </TouchableOpacity>
  );

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

  if (loading && loans.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#8e24aa" />
          <Text style={[styles.loadingText, { color: theme.text }]}>Loading loans...</Text>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Loan Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Statistics */}
      {stats && (
        <View style={styles.statsContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            <StatCard title="Total" count={stats.total.count} amount={stats.total.totalAmount} color="#8e24aa" />
            <StatCard title="Active" count={stats.active.count} amount={stats.active.totalAmount} color="#ff6b35" />
            <StatCard title="Paid" count={stats.paid.count} amount={stats.paid.totalAmount} color="#4CAF50" />
            <StatCard title="Cancelled" count={stats.cancelled.count} amount={stats.cancelled.totalAmount} color="#f44336" />
          </ScrollView>
        </View>
      )}

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['ALL', 'ACTIVE', 'PAID', 'CANCELLED'].map((status) => (
            <TouchableOpacity
              key={status}
              style={[
                styles.filterTab,
                selectedStatus === status && styles.activeFilterTab,
                { 
                  backgroundColor: selectedStatus === status ? '#8e24aa' : 'transparent',
                  borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333'
                }
              ]}
              onPress={() => setSelectedStatus(status)}
            >
              <Text style={[
                styles.filterTabText,
                { color: selectedStatus === status ? '#fff' : theme.text }
              ]}>
                {status === 'ALL' ? 'All Loans' : status}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Loans List */}
      <FlatList
        data={loans}
        renderItem={renderLoanItem}
        keyExtractor={(item) => item._id}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={
          loading && loans.length > 0 ? (
            <ActivityIndicator size="small" color="#8e24aa" style={{ marginVertical: 16 }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="receipt-long" size={64} color={theme.tabIconDefault} />
            <Text style={[styles.emptyText, { color: theme.text }]}>No loans found</Text>
            <Text style={[styles.emptySubtext, { color: theme.tabIconDefault }]}>
              Loans will appear here when customers request them
            </Text>
          </View>
        }
      />

      {/* Loan Detail Modal */}
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
            {selectedLoan && (
              <>
                <View style={[styles.modalHeader, { 
                  borderBottomColor: colorScheme === 'light' ? '#e0e0e0' : '#333' 
                }]}>
                  <Text style={[styles.modalTitle, { color: theme.text }]}>Loan Details</Text>
                  <TouchableOpacity onPress={() => setModalVisible(false)}>
                    <MaterialIcons name="close" size={24} color={theme.text} />
                  </TouchableOpacity>
                </View>
                
                <ScrollView style={styles.modalContent}>
                  <View style={[styles.detailSection, { 
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                  }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Customer Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Name:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{selectedLoan.customerInfo.name}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Phone:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{selectedLoan.customerInfo.phoneNumber}</Text>
                    </View>
                    {selectedLoan.customerInfo.studentId && (
                      <View style={styles.infoRow}>
                        <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Student ID:</Text>
                        <Text style={[styles.infoValue, { color: theme.text }]}>{selectedLoan.customerInfo.studentId}</Text>
                      </View>
                    )}
                  </View>

                  <View style={[styles.detailSection, { 
                    backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                    borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                  }]}>
                    <Text style={[styles.sectionTitle, { color: theme.text }]}>Loan Information</Text>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Order ID:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>#{selectedLoan.orderId.slice(-8).toUpperCase()}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Amount:</Text>
                      <Text style={[styles.infoValue, { color: '#ff6b35', fontWeight: 'bold' }]}>৳{selectedLoan.loanAmount.toFixed(2)}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Status:</Text>
                      <Text style={[styles.infoValue, { color: getStatusColor(selectedLoan.status), fontWeight: 'bold' }]}>{selectedLoan.status}</Text>
                    </View>
                    <View style={styles.infoRow}>
                      <Text style={[styles.infoLabel, { color: theme.tabIconDefault }]}>Approved:</Text>
                      <Text style={[styles.infoValue, { color: theme.text }]}>{new Date(selectedLoan.approvedAt).toLocaleString()}</Text>
                    </View>
                  </View>

                  {selectedLoan.notes && (
                    <View style={[styles.detailSection, { 
                      backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                      borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444'
                    }]}>
                      <Text style={[styles.sectionTitle, { color: theme.text }]}>Notes</Text>
                      <Text style={[styles.notesText, { color: theme.text }]}>{selectedLoan.notes}</Text>
                    </View>
                  )}
                </ScrollView>

                {selectedLoan.status === 'ACTIVE' && (
                  <View style={[styles.modalActions, { 
                    borderTopColor: colorScheme === 'light' ? '#e0e0e0' : '#333' 
                  }]}>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#4CAF50' }]}
                      onPress={() => {
                        setModalVisible(false);
                        setUpdateModalVisible(true);
                      }}
                    >
                      <Text style={styles.actionButtonText}>Mark as Paid</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionButton, { backgroundColor: '#f44336' }]}
                      onPress={() => {
                        Alert.alert(
                          'Cancel Loan',
                          'Are you sure you want to cancel this loan?',
                          [
                            { text: 'No', style: 'cancel' },
                            { text: 'Yes', onPress: () => handleUpdateLoan('CANCELLED') }
                          ]
                        );
                      }}
                    >
                      <Text style={styles.actionButtonText}>Cancel Loan</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* Update Modal */}
      <Modal
        visible={updateModalVisible}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setUpdateModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.updateModalContainer, { 
            backgroundColor: colorScheme === 'light' ? '#fff' : '#1a1a1a' 
          }]}>
            <Text style={[styles.updateModalTitle, { color: theme.text }]}>Mark Loan as Paid</Text>
            <Text style={[styles.updateModalSubtitle, { color: theme.tabIconDefault }]}>
              Add optional notes about the payment
            </Text>
            
            <TextInput
              style={[styles.notesInput, { 
                backgroundColor: colorScheme === 'light' ? '#f8f9fa' : '#2a2a2a',
                borderColor: colorScheme === 'light' ? '#e0e0e0' : '#444',
                color: theme.text
              }]}
              placeholder="Payment notes (optional)"
              placeholderTextColor={theme.tabIconDefault}
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />
            
            <View style={styles.updateActions}>
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#f44336' }]}
                onPress={() => {
                  setUpdateModalVisible(false);
                  setNotes('');
                }}
              >
                <Text style={styles.updateButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.updateButton, { backgroundColor: '#4CAF50', opacity: updating ? 0.7 : 1 }]}
                onPress={() => handleUpdateLoan('PAID')}
                disabled={updating}
              >
                <Text style={styles.updateButtonText}>
                  {updating ? 'Updating...' : 'Mark as Paid'}
                </Text>
              </TouchableOpacity>
            </View>
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
  loanCard: {
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 16,
    padding: 16,
  },
  loanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  loanInfo: {
    flex: 1,
  },
  customerName: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  orderId: {
    fontSize: 14,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  loanDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 6,
  },
  loanFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountInfo: {
    flex: 1,
  },
  loanAmount: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  loanDate: {
    fontSize: 12,
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
  notesText: {
    fontSize: 14,
    lineHeight: 20,
  },
  modalActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    padding: 16,
  },
  actionButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  updateModalContainer: {
    width: '85%',
    borderRadius: 16,
    padding: 24,
  },
  updateModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  updateModalSubtitle: {
    fontSize: 14,
    marginBottom: 20,
    textAlign: 'center',
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    textAlignVertical: 'top',
    marginBottom: 20,
  },
  updateActions: {
    flexDirection: 'row',
  },
  updateButton: {
    flex: 1,
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  updateButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
});
