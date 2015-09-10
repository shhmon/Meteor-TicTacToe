
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

      if ( Rooms.findOne({ roomNumber: roomNumber }) ) {
        joinRoom(roomNumber);
      } else {
        createRoom(roomNumber);
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
      var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });
      var currentPlayer = Meteor.users.findOne(room.players[ room.currentPlayer ]);
      return currentPlayer.username;
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
      var id = box.attr("id");
      var room = Rooms.findOne({ roomNumber: Session.get("roomNumber") });

      // only let the player who's next in turn modify the board
      if ( room.players[room.currentPlayer] === Meteor.userId() ) {

        // use correct sign
        if ( room.players[0] === Meteor.userId() ) {
          var sign = "X";   // Room.players[0] = player 1 --> "X"
        } else {
          var sign = "O";   // Room.players[1] = player 2 --> "O"
        }

        // change turn to allow next player to make a move
        console.log("current turn - " + room.currentPlayer);
        if (room.currentPlayer === 0) {
          var currentPlayer = 1;
        } else {
          var currentPlayer = 0;
        }
        console.log("next turn - " + room.currentPlayer);

        // add player's move to the database
        var query = {$set: {} };
        query.$set["currentPlayer"] = currentPlayer;
        query.$set["tiles." + id] = sign; // this assignment allows the use of variables as keys, which we need
        // using a sting as a key allows us to go several layers into objects at once
        Rooms.update(Rooms.findOne({ roomNumber: Session.get("roomNumber") })._id, query );

      } else {  // player who cicked is not allowed to play
        console.log("wait for your turn!");
      }


    }
  });

  function joinRoom(roomNumber) {
    if (Rooms.findOne({ roomNumber: roomNumber }).players.length < 2){
      Session.set("roomNumber", roomNumber);
      console.log("joining room - " + roomNumber);
      // add ID of current logged in user to the room
      Rooms.update( Rooms.findOne({ roomNumber: Session.get("roomNumber") })._id, {$push: {players: Meteor.userId()} });
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
      currentPlayer: 0 // 0 --> player 1, first in players-array. 1 --> player 2, second players-in array
    });
    Session.set("roomNumber", roomNumber);
  }

  function leaveRoom() {
    if (Session.get("roomNumber")) {
      Rooms.update( Rooms.findOne({ roomNumber: Session.get("roomNumber") })._id, {$pull: {players: Meteor.userId()} });

      if (Rooms.findOne({ roomNumber: Session.get("roomNumber") }).players.length === 0) {
        // if no users left in room --> remove room
        Rooms.remove( Rooms.findOne({ roomNumber: Session.get("roomNumber") })._id);
      }
      Session.set("roomNumber", undefined);
    }
  }

  window.addEventListener('beforeunload', function(e) {
    leaveRoom();
  });

}
