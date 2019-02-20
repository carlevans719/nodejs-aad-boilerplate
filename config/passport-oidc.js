const { OIDCStrategy } = require ('passport-azure-ad')

// Map to store logged-in users
const loggedInUsers = {}

const sanitiseEmail = email => email.replace(/[^a-z.-_0-9]/ig, '')

module.exports = (passport, config) => {
    const verify = (profile, done) => {
        if (profile && profile._json) {
            profile = profile._json
        }

        if (!profile || !profile.email) {
            return done(new Error('No email found'), null)
        }

        const email = sanitiseEmail(profile.email)
        const user = loggedInUsers[email]

        if (!user) {
            loggedInUsers[email] = profile
            return done(null, profile)
        }

        return done(null, user)
    }

    passport.serializeUser((user, done) => done(null, sanitiseEmail(user.email)))
    passport.deserializeUser((id, done) => done(null, loggedInUsers[sanitiseEmail(id)] || null))
    passport.use(new OIDCStrategy(config.openid, verify))
}
