import { COLORS } from "@/constants";
import { useSignIn, useSSO } from "@clerk/clerk-expo";
import type { EmailCodeFactor } from "@clerk/types";
import { Ionicons, AntDesign } from "@expo/vector-icons";
import { Link, useRouter } from "expo-router";
import * as WebBrowser from "expo-web-browser";
import * as Linking from "expo-linking";
import * as React from "react";
import {
    Pressable, TextInput, View, Text, ActivityIndicator,
    TouchableOpacity, KeyboardAvoidingView, ScrollView, Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

WebBrowser.maybeCompleteAuthSession();

export default function Page() {
    const { signIn, setActive, isLoaded } = useSignIn();
    const { startSSOFlow } = useSSO();
    const router = useRouter();

    const [emailAddress, setEmailAddress] = React.useState("");
    const [password, setPassword] = React.useState("");
    const [showPassword, setShowPassword] = React.useState(false);
    const [code, setCode] = React.useState("");
    const [showEmailCode, setShowEmailCode] = React.useState(false);
    const [loading, setLoading] = React.useState(false);
    const [googleLoading, setGoogleLoading] = React.useState(false);

    const [showForgotPassword, setShowForgotPassword] = React.useState(false);
    const [forgotEmail, setForgotEmail] = React.useState("");
    const [showResetPassword, setShowResetPassword] = React.useState(false);
    const [resetCode, setResetCode] = React.useState("");
    const [newPassword, setNewPassword] = React.useState("");

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

    const onSignInPress = async () => {
        if (!isLoaded || !emailAddress || !password) return;
        setLoading(true);
        try {
            const signInAttempt = await signIn.create({ identifier: emailAddress, password });
            if (signInAttempt.status === "complete") {
                await setActive({ session: signInAttempt.createdSessionId });
                router.replace("/");
            } else if (signInAttempt.status === "needs_second_factor") {
                const emailCodeFactor = signInAttempt.supportedSecondFactors?.find((factor): factor is EmailCodeFactor => factor.strategy === "email_code");
                if (emailCodeFactor) {
                    await signIn.prepareSecondFactor({ strategy: "email_code", emailAddressId: emailCodeFactor.emailAddressId });
                    setShowEmailCode(true);
                }
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onVerifyPress = async () => {
        if (!isLoaded || !code) return;
        setLoading(true);
        try {
            const attempt = await signIn.attemptSecondFactor({ strategy: "email_code", code });
            if (attempt.status === "complete") {
                await setActive({ session: attempt.createdSessionId });
                router.replace("/");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onForgotPasswordPress = async () => {
        if (!isLoaded || !forgotEmail) return;
        setLoading(true);
        try {
            await signIn.create({ strategy: "reset_password_email_code", identifier: forgotEmail });
            setShowResetPassword(true);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const onResetPasswordPress = async () => {
        if (!isLoaded || !resetCode || !newPassword) return;
        setLoading(true);
        try {
            const attempt = await signIn.attemptFirstFactor({ strategy: "reset_password_email_code", code: resetCode, password: newPassword });
            if (attempt.status === "complete") {
                await setActive({ session: attempt.createdSessionId });
                router.replace("/");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (showForgotPassword) {
        return (
            <SafeAreaView className="flex-1 bg-white" style={{ paddingHorizontal: 24 }}>
                <TouchableOpacity
                    onPress={() => showResetPassword ? setShowResetPassword(false) : setShowForgotPassword(false)}
                    className="py-4"
                >
                    <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                </TouchableOpacity>

                <View className="flex-1 justify-center">
                    {!showResetPassword ? (
                        <>
                            <View className="mb-8">
                                <Text className="text-2xl font-bold text-primary mb-1">Forgot Password?</Text>
                                <Text className="text-secondary">We'll send a reset code to your email</Text>
                            </View>

                            <View className="flex-row items-center bg-surface rounded-2xl px-4 mb-5" style={{ borderWidth: 1, borderColor: "#EEEEEE" }}>
                                <Ionicons name="mail-outline" size={18} color="#999" />
                                <TextInput
                                    className="flex-1 py-4 px-3 text-primary"
                                    placeholder="your@email.com"
                                    placeholderTextColor="#bbb"
                                    autoCapitalize="none"
                                    keyboardType="email-address"
                                    value={forgotEmail}
                                    onChangeText={setForgotEmail}
                                />
                            </View>

                            <Pressable
                                className={`w-full py-4 rounded-2xl items-center ${loading || !forgotEmail ? "bg-gray-200" : "bg-primary"}`}
                                onPress={onForgotPasswordPress}
                                disabled={loading || !forgotEmail}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Send Reset Code</Text>}
                            </Pressable>
                        </>
                    ) : (
                        <>
                            <View className="mb-8">
                                <Text className="text-2xl font-bold text-primary mb-1">Reset Password</Text>
                                <Text className="text-secondary">Enter the code and your new password</Text>
                            </View>

                            <View className="flex-row items-center bg-surface rounded-2xl px-4 mb-4" style={{ borderWidth: 1, borderColor: "#EEEEEE" }}>
                                <Ionicons name="key-outline" size={18} color="#999" />
                                <TextInput
                                    className="flex-1 py-4 px-3 text-primary text-center tracking-widest"
                                    placeholder="123456"
                                    placeholderTextColor="#bbb"
                                    keyboardType="number-pad"
                                    value={resetCode}
                                    onChangeText={setResetCode}
                                />
                            </View>

                            <View className="flex-row items-center bg-surface rounded-2xl px-4 mb-6" style={{ borderWidth: 1, borderColor: "#EEEEEE" }}>
                                <Ionicons name="lock-closed-outline" size={18} color="#999" />
                                <TextInput
                                    className="flex-1 py-4 px-3 text-primary"
                                    placeholder="New password"
                                    placeholderTextColor="#bbb"
                                    secureTextEntry
                                    value={newPassword}
                                    onChangeText={setNewPassword}
                                />
                            </View>

                            <Pressable
                                className={`w-full py-4 rounded-2xl items-center ${loading || !resetCode || !newPassword ? "bg-gray-200" : "bg-primary"}`}
                                onPress={onResetPasswordPress}
                                disabled={loading || !resetCode || !newPassword}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Reset Password</Text>}
                            </Pressable>
                        </>
                    )}
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView className="flex-1 bg-white">
            <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
                <ScrollView contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
                    <View style={{ paddingHorizontal: 24 }}>
                        <TouchableOpacity onPress={() => router.push("/")} className="py-4">
                            <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                        </TouchableOpacity>
                    </View>

                    {!showEmailCode ? (
                        <View style={{ paddingHorizontal: 24, paddingBottom: 32 }}>
                            {/* Brand */}
                            <View className="mb-8 items-center">
                                <Text className="text-lg font-bold text-primary tracking-wide mb-4">IconicTrendzs</Text>
                                <Text className="text-2xl font-bold text-primary mb-1">Welcome back</Text>
                                <Text className="text-secondary">Sign in to your account</Text>
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
                            <View className="flex-row justify-between items-center mb-2">
                                <Text className="text-primary font-semibold text-sm">Password</Text>
                                <TouchableOpacity onPress={() => { setForgotEmail(emailAddress); setShowForgotPassword(true); }}>
                                    <Text className="text-secondary text-sm">Forgot password?</Text>
                                </TouchableOpacity>
                            </View>
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
                            <Pressable
                                className={`w-full py-4 rounded-2xl items-center mb-6 ${loading || !emailAddress || !password ? "bg-gray-200" : "bg-primary"}`}
                                onPress={onSignInPress}
                                disabled={loading || !emailAddress || !password}
                                style={(!loading && emailAddress && password) ? { shadowColor: "#111", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.15, shadowRadius: 8, elevation: 4 } : {}}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Sign In</Text>}
                            </Pressable>

                            {/* Footer */}
                            <View className="flex-row justify-center">
                                <Text className="text-secondary">Don't have an account? </Text>
                                <Link href="/sign-up">
                                    <Text className="text-primary font-bold">Sign up</Text>
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

                            <Pressable
                                className={`w-full py-4 rounded-2xl items-center ${loading || !code ? "bg-gray-200" : "bg-primary"}`}
                                onPress={onVerifyPress}
                                disabled={loading || !code}
                            >
                                {loading ? <ActivityIndicator color="#fff" /> : <Text className="text-white font-bold text-base">Verify</Text>}
                            </Pressable>
                        </View>
                    )}
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}
