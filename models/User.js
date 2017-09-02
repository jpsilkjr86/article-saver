// Require mongoose
var mongoose = require("mongoose");
// Create Schema class
var Schema = mongoose.Schema;

// Create User schema
var UserSchema = new Schema({
  username: {type: String, required: true, unique: true},
  password: { type: String, required: true },
  email: { type: String, required: true },
  first_name: { type: String, required: true },
  last_name: String,
  created_at: { type: Date, default: Date.now },
  // references user's posted comments through Comment model
  posted_comments: [{ type: Schema.Types.ObjectId, ref: "Comment" }],
  // references user's saved articles through Article model
  saved_articles: [{ type: Schema.Types.ObjectId, ref: "Article" }]
});

// Create the User model with the UserSchema
var User = mongoose.model("User", UserSchema);

// Export the model
module.exports = User;