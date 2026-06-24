import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import appColor from '../../styles/brand'

const Header = () => {
    return (
        <View style={styles.container}>
            <View style={styles.mark}>
                <MaterialCommunityIcons name="swap-horizontal-bold" size={20} color="#03241B" />
            </View>
            <Text style={styles.title}>Swap Transfer</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        paddingHorizontal: 18,
        paddingVertical: 14,
        backgroundColor: appColor.surface,
        borderBottomWidth: 1,
        borderBottomColor: appColor.border,
    },
    mark: {
        width: 34,
        height: 34,
        borderRadius: 10,
        backgroundColor: appColor.secondary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    title: {
        fontSize: 20,
        fontWeight: '800',
        letterSpacing: -0.3,
        color: appColor.textPrimary,
    }
});

export default Header;
