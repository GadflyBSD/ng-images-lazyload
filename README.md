# angularJs下网络图片的本地缓存和异步加载

> 在ionic中实现了下面功能（PC web环境尚未测试）
> 1. 基于File API的本地文件服务
> 2. 图片懒加载
> 3. 网络图片第一次向本地文件系统进行缓存

## 一、`fileFactory` 服务 `API`
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