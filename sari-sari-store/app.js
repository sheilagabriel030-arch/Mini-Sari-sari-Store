const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const db = require('./database/connection');
const session = require('express-session');

const app = express();
const PORT = process.env.PORT || 3000;

// =============================================
// MIDDLEWARE CONFIGURATION
// =============================================
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, 'public')));

app.use(session({
    secret: 'sari-sari-store-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false }
}));

app.use((req, res, next) => {
    res.locals.baseUrl = req.protocol + '://' + req.get('host');
    next();
});

// =============================================
// SAMPLE PRODUCT DATA (Fallback if database fails)
// =============================================
const sampleProducts = [
    { id: 1, name: 'Century Tuna', category: 'Canned Goods', price: 45.00, stock_quantity: 43, description: 'Tuna flakes in oil', image_url: '/images/century_tuna.jpg' },
    { id: 2, name: 'Coca-Cola', category: 'Beverages', price: 20.00, stock_quantity: 97, description: 'Original flavor soft drink', image_url: '/images/coke.jpg' },
    { id: 3, name: 'Del Monte Juice', category: 'Beverages', price: 25.00, stock_quantity: 29, description: 'Pineapple orange juice drink', image_url: '/images/del_monte.jpg' },
    { id: 4, name: 'Lucky Me Chicken Noodles', category: 'Noodles', price: 15.00, stock_quantity: 78, description: 'Instant chicken mami noodle soup', image_url: '/images/lucky_me.jpg' },
    { id: 5, name: 'Milo', category: 'Beverages', price: 12.00, stock_quantity: 60, description: 'Chocolate malt energy drink', image_url: '/images/milo.jpg' },
    { id: 6, name: 'Nescafe Classic', category: 'Beverages', price: 8.00, stock_quantity: 75, description: 'Instant coffee classic', image_url: '/images/nescafe.jpg' },
    { id: 7, name: 'Nido Fortified Milk', category: 'Dairy', price: 220.00, stock_quantity: 17, description: 'Fortified milk for little kids 1+', image_url: '/images/nido_milk_powder.jpg' },
    { id: 8, name: 'Lucky Me Pancit Canton', category: 'Noodles', price: 14.00, stock_quantity: 63, description: 'Instant pancit canton kalamansi flavor', image_url: '/images/pancit_canton.jpg' },
    { id: 9, name: 'Oishi Potato Chips', category: 'Snacks', price: 25.00, stock_quantity: 39, description: 'Jumbo plain salted potato chips', image_url: '/images/potato_chip.jpg' },
    { id: 10, name: 'Bear Brand Powdered Milk', category: 'Dairy', price: 85.00, stock_quantity: 24, description: 'Fortified powdered milk drink', image_url: '/images/bear_brand.jpg' },
    { id: 11, name: 'Royal Tru Orange', category: 'Beverages', price: 16.00, stock_quantity: 63, description: 'Orange flavored soft drink', image_url: '/images/orange.jpg' },
    { id: 12, name: 'Mountain Dew', category: 'Beverages', price: 19.00, stock_quantity: 13, description: 'Citrus flavored soda', image_url: '/images/mountain_dew.jpg' },
    { id: 14, name: 'Clover Chips', category: 'Snacks', price: 20.00, stock_quantity: 15, description: 'Cheese flavored chips', image_url: '/images/clover_chips.jpg' },
    { id: 15, name: 'Boy Bawang', category: 'Snacks', price: 12.00, stock_quantity: 17, description: 'Garlic flavored cornick', image_url: '/images/boy_bawang.jpg' },
    { id: 16, name: 'Indomie Mi Goreng', category: 'Noodles', price: 15.00, stock_quantity: 35, description: 'Indonesian style instant noodles', image_url: '/images/mi_goreng.jpg' },
    { id: 17, name: 'Downy Fabric Softener', category: 'Household', price: 45.00, stock_quantity: 20, description: 'April fresh fabric conditioner', image_url: '/images/downy.jpg' },
    { id: 18, name: 'Cream Silk Conditioner', category: 'Personal Care', price: 55.00, stock_quantity: 25, description: 'Hair conditioner treatment', image_url: '/images/creamsilk.jpg' },
    { id: 19, name: 'Ligo Sardines', category: 'Canned Goods', price: 28.00, stock_quantity: 40, description: 'Sardines in oil', image_url: '/images/ligo_sardines.jpg' },
    { id: 20, name: 'Mr. Clean', category: 'Household', price: 18.00, stock_quantity: 24, description: 'All-purpose cleaner', image_url: '/images/mr.clean.jpg' },
    { id: 21, name: 'Silver Swan Soy Sauce', category: 'Condiments', price: 16.00, stock_quantity: 65, description: 'Soy sauce', image_url: '/images/silver_swan.jpg' },
    { id: 22, name: 'Datu Puti Vinegar', category: 'Condiments', price: 15.00, stock_quantity: 70, description: 'Sukang maasim', image_url: '/images/vinegar.jpg' },
    { id: 23, name: 'Lady\'s Choice Mayonnaise', category: 'Condiments', price: 45.00, stock_quantity: 20, description: 'Real mayonnaise', image_url: '/images/ladys_choice.jpg' },
    { id: 24, name: 'Star Margarine', category: 'Condiments', price: 35.00, stock_quantity: 25, description: 'Spreadable margarine', image_url: '/images/star_margarine.jpg' }
];

