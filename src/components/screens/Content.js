import React, { Component } from "react";
import { View, Text, StyleSheet } from "react-native";

const Content = props => (
  <View style={props.style}>
    <View style={styles.line}/>
    {props.info && (
      <Text style={{ fontSize: 20, color: "white" }}>
        {props.info}
      </Text>
    )}
    <Text style={styles.text}>Total: <Text style={styles.currency}>{props.total}€</Text></Text>
    <View style={styles.line}/>
    <Text style={styles.text}>Cash to deliver: <Text style={styles.currency}>{props.cash_to_deliver}€</Text></Text>
    <View style={styles.line}/>
    <Text style={styles.text}>Cash to collect: <Text style={styles.currency}>{props.cash_to_collect}€</Text></Text>
    <View style={styles.line}/>
    <Text style={styles.text}>Agents get: <Text style={styles.currency}>{props.agents_get}€</Text></Text>
    <View style={styles.line}/>
    <Text style={styles.text}>Profits: <Text style={styles.currency}>{props.profits}€</Text></Text>
  </View>
);

const styles = StyleSheet.create({
  text: {
    color: "black",
    flex: 1,
    fontSize: 21
  },
  currency:{
    color: "white",
    //backgroundColor: "black",
  },
  line: {
   // borderBottomColor: "black",
   // borderBottomWidth: 1,
  }
});
export default Content;