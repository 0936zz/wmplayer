# 使用

了解如何使用WMPlayer

## HTML结构

WMPlayer默认主题的HTML结构，可[自定义](/diy)
[code="./static/code/start.html"]

## 引入CSS和JS文件

[code="./static/code/include.html"]

> 只适用于 请自行修改路径

## 初始化播放器
[code="./static/code/init.js"]
所有的参数及参数用途都可以在请在[此处](/api?id=constructor)中查看

## 事件绑定 & 处理函数

<!-- TODO 源码添加@this指向 -->

在初始化WMPlayer时第二个参数可以传递一个回调函数，该回调函数将会在WMPlayer初始化后，加载歌曲前调用，您可以在此回调中绑定事件和处理函数

[code="./static/code/event.js"]

### 事件

| 事件名     | 触发时间           | 参数                                                  | 返回值                        |
| ---------- | ------------------ | ----------------------------------------------------- | ----------------------------- |
| beforePlay | 每首歌曲播放前     | - song 即将播放的歌曲                                 | 返回false可以取消当前歌曲播放 |
| timeUpdate | 歌曲时间变化时     | -                                                     | -                             |
| end        | 每首歌曲播放完毕后 | - current 当前播放完的歌曲<br />- next 即将播放的歌曲 | 返回false可以取消下一歌曲播放 |
| mute       | 静音状态           | - status 静音状态                                     | -                             |
| changeMode | 播放模式改变时     | - newMode 新的播放模式<br>- oldMode 旧的播放模式      | -                             |

### 操作函数

<!-- TODO 修改源码中的handle为handler -->

| 操作函数名     | 调用时间         | 用处     | 参数 |
| -------------- | ---------------- | -------- | ---- |
| progressHandle | 歌曲时间变化时   | 用来更新 |      |
| songSrcHandle  | 每首歌即将播放时 |          |      |