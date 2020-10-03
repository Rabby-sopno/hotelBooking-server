const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
//dotenv
require("dotenv").config();

const port = process.env.SERVER_PORT;

const app = express();
app.use(cors());
app.use(bodyParser.json());

//firebase
const admin = require("firebase-admin");
const serviceAccount = require("./configs/burj-al-arab-75307-firebase-adminsdk-ojxhs-b11fc94358.json");
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: process.env.FIRE_DB_URL,
});

//mongo db
const password = "arabianHorse79";
const MongoClient = require("mongodb").MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.d4pds.mongodb.net/burj-al-arab?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect((err) => {
  const bookings = client.db("burjAlArab").collection("bookings");

  //here our apis with mongo db
  app.post("/addUser", (req, res) => {
    const newBooking = req.body;
    bookings.insertOne(newBooking).then((result) => {
      res.send(result.insertedCount > 0);
    });
  });

  //bookings list
  app.get("/bookings", (req, res) => {
    const bearer = req.headers.authorization;
    if (bearer && bearer.startsWith("Bearer ")) {
      const idToken = bearer.split(" ")[1];

      //firebase verify id token
      admin
        .auth()
        .verifyIdToken(idToken)
        .then(function (decodedToken) {
          const decodedEmail = decodedToken.email;
          const queryEmail = req.query.email;

          //cheking decodedeEmail and queryEmail
          if (decodedEmail === queryEmail) {
            bookings.find({ email: queryEmail }).toArray((error, documents) => {
              res.status(200).send(documents);
            });
          } else {
            res.status(401).send("Unauthorized user");
          }
          //end checking email
        })
        .catch(function (error) {
          // Handle error
        }); //end firebase verify idToken
    } else {
      res.status(401).send("Unauthorized User");
    } //end bearer check
  }); //end booking list
}); //mongodb client connection nd

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port);
