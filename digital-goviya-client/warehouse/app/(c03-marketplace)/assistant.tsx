import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import {
  useCallback,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ActivityIndicator,
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

  const accent =
    user?.role === "miller"
      ? "#92400E"
      : "#15803D";

  const accentSoft =
    user?.role === "miller"
      ? "#FEF3C7"
      : "#DCFCE7";

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
        <View style={styles.header}>
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

          <View style={styles.headerIcon}>
            <Ionicons
              name="sparkles"
              size={20}
              color={accent}
            />
          </View>

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
        </View>

        <FlatList
          ref={listRef}
          data={displayedMessages}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ChatMessage
              message={item}
              accent={accent}
              accentSoft={accentSoft}
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
                <View
                  style={[
                    styles.heroIcon,
                    {
                      backgroundColor:
                        accentSoft,
                    },
                  ]}
                >
                  <Ionicons
                    name="chatbubble-ellipses-outline"
                    size={25}
                    color={accent}
                  />
                </View>

                <View style={styles.heroText}>
                  <Text style={styles.heroEyebrow}>
                    AI KNOWLEDGE ASSISTANT
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
                    <Pressable
                      key={item}
                      disabled={submitting}
                      onPress={() =>
                        void submitQuestion(
                          item
                        )
                      }
                      style={({
                        pressed,
                      }) => [
                        styles.suggestionChip,
                        {
                          borderColor:
                            accentSoft,
                        },
                        pressed &&
                          styles.pressed,
                        submitting &&
                          styles.disabled,
                      ]}
                    >
                      <Ionicons
                        name="sparkles-outline"
                        size={14}
                        color={accent}
                      />

                      <Text
                        style={
                          styles.suggestionText
                        }
                      >
                        {item}
                      </Text>
                    </Pressable>
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
              <TypingIndicator
                accent={accent}
                accentSoft={accentSoft}
              />
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

            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Send question"
              disabled={
                submitting ||
                question.trim().length < 2
              }
              onPress={() =>
                void submitQuestion()
              }
              style={({ pressed }) => [
                styles.sendButton,
                {
                  backgroundColor: accent,
                },
                pressed && styles.pressed,
                (
                  submitting ||
                  question.trim().length < 2
                ) &&
                  styles.disabled,
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
            </Pressable>
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

interface ChatMessageProps {
  message: RagChatMessage;
  accent: string;
  accentSoft: string;
}

function ChatMessage({
  message,
  accent,
  accentSoft,
}: ChatMessageProps) {
  const [showSources, setShowSources] =
    useState(false);

  const isUser =
    message.sender === "user";

  const hasSources =
    Boolean(message.context?.trim()) ||
    Boolean(message.results?.length);

  return (
    <View
      style={[
        styles.messageRow,
        isUser
          ? styles.userMessageRow
          : styles.assistantMessageRow,
      ]}
    >
      {!isUser ? (
        <View
          style={[
            styles.avatar,
            {
              backgroundColor: accentSoft,
            },
          ]}
        >
          <Ionicons
            name={
              message.failed
                ? "warning-outline"
                : "sparkles"
            }
            size={17}
            color={
              message.failed
                ? "#B91C1C"
                : accent
            }
          />
        </View>
      ) : null}

      <View
        style={[
          styles.messageBubble,
          isUser
            ? [
                styles.userBubble,
                {
                  backgroundColor: accent,
                },
              ]
            : message.failed
              ? styles.failedBubble
              : styles.assistantBubble,
        ]}
      >
        <Text
          style={[
            styles.messageText,
            isUser
              ? styles.userMessageText
              : message.failed
                ? styles.failedMessageText
                : styles.assistantMessageText,
          ]}
        >
          {message.text}
        </Text>

        {!isUser && hasSources ? (
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
                color={accent}
              />

              <Text
                style={[
                  styles.sourceButtonText,
                  {
                    color: accent,
                  },
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
                color={accent}
              />
            </Pressable>

            {showSources ? (
              <View
                style={styles.sourceContainer}
              >
                {message.context?.trim() ? (
                  <>
                    <Text
                      style={styles.sourceTitle}
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
                                  accentSoft,
                              },
                            ]}
                          >
                            <Text
                              style={[
                                styles.resultNumberText,
                                {
                                  color: accent,
                                },
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

        <Text
          style={[
            styles.messageTime,
            isUser &&
              styles.userMessageTime,
          ]}
        >
          {formatTime(message.createdAt)}
        </Text>
      </View>
    </View>
  );
}

interface TypingIndicatorProps {
  accent: string;
  accentSoft: string;
}

function TypingIndicator({
  accent,
  accentSoft,
}: TypingIndicatorProps) {
  return (
    <View style={[styles.messageRow, styles.assistantMessageRow]}>
      <View
        style={[
          styles.avatar,
          {
            backgroundColor: accentSoft,
          },
        ]}
      >
        <Ionicons name="sparkles" size={17} color={accent} />
      </View>

      <View
        style={[
          styles.messageBubble,
          styles.assistantBubble,
          styles.typingBubble,
        ]}
      >
        <ActivityIndicator size="small" color={accent} />

        <Text style={styles.typingText}>
          Retrieving agricultural information and generating an answer...
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
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },

  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F3F4F6",
  },

  headerIcon: {
    width: 40,
    height: 40,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
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
  },

  heroIcon: {
    width: 48,
    height: 48,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },

  heroText: {
    flex: 1,
  },

  heroEyebrow: {
    color: "#B45309",
    fontSize: 8,
    fontFamily: "Poppins_700Bold",
    letterSpacing: 0.8,
  },

  heroTitle: {
    color: "#1F2937",
    fontSize: 14,
    fontFamily: "Poppins_700Bold",
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
    gap: 8,
    minHeight: 45,
    borderRadius: 15,
    paddingHorizontal: 13,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
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
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 11,
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
    backgroundColor: "#F8FAFC",
  },

  sourceTitle: {
    color: "#475569",
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
    gap: 9,
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