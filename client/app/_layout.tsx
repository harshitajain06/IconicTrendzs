import { Stack } from "expo-router";
import "../global.css";
import { COLORS } from "@/constants";
export default function RootLayout() {
  return <Stack screenOptions={{
    headerShown: false,
  }}/>;
}
