import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Modal, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface Cuisine {
  _id: string;
  name: string;
}

interface Restaurant {
  _id: string;
  name: string;
  location: string;
  institute: string;
  banner: string;
  logo: string;
  openingHours: any;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
  cuisine: Cuisine[];
}

interface MenuItem {
  _id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  cuisine: Cuisine;
  available: boolean;
  restaurantId: string;
  createdAt: string;
  updatedAt: string;
}

type MenuByCuisine = {
  [key: string]: MenuItem[];
};

export default function RestaurantDetail() {
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  const { token } = useAuth();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { cart, addToCart, removeFromCart, pendingItem, confirmAddFromNewRestaurant } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [menuByCuisine, setMenuByCuisine] = useState<MenuByCuisine>({});
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`https://ourcanteennbackend.vercel.app/api/user/res/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setRestaurant(data.restaurant);
        setMenuByCuisine(data.menuByCuisine || {});
      } catch (e) {
        console.log(e);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (token && id) fetchData();
  }, [token, id]);

  useEffect(() => {
    console.log(pendingItem);
    if (pendingItem) {
      Alert.alert(
        "Adding from Another Canteen",
        "Adding this item will clear your cart from other Canteen",
        [
          { text: "Don't Add", onPress: () => confirmAddFromNewRestaurant(false), style: "cancel" },
          { text: "Add Item", onPress: () => confirmAddFromNewRestaurant(true) }
        ]
      );
    }
  }, [pendingItem]);

  const openItemModal = (item: MenuItem) => {
    setSelectedItem(item);
    setModalQuantity(1);
    setModalVisible(true);
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: cardBg }]}>
        <View style={styles.centered}><ActivityIndicator size="large" color={primary} /></View>
      </SafeAreaView>
    );
  }
  if (error || !restaurant) {
    return (
      <SafeAreaView style={[styles.safeArea, { backgroundColor: cardBg }]}>
        <View style={styles.centered}><ThemedText style={{ color: '#d32f2f' }}>{error || 'Restaurant not found.'}</ThemedText></View>
      </SafeAreaView>
    );
  }

  // Check if there are items from this restaurant in the cart
  const hasItemsInCartFromThisRestaurant = cart.some(item => item.restaurantId === restaurant._id);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cardBg }]}>
      <ScrollView contentContainerStyle={{ paddingBottom: 48 }} showsVerticalScrollIndicator={false}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.replace('/')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={26} color={primary} />
        </TouchableOpacity>
        <Image source={{ uri: restaurant.banner }} style={styles.restaurantBanner} contentFit="cover" />
        <View style={styles.restaurantInfo}>
          <Image source={{ uri: restaurant.logo }} style={styles.restaurantLogo} contentFit="cover" />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <ThemedText type="title" style={{ fontSize: 22, fontWeight: '700', color: textColor }}>{restaurant.name}</ThemedText>
            <ThemedText style={{ fontSize: 15, fontWeight: '600', color: textColor, opacity: 0.7 }}>{restaurant.institute}</ThemedText>
            <ThemedText style={{ fontSize: 13, color: textColor, opacity: 0.6 }}>{restaurant.location}</ThemedText>
          </View>
        </View>
        <View style={{ marginTop: 18, marginHorizontal: 18 }}>
          <ThemedText type="title" style={{ fontSize: 20, fontWeight: '700', marginBottom: 8 }}>Menu</ThemedText>
          {Object.entries(menuByCuisine).length === 0 ? (
            <ThemedText style={{ color: textColor, opacity: 0.7 }}>No menu items found.</ThemedText>
          ) : (
            Object.entries(menuByCuisine).map(([cuisineKey, items]) => {
              // cuisineKey is like "686564f9be897d4481d5857a:Breakfast"
              const cuisineName = cuisineKey.split(':')[1] || 'Other';
              return (
                <View key={cuisineKey} style={{ marginBottom: 18 }}>
                  <ThemedText style={{ fontSize: 17, fontWeight: '700', color: primary, marginBottom: 6 }}>{cuisineName}</ThemedText>
                  {items.map(item => {
                    const cartItem = cart.find(ci => ci._id === item._id);
                    return (
                      <TouchableOpacity
                        key={item._id}
                        style={[styles.menuCard, { backgroundColor: cardBg, borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333' }]}
                        onPress={() => openItemModal(item)}
                        activeOpacity={0.8}
                      >
                        <Image source={item.image ? { uri: item.image } : require('@/assets/images/partial-react-logo.png')} style={styles.menuImage} contentFit="cover" />
                        <View style={styles.menuInfo}>
                          <ThemedText type="subtitle" style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{item.name}</ThemedText>
                          <ThemedText style={{ fontSize: 13, color: textColor, opacity: 0.7, marginTop: 2 }}>{item.description}</ThemedText>
                          <View style={styles.menuBottomRow}>
                            <ThemedText style={{ fontSize: 15, color: primary, fontWeight: 'bold', marginTop: 4 }}>৳{item.price}</ThemedText>
                            <View style={styles.menuCartControls}>
                              {cartItem ? (
                                <>
                                  <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => {
                                      if (cartItem.quantity === 1) {
                                        removeFromCart(item._id);
                                      } else {
                                        addToCart({ ...item, quantity: -1, restaurantId: item.restaurantId });
                                      }
                                    }}
                                  >
                                    <Ionicons name="remove-circle-outline" size={24} color={primary} />
                                  </TouchableOpacity>
                                  <ThemedText style={{ marginHorizontal: 10, fontSize: 16, color: textColor }}>{cartItem.quantity}</ThemedText>
                                  <TouchableOpacity
                                    style={styles.qtyBtn}
                                    onPress={() => addToCart({ ...item, quantity: 1, restaurantId: item.restaurantId })}
                                  >
                                    <Ionicons name="add-circle-outline" size={24} color={primary} />
                                  </TouchableOpacity>
                                </>
                              ) : (
                                <TouchableOpacity
                                  style={styles.addToCartBtn}
                                  onPress={() => addToCart({ ...item, quantity: 1, restaurantId: item.restaurantId })}
                                >
                                  <ThemedText style={{ color: '#fff', fontSize: 14, fontWeight: 'bold' }}>Add to Cart</ThemedText>
                                </TouchableOpacity>
                              )}
                            </View>
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={[styles.modalContent, { backgroundColor: cardBg }]}
            onPress={e => e.stopPropagation()}
          >
            {selectedItem && (
              <>
                <Image source={selectedItem.image ? { uri: selectedItem.image } : require('@/assets/images/partial-react-logo.png')} style={styles.modalImageFull} contentFit="cover" />
                <View style={{ width: '100%', alignItems: 'flex-start', marginTop: 16 }}>
                  <ThemedText type="title" style={{ fontSize: 22, fontWeight: '700', marginBottom: 6, textAlign: 'left' }}>{selectedItem.name}</ThemedText>
                  <ThemedText style={{ fontSize: 15, marginBottom: 10, textAlign: 'left', color: textColor }}>{selectedItem.description}</ThemedText>
                  <ThemedText style={{ fontSize: 14, color: textColor, opacity: 0.6, marginBottom: 2, textAlign: 'left' }}>Restaurant: {restaurant?.name}</ThemedText>
                  <ThemedText style={{ fontSize: 14, color: textColor, opacity: 0.6, marginBottom: 10, textAlign: 'left' }}>Cuisine: {selectedItem.cuisine?.name ? selectedItem.cuisine.name : ''}</ThemedText>
                  <ThemedText style={{ fontSize: 18, color: primary, fontWeight: 'bold', marginBottom: 16, textAlign: 'left' }}>৳{selectedItem.price}</ThemedText>
                  {(() => {
                    const cartItem = cart.find(ci => ci._id === selectedItem._id);
                    if (cartItem) {
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, width: '100%', justifyContent: 'center' }}>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => {
                              if (cartItem.quantity === 1) {
                                removeFromCart(selectedItem._id);
                              } else {
                                addToCart({ ...selectedItem, quantity: -1, restaurantId: selectedItem.restaurantId });
                              }
                            }}
                          >
                            <Ionicons name="remove-circle-outline" size={28} color={primary} />
                          </TouchableOpacity>
                          <ThemedText style={{ marginHorizontal: 16, fontSize: 18, color: textColor }}>{cartItem.quantity}</ThemedText>
                          <TouchableOpacity
                            style={styles.qtyBtn}
                            onPress={() => addToCart({ ...selectedItem, quantity: 1, restaurantId: selectedItem.restaurantId })}
                          >
                            <Ionicons name="add-circle-outline" size={28} color={primary} />
                          </TouchableOpacity>
                        </View>
                      );
                    } else {
                      return (
                        <TouchableOpacity
                          style={{
                            backgroundColor: '#d32f2f',
                            paddingVertical: 8,
                            paddingHorizontal: 12,
                            borderRadius: 8,
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '100%',
                            marginBottom: 4,
                          }}
                          onPress={() => {
                            addToCart({ ...selectedItem, quantity: 1, restaurantId: selectedItem.restaurantId });
                          }}
                        >
                          <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold', textAlign: 'center' }}>Add to Cart</ThemedText>
                        </TouchableOpacity>
                      );
                    }
                  })()}
                </View>
              </>
            )}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
      {/* Floating Go to Cart Button */}
      {hasItemsInCartFromThisRestaurant && (
        <TouchableOpacity
          style={{
            position: 'absolute',
            bottom: 24,
            left: 24,
            right: 24,
            backgroundColor: '#d32f2f',
            borderRadius: 10,
            paddingVertical: 16,
            alignItems: 'center',
            justifyContent: 'center',
            elevation: 6,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            zIndex: 100,
          }}
          activeOpacity={0.85}
          onPress={() => router.push('/(tabs)/cart')}
        >
          <ThemedText style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>Go to Cart</ThemedText>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  restaurantBanner: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  restaurantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  restaurantLogo: {
    width: 80,
    height: 80,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
    gap: 12,
  },
  menuImage: {
    width: 70,
    height: 70,
    borderRadius: 10,
    backgroundColor: '#eee',
    marginRight: 10,
  },
  menuInfo: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 1,
  },
  menuBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 1,
    gap: 10,
  },
  menuCartControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backButton: {
    position: 'absolute',
    top: 18,
    left: 16,
    zIndex: 10,
    backgroundColor: '#fff8',
    borderRadius: 20,
    padding: 4,
  },
  addToCartBtn: {
    backgroundColor: '#d32f2f',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qtyBtn: {
    padding: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
  modalImageFull: {
    width: '100%',
    aspectRatio: 1,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    backgroundColor: '#eee',
  },
}); 