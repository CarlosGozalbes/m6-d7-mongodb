import express from "express";
import createHttpError from "http-errors";
import blogPostsModel from "./schema.js";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import q2m from "query-to-mongo";
import { basicAuthMiddleware } from "../../auth/basic.js";
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
    const mongoQuery = q2m(req.query)
    const total = await blogPostsModel.countDocuments(mongoQuery.criteria)
    const blogPosts = await blogPostsModel
      .find(mongoQuery.criteria)
      .limit(mongoQuery.options.limit)
      .skip(mongoQuery.options.skip)
      .sort(mongoQuery.options.sort);
    res.send({
      links: mongoQuery.links("/blogPosts", total),
      total,
      totalPages: Math.ceil( total / mongoQuery.options.limit),
      blogPosts
    });
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
          {cover: req.file.path},/*  cover: req.file.path, */
          {
            /* cover: req.file.path */
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

blogPostsRouter.post("/:blogPostId/comments", async (req, res, next) => {
  try {
    const updatedBlogPost = await blogPostsModel.findByIdAndUpdate(
      req.params.blogPostId,
      { $push: {comments: req.body}},
      {new:true}
    )
    if (updatedBlogPost) {
      res.send(updatedBlogPost);
    } else {
      next(createHttpError(404, `blogpost with id ${blogPostId} not found!`));
    }
  } catch (error) {
    
  }
}); 

blogPostsRouter.get("/:blogPostId/comments", async ( req, res, next) => {
  try {
    const blogPost = await blogPostsModel.findById(req.params.blogPostId)
    if (blogPost) {
      res.send(blogPost.comments)
    } else {
      next(createHttpError(404, `Blogpost with Id ${req.params.blogPostId} not found!`));
    }
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.get("/:blogPostId/comments/:commentId", async (req, res, next) => {
  try {
    const blogPost = await blogPostsModel.findById(req.params.blogPostId);
    const comment = blogPost.comments?.find(comment=>comment._id.toString()===req.params.commentId)
    if (comment) {
      res.send(comment);
    } else {
      next(
        createHttpError(
          404,
          `Blogpost with Id ${req.params.blogPostId} not found!`
        )
      );
    }
  } catch (error) {
    next(error);
  }
});

blogPostsRouter.put(
  "/:blogPostId/comments/:commentId",
  async (req, res, next) => {
    try {
      const blogPost = await blogPostsModel.findById(req.params.blogPostId); // user is a MONGOOSE DOCUMENT, it is NOT A PLAIN OBJECT
      if (blogPost) {
        const index = blogPost.comments.findIndex(
          (comment) => comment._id.toString() === req.params.commentId
        );

        if (index !== -1) {
          // we can modify user.purchaseHistory[index] element with what comes from request body
          blogPost.comments[index] = {
            ...blogPost.comments[index].toObject(), // DO NOT FORGET .toObject() when spreading
            ...req.body,
          };

          await blogPost.save(); // since user is a MONGOOSE DOCUMENT I can use some of his special powers like .save() method
          res.send(blogPost);
        } else {
          next(
            createHttpError(404, `comment with id ${req.params.commentId} not found!`)
          );
        }
      } else {
        next(
          createHttpError(404, `blogpost with id ${req.params.blogPostId} not found!`)
        );
      }
    } catch (error) {
      next(error);
    }
  }
); // modify single item from purchase history of a specific user

blogPostsRouter.delete(
  "/:blogPostId/comments/:commentId",
  async (req, res, next) => {
    try {
      const modifiedBlogPost = await blogPostsModel.findByIdAndUpdate(
        req.params.blogPostId, //WHO
        { $pull: { comments: { _id: req.params.commentId } } }, // HOW
        { new: true } // OPTIONS
      );
      if (modifiedBlogPost) {
        res.send(modifiedBlogPost);
      } else {
        next(
          createHttpError(
            404,
            `Blogpost with Id ${req.params.blogPostId} not found!`
          )
        );
      }
    } catch (error) {
      next(error);
    }
  }
); 


blogPostsRouter.get(
  "/me/stories",
  basicAuthMiddleware,
  async (req, res, next) => {
    try {
      const blogPostsFromAuthor = await req.user.populate({
        path: "BlogPosts",
        select: "title",
      });
      res.send(blogPostsFromAuthor);
    } catch (error) {
      next(error);
    }
  }
);


export default blogPostsRouter;
