Tasks = new Mongo.Collection("tasks");

// This code only runs on the client
if (Meteor.isClient) {
  Meteor.subscribe("tasks");
  
  Template.task.helpers({
    isOwner: function () {
      return this.owner === Meteor.userId();
    }
  });
  
  Template.body.helpers({
    tasks: function() {
      if(Session.get("hideDone")) {
        return Tasks.find({checked:{$ne: true}}, {sort: {createdAt: -1}});
      } else {
        return Tasks.find({}, {sort: {createdAt: -1}});
      }
    },
    
    hideDone: function() {
      Session.get("hideDone");
    },
    
    notDoneCount: function() {
      return Tasks.find({checked:{$ne: true}}).count();
    }
  });
  
  Template.body.events({
    "submit .new-task": function (event) {
      var text = event.target.text.value;
      Meteor.call("addTask", text);
   
      // Clear form
      event.target.text.value = "";
      
      // Prevent default form submit
      return false;
    },
    
    "click .toggle-checked": function () {
      Meteor.call("setChecked", this._id, ! this.checked);
    },
    
    "click .toggle-private": function() {
      Meteor.call("setPrivate", this._id, !this.private);
    },
    
    "click .delete": function() {
      Meteor.call("deleteTask", this._id)
    },
    
    "change .hide-done input": function(event) {
      Session.set("hideDone", event.target.checked);
    }
  });

  Accounts.ui.config({
    passwordSignupFields: "USERNAME_ONLY"
  });
}

if(Meteor.isServer){
  Meteor.publish("tasks", function() {
    return Tasks.find({
      $or: [
        { private: {$ne: true} },
        { owner: this.userId }
      ]
    });
  })
}

Meteor.methods({
  addTask: function(text) {
    if(! Meteor.userId()) {
      throw new Meteor.Error("not-authorized")
    }
    Tasks.insert({
      text: text,
      createdAt: new Date(),
      owner: Meteor.userId(), // _id of logged in user
      username: Meteor.user().username,
      private: true
    });
  },
  
  deleteTask: function(taskId) {
    Tasks.remove(taskId);
  },
  
  setChecked: function(taskId, setChecked) {
    Tasks.update(taskId, {$set: {checked: setChecked}})
  },
  
  setPrivate: function(taskId, setToPrivate) {
    var task = Tasks.findOne(taskId);
    
    // Make sure only the task owner can make a task private
    if(task.owner !== Meteor.userId()) {
      throw new Meteor.Error("not-authorized");
    }
    Tasks.update(taskId, { $set: { private: setToPrivate } });
  }
})
