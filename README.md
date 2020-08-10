# Linter and validator for Dockerfile

[![Coverage Status](https://coveralls.io/repos/github/replicatedhq/dockerfilelint/badge.svg?branch=master)](https://coveralls.io/github/replicatedhq/dockerfilelint?branch=master)
[![Build Status](https://travis-ci.org/replicatedhq/dockerfilelint.svg?branch=master)](https://travis-ci.org/replicatedhq/dockerfilelint)

`dockerfilelint` is an node module that analyzes a Dockerfile and looks for common traps, mistakes and helps enforce best practices.

## Installation

Global installation with npm package manager.

```shell
npm install -g dockerfilelint
```

## Testing
Start unit tests with `npm test`, `yarn run test`, or `docker-compose -f docker-compose.test.yml up`

## Running

#### From the command line:

```shell
./bin/dockerfilelint <path/to/Dockerfile>
```

#### Command Line options

```shell
Usage: dockerfilelint [files | content..] [options]

Options:
  -o, --output   Specify the format to use for output of linting results. Valid values
                 are `json` or `cli` (default).                               [string]
  -j, --json     Output linting results as JSON, equivalent to `-o json`.    [boolean]
  -v, --version  Show version number                                         [boolean]
  -h, --help     Show help                                                   [boolean]

Examples:
  dockerfilelint Dockerfile         Lint a Dockerfile in the current working
                                    directory

  dockerfilelint test/example/* -j  Lint all files in the test/example directory and
                                    output results in JSON

  dockerfilelint 'FROM latest'      Lint the contents given as a string on the
                                    command line

  dockerfilelint < Dockerfile       Lint the contents of Dockerfile via stdin
```

#### Configuring

You can configure the linter by creating a `.dockerfilelintrc` with the following syntax:
```yaml
rules:
  uppercase_commands: off
```

The keys for the rules can be any file in the /lib/reference.js file.  At this time, it's only possible to disable rules.  They are all enabled by default.

The following rules are supported:
```
required_params
uppercase_commands
from_first
invalid_line
sudo_usage
apt-get_missing_param
apt-get_recommends
apt-get-upgrade
apt-get-dist-upgrade
apt-get-update_require_install
apkadd-missing_nocache_or_updaterm
apkadd-missing-virtual
invalid_port
invalid_command
expose_host_port
label_invalid
missing_tag
latest_tag
extra_args
missing_args
add_src_invalid
add_dest_invalid
invalid_workdir
invalid_format
apt-get_missing_rm
deprecated_in_1.13
```

#### From a Docker container

(Replace the ``pwd``/Dockerfile with the path to your local Dockerfile)
```shell
docker run -v `pwd`/Dockerfile:/Dockerfile replicated/dockerfilelint /Dockerfile
```

#### Online

If you don't want to install this locally you can try it out on  [https://fromlatest.io](https://www.fromlatest.io/#/).

## Checks performed

### `FROM`

- [x] This should be the first command in the Dockerfile
- [x] Base image should specify a tag
- [x] Base image should not use latest tag
- [x] Support `FROM scratch` without a tag
- [x] Support the `FROM <image>@<digest>` syntax
- [ ] Allow config to specify "allowed" base layers

### `MAINTAINER`

- [x] Should be followed by exactly 1 parameter (@ sign)

### `RUN`

- [x] sudo is not included in the command
- [x] apt-get [install | upgrade | remove] should include a -y flag
- [x] apt-get install commands should include a `--no-install-recommends` flag
- [x] apt-get install commands should be paired with a `rm -rf /var/lib/apt/lists/*` in the same layer
- [x] Avoid running `apt-get upgrade` or `apt-get dist-upgrade`
- [x] Never run `apt-get update` without `apt-get install` on the same line
- [x] apk add commands should include a `--no-cache` flag or be paired with an `--update` flag with `rm -rf /var/cache/apk/*` in the same layer
- [x] apk add support for --virtual flag
- [ ] handle best practices for yum operations and cleanup

### `CMD`

- [x] Only a single `CMD` layer is allowed
- [ ] Better handling of escaped quotes
- [ ] Detect exec format with expected variable substitution

### `LABEL`

- [x] Format should be key=value

### `EXPOSE`

- [x] Only the container port should be listed
- [ ] All ports should be exposed in a single cache layer (line)
- [ ] The same port number should not be exposed multiple times
- [x] Exposed ports should be numeric and in the accepted range

### `ENV`

- [x] Format of `ENV`
- [ ] Best practice of only using a single `ENV` line to reduce cache layer count

### `ADD`

- [x] Command should have at least 2 parameters
- [x] Source command(s) cannot be absolute or relative paths that exist outside of the current build context
- [x] Commands with wildcards or multiple sources require that destination is a directory, not a file
- [ ] If an `ADD` command could be a `COPY`, then `COPY` is preferred
- [ ] Using `ADD` to fetch remote files is discouraged because they cannot be removed from the layer

### `COPY`

- [ ] Implement checking (similar to ADD)
- [ ] Do not `COPY` multiple files on a single command to best use cache

### `ENTRYPOINT`

- [ ] Support

### `VOLUME`

- [ ] Format
- [ ] Any build steps after VOLUME is declare should not change VOLUME contents
- [ ] If JSON format, double quotes are required

### `USER`

- [x] Should be followed by exactly 1 parameter

### `WORKDIR`

- [x] Validate that it has exactly 1 parameter
- [x] `WORKDIR` can only expand variables previously set in `ENV` commands

### `ARG`

- [ ] Support
- [ ] Prevent redefining the built in ARGs (proxy)

### `ONBUILD`

- [ ] Support

### `STOPSIGNAL`

- [ ] Validate input
- [ ] Only present one time

### `HEALTHCHECK`
- [x] No additional parameters when only parameter is `NONE`
- [x] Options before `CMD` are valid
- [x] Options before `CMD` have additional arguments

### Misc

- [x] Only valid Dockerfile commands are present
- [x] All commands should have at least 1 parameter
- [x] Check that commands are written as upper case commands
