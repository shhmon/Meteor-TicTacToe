
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
      roomNumber = parseInt($('[type="text"]').val());

      if ( Rooms.findOne({ roomNumber: roomNumber }) ) {
        joinRoom(roomNumber);
      } else {
        createRoom(roomNumber);
      }
    },
    "input form": function(event) {

      console.log("input");
      roomNumber = parseInt($('[type="text"]').val());

      if ( Rooms.findOne({ roomNumber: roomNumber })) {
        // if room found
        $('#action').attr("value", "Join Room");
      } else {
        // if not found
        $('#action').attr("value", "Create Room");
      }
    }
  });

  Template.room.helpers({
    "roomNumber": function() {
      return Session.get("roomNumber");
    },
    "players": function() {
      var players = Rooms.findOne({ roomNumber: Session.get("roomNumber") }).players;
      var playernames = [];
      for (var i = 0; i < players.length; i++) {
        playernames.push(Meteor.users.findOne({ _id:players[i] }).username);
      }
      return playernames;
      console.log(players);
    }
  });

  Template.room.events({
    "click #leave": function(event) {
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
        Rooms.remove(String(Rooms.findOne({ roomNumber: Session.get("roomNumber") })._id));
      }
      Session.set("roomNumber", undefined);
    }
  }

  window.addEventListener('beforeunload', function(e) {
    leaveRoom();
  });

}

/*Rooms.remove(String(Rooms.findOne({ roomNumber: Session.get("roomNumber")})._id));*/
