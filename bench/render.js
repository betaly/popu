const bench = require('fastbench');
const {renderObject} = require('..');
const mustache = require('mustache');
const Handlebars = require('handlebars');

const fixture = require('./fixture.json');

const HandlebarsCache = {};

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
    function benchHandlebars(done) {
      renderObject(fixture, fixture.parameters, (value, data) => {
        if (!HandlebarsCache[value]) {
          HandlebarsCache[value] = Handlebars.compile(value);
        }
        return HandlebarsCache[value](data);
      });
      done();
    },
  ],
  1000,
);

run();
