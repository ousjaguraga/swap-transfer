// common styles accross components

import { Dimensions, StyleSheet } from 'react-native';
import appColor from './brand'


const width = Dimensions.get('window').width
const height = Dimensions.get('window').height

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: appColor.primary,
        alignItems: 'center', // align items on the x- axis  ... Left to right
        justifyContent: 'flex-start',  // align items from top to buttom
        //marginTop: Constants.statusBarHeight - 10
    },

    // text input styling
    textInput: {
        width: width * 0.90,
        height: 70,
        fontSize: 21,
        marginBottom: 20,

        // border styling
        borderWidth: 2,
        borderRadius: 6,
        paddingLeft: 9,
        shadowColor: 'white',
        shadowOpacity: 0.9,
        shadowRadius: 1,
        shadowOffset: {
            width: 0.5,
            height: 0
        },

        // end of border styling

        backgroundColor: 'black',
        color: '#fff'
    },
    // form field labels
    label: {
        alignSelf: 'flex-start',
        marginBottom: 10,
        color: appColor.primary
    },

    // just a wrapper around primary button
    primaryButtonContainer: {
        width: width * 0.60,
        height: 65,
        borderRadius: 15,
        justifyContent: 'center',
        alignSelf: 'center',
        backgroundColor: appColor.secondary,
        marginTop: 25
    },

    // disbaled button
    disbaledButton: {
        opacity: 0.5,
        backgroundColor: 'gray'
    },


    // styles all primary buttons (CTO) (the text )
    primaryButton: {
        fontSize: 17,
        alignSelf: 'center',
        color: '#fff',
    },


    // secondary buttons the second options for the auth pages used to avoid click responses all the way under the pressables
    secondaryButton: {
        height: 37,
        marginTop: 5,
        color: '#fff'
    },
    secondaryButtonContainer: {
        height: 37,
    },
    secondaryButtonLabelDescription: {
        color: 'black'
    },
    primaryButtonLabelDescription: {
        alignSelf: 'flex-start',
        margin: 50,
        marginLeft: 20,
        fontSize: 20,
        color: appColor.secondary
    },

});

export default styles