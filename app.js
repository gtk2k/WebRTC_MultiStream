var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static('public'));

app.get('/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function (socket) {
  console.log('a user connected');
});

http.listen(9000, function () {
  console.log('listening on *:9000');
});


io.on('connection', function (socket) {
  socket.on('disconnect', function () {
    socket.broadcast.to(socket.roomName).send('leave remotePeer');
    delete socket.roomName;
  });

  socket.on('join room', function (roomName) {
    if (/^[A-Fa-f0-9]{8}(?:-[A-Fa-f0-9]{4}){3}-[A-Fa-f0-9]{12}$/.test(roomName)) {
      socket.join(roomName);
      socket.roomName = roomName;
      socket.send('{"roomName": "' + roomName + '"}');
      var roomMemberCount = Object.keys(io.nsps['/'].adapter.rooms[roomName]).length;
      if (roomMemberCount === 2) {
        process.nextTick(function () {
          io.sockets.in(roomName).send('ready');
        });
      } else if (roomMemberCount > 2) {
        socket.send('over');
      }
    } else {
      socket.send('roomName error');
      return;
    }
  });

  socket.on('message', function (message) {
    if (socket.roomName) {
      socket.broadcast.to(socket.roomName).send(message);
    }
  });
});
