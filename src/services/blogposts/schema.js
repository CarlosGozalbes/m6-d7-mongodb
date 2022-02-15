import mongoose from "mongoose";

const { Schema, model } = mongoose;

const blogpostSchema = new Schema(
  {
    category: { type: String, required: true },
    title: { type: String, required: true },
    cover: { type: String, required: false },
    readtime: {
      value: { type: Number },
      unit: { type: String },
      required: false,
    },
    author: {
      name: { type: String, required: false },
      avatar: { type: String, required: false },
    },
    content: { type: String, minLength: 100, required: true },
  },
  {
    timestamps: true, // adds and manages automatically createdAt and updatedAt fields
  }
);

export default model("BlogPost", blogpostSchema); // this model is now automatically linked to the "users" collection, if the collection is not there it will be automatically created
