const express = require('express');
require('dotenv').config();
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');


const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });


const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;



const startServer = async () => {
    try {
        app.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });
    }
    catch(error) {
        console.error('Error starting server:', error);
        process.exit(1);
    }
}

startServer();

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
        const query = await pool.query(`SELECT * FROM users WHERE user_id='${id}';`)
        const users = query.rows;
        if (users.length === 0) {
            response.status(404).send('User not found');
        }
        else {
            response.status(200).send(users[0])
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
        const {username, email, password} = request.body;
        const hashed_password = await bcrypt.hash(password, 10);
        const jwt_token = jwt.sign({username, email, hashed_password: hashed_password}, process.env.JWT_SECRET);
        response.cookie('jwt_token', jwt_token);
        const query = await pool.query(`INSERT INTO users(username, email, password, jwt_token, total_orders, delivered_orders, orders_in_progress, rejected_orders) VALUES ('${username}', '${email}', '${hashed_password}', '${jwt_token}', 0, 0, 0, 0);`)
        response.json({message: `User Created Successfully`, token: jwt_token})
    }
    catch (error) {
        response.status(500).json({message: error.message})
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
        const query = await pool.query(`SELECT * FROM orders WHERE order_id='${order_id}'`)
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
      const {
        user_id,
  
        pickup_address,
        pickup_pincode,
        pickup_landmark,
        pickup_date_time,
        user_phone_number,
  
        receiver_address,
        receiver_pincode,
        receiver_landmark,
        receiver_phone_number,
  
        item_name,
        item_weight,
        item_condition,
  
        delivery_agent_name,
        delivery_agent_phone_number,
  
        delivery_status
      } = request.body;
  
      //  Basic validation
      if (!user_id || !pickup_address || !pickup_date_time || !receiver_address) {
        return response.status(400).send("Required fields missing");
      }
  
      const query = `
        INSERT INTO orders (
          user_id,
          pickup_address,
          pickup_pincode,
          pickup_landmark,
          pickup_date_time,
          user_phone_number,
  
          receiver_address,
          receiver_pincode,
          receiver_landmark,
          receiver_phone_number,
  
          item_name,
          item_weight,
          item_condition,
  
          delivery_agent_name,
          delivery_agent_phone_number,
  
          delivery_status
        )
        VALUES (
          '${user_id}',
          '${pickup_address}',
          '${pickup_pincode}',
          '${pickup_landmark}',
          '${pickup_date_time}',
          '${user_phone_number}',
  
          '${receiver_address}',
          '${receiver_pincode}',
          '${receiver_landmark}',
          '${receiver_phone_number}',
  
          '${item_name}',
          ${item_weight},
          '${item_condition}',
  
          '${delivery_agent_name}',
          '${delivery_agent_phone_number}',
  
          'Collected by delivery agent'
        )
        RETURNING *;
      `;
  
      const result = await pool.query(query);
  
      response.status(201).json({
        message: "Order Added Successfully",
        order: result.rows[0]
      });
  
    } catch (error) {
      response.status(500).send(`Server Error: ${error.message}`);
    }
  });
