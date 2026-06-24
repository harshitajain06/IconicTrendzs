import { useState } from "react";
import {
    Text, TextInput, TouchableOpacity, View, ActivityIndicator,
    KeyboardAvoidingView, ScrollView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Toast from 'react-native-toast-message';
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { useRouter, Link } from "expo-router";
import { useSignUp, useSSO } from "@clerk/clerk-expo";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import { COLORS } from "@/constants";

WebBrowser.maybeCompleteAuthSession();

export default function SignUpScreen() {
    const { isLoaded, signUp, setActive } = useSignUp();
    const { startSSOFlow } = useSSO();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [code, setCode] = useState("");
    const [pendingVerification, setPendingVerification] = useState(false);
    const [loading, setLoading] = useState(false);
    const [googleLoading, setGoogleLoading] = useState(false);

    const onGooglePress = async () => {
        setGoogleLoading(true);
        try {
            const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({
                strategy: "oauth_google",
                redirectUrl: Linking.createURL("/", { scheme: "client" }),
            });
            if (createdSessionId) {
                await ssoSetActive!({ session: createdSessionId });
                router.replace("/");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setGoogleLoading(false);
        }
    };

    const onSignUpPress = async () => {
        if (!isLoaded) return;
        if (!emailAddress || !password) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Please fill in all fields' });
            return;
        }
        setLoading(true);
        try {
            await signUp.create({ emailAddress, password, firstName, lastName });
            await signUp.prepareEmailAddressVerification({ strategy: "email_code" });
            setPendingVerification(true);
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed to Sign Up', text2: err?.errors?.[0]?.message ?? "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    const onVerifyPress = async () => {
        if (!isLoaded) return;
        if (!code) {
            Toast.show({ type: 'error', text1: 'Missing Fields', text2: 'Enter verification code' });
            return;
        }
        setLoading(true);
        try {
            const attempt = await signUp.attemptEmailAddressVerification({ code });
            if (attempt.status === "complete") {
                await setActive({ session: attempt.createdSessionId });
                router.replace("/");
            } else {
                Toast.show({ type: 'error', text1: 'Verification incomplete' });
            }
        } catch (err: any) {
            Toast.show({ type: 'error', text1: 'Failed to Verify', text2: err?.errors?.[0]?.message ?? "Invalid code" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={{ paddingHorizontal: 24 }}>
                        <TouchableOpacity
                            onPress={() => pendingVerification ? setPendingVerification(false) : router.push("/")}
                            className="py-4"
                        >
                            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {!pendingVerification ? (
                        <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
                            {/* Brand */}
                            <View className="mb-7 items-center">
                                <Text className="text-lg font-bold text-primary tracking-wide mb-4">IconicTrendzs</Text>
                                <Text className="text-2xl font-bold text-primary mb-1">Create account</Text>
                                <Text className="text-secondary">Join us and start shopping</Text>
                            </View>

                            {/* Google */}
                            <TouchableOpacity
                                onPress={onGooglePress}
                                disabled={googleLoading}
                                className="w-full flex-row items-center justify-center bg-white py-4 rounded-2xl mb-5 gap-3"
                                style={{ borderWidth: 1.5, borderColor: "#E8E8E8", shadowColor: "#000", shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
                            >
                                {googleLoading ? <ActivityIndicator color="#4285F4" /> : (
                                    <>
                                        <AntDesign name="google" size={18} color="#4285F4" />
                                        <Text className="text-primary font-semibold">Continue with Google</Text>
                                    </>
                                )}
                            </TouchableOpacity>

                            {/* Divider */}
                            <View className="flex-row items-center mb-5">
                                <View className="flex-1 h-px bg-gray-100" />
                                <Text className="mx-4 text-secondary text-xs font-medium">OR</Text>
                                <View className="flex-1 h-px bg-gray-100" />
                            </View>

                            {/* Name row */}
                            <View className="flex-row gap-3 mb-4">
                                <View className="flex-1">
                                    <Text className="text-primary font-semibold text-sm mb-2">First Name</Text>
                                    <View
                                        className="flex-row items-center bg-surface rounded-2xl px-4"
                                        style={{ borderWidth: 1, borderColor: "#EEEEEE" }}
                                    >
                                        <Ionicons name="person-outline" size={16} color="#bbb" />
                                        <TextInput
                                            className="flex-1 py-4 px-2 text-primary"
                                            placeholder="John"
                                            placeholderTextColor="#bbb"
                                            value={firstName}
                                            onChangeText={setFirstName}
                                        />
                                    </View>
                                </View>
                                <View className="flex-1">
                                    <Text className="text-primary font-semibold text-sm mb-2">Last Name</Text>
                                    <View
                                        className="flex-row items-center bg-surface rounded-2xl px-4"
                                        style={{ borderWidth: 1, borderColor: "#EEEEEE" }}
                                    >
                                        <Ionicons name="person-outline" size={16} color="#bbb" />
                                        <TextInput
                                            className="flex-1 py-4 px-2 text-primary"
                                            placeholder="Doe"
                                            placeholderTextColor="#bbb"
                                            value={lastName}
                                            onChangeText={setLastName}
                                        />
                                    </View>
                                </View>
                            </View>

                            {/* Email */}
                            <Text className="text-primary font-semibold text-sm mb-2">Email</Text>
                            <View
                                className="flex-row items-center bg-surface rounded-2xl px-4 mb-4"
                                style={{ borderWidth: 1, borderColor: "#EEEEEE" }}
                            >
                                <Ionicons name="mail-outline" size={18} color="#bbb" />
                                <TextInput
                                    className="flex-1 py-4 px-3 text-primary"
                                    placeholder="your@email.com"
                                    placeholderTextColor="#bbb"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={emailAddress}
                                    onChangeText={setEmailAddress}
                                />
                            </View>

                            {/* Password */}
                            <Text className="text-primary font-semibold text-sm mb-2">Password</Text>
                            <View
                                className="flex-row items-center bg-surface rounded-2xl px-4 mb-6"
                                style={{ borderWidth: 1, borderColor: "#EEEEEE" }}
                            >
                                <Ionicons name="lock-closed-outline" size={18} color="#bbb" />
                                <TextInput
                                    className="flex-1 py-4 px-3 text-primary"
                                    placeholder="••••••••"
                                    placeholderTextColor="#bbb"
                                    secureTextEntry={!showPassword}
                                    value={password}
                                    onChangeText={setPassword}
                                />
                                <TouchableOpacity onPress={() => setShowPassword(p => !p)}>
                                    <Ionicons name={showPassword ? "eye-outline" : "eye-off-outline"} size={18} color="#bbb" />
                                </TouchableOpacity>
                            </View>

                            {/* Submit */}
                            <TouchableOpacity
                                className={`w-full py-4 rounded-2xl items-center mb-6 ${loading ? "bg-gray-200" : "bg-primary"}`}
                                onPress={onSignUpPress}
                                disabled={loading}
                                style={!loading ? { shadowColor: "#111", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 } : {}}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Create Account</Text>}
                            </TouchableOpacity>

                            {/* Footer */}
                            <View className="flex-row justify-center">
                                <Text className="text-secondary">Already have an account? </Text>
                                <Link href="/sign-in">
                                    <Text className="text-primary font-bold">Login</Text>
                                </Link>
                            </View>
                        </View>
                    ) : (
                        <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
                            <View className="mb-8">
                                <Text className="text-2xl font-bold text-primary mb-1">Verify Email</Text>
                                <Text className="text-secondary">Enter the 6-digit code sent to your email</Text>
                            </View>

                            <View
                                className="flex-row items-center bg-surface rounded-2xl px-4 mb-6"
                                style={{ borderWidth: 1, borderColor: "#EEEEEE" }}
                            >
                                <Ionicons name="shield-checkmark-outline" size={18} color="#bbb" />
                                <TextInput
                                    className="flex-1 py-4 px-3 text-primary text-center tracking-widest text-lg"
                                    placeholder="123456"
                                    placeholderTextColor="#bbb"
                                    keyboardType="number-pad"
                                    value={code}
                                    onChangeText={setCode}
                                />
                            </View>

                            <TouchableOpacity
                                className={`w-full py-4 rounded-2xl items-center ${loading || !code ? "bg-gray-200" : "bg-primary"}`}
                                onPress={onVerifyPress}
                                disabled={loading || !code}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Verify</Text>}
                            </TouchableOpacity>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
