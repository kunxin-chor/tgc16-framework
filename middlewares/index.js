const jwt = require('jsonwebtoken');

const checkIfAuthenticated = function(req,res,next) {
    if (req.session.user) {
        next();
    } else {
        req.flash("error_messages", "Unable to comply. Please login");
        res.redirect('/users/login');
    }


}

const checkIfAuthenticatedJWT = function(req,res,next) {
    const authHeader = req.headers.authorization;

    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, process.env.TOKEN_SECRET, function(err,payload){
            if (err) {
                return res.sendStatus(403);
            }

            req.user = payload;
            next();
        })
    } else {
        res.sendStatus(403);
    }
}


module.exports = { checkIfAuthenticated, checkIfAuthenticatedJWT };