import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});

import express, { Request, Response } from "express";
import cors from "cors";
import { connectDB } from "./db/db";
import { User } from "./model/user.model";
import { IUserCreate } from "@servicely/types";

const app = express();
app.use(cors());
app.use(express.json());

connectDB()
  .then(() => {
    app.listen(process.env.PORT, () =>
      console.log(`✅ Servicely API listening on ${process.env.PORT}`)
    );
  })
  .catch((error) => {
    console.log(error);
  });

app.get("/register", async (req: Request, res: Response) => {
  const user = await User.create({
    userName: "sandip kumar behera",
    email: "sandipbehera681@gmail.com",
  } satisfies IUserCreate);

  return res
    .status(201)
    .type("html")
    .send(
      `<html><body><h1>Welcome, ${user.userName}</h1><p>id: ${user.id}</p><p>email: ${user.email}</p></body></html>`
    );
});
