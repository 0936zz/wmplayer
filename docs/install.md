# 安装

## 使用 npm/yarn 安装

```bash
npm install wmplayer --save
# or 
yarn add wmplayer
```

接下来您可以直接在项目中使用`require`来引入模块

## 使用 bower 安装

```bash
bower install wmplayer --save
```

## 直接下载

请访问下载页面

## 编译源码

您可以在项目GitHub仓库页面找到最新版的源码，但是可能需要您自己编译后才能使用

> GitHub页面上的源码为最新版，可能会有严重的bug，您可以按照标签选择版本后再下载

### 编译

```bash
# 项目根目录
npm install # or yarn
npm install gulp -g # or yarn global add gulp
gulp build
```

编译后的文件会在项目根目录下`dist`文件夹中，可以直接复制到项目静态资源目录下引用

### 修改编译参数