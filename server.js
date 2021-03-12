'use strict';

const express = require('express');
require('dotenv').config();
// const pg = require('pg');
// const methodOverride = require('method-override');



const cors = require('cors');
const superagent = require('superagent');
// const client = new pg.Client(process.env.DATABASE_URL);


const PORT = process.env.PORT || 3030;
const server = express();
server.use(cors());
server.set('view engine', 'ejs');

server.use(express.static('./public'));
server.use(express.urlencoded({extended:true}));

server.get('/test',(req,res)=>{
    console.log('hello')

})

server.get('/',(req,res)=>{
    res.render('./pages/index')
})

server.get('/searches/new',(req,res) =>{
    res.render('searches/new')
})

server.post('/searches',(req,res) =>{
    let searchInput = req.body.search;
    let url;
    if (req.body.searchValue === 'title'){
        url = `https://www.googleapis.com/books/v1/volumes?q=${searchInput}+intitle`;

    } else{
        url = `https://www.googleapis.com/books/v1/volumes?q=${searchInput}+inauthor`;

    }
    superagent.get(url)
    .then(result =>{
        let booksArray = result.body.items.map((item) =>{
            return new Book(item)

        })
        res.render('searches/show', {books:booksArray})
    }).catch(()=>{
        errorHandler('Error in getting data from BooksAPI');
    })

}) 


function errorHandler(errors) {
    server.use('*',(req,res)=>{
        res.status(500).send(errors);
    })
}

server.listen(PORT, () => {
    console.log(`Listening to PORT ${PORT}`);
})


function Book(data){
    if (data.volumeInfo.imageLinks && data.volumeInfo.imageLinks.thumbnail) {
        this.image_url = data.volumeInfo.imageLinks.thumbnail
    } else {
        this.image_url = "https://i.imgur.com/J5LVHEL.jpg";
    }    this.title = (data.volumeInfo.title) ? data.volumeInfo.title : `Title unavilable`;
    this.author = (Array.isArray(data.volumeInfo.authors)) ? data.volumeInfo.authors.join(', ') : `Unknown Author`;
    this.description = (data.volumeInfo.description) ? data.volumeInfo.description : `description unavilable`;
    this.isbn = (data.volumeInfo.industryIdentifiers) ? data.volumeInfo.industryIdentifiers[0].identifier :  "No ISBN for this book!!";


}