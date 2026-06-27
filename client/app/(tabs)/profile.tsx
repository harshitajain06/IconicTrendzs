import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, ScrollView, Text, TouchableOpacity, View, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { COLORS } from "@/constants";
import { useClerk } from "@clerk/clerk-expo";

type MenuItem = {
    id: string;
    title: string;
    icon: string;
    route?: string;
    onPress?: () => void;
    danger?: boolean;
};

type MenuSection = {
    title: string;
    items: MenuItem[];
};

export default function Profile() {
    const router = useRouter();
    const { user, signOut } = useClerk();

    const handleLogout = async () => {
        await signOut();
        router.replace("/sign-in");
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            "Delete Account",
            "Are you sure you want to permanently delete your account? This action cannot be undone.",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Delete",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await user?.delete();
                            router.replace("/sign-in");
                        } catch {
                            Alert.alert("Error", "Failed to delete account. Please contact support.");
                        }
                    },
                },
            ]
        );
    };

    const sections: MenuSection[] = [
        {
            title: "My Account",
            items: [
                { id: "orders", title: "My Orders", icon: "receipt-outline", route: "/orders" },
                { id: "wallet", title: "My Wallet", icon: "wallet-outline", route: "/wallet" },
                { id: "returns", title: "Returns", icon: "return-down-back-outline", route: "/returns" },
                { id: "addresses", title: "Shipping Addresses", icon: "location-outline", route: "/addresses" },
                { id: "favorites", title: "Wishlist", icon: "heart-outline", route: "/(tabs)/favorites" },
            ],
        },
        {
            title: "Support",
            items: [
                { id: "faqs", title: "FAQs", icon: "help-circle-outline", route: "/faqs" },
                { id: "contact", title: "Contact Us", icon: "chatbubble-ellipses-outline", route: "/contact-us" },
            ],
        },
        {
            title: "Legal",
            items: [
                { id: "return-policy", title: "Return Policy", icon: "refresh-outline", route: "/return-policy" },
                { id: "shipping-policy", title: "Shipping Policy", icon: "car-outline", route: "/shipping-policy" },
            ],
        },
        {
            title: "Account",
            items: [
                {
                    id: "delete",
                    title: "Delete Account",
                    icon: "trash-outline",
                    onPress: handleDeleteAccount,
                    danger: true,
                },
            ],
        },
    ];

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <Header title="Profile" />

            <ScrollView
                className="flex-1 px-4"
                contentContainerStyle={!user ? { flex: 1, justifyContent: "center", alignItems: "center" } : { paddingTop: 16, paddingBottom: 32 }}
                showsVerticalScrollIndicator={false}
            >
                {!user ? (
                    <View className="items-center w-full">
                        <View className="w-24 h-24 rounded-full bg-gray-200 items-center justify-center mb-6">
                            <Ionicons name="person" size={40} color={COLORS.secondary} />
                        </View>
                        <Text className="text-primary font-bold text-xl mb-2">Guest User</Text>
                        <Text className="text-secondary text-base mb-8 text-center w-3/4 px-4">
                            Log in to view your profile, orders, and addresses.
                        </Text>
                        <TouchableOpacity
                            onPress={() => router.push("/sign-in")}
                            className="bg-primary w-3/5 py-3 rounded-full items-center shadow-lg"
                        >
                            <Text className="text-white font-bold text-lg">Login / Sign Up</Text>
                        </TouchableOpacity>
                    </View>
                ) : (
                    <>
                        {/* Profile Info */}
                        <View className="items-center mb-6">
                            <Image
                                source={{ uri: user.imageUrl }}
                                className="size-20 border-2 border-white shadow-sm rounded-full mb-3"
                            />
                            <Text className="text-xl font-bold text-primary">
                                {user.firstName} {user.lastName}
                            </Text>
                            <Text className="text-secondary text-sm">{user.emailAddresses[0].emailAddress}</Text>

                            {user.publicMetadata?.role === "admin" && (
                                <TouchableOpacity
                                    onPress={() => router.push("/admin")}
                                    className="mt-4 bg-primary px-6 py-2 rounded-full"
                                >
                                    <Text className="text-white font-bold">Admin Panel</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Menu Sections */}
                        {sections.map((section) => (
                            <View key={section.title} className="mb-4">
                                <Text className="text-secondary text-xs font-semibold uppercase tracking-wider px-1 mb-2">
                                    {section.title}
                                </Text>
                                <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                                    {section.items.map((item, index) => (
                                        <TouchableOpacity
                                            key={item.id}
                                            onPress={item.onPress ?? (() => router.push(item.route as any))}
                                            className={`flex-row items-center p-4 ${index !== section.items.length - 1 ? "border-b border-gray-100" : ""}`}
                                            activeOpacity={0.7}
                                        >
                                            <View className={`w-9 h-9 rounded-full items-center justify-center mr-3 ${item.danger ? "bg-red-50" : "bg-surface"}`}>
                                                <Ionicons
                                                    name={item.icon as any}
                                                    size={18}
                                                    color={item.danger ? "#ef4444" : COLORS.primary}
                                                />
                                            </View>
                                            <Text className={`flex-1 font-medium ${item.danger ? "text-red-500" : "text-primary"}`}>
                                                {item.title}
                                            </Text>
                                            <Ionicons name="chevron-forward" size={18} color={COLORS.secondary} />
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </View>
                        ))}

                        {/* Sign Out */}
                        <TouchableOpacity
                            onPress={handleLogout}
                            className="flex-row items-center justify-center py-4 mt-2"
                        >
                            <Ionicons name="log-out-outline" size={20} color="#ef4444" />
                            <Text className="text-red-500 font-bold ml-2">Sign Out</Text>
                        </TouchableOpacity>
                    </>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}
