const express = require('express');
const hbs = require('hbs')
const wax = require('wax-on');
const cors = require('cors');
require('dotenv').config();

// setInterval(function(){
//     let d = new Date();
//     if (d.getHours() == 12) {
//         // check to delete expired tokens in blacklist
//     }
// },60*60*1000)

const session = require('express-session');
const flash = require('connect-flash');
const FileStore = require('session-file-store')(session);

// require in csurf
const csrf = require('csurf');


// create express app
const app = express();

// setup the express app
app.set('view engine', 'hbs');

app.use(express.static('public'));

wax.on(hbs.handlebars);
wax.setLayoutPath('./views/layouts');

// enable forms
app.use(express.urlencoded({
    'extended': false
}))

// custom middlewares
app.use(function(req,res,next){
    // declare a varianle named
    // date that is available for
    // all hbs file to access
    res.locals.date = Date();

    next(); // forward the request to the next middleware
            // or if there is no middleware,to the intended route function
})

app.use(cors()); // make sure to enable cors before sessions

// setup sessions
app.use(session({
    'store': new FileStore(),
    'secret':process.env.SESSION_SECRET_KEY,
    'resave': false,
    'saveUninitialized': true
}))

// setup flash message
app.use(flash());

// display in the hbs file
app.use(function(req,res,next){
    // transfer any success messages stored in the session
    // to the variables in hbs files
    res.locals.success_messages = req.flash("success_messages");
    res.locals.error_messages = req.flash('error_messages');
    next();    
})

// app.use(csrf());
const csurfInstance = csrf();  // creating a prox of the middleware
app.use(function(req,res,next){
    // if it is webhook url, then call next() immediately
    // or if the url is for the api, then also exclude from csrf
    if (req.url === '/checkout/process_payment' || 
        req.url.slice(0,5)=='/api/') {
        next();
    } else {
        csurfInstance(req,res,next);
    }


})

// middleware to share the csrf token with all hbs files
app.use(function(req,res,next){
    // the req.csrfToken() generates a new token
    // and save its to the current session
    if (req.csrfToken) {
        res.locals.csrfToken = req.csrfToken();
    }
    next();
})

// middleware to handle csrf errors
// if a middleware function takes 4 arguments
// the first argument is error
app.use(function(err, req,res,next){
    if (err && err.code == "EBADCSRFTOKEN") {
        req.flash('error_messages', "The form has expired. Please try again");
        res.redirect('back'); // go back one page
    } else {
        next();
    }
})

// share the details of the logged in user with all routes
app.use(function(req,res,next){
    res.locals.user = req.session.user;
    next();
})


// IMPORT IN THE ROUTES
const landingRoutes = require('./routes/landing');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const cloudinaryRoutes = require('./routes/cloudinary')
const shoppingCartRoutes = require('./routes/shoppingCart');
const checkoutRoutes = require('./routes/checkout')

// CREATE API ROUTES
const api = {
    products: require('./routes/api/products'),
    users: require('./routes/api/users')
}

const { checkIfAuthenticated } = require('./middlewares');



async function main(){
    app.get('/', function(req,res){
                res.redirect('/landing');
            })

    app.use('/landing', landingRoutes);
    app.use('/products', productRoutes);
    app.use('/users', userRoutes);
    app.use('/cloudinary', cloudinaryRoutes);
    app.use('/cart', checkIfAuthenticated ,  shoppingCartRoutes);
    app.use('/checkout', checkoutRoutes);
    app.use('/api/products', express.json(), api.products);
    app.use('/api/users', express.json(), api.users);

}
main();

// (async function(){
//     console.log("app")
//     console.log("app.get")
//     app.get('/', function(req,res){
//         console.log(res);
//         res.send("Hello World");
//     })
// })();

app.listen(process.env.PORT,function(req,res){
    console.log("Server started");
})