import { Alert } from 'react-native'

// set error messages for password and email errors
const password_error_message = "Password should contain an uppercase, a numbers and a special character"
const email_error_messsage = "Please enter a valid email"
const wrong_credentials =  "The email or password you entered is wrong"
const verification_code_error = "The code is invalid or expired, please check"

// switch over default errors returned by amplify and map them to your custom friendly error
function catchError(error){
    switch(error.ErrorMessage){
        
        case "t":
            return password_error_message
        
        case "You must enter valid username and password":
            return email_error_messsage
        
        case 'Invalid verification code provided, please try again.':
            return verification_code_error
        
        case "Invalid code provided, please request a code again.":
            return verification_code_error
            
        case "Username cannot be empty":
            return email_error_messsage

        case "1 validation error detected: Value at 'password' failed to satisfy constraint: Member must have length greater than or equal to 6":
            return password_error_message
       
        case "Password did not conform with policy: Password must have uppercase characters":
            return password_error_message
        
        case "Password did not conform with policy: Password not long enough":
            return "Password is too short"

        case "Password did not conform with policy: Password must have numeric characters":
            return password_error_message
        
        case "Password did not conform with policy: Password must have uppercase characters":
            return password_error_message
        
        case "Pending sign-in attempt already in progress":
             return "i am still processing the last request ..."

        case  "Incorrect username or password.":
            return wrong_credentials
        case "User does not exist.":
            return wrong_credentials
        case "1 validation error detected: Value at 'username' failed to satisfy constraint: Member must satisfy regular expression pattern: [\\p{L}\\p{M}\\p{S}\\p{N}\\p{P}]+":
            return email_error_messsage
        
        default:
            return "Unknown Error: if this persists please report it to us. Thank you"
    }
}

// take as input what ever catchError returns and show it to the user

const showError = (error) => {
    console.log(error)
    Alert.alert(catchError(error))
}

export default showError;
