import express from 'express';
import bodyParser from 'body-parser'
const app = express();
const port = 3000;
import dbConn from './database.js';
import routes from './routes/routes.js';
import cookieParser from 'cookie-parser';
import dotenv from 'dotenv';
dotenv.config();


app.use(cookieParser());
app.set('view engine', 'ejs');
app.set('views', 'views');
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use(bodyParser.json());

app.use('/', routes);


dbConn.connect(function(err) {
  if(err) throw err;
  {
    console.log('hey db is connected!');
    app.listen(port, () => {
      console.log(`Example app listening on port ${port}!`);
    });
  }
});
