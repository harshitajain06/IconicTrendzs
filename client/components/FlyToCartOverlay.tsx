import * as Haptics from "expo-haptics";
import { Ionicons } from "@expo/vector-icons";
import React, { forwardRef, useImperativeHandle, useState } from "react";
import { Image, Modal, Platform, StyleSheet, View } from "react-native";
import Animated, { Easing, runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { COLORS } from "@/constants";

const DOT = 44;

export type FlyToCartHandle = {
    animate: (
        sourceRef: React.RefObject<View | null>,
        targetRef: React.RefObject<View | null>,
        imageUri?: string
    ) => void;
};

function triggerHaptic() {
    if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
}

export const FlyToCartOverlay = forwardRef<FlyToCartHandle>(function FlyToCartOverlay(_, ref) {
    const [visible, setVisible] = useState(false);
    const [imageUri, setImageUri] = useState<string | undefined>();
    const progress = useSharedValue(0);
    const sx = useSharedValue(0);
    const sy = useSharedValue(0);
    const dx = useSharedValue(0);
    const dy = useSharedValue(0);

    const animatedStyle = useAnimatedStyle(() => ({
        position: "absolute",
        left: sx.value + dx.value * progress.value,
        top: sy.value + dy.value * progress.value + Math.sin(progress.value * Math.PI) * -52,
        width: DOT,
        height: DOT,
        borderRadius: DOT / 2,
        transform: [{ scale: 1 - 0.38 * progress.value }],
        opacity: 0.92 + 0.08 * (1 - progress.value),
    }));

    const finish = () => {
        triggerHaptic();
        setVisible(false);
    };

    useImperativeHandle(ref, () => ({
        animate: (sourceRef, targetRef, uri) => {
            setImageUri(uri);
            sourceRef.current?.measureInWindow((ox, oy, ow, oh) => {
                targetRef.current?.measureInWindow((tx, ty, tw, th) => {
                    const startX = ox + ow / 2 - DOT / 2;
                    const startY = oy + oh / 2 - DOT / 2;
                    const endX = tx + tw / 2 - DOT / 2;
                    const endY = ty + th / 2 - DOT / 2;
                    sx.value = startX;
                    sy.value = startY;
                    dx.value = endX - startX;
                    dy.value = endY - startY;
                    progress.value = 0;
                    setVisible(true);
                    progress.value = withTiming(1, { duration: 520, easing: Easing.out(Easing.cubic) }, (finished) => {
                        if (finished) {
                            runOnJS(finish)();
                            progress.value = 0;
                        }
                    });
                });
            });
        },
    }));

    return (
        <Modal transparent visible={visible} animationType="none" statusBarTranslucent>
            <View style={StyleSheet.absoluteFill} pointerEvents="none">
                <Animated.View
                    style={[
                        animatedStyle,
                        {
                            overflow: "hidden",
                            backgroundColor: COLORS.primary,
                            shadowColor: "#000",
                            shadowOffset: { width: 0, height: 4 },
                            shadowOpacity: 0.3,
                            shadowRadius: 6,
                            elevation: 10,
                            borderWidth: 2,
                            borderColor: "#fff",
                        },
                    ]}
                >
                    {imageUri ? (
                        <Image source={{ uri: imageUri }} style={{ width: DOT, height: DOT }} resizeMode="cover" />
                    ) : (
                        <View style={styles.fallback}>
                            <Ionicons name="bag-outline" size={22} color="#fff" />
                        </View>
                    )}
                </Animated.View>
            </View>
        </Modal>
    );
});

const styles = StyleSheet.create({
    fallback: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
    },
});
