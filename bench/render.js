const bench = require('fastbench');
const {renderObject} = require('..');
const mustache = require('mustache');

const fixture = require('./fixture.json');

const run = bench(
  [
    function benchPopu(done) {
      renderObject(fixture, fixture.parameters);
      done();
    },
    function benchMustache(done) {
      renderObject(fixture, fixture.parameters, mustache.render);
      done();
    },
  ],
  1000,
);

run(run);
