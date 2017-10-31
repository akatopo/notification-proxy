const { tryAddActionToJob } = require('../db/job-store');

/**
* Adds an action to an existing job, if there was no action added already.
* @param {string} jobId job id
* @param {string} action notification action
* @returns {object}
*/
module.exports = async (jobId, action/* , context */) => {
  await tryAddActionToJob(jobId, action);
  return { data: { success: true, message: 'job updated' } };
};
