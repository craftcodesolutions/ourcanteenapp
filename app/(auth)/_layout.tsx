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
            </Stack>
            <StatusBar style="auto" />
        </>
    );
};

export default Layout;