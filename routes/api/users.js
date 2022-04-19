const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { User } = require('../../models');
const { checkIfAuthenticatedJWT } = require('../../middlewares');
const generateAccessToken = (user) => {
    // three arguments:
    // arg 1: JWT payload
    // arg 2: token secret
    // arg 3: configuration object
    return jwt.sign({
        'username': user.username,
        'id': user.id,
        'email': user.email
    }, process.env.TOKEN_SECRET,{
        'expiresIn':'1h'  // w for weeks, m for minutes, s for seconds
    });
}

const getHashedPassword = (password) => {
    const sha256 = crypto.createHash('sha256');
    const hash = sha256.update(password).digest('base64');
    return hash;
}

router.post('/login', async(req,res)=>{
    let user = await User.where({
        'email': req.body.email
    }).fetch({
        require: false
    });

    if (user && user.get('password') == getHashedPassword(req.body.password)){
        let accessToken = generateAccessToken(user.toJSON());
        res.send({
            'accessToken':accessToken
        })
    } else {
        res.send({
            'error':"Wrong email or password"
        })
    }
})

router.get('/profile', checkIfAuthenticatedJWT, function(req,res) {
    res.send({
        'message':"Welcome" + req.user.username
    })
} )


module.exports = router;