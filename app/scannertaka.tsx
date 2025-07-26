import { useAuth } from '@/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function ScannerTakaScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [scanned, setScanned] = useState(false);
  const [scannedData, setScannedData] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { user } = useAuth();
  const [modalVisible, setModalVisible] = useState(false);
  const [topupUserId, setTopupUserId] = useState<string | null>(null);

  const isPermissionGranted = Boolean(permission?.granted);

  const handleBarCodeScanned = ({ data }: { data: string }) => {
    setScanned(true);
    setScannedData(data);
    setError(null);
    try {
      const parsed = JSON.parse(data);
      console.log(parsed)
      if (parsed.userId && parsed.topup === true) {
        setTopupUserId(parsed.userId);
        setModalVisible(true);
      } else {
        setError('Invalid topup QR code data');
      }
    } catch (e: any) {
      setScanned(false);
      setScannedData(null);
      console.log(e.message);
      setError('Failed to parse QR code');
    }
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
        <Text style={styles.title}>Scan Topup QR Code</Text>
        <View style={styles.cameraContainer}>
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          />
        </View>
        {error && (
          <View style={styles.resultContainer}>
            <Text style={{ color: 'red', textAlign: 'center' }}>{error}</Text>
          </View>
        )}
        
        {/* Topup Confirmation Modal */}
        <Modal
          visible={modalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 10, padding: 32, alignItems: 'center', width: '80%' }}>
              <Ionicons name="wallet-outline" size={48} color="#8e24aa" style={{ marginBottom: 12 }} />
              <Text style={{ color: '#222', fontSize: 20, fontWeight: 'bold', marginBottom: 8 }}>Topup Request Detected</Text>
              <Text style={{ color: '#666', fontSize: 15, textAlign: 'center', marginBottom: 24 }}>
                A topup request has been scanned. Would you like to proceed to the topup page?
              </Text>
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <TouchableOpacity
                  style={{ backgroundColor: '#8e24aa', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 }}
                  onPress={() => {
                    setModalVisible(false);
                    if (topupUserId) {
                      router.push({ pathname: '/topups', params: { userId: topupUserId, type: 'uid' } });
                    }
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Proceed</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={{ backgroundColor: '#888', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 24 }}
                  onPress={() => {
                    setModalVisible(false);
                    setScanned(false);
                    setScannedData(null);
                    setTopupUserId(null);
                  }}
                >
                  <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {scanned && (
          <TouchableOpacity style={styles.scanAgainButton} onPress={() => { setScanned(false); setScannedData(null); }}>
            <Text style={styles.scanAgainText}>Scan Again</Text>
          </TouchableOpacity>
        )}
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
