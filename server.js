'use strict';

const express = require('express');
require('dotenv').config();
const pg = require('pg');
const methodOverride = require('method-override');



const cors = require('cors');
const superagent = require('superagent');
const client = new pg.Client(process.env.DATABASE_URL);


const PORT = process.env.PORT || 3000;
const server = express();
server.use(cors());
server.set('view engine', 'ejs');

server.use(methodOverride('_method'));


server.use(express.static('./public'));
server.use(express.urlencoded({ extended: true }));


server.delete('/deleteBook/:id',(req,res) =>{
    let id =[req.params.id];
    let SQL = `DELETE FROM books WHERE id=$1;`;
    client.query(SQL,id)
    .then(()=>{
      res.redirect('/');
    })


})

server.put('/books/:id',(req,res) =>{
    let id = req.params.id;
    let { author,title, isbn, image_url, description} = req.body;
    let SQL = `UPDATE books SET author=$1,title=$2,isbn=$3,image_url=$4,description=$5 WHERE id =$6;`;
    let safeValues = [author,title, isbn, image_url, description,id];
    client.query(SQL, safeValues)
    .then(() => {
        res.redirect(`/books/${id}`);
    })


})




server.get('/searches/new', (req, res) => {
    res.render('./searches/new');
})


server.get('/', (req, res) => {
    let SQL = 'SELECT * FROM books';
    client.query(SQL)
    .then(result =>{
        console.log(result.rows)
        res.render('pages/index', { booksList: result.rows, bookCount: result.rowCount });

    })
})

server.get("/books/:id", (req, res) => {
    let id = req.params.id;
    let SQL = `SELECT * FROM books WHERE id=$1;`;
    let values = [id];
    client.query(SQL, values)
        .then((result) => {
            res.render('pages/books/details', { book :result.rows[0]});
        })
        .catch(() => {
            errorHandler('Error in getting Database');
        });
});

server.post('/books', (req, res) => {
   
    let newSQL = `INSERT INTO books (author, title, isbn, image_url, description) VALUES ($1, $2, $3, $4, $5) RETURNING id;`;
    let newValues = [req.body.author, req.body.title, req.body.isbn, req.body.image_url, req.body.description];
  
    return client.query(newSQL, newValues)
      .then(result => {
        res.redirect(`/books/${result.rows[0].id}`);
      })
      .catch(()=>{
                errorHandler('Error in getting data!!');
            })
})

server.post('/searches', (req, res) => {
    let searchInput = req.body.search;
    let key = process.env.GOOGLE_API_KEY;
    let url;
    if (req.body.searchValue === 'title') {
        url = `https://www.googleapis.com/books/v1/volumes?q=${searchInput}+intitle`;
    } else {
        url = `https://www.googleapis.com/books/v1/volumes?q=${searchInput}+inauthor`;
    }
    superagent.get(url)
        .then(result => {
            console.log(result);
            let booksArray = result.body.items.map((item) => {
                return new Book(item);
            })

            res.render('searches/show', { books: booksArray });
        })
        .catch(() => {
            errorHandler('Error in getting data from BooksAPI');
        })

})




server.get('/error', (req, res) => {
    errorHandler('Error!!');
})



function errorHandler(errors) {
    server.use('*', (req, res) => {
        res.status(500).send(errors);
    })
}


function Book(data) {
    if (data.volumeInfo.imageLinks && data.volumeInfo.imageLinks.thumbnail) {
        this.image_url = data.volumeInfo.imageLinks.thumbnail
    } else {
        this.image_url = "https://i.imgur.com/J5LVHEL.jpg";
    }
    this.title = (data.volumeInfo.title) ? data.volumeInfo.title : `Title unavilable`;
    this.author = (Array.isArray(data.volumeInfo.authors)) ? data.volumeInfo.authors.join(', ') : `Unknown Author`;
    this.description = (data.volumeInfo.description) ? data.volumeInfo.description : `description unavilable`;
    if (data.volumeInfo.industryIdentifiers) {
        this.isbn = data.volumeInfo.industryIdentifiers[0].identifier
    } else {
        this.isbn = "No ISBN for this book!!";
    }
}


client.connect()
    .then(() => {
        server.listen(PORT, () => console.log(`Listening on port: ${PORT}`));
    })
