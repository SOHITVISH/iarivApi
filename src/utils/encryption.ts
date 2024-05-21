import crypto from 'crypto'
import { } from 'dotenv/config'

let secret_key = process.env.DB_AUTH_SECRET
let secret_iv = "46"
let ecnryption_method = "aes-256-cbc"

if (!secret_key || !secret_iv || !ecnryption_method) {
    throw new Error('secretKey, secretIV, and ecnryptionMethod are required')
}

const key = crypto
    .createHash('sha512')
    .update(secret_key)
    .digest('hex')
    .substring(0, 32)
const encryptionIV = crypto
    .createHash('sha512')
    .update(secret_iv)
    .digest('hex')
    .substring(0, 16)

export function encryptData(data:string) {
    let cipher = crypto.createCipheriv(ecnryption_method, Buffer.from(key), encryptionIV);
    return Buffer.from(
        cipher.update(data, 'utf8', 'hex') + cipher.final('hex')
    ).toString('base64')
}

export function decryptData(encryptedData:string) {
    const buff = Buffer.from(encryptedData, 'base64')
    const decipher = crypto.createDecipheriv(ecnryption_method, key, encryptionIV)
    return (
        decipher.update(buff.toString('utf8'), 'hex', 'utf8') +
        decipher.final('utf8')
    )
}