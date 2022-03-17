import express from "express";
import createHttpError from "http-errors";
import AuthorsModel from "./schema.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import q2m from "query-to-mongo";
import { basicAuthMiddleware } from "../../auth/basic.js";
import { adminOnlyMiddleware } from "../../auth/admin.js";
import { authenticateAuthor } from "../../auth/tools.js";
import { JWTAuthMiddleware } from "../../auth/token.js";
import mongoose from "mongoose";
import passport from "passport";

let blogPost = mongoose.model("BlogPost");

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "striveBooks",
  },
});

const authorsRouter = express.Router();

authorsRouter.get(
  "/me",
  /* basicAuthMiddleware */ JWTAuthMiddleware,
  async (req, res, next) => {
    try {
      const author = await AuthorsModel.findById(req.author._id);
      res.send(author);
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.put("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const author = await AuthorsModel.findByIdAndUpdate(
      req.author._id,
      req.body,
      {
        new: true,
      }
    );
    res.send(author);
  } catch (error) {
    next(error);
  }
});

authorsRouter.delete("/me", JWTAuthMiddleware, async (req, res, next) => {
  try {
    await AuthorsModel.findByIdAndDelete(req.author._id);
    res.send();
  } catch (error) {
    next(error);
  }
});

authorsRouter.post("/register", async (req, res, next) => {
  try {
    const newAuthor = new AuthorsModel(req.body);
    const { _id } = await newAuthor.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

authorsRouter.get(
  "/googleLogin",
  passport.authenticate("google", { scope: ["email", "profile"] })
); // this endpoint will redirect our users to Google Consent Screen

authorsRouter.get(
  "/googleRedirect",
  passport.authenticate("google"),
  (req, res, next) => {
    try {
      // passport middleware will receive the response from Google, then we gonna execute the route handler
      console.log(req.user.token);
      // res.send({ token: req.user.token })

      if (req.user.role === "Admin") {
        res.redirect(
          `${process.env.FE_URL}/admin?accessToken=${req.user.token}`
        );
      } else {
        res.redirect(
          `${process.env.FE_URL}/profile?accessToken=${req.user.token}`
        );
      }
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.get(
  "/",
  JWTAuthMiddleware,
  /* basicAuthMiddleware,
  adminOnlyMiddleware, */
  async (req, res, next) => {
    try {
      const mongoQuery = q2m(req.query);
      const { total, authors } = await AuthorsModel.findAuthorsWithBlogPosts(
        mongoQuery
      );
      res.send({
        links: mongoQuery.links("/authors", total),
        total,
        totalPages: Math.ceil(total / mongoQuery.options.limit),
        authors,
      });
      /* const authors = await AuthorsModel.find()
      res.send(authors) */
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.get("/:authorId", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const authorId = req.params.authorId;
    const author = await AuthorsModel.findById(authorId).populate({
      path: "BlogPosts",
      select: "title",
    });
    /* const author = await AuthorsModel.findById(authorId); */
    if (author) {
      res.send(author);
    } else {
      next(createHttpError(404, `Author with id ${authorId} not found`));
    }
  } catch (error) {
    next(error);
  }
});

authorsRouter.put(
  "/:authorId",
  JWTAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const authorId = req.params.authorId;
      const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
        authorId,
        req.body,
        {
          new: true,
        }
      );
      if (updatedAuthor) {
        res.send(updatedAuthor);
      } else {
        next(createHttpError(404, `Author with id ${authorId} not found`));
      }
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.delete(
  "/:authorId",
  JWTAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
    try {
      const authorId = req.params.authorId;
      const deletedAuthor = await AuthorsModel.findByIdAndDelete(authorId);
      if (deletedAuthor) {
        res.status(204).send();
      } else {
        next(createHttpError(404, `Author with id ${authorId} not found`));
      }
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.post(
  "/:authorId/avatar", JWTAuthMiddleware,
  multer({ storage: cloudinaryStorage }).single("avatar"),
  async (req, res, next) => {
    try {
      const authorId = req.params.authorId;
      const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
        authorId,
        { avatar: req.file.path },
        {
          new: true,
        }
      );
      if (updatedAuthor) {
        res.send(updatedAuthor);
      } else {
        next(createHttpError(404, `Author with id ${authorId} not found!`));
      }
    } catch (error) {
      next(error);
    }
  }
);

authorsRouter.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const author = await AuthorsModel.checkCredentials(email, password);
    if (author) {
      //const token = Buffer.from(`${email}:${password}`).toString("base64")
      const accessToken = await authenticateAuthor(author);
      res.status(201).send({ accessToken });
    } else {
      res.status(401).send("go away!!");
    }
  } catch (error) {
    console.log(error);

    next(error);
  }
});

authorsRouter.get("/me/stories", JWTAuthMiddleware, async (req, res, next) => {
  try {
    const posts = await blogPost.find({
      author: req.author._id.toString(),
    });

    res.status(200).send(posts);
  } catch (error) {
    next(error);
  }
});

export default authorsRouter;
