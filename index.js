'use strict'

// Wit.AI
let Wit = require('node-wit').Wit
let log = require('node-wit').log
const UserID = 1923707044410542;
const WitToken = 'RRAEVMQZPZNVJ6P3X4XJMOT6SZTH3ONL'

// This will contain all user sessions.
// Each session has an entry:
// sessionId -> {fbid: facebookUserId, context: sessionState}
const sessions = {};
var responseRobot=null;
var flag=0
var restartFlag = 0
const findOrCreateSession = (fbid) => {
  //responseRobot=require('./response/conversation')
  let sessionId;
  // Let's see if we already have a session for the user fbid
  Object.keys(sessions).forEach(k => {
    if (sessions[k].fbid === fbid) {
      // Yep, got it!
      sessionId = k;
    }
  });
  if (!sessionId) {
    // No session found for user fbid, let's create a new one
    responseRobot=require('./response/conversation')
    flag=1
    sessionId = new Date().toISOString();
    sessions[sessionId] = {fbid: fbid, context: {}};
    // Send the first message to user
    sendTextMessage(fbid, "Hi. This is WaitriX. What can I do for you today?")
    console.log("sender: " + fbid)
  }
  if(sessionId && flag === 0 && restartFlag === 1)
  {
    flag = 1
    // Send the first message to user
    sendTextMessage(fbid, "Hi. This is WaitriX. What can I do for you today?")
    console.log("sender: " + fbid)
  }
  return sessionId;
};

// Setting up our bot
const wit = new Wit({
  accessToken: WitToken,
  logger: new log.Logger(log.INFO)
})


//var responseRobot=require('./response/conversation')
const express = require('express')
const bodyParser = require('body-parser')
const request = require('request')
const app = express()
const pagetoken = "EAAEwFfWoqkEBAGU8mSmVgIiJWuQgg5PDiJW2vhcWaqsI3p7nCeZCBwthZAqaZCzLQhsseIZBiSupbvoO25nueS3X8hGX2vxar8yXSwjfgOAUtctJuklzntWopsx2UZA3bIRsPhwUYjcNojvV0izZBCU8kOZAPeoZAXsVRSFZCKZCYBOQZDZD"
var mysql = require('mysql');
// Process application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({extended: false}))

// Process application/json
app.use(bodyParser.json())

// Sets server port and logs message on success
app.listen(process.env.PORT || 3000, () => console.log('Webhook is listening'));


// function connectSql(UID,Time,Content){
//   con.connect(function(err) {
//   if (err){
//     console.log(err);
//   }else{
//     console.log("Connected!")
//     var sql="INSERT INTO Conversations (UID,Time, Content) VALUE ("+UID+","+Time+",'"+Content+"')";
//     con.query(sql,function(err,result){
//       if(err){
//         throw err;
//       }
//       console.log("record inserted");
//     });
//   }
// });
// }

var prices={
  "Hamburger": 2.1,
  "Cheeseburger": 2.4,
  "Double-Double Burger": 3.45,
  "French Fries": 1.6,
  "Hamburger Combo": 5.35,
  "Cheeseburger Combo": 5.65,
  "Double-Double Burger Combo": 6.7,
  "Small Soft Drink": 1.5,
  "Medium Soft Drink": 1.65,
  "Large Soft Drink": 1.85,
  "Extra Large Soft Drink": 2.05,
  "Shakes": 2.15,
  "Milk": 0.99,
  "Coffee": 1.35
}
var indexs={
  "Hamburger": 0,
  "Cheeseburger": 1,
  "Double-Double Burger": 2,
  "French Fries": 3,
  "Hamburger Combo": 4,
  "Cheeseburger Combo": 5,
  "Double-Double Burger Combo": 6,
  "Small Soft Drink": 7,
  "Medium Soft Drink": 8,
  "Large Soft Drink": 9,
  "Extra Large Soft Drink": 10,
  "Shakes": 11,
  "Milk": 12,
  "Coffee": 13
}

function connectSql(UID,Time,Content){
  if(UID != UserID) {
    return;
  }
  pool.getConnection(function(err,con) {
  if (err){
    console.log(err);
  }else{
    console.log("In connectSql(): Connected!")
    console.log("INSERT INTO Conversations (UID,Time, Content) VALUE ("+UID+","+Time+",'"+Content+"')");
    var sql="INSERT INTO Conversations (UID,Time, Content) VALUE ("+UID+","+Time+",'"+Content+"')";
    con.query(sql,function(err,result){
      con.release();
      if(err){
        throw err;
      }
      console.log("In connectSql(): Record inserted");
    });
  }
});
}

