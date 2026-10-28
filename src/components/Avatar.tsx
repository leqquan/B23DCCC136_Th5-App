import React from 'react';
import {StyleSheet, Text, View} from 'react-native';
import {colors} from '../theme/colors';
import {getInitials} from '../utils/format';

interface Props {
  name?: string;
  color?: string;
  size?: number;
  online?: boolean;
  showStatus?: boolean;
}

export default function Avatar({
  name,
  color = colors.primary,
  size = 48,
  online = false,
  showStatus = false,
}: Props) {
  const dot = Math.max(10, Math.round(size * 0.28));
  return (
    <View style={{width: size, height: size}}>
      <View
        style={[
          styles.circle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: color,
          },
        ]}>
        {/* Lớp sáng nhẹ tạo cảm giác có chiều sâu */}
        <View
          style={[
            styles.shine,
            {
              width: size * 0.9,
              height: size * 0.9,
              borderRadius: size,
              top: -size * 0.35,
              left: -size * 0.2,
            },
          ]}
        />
        <Text style={[styles.initials, {fontSize: size * 0.36}]}>
          {getInitials(name)}
        </Text>
      </View>
      {showStatus && (
        <View
          style={[
            styles.dot,
            {
              width: dot,
              height: dot,
              borderRadius: dot / 2,
              backgroundColor: online ? colors.online : colors.offline,
            },
          ]}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  shine: {
    position: 'absolute',
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  initials: {
    color: '#fff',
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  dot: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    borderWidth: 2.5,
    borderColor: '#fff',
  },
});

