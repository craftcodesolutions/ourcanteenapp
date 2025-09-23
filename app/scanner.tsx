import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScannerScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [orderInfo, setOrderInfo] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { token, logout, user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);

  const [qrOrderId, setQrOrderId] = useState<string | null>(null);
  const [qrUserId, setQrUserId] = useState<string | null>(null);
  const [successModalVisible, setSuccessModalVisible] = useState(false);
  const [successLoading, setSuccessLoading] = useState(false);
  const [insufficientModalVisible, setInsufficientModalVisible] = useState(false);
  const [loanLoading, setLoanLoading] = useState(false);
  const [loanAmount, setLoanAmount] = useState<number>(0);
  const [orderTotal, setOrderTotal] = useState<number>(0);
  const [customerBalance, setCustomerBalance] = useState<number>(0);

  const isPermissionGranted = Boolean(permission?.granted);

  const fetchOrderForLoan = async (orderId: string, userId: string) => {
    try {
      // We'll make a simple GET request to fetch order details
      // Since there's no direct GET order endpoint, we'll use a workaround
      // by making another POST request that will return the order details
      const response = await axios.post(
        'https://ourcanteennbackend.vercel.app/api/owner/orderstatus',
        { orderId, userId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      
      if (response.data.success && response.data.order) {
        setLoanAmount(response.data.order.total);
        setOrderTotal(response.data.order.total);
      }
    } catch (err: any) {
      console.log('Failed to fetch order for loan:', err);
    }
  };

  const handleLoanApproval = async () => {
    if (!qrOrderId || !qrUserId || !loanAmount) return;
    
    setLoanLoading(true);
    try {
      const response = await axios.post(
        'https://ourcanteennbackend.vercel.app/api/owner/approve-loan',
        { 
          orderId: qrOrderId, 
          userId: qrUserId,
          loanAmount: loanAmount
        },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setInsufficientModalVisible(false);
        // If order is already SUCCESS, show success modal instead
        if (response.data.order.status === 'SUCCESS') {
          setSuccessModalVisible(true);
        } else {
          setOrderInfo(response.data.order);
          setModalVisible(true);
        }
        // Reset loan amount
        setLoanAmount(0);
        setOrderTotal(0);
        setCustomerBalance(0);
        console.log('Loan approved successfully:', response.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else {
        setError(err?.response?.data?.error || 'Failed to approve loan');
        setInsufficientModalVisible(false);
      }
    }
    setLoanLoading(false);
  };

  const sendOrderStatus = async (orderId: string, userId: string) => {
    setLoading(true);
    setError(null);
    setOrderInfo(null);
    try {
      const response = await axios.post(
        'https://ourcanteennbackend.vercel.app/api/owner/orderstatus',
        { orderId, userId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        setOrderInfo(response.data.order);
        setModalVisible(true);
        console.log(response.data.order);
      } else if (response.data.alreadySuccess) {
        setError('Order already marked as SUCCESS');
      } else {
        setError('Failed to update order status');
      }

    } catch (err: any) {
      if (err.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else if (err.response && err.response.status === 406) {
        setInsufficientModalVisible(true);
        // Check if order details are included in the 406 response
        if (err.response.data && err.response.data.order) {
          setLoanAmount(err.response.data.order.total);
          setOrderTotal(err.response.data.order.total);
          // Set customer balance if available
          if (err.response.data.customer && err.response.data.customer.credit !== undefined) {
            setCustomerBalance(err.response.data.customer.credit);
          }
          console.log('Got order details from 406 response:', err.response.data.order);
        } else {
          // Fallback: fetch order details to get the total for loan amount
          fetchOrderForLoan(orderId, userId);
        }
      } else if (err.response && err.response.data && err.response.data.error) {
        setError(err.response.data.error);
      } else {
        setError('Network error');
      }
    }
    setLoading(false);
  };

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setScannedData(data);
    setError(null);
    setOrderInfo(null);
    try {
      const parsed = JSON.parse(data);
      if (parsed.orderId && parsed.userId) {
        setQrOrderId(parsed.orderId);
        setQrUserId(parsed.userId);
        sendOrderStatus(parsed.orderId, parsed.userId);
      } else {
        setError('Invalid QR code data');
      }
    } catch (e: any) {
      setScanned(false);
      setScannedData(null);
      console.log(e.message);
      // setError('Failed to parse QR code');
    }

    console.log(scannedData);
  };

  const handleSuccess = async () => {
    if (!qrOrderId || !qrUserId) return;
    setSuccessLoading(true);
    try {
      const response = await axios.put(
        'https://ourcanteennbackend.vercel.app/api/owner/orderstatus',
        { orderId: qrOrderId, userId: qrUserId },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
        }
      );
      if (response.data.status === 'SUCCESS') {
        setModalVisible(false);
        setSuccessModalVisible(true);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        logout();
        router.push("/(auth)/signin");
      } else {
        setError(err?.response?.data?.error || 'Failed to update order status');
      }
    }
    setSuccessLoading(false);
  };

  if (permission === null) {
    return <View style={styles.centered}><Text>Requesting camera permission...</Text></View>;
  }
  if (!isPermissionGranted) {
    return (
      <View style={styles.centered}>
        <Text>No access to camera</Text>
        <TouchableOpacity style={styles.scanAgainButton} onPress={requestPermission}>
          <Text style={styles.scanAgainText}>Grant Camera Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => router.back()}
        accessibilityLabel="Go back"
        accessibilityRole="button"
        activeOpacity={0.7}
      >
        <Ionicons name="arrow-back" size={26} color="#8e24aa" />
      </TouchableOpacity>
      <View style={styles.container}>
        <Text style={styles.title}>Scan a QR Code</Text>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        </View>
        {loading && <ActivityIndicator size="large" color="#8e24aa" style={{ marginTop: 16 }} />}
        {error && (
          <View style={styles.resultContainer}>
            <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
          </View>
        )}
        {orderInfo && (
          <Modal
            visible={modalVisible}
            animationType="slide"
            transparent={true}
            onRequestClose={() => setModalVisible(false)}
          >
            <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
              <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 0, width: '92%', maxHeight: '85%', shadowColor: '#000', shadowOpacity: 0.10, shadowRadius: 8, elevation: 6 }}>
                {/* Header */}
                <View style={{ backgroundColor: '#222', borderTopLeftRadius: 10, borderTopRightRadius: 10, padding: 16, alignItems: 'center', flexDirection: 'row', justifyContent: 'center' }}>
                  <Ionicons name={orderInfo.status === 'SCANNED' ? 'checkmark-circle' : 'alert-circle'} size={24} color="#fff" style={{ marginRight: 8 }} />
                  <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold', letterSpacing: 0.5 }}>Order Details</Text>
                </View>
                <ScrollView style={{ paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8 }} showsVerticalScrollIndicator={false}>
                  <Text style={{ color: '#444', fontWeight: 'bold', fontSize: 15, marginBottom: 4 }}>Order ID</Text>
                  <Text style={{ color: '#222', marginBottom: 10 }}>{orderInfo._id}</Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
                    <Ionicons name="pricetag" size={16} color="#444" style={{ marginRight: 6 }} />
                    <Text style={{ color: '#222', fontSize: 15 }}>Status: <Text style={{ color: orderInfo.status === 'SCANNED' ? '#388e3c' : '#b71c1c', fontWeight: 'bold' }}>{orderInfo.status}</Text></Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
                  <Text style={{ color: '#444', fontWeight: 'bold', fontSize: 15, marginBottom: 8 }}>Items</Text>
                  {orderInfo.items && orderInfo.items.map((item: any) => (
                    <View key={item._id} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12, backgroundColor: '#f5f5f5', borderRadius: 6, padding: 8, shadowColor: '#000', shadowOpacity: 0.02, shadowRadius: 1, elevation: 0 }}>
                      <Image source={{ uri: item.image }} style={{ width: 44, height: 44, borderRadius: 6, marginRight: 10, borderWidth: 1, borderColor: '#eee' }} />
                      <View style={{ flex: 1 }}>
                        <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 15 }}>{item.name} <Text style={{ color: '#444' }}>x{item.quantity}</Text></Text>
                        <Text style={{ color: '#666', fontSize: 13, marginBottom: 2 }}>{item.description}</Text>
                        <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 14 }}>৳{item.price}</Text>
                      </View>
                    </View>
                  ))}
                  <View style={{ height: 1, backgroundColor: '#eee', marginVertical: 8 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#222', fontWeight: 'bold', fontSize: 16 }}>Total</Text>
                    <Text style={{ color: '#388e3c', fontWeight: 'bold', fontSize: 17 }}>৳{orderInfo.total}</Text>
                  </View>
                  {orderInfo.loanApproved && (
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                      <Text style={{ color: '#ff6b35', fontWeight: 'bold', fontSize: 14 }}>Paid via Loan</Text>
                      <Text style={{ color: '#ff6b35', fontWeight: 'bold', fontSize: 15 }}>৳{orderInfo.loanAmount || orderInfo.total}</Text>
                    </View>
                  )}
                  <Text style={{ color: '#aaa', fontSize: 12, textAlign: 'right', marginBottom: 4 }}>Created: {new Date(orderInfo.createdAt).toLocaleString()}</Text>
                </ScrollView>
                <View style={{ flexDirection: 'row' }}>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#222',
                      borderBottomLeftRadius: 10,
                      paddingVertical: 14,
                      alignItems: 'center',
                      flex: 1,
                      opacity: successLoading ? 0.7 : 1,
                    }}
                    onPress={handleSuccess}
                    disabled={successLoading}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }}>
                      {successLoading ? 'Processing...' : 'Success'}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={{
                      backgroundColor: '#888',
                      borderBottomRightRadius: 10,
                      paddingVertical: 14,
                      alignItems: 'center',
                      flex: 1,
                    }}
                    onPress={() => {
                      setModalVisible(false);
                      setScanned(false);
                      setScannedData(null);
                      setOrderInfo(null);
                    }}
                  >
                    <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16, letterSpacing: 0.5 }}>Close</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </Modal>
        )}
        {scanned && !loading && (
          <TouchableOpacity style={styles.scanAgainButton} onPress={() => { setScanned(false); setScannedData(null); }}>
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
        )}
        {/* Success Modal */}
        <Modal
          visible={successModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setSuccessModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 32, alignItems: 'center', width: '80%' }}>
              <Ionicons name="checkmark-circle" size={48} color="#388e3c" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#222', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Payment Completed!</Text>
              <Text style={{ color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 24 }}>Order has been paid via loan and marked as SUCCESS.</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#222', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 }}
                onPress={() => {
                  setSuccessModalVisible(false);
                  setScanned(false);
                  setScannedData(null);
                  setOrderInfo(null);
                  setQrOrderId(null);
                  setQrUserId(null);
                  setLoanAmount(0);
                  setCustomerBalance(0);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        {/* Insufficient Balance Modal */}
        <Modal
          visible={insufficientModalVisible}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setInsufficientModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', width: '85%', maxWidth: 400 }}>
              <Ionicons name="alert-circle" size={48} color="#ff6b35" style={{ marginBottom: 16 }} />
              <Text style={{ color: '#b71c1c', fontSize: 20, fontWeight: 'bold', marginBottom: 8, textAlign: 'center' }}>Insufficient Balance</Text>
              
              {/* Order Information */}
              {orderTotal > 0 && (
                <View style={{ backgroundColor: '#f8f9fa', borderRadius: 8, padding: 16, marginBottom: 20, width: '100%' }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#555', fontSize: 14, fontWeight: '600' }}>Current Balance:</Text>
                    <Text style={{ color: customerBalance < 0 ? '#d32f2f' : '#666', fontSize: 16, fontWeight: 'bold' }}>৳{customerBalance.toFixed(2)}</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#555', fontSize: 14, fontWeight: '600' }}>Order Total:</Text>
                    <Text style={{ color: '#222', fontSize: 18, fontWeight: 'bold' }}>৳{orderTotal.toFixed(2)}</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 8 }} />
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <Text style={{ color: '#d32f2f', fontSize: 14, fontWeight: '600' }}>Shortage:</Text>
                    <Text style={{ color: '#d32f2f', fontSize: 16, fontWeight: 'bold' }}>৳{Math.max(0, orderTotal - customerBalance).toFixed(2)}</Text>
                  </View>
                  <View style={{ height: 1, backgroundColor: '#e0e0e0', marginVertical: 8 }} />
                  <Text style={{ color: '#666', fontSize: 13, textAlign: 'center', lineHeight: 18 }}>
                    Loan approval will deduct from customer's balance (can go negative).
                  </Text>
                </View>
              )}
              
              <Text style={{ color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
                The customer does not have enough balance to complete this order.
              </Text>

              {user?.staff?.access === "A" || user?.isOwner ?
                <View style={{ width: '100%' }}>
                  {/* Action Buttons */}
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#4CAF50', 
                      borderRadius: 8, 
                      paddingVertical: 14, 
                      paddingHorizontal: 20, 
                      marginBottom: 12, 
                      opacity: loanLoading ? 0.7 : 1,
                      width: '100%',
                      alignItems: 'center'
                    }}
                    onPress={handleLoanApproval}
                    disabled={loanLoading}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="card-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>
                        {loanLoading ? 'Approving...' : `Approve Loan (৳${loanAmount.toFixed(2)})`}
                      </Text>
                    </View>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={{ 
                      backgroundColor: '#8e24aa', 
                      borderRadius: 8, 
                      paddingVertical: 14, 
                      paddingHorizontal: 20, 
                      marginBottom: 12,
                      width: '100%',
                      alignItems: 'center'
                    }}
                    onPress={() => {
                      setInsufficientModalVisible(false);
                      if (qrUserId) {
                        router.push({ pathname: '/topups', params: { userId: qrUserId, type: 'uid' } });
                      }
                    }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <Ionicons name="add-circle-outline" size={20} color="#fff" style={{ marginRight: 8 }} />
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Add Credit</Text>
                    </View>
                  </TouchableOpacity>
                </View>
                :
                <View style={{ backgroundColor: '#fff3cd', borderRadius: 8, padding: 16, marginBottom: 20, width: '100%', borderWidth: 1, borderColor: '#ffeaa7' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
                    <Ionicons name="information-circle" size={20} color="#856404" style={{ marginRight: 8 }} />
                    <Text style={{ color: '#856404', fontWeight: 'bold', fontSize: 14 }}>Authorization Required</Text>
                  </View>
                  <Text style={{ color: '#856404', fontSize: 14, textAlign: 'center', lineHeight: 18 }}>
                    Customer needs to request a top-up from authorized personnel (Owner or Staff with Level A access).
                  </Text>
                </View>
              }

              <TouchableOpacity
                style={{ 
                  backgroundColor: '#6c757d', 
                  borderRadius: 8, 
                  paddingVertical: 12, 
                  paddingHorizontal: 32,
                  width: '100%',
                  alignItems: 'center',
                  marginTop: 8
                }}
                onPress={() => {
                  setInsufficientModalVisible(false);
                  setLoanAmount(0);
                  setOrderTotal(0);
                  setCustomerBalance(0);
                  setScanned(false);
                  setScannedData(null);
                  setOrderInfo(null);
                  setQrOrderId(null);
                  setQrUserId(null);
                }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                  <Ionicons name="close-circle-outline" size={18} color="#fff" style={{ marginRight: 6 }} />
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f5fc',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 24,
    zIndex: 10,
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#8e24aa',
    marginBottom: 28,
    marginTop: 32,
    textAlign: 'center',
  },
  cameraContainer: {
    width: 300,
    height: 300,
    borderRadius: 24,
    overflow: 'hidden',
    backgroundColor: '#000',
    marginBottom: 24,
  },
  camera: {
    flex: 1,
  },
  resultContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginTop: 16,
    alignItems: 'center',
    width: '100%',
  },
  resultLabel: {
    fontWeight: 'bold',
    color: '#8e24aa',
    marginBottom: 4,
  },
  resultText: {
    color: '#333',
    fontSize: 16,
    textAlign: 'center',
  },
  scanAgainButton: {
    marginTop: 20,
    backgroundColor: '#8e24aa',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  scanAgainText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
