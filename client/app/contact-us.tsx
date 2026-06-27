import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Linking, View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

const contacts = [
    {
        icon: "mail-outline",
        label: "Email Us",
        value: "jainharshita0604@gmail.com",
        action: () => Linking.openURL("mailto:jainharshita0604@gmail.com"),
    },
    {
        icon: "call-outline",
        label: "Call Us",
        value: "+91 97565 03875",
        action: () => Linking.openURL("tel:+919756503875"),
    },
    {
        icon: "logo-whatsapp",
        label: "WhatsApp",
        value: "+91 97565 03875",
        action: () => Linking.openURL("https://wa.me/919756503875"),
    },
    {
        icon: "logo-instagram",
        label: "Instagram",
        value: "@iconictrendzs",
        action: () => Linking.openURL("https://instagram.com/iconictrendzs"),
    },
];

export default function ContactUs() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-primary">Contact Us</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <Text className="text-secondary text-sm leading-5 mb-6">
                    We're here to help! Reach out to us through any of the channels below. Our support team responds within 24 hours.
                </Text>

                <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden mb-5">
                    {contacts.map((c, i) => (
                        <TouchableOpacity
                            key={c.label}
                            onPress={c.action}
                            className={`flex-row items-center p-4 ${i !== contacts.length - 1 ? "border-b border-gray-100" : ""}`}
                            activeOpacity={0.7}
                        >
                            <View className="w-10 h-10 bg-surface rounded-full items-center justify-center mr-4">
                                <Ionicons name={c.icon as any} size={20} color={COLORS.primary} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-primary font-semibold text-sm">{c.label}</Text>
                                <Text className="text-secondary text-xs mt-0.5">{c.value}</Text>
                            </View>
                            <Ionicons name="chevron-forward" size={18} color={COLORS.secondary} />
                        </TouchableOpacity>
                    ))}
                </View>

                <View className="bg-white rounded-2xl p-5 border border-gray-100">
                    <Text className="text-primary font-bold mb-2">Business Hours</Text>
                    <Text className="text-secondary text-sm leading-6">
                        Monday – Saturday: 9:00 AM – 6:00 PM{"\n"}
                        Sunday: 10:00 AM – 4:00 PM{"\n"}
                        Public Holidays: Closed
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