// =============================================
// HELPER FUNCTIONS
// =============================================
function getOrCreateCart(sessionId) {
    return new Promise((resolve, reject) => {
        const findCartQuery = 'SELECT * FROM carts WHERE session_id = ?';
        db.query(findCartQuery, [sessionId], (err, carts) => {
            if (err) return reject(err);
            
            if (carts.length > 0) {
                resolve(carts[0]);
            } else {
                const createCartQuery = 'INSERT INTO carts (session_id) VALUES (?)';
                db.query(createCartQuery, [sessionId], (err, result) => {
                    if (err) return reject(err);
                    resolve({ id: result.insertId, session_id: sessionId });
                });
            }
        });
    });
}

function handleDatabaseError(err, res, customMessage = 'Database error') {
    console.error(customMessage + ':', err);
    return res.status(500).send(customMessage);
}


// =============================================
// ROUTE HANDLERS
// =============================================

// Homepage Route
app.get('/', (req, res) => {
    // Try to get products from database first, fallback to sample data
    const query = 'SELECT * FROM products ORDER BY created_at DESC LIMIT 8';
    
    db.query(query, (err, results) => {
        if (err) {
            // Use sample data if database fails
            console.log('Using sample products data');
            const featuredProducts = sampleProducts.slice(0, 8);
            res.render('index', { 
                title: 'Mini Sari-Sari Store',
                products: featuredProducts
            });
        } else {
            res.render('index', { 
                title: 'Mini Sari-Sari Store',
                products: results
            });
        }
    });
});

