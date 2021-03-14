'use strict';

const express = require('express');
require('dotenv').config();
const pg = require('pg');
// const methodOverride = require('method-override');



const cors = require('cors');
const superagent = require('superagent');
const client = new pg.Client(process.env.DATABASE_URL);


const PORT = process.env.PORT || 3030;
const server = express();
server.use(cors());
server.set('view engine', 'ejs');

server.use(express.static('./public'));
server.use(express.urlencoded({extended:true}));

server.get('/hello', (req,res) => {
    res.render('./pages/index');
})




function errorHandler(errors) {
    server.use('*',(req,res)=>{
        res.status(500).send(errors);
    })
}

server.listen(PORT, () => {
    console.log(`Listening to PORT ${PORT}`);
})


