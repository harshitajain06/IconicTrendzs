import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

const sections = [
    {
        title: "Processing Time",
        content: "Orders are processed within 1–2 business days after payment confirmation. Orders placed on weekends or public holidays are processed the next business day.",
    },
    {
        title: "Delivery Time",
        content: "Standard Delivery: 4–7 business days\nExpress Delivery: 1–2 business days (available in select cities)\nRemote areas may take up to 10 business days.",
    },
    {
        title: "Shipping Charges",
        content: "Free shipping on all orders above ₹499.\nOrders below ₹499: ₹49 flat shipping fee.\nExpress delivery: ₹99 additional charge.",
    },
    {
        title: "Order Tracking",
        content: "Once your order is shipped, you will receive a tracking number via email. You can track your order under Profile → My Orders.",
    },
    {
        title: "Delivery Attempts",
        content: "Our delivery partner will make up to 3 delivery attempts. If all attempts fail, the order will be returned to our warehouse and a refund will be initiated.",
    },
    {
        title: "International Shipping",
        content: "We currently ship only within India. International shipping is not available at this time.",
    },
];

export default function ShippingPolicy() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-primary">Shipping Policy</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <Text className="text-secondary text-sm leading-5 mb-5">
                    We deliver across India. Here's everything you need to know about how and when we ship your orders.
                </Text>

                {sections.map((s, i) => (
                    <View key={i} className="bg-white rounded-2xl p-5 mb-4 border border-gray-100">
                        <Text className="text-primary font-bold mb-2">{s.title}</Text>
                        <Text className="text-secondary text-sm leading-6">{s.content}</Text>
                    </View>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
