const express = require('express');
const router = express.Router();

const productDataLayer = require('../../dal/products');
const {
    createProductForm
} = require('../../forms');
const {
    Product
} = require('../../models')

router.get('/', async function (req, res) {
    res.send(await productDataLayer.getAllProducts());
})

router.post('/', async function (req, res) {
    try {
        const allCategories = await productDataLayer.getAllCategories();
        const allTags = await productDataLayer.getAllTags();
        const productForm = createProductForm(allCategories, allTags);

        productForm.handle(req, {
            'success': async (form) => {
                let {
                    tags,
                    ...productData
                } = form.data;
                const product = new Product(productData);
                await product.save();

                if (tags) {
                    await product.tags().attach(tags.split(","));
                }
                res.send(product.toJSON());

            },
            'error': async (form) => {
                // manually extact out the errors from the caolan
                // form and send it back as JSON
                let errors = {};
                for (let key in form.fields) {
                    // check if that particular field has error
                    if (form.fields[key].error) {
                        errors[key] = form.fields[key].error;
                    }
                }
                res.status(400);
                res.send(errors);
            }
        })
    } catch (e) {
        console.log(e);
        res.status(500);
        res.send({
            'error': e
        });
    }
})

module.exports = router;