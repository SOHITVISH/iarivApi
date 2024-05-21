import { } from 'dotenv/config'

let baseUrl = process.env.PAYPAL_BASE_URL

let clientId = process.env.PAYPAL_CLIENT_ID
let secretKey = process.env.PAYPAL_SECRET_ID

let secret = Buffer.from(`${clientId}:${secretKey}`).toString('base64')

const generatepaypaltoken = () => {
    var headers = new Headers()
    headers.append("Content-Type", "application/x-www-form-urlencoded");
    headers.append("Authorization", "Basic " + secret);

    var requestOptions = {
        method: 'POST',
        headers: headers,
        body: 'grant_type=client_credentials',
    };

    return new Promise((resolve, reject) => {
        fetch(baseUrl + '/v1/oauth2/token', requestOptions).then(response => response.text()).then(result => {
            const { access_token } = JSON.parse(result)
            resolve(access_token)
        }).catch(error => {
            reject(error)
        })
    }
    )
}

export default generatepaypaltoken