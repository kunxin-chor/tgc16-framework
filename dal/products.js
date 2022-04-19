
const { Product, Tag, Category} = require('../models');

async function getProductById(productId) {
    // eqv of
    // select * from products where id = ${productId}
    const product = await Product.where({
        'id': productId
    }).fetch({
        'require': true, // will cause an error if not found
        'withRelated': ['category', 'tags'] // load in the associated category and tags
    })
    return product;

}

async function getAllProducts() {
    return await Product.fetchAll();
}

async function getAllCategories() {
    const allCategories = await Category.fetchAll().map(category => {
        return [category.get('id'), category.get('name')]
    });
    return allCategories;
}

async function getAllTags() {
    const allTags = await Tag.fetchAll().map(tag => {
        return [tag.get('id'), tag.get('name')]
    })
    return allTags;
}

module.exports = { getAllCategories, getAllTags, getProductById, getAllProducts}