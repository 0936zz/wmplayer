let player = new WMPlayer(options, function () {
	// 绑定事件
	this.on(eventName1, callback1)
	    .on(eventName2, callback2);
	// 绑定处理函数
	this.handler(handlerName1, handler)
	    .handler(handlerName2, handler);
});