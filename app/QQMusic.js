class QQMusic {
	static search (keyword, page) {
		let url = ``;
		console.log(url);
		this.request(url).then((data) => {
			console.log(data.data.song);
		});
	}

	static request (url) {
		return new Promise((resolve, reject) => {
			let script = document.createElement('script');
			let body = document.getElementsByTagName('body')[0];
			url = url + '&jsonpCallback=QQMusicJsonpCallback';
			script.src = url;
			body.appendChild(script);
			(window as any)['QQMusicJsonpCallback'] = function (data: any) {
				resolve(data);
				body.removeChild(script);
				delete (window as any)['QQMusicJsonpCallback'];
			}
		})
	}
}

module.exports = QQMusic;