import express from "express";
import listEndpoints from "express-list-endpoints";
import cors from "cors";
import mongoose from "mongoose";
import {
  badRequestHandler,
  unauthorizedHandler,
  notFoundHandler,
  genericErrorHandler,forbiddenHandler
} from "./errorHandlers.js";
import blogPostsRouter from "./services/blogPosts/index.js";
import authorsRouter from "./services/authors/index.js";

const server = express();
const port = process.env.PORT || 3001;



server.use(cors());
server.use(express.json());



server.use("/blogPosts", blogPostsRouter);
server.use("/authors", authorsRouter);

server.use(badRequestHandler);
server.use(unauthorizedHandler);
server.use(notFoundHandler);
server.use(genericErrorHandler);
server.use(forbiddenHandler);
mongoose.connect(process.env.MONGO_CONNECTION);

mongoose.connection.on("connected", () => {
  console.log("Successfully connected to Mongo!");
  server.listen(port, () => {
    console.table(listEndpoints(server));
    console.log("Server runnning on port: ", port);
  });
});

server.on("error", (error) => {
  console.log(`Server is stopped : ${error}`);
});