'use-strict'

const express = require('express')
const bodyParser = require('body-parser')
const sessions = require('express-session')
const compression = require('compression')
const ngrok = require('ngrok')
require('dotenv').load()

const port = (process.env.PORT || 5000)
const ngrokUrl = async function () {
	try {
		const url = await ngrok.connect(port)
		console.log('ngrok url ->', url)
	} catch (err) {
		console.log('ngrok error ->', err)
	}
}

/* check if the application runs on heroku */
let util

if (process.env.DYNO) {
	util = require('./util-pg.js')
} else {
	util = require('./util-file.js')
}

const app = express()

app.set('port', port)

app.use(compression())
app.use(sessions({
	resave: true,
	saveUninitialized: false,
	secret: 'keyboard cat',
	name: 'twilio_call_center_session',
	cookie: { maxAge: 3600000 }
}))

app.use(bodyParser.json())
app.use(bodyParser.urlencoded({extended: true}))

app.use(function (req, res, next) {

	const replaceErrors = function (key, value) {
		if (value instanceof Error) {
			const error = {}

			Object.getOwnPropertyNames(value).forEach(function (key) {
				error[key] = value[key]
			})

			return error
		}
		return value
	}

	res.convertErrorToJSON = (error) => {
		console.log(error)

		return JSON.stringify(error, replaceErrors)
	}

	next()
})

app.use(function (req, res, next) {

	util.getConfiguration(function (err, configuration) {
		if (err) {
			res.status(500).json({stack: err.stack, message: err.message})
		} else {
			req.configuration = configuration
			req.util = util
			next()
		}
	})

})

app.use('/', function (req, res, next) {
	if (req.path.substr(0,4) === '/api') {
		res.set({
			'Content-Type': 'application/json',
			'Cache-Control': 'public, max-age=0',
		})
	}

	/* override content type for twiml routes */
	if (req.path.includes('/api/ivr')) {
		res.set({
			'Content-Type': 'application/xml',
			'Cache-Control': 'public, max-age=0',
		})
	}

	next()
})

/**
 * All Routes
 */
const router = express.Router()

/* Setup */
const setup = require('./controllers/setup.js')
router.route('/setup').get(setup.get)
router.route('/setup').post(setup.update)

const setupPhoneNumber = require('./controllers/setup-phone-number.js')
router.route('/setup/phone-number/validate').post(setupPhoneNumber.validate)
router.route('/setup/phone-number').post(setupPhoneNumber.update)

const validate = require('./controllers/validate.js')
router.route('/validate/setup').post(validate.validateSetup)

/* Tasks */
const tasks = require('./controllers/tasks.js')
router.route('/tasks/callback').post(tasks.createCallback)
router.route('/tasks/chat').post(tasks.createChat)
router.route('/tasks/video').post(tasks.createVideo)

/* Agent interface and phone */
const agents = require('./controllers/agents.js')
router.route('/agents/login').post(agents.login)
router.route('/agents/logout').post(agents.logout)
router.route('/agents/session').get(agents.getSession)

const phone = require('./controllers/phone.js')
router.route('/phone/call').post(phone.call)
router.route('/phone/call/:sid/add-participant/:phone').post(phone.addParticipant)
router.route('/phone/call/:sid/conference').get(phone.getConference)
router.route('/phone/hold').post(phone.hold)

const phoneTransfer = require('./controllers/phone-transfer.js')
router.route('/phone/transfer/available-workers').get(phoneTransfer.getAvailableWorkers)
router.route('/phone/transfer/:sid').post(phoneTransfer.create)
router.route('/phone/transfer/:sid/forward/:to/initiated-by/:from').post(phoneTransfer.forward)

/* IVR */
const ivr = require('./controllers/ivr.js')
router.route('/ivr/welcome').get(ivr.welcome)
router.route('/ivr/select-team').get(ivr.selectTeam)
router.route('/ivr/create-task').get(ivr.createTask)

/* called by the Twilio TaskRouter */
const taskrouter = require('./controllers/taskrouter.js')
router.route('/taskrouter/workspace').get(taskrouter.getWorkspace)
router.route('/taskrouter/activities').get(taskrouter.getActivities)
router.route('/taskrouter/workflows').get(taskrouter.getWorkflows) // Added by Hunter 8/24
router.route('/taskrouter/workflow-filters').get(taskrouter.getWorkflowFilters) // Added by Hunter 8/24

const workers = require('./controllers/workers.js')
router.route('/workers').get(workers.list)
router.route('/workers').post(workers.create)
router.route('/workers/:id').delete(workers.delete)

/* TaskQueue */
const taskQueue = require('./controllers/taskqueue')
router.route('/taskqueue/taskqueues').get(taskQueue.getTaskQueues) // Added by Hunter 8/24
router.route('/taskqueue/:sid/stats/all').get(taskQueue.getTaskQueueInstanceStats) // Added by Hunter 8/24
router.route('/taskqueue/:sid/stats/real-time').get(taskQueue.getTaskQueueRealTimeStats) // Added by Hunter 8/24
router.route('/taskqueue/:sid/stats/historic').get(taskQueue.getTaskQueueCumulativeStats) // Added by Hunter 8/24

/* Messaging adapter */
const messagingAdapter = require('./controllers/messaging-adapter.js')
router.route('/messaging-adapter/inbound').post(messagingAdapter.inbound)
router.route('/messaging-adapter/outbound').post(messagingAdapter.outbound)

/* CIG API */
const cigApi = require('./controllers/cig')
router.route('/cigapi/:phone').get(cigApi.getSubscriber)

app.use('/api', router)
app.use('/', express.static(__dirname + '/public'))

app.listen(app.get('port'), () => {
	console.log('magic happens on port', app.get('port'))
	ngrokUrl()
})
