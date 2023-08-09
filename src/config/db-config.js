const mongoose = require("mongoose");

const mongo_uri = process.env.MONGO_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}


// TODO: retry the connection again for the next 5 times
exports.connect = () => {
  mongoose.connect(mongo_uri, options).then(() => {
    console.log("database connection successfull");
  }).catch(err => {
    console.trace(err);
  })
}