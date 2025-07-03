import { Colors } from "@/constants/Colors";
import { useCart } from "@/context/CartContext";
import { useColorScheme } from '@/hooks/useColorScheme';
import { MaterialIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from "react";
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const CartPage = () => {
  const { cart, removeFromCart, clearCart } = useCart();
  const colorScheme = useColorScheme() ?? 'light';
  const cardBg = Colors[colorScheme].background;
  const textColor = Colors[colorScheme].text;
  // const iconColor = Colors[colorScheme].icon;
  const primary = Colors[colorScheme].tint;
  const itemBg = colorScheme === 'light' ? '#fff' : '#232323';
  const itemShadow = colorScheme === 'light' ? '#000' : '#000';
  const removeBtnBg = colorScheme === 'light' ? '#fbe9e7' : '#3a2323';
  const removeIconColor = '#d9534f';
  const clearCartBg = '#d9534f';
  const clearCartTextColor = '#fff';
  const emptyIconColor = colorScheme === 'light' ? '#e0e0e0' : '#333';
  const emptyTextColor = colorScheme === 'light' ? '#888' : '#aaa';
  const priceColor = colorScheme === 'light' ? '#555' : '#bbb';
  const subtotalColor = colorScheme === 'light' ? '#888' : '#aaa';
  const nameColor = colorScheme === 'light' ? '#222' : '#ececec';
  const totalColor = colorScheme === 'light' ? '#222' : '#ececec';
  const dividerColor = colorScheme === 'light' ? '#ececec' : '#232323';

  const router = useRouter();

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (cart.length === 0) {
    return (
      <SafeAreaView style={[styles.center, { backgroundColor: cardBg }]}> 
        <MaterialIcons name="shopping-cart" size={64} color={emptyIconColor} style={{ marginBottom: 16 }} />
        <Text style={[styles.emptyText, { color: emptyTextColor }]}>Your cart is empty.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: cardBg }]}> 
      <View style={styles.headerWrapper}>
        <Text style={[styles.pageTitle, { color: textColor }]}>My Cart</Text>
      </View>
      <View style={[styles.divider, { backgroundColor: dividerColor }]} />
      <FlatList
        data={cart}
        keyExtractor={(item) => item._id}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: 24 }}
        renderItem={({ item }) => (
          <View style={[styles.itemContainer, { backgroundColor: itemBg, shadowColor: itemShadow }]}> 
            <Image source={{ uri: item.image }} style={styles.image} />
            <View style={styles.info}>
              <Text style={[styles.name, { color: nameColor }]}>{item.name}</Text>
              <Text style={[styles.price, { color: priceColor }]}>৳{item.price.toFixed(2)} x {item.quantity}</Text>
              <Text style={[styles.subtotal, { color: subtotalColor }]}>Subtotal: ৳{(item.price * item.quantity).toFixed(2)}</Text>
            </View>
            <TouchableOpacity onPress={() => removeFromCart(item._id)} style={[styles.removeButton, { backgroundColor: removeBtnBg }]} accessibilityLabel="Remove from cart">
              <MaterialIcons name="delete" size={18} color={removeIconColor} />
            </TouchableOpacity>
          </View>
        )}
        ListFooterComponent={
          <View style={styles.footer}>
            <Text style={[styles.total, { color: totalColor }]}>Total: ৳{total.toFixed(2)}</Text>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.continueOrderButton, { backgroundColor: primary, marginRight: 8, flex: 1 }]}
                onPress={() => { router.push('/confirmorder'); }}
                activeOpacity={0.85}
                accessibilityLabel="Continue Order"
              >
                <MaterialIcons name="arrow-forward" size={16} color={colorScheme === 'light' ? '#fff' : '#18181b'} style={{ marginRight: 6 }} />
                <Text style={[styles.continueOrderText, { color: colorScheme === 'light' ? '#fff' : '#18181b' }]}>Continue Order</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.clearCartButton, { backgroundColor: clearCartBg, marginLeft: 8, flex: 1 }]}
                onPress={clearCart}
                accessibilityLabel="Clear cart"
              >
                <MaterialIcons name="delete-sweep" size={16} color={clearCartTextColor} style={{ marginRight: 6 }} />
                <Text style={[styles.clearCartText, { color: clearCartTextColor }]}>Clear Cart</Text>
              </TouchableOpacity>
            </View>
          </View>
        }
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
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
    borderRadius: 16,
    padding: 14,
    marginHorizontal: 12,
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  image: {
    width: 64,
    height: 64,
    borderRadius: 12,
    marginRight: 16,
    backgroundColor: '#eee',
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 2,
  },
  price: {
    fontSize: 15,
    marginBottom: 1,
  },
  subtotal: {
    fontSize: 14,
  },
  removeButton: {
    padding: 8,
    borderRadius: 8,
    marginLeft: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    marginTop: 32,
    alignItems: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
    marginTop: 4,
    gap: 0,
    paddingHorizontal: 16,
  },
  total: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  continueOrderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    minHeight: 36,
  },
  continueOrderText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 1,
    letterSpacing: 0.1,
    textAlign: 'center',
    flex: 1,
  },
  clearCartButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    minHeight: 36,
  },
  clearCartText: {
    fontWeight: 'bold',
    fontSize: 14,
    marginLeft: 1,
    textAlign: 'center',
    flex: 1,
  },
});

export default CartPage;