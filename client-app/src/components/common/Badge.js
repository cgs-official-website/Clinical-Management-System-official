import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { getStatusStyle } from '../../utils/formatters';
import { RADIUS } from '../../constants/theme';

export const Badge = ({ label, status, style, textStyle }) => {
  const statusColors = getStatusStyle(status || label);

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: statusColors.bg,
          borderColor: statusColors.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            color: statusColors.text,
          },
          textStyle,
        ]}
      >
        {label || status}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
});

export default Badge;
