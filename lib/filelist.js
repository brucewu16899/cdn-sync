'use strict'

// Node.JS standard modules

var fs = require('graceful-fs')
var path = require('path')

// 3rd-party modules

var Q = require('q')
var glob = require('glob')
var async = require('async')

// custom modules

var File = require(path.join(__dirname, 'file'))
var GzippedFile = require(path.join(__dirname, 'gzippedfile'))

// promise-bound anti-callbacks

var stat = Q.nbind(fs.stat, fs)

// this module

/**
 * represents a collection of files
 * http://stackoverflow.com/questions/3261587
 * @constructor
 * @param {Array} [files] initial set of File objects
 */
function FileList (files) {
  var arr = []
  if (Array.isArray(files)) {
    arr.push.apply(arr, files)
  }

  Object.keys(FileList.prototype).forEach(function (method) {
    arr[method] = FileList.prototype[method]
  })

  return arr
}
FileList.prototype = {}
FileList.prototype.constructor = FileList

/**
 * @return {Promise} covering the promises of all contained Files
 */
FileList.prototype.ready = function () {
  var dfrd, me
  me = this
  dfrd = Q.defer()
  Q.all(this.map(function (file) {
    return file.promise
  })).done(function () {
    dfrd.resolve(me)
  }, dfrd.reject)
  return dfrd.promise
}

/**
 * @param {String} path identifying path of the desired File
 * @return {Number} index of said File if found, otherwise -1
 */
FileList.prototype.indexOf = function (path) {
  var a, aLength
  if (typeof path !== 'string' || !path) {
    return Array.prototype.indexOf.call(this, path)
  }
  aLength = this.length
  for (a = 0; a < aLength; a += 1) {
    if (this[a].path === path) {
      return a
    }
  }
  return -1
}

FileList.prototype.applyGzipStrategy = function () {
  var gzips
  gzips = this.map(function (file) {
    return new GzippedFile(file)
  })
  return (new FileList(gzips)).ready()
}

FileList.prototype.applyGzipSuffixStrategy = function () {
  return this.applyGzipStrategy().then(function (files) {
    files = files.map(function (file) {
      if (file.path.indexOf('.gz') !== -1) {
        return file
      }
      file.path += '.gz'
      return file
    })
    return (new FileList(files)).ready()
  })
}

FileList.prototype.applyCloneStrategy = function () {
  return (new FileList(this)).ready()
}

/**
 * does not change this FileList, provides a new one for the desired strategy
 * @param {Array|String} strategy
 * @returns {Promise} passed a new {FileList}
 */
FileList.prototype.applyStrategy = function (strategy) {
  var strategies, promises, me
  me = this

  if (typeof strategy === 'string' && strategy) {
    strategy = [strategy]
  }
  if (!Array.isArray(strategy) || !strategy.length) {
    throw new TypeError('provided strategy should be Array or String')
  }

  strategies = {
    'clone': 'applyCloneStrategy',
    'gzip-suffix': 'applyGzipSuffixStrategy',
    'gzip': 'applyGzipStrategy'
  }

  promises = strategy.map(function (s) {
    return me[strategies[s]]()
  })

  return Q.all(promises).then(function (lists) {
    var files = []
    lists.forEach(function (list) {
      files = files.concat(list)
    })
    files.sort(function (a, b) {
      if (a.path < b.path) {
        return -1
      }
      if (a.path > b.path) {
        return 1
      }
      return 0
    })
    return (new FileList(files)).ready()
  })
}

/**
 * @param {String} dir directory to start traversing
 */
FileList.fromPath = function (dir) {
  var dfrd = Q.defer()
  glob('**/*', {
    cwd: dir,
    dot: false,
    mark: true
  }, function (err, files) {
    var results
    if (err) {
      dfrd.reject(err)
      return
    }
    results = []
    files = files.filter(function (file) {
      return file[file.length - 1] !== '/'
    })
    async.eachLimit(files, 100, function (file, done) {
      file = path.join(dir, file)
      stat(file).done(function (stat) {
        var f
        f = new File({
          localPath: file,
          path: file.replace(dir + path.sep, ''),
          size: stat.size
        })
        results.push(f)
        f.promise.then(function () {
          done()
        }, function (err) {
          done(err)
        })
      })
    }, function (err) {
      var fl
      if (err) {
        dfrd.reject(err)
        return
      }
      if (files.length === results.length) {
        fl = new FileList(results)
        fl.ready().then(function () { // onSuccess
          dfrd.resolve(fl)
        }, function (err) { // onError
          dfrd.reject(err)
        })
      }
    })
  })
  return dfrd.promise
}

// exports

module.exports = FileList
