import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "@/components/c03-marketplace/themed-native";

interface Option<T extends string> {
  label: string;
  value: T;
}

interface OptionSelectorProps<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (value: T) => void;
  error?: string;
}

export function OptionSelector<T extends string>({
  label,
  value,
  options,
  onChange,
  error,
}: OptionSelectorProps<T>) {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.options}>
        {options.map((option) => {
          const selected = option.value === value;

          return (
            <Pressable
              key={option.value}
              onPress={() => onChange(option.value)}
              style={[
                styles.option,
                selected && styles.selectedOption,
              ]}
            >
              <Text
                style={[
                  styles.optionText,
                  selected && styles.selectedText,
                ]}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },

  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#334155",
  },

  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },

  option: {
    paddingVertical: 11,
    paddingHorizontal: 15,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "#CBD5E1",
    backgroundColor: "#FFFFFF",
  },

  selectedOption: {
    borderColor: "#166534",
    backgroundColor: "#DCFCE7",
  },

  optionText: {
    color: "#475569",
    fontWeight: "600",
  },

  selectedText: {
    color: "#166534",
  },

  error: {
    color: "#DC2626",
    fontSize: 12,
  },
});