import { useAuth } from "@/context/AuthContext";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

const Page = () => {
  const { user, token, isAuthLoaded } = useAuth();

  console.log("User:", user);
  console.log("Token:", token);

  // Show loading indicator while auth is loading
  if (!isAuthLoaded) {
    return (
      <View className="flex-1 justify-center items-center">
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (user && token) {

    if (user.isOwner) {
      return <Redirect href="/(admin)/restaurants" />;
    }

    return <Redirect href="/(tabs)" />;

  }

  return <Redirect href="/(auth)/signin" />;

};

export default Page;