/**=======================================================================
                                delete image helper
 ========================================================================*/
// Imports
const fs = require("fs-extra");
const path = require("path");

const image = "./public/images";

function removeImage(imagefilename, maincallback) {

  if(!imagefilename) {
    console.trace({"error": "invalid image filename"});
    return maincallback(false);
  }

  // delete the file from disk
  fs.unlink(path.join("./public/images/", imagefilename), (err) => {
    if (err) {
      console.trace("unable to delete file");
      console.log({ err });
      return maincallback(false);
    }

    maincallback(true);
  });
}

// Exports modules
module.exports = removeImage;
