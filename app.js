const { use } = require('bcrypt/promises')
const express = require('express')
const {Pool} = require('pg')
const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'postgres',
    password: 'Dinesh123@',
    port: 3001,
})
const app = express()
app.use(express.json())

app.listen(3000, () => {
    console.log("Server is running on port 3000")
})



// API 1 GET get the list of all users
app.get('/users', async (request, response) => {
    try { 
        const query = await pool.query(`SELECT * FROM users;`);
        const users = query.rows;
        response.status(200).send(users);
    }
    catch(error) {
        response.status(500).send(`Server Error: ${error.message}`);
        console.log(error.message);
        process.exit(1);
    }
})

// API 2 GET get the specific user from the users table using user_id
app.get('/users/:id', async (request, response) => {
    try {
        const {id} = request.params;
        const query = await pool.query(`SELECT * FROM users WHERE user_id=${id};`)
        const users = query.rows;
        if (users.length === 0) {
            response.status(404).send('User not found');
        }
        else {
            response.status(200).send(users)
        }
    }
    catch(error) {
        response.status(500).send(`Server Error: ${error.message}`);
        console.log(error.message);
        process.exit(1);
    }
})

// API 3 POST Create new user in the users table
app.post('/users', async (request, response) => {
    try {
        const {name} = request.body;
        const query = await pool.query(`INSERT INTO users(name, total_orders, delivered_orders, orders_in_progress) VALUES ('${name}', 0, 0, 0);`)
        response.send(`User Created Successfully`)
    }
    catch (error) {
        response.status(500).send(`Server Error: ${error.message}`)
        process.exit(1)
    }
})

// API 4 PUT update the user details in the users table
app.put('/users/:user_id', async (request, response) => {
    try {
        const {user_id} = request.params
        const {name} = request.body
        const result = await pool.query(`SELECT name FROM users WHERE user_id=${user_id}`)
        if (result.rows.length === 0) {
            response.status(404).send(`User Not Found`)
        }
        else {
            const old_name = result.rows[0].name
            if (name === old_name) {
                response.status(404      ).send(`New Name Should be different From the old name`)
            }
            else {
                const query = pool.query(`UPDATE users SET name='${name}' WHERE user_id=${user_id};`)
                response.status(200).send(`User Details Updated Successfully`)
            }  
        }
        
    }
    catch(error) {
        response.status(500).send(`Server Error: ${error.message}`)
        process.exit(1)
    }
})

// API 5 GET Returns all the orders from the orders table
app.get('/orders', async (request, response) => {
    try {
        const query = await pool.query(`SELECT * FROM orders;`);
        const orders = query.rows
        response.status(200).send(orders)
    }
    catch(error) {
        response.status(500).send(`Server Error: ${error.message}`)
    }
})

// API 6 GET Returns a specific order from the orders table using order_id
app.get('/orders/:order_id', async (request, response) => {
    try {
        const {order_id} = request.params
        const query = await pool.query(`SELECT * FROM orders WHERE order_id=${order_id}`)
        const orders = query.rows
        if (orders.length === 0){
            response.status(404).send(`Order with the order ID ${order_id} not found in the database`)
        }
        else{
            response.status(200).send(orders)
        }
    }
    catch(error) {
        response.status(500).send(`Server Error: ${error.message}`)
        process.exit(1)
    }
})

// API 7 POST Create new order in the orders table
app.post('/orders', async (request, response) => {
    try {
        const {user_id, product_id, delivery_status, payment_status} = request.body
        if (user_id === undefined || product_id === undefined || delivery_status === undefined || payment_status === undefined) {
            response.status(400).send(`Please check user_id, product_id, delivery_status and payment_status fields are not empty`)
        }
        else {
            const query = await pool.query(`INSERT INTO orders (user_id, product_id, delivery_status, payment_status) VALUES (${user_id}, ${product_id}, '${delivery_status}', '${payment_status}');`)
            response.status(201).send(`Order Added Successfully`)
        }
    }
    catch(error) {
        response.status(500).send(`Server Error : ${error.message}`)
        process.exit(1)
    }
})

// API 8 Update the order details in the orders table
app.put('/orders/:order_id', async (request, response) => {
    try {
        const {order_id} = request.params
        const {user_id, product_id, delivery_status, payment_status} = request.body
        const user = await pool.query(`SELECT * FROM orders WHERE order_id=${order_id};`)
        if (user.rows.length === 0){
            response.status(400).send(`User Not Found in the DataBase`)
        }
        else {
            let fields = [];
            if (user_id!==undefined) {
                fields.push(`user_id=${user_id}`)
            }
            if (product_id!==undefined) {
                fields.push(`product_id=${product_id}`)
            }
            if (delivery_status!==undefined) {
                fields.push(`delivery_status='${delivery_status}'`)
            }
            if (payment_status!==undefined) {
                fields.push(`payment_status='${payment_status}'`)
            }
            const query = await pool.query(`UPDATE orders SET ${fields.join(',')} WHERE order_id=${order_id};`)
            response.status(200).send('Order Details Updated Successfully')
            }
    }
    catch(error) {
        response.status(500).send(`Server Error: ${error.message}`)
    }
})

module.exports = { app, pool };

