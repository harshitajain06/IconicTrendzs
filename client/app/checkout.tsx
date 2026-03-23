import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { ScrollView, Text, TouchableOpacity, View, ActivityIndicator, Modal, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Header from "@/components/Header";
import { COLORS } from "@/constants";
import api from "@/constants/api";
import { Address } from "@/constants/types";
import { useCart } from "@/context/CartContext";
import { useAuth } from "@clerk/clerk-expo";
import Toast from 'react-native-toast-message';
import { WebView } from 'react-native-webview';

type RazorpayOrderResponse = {
    success?: boolean;
    keyId: string;
    orderId: string;
    amount: number;
    currency: string;
};

function buildRazorpayCheckoutHtml(init: {
    keyId: string;
    amount: number;
    currency: string;
    orderId: string;
    mongoOrderId: string;
}) {
    const safe = JSON.stringify(init).replace(/</g, "\\u003c");
    return `<!DOCTYPE html><html><head><meta charset="utf-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head><body>
<script>const INIT=${safe};</script>
<script src="https://checkout.razorpay.com/v1/checkout.js" onload="openRzp()"></script>
<script>
function openRzp(){
  var options={
    key:INIT.keyId,
    amount:INIT.amount,
    currency:INIT.currency,
    order_id:INIT.orderId,
    name:'Iconic Trendzs',
    description:'Order payment',
    handler:function(response){
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({
          type:'razorpay_success',
          mongoOrderId:INIT.mongoOrderId,
          razorpay_payment_id:response.razorpay_payment_id,
          razorpay_order_id:response.razorpay_order_id,
          razorpay_signature:response.razorpay_signature
        }));
      }
    },
    modal:{ondismiss:function(){
      if(window.ReactNativeWebView){
        window.ReactNativeWebView.postMessage(JSON.stringify({type:'razorpay_dismiss'}));
      }
    }}
  };
  var rzp=new Razorpay(options);
  rzp.open();
}
</script></body></html>`;
}

function loadRazorpayScript(): Promise<void> {
    return new Promise((resolve, reject) => {
        if (typeof window === "undefined" || typeof document === "undefined") {
            reject(new Error("Not in browser"));
            return;
        }
        const w = window as unknown as { Razorpay?: unknown };
        if (w.Razorpay) {
            resolve();
            return;
        }
        const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]');
        if (existing) {
            existing.addEventListener("load", () => resolve());
            existing.addEventListener("error", () => reject(new Error("Razorpay script failed")));
            return;
        }
        const s = document.createElement("script");
        s.src = "https://checkout.razorpay.com/v1/checkout.js";
        s.onload = () => resolve();
        s.onerror = () => reject(new Error("Failed to load Razorpay"));
        document.body.appendChild(s);
    });
}

