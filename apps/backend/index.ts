import dotenv from "dotenv";
dotenv.config({
  path: "./.env",
});
import { ENV_VALUE } from "./src/utils/env";

import { connectDB } from "./src/dbs/db";
import app from "./src/app";

connectDB()
  .then(() => {
    app.listen(ENV_VALUE.PORT || 4000, () =>
      console.log(`✅ Streamio API listening on ${ENV_VALUE.PORT}`)
    );
  })
  .catch((error) => {
    console.log("Can't connect to Database!!! ", error);
  });

// declare namespace Express {
//   export interface Request {
//     user?: any; // or specific IUser interface
//   }
// }
