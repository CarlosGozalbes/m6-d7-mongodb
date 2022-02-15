import express from "express";
import createHttpError from "http-errors";
import blogPostsModel from "./schema.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";

const cloudinaryStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "striveBooks",
  },
});



const blogPostsRouter = express.Router();

blogPostsRouter.post("/", async (req, res, next) => {
  try {
    const newBlogPost = new blogPostsModel(req.body); 
    const { _id } = await newBlogPost.save(); 
    res.status(201).send({ _id });
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.get("/", async (req, res, next) => {
  try {
    const blogPosts = await blogPostsModel.find();
    res.send(blogPosts);
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.get("/:blogPostId", async (req, res, next) => {
  try {
    const blogPostId = req.params.blogPostId;

    const blogPost = await blogPostsModel.findById(blogPostId);
    if (blogPost) {
      res.send(blogPost);
    } else {
      next(createHttpError(404, `blogpost with id ${blogPostId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.put("/:blogPostId", async (req, res, next) => {
  try {
    const blogPostId = req.params.blogPostId;
    const updatedblogpost = await blogPostsModel.findByIdAndUpdate(blogPostId, req.body, {
      new: true, // by default findByIdAndUpdate returns the record pre-modification, if you want to get back the newly updated record you should use the option new: true
    });
    if (updatedblogpost) {
      res.send(updatedblogpost);
    } else {
      next(createHttpError(404, `blogpost with id ${blogPostId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.delete("/:blogPostId", async (req, res, next) => {
  try {
    const blogPostId = req.params.blogPostId;
    const deletedblogpost = await blogPostsModel.findByIdAndDelete(blogPostId);
    if (deletedblogpost) {
      res.status(204).send();
    } else {
      next(createHttpError(404, `blogpost with id ${blogPostId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.post(
  "/:blogPostId/cover",
  multer({storage:cloudinaryStorage})
  .single("cover"), async (req, res, next) =>{
      try {
        const blogPostId = req.params.blogPostId;
        const updatedBlogPost = await blogPostsModel.findByIdAndUpdate(
          blogPostId,
          req.body,
          {
            new: true, // by default findByIdAndUpdate returns the record pre-modification, if you want to get back the newly updated record you should use the option new: true
          }
        );
        if (updatedBlogPost) {
          res.send(updatedBlogPost);
        } else {
          next(
            createHttpError(404, `blogpost with id ${blogPostId} not found!`)
          );
        }
      } catch (error) {
        next(error);
      }
  }
);




export default blogPostsRouter;
