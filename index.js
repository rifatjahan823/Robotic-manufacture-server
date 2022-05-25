const express = require('express');
require('dotenv').config();
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const stripe = require("stripe")(process.env.PAYMENT_SECRET_KEY);
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
      const reviewCollection = client.db("robotic").collection("review");
      const paymentCollection = client.db("robotic").collection("payment");


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
// /******verifyAddmin ********/
 const verifyAdmin=async(req,res,next)=>{
   const requerster = req.decoded.email;
   const requersterAccount = await userCollection.findOne({email:requerster});
   if(requersterAccount.role==='admin'){
 next();
   }else{
     res.status(403).send({message:"you are nont admin"})
   }
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
  
/******get userorder information sent backend********/
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
app.delete("/removeOrder/:Id",verifyJWT,async(req,res)=>{
  const Id = req.params.Id
  const query = {_id:ObjectId(Id)};
  const result = await orderCollection.deleteOne(query);
  res.send(result)
})
/******order details by id per user********/
app.get('/orderId/:id',verifyJWT,async(req,res)=>{
  const id= req.params.id;
  const query={_id:ObjectId(id)};
  const order = await orderCollection.findOne(query);
  res.send(order)
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

//ADMIN ROLL
app.put('/user/admin/:email',verifyJWT,verifyAdmin,async(req,res)=>{
  const email = req.params.email;
    const filter = {email:email};
    const updateDoc = {
      $set:{role:"admin"},
    };
    const result = await userCollection.updateOne(filter, updateDoc);
    res.send(result);
 
})
 app.get('/admin/:email',async(req,res)=>{
   const email = req.params.email;
   const user = await userCollection.findOne({email:email});
   const isAdmin =user.role==='admin';
   res.send({admin:isAdmin})
 })
/******get all user********/
app.get('/user',verifyJWT,async(req,res)=>{
  const user= await userCollection.find().toArray();
  res.send(user)
})

/******add product********/
app.post('/addProduct',verifyJWT,verifyAdmin,async(req,res)=>{
  const doctor = req.body;
  const result = await productCollection.insertOne(doctor);
  return res.send(result);
})

app.get('/addProduct',verifyJWT,verifyAdmin,async(req,res)=>{
  const doctor = await productCollection.find().toArray();
  res.send(doctor)
})

  app.delete("/addProduct/:Id",verifyJWT,verifyAdmin,async(req,res)=>{
    const Id = req.params.Id
    const query = {_id:ObjectId(Id)};
    const result = await productCollection.deleteOne(query);
    res.send(result)
})
 /******get user review********/
app.post('/review',async(req,res)=>{
  const review = req.body;
  const result = await  reviewCollection.insertOne( review );
  res.send(result)
})
app.get('/review',async(req,res)=>{
  const review = await reviewCollection.find().toArray();
  res.send(review)
})

/******payment get way to send payment/CheckOutForm.js********/
app.post('/create-payment-intent', verifyJWT, async(req, res) =>{
  const order = req.body;
  console.log(order)
  const price = order.price;
  const amount = price*100;
  const paymentIntent = await stripe.paymentIntents.create({
    amount : amount,
    currency: 'usd',
    payment_method_types:['card']
  });
  res.send({clientSecret: paymentIntent.client_secret})
});


/******store payment********/
app.patch('/orderId/:id',verifyJWT,async(req,res)=>{
  const id= req.params.id;
  const payment = req.body;
  const query={_id:ObjectId(id)};
  const updatedDoc = {
    $set:{
      paid:true,
      transactionId:payment.transactionId,
    }
  } 
  const updatedBooking = await orderCollection.updateOne(query,updatedDoc);
  const result = await paymentCollection.insertOne(payment );
  res.send(updatedDoc)
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