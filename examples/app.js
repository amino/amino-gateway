var amino = require('amino');

amino.respond('app', function(router, spec) {
  router.get('/', function() {
    this.res.text("hello world, sincerely " + spec.toString() + "\n");
  });
  console.log('app started on ' + spec.toString());
});
