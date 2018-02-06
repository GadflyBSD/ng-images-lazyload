# angularJs下网络图片的本地缓存和异步加载

> 在ionic中实现了下面功能（PC web环境尚未测试）
> 1. 基于File API的本地文件服务
> 2. 图片懒加载
> 3. 网络图片第一次向本地文件系统进行缓存

## 一、安装
* 使用`GIT`克隆
```cmd
git clone https://github.com/GadflyBSD/ng-images-lazyload.git
```

* 使用`NPM`安装
```cmd
npm install ng-images-lazyload
```

## 二、`fileFactory` 服务 `API`
* ### `fileFactory.checkDir(dir, physicalPath)`
    - #### 验证本地文件系统中指定目录的合法性
    - 参数
        - `@param dir` 所需要验证的本地文件系统的指定目录的路径
        - `@param physicalPath`  文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
* ### `fileFactory.checkFile(filename, physicalPath)`
    - #### 验证本地文件系统中指定文件的合法性
    - 参数
        - `@param filename` 所需要验证的本地文件系统的指定文件的路径和文件名
        - `@param physicalPath` 文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
* ### `fileFactory.mkdir(dir, physicalPath)`
    - ### 创建单层本地文件系统目录
    - 参数
        - `@param dir` 所需要创建的本地文件目录
        - `@param physicalPath` 文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
* ### `fileFactory.mkdirs(dirs, physicalPath)`
    - ### 递归创建目录及其子目录
    - 参数
         - `@param dirs` 所需创建的目录及子目录
         - `@param physicalPath` 文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
* ### `fileFactory.getUrlFilename(path, isThumb)`
    - ### 获取文件的路径和文件名信息
    - 参数
        - `@param path` 文件的路径和文件名的拼装字符串
        - `@param isThumb` 是否需要进行缩略图处理
    - 返回 `Object {path, name}`
    
* ### `fileFactory.writeFile(filename, dataObj, isThumb, rootDir, physicalPath)`
    - ### 向本地文件系统的指定文件写入数据
    - 参数
        - `@param filename` 需要写入的文件名
        - `@param dataObj` 需要写入的数据
        - `@param isThumb` 是否是图片缓存
        - `@param rootDir` 缓存文件系统的根路径， 默认为 `appImages/`
        - `@param physicalPath` 缓存文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
* ### `fileFactory.base64toFile(filename, base64, isThumb, rootDir, physicalPath)`
    - ### 将base64的图片数据转为Blob数据写入本地文件系统的制定文件中
    - 参数
        - `@param filename` 需要写入的文件名
        - `@param base64` 需要写入的base64数据
        - `@param isThumb` 是否是图片缓存
        - `@param rootDir` 缓存文件系统的根路径， 默认为 `appImages/`
        - `@param physicalPath` 缓存文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
* ### `fileFactory.downloadBlob(url, rootDir, physicalPath)`
    - ### 将网络图片下载至本地文件系统中
    - 参数
        - `@param url` 需要下载的网络图片URL地址
        - `@param rootDir` 缓存文件系统的根路径， 默认为 `appImages/`
        - `@param physicalPath` 缓存文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
* ### `fileFactory.cacheImage(url, loadingImg, defaultImg, rootDir, physicalPath)`
    - ### 缓存图片（如果本地系统中已有则返回本地图片地址）
    - 参数
        - `@param url` 需要缓存图片的url地址
        - `@param loadingImg` 缓存图片前展示的正在加载中的图片
        - `@param defaultImg` 默认图片用于加载图片的url地址时出错的情况展示的本地图片地址
        - `@param dir` 缓存文件系统的根路径， 默认为 `appImages/`
        - `@param physicalPath` 缓存文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