function insertOrder(UID,Time,Quantity,FoodType,Price,Options){
  pool.getConnection(function(err,con) {
  if (err){
    console.log(err);
  }else{
    console.log("in insertOrder(): Connected!")
    var sql="INSERT INTO Orders (UID,Time, Quantity,FoodType,Price,Options) VALUE ("+UID+","+Time+","+Quantity+","+FoodType+","+Price+",'"+Options+"')";
    console.log(sql);
    con.query(sql,function(err,result){
      con.release();
      if(err){
        throw err;
      }
      console.log("in insertOrder(): Record inserted");
    });
  }
});
}


// Adds support for GET requests to our webhook
app.get('/webhook', (req, res) => {

  // Your verify token. Should be a random string.

  let VERIFY_TOKEN = "yuliangzz"
  // Parse the query params
  let mode = req.query['hub.mode'];
  let token = req.query['hub.verify_token'];
  let challenge = req.query['hub.challenge'];
    
  // Checks if a token and mode is in the query string of the request
  if (mode && token) {
  
    // Checks the mode and token sent is correct
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      
      // Responds with the challenge token from the request
      console.log('WEBHOOK_VERIFIED');
      res.status(200).send(challenge);
    
    } else {
      // Responds with '403 Forbidden' if verify tokens do not match
      res.sendStatus(403);      
    }
  }
});

