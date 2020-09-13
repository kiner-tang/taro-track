'use strict';

const path = require('path');
const filename = path.join(__dirname, 'tools/gulp/tsconfig.json');

require('ts-node').register({
  project: filename
});

require('./tools/gulp/gulpfile');