// API 8 PUT Update the order details in the orders table
app.put('/orders/:order_id', async (request, response) => {
    try {
        const {order_id} = request.params
        const {user_id, 
            pickup_address, 
            pickup_pincode, 
            pickup_landmark, 
            pickup_date_time, 
            user_phone_number, 
            receiver_address, 
            receiver_pincode, 
            receiver_landmark, 
            receiver_phone_number, 
            item_name, 
            item_weight, 
            item_condition, 
            delivery_agent_name, 
            delivery_agent_phone_number,
            delivery_status
        } = request.body
        const user = await pool.query(`SELECT * FROM orders WHERE order_id='${order_id}';`)
        if (user.rows.length === 0){
            response.status(400).send(`User Not Found in the DataBase`)
        }
        else {
            let fields = [];
            if (user_id!==undefined) {
                fields.push(`user_id='${user_id}'`)
            }
            if (pickup_address!==undefined) {
                fields.push(`pickup_address='${pickup_address}'`)
            }
            if (pickup_pincode!==undefined) {
                fields.push(`pickup_pincode='${pickup_pincode}'`)
            }
            if (pickup_landmark!==undefined) {
                fields.push(`pickup_landmark='${pickup_landmark}'`)
            }
            if (pickup_date_time!==undefined) {
                fields.push(`pickup_date_time='${pickup_date_time}'`)
            }
            if (user_phone_number!==undefined) {
                fields.push(`user_phone_number='${user_phone_number}'`)
            }
            if (receiver_address!==undefined) {
                fields.push(`receiver_address='${receiver_address}'`)
            }
            if (receiver_pincode!==undefined) {
                fields.push(`receiver_pincode='${receiver_pincode}'`)
            }
            if (receiver_landmark!==undefined) {
                fields.push(`receiver_landmark='${receiver_landmark}'`)
            }
            if (receiver_phone_number!==undefined) {
                fields.push(`receiver_phone_number='${receiver_phone_number}'`)
            }
            if (item_name!==undefined) {
                fields.push(`item_name='${item_name}'`)
            }
            if (item_weight!==undefined) {
                fields.push(`item_weight='${item_weight}'`)
            }
            if (item_condition!==undefined) {
                fields.push(`item_condition='${item_condition}'`)
            }
            if (delivery_agent_name!==undefined) {
                fields.push(`delivery_agent_name='${delivery_agent_name}'`)
            }
            if (delivery_agent_phone_number!==undefined) {
                fields.push(`delivery_agent_phone_number='${delivery_agent_phone_number}'`)
            }
            if (delivery_status!==undefined) {
                fields.push(`delivery_status='${delivery_status}'`)
            }
            if (fields.length === 0) {
                response.status(400).send(`Please provide at least one field to update`)
                return;
            }
            const query = await pool.query(`UPDATE orders SET ${fields.join(',')} WHERE order_id='${order_id}';`)
            response.status(200).json({message: `Order Details Updated Successfully`})
            }
    }
    catch(error) {
        response.status(500).json({message: error.message})
    }
})

// API 9 POST User login verification
app.post('/login', async (request, response) => {
    try {
        const {username, password} = request.body
        const user = await pool.query(`SELECT * FROM users WHERE user_name='${username}';`)
        if (user.rows.length === 0) {
            response.status(404).json({message: `User Not Found`})
        }
        else {
            const is_password_correct = await bcrypt.compare(password, user.rows[0].password)
            if (is_password_correct) {
                const jwt_token = await pool.query(`SELECT jwt_token FROM users WHERE user_name='${username}';`)
                response.cookie('jwt_token', jwt_token.rows[0].jwt_token)
                response.status(200).json({message: `Login Successful`})
            }
            else {
                response.status(401).json({message: `Invalid Password`})
                }
            }
        }
        catch(error) {
            response.status(500).json({message: error.message})
        }
    })

    // API 10 POST User Registration
    app.post('/register', async (request, response) => {
        try {
            const {username, email, password} = request.body
            const hashed_password = await bcrypt.hash(password, 10)
            const check_user_exist = await pool.query(`SELECT * FROM users WHERE user_name='${username}';`)
            const check_email_exist = await pool.query(`SELECT * FROM users WHERE email='${email}';`)
            if (check_user_exist.rows.length > 0) {
                return response.status(400).json({message: `User Already Exists`})
            }
            else if (check_email_exist.rows.length > 0) {
                return response.status(400).json({message: `Email Already Exists`})
            }
            else {
                const jwt_token = jwt.sign({username, email, hashed_password: hashed_password}, process.env.JWT_SECRET)
                response.cookie('jwt_token', jwt_token)
                const query = await pool.query(`INSERT INTO users(user_name, email, password, jwt_token, total_orders, orders_delivered, orders_in_progress, orders_rejected) VALUES ('${username}', '${email}', '${hashed_password}', '${jwt_token}', 0, 0, 0, 0);`)
                return response.json({message: `User Registered Successfully`, token: jwt_token})
            } 
        }
        catch(error) {
            response.status(500).json({message: error.message})
        }
    })

module.exports = { app, pool, runCommand };

