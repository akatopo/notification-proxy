// https://stdlib.com/@stripe/src/store/

const mime = require('mime');
const fileio = require('../../helpers/fileio.js');
const path = require('path');

const filepath = './static';
let staticFiles = fileio.readFiles(filepath);
const maxAgeOverrides = {
  'service-worker.js': 'max-age=0',
};

/**
 * This endpoint handles all routes to `/static` over HTTP, and maps them to the
 *  `./static` service folder
 * @returns {Buffer}
 */
module.exports = (context, callback) => {

  // Hot reload for local development
  if (context.service && context.service.environment === 'local') {
    staticFiles = fileio.readFiles(filepath);
  }

  const staticFilepath = path.join(...context.path.slice(1));
  let buffer;
  const headers = {};

  headers['Cache-Control'] = staticFilepath in maxAgeOverrides ?
    maxAgeOverrides[staticFilepath] :
    getDefaultMaxAge(context.service.environment);

  if (!staticFiles[staticFilepath]) {
    headers['Content-Type'] = 'text/plain';
    buffer = Buffer.from('404 - Not Found');
  }
  else {
    headers['Content-Type'] = mime.getType(staticFilepath);
    buffer = staticFiles[staticFilepath];
  }

  return callback(null, buffer, headers);

};

function getDefaultMaxAge(env) {
  return env === 'release' ?
    'max-age=31536000' :
    'max-age=0';
}
