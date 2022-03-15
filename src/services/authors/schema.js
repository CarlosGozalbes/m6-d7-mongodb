import mongoose from "mongoose";
import bcrypt from "bcrypt";
const { Schema, model } = mongoose;

const AuthorSchema = new Schema(
  {
    name: {
      firstName: { type: String, required: true },
      lastName: { type: String, required: true },
    },
    avatar: { type: String, required: false },
    email: { type: String, required: true },
    password: { type: String, required: true },
    role: { type: String, enum: ["Author", "Admin"], default: "Author" },
    
  },
  {
    timestamps: true,
  }
);

AuthorSchema.pre("save", async function (next) {
  // BEFORE saving the user in db, hash the password
  // I am NOT using arrow function here because of "this"
  const newAuthor = this; // "this" represents the current user I'm trying to save in db
  const plainPw = newAuthor.password;

  if (newAuthor.isModified("password")) {
    // only if the user is modifying the password field I am going to use some CPU cycles to hash that, otherwise they are just wasted
    const hash = await bcrypt.hash(plainPw, 11);
    newAuthor.password = hash;
  }

  next();
});

AuthorSchema.methods.toJSON = function () {
  // this toJSON function will be called EVERY TIME express does a res.send(user/s)

  const authorDocument = this;
  const authorObject = authorDocument.toObject();

  delete authorObject.password;
  delete authorObject.__v;

  return authorObject;
};

AuthorSchema.statics.checkCredentials = async function (email, plainPW) {
  // Given email and pw this method should check in db if email exists and then compare plainPW with the hash that belongs to that user and then return a proper response

  // 1. Find the user by email
  const author = await this.findOne({ email }); // "this" here refers to UserModel

  if (author) {
    // 2. If the user is found --> compare plainPW with the hashed one

    const isMatch = await bcrypt.compare(plainPW, author.password);

    if (isMatch) {
      // 3. If they do match --> return a proper response (user himself)
      return author;
    } else {
      // 4. If they don't --> return null
      return null;
    }
  } else {
    // 5. If the email is not found --> return null as well
    return null;
  }
};


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
