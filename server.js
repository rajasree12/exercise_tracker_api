const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()


/*---Connecting to the database--*/
const mongoose = require('mongoose')
let uri = 'mongodb+srv://user12:' + process.env.PW + '@cluster.3qe9u.mongodb.net/Exercise?retryWrites=true&w=majority'
mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})


/*---Creating Models to store user data---*/
let exercise = new mongoose.Schema({
  date: String,
  duration: {type: Number, required: true},
  description: {type: String, required: true}  
  
})

let user = new mongoose.Schema({
  username: {type: String, required: true},
  log: [exercise]
})

let User = mongoose.model('User', user)
let Exercise = mongoose.model('Exercise', exercise)


/*---POST for creating users---*/
let bodyParser = require('body-parser')
app.post('/api/users', bodyParser.urlencoded({extended: false}),(request, response) => {
  let newUser = new User({username: request.body.username})
  newUser.save((error, savedUser) => {
    if(!error){
      response.json({username: savedUser.username, _id: savedUser.id})
    }
  })
})

/* Get all Users */
app.get('/api/users', (request, response) => {
  User.find({}, (error, arrayOfUsers) => {
    if(!error){
      response.json(arrayOfUsers)
    }
  })
})

/* Add exercise session */
app.post('/api/users/:_id/exercises', bodyParser.urlencoded({extended: false}), (request, response) => {
  console.log(request.body)
  
  let newExerciseItem = new Exercise({
    date: request.body.date,
    duration: parseInt(request.body.duration),
    description: request.body.description    
  })
  
  if(newExerciseItem.date === ''){
    newExerciseItem.date = new Date().toISOString().substring(0,10)
  }
  
  User.findByIdAndUpdate(
    request.params._id,
    {$push: {log: newExerciseItem}},
    {new: true},
    (error, updatedUser) => {
    if(!error){
      let responseObj = {}
      responseObj['_id'] = updatedUser._id
      responseObj['username'] = updatedUser.username
      responseObj['date'] = new Date(newExerciseItem.date).toDateString()
      responseObj['duration'] = newExerciseItem.duration
      responseObj['description'] = newExerciseItem.description    
      
      response.json(responseObj)
    }
  })
})


/* Retrieve a User's Log */
app.get('/api/users/:_id/logs', 
(request, response) => {  
  User.findById(request.params._id , (error, result) => {
    if(!error){
      let responseObj = result
      
      if(request.query.from || request.query.to){
        
        let fromDate = new Date(0)
        let toDate = new Date()
        
        if(request.query.from){
          fromDate = new Date(request.query.from)
        }
        
        if(request.query.to){
          toDate = new Date(request.query.to)
        }
        
        fromDate = fromDate.getTime()
        toDate = toDate.getTime()
        
        responseObj.log = responseObj.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime()
          
          return sessionDate >= fromDate && sessionDate <= toDate
          
        })
        
      }
      
      if(request.query.limit){
        responseObj.log = responseObj.log.slice(0, request.query.limit)
      }
      
      responseObj = responseObj.toJSON()
      responseObj['count'] = result.log.length
      response.json(responseObj)
    }
  })
  
})

app.post('/api/users/view',
 bodyParser.urlencoded({extended: false}),
(request, response) => { 
  console.log(request.body)
  User.findById(request.body._id , (error, result) => {
    if(!error){
      let responseObj = result
      
      if(request.body.from || request.body.to){
        
        let fromDate = new Date(0)
        let toDate = new Date()
        
        if(request.body.from){
          fromDate = new Date(request.body.from)
        }
        
        if(request.body.to){
          toDate = new Date(request.body.to)
        }
        
        fromDate = fromDate.getTime()
        toDate = toDate.getTime()
        
        responseObj.log = responseObj.log.filter((session) => {
          let sessionDate = new Date(session.date).getTime()
          
          return sessionDate >= fromDate && sessionDate <= toDate
          
        })
        
      }
      
      if(request.body.limit){
        responseObj.log = responseObj.log.slice(0, request.body.limit)
      }
      
      responseObj = responseObj.toJSON()
      responseObj['count'] = result.log.length
      response.json(responseObj)
    }
  })
  
})



