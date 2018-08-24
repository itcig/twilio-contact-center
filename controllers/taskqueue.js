const Twilio = require('twilio')

const client = new Twilio(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN)

const taskQueues = client.taskrouter.workspaces(process.env.TWILIO_WORKSPACE_SID).taskQueues

/**
 * This is to list the TaskQueues
 */
module.exports.getTaskQueues = function (req, res) {

	taskQueues.list()
		.then(queues => {
			let payload =[]

			queues.forEach(queue => {
				payload.push({
					sid: queue.sid,
					friendlyName: queue.friendlyName
				})
			})

			res.status(200).json(payload)
		}).catch(error => {
			res.status(500).send(res.convertErrorToJSON(error))
		})
}

/**
 * Get Real Time and Historical Stats for a specified TaskQueue
 * .
 * The Real Time stats are identical from this route except this includes the task SID of the longest waiting task
 * .
 * The Cumulative (historic) stats from this route include reservations_wrapup and reservations_completed which are not returned when fetching the cumulative stats only
 */
module.exports.getTaskQueueInstanceStats = function (req, res) {

	taskQueues(req.params.sid).statistics().fetch()
		.then(stats => {
			let payload =[stats]

			res.status(200).json(payload)
		}).catch(error => {
			res.status(500).send(res.convertErrorToJSON(error))
		})
}

/**
 * Get ONLY real time stats for a specified queue
 */
module.exports.getTaskQueueRealTimeStats = function (req, res) {

	taskQueues(req.params.sid).realTimeStatistics().fetch()
		.then(stats => {
			let payload =[stats]

			res.status(200).json(payload)
		}).catch(error => {
			res.status(500).send(res.convertErrorToJSON(error))
		})
}

/**
 * Get ONLY historical stats for a specified queue
 * .
 * Includes two additional properties that are not returned from all stats
 * average task acceptance time and split by wait time
 */
module.exports.getTaskQueueCumulativeStats = function (req, res) {

	taskQueues(req.params.sid).cumulativeStatistics().fetch()
		.then(stats => {
			let payload =[stats]

			res.status(200).json(payload)
		}).catch(error => {
			res.status(500).send(res.convertErrorToJSON(error))
		})
}