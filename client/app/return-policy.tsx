import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

const sections = [
    {
        title: "Eligibility",
        content: "Items must be returned within 7 days of delivery. Products must be unused, unwashed, and in their original packaging with all tags intact. Sale items, innerwear, and accessories are non-returnable.",
    },
    {
        title: "How to Initiate a Return",
        content: "Go to Profile → Returns, select the delivered order, and submit a return request with your reason. Our team will review and respond within 24–48 hours.",
    },
    {
        title: "Refund Process",
        content: "Once your return is approved and the item is received and inspected, the refund will be credited to your original payment method or wallet within 5–7 business days.",
    },
    {
        title: "Damaged or Defective Items",
        content: "If you receive a damaged or defective product, please contact us within 48 hours of delivery with photos. We will arrange a replacement or full refund at no extra cost.",
    },
    {
        title: "Non-Returnable Items",
        content: "The following are not eligible for return:\n• Innerwear and swimwear\n• Accessories (jewellery, belts, scarves)\n• Items marked as Final Sale\n• Items without original tags or packaging",
    },
    {
        title: "Return Shipping",
        content: "For approved returns, we will arrange a pickup from your doorstep free of charge. In some pin codes, you may be asked to ship the item yourself; the shipping cost will be reimbursed.",
    },
];

export default function ReturnPolicy() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-primary">Return Policy</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <Text className="text-secondary text-sm leading-5 mb-5">
                    We want you to love every purchase. If something isn't right, here's everything you need to know about our return policy.
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
