import { connectDB } from "./src/db/db";
import { ENV_VALUE } from "./src/utils/env";
import app from "./src/app";

connectDB()
  .then(() => {
    app.listen(ENV_VALUE.PORT, () =>
      console.log(`✅ NursingPracticer API listening on ${ENV_VALUE.PORT}`),
    );
  })
  .catch((error) => {
    console.log(error);
  });
