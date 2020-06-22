var parser = require('./parser');

var commands = module.exports = {
  expose_container_port_only: function(args) {
    var ports = args.match(/\S+/g);
    var result = [];
    ports.forEach(function(port) {
      if (port.split(':').length > 1) {
        result.push('expose_host_port');
      }
    });

    return result;
  },

  expose_port_valid: function(port) {
    return /^([0-9]{1,4}|[1-5][0-9]{4}|6[0-4][0-9]{3}|65[0-4][0-9]{2}|655[0-2][0-9]|6553[0-5])(\/tcp|\/udp){0,1}$/.test(port);
  },

  label_format: function(args) {
    // format LABEL <key>=<value> <key>=<value> <key>=<value> ...
    // we do not support the old format LABEL <key> <value>
    var result = [];
    try {
      parser.nameVal(args);
    } catch(e) {
      result.push('label_invalid');
    }
    return result;
  },

  base_image_tag: function(args) {
    // scratch is a special base layer for Docker, it means there is no base layer
    if (args === 'scratch') {
      return [];
    }
    var baseImage;
    if (args.includes('@')) {
      baseImage = args.split('@');
    } else {
      baseImage = args.split(' ')[0].split(":");
    }
    var result = [];
    if (baseImage.length === 1) {
      result.push('missing_tag');
    } else if (baseImage[baseImage.length - 1] === 'latest') {
      result.push('latest_tag');
    }

    return result;
  },

  valid_user: function(args) {
    var result = [];
    if (args.trim().match(/\S+/g).length != 1) {
      result.push('extra_args');
    }

    return result;
  },

  valid_maintainer: function(args) {
    var result = [];
    var emails = args.match(/@/g) || [];
    if (emails.length === 0) {
      result.push('missing_args');
    } else if (emails.length > 1) {
      result.push('extra_args');
    }
    result.push('deprecated_in_1.13')

    return result;
  },

  param_count_min: function(args, min_count) {
    return args.match(/\S+/g).length >= min_count;
  },

  is_dir_in_context: function(dir) {
    return (!dir.startsWith('..') && !dir.startsWith('/'));
  },

  is_valid_add: function(args) {
    var result = [];
    if (!commands.param_count_min(args, 2)) {
      result.push('missing_args');
    }

    var hasWildcard = false;
    var sources = args.match(/\S+/g);
    var dest = sources.pop();
    sources.forEach(function(source) {
      if (source.includes('*') || source.includes('?')) {
        hasWildcard = true;
      }
      if (!commands.is_dir_in_context(source)) {
        result.push('add_src_invalid');
      }
    });

    // if there are > 1 source or any source contains a wildcard, then dest must be a dir
    if ((sources.length > 1) || hasWildcard) {
      if (args.slice(-1)[0] !== '/') {
        result.push('add_dest_invalid');
      }
    }

    return result;
  },

  is_valid_workdir: function(args) {
    var result = [];
    // If it's wrapped in quotes, it's ok.
    if (commands.is_wrapped_in_quotes(args)) {
      return result;
    }

    // Now there just cannot be a space
    if (args.match(/\S+/g).length > 1) {
      result.push('invalid_workdir');
    }

    return result;
  },

  is_wrapped_in_quotes: function(args) {
    if (args.startsWith('\'') && args.endsWith('\'')) {
      return true;
    }
    if (args.startsWith('"') && args.endsWith('"')) {
      return true;
    }

    return false;
  },

  is_valid_env: function(args) {
    var words = parser.words(args);
    if (words.length === 0) {
      return [];
    }
    // format ENV <key> <value>
    if (!words[0].includes('=')) {
      return [];
    }
    // format ENV <key>=<value> ...
    var result = [];
    try {
      parser.nameVal(args);
    } catch(e) {
      result.push('invalid_format');
    }
    return result;
  },

  is_valid_shell: function(args) {
    // Dockerfile syntax requires that args be in JSON array format
    var parsed = JSON.parse(args);
    if (parsed.constructor !== Array) {
      return ['invalid_format'];
    }
    return [];
  },
  // valid: HEALTHCHECK NONE  -> disabled
  //        HEALTHCHECK [OPTIONS] CMD
  // options are: --interval=DURATION       --timeout=DURATION
  //              --start-period=DURATION   --retries=N
  is_valid_healtcheck: function(args) {
    args = args.split(' ')
    hc_opts_regex = RegExp(/--(interval|timeout|start-period|retries)=\d+/);
    cmd_position = args.indexOf('cmd');
    cmd_opts = args.slice(cmd_position + 1);

    if (cmd_position !== -1){
      // CMD given, but no tool specified
      if (cmd_opts.length === 0) return ['invalid_format'];
      // HEALTHCHECK options after CMD are invalid
      if (hc_opts_regex.test(cmd_opts)) return ['healthcheck_trailing_opts'];
    }
    // CMD not first arg -> expecting HEALTHCHECK opts
    if (cmd_position !== -1 && cmd_position !== 0){
      healthcheck_opts = args.slice(0, cmd_position);
      for(const opt of healthcheck_opts){
        // only options specified by Docker DSL are valid
        if (!hc_opts_regex.test(opt)) return ['invalid_format'];
      }
    }
    if (args[0] === 'none'){
      if (args.length != 1) return ['invalid_format'];
    }
    else if (cmd_position == -1 && args[0] !== 'none' ) return ['invalid_format'];
    return [];
  }
}