const express = require('express')

module.exports = (passport, config) => {
    const app = express()

    app.get('/', (req, res) => {
        res.render('index', { pageTitle: config.title, user: req.user })
    })

    app.get('/login',
        passport.authenticate('azuread-openidconnect', { failureRedirect: '/?state=login-failed' }),
        (req, res) => res.redirect('/?state=login-success')
    )

    app.get('/logout', (req, res) => {
        req.logout()
        res.redirect('/?state=logout-success')
    })

    return app
}
