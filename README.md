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
- Maintenance mode with posix signal toggle (SIGUSR2)

Install
-------

```bash
$ npm install -g amino-gateway
```

Usage
-----

```

  Usage: amino-gateway [options]

  Options:

    -h, --help                              output usage information
    -V, --version                           output the version number
    -p, --port <port>                       port to listen on (default: 8080)
    -s, --service <name[@version]>          amino service to proxy to, with optional semver (default: app)
    -t, --threads <num>                     number of threads to use (default: CPU count)
    -r, --redis <port/host/host:port/list>  redis server(s) used by amino service (can be comma-separated)
    --stickyQuery <name>                    name of a GET variable to base sticky sessions on
    --stickyIp                              enable sticky sessions based on remote IP address
    --stickyCookie <cookie name>            name of a cookie to base sticky sessions on
    --setuid <uid|username>                 (POSIX, requires root) run under this uid (or username)
    --setgid <gid|groupname>                (POSIX, requires root) run under this gid (or groupname)
    --maintMode                             start in maintenance mode. (alternatively send SIGUSR2 to toggle maintenance mode)
    --maintPage <path>                      path to an html file to be served when maintenance mode is enabled
    --maintIps <ips>                        comma-separated list of IP addresses able to bypass maintenance mode

```

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