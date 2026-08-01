import { Ionicons } from "@expo/vector-icons";
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
} from "react-native";

import {
  useFonts,
  Poppins_800ExtraBold,
  Poppins_700Bold,
  Poppins_600SemiBold,
  Poppins_500Medium,
} from "@expo-google-fonts/poppins";

import {
  useMarketplaceAuth,
} from "@/hooks/c03-marketplace/useMarketplaceAuth";

import {
  ragService,
} from "@/services/c03-marketplace/rag.service";

import {
  getApiErrorMessage,
} from "@/utils/c03-marketplace/getApiErrorMessage";

import type {
  RagChatMessage,
} from "@/types/c03-marketplace/rag.types";

const SUGGESTED_QUESTIONS = [
  "What is the current price of Nadu paddy?",
  "What are the quality requirements for selling paddy?",
  "Explain the difference between Maha and Yala seasons.",
  "How should I evaluate a miller's offered price?",
];

// ---------------------------------------------------------------------------
// Role themes
//
// Farmer  -> paddy-field green: fresh, growing, open-field
// Miller  -> milled-grain amber: warm, toasted, processed
// ---------------------------------------------------------------------------
type RoleTheme = {
  accent: string;
  accentDark: string;
  accentSoft: string;
  gradient: [string, string];
  headerGradient: [string, string];
  icon: keyof typeof Ionicons.glyphMap;
  eyebrow: string;
};

const FARMER_THEME: RoleTheme = {
  accent: "#2F9E44",
  accentDark: "#1B5E20",
  accentSoft: "#E6F7EA",
  gradient: ["#3FB663", "#1B7A3D"],
  headerGradient: ["#EAFBEF", "#F8FAF8"],
  icon: "leaf",
  eyebrow: "GROWER KNOWLEDGE ASSISTANT",
};

const MILLER_THEME: RoleTheme = {
  accent: "#C2760C",
  accentDark: "#7A4708",
  accentSoft: "#FBEBD2",
  gradient: ["#DE9A2E", "#A85E0A"],
  headerGradient: ["#FDF3E2", "#F8FAF8"],
  icon: "cube",
  eyebrow: "MILLER KNOWLEDGE ASSISTANT",
};

