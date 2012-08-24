amino-gateway
=============

Clusterable load-balancer for [Amino](https://github.com/amino/amino) services

[![build status](https://secure.travis-ci.org/amino/amino-gateway.png)](http://travis-ci.org/amino/amino-gateway)

Features
--------

- Round-robin load-balancer for an [Amino](https://github.com/amino/amino) service.
- Backend servers added/removed to the rotation automatically
- Sticky sessions via cookie, IP, GET variable, or header
- Supports websockets, streaming
- Multi-threaded, high performance

Install
-------

```bash
$ npm install -g amino-gateway
```

Usage
-----

```bash
$ amino-gateway [OPTIONS]
```

Options
-------

- `--service` (`-s`): Name of the service to . Optionally, you can add `@version` to
  limit to a specific [semver](http://semver.org/) range. (Default: `app`)
- `--threads` (`-t`): Number of threads to use. (Default: number of CPU cores)
- `--version` (`-v`): Display the version and exit.
- `--port` (`-p`): Port to listen on. (Default: `8080`)
- `--redis=host:port`: Specify host and port of Amino's redis server(s). Use
  multiple `--redis` args for multiple servers. (Default: `localhost:6379`)
- `--sockets`: Max number of sockets to simultaneously open with backends.
  (Default: `25000`)
- `--sticky.ip`: Enable sticky sessions based on remote IP address.
- `--sticky.cookie`: Specify the name of a cookie to be used for sticky sessions.
- `--sticky.query`: Specify a GET variable to be used for sticky sessions.

---

Developed by [Terra Eclipse](http://www.terraeclipse.com)
---------------------------------------------------------

Terra Eclipse, Inc. is a nationally recognized political technology and
strategy firm located in Aptos, CA and Washington, D.C.

[http://www.terraeclipse.com](http://www.terraeclipse.com)

License: MIT
------------

- Copyright (C) 2012 Carlos Rodriguez (http://s8f.org/)
- Copyright (C) 2012 Terra Eclipse, Inc. (http://www.terraeclipse.com/)

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished
to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.