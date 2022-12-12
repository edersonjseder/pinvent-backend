import mongoose from "mongoose";
import colors from "colors";

const connectDB = async (app) => {
  const PORT = process.env.PORT || 5000;

  const conn = mongoose
    .connect(process.env.MONGO_URI)
    .then(() =>
      app.listen(PORT, () =>
        console.log(`Server running on port: ${PORT}`.cyan.underline.bold)
      )
    )
    .catch((error) => console.log(error.message));
};

export default connectDB;
