import { ThemedText } from '@/components/ThemedText';
import { Colors } from '@/constants/Colors';
import { useAuth } from '@/context/AuthContext';
import { useCart } from '@/context/CartContext';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Dimensions, FlatList, Modal, Pressable, ScrollView, StyleSheet, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

const { width } = Dimensions.get('window');
const RESTAURANT_CARD_WIDTH = width * 0.8;

// Type definitions for API data

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
  restaurantName: string;
}

export default function HomeScreen() {
  const colorScheme = useColorScheme() ?? 'light';
  const primary = Colors[colorScheme].tint;
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  // const iconColor = Colors[colorScheme].icon;
  const { token, user } = useAuth();
  const router = useRouter();
  const { cart, addToCart, removeFromCart, pendingItem, confirmAddFromNewRestaurant } = useCart();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch('https://ourcanteennbackend.vercel.app/api/user/resnmenu', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to fetch data');
        const data = await res.json();
        setRestaurants(data.restaurants || []);
        setMenuItems(data.allmenuitems || []);
      } catch (e) {
        console.log(e);
        setError('Failed to load data. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchData();
  }, [token]);

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
    setModalVisible(true);
  };

  const renderRestaurant = ({ item }: { item: Restaurant }) => (
    <Pressable
      onPress={() => router.push({ pathname: '/restaurant/[id]', params: { id: item._id } })}
      style={[
        styles.restaurantCard,
        { backgroundColor: cardBg, shadowColor: '#000' },
        colorScheme === 'dark'
          ? { borderWidth: 2, borderColor: 'rgba(255,255,255,0.12)' }
          : { borderWidth: 0, borderColor: 'transparent' },
      ]}
    >
      <Image source={{ uri: item.banner }} style={styles.restaurantBanner} contentFit="cover" />
      <View style={styles.restaurantInfo}>
        <Image source={{ uri: item.logo }} style={styles.restaurantLogo} contentFit="cover" />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <ThemedText type="title" style={{ fontSize: 18, fontWeight: '700', color: textColor }}>{item.name}</ThemedText>
          <ThemedText style={{ fontSize: 13, fontWeight: '600', color: textColor, opacity: 0.7 }}>{item.institute}</ThemedText>
          <ThemedText style={{ fontSize: 12, color: textColor, opacity: 0.6 }}>{item.location}</ThemedText>
          {/* <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 4 }}>
            {item.cuisine.map((c: Cuisine) => (
              <ThemedText key={c._id} style={{ fontSize: 11, color: primary, marginRight: 8 }}>{c.name}</ThemedText>
            ))}
          </View> */}
        </View>
      </View>
    </Pressable>
  );

  const renderMenuItem = ({ item }: { item: MenuItem }) => {
    const cartItem = cart.find(ci => ci._id === item._id);
    return (
      <TouchableOpacity
        style={[styles.menuCard, { backgroundColor: cardBg, borderColor: colorScheme === 'light' ? '#e0e0e0' : '#333' }]}
        onPress={() => openItemModal(item)}
        activeOpacity={0.8}
      >
        <Image source={item.image ? { uri: item.image } : require('@/assets/images/partial-react-logo.png')} style={styles.menuImage} contentFit="cover" />
        <View style={{ flex: 1, marginLeft: 14 }}>
          <ThemedText type="subtitle" style={{ fontSize: 16, fontWeight: '700', color: textColor }}>{item.name}</ThemedText>
          <ThemedText style={{ fontSize: 13, color: textColor, opacity: 0.7 }}>{item.restaurantName}</ThemedText>
          <ThemedText style={{ fontSize: 12, color: primary, marginTop: 2 }}>{item.cuisine?.name}</ThemedText>
          {/* <ThemedText style={{ fontSize: 13, color: textColor, marginTop: 2 }}>{item.description}</ThemedText> */}
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
            <ThemedText style={{ fontSize: 15, color: primary, fontWeight: 'bold', marginTop: 4 }}>৳{item.price}</ThemedText>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              {cartItem ? (
                <>
                  <TouchableOpacity
                    style={{ padding: 2 }}
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
                    style={{ padding: 2 }}
                    onPress={() => addToCart({ ...item, quantity: 1, restaurantId: item.restaurantId })}
                  >
                    <Ionicons name="add-circle-outline" size={24} color={primary} />
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity
                  style={{ backgroundColor: '#d32f2f', paddingVertical: 4, paddingHorizontal: 12, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}
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
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: cardBg }]}>
      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={primary} /></View>
      ) : error ? (
        <View style={styles.centered}><ThemedText style={{ color: '#d32f2f' }}>{error}</ThemedText></View>
      ) : (
        <ScrollView
          contentContainerStyle={{ paddingBottom: 48, flexGrow: 1 }}
          showsVerticalScrollIndicator={false}
        >
          <View style={{ marginTop: 18, marginBottom: 8, marginLeft: 18 }}>
            <ThemedText type="title" style={{ fontSize: 22, fontWeight: '700' }}>
              {user?.name ? `Welcome, ${user.name}!` : 'Welcome!'}
            </ThemedText>
          </View>
          <View style={{ marginTop: 10, marginBottom: 18 }}>
            <ThemedText type="title" style={{ fontSize: 20, fontWeight: '700', marginLeft: 18 }}>Restaurants</ThemedText>
            <FlatList
              data={restaurants}
              renderItem={renderRestaurant}
              keyExtractor={item => item._id}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingVertical: 8 }}
              snapToInterval={RESTAURANT_CARD_WIDTH + 16}
              decelerationRate="fast"
              ItemSeparatorComponent={() => <View style={{ width: 16 }} />}
              ListEmptyComponent={<ThemedText style={{ marginLeft: 18, color: textColor, opacity: 0.7 }}>No restaurants found.</ThemedText>}
            />
          </View>
          <View>
            <ThemedText type="title" style={{ fontSize: 20, fontWeight: '700', marginLeft: 18, marginBottom: 8 }}>Menu</ThemedText>
            <FlatList
              data={menuItems}
              renderItem={renderMenuItem}
              keyExtractor={item => item._id}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
              ItemSeparatorComponent={() => <View style={{ height: 16 }} />}
              ListEmptyComponent={<ThemedText style={{ marginLeft: 18, color: textColor, opacity: 0.7 }}>No menu items found.</ThemedText>}
              scrollEnabled={false}
            />
          </View>
        </ScrollView>
      )}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <TouchableOpacity
          style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'flex-end' }}
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
                <Image source={selectedItem.image ? { uri: selectedItem.image } : require('@/assets/images/partial-react-logo.png')} style={{ width: '100%', aspectRatio: 1, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: '#eee' }} contentFit="cover" />
                <View style={{ width: '100%', alignItems: 'flex-start', marginTop: 16 }}>
                  <ThemedText type="title" style={{ fontSize: 22, fontWeight: '700', marginBottom: 6, textAlign: 'left', color: textColor }}>{selectedItem.name}</ThemedText>
                  <ThemedText style={{ fontSize: 15, marginBottom: 10, textAlign: 'left', color: textColor }}>{selectedItem.description}</ThemedText>
                  <ThemedText style={{ fontSize: 14, color: textColor, opacity: 0.6, marginBottom: 2, textAlign: 'left' }}>Restaurant: {selectedItem.restaurantName}</ThemedText>
                  <ThemedText style={{ fontSize: 14, color: textColor, opacity: 0.6, marginBottom: 10, textAlign: 'left' }}>Cuisine: {selectedItem.cuisine?.name ? selectedItem.cuisine.name : ''}</ThemedText>
                  <ThemedText style={{ fontSize: 18, color: primary, fontWeight: 'bold', marginBottom: 16, textAlign: 'left' }}>৳{selectedItem.price}</ThemedText>
                  {(() => {
                    const cartItem = cart.find(ci => ci._id === selectedItem._id);
                    if (cartItem) {
                      return (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16, width: '100%', justifyContent: 'center' }}>
                          <TouchableOpacity
                            style={{ padding: 2 }}
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
                            style={{ padding: 2 }}
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
  restaurantCard: {
    width: RESTAURANT_CARD_WIDTH,
    borderRadius: 12,
    marginVertical: 8,
    marginBottom: 18,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    elevation: 4,
    alignSelf: 'flex-start',
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
    width: 48,
    height: 48,
    borderRadius: 8,
    backgroundColor: '#eee',
  },
  menuCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    padding: 14,
    marginBottom: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
    borderWidth: 1,
  },
  menuImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    backgroundColor: '#eee',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    alignItems: 'center',
  },
});
