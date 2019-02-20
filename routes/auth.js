const express = require('express')

module.exports = (passport, config) => {
    const app = express()

    app.get('/',
        passport.authenticate('azuread-openidconnect', { failureRedirect: '/?state=login-failed' }),
        (req, res) => res.redirect('/?state=login-success')
    )

    app.post('/callback',
        passport.authenticate('azuread-openidconnect', { failureRedirect: '/?state=login-failed' }),
        (req, res) => res.redirect('/?state=login-success')
    )

    return app
}
