require ('dotenv/config');
const express = require('express');
const app = express();
const fs = require('fs')
const https = require('https')
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const schedule = require('node-schedule');
const rateLimit = require('function-rate-limit');
const TO_NUMBER = process.env.TO_NUMBER
const NEXMO_NUMBER = process.env.NEXMO_NUMBER
const NEXMO_API_KEY = process.env.NEXMO_API_KEY
const NEXMO_API_SECRET = process.env.NEXMO_API_SECRET
const NEXMO_APPLICATION_ID = process.env.NEXMO_APPLICATION_ID
const NEXMO_APPLICATION_PRIVATE_KEY_PATH = process.env.NEXMO_APPLICATION_PRIVATE_KEY_PATH
const Nexmo = require('nexmo');
const nexmo = new Nexmo({
  apiKey: NEXMO_API_KEY,
  apiSecret: NEXMO_API_SECRET,
  applicationId: NEXMO_APPLICATION_ID,
  privateKey: NEXMO_APPLICATION_PRIVATE_KEY_PATH
});
let openWindow = false;
let teamMeet = false;
let yCount = 0;
let rInt = 1;

let participants = ['17322075515', '14703040264'];

//App will use body-parser on all incoming requests
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }))

//Make app listen on desired port
app.listen(3000);

//Adding HTTPS
https.createServer({
  key: fs.readFileSync('server.key'),
  cert: fs.readFileSync('server.cert')
}, app)
.listen(3000, function () {
  console.log('Example app listening on port 3000! Go to https://dhtestbed.net:3000/socialapp/')
})


//Connect to DB and use configured DB and Collection from .env file
mongoose.connect(process.env.DB_CONNECTION, { useNewUrlParser: true, useUnifiedTopology: true }, () =>
        console.log("Connected to MongoDB! -- Using eventsdb - change in .env file")
);

//List Account Balance
nexmo.account.checkBalance((err, result) => {
    console.log("Your Account Balance is " + `${result.value.toFixed(2)} EUR`);
});


//Host static site
app.use('/socialapp', express.static(__dirname + '/public'));

//toggle open Window
function toggleWindow() {
  openWindow = !openWindow
}

//toggle meet
function toggleMeet() {
  teamMeet = !teamMeet
}

//getWindow
function getWindow(){
  return openWindow;
}

//getMeet
function getMeet(){
  return teamMeet
}

//Open Room
function openRoom(){
  toggleMeet();
  sendRoomLink();
}

///Process SMS Replies
function onSMS(req, res) {
  let key = req.body.keyword

  if (key === "YES") {
    yCount++;
  }

  if (yCount >= 1 && getWindow()) {
    openRoom();
    yCount = 0;
  }
  
  
  res.status(200).end();
  }
  

//Timer needs work

/*
function startTimer() {
  var rTime = new Date();
  rTime.setMinutes(rTime.getMinutes() + rInt); // timestamp
  rTime = new Date(rTime); // Date object
  function myClock() {
    let cTime = new Date();
       if (cTime >= rTime)
         clearInterval(this);
         toggleWindow(); //close window
         console.log("Window Closed");
       }

 setInterval(myClock, 1000);
}
*/

// New Timer
function newTimer() {
  let msTime = rInt * 600000

  function startTimeFunc(){
    toggleWindow(); //close window
    console.log("Window Closed");

  }

setTimeout(startTimeFunc, msTime);

}

//Create Window
function createWindow(){
  toggleWindow(); // sets window to open (true)
  sendSMS(participants, "Do you want to meet?"); // sends messages
  //startTimer();
  newTimer();
 };
 


//Send SMS Messages
function sendSMS(participants, message){
  let text = message;
  
  participants.forEach(participant =>{
      nexmo.message.sendSms(NEXMO_NUMBER, participant, text, {
        type: "unicode"
      }, (err, responseData) => {
        if (err) {
          console.log(err);
        } else {
          if (responseData.messages[0]['status'] === "0") {
            console.log("Message sent successfully.");
          } else {
            console.log(`Message failed with error: ${responseData.messages[0]['error-text']}`);
          }
        }
      });
    });
  };

//Send Room Link 
function sendRoomLink(){
  let text = "https://dhtestbed.net:3000/socialapp/";
  sendSMS(participants, text);
};

//Webhook to receive inbound messages
app.post('/onehackmessages', onSMS);

createWindow();

