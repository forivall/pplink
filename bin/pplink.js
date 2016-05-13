#!/usr/bin/env node

var fs = require('fs');
var path = require('path');

var mkdirp = require('mkdirp');

var createLinkedDep = require('../index');
var saveDep = createLinkedDep.saveDep;

function program(argv) {
  var args = require('minimist')(argv, {
    string: ['name'],
    boolean: ['relative', 'help', 'save', 'save-dev', 'save-optional', 'save-bundle'],
    alias: {
      relative: ['r'],
      save: ['s']
    }
  });

  if (args._.length < 1 || args.help) {
    return fs.createReadStream(path.join(__dirname, '/usage.txt'))
    .pipe(process.stdout)
    .on('close', function () {
      process.exit(Number(!args.help));
    });
  }

  var src = args._[0];
  var destArg = args._[1] || '.';

  fs.stat(path.join(destArg, 'package.json'), function (err, stats) {
    var dest = destArg;

    if (err) {
      if (err.code === 'ENOENT') {
        // if no package.json exists in the cwd, link directly
        return createLinkedDep(src, dest, args, doSaveDep);
      }
      return exit(err);
    }

    if (stats.isFile()) {
      dest = path.join(destArg, 'node_modules');
      return mkdirp(dest, function (err) {
        if (err) return exit(err);
        return createLinkedDep(src, dest, args, doSaveDep);
      });
    }

    return createLinkedDep(src, dest, args, doSaveDep);
  });

  function doSaveDep(err, pkg) {
    if (err) return exit(err);
    if (!args.save && !args['save-dev'] && !args['save-bundle'] && !args['save-optional']) {
      return exit();
    }
    var saveAs =
      args['save-dev'] ? 'dev' :
      args['save-bundle'] ? 'bundle' :
      args['save-optional'] ? 'optional' : null;
    saveDep(pkg, destArg, {saveAs: saveAs}, exit);
  }

  function exit(err) {
    if (err) console.error(err.stack || err);
    process.exit(err ? 1 : 0);
  }
}

// kickoff
program(process.argv.slice(2));