// Creates the endpoint for our webhook 
app.post('/webhook', (req, res) => {  
  let body = req.body;
  let sqlsender=null;
  let sqltimestamp=null;
  let sqltext=null;

  // Checks this is an event from a page subscription
  if (body.object === 'page') {
    let messaging_events = req.body.entry[0].messaging
    for (let i = 0; i < messaging_events.length; i++) {
      let event = req.body.entry[0].messaging[i]
      let sender = event.sender.id
      if(sender != UserID) {
        continue;
      }
      sqltimestamp=event.timestamp;
      sqltimestamp=sqltimestamp/1000
      sqlsender=sender;
      if (event.message && event.message.text) {
        let text = event.message.text;
        sqltext=text.substring(0, 200);
//         try{
//           connectSql(sender,sqltimestamp,sqltext);
//         }catch(e){
//           console.log(e);
//         }
        
        // We could retrieve the user's current session, or create one if it doesn't exist
        // This is useful if we want our bot to figure out the conversation history
        const sessionId = findOrCreateSession(sender);
        if(flag==1){
          flag=0;
          restartFlag = 0
        }else{

          wit.message(text).then(({entities}) => {
          // You can customize your response to these entities
            console.log(entities)
        /*console.log("entities to add text")
        entities["Text"] = text
        console.log(entities)*/
        
            // For now, let's reply with another automatic message
            if(entities.info_request!=null){
              var value = entities.info_request[0].value
              console.log("get " + value);
              if(value=="menu"){
                let file="./Menu.png";
                //sendMenu(sender,file);
                sendImageMessage(sender,file);
              }
              else if (value == "opening") {
                var openHour = '';
                queryInfo("open hour", function(result) {
                  openHour = result;
                  var closeHour = '';
                  queryInfo("close hour", function(result) {
                    closeHour = result;
                    let now = new Date();
                    let openDate = new Date(openHour + " " + now.getFullYear() + "/" + now.getMonth() + "/" + now.getDate());
                    let closeDate = new Date(closeHour + " " + now.getFullYear() + "/" + now.getMonth() + "/" + now.getDate());
                    if (now > closeDate && now < openDate) {
                      sendTextMessage(sender, "Sorry, the restaurant is closed.");
                    }
                    else {
                      sendTextMessage(sender, "Restaurant is opening!");
                    }
                  });
                });
              }
              else if (value == "speciality") {
                queryRecommendation(function(result) {
                  var recommendations = result;
                  var message = "Today's speciality(s): \n";
                  for (i = 0; i < recommendations.length; i++) {
                    message += recommendations[i]['Name'];
                    if (i != recommendations.length - 1) {
                      message += '\n';
                    }
                  }
                  sendTextMessage(sender, message);
                });
              }
              else if (value == "info") {
                var location = 'Location: ';
                queryInfo("location", function(result) {
                  location += result;
                  var contactNumber = 'Contact number: ';
                  queryInfo("contact number", function(result) {
                    contactNumber += result;
                    var businessHour = 'Business hour: ';
                    queryInfo("business hour", function(result) {
                      businessHour += result;
                      var info = location + '\n' + contactNumber + '\n' + businessHour;
                      sendTextMessage(sender, info);
                    });
                  });
                }); 
              }
              else {
                queryInfo(value, function(result) {
                  let info = result;
                  console.log(info);
                  sendTextMessage(sender, info);
                }); 
              }
              return;
            }
            else if (entities.give_recommendation != null) {
              queryRecommendation(function(result) {
                var recommendations = result;
                var message = "Today's speciality(s): \n";
                for (i = 0; i < recommendations.length; i++) {
                  message += recommendations[i]['Name'];
                  if (i != recommendations.length - 1) {
                    message += '\n';
                  }
                }
                sendTextMessage(sender, message);
              });
              return;
            }
            else if (entities.restart != null) {
              console.log("Restart");
              responseRobot = responseRobot.renew();
              flag = 0;
              restartFlag = 1;
              sendTextMessage(sender, "Server has restarted. Please greet the bot to start over.");
              return
            }

            let responseTuple = responseRobot.converse(entities, text)
            let responseText = responseTuple.text
	    console.log(responseRobot._error_code)
	    console.log(responseRobot.stage)
            sendTextMessage(sender, responseText)
	    if (responseRobot._error_code == 2011)
	    {
	      sendImageMessage(sender, "./Menu.png");
	      responseRobot._error_code = 0
	      return;
	    }
            if(responseRobot.stage == 999){
              restartFlag = 1
              let resultTuple = responseRobot._order.whatIsNotFilled()
              if((resultTuple.index == 0) && (resultTuple.missing_id == 0)){
                let e=responseRobot._order.dishlist
                for(i=0;i<e.length;i++){
                  if(e[i].type=='Burger'){
                      let burgerName=e[i].food_type;
		      console.log("burgerName: " + burgerName)
                      insertOrder(sender,sqltimestamp,1,indexs[burgerName],prices[burgerName],'');
                  }else if(e[i].type=='Fries'){
                    insertOrder(sender,sqltimestamp,1,3,1.6,'');
                  }else if(e[i].type=='Drink'){
                    if(e[i].size==0){
                      insertOrder(sender,sqltimestamp,1,7,1.5,'');
                    }else if(e[i].size==1){
                      insertOrder(sender,sqltimestamp,1,8,1.65,'');
                    }else if(e[i].size==2){
                      insertOrder(sender,sqltimestamp,1,9,1.85,'');
                    }else{
                      insertOrder(sender,sqltimestamp,1,10,2.05,'');
                    }
                  }else if(e[i].type=='UnsizeableDrink'){
                    if(e[i].drink_type=='Shakes'){
                      insertOrder(sender,sqltimestamp,1,11,2.15,'');
                    }else if(e[i].drink_type=='Milk'){
                      insertOrder(sender,sqltimestamp,1,12,0.99,'');
                    }else if(e[i].drink_type=='Coffee'){
                      insertOrder(sender,sqltimestamp,1,13,1.35,'');
                    }
                  }
                }
              }
              console.log("In main: renew robot")
              responseRobot=responseRobot.renew()
            }
          })
          .catch((err) => {
            console.error('In main: Oops! Got an error from Wit: ',
                          err.stack || err);
          })
        }
      }
    }
    // body.entry.forEach(function(entry) {

    //   // Gets the message. entry.messaging is an array, but 
    //   // will only ever contain one message, so we get index 0
    //   let webhook_event = entry.messaging[0];
    //   console.log(webhook_event);
    // });
    // console.log("senderid:"+sqlsender);
    // console.log("timestamp:"+sqltimestamp);
    // console.log("content:"+sqltext);
    // try{
    //   connectSql(sqlsender,sqltimestamp,sqltext);
    // }catch(e){
    //   console.log(e);
    // }
    res.sendStatus(200);
  } else {
  //   // Returns a '404 Not Found' if event is not from a page subscription
     res.sendStatus(404);
  }

});


function sendTextMessage(sender,text) {
    if(sender != UserID) {
      return;
    }
    let messageData = { text:text }
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:pagetoken},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message: messageData,
        }
    }, function(error, response, body) {
        if (error) {
            console.log('In sendTextMessage(): Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('In sendTextMessage(): Error: ', response.body.error)
        }
    })
}
function sendMenu(sender,file) {
    if(sender != UserID) {
      return;
    }
    let fs = require('fs');
    var readStream = fs.createReadStream(file);
    request({
        url: 'https://graph.facebook.com/v2.6/me/messages',
        qs: {access_token:pagetoken},
        method: 'POST',
        json: {
            recipient: {id:sender},
            message : {
              attachment : {
                type : "image/png",
                payload :{}
              }
            },
          filedata:"@./Menu.png"
        }
    }, function(error, response, body) {
        if (error) {
            console.log('In sendTextMessage(): Error sending messages: ', error)
        } else if (response.body.error) {
            console.log('In sendTextMessage(): Error: ', response.body.error)
        }
    })
}
function sendImageMessage(sender, file_loc){
    let fs = require('fs');
    var readStream = fs.createReadStream(file_loc);
    var messageData = {
        recipient : {
            id : sender
        },
        message : {
            attachment : {
                type : "image",
                payload :{}
            }
        },
        filedata:readStream
    }
    callSendAPI(messageData);
}

