import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

const faqs = [
    {
        q: "How do I track my order?",
        a: "Go to Profile → My Orders and tap on your order to see real-time tracking updates.",
    },
    {
        q: "Can I change or cancel my order?",
        a: "Orders can be cancelled within 1 hour of placing them. After that, cancellation is not possible. Please contact us immediately if you need to make changes.",
    },
    {
        q: "What payment methods do you accept?",
        a: "We accept UPI, credit/debit cards, net banking, and Cash on Delivery (COD) via Razorpay.",
    },
    {
        q: "How do I return an item?",
        a: "Go to Profile → Returns, select the delivered order, and submit a return request. Returns are accepted within 7 days of delivery.",
    },
    {
        q: "When will I receive my refund?",
        a: "Refunds are processed within 5–7 business days after the returned item is received and inspected.",
    },
    {
        q: "Are the sizes true to fit?",
        a: "We follow standard Indian sizing. Please refer to the size chart on each product page before ordering. If you're between sizes, we recommend sizing up.",
    },
    {
        q: "Do you offer Cash on Delivery?",
        a: "Yes, COD is available on orders above ₹299 in most serviceable pin codes.",
    },
    {
        q: "How do I apply a coupon code?",
        a: "Enter your coupon code at checkout. The discount will be applied automatically if the code is valid.",
    },
    {
        q: "Is my payment information secure?",
        a: "Yes. All payments are processed through Razorpay, which is PCI-DSS compliant. We never store your card details.",
    },
    {
        q: "How do I contact customer support?",
        a: "You can reach us at support@iconictrendzs.com or through Profile → Contact Us. We respond within 24 hours.",
    },
];

export default function FAQs() {
    const router = useRouter();
    const [openIndex, setOpenIndex] = useState<number | null>(null);

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-primary">FAQs</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 32 }}>
                <Text className="text-secondary text-sm leading-5 mb-5">
                    Find answers to the most common questions about IconicTrendzs.
                </Text>

                {faqs.map((faq, i) => (
                    <TouchableOpacity
                        key={i}
                        onPress={() => setOpenIndex(openIndex === i ? null : i)}
                        className="bg-white rounded-2xl px-5 py-4 mb-3 border border-gray-100"
                        activeOpacity={0.8}
                    >
                        <View className="flex-row justify-between items-center">
                            <Text className="text-primary font-semibold text-sm flex-1 pr-3">{faq.q}</Text>
                            <Ionicons
                                name={openIndex === i ? "chevron-up" : "chevron-down"}
                                size={18}
                                color={COLORS.secondary}
                            />
                        </View>
                        {openIndex === i && (
                            <Text className="text-secondary text-sm mt-3 leading-6">{faq.a}</Text>
                        )}
                    </TouchableOpacity>
                ))}
            </ScrollView>
        </SafeAreaView>
    );
}
