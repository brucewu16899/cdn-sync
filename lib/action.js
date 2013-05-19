/*jslint es5:true, indent:2, maxlen:80, node:true*/
/*jslint nomen:true*/ // Underscore.JS and __dirname
'use strict';

// Node.JS standard modules

var path = require('path');

// 3rd-party modules

// custom modules

var File = require(path.join(__dirname, 'file'));

// promise-bound anti-callbacks

// this module

/**
 * @param {Object} attrs { doUpload, doHeaders, doDelete }
 * @returns {Action}
 * @constructor
 */
function Action(attrs) {
  attrs = attrs || {};
  this.file = attrs.file;
  if (this.file instanceof File) {
    this.path = this.file.path;
  }
  this.path = this.path || attrs.path || '';
  this.doUpload = attrs.doUpload || false;
  this.doHeaders = attrs.doHeaders || false;
  this.doDelete = attrs.doDelete || false;

  if (this.doDelete && !this.path) {
    throw new Error('cannot doDelete without file / path');
  }

  if (!this.file) {
    if (this.doUpload) {
      throw new Error('cannot doUpload without file');
    }
    if (this.doHeaders) {
      throw new Error('cannot doHeaders without file');
    }
  }

  return this;
}

// exports

module.exports = Action;