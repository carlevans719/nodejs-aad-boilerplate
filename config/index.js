const fs = require('fs')
const path = require('path')
const util = require('util')

const readFile = util.promisify(fs.readFile)

const TYPES = {
    str: 'string',
    int: 'integer',
    bool: 'boolean',
    float: 'float',
    obj: 'object'
}

const toBoolean = (str, fallback) => {
    if (str === 'true' || str === '1' || str === true || str === 1) {
        return true
    }

    if (str === 'false' || str === '0' || str === false || str === 0) {
        return false
    }

    return fallback
}

const toJson = (str, fallback) => {
    try {
        return JSON.parse(str)
    } catch (ex) {
        return fallback
    }
}

const parseEnv = (key, expectedType, fallback) => {
    const val = process.env[key]
    if (val === undefined) {
        return fallback
    }

    switch (expectedType) {
        case TYPES.str:
            return val
        case TYPES.int:
            return isNaN(parseInt(val, 10)) ? fallback : parseInt(val, 10)
        case TYPES.bool:
            return toBoolean(val, fallback)
        case TYPES.float:
            return isNaN(parseFloat(val)) ? fallback : parseFloat(val)
        case TYPES.obj:
            return toJson(val, fallback)
    }

    return fallback
}

module.exports = async () => {
    const logLevel = parseEnv('LOG_LEVEL', TYPES.str, 'error') // info, warn or error

    const ssl = {
        enabled: parseEnv('SSL_ENABLED', TYPES.bool, true),
        cert: null,
        key: null
    }

    if (ssl.enabled) {
        ssl.cert = parseEnv('SSL_CERT', TYPES.str, await readFile(path.join(__dirname, 'server.cert')))
        ssl.key = parseEnv('SSL_KEY', TYPES.str, await readFile(path.join(__dirname, 'server.key')))
    }
    
    const config = {
        session: {
            path: parseEnv('SESSION_COOKIE_PATH', TYPES.str, '/'),
            httpOnly: parseEnv('SESSION_COOKIE_HTTP_ONLY', TYPES.bool, true),
            secure: parseEnv('SESSION_COOKIE_SECURE', TYPES.bool, true),
            maxAge: parseEnv('SESSION_COOKIE_MAX_AGE', TYPES.int, null),
            secret: parseEnv('SESSION_SECRET', TYPES.str, 'secret'),
            resave: parseEnv('SESSION_RESAVE', TYPES.bool, true),
            saveUninitialized: parseEnv('SESSION_SAVE_UNINITIALIZED', TYPES.bool, false)
        },

        trustedProxyCount: parseEnv('TRUSTED_PROXY_COUNT', TYPES.int, 1),

        title: parseEnv('TITLE', TYPES.str, 'PR Server'),

        logFormat: parseEnv('LOG_FORMAT', TYPES.str, 'combined'), // combined, common, dev, short, tiny
        logLevel,

        port: parseEnv('PORT', TYPES.int, 3000),

        env: parseEnv('NODE_ENV', TYPES.str, 'production'), // development, test or production

        ssl,

        openid: {
            allowHttpForRedirectUrl: parseEnv('OPENID_ALLOW_HTTP_REDIRECT_URL', TYPES.bool, false),
            redirectUrl: parseEnv('OPENID_REDIRECT_URL', TYPES.str, 'https://localhost:3000/auth/callback'),
            clientID: parseEnv('OPENID_CLIENT_ID', TYPES.str, ''),
            clientSecret: parseEnv('OPENID_CLIENT_SECRET', TYPES.str, ''),
            issuer: parseEnv('OPENID_ISSUER', TYPES.str, ''),
            validateIssuer: parseEnv('OPENID_VALIDATE_ISSUER', TYPES.bool, true),
            // v1:   https://login.microsoftonline.com/['common' or ${tenantGuid} or ${tenantName}+'.onmicrosoft.com']/.well-known/openid-configuration
            // v2:   https://login.microsoftonline.com/['common' or ${tenantGuid} or ${tenantName}+'.onmicrosoft.com']/v2.0/.well-known/openid-configuration
            identityMetadata: parseEnv('OPENID_IDENTITY_METADATA', TYPES.str, 'https://login.microsoftonline.com/common/.well-known/openid-configuration'),
            responseType: parseEnv('OPENID_RESPONSE_TYPE', TYPES.str, 'id_token'),
            responseMode: parseEnv('OPENID_RESPONSE_MODE', TYPES.str, 'form_post'),
            // scope: parseEnv('OPENID_SCOPES', TYPES.obj, ['email']),
            isB2C: parseEnv('OPENID_IS_B2C', TYPES.bool, false),
            loggingLevel: logLevel, // Same as top-level logLevel var
            loggingNoPII: parseEnv('OPENID_LOGGING_NO_PII', TYPES.bool, true),
            nonceLifetime: parseEnv('OPENID_NONCE_LIFETIME', TYPES.int, 3600),
            nonceMaxAmount: parseEnv('OPENID_NONCE_MAX_AMOUNT', TYPES.int, 10),
            clockSkew: parseEnv('OPENID_CLOCK_SKEW', TYPES.int, 300),
            passReqToCallback: false
        }
    }

    return config
}
