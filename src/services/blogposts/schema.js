import mongoose from "mongoose";

const { Schema, model } = mongoose;

const commentSchemma = mongoose.Schema({
  
        text: { type: String, minLength: 10, required: true },
        rate: { type: Number, min: 0, max: 5, required: true },
        
        author: {
          name: { type: String, required: false },
          avatar: { type: String, required: false },
        },
      
})


const blogpostSchema = new Schema(
  {
    category: {
      type: String,
      required: true,
      enum: ["horror", "history", "fantasy", "romance"],
    },
    title: { type: String, required: true },
    cover: { type: String, required: false },
    readtime: {
      value: { type: Number },
      unit: { type: String },
      required: false,
    },
    author: [{ type: Schema.Types.ObjectId, ref: "Author" }],
    content: { type: String, minLength: 100, required: true },
    comments: [commentSchemma],
  },
  {
    timestamps: true, // adds and manages automatically createdAt and updatedAt fields
  }
);

export default model("BlogPost", blogpostSchema); // this model is now automatically linked to the "users" collection, if the collection is not there it will be automatically created
