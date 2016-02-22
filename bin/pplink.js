#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

var createLinkedDep = require('../index');

function program(argv) {
  var args = require('minimist')(argv, {
    string: ['name'],
    boolean: ['relative', 'help'],
    alias: {
      relative: ['r']
    }
  });

  if (args._.length < 1 || args.help) {
    return fs.createReadStream(path.join(__dirname, '/usage.txt'))
    .pipe(process.stdout)
    .on('close', function () { process.exit(Number(!args.help)); });
  }

  var src = args._[0];
  var dest = args._[1] || '.';

  fs.stat(path.join(dest, 'package.json'), function (err, stats) {
    if (err) {
      if (err.code === 'ENOENT') {
        // if no package.json exists in the cwd, link directly
        return createLinkedDep(src, dest, args, exit);
      }
      return exit(err);
    }

    if (stats.isFile()) {
      dest = path.join(dest, 'node_modules');
      return mkdirp(dest, function (err) {
        if (err) return exit(err);
        return createLinkedDep(src, dest, args, exit);
      });
    }

    return createLinkedDep(src, dest, args, exit);
  });

  function exit(err) {
    if (err) console.error(err.stack || err);
    process.exit(err ? 0 : 1);
  }
}

// kickoff
program(process.argv.slice(2));
