import { Link } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import {
  Body,
  Button,
  Card,
  PageTitle,
  Pill,
  SafetyNotice,
  SectionTitle,
} from '@/components';
import { foundationCopy as copy } from '@/content/foundation';
import { colors, minTouchTarget, radii, spacing } from '@/design/tokens';

const goals = [copy.goalLoss, copy.goalMaintain, copy.goalGain] as const;

export default function FoundationScreen() {
  const [selectedGoal, setSelectedGoal] = useState<string>(copy.goalMaintain);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.ivory }}>
      <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            gap: spacing.xl,
            padding: spacing.xl,
            maxWidth: 560,
            width: '100%',
            alignSelf: 'center',
          }}
        >
          <PageTitle>{copy.title}</PageTitle>
          <Body>{copy.detail}</Body>

          <Card>
            <SectionTitle>{copy.previewHeading}</SectionTitle>
            <Body>{copy.previewBody}</Body>
            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                gap: spacing.sm,
              }}
            >
              {goals.map((goal) => (
                <Pill
                  key={goal}
                  label={goal}
                  selected={selectedGoal === goal}
                  onPress={() => setSelectedGoal(goal)}
                />
              ))}
            </View>
            <Button label={copy.primaryAction} onPress={() => {}} />
          </Card>

          <SafetyNotice title={copy.safetyTitle} message={copy.safetyMessage} />

          <Link href="/" replace asChild>
            <Pressable
              accessibilityRole="link"
              accessibilityLabel={copy.back}
              style={({ pressed }) => ({
                minHeight: minTouchTarget,
                justifyContent: 'center',
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.md,
                borderRadius: radii.button,
                backgroundColor: colors.plum,
                opacity: pressed ? 0.85 : 1,
              })}
            >
              <Body color="ivory" style={{ textAlign: 'center' }}>
                {copy.back}
              </Body>
            </Pressable>
          </Link>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
