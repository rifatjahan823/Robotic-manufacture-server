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
      const orderCollection = client.db("robotic").collection("order");
      const userCollection = client.db("robotic").collection("user");



/******verify JWT********/
function verifyJWT(req,res,next){
  const authHeader =req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message:'authorization'})
  }
  const token =authHeader.split(' ')[1];
  // verify a token symmetric
jwt.verify(token,process.env.ACCESS_TOKEN_SECRET, function(err, decoded) {
  if(err){
    return res.status(403).send({message:'Forbiden access'})
  }
  req.decoded=decoded;
  next();
});
}

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
  
/******get user booking information sent backend********/
app.post('/order',async(req,res)=>{
  const order = req.body;
  const result = await  orderCollection.insertOne(order );
  res.send(result)
})

/******show per user order by email********/
app.get('/order',verifyJWT,async(req,res)=>{
  const userEmail = req.query.userEmail;
  const decodedEmail = req.decoded.email;
  if(userEmail===decodedEmail){
    const query ={userEmail:userEmail};
    const order =await orderCollection.find(query).toArray();
    return res.send(order)
  }else{
    return res.status(403).send({message:'forbiden'})
  }

})
/******delete order by email********/
app.delete('/order/:email',async(req,res)=>{
  const email = req.params.email;
  const query = {email:email}
  const result = await orderCollection.deleteOne(query);
  return res.send(result);
})

/******update user********/

app.put('/user/:email',async(req,res)=>{
  const email = req.params.email;
  const user = req.body;
  const filter = {email:email};
  const options = {upsert:true};
  const updateDoc = {
    $set:user,
  };
  const result = await userCollection.updateOne(filter, updateDoc, options);
  const token=jwt.sign({email:email},process.env.ACCESS_TOKEN_SECRET);
  res.send({result,token:token});
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