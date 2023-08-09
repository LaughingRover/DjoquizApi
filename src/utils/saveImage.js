/**=======================================================================
                                save image helper
 ========================================================================*/

// Imports
const fs = require("fs-extra");
const path = require("path");
const async = require("async");

const image = "./public/images";

function saveImage(imagefile, userId, maincallback) {
  let splittedName = imagefile.originalname.split(".");
  let imageext = splittedName[splittedName.length - 1];
  const newname = userId + "." + imageext;

  async.waterfall([
    // read the temporary file
    function (callback) {
      fs.readFile(path.join("./temp/images/", imagefile.filename), (err, file) => {
        if (err) {
          console.trace("unable to read file");
          console.dir({ err });
          return maincallback(false);
        }

        callback(null, file);
      });
    },
    // write the file to a new location
    function (result, callback) {
      fs.writeFile(path.join("./public/images/", newname), result, (err) => {
        if (err) {
          console.trace("unable to write file");
          console.log({ err });
          return callback(true);
        }

        callback(null);
      })
    },
    // delete the temporary file,
    function () {
      fs.unlink(path.join(__dirname, "./temp/images/", imagefile.filename), (err) => {
        if (err) console.trace({ err });

        return maincallback(newname)
      });
    }
  ],
  // there was a problem trying to write the file
    function () {
      // go ahead and delete the temporary file despite the error
      fs.unlink(path.join(__dirname, "./temp/images/", imagefile.filename), (err) => {
        if (err) console.trace({ err });

        maincallback(false)
      });
    });
}


// Export module
module.exports = saveImage;
