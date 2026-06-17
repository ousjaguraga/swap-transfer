// expo
import Constants from "expo-constants";
import { generateAuthHeader } from './auth'

// third party
import axios from 'axios';


export const postToAPI = async (url, payload) => {
    const authHeader = generateAuthHeader()

    try {
        const response = await axios.post(url, payload, {
            headers: {
                'Content-Type': 'application/json',
                Authorization: authHeader,
            },
        })
        return response.data

    } catch (err) {
        console.log(err)
        return err
    }
}
