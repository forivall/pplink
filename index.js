var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

module.exports = createLinkedDep;
function createLinkedDep(src, dest, options, callback) {
  var pkg = options.pkg || require(path.join(path.resolve(src), 'package.json'));
  options.pkg = pkg;

  var linkDest = path.join(dest, options.name || pkg.name);
  mkdirp(linkDest, function (err) {
    if (err) return callback(err);
    return createLinkedDepFiles(src, linkDest, options, callback);
  });
}

module.exports.createLinkedDepFiles = createLinkedDepFiles;
function createLinkedDepFiles(src, dest, options, callback) {
  if (arguments.length === 3 && typeof options === 'function') {
    callback = options;
    options = {};
  }

  var absSrc = path.resolve(src);
  src = absSrc;
  if (options.relative) {
    src = path.relative(dest, absSrc);
  }

  var pkg = options.pkg || require(path.join(absSrc, 'package.json'));
  options.pkg = pkg;

  fs.writeFile(path.join(dest, 'package.json'), JSON.stringify({
    name: options.name || pkg.name,
    version: pkg.version
  }, null, '  '), function (err) {
    if (err) return callback(err);

    fs.writeFile(
      path.join(dest, 'index.js'),
      'module.exports = require(' + JSON.stringify(src) + ');',
      callback
    );
  });
}
