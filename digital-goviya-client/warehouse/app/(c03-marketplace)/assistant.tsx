import { Ionicons } from "@/components/c03-marketplace/themed-native";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
  Animated,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "@/components/c03-marketplace/themed-native";

import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import { useMarketplaceAuth } from "@/hooks/c03-marketplace/useMarketplaceAuth";
import { ragService } from "@/services/c03-marketplace/rag.service";
import { getApiErrorMessage } from "@/utils/c03-marketplace/getApiErrorMessage";
import type { RagChatMessage } from "@/types/c03-marketplace/rag.types";
import { useLanguage } from "@/contexts/LanguageContext";
import type {
  Animated as RNAnimated,
  FlatList as RNFlatList,
} from "react-native";

// ===========================================================================
// SUGGESTED QUESTIONS
// ===========================================================================

const SUGGESTED_QUESTIONS = (t: any) => [
  t.c3assistant.suggestedQuestion1,
  t.c3assistant.suggestedQuestion2,
  t.c3assistant.suggestedQuestion3,
  t.c3assistant.suggestedQuestion4,
];

// ===========================================================================
// ROLE THEME
// ===========================================================================

type RoleTheme = {
  accent: string;
  accentDark: string;
  accentSoft: string;
  accentPale: string;
  gradient: [string, string];
  headerGradient: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
};

const FARMER_THEME: RoleTheme = {
  accent: "#15803D",
  accentDark: "#0B3B22",
  accentSoft: "#DCFCE7",
  accentPale: "#ECFDF5",
  gradient: ["#0A331D", "#12522E"],
  headerGradient: ["#ECFDF5", "#F8FAF8"],
  icon: "leaf",
  eyebrow: "GROWER KNOWLEDGE ASSISTANT",
};

const MILLER_THEME: RoleTheme = {
  accent: "#C2760C",
  accentDark: "#874D06",
  accentSoft: "#FBE6C5",
  accentPale: "#FFF8EA",
  gradient: ["#F1B94A", "#A95B08"],
  headerGradient: ["#FFF3DE", "#FFFCF7"],
  icon: "cube",
  eyebrow: "MILLER KNOWLEDGE ASSISTANT",
};

// ===========================================================================
// MAIN SCREEN
// ===========================================================================

