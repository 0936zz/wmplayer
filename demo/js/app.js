'use strict';

///<reference path="wmplayer.d.ts"/>
var WMPlayer = /** @class */ (function () {
    function WMPlayer(config) {
        this.config = config;
        this.initialize();
        this.formatList();
    }
    WMPlayer.prototype.addSong = function () {
    };
    WMPlayer.prototype.start = function () {
        var _this = this;
        this.audio.play()["catch"](function (err) {
            _this.emit('onPlayError', err);
        });
    };
    WMPlayer.prototype.play = function (list, song) {
    };
    WMPlayer.prototype.on = function (eventName, handler) {
        this.events.set(eventName, handler.bind(this));
    };
    WMPlayer.prototype.emit = function (eventName) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (this.events.has(eventName)) {
            this.events.get(eventName)(args);
        }
    };
    WMPlayer.prototype.data = function (key, value) {
        if (typeof value === 'undefined') {
            return this.store.get(key);
        }
        this.store.set(key, value);
    };
    WMPlayer.prototype.formatList = function () {
        var list = this.config.songList;
        
    };
    WMPlayer.prototype.initialize = function () {
        this.audio = document.createElement('audio');
        this.store = new Map();
        this.events = new Map();
        this.dom = new Map();
    };
    return WMPlayer;
}());

var player = new WMPlayer({
    songList: [
        [
            {
                common: true,
                name: 'ACG精选',
                cover: '/image/cover.jpg'
            },
            {
                name: ''
            }
        ]
    ]
});
console.log(player);
