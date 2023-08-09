const path = require("path");

// load environment variables if in development mode
if (process.env.NODE_ENV !== "production") {
    require('dotenv').config({ path: path.join((__dirname, '.env')) });
}
