const { connect, connection } = require("mongoose");

const mongo_uri = process.env.MONGO_URI;
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true
}
console.log("connecting to database...")
module.exports = () => {
  return connect(mongo_uri, options, (err) => {
    if(err) {
      throw "unable to connect to database"; 
    }

    console.log("connection successful");
  })
}