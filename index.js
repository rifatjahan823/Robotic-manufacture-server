const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
//use middleware
app.use(cors());
app.use(express.json());



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.mwk4o.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });
async function run() {
    try {
      await client.connect();
      const productCollection = client.db("robotic").collection("products");

// ----------get all product---------
    app.get("/product",async(req,res)=>{
        const query = {};
        const cursor = productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
    })
 
// ----------get oneproduct--------- 
        app.get("/productid/:Id",async(req,res)=>{
            const Id = req.params.Id
            const query = {_id:ObjectId(Id)};
            const getOneProduct = await productCollection.findOne(query);
            res.send(getOneProduct)
        })


    } 
    finally {
    
    }
  }
  run().catch(console.dir);




app.get('/', (req, res) => {
    res.send('Hello World!!')
  })
   
  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })