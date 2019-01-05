'use strict';

module.exports = function () {
  return {
    packages: [ 'gulp-concat', 'gulp-htmlmin', 'gulp-flatmap', 'gulp-gzip', 'gulp-uglify', 'gulp-clean-css', 'fs', 'path', 'pump'],
    deployFiles: [ 'gulpfile.js', 'gulpcss.js'],
    take: 'last-line'
  };
};