function callSendAPI(messageData) {
    var endpoint = "https://graph.facebook.com/v2.6/me/messages?access_token=" + pagetoken;
    var r = request.post(endpoint, function(err, httpResponse, body) {
        if (err) {return console.error("upload failed >> \n", err)};
        console.log("upload successfull >> \n", body); //facebook always return 'ok' message, so you need to read error in 'body.error' if any
    });
    var form = r.form();
    form.append('recipient', JSON.stringify(messageData.recipient));
    form.append('message', JSON.stringify(messageData.message));
    form.append('filedata', messageData.filedata); //no need to stringify!
}

function queryInfo(key, callback) {
  pool.getConnection(function(err,con) {
    if (err){
      console.log(err);
    }else{
      console.log("in queryInfo(): Connected!")
      var sql="SELECT Value FROM Info WHERE Item = '" + key + "'";
      con.query(sql,function(err,result, fields) {
        con.release();
        if(err){
          throw err;
        }
        console.log("in queryInfo(): Info queried");
        return callback(result[0]["Value"])
      });
    }
  });
}

function queryRecommendation(callback) {
  pool.getConnection(function(err,con) {
    if (err){
      console.log(err);
    }else{
      console.log("in queryRecommendation(): Connected!")
      var sql="SELECT Name FROM Menu, Recommendations WHERE Menu.FoodType = Recommendations.FoodType";
      con.query(sql,function(err,result, fields) {
        con.release();
        if(err){
          throw err;
        }
        console.log("in queryRecommendation(): Recommendations queried");
        return callback(result);
      });
    }
  });
}


// var con = mysql.createConnection({
//  host: "chatbot.cgwtow8tax0g.us-east-2.rds.amazonaws.com",
//  user: "lyldayu",
//  password: "ChatBot9",
//  port: "3306",
//  database: "ChatBot"
// });

var pool = mysql.createPool({
 connectLimit: 10,
 host: "chatbot.cgwtow8tax0g.us-east-2.rds.amazonaws.com",
 user: "lyldayu",
 password: "ChatBot9",
 port: "3306",
 database: "ChatBot"
});

// var count=3;
// con.connect(function(err) {
//   if (err)
//   {
//     console.log("ERROR in connection to DB")
//   }
//   else
//   {
//     console.log("Connected!")
//     var sql="CREATE TABLE customers"+count+" (name VARCHAR(255), address VARCHAR(255))";
//     count++;
//     con.query(sql,function(err,result){
//       if(err)throw err;
//       console.log("Table created");
//     })
//   }

// });


//APIs for Fronet End

// -------------------------------------- Front Page Support API Starts Here ---------------------------------//

//TO List: support css file, index.js file. Maunally add the CSS file and JS file
// Warning: should use static method come with Exoress, good for now
app.use(express.static(__dirname + 'page/style'));

app.get('/main', (req, res) => {
	res.sendFile(__dirname + '/page/index.html');
});

app.get('/index.js', (req, res) => {
    res.sendFile(__dirname + '/page/index.js');
});

app.get('/style/accordian.pack.js', (req, res) => {
    res.sendFile(__dirname + '/page/style/accordian.pack.js');
});

app.get('/style/style.css', (req, res) => {
    res.sendFile(__dirname + '/page/style/style.css');
});

app.get('/WatrixMain.png', (req, res) => {
    res.sendFile(__dirname + '/page/WatrixMain.png');
});

app.get('/Team.png', (req, res) => {
    res.sendFile(__dirname + '/page/Team.png');
});


app.get('/test', (req, res) => {
    //res.send("test successed!");
    pool.getConnection((err, con) => {
        if (err)
            res.send("Database connection Error!");
        else {
            var sql = "SELECT * FROM Orders";
            con.query(sql, function (error, rows, fields) {
        con.release();
                if (error)
                    res.send("Something went wrong!!!");
                else {
                    res.json(rows);
                }
            })
        }
    })
});

// +++++++++++++++++++++++++ REAL APIs Starts Here +++++++++++++++++++++++++ //

//Get updated order
app.get('/orders', (req, res) => {
    res.send("This linke should give user the last orders");
});

//Get weekly report
app.get('/orderHistrory', (req, res) => {
    res.send("This should display order history within a week");
});

app.get('/Report', (req, res) => {
    res.send("TEST 7");
});