export default function Checkout() {
    const router = useRouter();
    const { cartTotal, clearCart } = useCart();
    const [loading, setLoading] = useState(false);
    const [pageLoading, setPageLoading] = useState(true);

    const { getToken } = useAuth();
    const [showGateway, setShowGateway] = useState(false);
    const [gatewayHtml, setGatewayHtml] = useState("");

    const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);

    const [paymentMethod, setPaymentMethod] = useState<"cash" | "razorpay">("cash");

    const shipping = 2.00;
    const tax = 0;
    const total = cartTotal + shipping + tax;

    const fetchData = async () => {
        try {
            const token = await getToken();
            const { data } = await api.get("/addresses", {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            const addrList = data.data;
            if (addrList.length > 0) {
                const def = addrList.find((a: Address) => a.isDefault) || addrList[0];
                setSelectedAddress(def);
            }
        } catch (error) {
            console.error("Error fetching checkout data:", error);
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Failed to load checkout information'
            });
        } finally {
            setPageLoading(false);
        }
    };

    const verifyWithServer = async (payload: {
        mongoOrderId: string;
        razorpay_payment_id: string;
        razorpay_order_id: string;
        razorpay_signature: string;
    }) => {
        const token = await getToken();
        await api.post(
            "/payments/verify",
            {
                mongoOrderId: payload.mongoOrderId,
                razorpay_payment_id: payload.razorpay_payment_id,
                razorpay_order_id: payload.razorpay_order_id,
                razorpay_signature: payload.razorpay_signature,
            },
            { headers: { Authorization: `Bearer ${token}` } }
        );
        await clearCart();
        router.replace("/orders");
    };

    const handleRazorpayCheckout = async () => {
        setLoading(true);
        try {
            const token = await getToken();

            const shippingAddressPayload = {
                street: selectedAddress!.street,
                city: selectedAddress!.city,
                state: selectedAddress!.state,
                zipCode: selectedAddress!.zipCode,
                country: selectedAddress!.country
            };

            const orderPayload = {
                shippingAddress: shippingAddressPayload,
                notes: "Placed via App",
                paymentMethod: "razorpay",
            };

            const { data: orderData } = await api.post("/orders", orderPayload, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!orderData.success) {
                throw new Error("Failed to create order");
            }

            const mongoOrderId = orderData.data._id as string;

            const { data: rzpData } = await api.post(
                "/payments/razorpay-order",
                { orderId: mongoOrderId },
                { headers: { Authorization: `Bearer ${token}` } }
            ) as { data: RazorpayOrderResponse };

            if (!rzpData?.keyId || !rzpData?.orderId) {
                throw new Error("Invalid Razorpay order response");
            }

            if (Platform.OS === "web") {
                await loadRazorpayScript();
                const w = window as unknown as {
                    Razorpay: new (opts: Record<string, unknown>) => { open: () => void };
                };
                const options = {
                    key: rzpData.keyId,
                    amount: rzpData.amount,
                    currency: rzpData.currency,
                    order_id: rzpData.orderId,
                    name: "Iconic Trendzs",
                    description: "Order payment",
                    handler: async (response: {
                        razorpay_payment_id: string;
                        razorpay_order_id: string;
                        razorpay_signature: string;
                    }) => {
                        try {
                            await verifyWithServer({
                                mongoOrderId,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_signature: response.razorpay_signature,
                            });
                            Toast.show({
                                type: 'success',
                                text1: 'Paid',
                                text2: 'Payment successful'
                            });
                        } catch (e: unknown) {
                            console.error(e);
                            Toast.show({
                                type: 'error',
                                text1: 'Verification failed',
                                text2: 'Payment may have succeeded; check your orders'
                            });
                        }
                    },
                };
                const rzp = new w.Razorpay(options);
                rzp.open();
            } else {
                setGatewayHtml(
                    buildRazorpayCheckoutHtml({
                        keyId: rzpData.keyId,
                        amount: rzpData.amount,
                        currency: rzpData.currency,
                        orderId: rzpData.orderId,
                        mongoOrderId,
                    })
                );
                setShowGateway(true);
            }
        } catch (error: unknown) {
            console.error(error);
            const err = error as { response?: { data?: { message?: string } }; message?: string };
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: err.response?.data?.message || err.message || "Failed to initialize payment"
            });
        } finally {
            setLoading(false);
        }
    };

    const onGatewayMessage = async (event: { nativeEvent: { data: string } }) => {
        try {
            const data = JSON.parse(event.nativeEvent.data) as
                | { type: 'razorpay_success'; mongoOrderId: string; razorpay_payment_id: string; razorpay_order_id: string; razorpay_signature: string }
                | { type: 'razorpay_dismiss' };

            if (data.type === "razorpay_dismiss") {
                setShowGateway(false);
                return;
            }
            if (data.type !== "razorpay_success") return;

            setLoading(true);
            try {
                await verifyWithServer({
                    mongoOrderId: data.mongoOrderId,
                    razorpay_payment_id: data.razorpay_payment_id,
                    razorpay_order_id: data.razorpay_order_id,
                    razorpay_signature: data.razorpay_signature,
                });
                setShowGateway(false);
                Toast.show({
                    type: 'success',
                    text1: 'Paid',
                    text2: 'Payment successful'
                });
            } catch (e: unknown) {
                console.error(e);
                Toast.show({
                    type: 'error',
                    text1: 'Verification failed',
                    text2: 'Contact support if money was debited'
                });
            } finally {
                setLoading(false);
            }
        } catch {
            // ignore parse errors
        }
    };


    const handlePlaceOrder = async () => {
        if (!selectedAddress) {
            Toast.show({
                type: 'error',
                text1: 'Error',
                text2: 'Please add a shipping address'
            });
            return;
        }

        if (paymentMethod === "razorpay") {
            handleRazorpayCheckout();
            return;
        }

        setLoading(true);
        try {
            const shippingAddressPayload = {
                street: selectedAddress.street,
                city: selectedAddress.city,
                state: selectedAddress.state,
                zipCode: selectedAddress.zipCode,
                country: selectedAddress.country
            };

            const payload = {
                shippingAddress: shippingAddressPayload,
                notes: "Placed via App",
                paymentMethod: "cash",
            };

            const token = await getToken();

            const { data } = await api.post("/orders", payload, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (data.success) {
                await clearCart();
                Toast.show({
                    type: 'success',
                    text1: 'Order Placed',
                    text2: 'Your order has been placed successfully!'
                });
                router.replace("/orders");
            }
        } catch (error: unknown) {
            console.log(error)
            const err = error as { response?: { data?: { message?: string } } };
            Toast.show({
                type: 'error',
                text1: 'Failed to Place Order',
                text2: err.response?.data?.message || "Something went wrong"
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    if (pageLoading) {
        return (
            <SafeAreaView className="flex-1 bg-surface justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-surface" edges={['top']}>
            <Header title="Checkout" showBack />

            <ScrollView className="flex-1 px-4 mt-4">
                <Text className="text-lg font-bold text-primary mb-4">Shipping Address</Text>
                {selectedAddress ? (
                    <View className="bg-white p-4 rounded-xl mb-6 shadow-sm">
                        <View className="flex-row items-center justify-between mb-2">
                            <Text className="text-base font-bold">{selectedAddress.type}</Text>
                            <TouchableOpacity onPress={() => router.push("/addresses")}>
                                <Text className="text-accent text-sm">Change</Text>
                            </TouchableOpacity>
                        </View>
                        <Text className="text-secondary leading-5">
                            {selectedAddress.street}, {selectedAddress.city}{'\n'}
                            {selectedAddress.state} {selectedAddress.zipCode}{'\n'}
                            {selectedAddress.country}
                        </Text>
                    </View>
                ) : (
                    <TouchableOpacity
                        onPress={() => router.push("/addresses")}
                        className="bg-white p-6 rounded-xl mb-6 items-center justify-center border-dashed border-2 border-gray-100"
                    >
                        <Text className="text-primary font-bold">Add Address</Text>
                    </TouchableOpacity>
                )}

                <Text className="text-lg font-bold text-primary mb-4">Payment Method</Text>

                <TouchableOpacity
                    onPress={() => setPaymentMethod("cash")}
                    className={`bg-white p-4 rounded-xl mb-4 shadow-sm flex-row items-center border-2 ${paymentMethod === "cash" ? "border-primary" : "border-transparent"}`}
                >
                    <Ionicons name="cash-outline" size={24} color={COLORS.primary} className="mr-3" />
                    <View className="ml-3 flex-1">
                        <Text className="text-base font-bold text-primary">Cash on Delivery</Text>
                        <Text className="text-secondary text-xs mt-1">Pay when you receive the order</Text>
                    </View>
                    {paymentMethod === "cash" && (
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => setPaymentMethod("razorpay")}
                    className={`bg-white p-4 rounded-xl mb-6 shadow-sm flex-row items-center border-2 ${paymentMethod === "razorpay" ? "border-primary" : "border-transparent"}`}
                >
                    <Ionicons name="card-outline" size={24} color={COLORS.primary} className="mr-3" />
                    <View className="ml-3 flex-1">
                        <Text className="text-base font-bold text-primary">Pay online (Razorpay)</Text>
                        <Text className="text-secondary text-xs mt-1">UPI, cards, netbanking (charged in INR)</Text>
                    </View>
                    {paymentMethod === "razorpay" && (
                        <Ionicons name="checkmark-circle" size={24} color={COLORS.primary} />
                    )}
                </TouchableOpacity>
            </ScrollView>

            <View className="p-4 bg-white shadow-lg border-t border-gray-100">
                <Text className="text-lg font-bold text-primary mb-4">Order Summary</Text>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-secondary">Subtotal</Text>
                    <Text className="font-bold">${cartTotal.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-2">
                    <Text className="text-secondary">Shipping</Text>
                    <Text className="font-bold">${shipping.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-4">
                    <Text className="text-secondary">Tax</Text>
                    <Text className="font-bold">${tax.toFixed(2)}</Text>
                </View>
                <View className="flex-row justify-between mb-6">
                    <Text className="text-xl font-bold text-primary">Total</Text>
                    <Text className="text-xl font-bold text-primary">${total.toFixed(2)}</Text>
                </View>

                <TouchableOpacity
                    onPress={handlePlaceOrder}
                    disabled={loading}
                    className={`p-3 rounded-xl bottom-7 items-center ${loading ? 'bg-gray-400' : 'bg-primary'}`}
                >
                    {loading ? (
                        <ActivityIndicator color="white" />
                    ) : (
                        <Text className="text-white font-bold text-lg">Place Order</Text>
                    )}
                </TouchableOpacity>
            </View>

            <Modal
                visible={showGateway}
                onDismiss={() => setShowGateway(false)}
                onRequestClose={() => setShowGateway(false)}
                animationType="slide"
                transparent={false}
            >
                <SafeAreaView className="flex-1 bg-white">
                    <View className="flex-row justify-between items-center p-4 border-b border-gray-100">
                        <Text className="text-lg font-bold">Payment</Text>
                        <TouchableOpacity onPress={() => setShowGateway(false)}>
                            <Ionicons name="close" size={24} color="black" />
                        </TouchableOpacity>
                    </View>
                    {gatewayHtml ? (
                        <WebView
                            source={{ html: gatewayHtml }}
                            onMessage={onGatewayMessage}
                            originWhitelist={["*"]}
                            javaScriptEnabled
                            startInLoadingState
                            renderLoading={() => <ActivityIndicator size="large" color={COLORS.primary} className="absolute top-1/2 left-1/2" />}
                        />
                    ) : null}
                </SafeAreaView>
            </Modal>
        </SafeAreaView>
    );
}
