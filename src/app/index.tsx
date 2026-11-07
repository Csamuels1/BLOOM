import { Link } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { foundationCopy as copy } from '@/content/foundation';

export default function WelcomeScreen() {
  return (
    <SafeAreaView className="flex-1 bg-[#FDF8F3]">
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View className="mx-auto w-full max-w-xl flex-1 justify-center gap-6 p-6">
          <Text
            accessibilityRole="header"
            className="text-4xl font-semibold text-[#3B2A35]"
          >
            {copy.name}
          </Text>
          <Text className="text-2xl text-[#3B2A35]">{copy.tagline}</Text>
          <Text className="text-lg text-[#3B2A35]">{copy.introduction}</Text>
          <Text className="text-base text-[#3B2A35]">{copy.notice}</Text>
          <Link href="/foundation" asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.explore}
              className="min-h-[48px] justify-center rounded-xl bg-[#3B2A35] p-4 active:opacity-80"
            >
              <Text className="text-center text-lg text-[#FDF8F3]">
                {copy.explore}
              </Text>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
