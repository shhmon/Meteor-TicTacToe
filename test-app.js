
Rooms = new Mongo.Collection("rooms");

if (Meteor.isClient) {

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });

  Template.body.helpers({
    "roomJoined": function() {
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
      // Triggered while user is entering a Room-ID.
      // Changes UI depending on if entered Room-ID is valid or not
      var roomNumber = parseInt($('[type="text"]').val());
      var submitBtn = $('#action');

      if ( isNaN(roomNumber) ) { // if input is a valid Room-ID
        submitBtn.attr('disabled', true);
        submitBtn.addClass('disabled');

      } else {

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

  Template.playField.helpers({
    "sign": function(id) {
      // Return the sign in the current box in playfield
      return Rooms.findOne({ roomNumber: Session.get("roomNumber") }).tiles[id];
    }
  });

  Template.playField.events({
    "click .box": function(event) {
      var box = $(event.target);
      var id = box.attr("id");
      console.log(id);

      /*if (player1 has clicked on a field) {
        var sign = "X";
      } else {
        var sign = "O";
      }*/
      var sign = "X";

      // use Meteor.userId()
      // array med spelares unika ID:n
      // kolla längd på Room.players-array --> istället för värde på Room.players-integer

      // insert på id 2 varje klick --> TODO: fixa så den sätter in på dynamiskt id oavsett box man klickar i
      Rooms.update(Rooms.findOne({ roomNumber: Session.get("roomNumber") })._id,
        {$set: {tiles: {2: sign} }
      });

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
      tiles: {1: "", 2: "", 3: "", 4: "", 5: "", 6: "", 7: "", 8: "", 9: ""}
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
