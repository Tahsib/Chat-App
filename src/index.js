const express = require('express');
const app = express()
const PORT = process.env.PORT || 3000

const Filter = require('bad-words')
const http = require('http');
const path = require('path');
const socket = require('socket.io')

const {generateMessage, generateLocation} = require('./utils/messages')
const {addUser, getUser, removeUser, getUsersInRoom} = require('./utils/users')

const server = http.createServer(app)
const io = socket(server)

const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath))

let count = 0

io.on('connection',(socket)=>{
    console.log('Socket connected!')

    socket.on('join',({username,room}, callback)=>{

        const { error, user } = addUser({id: socket.id, username, room})

        if(error){
            return callback(error)
        }

        socket.join(room)
        socket.emit('message',generateMessage('Admin',`Welcome ${user.username}!`))
        socket.broadcast.to(room).emit('message',generateMessage('Admin',`${username} has joined!`))
        io.to(user.room).emit('roomData',{
            room: user.room,
            users: getUsersInRoom(user.room)
        })
        callback()
    
    })
    socket.on('sendMessage',(message,callback)=>{

        const user = getUser(socket.id)
        const filter = new Filter()
        if(filter.isProfane(message)){
            return callback('Profanity is not allowed')
        }

        io.to(user.room).emit('message',generateMessage(user.username,message))
        callback()
    })

    socket.on('disconnect',()=>{
        const user = removeUser(socket.id)
        if(user){
            io.to(user.room).emit('message',generateMessage('Admin',`${user.username} has left!`))
            io.to(user.room).emit('roomData',{
                room: user.room,
                users: getUsersInRoom(user.room)
            })
        }
        
        
    })

    socket.on('sendLocation',(loc,callback)=>{
        const user = getUser(socket.id)
        io.to(user.room).emit('locationMessage',generateLocation(user.username,`https://google.com/maps?q=${loc.lat},${loc.long}`))
        callback()
    })
})

server.listen(PORT,()=>{
    console.log('Server listening to port',PORT);    
})



