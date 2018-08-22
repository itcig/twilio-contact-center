const https = require('https')

module.exports.getSubscriber = function (req, res) {

	// Allow Unsigned Certs
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0'

	https.get(`${process.env.API_URL}/id/person/find?phone=${req.params.phone}&apiuser=${process.env.APIUSER}&apimd5pass=${process.env.APIMD5PASS}`, response => {
		let data = ''

		// A chunk of data has been received.
		response.on('data', chunk => {
			data += chunk
		})

		// The whole response has been received. Print out the result.
		response.on('end', () => {
			console.log('Get Subscriber Success', JSON.parse(data))
			res.status(200).send(JSON.parse(data)).end()
		})
	})
	.on('error', err => {
		console.log('Error: ' + err.message)
		res.status(500).end()
	})

	// For Security Reasons Stop Allowing Unsigned Certs
	process.env.NODE_TLS_REJECT_UNAUTHORIZED = '1'
}