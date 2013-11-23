'use strict';
var argv = require('optimist').alias('c', 'classpath').argv;
argv.classpath = argv.classpath || '.';
var util = require('util'),
    Gremlin = require('../lib/gremlin'),
    gremlin = new Gremlin({ classpath: util.isArray(argv.classpath) ? argv.classpath : [ argv.classpath ] }),
    GraphWrapper = require('../lib/graph-wrapper'),
    PipelineWrapper = require('../lib/pipeline-wrapper'),
    T = gremlin.Tokens,
    repl = require('repl'),
    vm = require('vm')/*,
    require('repl.history')(repl, './.node_history')*/;

var TinkerGraphFactory = gremlin.java.import('com.tinkerpop.blueprints.impls.tg.TinkerGraphFactory');
process.stdout.write('\n');
process.stdout.write('         \\,,,/' + '\n');
process.stdout.write('         (o o)' + '\n');
process.stdout.write('-----oOOo-(_)-oOOo-----' + '\n');

var r = repl.start({
    prompt: 'gremlin> ',
    input: process.stdin,
    output: process.stdout,
    terminal: true,
    writer: outFunc,
    ignoreUndefined: true,
    eval: evalFunc
});

function _isObject(o) {
    return Object.prototype.toString.call(o) === '[object Object]';
}

function outFunc(it){
    var arr, msg;
    if (it && it.toStringSync) {
        process.stdout.write('==>' + it.toStringSync() + '\n');
    } else {
        return repl.writer(it);
    }
    return '';
}

function evalFunc(code, context, file, cb) {
  var err, result, async = false;
  context.sync = function () {
    async = true;
    return function (err, res) {
      handleResult(err, res, context, cb);
    }
  };
  try {
    result = vm.runInContext(code, context, file);
  } catch (e) {
    err = e;
  }
  if (err && process.domain) {
    process.domain.emit('error', err);
    process.domain.exit();
  }
  else if (!async) handleResult(err, result, context, cb);
};

function handleResult(err, result, context, cb) {
  if (_isObject(result) && result.constructor === PipelineWrapper) {
    var method = 'toJSON';
    if (context.list) method = 'toList';
    if (context.next) method = 'next'
    result[method](cb);
  } else {
    cb(err, result);
  }
}

r.context.gremlin = gremlin;
r.context.TinkerGraphFactory = TinkerGraphFactory;
r.context.GraphWrapper = GraphWrapper;
r.context.java = gremlin.java;
r.context.sync = function (err, res) { }; // Stub so autocomplete picks it up

try {
    var TitanFactory = gremlin.java.import('com.thinkaurelius.titan.core.TitanFactory');
    var GraphOfTheGodsFactory = gremlin.java.import('com.thinkaurelius.titan.example.GraphOfTheGodsFactory');
    r.context.TitanFactory = TitanFactory; //TitanFactory.openSync('./tmp/titan');
    r.context.GraphOfTheGodsFactory = GraphOfTheGodsFactory;
} catch (e) {
    console.log("No Titan classes available");
}


r.on('exit', function () {
    console.log('Good-bye from Gremlin!');
    process.exit();
});