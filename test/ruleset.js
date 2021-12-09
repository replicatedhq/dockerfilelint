module.exports.rules = {
  'add_prohibited': {
    'title': 'ADD Command Prohibited',
    'description': 'ADD command is not allowed! Use copy instead!',
    'category': 'Optimization',
    'function': ({ cmd, args, line, instruction }) => {
      return cmd.toLowerCase() === 'add';
    }
  },

  'avoid_curl_bashing': {
    'title': 'Avoid Curl Bashing',
    'description': 'Do not pipe bash or wget commands directly to shell. This is very insecure and can cause many issues with security. If you must, make sure to vet the script and verify its authenticity. E.G. "RUN wget http://my_website/script.sh | sh" is prohibited',
    'category': 'Optimization',
    'function': ({ cmd, line, args}) => {
      // This function doesn't care about full instruction so it omits if from arguments
      return cmd.toLowerCase() === 'run' && args.match(/(curl|wget)[^|^>]*[|>]/);
    }
  },
}