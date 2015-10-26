(function() {
  angular.module('cardsAgainstApp')
    .constant('EVENTS', {
      socket: {
        player_join: 'player joined',
        player_left: 'player left',
        register_player: 'register player',
        new_game: 'new game',
        game_start: 'game start',
        game_data: 'game data',
        player_data: 'player data',
        choose_card: 'choose card',
        choose_winner: 'choose winner'
      }
    });
})();
