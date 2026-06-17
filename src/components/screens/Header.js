import React from 'react';
import { StyleSheet, View, Text, Image } from 'react-native';
import appColor from '../../styles/brand'

const Header = () => {
    return (
        <View style={styles.container}>
            <Text style={styles.title}>Swap Transfer 🔄</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        alignItems: 'center',
        backgroundColor: appColor.primary,
        borderBottomStartRadius: 100,
        borderEndStartRadius: 10,
        borderTopWidth: 0,
        borderWidth: 2,
        borderColor: appColor.secondary,
        shadowColor: "#fff",
        shadowOffset: {
            width: 0,
            height: 3,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,

    },
    logo: {
        width: 100,
        height: 100,
        borderRadius: 100,
        marginTop: 45
    },
    title: {
        fontSize: 50,
        fontWeight: 'bold',
        color: appColor.secondary

    }
});

export default Header;
