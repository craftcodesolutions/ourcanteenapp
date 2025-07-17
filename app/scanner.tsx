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

  const isPermissionGranted = Boolean(permission?.granted);

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
              <Text style={{ color: '#222', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Order Marked as Success!</Text>
              <Text style={{ color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 24 }}>The order status has been updated to SUCCESS.</Text>
              <TouchableOpacity
                style={{ backgroundColor: '#222', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32 }}
                onPress={() => {
                  setSuccessModalVisible(false);
                  setScanned(false);
                  setScannedData(null);
                  setOrderInfo(null);
                  setQrOrderId(null);
                  setQrUserId(null);
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
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 32, alignItems: 'center', width: '80%' }}>
              <Ionicons name="alert-circle" size={48} color="#b71c1c" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#b71c1c', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Insufficient Balance</Text>
              <Text style={{ color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 24 }}>The user does not have enough balance to complete this order.</Text>

              {user?.staff.access === "A" ?
                <TouchableOpacity
                  style={{ backgroundColor: '#8e24aa', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, marginBottom: 12 }}
                  onPress={() => {
                    setInsufficientModalVisible(false);
                    if (qrUserId) {
                      router.push({ pathname: '/topups', params: { userId: qrUserId, type: 'uid' } });
                    }
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Go to Top Up</Text>
                </TouchableOpacity>
                :
                <Text style={{ color: '#666',fontWeight: 800, fontSize: 15, textAlign: 'center', marginBottom: 24 }}>User Needs to do topup from authorized personale.</Text>
              }

              <TouchableOpacity
                style={{ backgroundColor: '#888', borderRadius: 8, paddingVertical: 10, paddingHorizontal: 28 }}
                onPress={() => setInsufficientModalVisible(false)}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
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
