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
    username: {type: String, required: true},
    name: String,
    password: String,
    gender: String,
    age: Number ,
    ridesBooked: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Bookings' }]
  });
  
  const bookingSchema = new mongoose.Schema({
    to: String,
    from: String,
    mode: String,
    date: Date,
    time: String
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
mongoose.connect('mongodb+srv://ishitagrawal0207:lpdNBhlHhN8cuoER@cluster0.hg0xkl5.mongodb.net/Carpool-app');

// Routes
app.post('/user/signup', (req, res) => {
    const { username } = req.body;
    function callback(user) {
      if (user) {
        res.status(403).json({ message: 'User already exists' });
      } else {
        const obj = new User(req.body);
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

app.post('/user/createBooking', authenticateJwt, async (req, res) => {
  const booking = new Bookings(req.body);
  await booking.save();
  res.json({ message: 'Booking created successfully', bookingId: booking.id });
});

app.put('/user/bookings/:bookingId', authenticateJwt, async (req, res) => {
  const booking = await Bookings.findByIdAndUpdate(req.params.bookingId, req.body, {new: true});
  if(booking) {
    res.json({ message : "Booking updated successfully"});
  }
  else {
    res.status(404).json({ message: "Booking not found "});
  }
});

app.get('/user/getBookings', authenticateJwt, async(req, res) => {
  const courses = await Bookings.find({});
  res.json({courses});
});

app.delete('/user/bookings/:bookingId', authenticateJwt, async(req, res) => {
  const id = req.params.bookingId;
  const bookingIndex = await Bookings.findById(id);
  if(bookingIndex) {
    await Bookings.deleteOne(bookingIndex);
    res.json({ message: "Booking deleted"});
  }
  else {
    res.status(403).json({message: "Booking not found"});
  }
});

app.post('/user/bookRide/:bookingId', authenticateJwt, async(req, res) => {
  const ride = await Bookings.findById(req.params.bookingId);
  if(ride) {
    const user = await User.findOne({username: req.user.username});
    if(user) {
      user.ridesBooked.push(ride);
      await user.save();
      res.json({message: 'Ride booked successfully'});
    }
    else {
      res.status(403).json({message: "User not found"});
    }
  }
  else {
    res.status(404).json({message: "Booking not found"});
  }
});

app.get('/user/getBookedRides', authenticateJwt, async(req, res) =>{
  const user = await User.findOne({ username: req.user.username }).populate('ridesBooked');
  if(user) {
    res.json({ridesBooked: user.ridesBooked || []});
  }
  else {
    res.status(403).json({message: "User not found"});
  }
});

app.get('/user/searchRide/:to/:from', authenticateJwt, async (req, res) => {
  try {
    const to = req.params.to;
    const from = req.params.from;

    const rides = await Bookings.find({ to, from });

    if (rides.length > 0) {
      res.json({ rides });
    } else {
      res.status(404).json({ message: "No rides found for the specified locations." });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "An error occurred while searching for rides." });
  }
});


app.listen(3000, () => console.log('Server running on port 3000'));