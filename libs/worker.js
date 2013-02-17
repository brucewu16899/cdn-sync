// Node.JS standard modules

var path = require('path');

// 3rd-party modules

var Q = require('q');

// custom modules

var Queue = require(path.join(__dirname, 'queue'));

// promise-bound anti-callbacks

// this module

var Worker = function(queue) {
  var self = this;
  if (queue instanceof Queue) {
    this.queue = queue;
    this.queue.on('occupied', function() {
      self.checkQueue();
    });
  } else {
    throw new Error('Worker constructor expects a Queue');
  }
  this.checkQueue();
  return this;
};

Worker.prototype.checkQueue = function() {
  var self = this,
      job = this.queue.shift(),
      result,
      next = function() {
        process.nextTick(function() {
          self.checkQueue();
        });
      };

  if (!job) {
    return;
  }
  result = job.fn();
  if (Q.isPromise(result)) {
    result.then(function() {
      job.dfrd.resolve.apply(dfrd, arguments);
    }).fail(function() {
      job.dfrd.resolve.apply(dfrd, arguments);
    });
  } else {
    job.dfrd.resolve(result);
    next();
  }
};

// exports

module.exports = Worker;
