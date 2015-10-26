(function() {
  angular.module('cardsAgainstApp')
    .factory('gameSocket', gameSocketFactory)
    .factory('GameService', gameServiceFactory);

  function gameSocketFactory(socketFactory) {
    return socketFactory();
  }

  function gameServiceFactory(gameSocket, $location, EVENTS) {
    var svc = {};

    svc.players = [];

    //default game settings
    svc.settings = {
      gameTime: 60,
      judgeTime: 30,
      winningPoints: 10
    };

    svc.playerData = {};
    svc.gameData = {};

    svc.registerPlayer = function(playerName) {
      gameSocket.emit(EVENTS.socket.register_player, playerName);
    };

    svc.newGame = function() {
      gameSocket.emit(EVENTS.socket.new_game, svc.settings);
    };

    svc.chooseCard = function(card) {
      gameSocket.emit(EVENTS.socket.choose_card, card);
    };

    svc.chooseWinner = function(choice) {
      gameSocket.emit(EVENTS.socket.choose_winner, choice);
    };

    svc.startListeners = function() {
      gameSocket.on(EVENTS.socket.player_join, function(players) {
        angular.copy(players, svc.players);
      });

      gameSocket.on(EVENTS.socket.player_left, function(players) {
        angular.copy(players, svc.players);
      });

      gameSocket.on(EVENTS.socket.game_start, function() {
        console.log('received GAME START');
        $location.url('/game');
      });

      gameSocket.on(EVENTS.socket.game_data, function(data) {
        console.log('received GAME DATA');
        console.log(data);
        angular.copy(data, svc.gameData);
      });

      gameSocket.on(EVENTS.socket.player_data, function(data) {
        console.log('received PLAYER DATA');
        console.log(data);
        angular.copy(data, svc.playerData);
      });
    };

    return svc;
  }
})();