* ### `fileFactory.thumbnail(dom, url)`
    - ### 等比例缩放图片(如果图片宽高都比容器小，则绘制的图片宽高 = 原图片的宽高。)
        * `style.width`：绘制后图片的宽度;
        * `style.height`：绘制后图片的高度;
        * `style.left`：绘制后图片的X轴;
        * `style.top`：绘制后图片的Y轴
    - 参数
        - `@param dom` 图片元素的Dom
        - `@param url` 图片元素的Src
    - 返回 `promise`
    
* ### `fileFactory.thumbCanvas(dom, url)`
    - ### Canvas绘制等比例缩放图片(如果图片宽高都比容器小，则绘制的图片宽高 = 原图片的宽高。)
        * `style.width`：绘制后图片的宽度;
        * `style.height`：绘制后图片的高度;
        * `style.left`：绘制后图片的X轴;
        * `style.top`：绘制后图片的Y轴
    - 参数
        - `@param dom` 图片元素的Dom
        - `@param url` 图片元素的Src
    - 返回 `promise`
    
* ### `ileFactory.cacheImageThumb(dom, url, loadingImg, defaultImg, rootDir, physicalPath)`
    - ### 本地缓存由Canvas绘制等比例缩放图片
    - 参数
        - `@param dom` 绘制图片元素的Dom
        - `@param url` 图片元素的Src
        - `@param loadingImg` 缓存图片前展示的正在加载中的图片
        - `@param defaultImg` 默认图片用于加载图片的url地址时出错的情况展示的本地图片地址
        - `@param rootDir` 缓存文件系统的根路径， 默认为 `appImages/`
        - `@param physicalPath` 缓存文件系统的方向， 默认为 `cache`
    - 返回 `promise`
    
## 三、angular 的图像资源延迟加载指令
> `lazy-src` 通过这个指令，您可以实现懒加载图像。指令修改自 [me-lazyload](https://github.com/Wyntau/me-lazyload)，在`me-lazyload`的基础上新增了图片资源本地数据缓存功能。
* ### 基本用法（Basic Usage）
    1 将ng-images-lazyload.js 依赖注入.（ include ng-images-lazyload.js as dependence.）
    ``` javascript
    var app = angular.module('myApp', ['ngImagesLazyload'])
    ```
    2 将src属性替换为 load-src. (instead src with load-src.)
    ```html
    <img load-src="{{imgUrl}}" alt="" />
    ```
    3 可选参数，可以添加其他参数，例如：
    ```html
    <img load-src="{{imgUrl}}" animate-visible="true" animate-speed="0.5s" alt="" />
    ```
    
> `lazy-img` 通过这个指令，您可以实现懒加载图像，你也可以在特定的元素具有`overflow: auto` 或 `overflow:scroll` css的样式中使用。指令修改自 [me-lazyimg](https://github.com/Wyntau/me-lazyimg)，在`me-lazyimg`的基础上新增了图片资源本地数据缓存功能。
* ### 基本用法（Basic Usage）
    1 在可滚动的容器中加入 `lazy-container`
    ```html
    <div lazy-container>...</div>
    ```
    2 将src属性替换为 lazy-src. (instead src with lazy-src.)
    ```html
    <img lazy-src="{{imgUrl}}" alt="" />
    ```
    
> 所有附加参数的列表
    
参数 | 说明 | 参数值 | 默认值
---|---|---|---
animate-visible|如果设置为true，所有图像（包括最初可见的图像）将被激活。请注意，默认情况下，初始可见图像将立即显示而不褪色。|true|false
animate-speed|动画的速度以秒或毫秒为单位。|0.5s|1s
load-src|加载图片路径| |
img-cache|是否在本地缓存图片|true|true
loading-img|正在加载中的图片路径|`./img/no-avatar.jpg`|`./img/no-avatar.jpg`
default-img|图片加载失败时默认展示的图片地址|`./img/no-avatar.jpg`|`./img/no-avatar.jpg`
root-dir|图片缓存的根目录|`appImages/`|`appImages/`|
physical-path|本地缓存物理地址，不同系统和浏览器不一样|`cache`|`cache`
