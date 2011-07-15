var connect = require('connect');

var server = connect.createServer();

server.use(connect.static(__dirname+'/public'));

var port = process.env.PORT;
server.listen(port);
console.log('Listening on '+port+'...');