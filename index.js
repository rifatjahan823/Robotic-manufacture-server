const express = require('express');
require('dotenv').config();
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken');
const port = process.env.PORT || 5000
//use middleware
app.use(cors());
app.use(express.json());