import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { COLORS } from "@/constants";

const transactions: { id: string; label: string; amount: number; date: string; type: "credit" | "debit" }[] = [];

export default function Wallet() {
    const router = useRouter();

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-primary">My Wallet</Text>
            </View>

            <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false}>
                {/* Balance Card */}
                <View className="bg-primary rounded-2xl p-6 mb-6 items-center">
                    <Text className="text-white/70 text-sm mb-1">Wallet Balance</Text>
                    <Text className="text-white text-4xl font-bold mb-1">₹0.00</Text>
                    <Text className="text-white/60 text-xs">Available to use on your next order</Text>
                </View>

                {/* How to Earn */}
                <View className="bg-white rounded-2xl p-5 mb-5 border border-gray-100">
                    <Text className="text-primary font-bold text-base mb-4">How to Earn Credits</Text>
                    {[
                        { icon: "return-down-back-outline", label: "Return Refunds", desc: "Refunds for approved returns are credited to your wallet" },
                        { icon: "gift-outline", label: "Referral Bonus", desc: "Earn credits when a friend signs up using your referral" },
                        { icon: "star-outline", label: "Loyalty Rewards", desc: "Earn 1% cashback on every completed order" },
                    ].map((item) => (
                        <View key={item.label} className="flex-row items-start mb-4 last:mb-0">
                            <View className="w-10 h-10 bg-surface rounded-full items-center justify-center mr-3 mt-0.5">
                                <Ionicons name={item.icon as any} size={18} color={COLORS.primary} />
                            </View>
                            <View className="flex-1">
                                <Text className="text-primary font-semibold text-sm">{item.label}</Text>
                                <Text className="text-secondary text-xs mt-0.5 leading-4">{item.desc}</Text>
                            </View>
                        </View>
                    ))}
                </View>

                {/* Transaction History */}
                <View className="bg-white rounded-2xl p-5 mb-8 border border-gray-100">
                    <Text className="text-primary font-bold text-base mb-4">Transaction History</Text>
                    {transactions.length === 0 ? (
                        <View className="items-center py-8">
                            <Ionicons name="wallet-outline" size={40} color="#ccc" />
                            <Text className="text-secondary mt-3 text-sm">No transactions yet</Text>
                        </View>
                    ) : (
                        transactions.map((t) => (
                            <View key={t.id} className="flex-row justify-between items-center py-3 border-b border-gray-50">
                                <Text className="text-primary text-sm">{t.label}</Text>
                                <Text className={`font-bold ${t.type === "credit" ? "text-green-600" : "text-red-500"}`}>
                                    {t.type === "credit" ? "+" : "-"}₹{t.amount}
                                </Text>
                            </View>
                        ))
                    )}
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}
