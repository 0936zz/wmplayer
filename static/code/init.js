new WMPlayer({
	containerSelector: '.wm,.wm-lrc',
	songList: data,
	basicIsFirst: true,
	listFormat: '<li data-wm-current-song-class>' +
	'<img src="${img}$" alt="cover" class="wm-list-cover"> ' +
	'<p class="wm-list-song">${name}$</p> ' +
	'<p class="wm-list-singer">${singer}$</p> ' +
	'<button class="wm-list-play" data-wm-list-play-btn></button> ' +
	'</li>',
	currentListClass: 'wm-list-title-current',
	currentSongClass: 'wm-list-playing',
	currentLrcClass: '',
	tplLeftDelimiter: '${',
	tplRightDelimiter: '}$',
	progressCSSPrototype: 'width',
	autoPlay: true,
	defaultImg: ''
});
