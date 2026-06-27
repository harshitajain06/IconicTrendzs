import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { COLORS } from "@/constants";
import api from "@/constants/api";
import type { Order } from "@/constants/types";

export default function Returns() {
    const router = useRouter();
    const { getToken } = useAuth();
    const [orders, setOrders] = useState<Order[]>([]);
    const [loading, setLoading] = useState(true);
    const [selected, setSelected] = useState<Order | null>(null);
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        fetchDelivered();
    }, []);

    const fetchDelivered = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get("/orders", { headers: { Authorization: `Bearer ${token}` } });
            const delivered = (data.data as Order[]).filter((o) => o.orderStatus === "delivered");
            setOrders(delivered);
        } catch {
            // non-critical
        } finally {
            setLoading(false);
        }
    };

    const submitReturn = async () => {
        if (!reason.trim()) {
            Toast.show({ type: "info", text1: "Please enter a reason for return" });
            return;
        }
        setSubmitting(true);
        // Simulate submission — in production send to a returns API
        await new Promise((r) => setTimeout(r, 800));
        setSubmitting(false);
        setSelected(null);
        setReason("");
        Toast.show({ type: "success", text1: "Return request submitted", text2: "Our team will reach out within 24–48 hours." });
    };

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={["top"]}>
            <View className="flex-row items-center px-4 py-4 bg-white border-b border-gray-100">
                <TouchableOpacity onPress={() => router.back()} className="mr-3">
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>
                <Text className="text-xl font-bold text-primary">Returns</Text>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={COLORS.primary} className="mt-10" />
            ) : (
                <ScrollView className="flex-1 px-4 pt-5" showsVerticalScrollIndicator={false}>
                    <View className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5 flex-row gap-3">
                        <Ionicons name="information-circle-outline" size={20} color="#d97706" />
                        <Text className="text-amber-800 text-sm flex-1 leading-5">
                            Returns are accepted within 7 days of delivery. Items must be unused and in original packaging.
                        </Text>
                    </View>

                    {orders.length === 0 ? (
                        <View className="items-center py-16">
                            <Ionicons name="bag-check-outline" size={48} color="#ccc" />
                            <Text className="text-secondary mt-3 text-base font-medium">No delivered orders</Text>
                            <Text className="text-secondary text-sm mt-1 text-center px-8">Only delivered orders are eligible for return.</Text>
                        </View>
                    ) : (
                        orders.map((order) => (
                            <View key={order._id} className="bg-white rounded-2xl p-4 mb-4 border border-gray-100">
                                <View className="flex-row justify-between items-center mb-3">
                                    <Text className="text-primary font-bold text-sm">{order.orderNumber}</Text>
                                    <View className="bg-green-50 px-3 py-1 rounded-full">
                                        <Text className="text-green-700 text-xs font-medium">Delivered</Text>
                                    </View>
                                </View>
                                <Text className="text-secondary text-xs mb-3">
                                    {order.items.length} item{order.items.length > 1 ? "s" : ""} · ₹{order.totalAmount}
                                </Text>
                                <TouchableOpacity
                                    onPress={() => setSelected(order)}
                                    className="border border-primary rounded-xl py-2.5 items-center"
                                >
                                    <Text className="text-primary font-semibold text-sm">Request Return</Text>
                                </TouchableOpacity>
                            </View>
                        ))
                    )}
                </ScrollView>
            )}

            {/* Return Modal */}
            <Modal visible={!!selected} transparent animationType="slide">
                <View className="flex-1 justify-end bg-black/40">
                    <View className="bg-white rounded-t-3xl p-6">
                        <Text className="text-primary font-bold text-lg mb-1">Request Return</Text>
                        <Text className="text-secondary text-sm mb-5">{selected?.orderNumber}</Text>

                        <Text className="text-primary font-semibold text-sm mb-2">Reason for Return</Text>
                        <TextInput
                            className="bg-surface rounded-xl p-4 text-primary mb-5"
                            style={{ borderWidth: 1, borderColor: "#EEEEEE", minHeight: 90, textAlignVertical: "top" }}
                            placeholder="Describe why you want to return this order..."
                            placeholderTextColor="#bbb"
                            multiline
                            value={reason}
                            onChangeText={setReason}
                        />

                        <View className="flex-row gap-3">
                            <TouchableOpacity
                                onPress={() => { setSelected(null); setReason(""); }}
                                className="flex-1 py-3.5 rounded-xl border border-gray-200 items-center"
                            >
                                <Text className="text-secondary font-medium">Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                onPress={submitReturn}
                                disabled={submitting}
                                className={`flex-1 py-3.5 rounded-xl items-center ${submitting ? "bg-gray-300" : "bg-primary"}`}
                            >
                                {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-bold">Submit</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    );
}
