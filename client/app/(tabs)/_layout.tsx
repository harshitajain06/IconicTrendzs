import { View, Text } from 'react-native'
import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { COLORS } from '@/constants'

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.secondary,
        tabBarShowLabel: false,
        tabBarStyle: {
            backgroundColor: COLORS.background,
            borderTopWidth: 1,
            borderTopColor: '#F0F0F0',
            height: 60,
            paddingBottom: 10,
            paddingTop: 10,
            paddingHorizontal: 20,
        },
    }}>
        
        <Tabs.Screen name="index" options={{ 
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'home' : 'home-outline'} color={color} size={26} />
        }} />
        <Tabs.Screen name="cart" options={{ 
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'cart' : 'cart-outline'} color={color} size={26} />
        }} />
        <Tabs.Screen name="favorites" options={{ 
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'heart' : 'heart-outline'} color={color} size={26} />
        }} />
        <Tabs.Screen name="profile" options={{ 
            tabBarIcon: ({ color, focused }) => <Ionicons name={focused ? 'person' : 'person-outline'} color={color} size={26} />
        }} />

    </Tabs>
  )
}