// Require mongoose
var mongoose = require("mongoose");
// Create Schema class
var Schema = mongoose.Schema;

// Create Article schema
var ArticleSchema = new Schema({
  headline: {
    type: String,
    required: true
  },
  link: {
    type: String,
    required: true,
    unique: true
  },
  thumbnail: String,
  summary: String,
  date: Date,
  by: String,
  // references Comment model, as array
  comments: [{
    type: Schema.Types.ObjectId,
    ref: "Comment"
  }],
  // refers to which users are saving the article
  savers: [{
    type: Schema.Types.ObjectId,
    ref: "User"
  }]
});

// Create the Article model with the ArticleSchema
var Article = mongoose.model("Article", ArticleSchema);

// Export the model
module.exports = Article;
