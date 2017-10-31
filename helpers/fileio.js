// https://stdlib.com/@stripe/src/store/

const path = require('path');
const fs = require('fs');

/**
* Read files in a directory, for mapping /static files to the static
*   function
*/
module.exports = {
  readFiles(base, dir, files) {
    dir = dir || '';
    files = files || {};
    const pathname = path.join(base, dir);

    const dirList = fs.readdirSync(pathname);

    for (let i = 0; i < dirList.length; i++) {
      const dirpath = path.join(dir, dirList[i]);
      const dirname = dirpath.split(path.sep).join('/');
      const fullpath = path.join(pathname, dirList[i]);
      if (fs.lstatSync(fullpath).isDirectory()) {
        this.readFiles(base, dirpath, files);
      }
      else {
        files[dirname] = fs.readFileSync(fullpath);
      }
    }

    return files;
  },
};
