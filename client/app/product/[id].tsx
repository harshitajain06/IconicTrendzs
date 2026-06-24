import { Ionicons } from "@expo/vector-icons";
import { useAuth, useUser } from "@clerk/clerk-expo";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState, useEffect, useRef } from "react";
import {
    Dimensions, Image, ScrollView, Text, TouchableOpacity,
    View, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform,
} from "react-native";
import Toast from 'react-native-toast-message';
import { SafeAreaView } from "react-native-safe-area-context";
import { FlyToCartOverlay, type FlyToCartHandle } from "@/components/FlyToCartOverlay";
import { COLORS } from "@/constants";
import { useCart } from "@/context/CartContext";
import { useWishlist } from "@/context/WishlistContext";
import type { Product, Review } from "@/constants/types";
import api from "@/constants/api";

const { width } = Dimensions.get("window");

function StarRow({ rating, size = 14, onPress }: { rating: number; size?: number; onPress?: (r: number) => void }) {
    return (
        <View className="flex-row">
            {[1, 2, 3, 4, 5].map((s) => (
                <TouchableOpacity key={s} onPress={() => onPress?.(s)} disabled={!onPress} activeOpacity={onPress ? 0.7 : 1}>
                    <Ionicons
                        name={s <= rating ? "star" : "star-outline"}
                        size={size}
                        color={s <= rating ? "#FFD700" : "#ccc"}
                        style={{ marginRight: 2 }}
                    />
                </TouchableOpacity>
            ))}
        </View>
    );
}

