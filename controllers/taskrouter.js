const Twilio = require('twilio')

const client = new Twilio(
	process.env.TWILIO_ACCOUNT_SID,
	process.env.TWILIO_AUTH_TOKEN)

module.exports.getWorkspace = function (req, res) {

	client.taskrouter.workspaces(process.env.TWILIO_WORKSPACE_SID).fetch()
		.then(workspace => {
			let payload = {
				sid: workspace.sid,
				friendlyName: workspace.friendlyName
			}

			res.status(200).json(payload)
		}).catch(error => {
			res.status(500).send(res.convertErrorToJSON(error))
		})

}

module.exports.getActivities = function (req, res) {

	client.taskrouter.workspaces(process.env.TWILIO_WORKSPACE_SID).activities.list()
		.then(activities => {
			let payload =[]

			for (let i = 0; i < activities.length; i++) {
				const activity = {
					sid: activities[i].sid,
					friendlyName: activities[i].friendlyName,
				}

				payload.push(activity)
			}

			res.status(200).json(payload)
		}).catch(error => {
			res.status(500).send(res.convertErrorToJSON(error))
		})

}

/**
 * This is to list the Workflows that belong to the workspace
 * @TODO this may be totally useless
 */
module.exports.getWorkflows = function (req, res) {

	client.taskrouter.workspaces(process.env.TWILIO_WORKSPACE_SID).workflows.list()
		.then(workflows => {
			let payload =[]

			workflows.forEach(workflow => {
				payload.push({
					sid: workflow.sid,
					friendlyName: workflow.friendlyName
				})
			})

			res.status(200).json(payload)
		}).catch(error => {
			res.status(500).send(res.convertErrorToJSON(error))
		})
}

/**
 * This is to list the Workflow Filters that belong to the workspace
 * The list includes the name, queue(s) SID(s), priority, and expression used to pair workers
 * @TODO this may not be used as it does a very similar thing as getTaskQueues
 */
module.exports.getWorkflowFilters = function (req, res) {

	client.taskrouter.workspaces(process.env.TWILIO_WORKSPACE_SID).workflows(process.env.TWILIO_WORKFLOW_SID).fetch()
		.then(workflow => {
			let payload =[]
			const filters = JSON.parse(workflow.configuration).task_routing.filters

			filters.forEach(filter => {
				payload.push({
					friendlyName: filter.filter_friendly_name,
					targets: filter.targets
				})
			})

			res.status(200).json(payload)
		}).catch(error => {
			res.status(500).send(res.convertErrorToJSON(error))
		})
}