import { Stack } from "expo-router";
import { StatusBar } from 'expo-status-bar';
import React from "react";

const Layout = () => {
    return (
        <>
            <Stack>
                {/* <Stack.Screen name="welcome" options={{ headerShown: false }} /> */}
                <Stack.Screen name="signin" options={{ headerShown: false }} />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="forgot-password" options={{ headerShown: false }} />
                <Stack.Screen name="verify-code" options={{ headerShown: false }} />
                <Stack.Screen name="reset-password" options={{ headerShown: false }} />
            </Stack>
            <StatusBar style="auto" />
        </>
    );
};

export default Layout;