import mongoose from "mongoose";

const { Schema, model } = mongoose;

const AuthorSchema = new Schema(
  {
    name: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    avatar: { type: String, required: false },
    BlogPosts: [{ type: Schema.Types.ObjectId, ref: "BlogPost" }]
  },
  {
    timestamps: true,
  }
);

AuthorSchema.static("findAuthorsWithBlogPosts", async function (mongoQuery) {
  const total = await this.countDocuments(mongoQuery.criteria); // If I use a normal function (not an arrow) here, the "this" keyword will give me the possibility to access to BooksModel
  const authors = await this.find(mongoQuery.criteria)
    .limit(mongoQuery.options.limit)
    .skip(mongoQuery.options.skip)
    .sort(mongoQuery.options.sort) // no matter in which order you call this options, Mongo will ALWAYS do SORT, SKIP, LIMIT in this order
    .populate({
      path: "BlogPosts",
      select: "title",
    });
  return { total, authors };
});

export default model("Author", AuthorSchema);
