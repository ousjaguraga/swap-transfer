import React from 'react';
import { Text, View, Pressable } from 'react-native';
import styles from '../../../styles/styles';

export default function BelowForm({ navigation, left, right }) {
  const handlePress = (screen, data) => {
    navigation.navigate(screen, data);
  };

  return (
    <View style={styles.container}>
      <View style={{ flex: 1, flexDirection: 'row', marginTop: 40 }}>
          
        <Pressable
          style={[{ marginLeft: 10, height: 10 }, styles.secondaryButtonContainer]}
          onPress={() => handlePress(left.screen, left.data)}
        >
          <Text style={styles.secondaryButtonLabelDescription}>{left.desc}</Text>
          <Text style={styles.secondaryButton}>{left.label}</Text>
        </Pressable>
        <Pressable
          style={[{ marginLeft: 80, height: 10 }, styles.secondaryButtonContainer]}
          onPress={() => handlePress(right.screen, right.data)}
        >
          <Text style={styles.secondaryButtonLabelDescription}>{right.desc}</Text>
          <Text style={styles.secondaryButton}>{right.label}</Text>
        </Pressable>
      </View>
    </View>
  );
}
