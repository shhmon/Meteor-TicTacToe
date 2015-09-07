
Rooms = new Mongo.Collection("rooms");

if (Meteor.isClient) {

  Session.set("roomNumber", undefined); // the user's current room

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
      roomId = parseInt($('[type="text"]').val());

      if ( Rooms.findOne({ roomNumber: roomId })) {
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
    }
  });

  Template.room.events({
    "click #leave": function(event) {
      leaveRoom();
    }
  });

  Template.playField.helpers({
    sign: function() {
      // Slutade här, kan inte få detta att funka, $(this) verkar inte selecta det jag tror det gör... Dock selectar det något, kan man se om man kör console.log($(this))
      console.log($(this).parent().attr("id"));
      return Rooms.findOne({ roomNumber: Session.get("roomNumber") }).tiles[$(this).parent().attr("id")];
    }
  });


  function joinRoom(roomNumber) {
    if (Rooms.findOne({ roomNumber: roomNumber }).players < 2){
      Session.set("roomNumber", roomNumber);
      console.log("joining room - " + roomNumber);
      Rooms.update(String(Rooms.findOne({ roomNumber: Session.get("roomNumber")})._id), {$inc: {players: 1} });
    } else {
      window.alert("room is full");
    }
  }

  function createRoom(roomNumber) {
    console.log("creating room - " + roomNumber);
    // Tiles "dictionaryn" ska vara den som styr alla fält på spelplanen. Innehållet ska visas i respektive ruta
    Rooms.insert({
      roomNumber: roomNumber,
      players: 1,
      tiles: {1: "X", 2: "X", 3: "O", 4: "", 5: "", 6: "", 7: "", 8: "", 9: ""}
    });
    Session.set("roomNumber", roomNumber);
  }

  function leaveRoom() {
    if (Session.get("roomNumber")) {
      Rooms.update(String(Rooms.findOne({ roomNumber: Session.get("roomNumber")})._id), {$inc: {players: -1} });

      if (Rooms.findOne({ roomNumber: Session.get("roomNumber") }).players == 0) {
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
