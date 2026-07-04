require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;
const uri = process.env.MONGODB_URI || 'mongodb+srv://shopeverse:TgYb3ZH3kSb00dc9@cluster0.deppkoh.mongodb.net/?appName=Cluster0';

let client;
let productsCollection;
let usersCollection;
let ordersCollection;

async function connectDB() {
  if (client) return client;

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();

    const db = client.db('shopverse');
    productsCollection = db.collection('allProdect');
    usersCollection = db.collection('users');
    ordersCollection = db.collection('orders');

    console.log('MongoDB Connected');
    return client;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

async function getProductsCollection() {
  if (!productsCollection) {
    await connectDB();
  }
  return productsCollection;
}

function sendError(res, status, message) {
  res.status(status).json({ success: false, message });
}

app.get('/', (req, res) => {
  res.json({ message: 'Server Running' });
});

app.get('/products', async (req, res) => {
  try {
    const collection = await getProductsCollection();
    const result = await collection.find({}).toArray();
    res.send(result)
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const collection = await getProductsCollection();
    const result = await collection.find({}).toArray();
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/products/:id', async (req, res) => {
  try {
    const collection = await getProductsCollection();
    const result = await collection.findOne({
      _id: new ObjectId(req.params.id),
    });

    if (!result) return sendError(res, 404, 'Product not found');
    res.json({ success: true, data: result });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.post('/products', async (req, res) => {
  try {
    const collection = await getProductsCollection();
    const result = await collection.insertOne(req.body);
    res.status(201).json({ success: true, data: { _id: result.insertedId, ...req.body } });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.put('/products/:id', async (req, res) => {
  try {
    const collection = await getProductsCollection();
    const result = await collection.updateOne(
      { _id: new ObjectId(req.params.id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) return sendError(res, 404, 'Product not found');
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.delete('/products/:id', async (req, res) => {
  try {
    const collection = await getProductsCollection();
    const result = await collection.deleteOne({
      _id: new ObjectId(req.params.id),
    });

    if (result.deletedCount === 0) return sendError(res, 404, 'Product not found');
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

connectDB()
  .then(() => {
    app.listen(port, () => {
      console.log(`Server Running On Port ${port}`);
    });
  })
  .catch((error) => {
    console.error('Unable to start server:', error.message);
    process.exit(1);
  });