// Product Routes
const productRoutes = {
    // Get all products with pagination
    list: (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 12;
        const offset = (page - 1) * limit;
        
        // Try database first
        const countQuery = 'SELECT COUNT(*) as total FROM products';
        
        db.query(countQuery, (err, countResults) => {
            if (err) {
                // Fallback to sample data
                console.log('Using sample products data');
                const totalProducts = sampleProducts.length;
                const totalPages = Math.ceil(totalProducts / limit);
                const paginatedProducts = sampleProducts.slice(offset, offset + limit);
                
                res.render('products', { 
                    title: 'All Products', 
                    products: paginatedProducts,
                    currentPage: page,
                    totalPages: totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    totalProducts: totalProducts
                });
                return;
            }
            
            const totalProducts = countResults[0].total;
            const totalPages = Math.ceil(totalProducts / limit);
            
            const query = `
                SELECT * FROM products 
                ORDER BY created_at DESC 
                LIMIT ? OFFSET ?
            `;
            
            db.query(query, [limit, offset], (err, results) => {
                if (err) return handleDatabaseError(err, res, 'Error fetching products');
                
                res.render('products', { 
                    title: 'All Products', 
                    products: results,
                    currentPage: page,
                    totalPages: totalPages,
                    hasNextPage: page < totalPages,
                    hasPrevPage: page > 1,
                    totalProducts: totalProducts
                });
            });
        });
    },

    // Add product form
    addForm: (req, res) => {
        res.render('add-product', { title: 'Add New Product' });
    },

    // Create new product
    create: (req, res) => {
        const { name, category, price, stock_quantity, description, image_url } = req.body;
        const query = `
            INSERT INTO products (name, category, price, stock_quantity, description, image_url) 
            VALUES (?, ?, ?, ?, ?, ?)
        `;
        
        db.query(query, [name, category, price, stock_quantity, description, image_url], (err, result) => {
            if (err) return handleDatabaseError(err, res, 'Error adding product');
            res.redirect('/products');
        });
    },

    // Edit product form
    editForm: (req, res) => {
        const productId = req.params.id;
        const query = 'SELECT * FROM products WHERE id = ?';
        
        db.query(query, [productId], (err, results) => {
            if (err) return handleDatabaseError(err, res, 'Error fetching product');
            if (results.length === 0) return res.status(404).send('Product not found');
            
            res.render('edit-product', { 
                title: 'Edit Product', 
                product: results[0] 
            });
        });
    },

    // Update product
    update: (req, res) => {
        const productId = req.params.id;
        const { name, category, price, stock_quantity, description, image_url } = req.body;
        const query = `
            UPDATE products 
            SET name = ?, category = ?, price = ?, stock_quantity = ?, description = ?, image_url = ? 
            WHERE id = ?
        `;
        
        db.query(query, [name, category, price, stock_quantity, description, image_url, productId], (err, result) => {
            if (err) return handleDatabaseError(err, res, 'Error updating product');
            res.redirect('/products');
        });
    },

    // Delete product
    delete: (req, res) => {
        const productId = req.params.id;
        const query = 'DELETE FROM products WHERE id = ?';
        
        db.query(query, [productId], (err, result) => {
            if (err) return handleDatabaseError(err, res, 'Error deleting product');
            res.redirect('/products');
        });
    },

    // API - Get all products
    apiList: (req, res) => {
        const query = 'SELECT * FROM products ORDER BY created_at DESC';
        
        db.query(query, (err, results) => {
            if (err) {
                // Fallback to sample data
                res.json(sampleProducts);
                return;
            }
            res.json(results);
        });
    }
};

