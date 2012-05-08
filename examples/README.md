amino-gateway examples
----------------------

To use the example, first install the dependency:

```bash
$ cd examples
$ npm install
```

Start up two app servers in separate windows:

```bash
$ node app.js --debug
```

Install `amino-gateaway` if you haven't already, then start:

```bash
$ npm install -g amino-gateway
$ amino-gateway --debug
```

Try making curl requests to the gateway:

```bash
$ curl --url http://localhost:8080/
```

You should be able to stop one of the app servers, and still get responses.

For even more fun, you can start multiple gateways:

```bash
$ amino-gateway -p 8081 --debug
```

Et cetera!
