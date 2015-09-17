
Rooms = new Mongo.Collection("rooms");
/* this collection stores all necessary info about game rooms
 * roomNumber --> Integer to identify Rooms
 * tiles      --> Object with a "boxId: sign"-pair for each box on playField
 * players    --> Array of playerIds for players that are in the Room
              --> players[0] = player 1 ("X")  |||  players[1] = player 2 ("O") */
if (Meteor.isClient) {

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.body.helpers({
    "roomJoined": function() {
      // checks if player is in a room
      if (Session.get("roomNumber") !== undefined) {
        return true;
      }
      else {
        return false;
      }
    }
  });

  Template.joinRoom.events({
    "submit form": function (event){

      event.preventDefault();
      var roomNumber = parseInt($('[type="text"]').val());

      if (roomNumber !== "") {
        // only execute when we get some kind of input
        if ( Rooms.findOne({ roomNumber: roomNumber }) ) {
          joinRoom(roomNumber);
        } else {
          createRoom(roomNumber);
        }
      }
    },
    "input form": function(event) {
      // Changes the UI depending on if the Room-ID entered is valid or not
      var roomNumber = parseInt($('[type="text"]').val());
      var submitBtn = $('#action');

      if ( isNaN(roomNumber) ) { // if input isn't a valid Room-ID
        submitBtn.attr('disabled', true);
        submitBtn.addClass('disabled');

      } else {  // input is valid

        if ( submitBtn.attr('disabled') === 'disabled' ) {
          submitBtn.attr('disabled', false);
          submitBtn.removeClass('disabled');
        }

        if ( Rooms.findOne({ roomNumber: roomNumber }) ) {  // if Room-ID exists
          submitBtn.attr("value", "Join Room");
        } else {
          submitBtn.attr("value", "Create Room");      // if Room-ID not yet created
        }
      }
    }
  });

  Template.room.helpers({
    "roomNumber": function() {
      return Session.get("roomNumber");
    },
    "players": function() {
      // gather info about players in current room
      var playerIds = Rooms.findOne({ roomNumber: Session.get("roomNumber") }).players;
      var playerData = [];

      for (var i = 0; i < playerIds.length; i++) {
        playerData.push({ // add an object with data about each player
          username: Meteor.users.findOne( playerIds[i] ).username,
          playerNumber: i+1
        });
      }
      return playerData; // array with objects
    },
    "gameIsOver": function() {
      var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });
      console.log("winner: " + room.winner);
      console.log(room.tiles);
      return room.winner;
    }
  });

  Template.room.events({
    "click #leave": function(event) {
      event.preventDefault();
      leaveRoom();
    }
  });

  Template.currentPlayer.helpers({
    "getCurrentPlayer": function() {
      // return a string with the currentPlayer
      var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });
      var currentPlayer = Meteor.users.findOne(room.players[ room.currentPlayer ]);

      if ( currentPlayer._id === Meteor.userId() ) {
        return "Your turn";
      }
      return currentPlayer.username + "'s turn"
    }
  });

  Template.playField.helpers({
    "sign": function(id) {
      // Return the sign in the current box in playfield
      return Rooms.findOne({ roomNumber: Session.get("roomNumber") }).tiles[id];
    }
  });

  Template.playField.events({
    "click .box": function(event) {
      // handle player moves --> add the active player's sign to the box
      var box = $(event.target);
      var boxId = box.attr("id");
      var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });

      // only let the player who's next in turn modify the board
      if ( room.players[room.currentPlayer] === Meteor.userId() ) {

        // check if sign already in box clicked
        if ( room.tiles[boxId] === "" ) {

          // use correct sign
          if ( room.players[0] === Meteor.userId() ) {
            var sign = "X";   // Room.players[0] = player 1 --> "X"
          } else {
            var sign = "O";   // Room.players[1] = player 2 --> "O"
          }

          // change turn to allow next player to make a move
          if (room.currentPlayer === 0) {
            var currentPlayer = 1;
          } else {
            var currentPlayer = 0;
          }

          // add player's move to the database
          var query = {$set: {} };
          query.$set["currentPlayer"] = currentPlayer;
          query.$set["tiles." + boxId] = sign; // this assignment allows the use of variables as keys, which we need
          // using a sting as a key allows us to go several layers into objects at once
          Rooms.update(room._id, query);

          // check if the game is over
          checkWin(sign);
        }

      } else {  // player who cicked is not allowed to play
        window.alert("Wait for your turn!");
      }
    }
  });

  Template.endGame.helpers({
    "getWinnerName": function() {
      var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });
      return room.winner + " has won!";
    }
  });

  Template.endGame.events({
    "click #newGame": function(event) {
      // resets the game in current room and allow players to begin next round.
      event.preventDefault();

      var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });
      // reset data in current room
      Rooms.update( room._id, {$set: {
        tiles: {1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "", 9: ""},
        winner: undefined
      }});
      console.log("starting new game in room - " + room.roomNumber);
    }
  });

  function joinRoom(roomNumber) {
    var room = Rooms.findOne({ roomNumber: roomNumber });

    if (room.players.length < 2) {
      Session.set("roomNumber", roomNumber);
      console.log("joining room - " + roomNumber);
      // add ID of current logged in user to the room
      Rooms.update( room._id, {$push: {players: Meteor.userId()} });
    } else {
      window.alert("Room is full");
    }
  }

  function createRoom(roomNumber) {
    console.log("creating room - " + roomNumber);

    Rooms.insert({
      roomNumber: roomNumber,
      players: [Meteor.userId()],
      tiles: {1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "", 9: ""},
      currentPlayer: Math.round(Math.random()),
      // currentPlayer will result in:
      // 0 --> player 1, first in players-array. 1 --> player 2, second players-in array
      winner: undefined
    });
    Session.set("roomNumber", roomNumber);
  }

  function leaveRoom() {
    if (Session.get("roomNumber")) {
      var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });
      Rooms.update( room._id, {$pull: {players: Meteor.userId()} });
      room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });  // update var room

      if (room.players.length === 0) {
        console.log("remving room - " + room.roomNumber);
        Rooms.remove( room._id );
      }
      Session.set("roomNumber", undefined);
    }
  }

  function checkWin(sign) {
    // decide if the game has ended. triggered on every player-move
    var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });

    // check for win in each row
    if (room.tiles["1"] === sign &&  // row 1
        room.tiles["2"] === sign &&
        room.tiles["3"] === sign ||
        room.tiles["4"] === sign &&  // row 2
        room.tiles["5"] === sign &&
        room.tiles["6"] === sign ||
        room.tiles["7"] === sign &&  // row 3
        room.tiles["8"] === sign &&
        room.tiles["9"] === sign) {
      gameOver(sign);
    }

    // check for win in each column
    if (room.tiles["1"] === sign && // col 1
        room.tiles["4"] === sign &&
        room.tiles["7"] === sign ||
        room.tiles["2"] === sign && // col 2
        room.tiles["5"] === sign &&
        room.tiles["8"] === sign ||
        room.tiles["3"] === sign && // col 3
        room.tiles["6"] === sign &&
        room.tiles["9"] === sign) {
      gameOver(sign);
    }

    // check for win in diagonals
    if (room.tiles["1"] === sign && // diag 1
        room.tiles["5"] === sign &&
        room.tiles["9"] === sign ||
        room.tiles["3"] === sign && // diag 2
        room.tiles["5"] === sign &&
        room.tiles["7"] === sign) {
      gameOver(sign);
    }
  }

  function gameOver(sign) {
    // triggered when someone makes a winning move
    var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });

    if (sign === "X") {   // if player 1
      winnerName = Meteor.users.findOne(room.players[0]).username;
    } else {              // if player 2
      winnerName = Meteor.users.findOne(room.players[1]).username;
    }

    // set the currentRoom.winner
    Rooms.update( room._id, {$set: {winner: winnerName} });
  }

  window.addEventListener('beforeunload', function(e) {
    leaveRoom();
  });

}
