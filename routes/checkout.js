const express = require('express');
const { checkIfAuthenticated } = require('../middlewares');
const router = express.Router();

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const CartServices = require('../services/cart_services');

router.get('/', checkIfAuthenticated, async function(req,res) {
    // 1. get all the cart items
    let cartServices = new CartServices(req.session.user.id);
    let items = await cartServices.getCart();

    // 2. generate the line items
    let lineItems = [];
    let meta = [];
    for (let item of items) {
        const lineItem = {
            'name': item.related('product').get('name'),
            'amount': item.related('product').get('cost'), // in cents!
            'quantity': item.get('quantity'),
            'currency': 'SGD'
        }
        // include image
        if (item.related('product').get('image_url')) {
            lineItem['images'] = [ item.related('product').get('image_url')]
        }
        lineItems.push(lineItem);
        meta.push({
            'product_id': item.get('product_id'),
            'quantity': item.get('quantity')
        })
    }

    // 3. send the line items to Stripe and get a stripe payment id
    let metaData = JSON.stringify(meta);
    const payment = {
        payment_method_types: ['card'],
        line_items: lineItems,
        success_url: process.env.STRIPE_SUCCESS_URL + "?sessionId={CHECKOUT_SESSION_ID}",
        cancel_url: process.env.STRIPE_CANCELLED_URL,
        metadata:{
            'orders': metaData
        }
    }

    // 4. register the payment
    let stripeSession = await stripe.checkout.sessions.create(payment);

    // 5. send payment id to a hbs file
    res.render('checkout/checkout',{
        'sessionId': stripeSession.id,
        'publishableKey': process.env.STRIPE_PUBLISHABLE_KEY
    })
})

router.get('/success', function(req,res){
    res.render('checkout/success')
})

router.get('/cancelled', function(req,res){
    res.render('checkout/cancelled')
})

// this is the webhook route
// stripe will send a POST request to this route when a
// payment is completed
router.post('/process_payment', express.raw({
    'type':'application/json'
}), function(req,res){
    let payload = req.body;
    let endpointSecret = process.env.STRIPE_ENDPOINT_SECRET;
    let sigHeader = req.headers["stripe-signature"];
    let event;
    try {
        event = stripe.webhooks.constructEvent(payload, sigHeader, endpointSecret);
    } catch(e) {
        res.send({
            "error": e.message
        })
    }

    if (event.type === 'checkout.session.completed') {
        let stripeSession = event.data.object;
    }
    res.send({
        'recieved': true
    })
})

module.exports = router;