export default function ProductDetails() {
    const { id } = useLocalSearchParams();
    const router = useRouter();
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);

    const { isSignedIn, getToken } = useAuth();
    const { user } = useUser();
    const { addToCart, cartItems } = useCart();
    const { toggleWishlist, isInWishlist } = useWishlist();

    const flyRef = useRef<FlyToCartHandle>(null);
    const addButtonRef = useRef<View>(null);
    const cartIconRef = useRef<View>(null);

    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const [reviews, setReviews] = useState<Review[]>([]);
    const [reviewsLoading, setReviewsLoading] = useState(true);
    const [showReviewForm, setShowReviewForm] = useState(false);
    const [myRating, setMyRating] = useState(0);
    const [myComment, setMyComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [hasReviewed, setHasReviewed] = useState(false);

    useEffect(() => {
        fetchProduct();
        fetchReviews();
    }, [id]);

    const fetchProduct = async () => {
        try {
            const { data } = await api.get(`/products/${id}`);
            setProduct(data.data);
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed to Fetch Product', text2: error.response?.data?.message || "Something went wrong" });
        } finally {
            setLoading(false);
        }
    };

    const fetchReviews = async () => {
        try {
            const { data } = await api.get(`/products/${id}/reviews`);
            setReviews(data.data);
        } catch {
            // non-critical
        } finally {
            setReviewsLoading(false);
        }
    };

    useEffect(() => {
        if (user && reviews.length > 0) {
            const already = reviews.some((r) => r.user === user.id || r.userName === `${user.firstName} ${user.lastName}`.trim());
            setHasReviewed(already);
        }
    }, [reviews, user]);

    const submitReview = async () => {
        if (myRating === 0) {
            Toast.show({ type: 'info', text1: 'Select a rating', text2: 'Tap the stars to rate' });
            return;
        }
        if (!myComment.trim()) {
            Toast.show({ type: 'info', text1: 'Write a comment', text2: 'Please share your thoughts' });
            return;
        }
        setSubmitting(true);
        try {
            const token = await getToken();
            const { data } = await api.post(`/products/${id}/reviews`, { rating: myRating, comment: myComment.trim() }, { headers: { Authorization: `Bearer ${token}` } });
            setReviews((prev) => [data.data, ...prev]);
            setProduct((prev) => prev ? {
                ...prev,
                ratings: {
                    average: Math.round(((prev.ratings.average * prev.ratings.count + myRating) / (prev.ratings.count + 1)) * 10) / 10,
                    count: prev.ratings.count + 1,
                }
            } : prev);
            setHasReviewed(true);
            setShowReviewForm(false);
            setMyRating(0);
            setMyComment("");
            Toast.show({ type: 'success', text1: 'Review submitted!' });
        } catch (error: any) {
            Toast.show({ type: 'error', text1: 'Failed', text2: error.response?.data?.message || "Something went wrong" });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <ActivityIndicator size="large" color={COLORS.primary} />
            </SafeAreaView>
        );
    }

    if (!product) {
        return (
            <SafeAreaView className="flex-1 justify-center items-center">
                <Text>Product not found</Text>
            </SafeAreaView>
        );
    }

    const isLiked = isInWishlist(product._id);

    const handleAddToCart = () => {
        if (product.sizes && product.sizes.length > 0 && !selectedSize) {
            Toast.show({ type: 'info', text1: 'No Size Selected', text2: 'Please select a size' });
            return;
        }
        if (isSignedIn) {
            flyRef.current?.animate(addButtonRef, cartIconRef, product.images?.[0]);
        }
        addToCart(product, selectedSize || "");
    };

    return (
        <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === "ios" ? "padding" : "height"}>
            <View className="flex-1 bg-white">
                <FlyToCartOverlay ref={flyRef} />
                <ScrollView contentContainerStyle={{ paddingBottom: 100 }} keyboardShouldPersistTaps="handled">
                    {/* Image Carousel */}
                    <View className="relative h-[450px] bg-gray-100 mb-6">
                        <ScrollView
                            horizontal
                            pagingEnabled
                            showsHorizontalScrollIndicator={false}
                            onScroll={(e) => {
                                const slide = Math.ceil(e.nativeEvent.contentOffset.x / e.nativeEvent.layoutMeasurement.width);
                                setActiveImageIndex(slide);
                            }}
                            scrollEventThrottle={16}
                        >
                            {product.images?.map((img, index) => (
                                <Image key={index} source={{ uri: img }} style={{ width, height: 450 }} resizeMode="cover" />
                            ))}
                        </ScrollView>

                        <View className="absolute top-12 left-4 right-4 flex-row justify-between items-center z-10">
                            <TouchableOpacity onPress={() => router.back()} className="w-10 h-10 bg-white/80 rounded-full items-center justify-center">
                                <Ionicons name="arrow-back" size={24} color={COLORS.primary} />
                            </TouchableOpacity>
                            <TouchableOpacity onPress={() => toggleWishlist(product)} className="w-10 h-10 bg-white/80 rounded-full items-center justify-center">
                                <Ionicons name={isLiked ? "heart" : "heart-outline"} size={24} color={isLiked ? COLORS.accent : COLORS.primary} />
                            </TouchableOpacity>
                        </View>

                        <View className="absolute bottom-4 left-0 right-0 flex-row justify-center gap-2">
                            {product.images?.map((_, index) => (
                                <View key={index} className={`h-2 rounded-full ${index === activeImageIndex ? 'w-6 bg-primary' : 'w-2 bg-gray-300'}`} />
                            ))}
                        </View>
                    </View>

                    <View className="px-5">
                        {/* Title & Rating */}
                        <View className="flex-row justify-between items-start mb-2">
                            <Text className="text-2xl font-bold text-primary flex-1 mr-4">{product.name}</Text>
                            <View className="flex-row items-center bg-surface px-2 py-1 rounded gap-1">
                                <Ionicons name="star" size={14} color="#FFD700" />
                                <Text className="text-sm font-bold">{product.ratings.average > 0 ? product.ratings.average.toFixed(1) : "—"}</Text>
                                {product.ratings.count > 0 && <Text className="text-xs text-secondary">({product.ratings.count})</Text>}
                            </View>
                        </View>

                        <Text className="text-2xl font-bold text-primary mb-6">${product.price.toFixed(2)}</Text>

                        {/* Sizes */}
                        {product.sizes && product.sizes.length > 0 && (
                            <>
                                <Text className="text-base font-bold text-primary mb-3">Size</Text>
                                <View className="flex-row gap-3 mb-6 flex-wrap">
                                    {product.sizes.map((size) => (
                                        <TouchableOpacity
                                            key={size}
                                            onPress={() => setSelectedSize(size)}
                                            className={`w-12 h-12 rounded-full items-center justify-center border ${selectedSize === size ? 'bg-primary border-primary' : 'bg-white border-gray-100'}`}
                                        >
                                            <Text className={`text-sm font-medium ${selectedSize === size ? 'text-white' : 'text-primary'}`}>{size}</Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            </>
                        )}

                        {/* Description */}
                        <Text className="text-base font-bold text-primary mb-2">Description</Text>
                        <Text className="text-secondary leading-6 mb-8">{product.description}</Text>

                        {/* Reviews Header */}
                        <View className="flex-row justify-between items-center mb-4">
                            <Text className="text-base font-bold text-primary">
                                Reviews {product.ratings.count > 0 ? `(${product.ratings.count})` : ""}
                            </Text>
                            {isSignedIn && !hasReviewed && !showReviewForm && (
                                <TouchableOpacity onPress={() => setShowReviewForm(true)} className="flex-row items-center gap-1">
                                    <Ionicons name="create-outline" size={16} color={COLORS.primary} />
                                    <Text className="text-primary font-medium text-sm">Write a review</Text>
                                </TouchableOpacity>
                            )}
                        </View>

                        {/* Review Form */}
                        {showReviewForm && (
                            <View className="bg-surface rounded-2xl p-4 mb-5" style={{ borderWidth: 1, borderColor: "#EEEEEE" }}>
                                <Text className="text-primary font-semibold mb-3">Your Rating</Text>
                                <StarRow rating={myRating} size={28} onPress={setMyRating} />
                                <TextInput
                                    className="bg-white rounded-xl p-3 mt-4 text-primary"
                                    style={{ borderWidth: 1, borderColor: "#EEEEEE", minHeight: 80, textAlignVertical: "top" }}
                                    placeholder="Share your experience with this product..."
                                    placeholderTextColor="#bbb"
                                    multiline
                                    value={myComment}
                                    onChangeText={setMyComment}
                                />
                                <View className="flex-row gap-3 mt-4">
                                    <TouchableOpacity
                                        onPress={() => { setShowReviewForm(false); setMyRating(0); setMyComment(""); }}
                                        className="flex-1 py-3 rounded-xl border border-gray-200 items-center"
                                    >
                                        <Text className="text-secondary font-medium">Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        onPress={submitReview}
                                        disabled={submitting}
                                        className={`flex-1 py-3 rounded-xl items-center ${submitting ? "bg-gray-300" : "bg-primary"}`}
                                    >
                                        {submitting ? <ActivityIndicator color="#fff" size="small" /> : <Text className="text-white font-bold">Submit</Text>}
                                    </TouchableOpacity>
                                </View>
                            </View>
                        )}

                        {hasReviewed && (
                            <View className="flex-row items-center gap-2 bg-green-50 rounded-xl px-3 py-2 mb-4">
                                <Ionicons name="checkmark-circle" size={16} color="#16a34a" />
                                <Text className="text-green-700 text-sm">You've already reviewed this product</Text>
                            </View>
                        )}

                        {/* Reviews List */}
                        {reviewsLoading ? (
                            <ActivityIndicator color={COLORS.primary} />
                        ) : reviews.length === 0 ? (
                            <View className="items-center py-8">
                                <Ionicons name="chatbubble-outline" size={32} color="#ccc" />
                                <Text className="text-secondary mt-2 text-sm">No reviews yet. Be the first!</Text>
                            </View>
                        ) : (
                            reviews.map((review) => (
                                <View key={review._id} className="mb-4 pb-4" style={{ borderBottomWidth: 1, borderBottomColor: "#F0F0F0" }}>
                                    <View className="flex-row justify-between items-center mb-1">
                                        <Text className="text-primary font-semibold">{review.userName}</Text>
                                        <Text className="text-secondary text-xs">
                                            {new Date(review.createdAt).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" })}
                                        </Text>
                                    </View>
                                    <StarRow rating={review.rating} size={13} />
                                    <Text className="text-secondary leading-5 mt-2">{review.comment}</Text>
                                </View>
                            ))
                        )}
                    </View>
                </ScrollView>

                {/* Footer */}
                <View className="absolute bottom-6 left-0 flex-row right-0 p-4 bg-white border-t border-gray-100">
                    <View ref={addButtonRef} collapsable={false} className="w-4/5">
                        <TouchableOpacity onPress={handleAddToCart} className="bg-primary py-4 rounded-full items-center shadow-lg flex-row justify-center">
                            <Ionicons name="bag-outline" size={20} color="white" />
                            <Text className="text-white font-bold text-base ml-2">Add to Cart</Text>
                        </TouchableOpacity>
                    </View>
                    <View collapsable={false} className="w-1/5 py-3 flex-row justify-center relative">
                        <TouchableOpacity onPress={() => router.push("/(tabs)/cart")} className="flex-1 items-center justify-center relative">
                            <View ref={cartIconRef} collapsable={false} className="items-center justify-center w-10 h-10">
                                <Ionicons name="cart-outline" size={24} />
                            </View>
                            <View className="absolute top-2 right-0 size-4 z-10 bg-black rounded-full justify-center items-center">
                                <Text className="text-white text-[9px]">{cartItems.reduce((acc, item) => acc + item.quantity, 0)}</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </KeyboardAvoidingView>
    );
}
