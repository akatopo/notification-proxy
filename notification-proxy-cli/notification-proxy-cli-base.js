module.exports = {
  setCommonOptions,
  getBaseUrl,
  defaultEnv: 'release',
};

function setCommonOptions(program) {
  return program
    .option('-pvk --private-key <file>', 'private key file location')
    .option('-id --device-id <id>', 'id of the device')
    .option('-e --environment <name>', 'local, dev, or production environment');
}

function getBaseUrl(env = 'local') {
  const baseUrls = {
    local: 'http://localhost:8170/akatopo/notification-proxy',
    dev: 'https://akatopo.lib.id/notification-proxy@dev',
    release: 'https://akatopo.lib.id/notification-proxy',
  };

  return baseUrls[env];
}
