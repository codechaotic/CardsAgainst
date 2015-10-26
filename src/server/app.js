var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var cookieSession = require('cookie-session');
var guid = require('guid');
var bodyParser = require('body-parser');
var path = require('path');
var _ = require('lodash');

var Game = require('./game');

var EVENTS = require('./EVENTS');

server.listen(8082);

// --------------------------
// Custom Middleware

// This is inserted into the request handler for a socket handler.
// Before socket.io event handler, we pass the request to cookie-session
// to parse out the cookies.
var socketSessionMiddleware = function(socket, next) {
  var req = socket.handshake,
    res = {};

  thisCookieSession(req, res, function() {
    next();
  });
};

// --------------------------
// Global In-memory game state
var players = [];
var host;

// --------------------------
// Middleware

// Session/cookies
app.set('trust proxy', 1); // trust first proxy

var thisCookieSession = cookieSession({
  name: 'GuestSession',
  keys: ['Zhpb&4^-~[K$w3>&', '[{xwMM:4xSV:As`e']
});

app.use(thisCookieSession);

// Request Parsing
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Serving static resources
app.use(express.static(path.join(__dirname, "assets")));

// --------------------------
// Routes
app.get('/', function (req, res) {
  if(req.session.isNew) {
    var userGuid = guid.raw();
    req.session.userId = userGuid;
  }

  res.sendFile(path.join(__dirname, '/assets/index.html'));
});

// --------------------------
// Socket.IO
io.use(socketSessionMiddleware);

io.on('connection', function (socket) {
  console.log("Anonymous Connect");

  var player;

  // User has picked a username
  socket.on(EVENTS.socket.register_player, function(playerName) {
    //setup the new player
    player = {
      id: socket.handshake.session.userId,
      name: playerName,
      score: 0,
      active: true,
      socket: socket
    };

    if(players.length === 0) {
      host = player;
      player.isHost = true;
    }
    else player.isHost = false;

    players.push(player);

    console.log("Player Registered (%s, %s)\t\t[Now %s Players]",
      player.name,
      player.isHost?'host':'not host',
      players.length
    );

    // Update everyone with the new user
    io.emit(EVENTS.socket.player_join, players.map(playerPublicData));

    // Send the player his/her information
    socket.emit(EVENTS.socket.player_data, playerPrivateData(player));

    // Host Listeners
    if(player === host) {
      socket.on(EVENTS.socket.new_game, function(gameSettings) {

        var game = new Game(gameSettings, activePlayers(), host);

        // Broadcast game states
        
        // NOTE this probably belongs inside of game.js and Game probably
        // shouldn't be an event emitter.

        game.on(EVENTS.game.game_start, function() {
          io.emit(EVENTS.socket.game_start);
        });

        game.on(EVENTS.game.game_data, function(data) {
          io.emit(EVENTS.socket.game_data, data);
        });

        game.on(EVENTS.game.player_data, function(player) {
          player.socket.emit(EVENTS.socket.player_data, playerPrivateData(player));
        });

        game.on(EVENTS.game.timer_set, function(expires) {
          io.emit(EVENTS.socket.timer_set, expires);
        });

        players.forEach(function(player) {
          player.socket.on(EVENTS.socket.choose_card, function(card) {
            console.log('Player (%s) chose card %s', player.name, card.id);
            game.chooseCard(player,card);
          });
          player.socket.on(EVENTS.socket.choose_winner, function(choice) {
            if(player.isJudge) {
              console.log('Judge %s chose winner %s', player.name, choice.id);
              game.chooseWinner(choice);
            }
          });
        });



        game.start();
      });
    }
  });

  // Handle player disconnect
  socket.on('disconnect', function() {
    if(!player) return;

    _.pull(players, player);

    console.log("Player Left (%s, %s)\t\t[Now %s Players]",
      player.name,
      player.isHost?'host':'not host',
      players.length
    );

    io.emit(EVENTS.socket.player_left, players.map(playerPublicData));
  });

  /**
  * Returns a player's public info
  */
  function playerPublicData(player) {
    return _.pick(player, 'name', 'score');
  }

  function playerPrivateData(player) {
    return _.omit(player,'socket');
  }

  function activePlayers() {
    return _.where(players, { active: true });
  }
});