// Cart Routes
const cartRoutes = {
    // Add item to cart
    addItem: async (req, res) => {
        try {
            const { product_id, quantity } = req.body;
            const cart = await getOrCreateCart(req.sessionID);

            // Try database first, then sample data
            const productQuery = 'SELECT * FROM products WHERE id = ?';
            db.query(productQuery, [product_id], (err, products) => {
                let product;
                
                if (err || products.length === 0) {
                    // Fallback to sample data
                    product = sampleProducts.find(p => p.id === parseInt(product_id));
                    if (!product) {
                        return res.status(404).json({ error: 'Product not found' });
                    }
                } else {
                    product = products[0];
                }

                if (product.stock_quantity < quantity) {
                    return res.status(400).json({ error: 'Insufficient stock' });
                }

                const checkItemQuery = 'SELECT * FROM cart_items WHERE cart_id = ? AND product_id = ?';
                db.query(checkItemQuery, [cart.id, product_id], (err, existingItems) => {
                    if (err) return res.status(500).json({ error: 'Database error' });

                    if (existingItems.length > 0) {
                        const updateQuery = 'UPDATE cart_items SET quantity = quantity + ? WHERE cart_id = ? AND product_id = ?';
                        db.query(updateQuery, [quantity, cart.id, product_id], (err) => {
                            if (err) return res.status(500).json({ error: 'Database error' });
                            res.json({ success: true, message: 'Product added to cart' });
                        });
                    } else {
                        const insertQuery = 'INSERT INTO cart_items (cart_id, product_id, quantity, price) VALUES (?, ?, ?, ?)';
                        db.query(insertQuery, [cart.id, product_id, quantity, product.price], (err) => {
                            if (err) return res.status(500).json({ error: 'Database error' });
                            res.json({ success: true, message: 'Product added to cart' });
                        });
                    }
                });
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // View cart - FIXED VERSION
    view: async (req, res) => {
        try {
            const cart = await getOrCreateCart(req.sessionID);
            
            const cartItemsQuery = `
                SELECT ci.*, p.name, p.image_url, p.stock_quantity, (ci.quantity * ci.price) as total_price
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.cart_id = ?
            `;
            
            db.query(cartItemsQuery, [cart.id], (err, cartItems) => {
                if (err) {
                    console.error('Error fetching cart items:', err);
                    return res.status(500).send('Database error');
                }
                
                const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                
                res.render('cart', {
                    title: 'Shopping Cart',
                    cartItems: cartItems,
                    total: total
                });
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Server error');
        }
    },

    // Update cart item
    updateItem: async (req, res) => {
        try {
            const { item_id, quantity } = req.body;
            
            if (quantity <= 0) {
                const deleteQuery = 'DELETE FROM cart_items WHERE id = ?';
                db.query(deleteQuery, [item_id], (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.json({ success: true, message: 'Item removed from cart' });
                });
            } else {
                const updateQuery = 'UPDATE cart_items SET quantity = ? WHERE id = ?';
                db.query(updateQuery, [quantity, item_id], (err) => {
                    if (err) return res.status(500).json({ error: 'Database error' });
                    res.json({ success: true, message: 'Cart updated' });
                });
            }
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    },

    // Remove item from cart
    removeItem: async (req, res) => {
        try {
            const { item_id } = req.body;
            const deleteQuery = 'DELETE FROM cart_items WHERE id = ?';
            
            db.query(deleteQuery, [item_id], (err) => {
                if (err) return res.status(500).json({ error: 'Database error' });
                res.json({ success: true, message: 'Item removed from cart' });
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

// Checkout Routes
const checkoutRoutes = {
    // Checkout page
    view: async (req, res) => {
        try {
            const cart = await getOrCreateCart(req.sessionID);
            const cartItemsQuery = `
                SELECT ci.*, p.name, p.image_url, (ci.quantity * ci.price) as total_price
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.cart_id = ?
            `;
            
            db.query(cartItemsQuery, [cart.id], (err, cartItems) => {
                if (err) return handleDatabaseError(err, res, 'Error fetching cart items');
                if (cartItems.length === 0) return res.redirect('/cart');
                
                const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                
                res.render('checkout', {
                    title: 'Checkout',
                    cartItems: cartItems,
                    total: total
                });
            });
        } catch (error) {
            console.error('Error:', error);
            res.status(500).send('Server error');
        }
    },

    

    // Process checkout
    process: async (req, res) => {
        try {
            const { customer_name, customer_phone } = req.body;
            const cart = await getOrCreateCart(req.sessionID);
            
            db.query('START TRANSACTION');
            
            const cartItemsQuery = `
                SELECT ci.*, p.name, p.stock_quantity
                FROM cart_items ci
                JOIN products p ON ci.product_id = p.id
                WHERE ci.cart_id = ?
            `;
            
            db.query(cartItemsQuery, [cart.id], (err, cartItems) => {
                if (err) {
                    db.query('ROLLBACK');
                    return handleDatabaseError(err, res, 'Error fetching cart items');
                }
                
                if (cartItems.length === 0) {
                    db.query('ROLLBACK');
                    return res.status(400).json({ error: 'Cart is empty' });
                }
                
                // Check stock availability
                for (const item of cartItems) {
                    if (item.stock_quantity < item.quantity) {
                        db.query('ROLLBACK');
                        return res.status(400).json({ error: `Insufficient stock for ${item.name}` });
                    }
                }
                
                const total = cartItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);
                const orderNumber = 'ORD-' + Date.now();
                
                const orderQuery = 'INSERT INTO orders (order_number, customer_name, customer_phone, total_amount) VALUES (?, ?, ?, ?)';
                db.query(orderQuery, [orderNumber, customer_name, customer_phone, total], (err, result) => {
                    if (err) {
                        db.query('ROLLBACK');
                        return handleDatabaseError(err, res, 'Error creating order');
                    }
                    
                    const orderId = result.insertId;
                    let processedItems = 0;
                    
                    cartItems.forEach(item => {
                        const orderItemQuery = 'INSERT INTO order_items (order_id, product_id, product_name, quantity, price) VALUES (?, ?, ?, ?, ?)';
                        db.query(orderItemQuery, [orderId, item.product_id, item.name, item.quantity, item.price], (err) => {
                            if (err) {
                                db.query('ROLLBACK');
                                return handleDatabaseError(err, res, 'Error creating order item');
                            }
                            
                            const updateStockQuery = 'UPDATE products SET stock_quantity = stock_quantity - ? WHERE id = ?';
                            db.query(updateStockQuery, [item.quantity, item.product_id], (err) => {
                                if (err) {
                                    db.query('ROLLBACK');
                                    return handleDatabaseError(err, res, 'Error updating stock');
                                }
                                
                                processedItems++;
                                
                                if (processedItems === cartItems.length) {
                                    const clearCartQuery = 'DELETE FROM cart_items WHERE cart_id = ?';
                                    db.query(clearCartQuery, [cart.id], (err) => {
                                        if (err) {
                                            db.query('ROLLBACK');
                                            return handleDatabaseError(err, res, 'Error clearing cart');
                                        }
                                        
                                        db.query('COMMIT');
                                        res.json({ 
                                            success: true, 
                                            message: 'Order placed successfully!',
                                            order_number: orderNumber
                                        });
                                    });
                                }
                            });
                        });
                    });
                });
            });
        } catch (error) {
            db.query('ROLLBACK');
            console.error('Error:', error);
            res.status(500).json({ error: 'Server error' });
        }
    }
};

// Order Routes
const orderRoutes = {
    // Order confirmation
    confirm: (req, res) => {
        const orderNumber = req.params.order_number;
        const orderQuery = `
            SELECT o.*, oi.product_name, oi.quantity, oi.price, (oi.quantity * oi.price) as item_total
            FROM orders o
            JOIN order_items oi ON o.id = oi.order_id
            WHERE o.order_number = ?
        `;
        
        db.query(orderQuery, [orderNumber], (err, results) => {
            if (err) return handleDatabaseError(err, res, 'Error fetching order');
            if (results.length === 0) return res.status(404).send('Order not found');
            
            res.render('order-confirm', {
                title: 'Order Confirmation',
                order: results[0],
                orderItems: results
            });
        });
    }
};

// =============================================
// ROUTE DEFINITIONS
// =============================================

// Product Routes
app.get('/products', productRoutes.list);
app.get('/products/add', productRoutes.addForm);
app.post('/products/add', productRoutes.create);
app.get('/products/edit/:id', productRoutes.editForm);
app.post('/products/edit/:id', productRoutes.update);
app.get('/products/delete/:id', productRoutes.delete);
app.get('/api/products', productRoutes.apiList);

// Cart Routes
app.post('/cart/add', cartRoutes.addItem);
app.get('/cart', cartRoutes.view);
app.post('/cart/update', cartRoutes.updateItem);
app.post('/cart/remove', cartRoutes.removeItem);

// Checkout Routes
app.get('/checkout', checkoutRoutes.view);
app.post('/checkout/process', checkoutRoutes.process);

// Order Routes
app.get('/order/confirm/:order_number', orderRoutes.confirm);

// Simple API for frontend (compatible with your original code)
app.post('/api/orders', checkoutRoutes.process);
app.get('/api/orders/:orderNumber', (req, res) => {
    const orderNumber = req.params.orderNumber;
    const orderQuery = 'SELECT * FROM orders WHERE order_number = ?';
    
    db.query(orderQuery, [orderNumber], (err, results) => {
        if (err || results.length === 0) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }
        res.json({ success: true, order: results[0] });
    });
});

// =============================================
// SERVER START
// =============================================
app.listen(PORT, () => {
    console.log(`🛒 Sari-Sari Store server running on http://localhost:${PORT}`);
   // console.log(`Loaded ${sampleProducts.length} sample products`);
});