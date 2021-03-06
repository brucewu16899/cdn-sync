'use strict'

// Node.JS standard modules

var fs = require('fs')
var path = require('path')

// 3rd-party modules

var chai = require('chai')
var assert = require('chai').assert
var sinon = require('sinon')

// custom modules

// promise-bound anti-callbacks

// this module

chai.use(require('sinon-chai'))

suite('File module', function () {
  test('requires without issue', function () {
    var File = require('../lib/file')
    assert(File instanceof Function, 'got File constructor')
  })
})

suite('File object: constructed with no arguments', function () {
  var File, md5Spy, mimeSpy, file

  suiteSetup(function () {
    File = require('../lib/file')
  })

  setup(function () {
    file = new File()
    md5Spy = sinon.spy(file, 'calculateMD5')
    mimeSpy = sinon.spy(file, 'detectMIME')
  })

  test('ready for use', function (done) {
    file.promise.then(function (f) {
      assert(true, 'ready with no failures')
      assert.instanceOf(f, File)
      done()
    }, function () {
      assert(false, 'ready but raised an error')
      done()
    })
  })

  test('no local path', function () {
    assert(!file.localPath, 'no localPath set')
  })

  test('no MIME', function () {
    assert(!file.mime, 'no MIME set')
  })

  test('no MD5', function () {
    assert(!file.md5, 'no MD5 set')
  })

  test('skip calculateMD5', function () {
    assert(!md5Spy.called, 'calculateMD5 method never called')
  })

  test('skip detectMIME', function () {
    assert(!mimeSpy.called, 'detectMIME method never called')
  })

  teardown(function () {
    file.calculateMD5.restore()
    file.detectMIME.restore()
  })
})

suite('File object: constructed with local path and MIME', function () {
  var File, md5Spy, mimeSpy, file

  suiteSetup(function () {
    File = require('../lib/file')
  })

  setup(function () {
    file = new File({
      localPath: 'fake/path/to/file.json',
      mime: 'application/json',
      md5: '649530ee65cbb20c69be85ff7582fd88',
      size: 123
    })
    md5Spy = sinon.spy(file, 'calculateMD5')
    mimeSpy = sinon.spy(file, 'detectMIME')
  })

  test('ready for use', function (done) {
    file.promise.then(function (f) {
      assert(true, 'ready with no failures')
      assert.instanceOf(f, File)
      done()
    }, function () {
      assert(false, 'ready but raised an error')
      done()
    })
  })

  test('local path set as constructed', function () {
    assert.equal(file.localPath, 'fake/path/to/file.json', 'localPath set')
  })

  test('MIME set as constructed', function () {
    assert.equal(file.mime, 'application/json', 'MIME set')
  })

  test('MD5 set as constructed', function () {
    assert.equal(file.md5, '649530ee65cbb20c69be85ff7582fd88', 'MD5 set')
  })

  test('skip calculateMD5', function () {
    assert(!md5Spy.called, 'calculateMD5 method never called')
  })

  test('skip detectMIME', function () {
    assert(!mimeSpy.called, 'detectMIME method never called')
  })

  teardown(function () {
    file.calculateMD5.restore()
    file.detectMIME.restore()
  })
})

suite('File object: clone', function () {
  var File, fileA, fileB

  suiteSetup(function () {
    File = require('../lib/file')
  })

  setup(function () {
    fileA = new File({
      localPath: 'fake/path/to/file.json',
      mime: 'application/json',
      md5: '649530ee65cbb20c69be85ff7582fd88',
      size: 123
    })
  })

  test('clone returns a File', function () {
    fileB = fileA.clone()
    assert(fileB instanceof File, 'new object is an instance of File')
  })

  test('local path set as cloned', function () {
    assert.equal(fileA.localPath, fileB.localPath, 'localPath set')
  })

  test('MIME set as cloned', function () {
    assert.equal(fileA.mime, fileB.mime, 'MIME set')
  })

  test('MD5 set as cloned', function () {
    assert.equal(fileA.md5, fileB.md5, 'MD5 set')
  })

  test('not the same object', function () {
    assert.notEqual(fileA, fileB, 'separate objects')
  })
})

suite('File object: this file', function () {
  var File, file

  suiteSetup(function () {
    File = require('../lib/file')
    file = new File({
      localPath: __filename,
      path: path.basename(__filename)
    })
  })

  test('ready for use', function (done) {
    file.promise.then(function (f) {
      assert(true, 'ready with no failures')
      assert.equal(file, f, 'returned self when ready')
      done()
    }).done()
  })

  test('path set', function () {
    assert(file.path, 'path set')
  })

  test('local path set', function () {
    assert(file.localPath, 'localPath set')
  })

  test('MIME set', function () {
    assert.equal(file.mime, 'application/javascript', 'MIME set')
  })

  test('MD5 set', function () {
    assert(file.md5, 'MD5 set')
  })

  test('size set', function (done) {
    assert.isNumber(file.size, 'size set')
    assert(file.size > 0, 'size > 0')
    fs.stat(file.localPath, function (err, stat) {
      assert(!err, 'no error stat\'ing this file')
      assert.equal(file.size, stat.size, 'size is correct')
      done()
    })
  })
})

suite('File#setMIME()', function () {
  var File

  suiteSetup(function () {
    File = require(path.join('..', 'lib', 'file'))
  })

  test('LICENSE: text/plain', function () {
    var file
    file = new File({
      path: 'LICENSE'
    })
    file.setMIME('text/plain')
    assert.equal(file.mime, 'text/plain')
    assert.equal(file.headers['Content-Type'], 'text/plain')
  })

  test('LICENSE: application/octet-stream', function () {
    var file
    file = new File({
      path: 'LICENSE'
    })
    file.setMIME('application/octet-stream')
    assert.equal(file.mime, 'text/plain')
    assert.equal(file.headers['Content-Type'], 'text/plain')
  })

  test('LICENSE.gz: text/plain', function () {
    var file
    file = new File({
      path: 'LICENSE.gz'
    })
    file.setMIME('text/plain')
    assert.equal(file.mime, 'text/plain')
    assert.equal(file.headers['Content-Type'], 'text/plain')
  })

  test('LICENSE.gz: application/octet-stream', function () {
    var file
    file = new File({
      path: 'LICENSE.gz'
    })
    file.setMIME('application/octet-stream')
    assert.equal(file.mime, 'text/plain')
    assert.equal(file.headers['Content-Type'], 'text/plain')
  })

  test('LICENSE.txt: text/plain', function () {
    var file
    file = new File({
      path: 'LICENSE.txt'
    })
    file.setMIME('text/plain')
    assert.equal(file.mime, 'text/plain')
    assert.equal(file.headers['Content-Type'], 'text/plain')
  })

  test('LICENSE.txt.gz: text/plain', function () {
    var file
    file = new File({
      path: 'LICENSE.txt.gz'
    })
    file.setMIME('text/plain')
    assert.equal(file.mime, 'text/plain')
    assert.equal(file.headers['Content-Type'], 'text/plain')
  })
})
