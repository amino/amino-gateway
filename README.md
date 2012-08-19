amino-gateway
=============

Clusterable http proxy for [Amino](https://github.com/cantina/amino) services

[![build status](https://secure.travis-ci.org/cantina/amino-gateway.png)](http://travis-ci.org/cantina/amino-gateway)

Idea
----

  - First, use Amino's `respond()` API to create an "app" service.
  - Start one or more of those servers.
  - Start one or more `amino-gateway` servers.
  - HTTP requests to your gateway servers will pipe to your app servers,
    auto-loadbalancing between them without any further configuration. Easy!

Requirements
------------

You'll also need one or more Amino processes implementing the `respond()` API
to provide an "app" service (or a service specified by `--service`).

See [Amino](https://github.com/cantina/amino) for more information.

Install
-------

```bash
$ npm install -g amino-gateway
```

Also make sure you have an `/etc/amino.conf` set up which has the same drivers/options
as used by your app services.

Usage
-----

```bash
$ amino-gateway [[--port] [--service] [--threads] [--conf]]
```

Examples
--------

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

**Run on specific number of threads**

```bash
$ amino-gateway --threads=8
```

**Specify a conf file:**

See `etc/gateway.json` for the file's syntax.

```bash
$ amino-gateway --conf ../path/to/my/conf.json
```

The conf file can also have an "amino" key, corresponding to the Amino configuration to
use. This will override `/etc/amino.conf`.

If you'd rather not pass a conf path every time, you can put a system-wide conf at
`/etc/amino/gateway.json`.

Sticky Sessions
---------------

`amino-gateway` supports
[consistent hash](http://en.wikipedia.org/wiki/Consistent_hashing)-based sticky
sessions.

__To enable sticky sessions, first add `"stickyEnable": true` to your
`gateway.json`.__

You may use **one** of the following methods:

- cookie: Add `"stickyCookie": "your_cookie_name"` to maintain sticky sessions
  based on the value of a cookie.
- IP: Add `"stickyIP": true` to hash sticky sessions based on the remote IP
  address.
- query string: Add `"stickyQuery": "your_querystring_variable_name"` to hash
  sticky sessions based on the value of a GET variable.

LICENSE
-------

MIT