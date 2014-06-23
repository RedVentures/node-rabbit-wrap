var Fixture = require('../lib/fixture');

describe('Fixture', function () {
  describe('#add', function () {
    it('should accept a function name to be called on a dependency', function () {
      var fix = new Fixture();
      fix.add('setName', 'obj', ['bob', 'jones']);
      fix.calls.should.eql([{f: 'setName', dep: 'obj', args: ['bob', 'jones']}]);
    });
  });

  describe('#dep', function () {
    it('should set a dependency', function () {
      var fix = new Fixture();
      var dependency = {name: 'Hi there'};
      fix.dep('test', dependency);
      fix.deps.test.should.be.exactly(dependency);
    });
  });

  describe('#run', function () {
    var fix;
    var obj;
    before(function () {
      obj = {
        firstName: null,
        lastName: null,
        setName: function (firstName, lastName) {
          this.firstName = firstName;
          this.lastName = lastName;
          return 'ok';
        },
        getName: function () {
          return this.firstName + this.lastName;
        }
      };
      fix = new Fixture();
      fix.add('setName', 'obj', ['bob','jones']);
      fix.add('getName', 'obj', []);
      fix.dep('obj', obj);
    });

    it('should return a promise-like object', function () {
      fix.run().then.should.be.a.Function;
    });

    it('should run a list of functions on registered dependencies', function (done) {
      fix.run().then(function (res) {
        try {
          res[0].should.eql('ok');
          res[1].should.eql('bobjones');
          done();
        } catch (e) {
          return done(e);
        }
      });
    });
  });

  describe('#remove', function () {
    var fix;
    var obj;
    beforeEach(function () {
      obj = {
        firstName: null,
        lastName: null,
        setName: function (firstName, lastName) {
          this.firstName = firstName;
          this.lastName = lastName;
          return 'ok';
        },
        getName: function () {
          return this.firstName + this.lastName;
        }
      };
      fix = new Fixture();
      fix.add('setName', 'obj', ['bob','jones']);
      fix.add('getName', 'obj', []);
      fix.dep('obj', obj);
    });

    it('should remove a call from the stack', function () {
      fix.remove('setName', 'obj');
      fix.calls.should.eql(
        [
          null,
          {f: 'getName', dep: 'obj', args: []}
        ]
      );
    });

    it('should prevent removed functions from being called again', function (done) {
      fix.remove('getName', 'obj');
      fix.run().then(function (res) {
        try {
          (!!res[1]).should.be.nok;
          res[0].should.eql('ok');
          done();
        } catch (e) {
          return done(e);
        }
      });
    });

    it('should filter arguments with an optional function', function (done) {
      fix.add('setName', 'obj', ['dude', 'bro']);
      fix.add('setName', 'obj', ['not', 'called']);
      fix.remove('setName', 'obj', function (args) {
        return args[0] === 'dude' && args[1] === 'bro';
      });

      fix.run().then(function () {
        try {
          (!!obj.firstName).should.be.ok;
          (!!obj.lastName).should.be.ok;
          obj.firstName.should.eql('not');
          obj.lastName.should.eql('called');
          done();
        } catch (e) {
          return done(e);
        }
      });
    });

  });
});