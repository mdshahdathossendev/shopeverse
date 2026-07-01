require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;
const uri = process.env.MONGODB_URI || 'mongodb+srv://shopeverse:TgYb3ZH3kSb00dc9@cluster0.deppkoh.mongodb.net/?appName=Cluster0';
const dbName = process.env.DB_NAME || 'shopeverse';

let client;
let db;

async function connectToMongo() {
  if (db) return db;

  try {
    client = new MongoClient(uri, {
      serverSelectionTimeoutMS: 5000,
    });

    await client.connect();
    db = client.db(dbName);
    console.log(`Connected to MongoDB database: ${dbName}`);
    return db;
  } catch (error) {
    console.error('MongoDB connection failed:', error.message);
    throw error;
  }
}

async function getCollection(name) {
  const database = await connectToMongo();
  return database.collection(name);
}

function sendError(res, status, message) {
  res.status(status).json({ success: false, message });
}

app.get('/', (req, res) => {
  res.json({ message: 'Shopeverse API is running' });
});

app.get('/api/health', async (req, res) => {
  try {
    await connectToMongo();
    res.json({ success: true, message: 'MongoDB connected', database: dbName });
  } catch (error) {
    sendError(res, 503, 'MongoDB connection failed');
  }
});

app.get('/api/products', async (req, res) => {
  try {
    const collection = await getCollection('products');
    const products = await collection.find({}).toArray();
    res.json({ success: true, data: products });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return sendError(res, 400, 'Invalid product id');

    const collection = await getCollection('products');
    const product = await collection.findOne({ _id: new ObjectId(id) });

    if (!product) return sendError(res, 404, 'Product not found');
    res.json({ success: true, data: product });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const collection = await getCollection('products');
    const result = await collection.insertOne(req.body);
    res.status(201).json({ success: true, data: { _id: result.insertedId, ...req.body } });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return sendError(res, 400, 'Invalid product id');

    const collection = await getCollection('products');
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) return sendError(res, 404, 'Product not found');
    res.json({ success: true, message: 'Product updated' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return sendError(res, 400, 'Invalid product id');

    const collection = await getCollection('products');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return sendError(res, 404, 'Product not found');
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const collection = await getCollection('users');
    const users = await collection.find({}).toArray();
    res.json({ success: true, data: users });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const collection = await getCollection('users');
    const result = await collection.insertOne(req.body);
    res.status(201).json({ success: true, data: { _id: result.insertedId, ...req.body } });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.get('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return sendError(res, 400, 'Invalid user id');

    const collection = await getCollection('users');
    const user = await collection.findOne({ _id: new ObjectId(id) });

    if (!user) return sendError(res, 404, 'User not found');
    res.json({ success: true, data: user });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return sendError(res, 400, 'Invalid user id');

    const collection = await getCollection('users');
    const result = await collection.updateOne(
      { _id: new ObjectId(id) },
      { $set: req.body }
    );

    if (result.matchedCount === 0) return sendError(res, 404, 'User not found');
    res.json({ success: true, message: 'User updated' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const { id } = req.params;
    if (!ObjectId.isValid(id)) return sendError(res, 400, 'Invalid user id');

    const collection = await getCollection('users');
    const result = await collection.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return sendError(res, 404, 'User not found');
    res.json({ success: true, message: 'User deleted' });
  } catch (error) {
    sendError(res, 500, error.message);
  }
});

app.use((req, res) => {
  sendError(res, 404, 'Route not found');
});

connectToMongo().catch(() => {
  console.log('Server is running, but MongoDB connection is unavailable.');
});

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});