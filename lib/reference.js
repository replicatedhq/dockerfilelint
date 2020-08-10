var reference = module.exports = {
  'required_params': {
    'title': 'Missing Required Arguments',
    'description': `All commands in a Dockerfile require at least 1 argument.
A line in a Dockerfile can be in any of the following formats:
* * *
#### \`# Comment\`
Docker will treat any line that begins with a \`#\` as a comment.
* * *
#### \`INSTRUCTION arguments\`
All instructions require at least 1 argument, and should be on the same line as the \`INSTRUCTION\`.
* * *
#### \`RUN\` continuation
If a \`RUN\` line ends with a \`\\\`, the next line will be treated as part of the same \`RUN\` arguement.
* * *
#### Blank or Whitespace
Blank lines are allowed and will be ignored.
* * *`,
    'category': 'Possible Bug'
  },

  'uppercase_commands': {
    'title': 'Capitalize Dockerfile Instructions',
    'description': `For clarity and readability, all instructions in a Dockerfile should be uppercase.
This is a convention adopted by most of the official images and greatly improves readability in long Dockerfiles.  For an example of
why this makes a difference, check out the current [redis Dockerfile](https://github.com/docker-library/redis/blob/b375650fb69b7db819e90c0033433c705b28656e/3.0/Dockerfile)
and you should be able to easily see the instructions used.`,
    'category': 'Clarity'
  },

  'from_first': {
    'title': 'First Command Must Be FROM or ARG',
    'description': 'The first instruction in a Dockerfile must specify the base image using a FROM command or an ARG command to modify the FROM command.  Additionally, FROM cannot appear later in a Dockerfile.',
    'category': 'Possible Bug'
  },

  'invalid_line': {
    'title': 'Invalid Line',
    'description': 'This line is not a valid Dockerfile line.',
    'category': 'Possible Bug'
  },

  'sudo_usage': {
    'title': 'Use Of sudo Is Not Allowed',
    'description': `Use of \`sudo\` is not allowed in a Dockerfile.  From the official document [Best practices for writing Dockerfiles](https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/):
> You should avoid installing or using \`sudo\` since it has unpredictable TTY and signal-forwarding behavior that can cause more problems than it solves.
> If you absolutely need functionality similar to \`sudo\` (e.g., initializing the daemon as root but running it as non-root), you may be able to use \`gosu\`.`,
    'category': 'Possible Bug'
  },

  'apt-get_missing_param': {
    'title': 'Missing parameter for `apt-get`',
    'description': 'Usage of `apt-get` should include a `-y` flag to ensure it will not block while waiting for input.',
    'category': 'Possible Bug'
  },

  'apt-get_recommends': {
    'title': 'Consider `--no-install-recommends`',
    'description': `Consider using a \`--no-install-recommends\` when \`apt-get\` installing packages.  This will result in a smaller image size.  For
more information, see [this blog post](http://blog.replicated.com/2016/02/05/refactoring-a-dockerfile-for-image-size/)`,
    'category': 'Optimization'
  },

  'apt-get-upgrade': {
    'title': '`apt-get upgrade` Is Not Allowed',
    'description': `Use of \`apt-get upgrade\` is not allowed in a Dockerfile.  From the [best practices - take 2](http://crosbymichael.com/dockerfile-best-practices-take-2.html) blog post:
> Updates will be baked into the based images you don't need to apt-get upgrade your containers. Because of the isolation that happens this can often fail if something is
> trying to modify init or make device changes inside a container. It also produces inconsistent images because you no longer have one source of truth of how your application
> should run and what versions of dependencies are included in the image.
>
> If there are security updates that a base image needs, let upstream know so that they can update it for everyone and ensure that your builds are consistent again.`,
    'category': 'Optimization'
  },
  'apt-get-dist-upgrade': {
      'title': 'apt-get dist-upgrade Is Not Allowed',
      'description': 'Use of `apt-get dist-upgrade` is not allowed in a Dockerfile.',
      'category': 'Optimization'
  },
  'apt-get-update_require_install': {
      'title': 'apt-get update without matching apt-get install',
      'description': 'All instances of `apt-get update` should have the `apt-get install` commands on the same line to reduce image size.',
      'category': 'Optimization'
  },
  'apkadd-missing_nocache_or_updaterm': {
    'title': 'Consider `--no-cache or --update with rm -rf /var/cache/apk/*`',
    'description': `Consider using a \`--no-cache\` (supported in alpine linux >= 3.3) or \`--update\` followed by the command \`rm -rf /var/cache/apk/*\` when \`apk\` adding packages.  This will result in a smaller image size.  For
more information, see [this link](https://github.com/gliderlabs/docker-alpine/blob/master/docs/usage.md)`,
    'category': 'Optimization'
  },
  'apkadd-missing-virtual': {
    'title': 'Consider `--virtual` when using apk add and del together in a command.',
    'description': `Consider using a \`--virtual\` or \`-t\` switch to group multiple packages for easy cleanup.  This will help ensure future authors will continue to clean up build dependencies and other temporary packages.  For
more information, see [this link](https://github.com/gliderlabs/docker-alpine/blob/master/docs/usage.md#virtual-packages)`,
    'category': 'Optimization'
  },
  'invalid_port': {
      'title': 'Invalid Port Exposed',
      'description': 'Exposing ports should only be valid port numbers.',
      'category': 'Possible Bug'
  },
  'invalid_command': {
      'title': 'Invalid Command',
      'description': 'Only valid commands are allowed in a Dockerfile.',
      'category': 'Possible Bug'
  },
  'expose_host_port': {
      'title': 'Expose Only Container Port',
      'description': `Using \`EXPOSE\` to specify a host port is not allowed.  While early versions of Docker supported this syntax, it has been deprecated from some time now.

If image authors were to include the host port in the image, it would greatly reduce portability of the image.  It's best to document the container ports available and let the
container create/start process manage the mapping to host ports using either of the following methods:

- \`docker run -P image\`:  (capital P) This will map any port you have an \`EXPOSE\` line for in the Dockerfile to a random host port.
- \`docker run -p container_port:host_port image\`:  (lower case p) This will define the host port to map to the container port.`,
      'category': 'Deprecation'
  },
  'label_invalid': {
      'title': 'Label Is Invalid',
      'description': 'Using LABEL should be in key=value format.',
      'category': 'Possible Bug'
  },
  'missing_tag': {
      'title': 'Base Image Missing Tag',
      'description': 'Base images should specify a tag to use.',
      'category': 'Clarity'
  },
  'latest_tag': {
      'title': 'Base Image Latest Tag',
      'description': 'Base images should not use the latest tag.',
      'category': 'Clarity'
  },
  'extra_args': {
      'title': 'Extra Arguments',
      'description': 'This command has extra arguments and will be ignored.',
      'category': 'Possible Bug'
  },
  'missing_args': {
      'title': 'Missing Arguments',
      'description': 'This command requires additional arguments.',
      'category': 'Possible Bug'
  },
  'deprecated_in_1.13': {
      'title': 'Deprecated as of Docker 1.13',
      'description': 'This INSTRUCTION is deprecated as of Docker 1.13',
      'category': 'Deprecation'
  },
  'add_src_invalid': {
      'title': 'Invalid ADD Source',
      'description': 'All files referenced in an ADD command should be part of the Docker build context.',
      'category': 'Possible Bug'
  },
  'add_dest_invalid': {
      'title': 'Invalid ADD Destination',
      'description': 'When adding multiple files, the destination should be a directory.',
      'category': 'Possible Bug'
  },
  'invalid_workdir': {
      'title': 'Invalid WORKDIR',
      'description': 'Using a WORKDIR parameter that has spaces should be escaped.',
      'category': 'Possible Bug'
  },
  'invalid_format': {
      'title': 'Invalid Argument Format',
      'description': 'The arguments to this command are invalid',
      'category': 'Possible Bug'
  },
  'apt-get_missing_rm': {
      'title': 'apt-get update with matching cache rm',
      'description': 'Use of apt-get update should be paired with rm -rf /var/lib/apt/lists/* in the same layer.',
      'category': 'Optimization'
  },
  'healthcheck_options_missing_args': {
      'title': 'Missing Argument for HEALTHCHECK option',
      'description': 'HEALTHCHECK options (like \'--timeout\') must have extra arguments (e.g. `\--timeout=30s\') ',
      'category': 'Possible Bug'
  }
}
