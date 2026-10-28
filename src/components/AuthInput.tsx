import React, {useState} from 'react';
import {
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  TouchableOpacity,
  View,
} from 'react-native';
import {colors} from '../theme/colors';

interface Props extends TextInputProps {
  label: string;
  icon: string;
  error?: string;
  isPassword?: boolean;
}

export default function AuthInput({
  label,
  icon,
  error,
  isPassword,
  ...rest
}: Props) {
  const [focused, setFocused] = useState(false);
  const [hidden, setHidden] = useState(true);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <View
        style={[
          styles.field,
          focused && styles.fieldFocused,
          !!error && styles.fieldError,
        ]}>
        <Text style={styles.icon}>{icon}</Text>
        <TextInput
          {...rest}
          style={styles.input}
          placeholderTextColor={colors.textMuted}
          secureTextEntry={isPassword && hidden}
          autoCapitalize={rest.autoCapitalize ?? 'none'}
          onFocus={e => {
            setFocused(true);
            rest.onFocus?.(e);
          }}
          onBlur={e => {
            setFocused(false);
            rest.onBlur?.(e);
          }}
        />
        {isPassword && (
          <TouchableOpacity
            onPress={() => setHidden(h => !h)}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Text style={styles.toggle}>{hidden ? 'Hiện' : 'Ẩn'}</Text>
          </TouchableOpacity>
        )}
      </View>
      {!!error && <Text style={styles.error}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {marginBottom: 16},
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.textSoft,
    marginBottom: 8,
    marginLeft: 4,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: 'transparent',
    paddingHorizontal: 14,
    height: 54,
  },
  fieldFocused: {
    borderColor: colors.primary,
    backgroundColor: '#fff',
  },
  fieldError: {
    borderColor: colors.danger,
    backgroundColor: colors.dangerSoft,
  },
  icon: {fontSize: 17, marginRight: 10},
  input: {
    flex: 1,
    fontSize: 15,
    color: colors.text,
    paddingVertical: 0,
  },
  toggle: {
    color: colors.primary,
    fontWeight: '600',
    fontSize: 13,
  },
  error: {
    color: colors.danger,
    fontSize: 12,
    marginTop: 6,
    marginLeft: 6,
  },
});

