(function (global, factory) {
	/*eslint no-undef: off*/
	(typeof module === 'object' && typeof module.exports === 'object') ?
		(module.exports = factory(jQuery)) :
		(global.WMPlayer = factory(jQuery));
})(typeof window !== 'undefined' ? window : this, (function ($) {
	// @@include('wmplayer.js')
	return WMPlayer;
}));