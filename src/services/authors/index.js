import express from "express";
import createHttpError from "http-errors";
import AuthorsModel from "./schema.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import q2m from "query-to-mongo";
import { basicAuthMiddleware } from "../../auth/basic.js";
import { adminOnlyMiddleware } from "../../auth/admin.js";

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "striveBooks",
  },
});

const authorsRouter = express.Router();

/* authorsRouter.get("/me/stories", basicAuthMiddleware, async (req, res, next) => {
  try {
    const authorWithBlogPosts = await (req.user).populate({
      path: "BlogPosts",
      select: "title",
    });
    res.send(authorWithBlogPosts);
  } catch (error) {
    next(error);
  }
}); */




authorsRouter.post("/", async (req, res, next) => {
  try {
    const newAuthor = new AuthorsModel(req.body);
    const { _id } = await newAuthor.save();
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

authorsRouter.get(
  "/",
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

authorsRouter.get(
  "/:authorId",
  basicAuthMiddleware,
  adminOnlyMiddleware,
  async (req, res, next) => {
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
  }
);

authorsRouter.put(
  "/:authorId",
  basicAuthMiddleware,
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
  basicAuthMiddleware,
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
  "/:authorId/avatar",
  multer({ storage: cloudinaryStorage }).single("avatar"),
  async (req, res, next) => {
    try {
      const authorId = req.params.authorId;
      const updatedAuthor = await AuthorsModel.findByIdAndUpdate(
        authorId,
        { avatar: req.file.path } ,
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

export default authorsRouter;
