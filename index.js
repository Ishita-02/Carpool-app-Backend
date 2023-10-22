const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const { env } = require('process');
const app = express();

app.use(express.json());
app.use(cors());
dotenv.config();

// Mongoose schemas
const userSchema = new mongoose.Schema({
    username: {type: String},
    password: String,
    ridesBooked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bookings' }]
  });
  
  const bookingSchema = new mongoose.Schema({
    bookingId: String,
    to: String,
    from: String,
  });
  
  // Mongoose models
  const User = mongoose.model('User', userSchema);
  const Bookings = mongoose.model('Bookings', bookingSchema);
  
  const SECRET = process.env.REACT_APP_SECRET_KEY;

// Authentication
const authenticateJwt = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      jwt.verify(token, SECRET, (err, user) => {
        if (err) {
          return res.sendStatus(403);
        }
        req.user = user;
        next();
      });
    } else {
      res.sendStatus(401);
    }
};

// Connection to MongoDB
mongoose.connect('mongodb+srv://kirattechnologies:iRbi4XRDdM7JMMkl@cluster0.e95bnsi.mongodb.net/Carpool-app');

// Routes
app.post('/user/signup', (req, res) => {
    const { username, password } = req.body;
    function callback(user) {
      if (user) {
        res.status(403).json({ message: 'User already exists' });
      } else {
        const obj = { username: username, password: password };
        const newUser= new User(obj);
        newUser.save();
        const token = jwt.sign({ username, role: 'user' }, SECRET, { expiresIn: '1h' });
        res.json({ message: 'User created successfully', token });
      }
    }      
    User.findOne({ username }).then(callback);
});

app.post('/user/login', async (req, res) => {
    const { username, password } = req.headers;
    const user = await User.findOne({ username, password });
    if(user) {
        const token = jwt.sign({username, role: user}, SECRET, {expiresIn: '1h'});
        res.json({ message: 'Logged in successfully', token});
    }
    else {
        res.status(403).json({ message : 'Invalid username or password'});
    }
});

app.listen(3000, () => console.log('Server running on port 3000'));