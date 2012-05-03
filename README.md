amino-gateway
===============

Clusterable http proxy for [amino](https://github.com/cantina/amino) services

Idea
----

  - First, use amino's `respond()` API to create an "app" service.
  - Start one or more of those servers.
  - Start one or more `amino-gateway` servers.
  - HTTP requests to your gateway servers will pipe to your app servers,
    auto-loadbalancing between them without any further configuration. Easy!

Requirements
------------

You'll also need one or more amino processes implementing the `respond()` API
to provide an "app" service (or a service specified by `--service`).
See [amino](https://github.com/cantina/amino) for more information.

Install
-------

```bash
$ npm install -g amino-gateway
```

Usage
-----

**Start a gateway with default settings:**

```bash
$ amino-gateway
```

**Start a gateway on port 8000:**

```bash
$ amino-gateway -p 8000
```

**Start a gateway to proxy to "foo" service:**

```bash
$ amino-gateway --service foo
```

**Specify a conf file:**

This is important if your redis server runs on a separate host. See `etc/gateway.json` for the file's syntax.

```bash
$ amino-gateway --conf ../path/to/my/conf.json
```