const express = require('express');
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
      rejectUnauthorized: false,
    },
  });

async function runCommand() {
  const client = await pool.connect();
  const data = await client.query("${COMMAND}");
  await client.release();
  return data;
}

const cors = require('cors');
const app = express();
app.use(express.json());
app.use(cors());

const PORT = process.env.PORT || 3000;

// Avoid starting the server when this module is imported elsewhere.
if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  server.on('error', (err) => {
    if (err && err.code === 'EADDRINUSE') {
      console.error(`Port ${PORT} is already in use. Stop other server instances and retry.`);
      return;
    }
    console.error(err);
  });
}



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
        const result = await pool.query(`SELECT name FROM users WHERE user_id='${user_id}'`)
        if (result.rows.length === 0) {
            response.status(404).send(`User Not Found`)
        }
        else {
            const old_name = result.rows[0].name
            if (name === old_name) {
                response.status(404).send(`New Name Should be different From the old name`)
            }
            else {
                const query = pool.query(`UPDATE users SET name='${name}' WHERE user_id='${user_id}';`)
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

module.exports = { app, pool, runCommand };