export default function MarketplaceAssistantScreen() {
  const { user } = useMarketplaceAuth();

  const listRef =
    useRef<FlatList<RagChatMessage>>(null);

  const [question, setQuestion] =
    useState("");

  const [messages, setMessages] =
    useState<RagChatMessage[]>([]);

  const [submitting, setSubmitting] =
    useState(false);

  const [inputError, setInputError] =
    useState<string | null>(null);

  const [fontsLoaded] = useFonts({
    Poppins_800ExtraBold,
    Poppins_700Bold,
    Poppins_600SemiBold,
    Poppins_500Medium,
  });

  const theme: RoleTheme =
    user?.role === "miller"
      ? MILLER_THEME
      : FARMER_THEME;

  // Kept for backwards-compatible naming used deeper in the tree.
  const accent = theme.accent;
  const accentSoft = theme.accentSoft;

  const assistantWelcome = useMemo(
    (): RagChatMessage => ({
      id: "assistant-welcome",
      sender: "assistant",
      text:
        user?.role === "miller"
          ? "Hello. I can help you understand paddy prices, quality requirements, market conditions and purchasing decisions."
          : "Hello. I can help you understand paddy prices, selling requirements, market conditions and fair trading decisions.",
      createdAt: Date.now(),
    }),
    [user?.role]
  );

  const displayedMessages =
    messages.length > 0
      ? messages
      : [assistantWelcome];

  const scrollToBottom = useCallback(() => {
    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    });
  }, []);

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
        "Please enter a valid question."
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
    scrollToBottom();

    try {
      const response =
        await ragService.askQuestion({
          question: cleanedQuestion,
        });

      const answer =
        response.data.answer?.trim() ||
        "I found relevant information, but an answer could not be generated.";

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
      console.error(
        "RAG question failed:",
        error
      );

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
      scrollToBottom();
    }
  };

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
            : undefined
        }
        keyboardVerticalOffset={
          Platform.OS === "ios" ? 8 : 0
        }
      >
        <LinearGradient
          colors={theme.headerGradient}
          style={styles.header}
        >
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={21}
              color="#1F2937"
            />
          </Pressable>

          <LinearGradient
            colors={theme.gradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.headerIcon}
          >
            <Ionicons
              name={theme.icon}
              size={19}
              color="#FFFFFF"
            />
          </LinearGradient>

          <View style={styles.headerText}>
            <Text style={styles.headerTitle}>
              Market Assistant
            </Text>

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
                RAG-powered agricultural guidance
              </Text>
            </View>
          </View>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Clear conversation"
            onPress={() => {
              setMessages([]);
              setQuestion("");
              setInputError(null);
            }}
            style={({ pressed }) => [
              styles.headerButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="trash-outline"
              size={19}
              color="#64748B"
            />
          </Pressable>
        </LinearGradient>

        <FlatList
          ref={listRef}
          data={displayedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              theme={theme}
            />
          )}
          ListHeaderComponent={
            <View style={styles.listHeader}>
              <View
                style={[
                  styles.heroCard,
                  {
                    borderColor: accentSoft,
                  },
                ]}
              >
                <LinearGradient
                  colors={theme.gradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={styles.heroIcon}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={24}
                    color="#FFFFFF"
                  />
                </LinearGradient>

                <View style={styles.heroText}>
                  <Text
                    style={[
                      styles.heroEyebrow,
                      { color: theme.accentDark },
                    ]}
                  >
                    {theme.eyebrow}
                  </Text>

                  <Text style={styles.heroTitle}>
                    Ask about paddy markets
                  </Text>

                  <Text
                    style={
                      styles.heroDescription
                    }
                  >
                    Answers are generated using
                    retrieved agricultural data and
                    marketplace knowledge.
                  </Text>
                </View>
              </View>

              <Text style={styles.suggestionTitle}>
                Suggested questions
              </Text>

              <View
                style={styles.suggestionContainer}
              >
                {SUGGESTED_QUESTIONS.map(
                  (item) => (
                    <SuggestionChip
                      key={item}
                      text={item}
                      theme={theme}
                      disabled={submitting}
                      onPress={() =>
                        void submitQuestion(item)
                      }
                    />
                  )
                )}
              </View>

              <Text style={styles.conversationTitle}>
                Conversation
              </Text>
            </View>
          }
          ListFooterComponent={
            submitting ? (
              <TypingIndicator theme={theme} />
            ) : (
              <View style={styles.listBottomSpace} />
            )
          }
          contentContainerStyle={
            styles.messageList
          }
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          onContentSizeChange={scrollToBottom}
        />

        <View style={styles.composerArea}>
          {inputError ? (
            <Text style={styles.inputError}>
              {inputError}
            </Text>
          ) : null}

          <View
            style={[
              styles.composer,
              inputError
                ? styles.composerError
                : null,
            ]}
          >
            <TextInput
              value={question}
              onChangeText={(value) => {
                setQuestion(value);

                if (inputError) {
                  setInputError(null);
                }
              }}
              placeholder="Ask about prices, quality or trading..."
              placeholderTextColor="#94A3B8"
              multiline
              maxLength={500}
              editable={!submitting}
              style={styles.input}
              onSubmitEditing={() => {
                if (
                  Platform.OS === "web"
                ) {
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
              onPress={() =>
                void submitQuestion()
              }
            />
          </View>

          <Text style={styles.disclaimer}>
            AI answers should be reviewed before
            making financial or trading decisions.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ---------------------------------------------------------------------------
// Suggestion chip — press-scale micro-interaction
// ---------------------------------------------------------------------------
interface SuggestionChipProps {
  text: string;
  theme: RoleTheme;
  disabled: boolean;
  onPress: () => void;
}

function SuggestionChip({
  text,
  theme,
  disabled,
  onPress,
}: SuggestionChipProps) {
  const scale = useRef(new Animated.Value(1)).current;

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
      style={{ transform: [{ scale }] }}
    >
      <Pressable
        disabled={disabled}
        onPressIn={() => animateTo(0.97)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
        style={[
          styles.suggestionChip,
          { borderColor: theme.accentSoft },
          disabled && styles.disabled,
        ]}
      >
        <View
          style={[
            styles.suggestionIconDot,
            { backgroundColor: theme.accentSoft },
          ]}
        >
          <Ionicons
            name="sparkles-outline"
            size={12}
            color={theme.accent}
          />
        </View>

        <Text style={styles.suggestionText}>
          {text}
        </Text>

        <Ionicons
          name="arrow-forward"
          size={13}
          color={theme.accent}
        />
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Send button — gradient fill, scale feedback
// ---------------------------------------------------------------------------
interface SendButtonProps {
  theme: RoleTheme;
  disabled: boolean;
  submitting: boolean;
  onPress: () => void;
}

function SendButton({
  theme,
  disabled,
  submitting,
  onPress,
}: SendButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

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
      style={{ transform: [{ scale }] }}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Send question"
        disabled={disabled}
        onPressIn={() => animateTo(0.94)}
        onPressOut={() => animateTo(1)}
        onPress={onPress}
      >
        <LinearGradient
          colors={theme.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={[
            styles.sendButton,
            disabled && styles.disabled,
          ]}
        >
          {submitting ? (
            <ActivityIndicator
              size="small"
              color="#FFFFFF"
            />
          ) : (
            <Ionicons
              name="send"
              size={18}
              color="#FFFFFF"
            />
          )}
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Chat message bubble — fades and rises in on arrival
// ---------------------------------------------------------------------------
interface ChatMessageProps {
  message: RagChatMessage;
  theme: RoleTheme;
}

function ChatMessage({
  message,
  theme,
}: ChatMessageProps) {
  const [showSources, setShowSources] =
    useState(false);

  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(8)).current;

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
    // Runs once when the bubble mounts.
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
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: message.failed
                ? "#FEE2E2"
                : theme.accentSoft,
            },
          ]}
        >
          <Ionicons
            name={
              message.failed
                ? "warning-outline"
                : theme.icon
            }
            size={16}
            color={
              message.failed
                ? "#B91C1C"
                : theme.accent
            }
          />
        </View>
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
              {formatTime(message.createdAt)}
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
                  style={styles.sourceButton}
                >
                  <Ionicons
                    name="document-text-outline"
                    size={15}
                    color={theme.accent}
                  />

                  <Text
                    style={[
                      styles.sourceButtonText,
                      { color: theme.accent },
                    ]}
                  >
                    {showSources
                      ? "Hide retrieved information"
                      : "View retrieved information"}
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
                      { backgroundColor: theme.accentSoft },
                    ]}
                  >
                    {message.context?.trim() ? (
                      <>
                        <Text
                          style={[
                            styles.sourceTitle,
                            { color: theme.accentDark },
                          ]}
                        >
                          Retrieved context
                        </Text>

                        <Text
                          style={styles.sourceText}
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
                            { color: theme.accentDark },
                          ]}
                        >
                          Retrieved results
                        </Text>

                        {message.results.map(
                          (result, index) => (
                            <View
                              key={`${message.id}-${index}`}
                              style={
                                styles.resultItem
                              }
                            >
                              <View
                                style={[
                                  styles.resultNumber,
                                  {
                                    backgroundColor:
                                      "#FFFFFF",
                                  },
                                ]}
                              >
                                <Text
                                  style={[
                                    styles.resultNumberText,
                                    { color: theme.accent },
                                  ]}
                                >
                                  {index + 1}
                                </Text>
                              </View>

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
              {formatTime(message.createdAt)}
            </Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// Typing indicator — three grain-shaped dots bouncing in sequence
// ---------------------------------------------------------------------------
interface TypingIndicatorProps {
  theme: RoleTheme;
}

function TypingIndicator({ theme }: TypingIndicatorProps) {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makeLoop = (
      value: Animated.Value,
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

    return () => loops.forEach((loop) => loop.stop());
  }, [dot1, dot2, dot3]);

  const dotStyle = (value: Animated.Value) => ({
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
    <View style={[styles.messageRow, styles.assistantMessageRow]}>
      <View
        style={[
          styles.avatar,
          { backgroundColor: theme.accentSoft },
        ]}
      >
        <Ionicons name={theme.icon} size={16} color={theme.accent} />
      </View>

      <View
        style={[
          styles.messageBubble,
          styles.assistantBubbleShadow,
          styles.bubbleFill,
          styles.assistantBubble,
          styles.typingBubble,
        ]}
      >
        <View style={styles.typingDots}>
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: theme.accent },
              dotStyle(dot1),
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: theme.accent },
              dotStyle(dot2),
            ]}
          />
          <Animated.View
            style={[
              styles.typingDot,
              { backgroundColor: theme.accent },
              dotStyle(dot3),
            ]}
          />
        </View>

        <Text style={styles.typingText}>
          Retrieving agricultural information...
        </Text>
      </View>
    </View>
  );
}

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

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

  screen: {
    flex: 1,
    backgroundColor: "#F8FAF8",
  },

  header: {
    minHeight: 72,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.14,
    shadowRadius: 6,
    elevation: 3,
  },

  headerText: {
    flex: 1,
  },

  headerTitle: {
    color: "#1F2937",
    fontSize: 16,
    fontFamily: "Poppins_700Bold",
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
    color: "#6B7280",
    fontSize: 8.5,
    fontFamily: "Poppins_500Medium",
  },

  messageList: {
    paddingHorizontal: 16,
    paddingBottom: 18,
  },

  listHeader: {
    paddingTop: 17,
  },

  heroCard: {
    flexDirection: "row",
    gap: 13,
    padding: 16,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    marginBottom: 20,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 1,
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.16,
    shadowRadius: 6,
    elevation: 3,
  },

  heroText: {
    flex: 1,
  },

  heroEyebrow: {
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
  },

  heroTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontFamily: "Poppins_800ExtraBold",
    marginTop: 3,
  },

  heroDescription: {
    color: "#6B7280",
    fontSize: 9.5,
    lineHeight: 15,
    fontFamily: "Poppins_500Medium",
    marginTop: 4,
  },

  suggestionTitle: {
    color: "#1F2937",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    marginBottom: 10,
  },

  suggestionContainer: {
    gap: 8,
    marginBottom: 22,
  },

  suggestionChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    minHeight: 45,
    borderRadius: 15,
    paddingHorizontal: 11,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  suggestionIconDot: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },

  suggestionText: {
    flex: 1,
    color: "#475569",
    fontSize: 10,
    lineHeight: 15,
    fontFamily: "Poppins_500Medium",
  },

  conversationTitle: {
    color: "#1F2937",
    fontSize: 13,
    fontFamily: "Poppins_700Bold",
    marginBottom: 12,
  },

  messageRow: {
    width: "100%",
    marginBottom: 14,
  },

  userMessageRow: {
    alignItems: "flex-end",
  },

  assistantMessageRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
  },

  avatar: {
    width: 34,
    height: 34,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  messageBubble: {
    maxWidth: "84%",
  },

  bubbleFill: {
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
  },

  userBubbleShadow: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 2,
  },

  assistantBubbleShadow: {
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },

  userBubble: {
    borderBottomRightRadius: 6,
  },

  assistantBubble: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderTopLeftRadius: 6,
  },

  failedBubble: {
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderTopLeftRadius: 6,
  },

  messageText: {
    fontSize: 11,
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
    fontSize: 7.5,
    fontFamily: "Poppins_500Medium",
    marginTop: 7,
    textAlign: "right",
  },

  userMessageTime: {
    color: "rgba(255,255,255,0.68)",
  },

  sourceButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 12,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  sourceButtonText: {
    flex: 1,
    fontSize: 9,
    fontFamily: "Poppins_600SemiBold",
  },

  sourceContainer: {
    marginTop: 11,
    borderRadius: 13,
    padding: 11,
  },

  sourceTitle: {
    fontSize: 9,
    fontFamily: "Poppins_700Bold",
  },

  sourceText: {
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 15,
    fontFamily: "Poppins_500Medium",
    marginTop: 5,
  },

  resultsTitle: {
    marginTop: 13,
  },

  resultItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    marginTop: 8,
  },

  resultNumber: {
    width: 21,
    height: 21,
    borderRadius: 7,
    alignItems: "center",
    justifyContent: "center",
  },

  resultNumberText: {
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
  },

  resultText: {
    flex: 1,
    color: "#64748B",
    fontSize: 8.5,
    lineHeight: 14,
    fontFamily: "Poppins_500Medium",
  },

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
    fontSize: 9.5,
    fontFamily: "Poppins_500Medium",
  },

  listBottomSpace: {
    height: 4,
  },

  composerArea: {
    paddingHorizontal: 14,
    paddingTop: 10,
    paddingBottom:
      Platform.OS === "ios" ? 8 : 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
  },

  composer: {
    minHeight: 54,
    maxHeight: 120,
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 9,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    borderRadius: 18,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#CBD5E1",
  },

  composerError: {
    borderColor: "#DC2626",
  },

  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 104,
    color: "#0F172A",
    fontSize: 11,
    lineHeight: 17,
    fontFamily: "Poppins_500Medium",
    paddingTop: 10,
    paddingBottom: 8,
    textAlignVertical: "top",
  },

  sendButton: {
    width: 42,
    height: 42,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.18,
    shadowRadius: 6,
    elevation: 3,
  },

  inputError: {
    color: "#DC2626",
    fontSize: 9,
    fontFamily: "Poppins_500Medium",
    marginBottom: 5,
    marginLeft: 4,
  },

  disclaimer: {
    color: "#94A3B8",
    fontSize: 7.5,
    textAlign: "center",
    fontFamily: "Poppins_500Medium",
    marginTop: 7,
  },

  pressed: {
    opacity: 0.82,
    transform: [{ scale: 0.98 }],
  },

  disabled: {
    opacity: 0.5,
  },
});