export default function MarketplaceAssistantScreen() {
  const { user } = useMarketplaceAuth();
  const { t, language } = useLanguage();

  const listRef = useRef<RNFlatList<RagChatMessage>>(null);

  const [question, setQuestion] = useState("");
  const [messages, setMessages] = useState<RagChatMessage[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [inputError, setInputError] = useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  // =========================================================================
  // THEME
  // =========================================================================

  const theme: RoleTheme =
    user?.role === "miller"
      ? {
          ...MILLER_THEME,
          eyebrow: t.c3assistant.millerKnowledgeAssistant,
        }
      : {
          ...FARMER_THEME,
          eyebrow: t.c3assistant.growerKnowledgeAssistant,
        };

  const accent = theme.accent;
  const accentSoft = theme.accentSoft;

  // =========================================================================
  // WELCOME MESSAGE
  // =========================================================================

  const assistantWelcome = useMemo(
    (): RagChatMessage => ({
      id: "assistant-welcome",
      sender: "assistant",
      text:
        user?.role === "miller"
          ? t.c3assistant.millerWelcome
          : t.c3assistant.farmerWelcome,
      createdAt: Date.now(),
    }),
    [user?.role, language, t]
  );

  const displayedMessages =
    messages.length > 0 ? messages : [assistantWelcome];

  // =========================================================================
  // SCROLL
  // =========================================================================

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    });
  }, []);

  // =========================================================================
  // SUBMIT QUESTION
  // =========================================================================

  const submitQuestion = async (
    selectedQuestion?: string
  ): Promise<void> => {
    const cleanedQuestion = (
      selectedQuestion ?? question
    ).trim();

    if (submitting) {
      return;
    }

    if (cleanedQuestion.length < 2) {
      setInputError(
        t.c3assistant.pleaseEnterValidQuestion
      );
      return;
    }

    const userMessage: RagChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: cleanedQuestion,
      createdAt: Date.now(),
    };

    setInputError(null);
    setQuestion("");

    setMessages((current) => [
      ...current,
      userMessage,
    ]);

    setSubmitting(true);

    setTimeout(() => {
      scrollToBottom();
    }, 50);

    try {
      const response = await ragService.askQuestion({
        question: cleanedQuestion,
      });

      const answer =
        response.data.answer?.trim() ||
        t.c3assistant.answerNotGenerated;

      const assistantMessage: RagChatMessage = {
        id: `assistant-${Date.now()}`,
        sender: "assistant",
        text: answer,
        context: response.data.context,
        results: response.data.results,
        createdAt: Date.now(),
      };

      setMessages((current) => [
        ...current,
        assistantMessage,
      ]);
    } catch (error) {
      console.error("RAG question failed:", error);

      const failedMessage: RagChatMessage = {
        id: `assistant-error-${Date.now()}`,
        sender: "assistant",
        text: getApiErrorMessage(error),
        createdAt: Date.now(),
        failed: true,
      };

      setMessages((current) => [
        ...current,
        failedMessage,
      ]);
    } finally {
      setSubmitting(false);

      setTimeout(() => {
        scrollToBottom();
      }, 80);
    }
  };

  // =========================================================================
  // LOADING
  // =========================================================================

  if (!fontsLoaded) {
    return null;
  }

  return (
    <SafeAreaView style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 0 : 0
        }
      >
        {/* ================================================================
            HEADER
        ================================================================ */}

        <LinearGradient
          colors={theme.headerGradient}
          style={styles.header}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t.c3assistant.goBack}
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color="#1F2937"
            />
          </Pressable>

          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerAvatar}
          >
            <Ionicons
              name={theme.icon}
              size={21}
              color="#FFFFFF"
            />
          </LinearGradient>

          <View style={styles.headerText}>
            <View style={styles.titleRow}>
              <Text style={styles.headerTitle}>
                {t.c3assistant.title}
              </Text>

              <LinearGradient
                colors={theme.gradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.aiBadge}
              >
                <Text style={styles.aiBadgeText}>
                  AI
                </Text>
              </LinearGradient>
            </View>

            <View style={styles.onlineRow}>
              <View
                style={[
                  styles.onlineDot,
                  {
                    backgroundColor: accent,
                  },
                ]}
              />

              <Text style={styles.headerSubtitle}>
                {t.c3assistant.subtitle}
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel={
              t.c3assistant.clearConversation
            }
            onPress={() => {
              setMessages([]);
              setQuestion("");
              setInputError(null);
            }}
            style={({ pressed }) => [
              styles.headerButton,
              styles.clearButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="refresh-outline"
              size={19}
              color={accent}
            />
          </Pressable>
        </LinearGradient>

        {/* ================================================================
            CHAT LIST
        ================================================================ */}

        <FlatList
          ref={listRef}
          data={displayedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              theme={theme}
              translations={t.c3assistant}
            />
          )}
          ListHeaderComponent={
            <View style={styles.listHeader}>

              {/* ========================================================
                  HERO
              ======================================================== */}

              <LinearGradient
                colors={
                  user?.role === "miller"
                    ? ["#FFF9EE", "#FFF1D6"]
                    : ["#F2FFF5", "#E5F9EA"]
                }
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.heroCard,
                  {
                    borderColor: accentSoft,
                  },
                ]}
              >
                <View
                  style={[
                    styles.heroGlow,
                    {
                      backgroundColor:
                        theme.accentSoft,
                    },
                  ]}
                />

                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroIcon}
                >
                  <Ionicons
                    name="chatbubble-ellipses"
                    size={25}
                    color="#FFFFFF"
                  />
                </LinearGradient>

                <View style={styles.heroText}>
                  <View style={styles.heroEyebrowRow}>
                    <Text
                      style={[
                        styles.heroEyebrow,
                        {
                          color:
                            theme.accentDark,
                        },
                      ]}
                    >
                      {theme.eyebrow}
                    </Text>

                    <View
                      style={[
                        styles.liveBadge,
                        {
                          backgroundColor:
                            theme.accentSoft,
                        },
                      ]}
                    >
                      <View
                        style={[
                          styles.liveDot,
                          {
                            backgroundColor:
                              accent,
                          },
                        ]}
                      />

                      <Text
                        style={[
                          styles.liveText,
                          {
                            color:
                              theme.accentDark,
                          },
                        ]}
                      >
                        LIVE
                      </Text>
                    </View>
                  </View>

                  <Text style={styles.heroTitle}>
                    {t.c3assistant.askAboutPaddyMarkets}
                  </Text>

                  <Text
                    style={styles.heroDescription}
                  >
                    {t.c3assistant.heroDescription}
                  </Text>
                </View>
              </LinearGradient>

              {/* ========================================================
                  QUICK QUESTIONS
              ======================================================== */}

              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>
                    {t.c3assistant.suggestedQuestions}
                  </Text>

                  <Text style={styles.sectionSubtitle}>
                    Quick questions to get started
                  </Text>
                </View>

                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.sparkleBadge}
                >
                  <Ionicons
                    name="sparkles"
                    size={15}
                    color="#FFFFFF"
                  />
                </LinearGradient>
              </View>

              <View
                style={styles.suggestionContainer}
              >
                {SUGGESTED_QUESTIONS(t).map(
                  (item, index) => (
                    <SuggestionChip
                      key={item}
                      text={item}
                      index={index}
                      theme={theme}
                      disabled={submitting}
                      onPress={() =>
                        void submitQuestion(item)
                      }
                    />
                  )
                )}
              </View>

              {/* ========================================================
                  CONVERSATION
              ======================================================== */}

              <View style={styles.conversationHeader}>
                <LinearGradient
                  colors={theme.gradient}
                  style={styles.conversationLine}
                />

                <Text
                  style={styles.conversationTitle}
                >
                  {t.c3assistant.conversation}
                </Text>

                <View
                  style={[
                    styles.conversationBadge,
                    {
                      backgroundColor:
                        theme.accentSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name="chatbubbles-outline"
                    size={12}
                    color={accent}
                  />
                </View>
              </View>
            </View>
          }
          ListFooterComponent={
            submitting ? (
              <TypingIndicator
                theme={theme}
                text={
                  t.c3assistant
                    .retrievingAgriculturalInformation
                }
              />
            ) : (
              <View
                style={styles.listBottomSpace}
              />
            )
          }
          contentContainerStyle={
            styles.messageList
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />

        {/* ================================================================
            COMPOSER
        ================================================================ */}

        <View style={styles.composerArea}>
          {inputError ? (
            <View style={styles.errorRow}>
              <Ionicons
                name="alert-circle-outline"
                size={13}
                color="#DC2626"
              />

              <Text style={styles.inputError}>
                {inputError}
              </Text>
            </View>
          ) : null}

          <View
            style={[
              styles.composer,
              {
                borderColor: submitting
                  ? accentSoft
                  : "#D8E0E7",
              },
              inputError
                ? styles.composerError
                : null,
              submitting
                ? styles.composerSubmitting
                : null,
            ]}
          >
            <LinearGradient
              colors={theme.gradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.inputIcon}
            >
              <Ionicons
                name="chatbubble-outline"
                size={15}
                color="#FFFFFF"
              />
            </LinearGradient>

            <TextInput
              value={question}
              onChangeText={(value) => {
                setQuestion(value);

                if (inputError) {
                  setInputError(null);
                }
              }}
              placeholder={
                t.c3assistant.inputPlaceholder
              }
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              editable={!submitting}
              style={styles.input}
              onSubmitEditing={() => {
                if (Platform.OS === "web") {
                  void submitQuestion();
                }
              }}
            />

            <SendButton
              theme={theme}
              disabled={
                submitting ||
                question.trim().length < 2
              }
              submitting={submitting}
              accessibilityLabel={
                t.c3assistant.sendQuestion
              }
              onPress={() =>
                void submitQuestion()
              }
            />
          </View>

          <View style={styles.composerFooter}>
            <View style={styles.secureRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={11}
                color={accent}
              />

              <Text style={styles.disclaimer}>
                {t.c3assistant.disclaimer}
              </Text>
            </View>

            <Text style={styles.characterCount}>
              {question.length}/500
            </Text>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ===========================================================================
// SUGGESTION CHIP
// ===========================================================================

interface SuggestionChipProps {
  text: string;
  index: number;
  theme: RoleTheme;
  disabled: boolean;
  onPress: () => void;
}

function SuggestionChip({
  text,
  index,
  theme,
  disabled,
  onPress,
}: SuggestionChipProps) {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      speed: 24,
      bounciness: 5,
      useNativeDriver: true,
    }).start();
  };

  const icons: Array<
    keyof typeof Ionicons.glyphMap
  > = [
    "trending-up-outline",
    "cash-outline",
    "location-outline",
    "analytics-outline",
  ];

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      <Pressable
        disabled={disabled}
        onPressIn={() => animateTo(0.975)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
        style={({ pressed }) => [
          styles.suggestionCard,
          {
            borderColor: theme.accentSoft,
          },
          pressed && styles.suggestionPressed,
          disabled && styles.disabled,
        ]}
      >
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.suggestionIcon}
        >
          <Ionicons
            name={icons[index % icons.length]}
            size={17}
            color="#FFFFFF"
          />
        </LinearGradient>

        <View style={styles.suggestionContent}>
          <Text style={styles.suggestionLabel}>
            {text}
          </Text>

          <Text
            style={[
              styles.suggestionHint,
              {
                color: theme.accent,
              },
            ]}
          >
            Ask assistant
          </Text>
        </View>

        <View
          style={[
            styles.suggestionArrow,
            {
              backgroundColor:
                theme.accentSoft,
            },
          ]}
        >
          <Ionicons
            name="arrow-up"
            size={14}
            color={theme.accent}
          />
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ===========================================================================
// SEND BUTTON
// ===========================================================================

interface SendButtonProps {
  theme: RoleTheme;
  disabled: boolean;
  submitting: boolean;
  accessibilityLabel: string;
  onPress: () => void;
}

function SendButton({
  theme,
  disabled,
  submitting,
  accessibilityLabel,
  onPress,
}: SendButtonProps) {
  const scale = useRef(
    new Animated.Value(1)
  ).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      speed: 24,
      bounciness: 6,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      style={{
        transform: [{ scale }],
      }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        disabled={disabled}
        onPressIn={() => animateTo(0.93)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
      >
        <LinearGradient
          colors={
            disabled
              ? ["#CBD5E1", "#94A3B8"]
              : theme.gradient
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.sendButton}
        >
          {submitting ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="arrow-up"
              size={20}
              color="#FFFFFF"
            />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ===========================================================================
// CHAT MESSAGE
// ===========================================================================

interface ChatMessageProps {
  message: RagChatMessage;
  theme: RoleTheme;
  translations: any;
}

function ChatMessage({
  message,
  theme,
  translations,
}: ChatMessageProps) {
  const [showSources, setShowSources] =
    useState(false);

  const opacity = useRef(
    new Animated.Value(0)
  ).current;

  const translateY = useRef(
    new Animated.Value(8)
  ).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        speed: 16,
        bounciness: 4,
        useNativeDriver: true,
      }),
    ]).start();

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const isUser =
    message.sender === "user";

  const hasSources =
    Boolean(message.context?.trim()) ||
    Boolean(message.results?.length);

  return (
    <Animated.View
      style={[
        styles.messageRow,
        isUser
          ? styles.userMessageRow
          : styles.assistantMessageRow,
        {
          opacity,
          transform: [{ translateY }],
        },
      ]}
    >
      {!isUser ? (
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.messageAvatar}
        >
          <Ionicons
            name={
              message.failed
                ? "warning-outline"
                : theme.icon
            }
            size={15}
            color="#FFFFFF"
          />
        </LinearGradient>
      ) : null}

      <View
        style={[
          styles.messageBubble,
          isUser
            ? styles.userBubbleShadow
            : styles.assistantBubbleShadow,
        ]}
      >
        {isUser ? (
          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[
              styles.bubbleFill,
              styles.userBubble,
            ]}
          >
            <Text
              style={[
                styles.messageText,
                styles.userMessageText,
              ]}
            >
              {message.text}
            </Text>

            <Text
              style={[
                styles.messageTime,
                styles.userMessageTime,
              ]}
            >
              {formatTime(
                message.createdAt
              )}
            </Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              styles.bubbleFill,
              message.failed
                ? styles.failedBubble
                : styles.assistantBubble,
            ]}
          >
            {!message.failed ? (
              <View
                style={styles.assistantLabelRow}
              >
                <LinearGradient
                  colors={theme.gradient}
                  style={styles.assistantLabelIcon}
                >
                  <Ionicons
                    name="sparkles"
                    size={8}
                    color="#FFFFFF"
                  />
                </LinearGradient>

                <Text
                  style={[
                    styles.assistantLabel,
                    {
                      color:
                        theme.accentDark,
                    },
                  ]}
                >
                  MARKETPLACE ASSISTANT
                </Text>

                <View
                  style={[
                    styles.assistantLabelDot,
                    {
                      backgroundColor:
                        theme.accent,
                    },
                  ]}
                />
              </View>
            ) : null}

            <Text
              style={[
                styles.messageText,
                message.failed
                  ? styles.failedMessageText
                  : styles.assistantMessageText,
              ]}
            >
              {message.text}
            </Text>

            {hasSources ? (
              <>
                <Pressable
                  onPress={() =>
                    setShowSources(
                      (current) => !current
                    )
                  }
                  style={[
                    styles.sourceButton,
                    {
                      borderTopColor:
                        theme.accentSoft,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={theme.gradient}
                    style={styles.sourceIcon}
                  >
                    <Ionicons
                      name="document-text-outline"
                      size={14}
                      color="#FFFFFF"
                    />
                  </LinearGradient>

                  <Text
                    style={[
                      styles.sourceButtonText,
                      {
                        color:
                          theme.accentDark,
                      },
                    ]}
                  >
                    {showSources
                      ? translations
                          .hideRetrievedInformation
                      : translations
                          .viewRetrievedInformation}
                  </Text>

                  <Ionicons
                    name={
                      showSources
                        ? "chevron-up"
                        : "chevron-down"
                    }
                    size={15}
                    color={theme.accent}
                  />
                </Pressable>

                {showSources ? (
                  <View
                    style={[
                      styles.sourceContainer,
                      {
                        backgroundColor:
                          theme.accentPale,
                        borderColor:
                          theme.accentSoft,
                      },
                    ]}
                  >
                    {message.context?.trim() ? (
                      <>
                        <Text
                          style={[
                            styles.sourceTitle,
                            {
                              color:
                                theme.accentDark,
                            },
                          ]}
                        >
                          {
                            translations.retrievedContext
                          }
                        </Text>

                        <Text
                          style={
                            styles.sourceText
                          }
                        >
                          {message.context}
                        </Text>
                      </>
                    ) : null}

                    {message.results?.length ? (
                      <>
                        <Text
                          style={[
                            styles.sourceTitle,
                            styles.resultsTitle,
                            {
                              color:
                                theme.accentDark,
                            },
                          ]}
                        >
                          {
                            translations.retrievedResults
                          }
                        </Text>

                        {message.results.map(
                          (
                            result,
                            index
                          ) => (
                            <View
                              key={`${message.id}-${index}`}
                              style={
                                styles.resultItem
                              }
                            >
                              <LinearGradient
                                colors={
                                  theme.gradient
                                }
                                style={
                                  styles.resultNumber
                                }
                              >
                                <Text
                                  style={
                                    styles.resultNumberText
                                  }
                                >
                                  {index + 1}
                                </Text>
                              </LinearGradient>

                              <Text
                                style={
                                  styles.resultText
                                }
                              >
                                {formatRagResult(
                                  result
                                )}
                              </Text>
                            </View>
                          )
                        )}
                      </>
                    ) : null}
                  </View>
                ) : null}
              </>
            ) : null}

            <Text style={styles.messageTime}>
              {formatTime(
                message.createdAt
              )}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ===========================================================================
// TYPING INDICATOR
// ===========================================================================

interface TypingIndicatorProps {
  theme: RoleTheme;
  text: string;
}

function TypingIndicator({
  theme,
  text,
}: TypingIndicatorProps) {
  const dot1 = useRef(
    new Animated.Value(0)
  ).current;

  const dot2 = useRef(
    new Animated.Value(0)
  ).current;

  const dot3 = useRef(
    new Animated.Value(0)
  ).current;

  useEffect(() => {
    const makeLoop = (
      value: RNAnimated.Value,
      delay: number
    ) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(value, {
            toValue: 1,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.timing(value, {
            toValue: 0,
            duration: 320,
            useNativeDriver: true,
          }),
          Animated.delay(320),
        ])
      );

    const loops = [
      makeLoop(dot1, 0),
      makeLoop(dot2, 120),
      makeLoop(dot3, 240),
    ];

    loops.forEach((loop) => loop.start());

    return () =>
      loops.forEach((loop) =>
        loop.stop()
      );
  }, [dot1, dot2, dot3]);

  const dotStyle = (
    value: RNAnimated.Value
  ) => ({
    opacity: value.interpolate({
      inputRange: [0, 1],
      outputRange: [0.35, 1],
    }),
    transform: [
      {
        translateY: value.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -4],
        }),
      },
    ],
  });

  return (
    <View
      style={[
        styles.messageRow,
        styles.assistantMessageRow,
      ]}
    >
      <LinearGradient
        colors={theme.gradient}
        style={styles.messageAvatar}
      >
        <Ionicons
          name={theme.icon}
          size={15}
          color="#FFFFFF"
        />
      </LinearGradient>

      <View
        style={[
          styles.messageBubble,
          styles.assistantBubbleShadow,
        ]}
      >
        <View
          style={[
            styles.bubbleFill,
            styles.assistantBubble,
            styles.typingBubble,
          ]}
        >
          <View style={styles.typingDots}>
            <Animated.View
              style={[
                styles.typingDot,
                {
                  backgroundColor:
                    theme.accent,
                },
                dotStyle(dot1),
              ]}
            />

            <Animated.View
              style={[
                styles.typingDot,
                {
                  backgroundColor:
                    theme.accent,
                },
                dotStyle(dot2),
              ]}
            />

            <Animated.View
              style={[
                styles.typingDot,
                {
                  backgroundColor:
                    theme.accent,
                },
                dotStyle(dot3),
              ]}
            />
          </View>

          <Text style={styles.typingText}>
            {text}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ===========================================================================
// HELPERS
// ===========================================================================

function formatRagResult(
  value: unknown
): string {
  if (typeof value === "string") {
    return value;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return String(value);
  }

  if (
    typeof value === "object" &&
    value !== null
  ) {
    try {
      return JSON.stringify(
        value,
        null,
        2
      );
    } catch {
      return "Retrieved result";
    }
  }

  return "Retrieved result";
}

function formatTime(
  timestamp: number
): string {
  return new Intl.DateTimeFormat(
    "en-LK",
    {
      hour: "2-digit",
      minute: "2-digit",
    }
  ).format(new Date(timestamp));
}

// ===========================================================================
// STYLES
// ===========================================================================

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: "#F5F8F6",
  },

  // -------------------------------------------------------------------------
  // HEADER
  // -------------------------------------------------------------------------

  header: {
    minHeight: 70,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 13,
    gap: 9,
    borderBottomWidth: 1,
    borderBottomColor: "#E4EAE6",
  },

  headerButton: {
    width: 39,
    height: 39,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
    borderWidth: 1,
    borderColor: "rgba(226,232,240,0.9)",
  },

  clearButton: {
    marginLeft: 1,
  },

  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 4,
  },

  headerText: {
    flex: 1,
  },

  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },

  headerTitle: {
    color: "#172033",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
  },

  aiBadge: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
  },

  aiBadgeText: {
    color: "#FFFFFF",
    fontSize: 7,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.6,
  },

  onlineRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 2,
  },

  onlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  headerSubtitle: {
    color: "#718096",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
  },

  // -------------------------------------------------------------------------
  // LIST
  // -------------------------------------------------------------------------

  messageList: {
    paddingHorizontal: 14,
    paddingBottom: 8,
  },

  listHeader: {
    paddingTop: 12,
  },

  // -------------------------------------------------------------------------
  // HERO
  // -------------------------------------------------------------------------

  heroCard: {
    minHeight: 125,
    flexDirection: "row",
    gap: 12,
    padding: 14,
    borderRadius: 22,
    borderWidth: 1,
    overflow: "hidden",
    marginBottom: 18,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.07,
    shadowRadius: 12,
    elevation: 2,
  },

  heroGlow: {
    position: "absolute",
    width: 130,
    height: 130,
    borderRadius: 65,
    right: -55,
    top: -55,
    opacity: 0.6,
  },

  heroIcon: {
    width: 51,
    height: 51,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.16,
    shadowRadius: 7,
    elevation: 3,
  },

  heroText: {
    flex: 1,
  },

  heroEyebrowRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 7,
  },

  heroEyebrow: {
    flex: 1,
    fontSize: 7.5,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.7,
  },

  liveBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 7,
  },

  liveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },

  liveText: {
    fontSize: 6.5,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.5,
  },

  heroTitle: {
    color: "#172033",
    fontSize: 14,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 5,
  },

  heroDescription: {
    color: "#687587",
    fontSize: 9.5,
    lineHeight: 15,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
  },

  // -------------------------------------------------------------------------
  // SECTION HEADER
  // -------------------------------------------------------------------------

  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 9,
  },

  sectionTitle: {
    color: "#172033",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
  },

  sectionSubtitle: {
    color: "#94A3B8",
    fontSize: 8,
    fontFamily: "Poppins_500Medium",
    marginTop: 1,
  },

  sparkleBadge: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },

  // -------------------------------------------------------------------------
  // SUGGESTIONS
  // -------------------------------------------------------------------------

  suggestionContainer: {
    gap: 8,
    marginBottom: 17,
  },

  suggestionCard: {
    minHeight: 57,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.05,
    shadowRadius: 7,
    elevation: 1,
  },

  suggestionPressed: {
    opacity: 0.88,
  },

  suggestionIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  suggestionContent: {
    flex: 1,
  },

  suggestionLabel: {
    color: "#334155",
    fontSize: 9.5,
    lineHeight: 15,
    fontFamily: "Poppins_600SemiBold",
  },

  suggestionHint: {
    fontSize: 7.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 1,
  },

  suggestionArrow: {
    width: 30,
    height: 30,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },

  // -------------------------------------------------------------------------
  // CONVERSATION
  // -------------------------------------------------------------------------

  conversationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },

  conversationLine: {
    width: 4,
    height: 17,
    borderRadius: 2,
  },

  conversationTitle: {
    color: "#172033",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    flex: 1,
  },

  conversationBadge: {
    width: 27,
    height: 27,
    borderRadius: 9,
    alignItems: "center",
    justifyContent: "center",
  },

  // -------------------------------------------------------------------------
  // MESSAGES
  // -------------------------------------------------------------------------

  messageRow: {
    width: "100%",
    marginBottom: 12,
  },

  userMessageRow: {
    alignItems: "flex-end",
  },

  assistantMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  messageAvatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 2,
  },

  messageBubble: {
    maxWidth: "85%",
  },

  bubbleFill: {
    borderRadius: 19,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  userBubbleShadow: {
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.13,
    shadowRadius: 9,
    elevation: 2,
  },

  assistantBubbleShadow: {
    shadowColor: "#0F172A",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.045,
    shadowRadius: 7,
    elevation: 1,
  },

  userBubble: {
    borderBottomRightRadius: 6,
  },

  assistantBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E1E9E4",
    borderTopLeftRadius: 6,
  },

  failedBubble: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderTopLeftRadius: 6,
  },

  assistantLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 7,
  },

  assistantLabelIcon: {
    width: 17,
    height: 17,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },

  assistantLabel: {
    fontSize: 6.5,
    fontFamily: "Poppins_800ExtraBold",
    letterSpacing: 0.65,
  },

  assistantLabelDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },

  messageText: {
    fontSize: 10.5,
    lineHeight: 18,
    fontFamily: "Poppins_500Medium",
  },

  userMessageText: {
    color: "#FFFFFF",
  },

  assistantMessageText: {
    color: "#334155",
  },

  failedMessageText: {
    color: "#991B1B",
  },

  messageTime: {
    color: "#94A3B8",
    fontSize: 7,
    fontFamily: "Poppins_500Medium",
    marginTop: 6,
    textAlign: "right",
  },

  userMessageTime: {
    color: "rgba(255,255,255,0.7)",
  },

  // -------------------------------------------------------------------------
  // SOURCES
  // -------------------------------------------------------------------------

  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    marginTop: 11,
    paddingTop: 9,
    borderTopWidth: 1,
  },

  sourceIcon: {
    width: 26,
    height: 26,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  sourceButtonText: {
    flex: 1,
    fontSize: 8.5,
    fontFamily: "Poppins_600SemiBold",
  },

  sourceContainer: {
    marginTop: 9,
    borderRadius: 14,
    padding: 10,
    borderWidth: 1,
  },

  sourceTitle: {
    fontSize: 8.5,
    fontFamily: "Poppins_700Bold",
  },

  sourceText: {
    color: "#64748B",
    fontSize: 8.2,
    lineHeight: 15,
    fontFamily: "Poppins_500Medium",
    marginTop: 5,
  },

  resultsTitle: {
    marginTop: 12,
  },

  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },

  resultNumber: {
    width: 22,
    height: 22,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  resultNumberText: {
    color: "#FFFFFF",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
  },

  resultText: {
    flex: 1,
    color: "#64748B",
    fontSize: 8.2,
    lineHeight: 14,
    fontFamily: "Poppins_500Medium",
  },

  // -------------------------------------------------------------------------
  // TYPING
  // -------------------------------------------------------------------------

  typingBubble: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  typingDots: {
    flexDirection: "row",
    gap: 4,
  },

  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },

  typingText: {
    color: "#64748B",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
  },

  listBottomSpace: {
    height: 3,
  },

  // -------------------------------------------------------------------------
  // COMPOSER
  // -------------------------------------------------------------------------

  composerArea: {
    paddingHorizontal: 11,
    paddingTop: 7,

    // IMPORTANT:
    // Reduced significantly from 96/91.
    // This removes the large blank space above the keyboard.
    paddingBottom:
      Platform.OS === "ios" ? 7 : 5,

    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E4EAE7",
  },

  composer: {
    minHeight: 54,
    maxHeight: 115,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 7,
    paddingLeft: 7,
    paddingRight: 5,
    paddingVertical: 5,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
  },

  composerSubmitting: {
    opacity: 0.82,
  },

  composerError: {
    borderColor: "#DC2626",
    backgroundColor: "#FFF9F9",
  },

  inputIcon: {
    width: 34,
    height: 34,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 3,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },

  input: {
    flex: 1,
    minHeight: 38,
    maxHeight: 96,
    color: "#0F172A",
    fontSize: 10.5,
    lineHeight: 17,
    fontFamily: "Poppins_500Medium",
    paddingTop: 9,
    paddingBottom: 7,
    textAlignVertical: "top",
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 7,
    elevation: 3,
  },

  composerFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 3,
    marginTop: 4,
  },

  secureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    flex: 1,
  },

  disclaimer: {
    color: "#94A3B8",
    fontSize: 7,
    textAlign: "left",
    fontFamily: "Poppins_500Medium",
  },

  characterCount: {
    color: "#B0BAC7",
    fontSize: 7,
    fontFamily: "Poppins_500Medium",
  },

  errorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 4,
    marginLeft: 4,
  },

  inputError: {
    color: "#DC2626",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
  },

  // -------------------------------------------------------------------------
  // INTERACTION
  // -------------------------------------------------------------------------

  pressed: {
    opacity: 0.82,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  disabled: {
    opacity: 0.5,
  },
});