var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');
var updatePackage = require('update-package-json');
var sortKeys = require('sort-keys');

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

// src is a path to the package that we're linking to
// dest is a directory path
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
  }, null, '  ') + '\n', function (err) {
    if (err) return callback(err);

    fs.writeFile(
      path.join(dest, 'index.js'),
      'module.exports = require(' + JSON.stringify(src) + ');',
      function (err) {
        if (err) return callback(err);
        callback(null, pkg);
      }
    );
  });
}

module.exports.saveDep = saveDep;
function saveDep(pkg, dest, options, callback) {
  if (arguments.length === 3 && typeof options === 'function') {
    callback = options;
    options = {};
  }

  var destKey =
    options.saveAs === 'dev' ? 'devDependencies' :
    options.saveAs === 'optional' ? 'optionalDependencies' :
    options.saveAs === 'bundle' ? 'bundleDependencies' :
    'dependencies';

  fs.stat(dest, function (err, stats) {
    if (err) return callback(err);
    if (stats.isDirectory()) {
      dest = path.join(dest, 'package.json');
    }
    updatePackage(dest, function (destpkg) {
      var deps = destpkg[destKey] || {};
      deps[options.name || pkg.name] = '^' + (options.version || pkg.version);
      destpkg[destKey] = sortKeys(deps);
    }, callback);
    // NOTE: update-package-json doesn't report an error when it can't read
  });
}
