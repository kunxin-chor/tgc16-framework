// require('knex') returns a config function
// which we call immedaitely with an object
// as the first argument
const knex = require('knex')({
    client: process.env.DB_DRIVER,  // which db tech are we using
    connection:{
        user:process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database:process.env.DB_DATABASE,
        host: process.env.DB_HOST,
        ssl:{
            rejectUnauthorized: false
        }
    }
})

const bookshelf = require('bookshelf')(knex);

module.exports = bookshelf;