(function() {
  angular.module('cardsAgainstApp')
    .constant('EVENTS', {
      socket: {
        player_join: 'player joined',
        player_left: 'player left',
        player_info: 'player info',
        register_player: 'register player',
        new_game: 'new game',
        game_ready: 'game ready',
        join_game: 'join game',
        make_judge: 'make judge'
      }
    });
})();
