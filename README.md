amino-gateway
===============

Clusterable http proxy for [amino](https://github.com/cantina/amino) services

Usage
-----

  - First, use amino's `respond()` API to create an "app" service.
  - Start one or more of those servers.
  - Start one or more `amino-gateway` servers.
  - HTTP requests to your gateway servers will pipe to your app servers,
    auto-loadbalancing between them without any further configuration. Easy!

**Start a gateway with default settings:**

```bash
$ ./bin/gateway.js
```

**Start a gateway on port 8000:**

```bash
$ ./bin/gateway.js -p 8000
```

**Start a gateway to proxy to "foo" service:**

```bash
$ ./bin/gateway.js --service foo
```

**Specify a conf file:**

```bash
$ ./bin/gateway.js --conf ../path/to/my/conf.json
```