import React from 'react'
import {ActivityIndicator, View, Text, StyleSheet} from 'react-native'
import appColor from '../../styles/brand'



export default function Loading(){
    return (
    <View style={styles.container}>
        <Text style={styles.logo}>🔄</Text>
        <Text style={styles.title}>Swap Transfer</Text>
        <ActivityIndicator size="large" color={appColor.primary} style={styles.loader}/>
    </View>
    )
    
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: appColor.secondaryDark, 
        flex: 1, 
        justifyContent: 'center',
        alignItems: 'center',
    },
    logo: {
        fontSize: 80,
        marginBottom: 20,
    },
    title: {
        fontSize: 28,
        fontWeight: 'bold',
        color: '#fff',
        marginBottom: 30,
    },
    loader: {
        marginTop: 20,
    }
})