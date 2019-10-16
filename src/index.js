const path = require('path')
const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const Filter = require('bad-words')
const { generateMessage, generateLocationMessage } = require('./utils/messages')
const{addUser, removeUser, getUser, getUsersInRoom} = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)

const port = process.env.PORT || 3000
const publicDirectoryPath = path.join(__dirname,'../public')

app.use(express.static(publicDirectoryPath))

// let count = 0

// io.on('connection',(socket) =>{
//     console.log('New Websocket Connection')

//     socket.emit('countUpdated', count)

//     socket.on('increment', () =>{
//         count++
//         // socket.emit('countUpdated', count)
//         io.emit('countUpdated', count)
//     })
// })

var welcomeMessage = 'Welcome!'

io.on('connection', (socket) =>{
    console.log('New websocket connection!')

    socket.on('join',({username, room}, callback)=>{
        const {error, user} = addUser({id:socket.id, username, room})
        if(error){
            return callback(error)
        }
        const newUserMessage = user.username+' has joined!'
        const sysUsername = 'Admin'

        socket.join(user.room)
        socket.emit('message',generateMessage(sysUsername,welcomeMessage))
        socket.broadcast.to(user.room).emit('message',generateMessage(sysUsername,newUserMessage))
        io.to(user.room).emit('roomData',{
            room:user.room,
            users:getUsersInRoom(user.room)
        })
        callback()
    })

    socket.on('sendMessage',(sendMesage, callback) =>{
        const user = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(sendMesage)){
            return callback('Profanity is not allowed!')
        }

        io.to(user.room).emit('message',generateMessage(user.username,sendMesage))
        callback()
    })

 
    socket.on('sendLocation',(coords, callback) =>{
        const user = getUser(socket.id)
        // const location = 'Location: '+coords.latitude+ ', ' +coords.longitude
        const location = 'https://google.com/maps?q='+coords.latitude+ ',' +coords.longitude
    
        // io.emit('message',location)
        io.to(user.room).emit('locationMessage',generateLocationMessage(user.username,location))
        callback()
    })

    socket.on('disconnect', () =>{
        const user = removeUser(socket.id)
        const sysUsername = 'Admin'
        if(user){
            disconnectMessage = 'A '+user.username+' has left!'
            io.to(user.room).emit('message',generateMessage(sysUsername,disconnectMessage))
            io.to(user.room).emit('roomData',{
                room:user.room,
                users:getUsersInRoom(user.room)
            })
        }
    })
})

server.listen(port, () =>{
    console.log('Server is up on port '+ port)
})