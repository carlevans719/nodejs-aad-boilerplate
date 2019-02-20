const http = require('http')
const https = require('https')

const express = require('express')
const serveFavicon = require('serve-favicon')
const morgan = require('morgan')
const compression = require('compression')
const methodOverride = require('method-override')
const bodyParser = require('body-parser')
const responseTime = require('response-time')
const session = require('express-session')
const serveStatic = require('serve-static')
const passport = require('passport')
const dotenv = require('dotenv')

const getConfig = require('./config')
const configureOIDCStrategy = require('./config/passport-oidc')
const authRouter = require('./routes/auth')
const rootRouter = require('./routes/root')

;(async () => {
    try {
        // app config
        dotenv.config()
        const config = await getConfig()

        // server
        const app = express()

        // settings
        app.set('trust proxy', config.trustedProxyCount)
        app.set('views', 'views')
        app.set('view engine', 'ejs')

        // middleware
        app.use(methodOverride())
        app.use(serveFavicon('public/favicon.png'))
        app.use(morgan(config.logFormat))
        app.use(compression())
        app.use(bodyParser.json({ strict: false, extended: true }))
        app.use(bodyParser.urlencoded({ extended: true }))
        app.use(responseTime())
        app.use(session(config.session))
        if (config.env !== 'production') {
            app.use(require('errorhandler')())
        }

        // passport
        configureOIDCStrategy(passport, config)
        app.use(passport.initialize())
        app.use(passport.session())

        // routers
        app.use('/auth', authRouter(passport, config))
        app.use('/', rootRouter(passport, config))

        // public assets
        app.use(serveStatic('public', { fallthrough: false }))

        // listen
        if (config.ssl.enabled) {
            https.createServer(config.ssl, app).listen(config.port)
        } else {
            http.createServer(app).listen(config.port)
        }
    } catch (ex) {
        console.error(ex)
        process.exit()
    }
})()
