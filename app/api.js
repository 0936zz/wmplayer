const express = require('express');
const router = express.Router();

router.get('/search', function (req, res) {
	let name = req.query.name;
	res.json({ hello: name });
});

router.get('/', function (req, res) {
	req.json({ test: '1111111' });
});

module.exports = router;