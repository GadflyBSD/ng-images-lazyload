angular.module('ngImagesLazyload', [])
	.factory('fileFactory',function($q, $ionicPlatform){
		var config = {
			loadingImg: './img/no-avatar.jpg',
			defaultImg: './img/no-avatar.jpg',
			rootDir: 'appImages/',
			physicalPath: 'cache'
		};
		function base64toBlob(base64Data, contentType, sliceSize) {
			contentType = contentType || '';
			sliceSize = sliceSize || 2 * 1024 * 1024;
			var byteCharacters = atob(base64Data.substring(base64Data.indexOf(',') + 1));
			var byteArrays = [];
			for (var offset = 0; offset < byteCharacters.length; offset += sliceSize) {
				var slice = byteCharacters.slice(offset, offset + sliceSize);
				var byteNumbers = new Array(slice.length);
				for (var i = 0; i < slice.length; i++) {
					byteNumbers[i] = slice.charCodeAt(i);
				}
				var byteArray = new Uint8Array(byteNumbers);
				byteArrays.push(byteArray);
			}
			var blob = new Blob(byteArrays, {type: contentType});
			return blob;
		}
		return {
			getSystemPath: function (physicalPath){
				physicalPath = physicalPath || config.physicalPath;
				switch (physicalPath){
					case 'data':
						return cordova.file.dataDirectory;
					case 'temp':
						if (ionic.Platform.isIOS() || ionic.Platform.isIPad() || ionic.Platform.isWindowsPhone || ionic.Platform.isEdge)
							return cordova.file.tempDirectory;
						else
							return cordova.file.cacheDirectory;
					case 'externalcache':
						if (ionic.Platform.isAndroid())
							return cordova.file.externalCacheDirectory;
						else
							return cordova.file.cacheDirectory;
					case 'externaldata':
						if (ionic.Platform.isAndroid())
							return cordova.file.externalDataDirectory;
						else
							return cordova.file.dataDirectory;
					case 'application':
						return cordova.file.applicationDirectory;
					case 'applicationstorage':
						if(ionic.Platform.isWindowsPhone || ionic.Platform.isEdge)
							return cordova.file.syncedDataDirectory;
						else
							return cordova.file.applicationStorage;
					case 'externalapplicationstorage':
						if(ionic.Platform.isWindowsPhone || ionic.Platform.isEdge)
							return cordova.file.syncedDataDirectory;
						else if (ionic.Platform.isAndroid())
							return cordova.file.externalApplicationStorageDirectory;
						else
							return cordova.file.applicationStorage;
					default:
						return cordova.file.cacheDirectory;
				}
			},
			/**
			 * # 验证本地文件系统中指定目录的合法性
			 * @param dir           所需要验证的本地文件系统的指定目录的路径
			 * @param physicalPath  文件系统的方向， 默认为 `cache`
			 */
			checkDir: function(dir, physicalPath){
				physicalPath = physicalPath || config.physicalPath;
				var q = $q.defer();
				window.resolveLocalFileSystemURL(this.getSystemPath(physicalPath), function(dirEntry) {
					dirEntry.getDirectory(dir, {create: false}, function(directoryEntry) {
						q.resolve(angular.extend(directoryEntry, {resultCode:'success'}));
					}, function(error){
						q.reject(angular.extend({resultCode:'error'}, error));
					});
				});
				return q.promise;
			},
			/**
			 * # 验证本地文件系统中指定文件的合法性
			 * @param filename      所需要验证的本地文件系统的指定文件的路径和文件名
			 * @param physicalPath  文件系统的方向， 默认为 `cache`
			 */
			checkFile: function (filename, physicalPath) {
				physicalPath = physicalPath || config.physicalPath;
				var q = $q.defer();
				window.resolveLocalFileSystemURL(this.getSystemPath(physicalPath), function(dirEntry) {
					dirEntry.getFile(filename, {create: false, exclusive: false}, function(fileEntry) {
						fileEntry.file(function(file){
							q.resolve(angular.extend(file, {resultCode:'success'}));
						});
					}, function(error){
						q.reject(angular.extend({resultCode:'error'}, error));
					});
				});
				return q.promise;
			},
			/**
			 * # 创建单层本地文件系统目录
			 * @param dir           所需要创建的本地文件目录
			 * @param physicalPath  文件系统的方向， 默认为 `cache`
			 */
			mkdir: function(dir, physicalPath){
				physicalPath = physicalPath || config.physicalPath;
				var q = $q.defer();
				window.resolveLocalFileSystemURL(this.getSystemPath(physicalPath), function(dirEntry) {
					dirEntry.getDirectory(dir, {create: true}, function(directoryEntry) {
						q.resolve(directoryEntry);
					});
				});
				return q.promise;
			},
			/**
			 * # 递归创建目录及其子目录
			 * @param dirs          所需创建的目录及子目录
			 * @param physicalPath  文件系统的方向， 默认为 `cache`
			 */
			mkdirs: function(dirs, physicalPath) {
				physicalPath = physicalPath || config.physicalPath;
				var q = $q.defer();
				var createDir = function(rootDir, folders, fullPath, callback) {
					rootDir.getDirectory(fullPath, {create: true}, function(directoryEntry){
						if(typeof callback == 'function') callback(directoryEntry);
					}, function () {
						var folderArray = folders.split('/');
						for(var i = 0;i<folderArray.length;i++){
							if(folderArray[i]==''||folderArray[i]==null||typeof(folderArray[i])==undefined){
								folderArray.splice(i,1);
								i=i-1;
							}
						}
						if(folderArray.length > 0){
							rootDir.getDirectory(folderArray[0], {create: true}, function(dirEntry) {
								fullPath = (fullPath.substr(0, 1) != '/')?'/' + fullPath:fullPath;
								fullPath = (fullPath.substr(fullPath.length-1,1) != '/')?fullPath + '/':fullPath;
								if(dirEntry.fullPath == fullPath){
									if(typeof callback == 'function') callback(dirEntry);
								}else{
									if (folderArray.length) {
										createDir(dirEntry, folderArray.slice(1).join('/') + '/', fullPath, callback);
									}
								}
							});
						}
					});
				};
				window.resolveLocalFileSystemURL(this.getSystemPath(physicalPath), function(dirEntry) {
					createDir(dirEntry, dirs, dirs, function(result){
						q.resolve(result);
					});
				});
				return q.promise;
			},
			/**
			 * # 获取文件的路径和文件名信息
			 * @param path              文件的路径和文件名的拼装字符串
			 * @param isThumb           是否需要进行缩略图处理
			 * @return Object {path, name}
			 */
			getUrlFilename: function(path, isThumb){
				isThumb = isThumb || false;
				var request = path.split('/');
				if(isThumb)
					return {path: request[request.length-3] + '/' + request[request.length-2], name: request[request.length-1]};
				else
					return {path: request[request.length-2], name: request[request.length-1]};
			},
			/**
			 * # 向本地文件系统的指定文件写入数据
			 * @param filename      需要写入的文件名
			 * @param dataObj       需要写入的数据
			 * @param isThumb       是否是图片缓存
			 * @param rootDir       缓存文件系统的根路径， 默认为 `appImages/`
			 * @param physicalPath  缓存文件系统的方向， 默认为 `cache`
			 */
			writeFile: function(filename, dataObj, isThumb, rootDir, physicalPath) {
				isThumb = isThumb || false;
				rootDir = rootDir || config.rootDir;
				physicalPath = physicalPath || config.physicalPath;
				rootDir = (rootDir.substr(rootDir.length-1,1) != '/')?rootDir + '/':rootDir;
				var q = $q.defer();
				var urlFile = this.getUrlFilename(filename, isThumb);
				var folders = rootDir + urlFile.path;
				this.mkdirs(folders, physicalPath).then(function(dirEntry){
					dirEntry.getFile(urlFile.name, { create: true, exclusive: false }, function (fileEntry) {
						fileEntry.createWriter(function (fileWriter) {
							fileWriter.onwriteend = function() {
								fileEntry.file(function(file){
									q.resolve(angular.extend({resultCode:'success'}, file));
								});
							};
							fileWriter.onerror = function(error) {
								q.reject(angular.extend({resultCode:'error'}, error));
							};
							fileWriter.write(dataObj);
						});
					}, function(error){
						q.reject(angular.extend({resultCode:'error'}, error));
					});
				}, function(error){
					q.reject(angular.extend({resultCode:'error'}, error));
				});
				return q.promise;
			},
			/**
			 * # 将base64的图片数据转为Blob数据写入本地文件系统的制定文件中
			 * @param filename      需要写入的文件名
			 * @param base64        需要写入的base64数据
			 * @param isThumb       是否是图片缓存
			 * @param rootDir       缓存文件系统的根路径， 默认为 `appImages/`
			 * @param physicalPath  缓存文件系统的方向， 默认为 `cache`
			 */
			base64toFile: function(filename, base64, isThumb, rootDir, physicalPath){
				isThumb = isThumb || false;
				rootDir = rootDir || config.rootDir;
				physicalPath = physicalPath || config.physicalPath;
				rootDir = (rootDir.substr(rootDir.length-1,1) != '/')?rootDir + '/':rootDir;
				return this.writeFile(filename, base64toBlob(base64), isThumb, rootDir, physicalPath);
			},
			/**
			 * # 将网络图片下载至本地文件系统中
			 * @param url           需要下载的网络图片URL地址
			 * @param rootDir       缓存文件系统的根路径， 默认为 `appImages/`
			 * @param physicalPath  缓存文件系统的方向， 默认为 `cache`
			 */
			downloadBlob: function(url, rootDir, physicalPath){
				rootDir = rootDir || config.rootDir;
				physicalPath = physicalPath || config.physicalPath;
				rootDir = (rootDir.substr(rootDir.length-1,1) != '/')?rootDir + '/':rootDir;
				var q = $q.defer();
				var _self = this;
				var xhr = new XMLHttpRequest();
				var urlFile = this.getUrlFilename(url);
				var localFile = urlFile.path + '/' + urlFile.name;
				xhr.open('GET', url, true);
				xhr.responseType = 'blob';
				xhr.onload = function() {
					if (this.status == 200) {
						var dataObj = new Blob([this.response], {type: this.response.type});
						_self.writeFile(localFile, dataObj, false, rootDir, physicalPath).then(function (success) {
							q.resolve(success);
						}, function (error) {
							q.reject(error);
						})
					}else{
						q.reject(angular.extend(this, {resultCode:'error-' + this.status}));
					}
				};
				xhr.onabort = function(error){
					q.reject(angular.extend({resultCode:'abortError'}, error));
				}
				xhr.onerror = function(error){
					q.reject(angular.extend({resultCode:'onloadError'}, error));
				}
				xhr.ontimeout = function(error){
					q.reject(angular.extend({resultCode:'timeoutError'}, error));
				}
				xhr.send();
				return q.promise;
			},
			/**
			 * # 缓存图片（如果本地系统中已有则返回本地图片）
			 * @param url           需要缓存图片的url地址
			 * @param loadingImg    缓存图片前展示的正在加载中的图片
			 * @param defaultImg    默认图片用于加载图片的url地址时出错的情况展示的本地图片地址
			 * @param dir           缓存文件系统的根路径， 默认为 `appImages/`
			 * @param physicalPath  缓存文件系统的方向， 默认为 `cache`
			 */
			cacheImage: function(url, loadingImg, defaultImg, rootDir, physicalPath){
				rootDir = rootDir || config.rootDir;
				physicalPath = physicalPath || config.physicalPath;
				defaultImg = defaultImg || config.defaultImg;
				loadingImg = loadingImg || config.loadingImg;
				rootDir = (rootDir.substr(rootDir.length-1,1) != '/')?rootDir + '/':rootDir;
				var q = $q.defer();
				var _self = this;
				var urlFile = this.getUrlFilename(url);
				var localFile = rootDir + urlFile.path + '/' + urlFile.name;
				q.notify({localURL: loadingImg});
				this.checkFile(localFile, physicalPath).then(function(success){
					q.resolve(success);
				}, function(){
					_self.downloadBlob(url, rootDir, physicalPath).then(function(result) {
						q.resolve(result);
					}, function (error) {
						q.resolve(angular.extend({localURL: defaultImg}, error));
					});
				});
				return q.promise;
			},
			/**
			 * # 等比例缩放图片(如果图片宽高都比容器小，则绘制的图片宽高 = 原图片的宽高。)
			 * style.width：绘制后图片的宽度;
			 * style.height：绘制后图片的高度;
			 * style.left：绘制后图片的X轴;
			 * style.top：绘制后图片的Y轴
			 * @param dom 图片元素的Dom
			 * @param url 图片元素的Src
			 */
			thumbnail: function(dom, url) {
				var parentDom = dom.parentElement;
				var img = new Image();
				var style = {position: 'absolute'};
				img.src = url;
				img.onload = function(){
					if (img.width < parentDom.offsetWidth && img.height < parentDom.offsetHeight) {
						style.width = img.width;
						style.height = img.height;
					} else {
						var pWidth = img.width / (img.height / parentDom.offsetHeight);
						var pHeight = img.height / (img.width / parentDom.offsetWidth);
						style.width = img.width > img.height ? parentDom.offsetWidth : pWidth;
						style.height = img.height > img.width ? parentDom.offsetHeight : pHeight;
					}
					style.left = (parentDom.offsetWidth - style.width) / 2;
					style.top = (parentDom.offsetHeight - style.height) / 2;
					dom.css(style);
				};
			},
			/**
			 * # Canvas绘制等比例缩放图片(如果图片宽高都比容器小，则绘制的图片宽高 = 原图片的宽高。)
			 * @param dom 绘制图片元素的Dom
			 * @param url 图片元素的Src
			 */
			thumbCanvas: function(dom, url){
				var parentDom = dom.parentElement;
				var createCanvas = dom.getContext("2d");
				var img = new Image();
				var q = $q.defer();
				img.src = url;
				img.onload = function(){
					if ( img.width < parentDom.offsetWidth && img.height < parentDom.offsetHeight) {
						var width = img.width;
						var height = img.height;
					} else {
						var pWidth = img.width / (img.height / parentDom.offsetHeight);
						var pHeight = img.height / (img.width / parentDom.offsetWidth);
						var width = img.width > img.height ? parentDom.offsetWidth : pWidth;
						var height = img.height > img.width ? parentDom.offsetHeight : pHeight;
					}
					var x = (parentDom.offsetWidth - width) / 2;
					var y = (parentDom.offsetHeight - height) / 2;
					dom.width = parentDom.offsetWidth;
					dom.height = parentDom.offsetHeight;
					createCanvas.drawImage(img, x, y, width, height);
					q.resolve(dom.toDataURL());
				};
				return q.promise;
			},
			/**
			 * # 本地缓存由Canvas绘制等比例缩放图片
			 * @param dom           绘制图片元素的Dom
			 * @param url           图片元素的Src
			 * @param loadingImg    缓存图片前展示的正在加载中的图片
			 * @param defaultImg    默认图片用于加载图片的url地址时出错的情况展示的本地图片地址
			 * @param rootDir       缓存文件系统的根路径， 默认为 `appImages/`
			 * @param physicalPath  缓存文件系统的方向， 默认为 `cache`
			 */
			cacheImageThumb: function(dom, url, loadingImg, defaultImg, rootDir, physicalPath){
				rootDir = rootDir || config.rootDir;
				physicalPath = physicalPath || config.physicalPath;
				defaultImg = defaultImg || config.defaultImg;
				loadingImg = loadingImg || config.loadingImg;
				rootDir = (rootDir.substr(rootDir.length-1,1) != '/')?rootDir + '/':rootDir;
				var _self = this;
				var q = $q.defer();
				var parentDom = dom.parentElement;
				var urlFile = this.getUrlFilename(url);
				var localFile = rootDir + urlFile.path + '/' + parentDom.offsetWidth + 'x' + parentDom.offsetHeight + '/' + urlFile.name;
				q.notify({localURL: loadingImg});
				this.checkFile(localFile, physicalPath).then(function(success){
					q.resolve(success);
				}, function(){
					_self.thumbCanvas(dom, url).then(function(base64){
						_self.writeFile(localFile, base64toBlob(base64), true, rootDir, physicalPath).then(function(result){
							q.resolve(result);
						}, function(error){
							q.resolve(angular.extend({localURL: defaultImg}, error));
						})
					});
				});
				return q.promise;
			}
		}
	})
	.directive('lazyContainer', [
		function(){
			var uid = 0;
			function getUid(el){
				var __uid = el.data("__uid");
				if (! __uid) el.data("__uid", (__uid = '' + ++uid));
				return __uid;
			}
			return {
				restrict: 'EA',
				controller: ['$scope', '$element', 'fileFactory', function($scope, $element, fileFactory){
					var config = {
						loadingImg: './img/no-avatar.jpg',
						rootDir: 'appImages/',
						physicalPath: 'cache'
					};
					var elements = {};
					function onLoad(){
						var $el = angular.element(this);
						var uid = getUid($el);
						$el.css('opacity', 1);
						if(elements.hasOwnProperty(uid)) delete elements[uid];
					}
					function isVisible(elem){
						var containerRect = $element[0].getBoundingClientRect();
						var elemRect = elem[0].getBoundingClientRect();
						var xVisible, yVisible;
						var offset = 50;
						if(elemRect.bottom + offset >= containerRect.top &&
							elemRect.top - offset <= containerRect.bottom){
							yVisible = true;
						}
						if(elemRect.right + offset >= containerRect.left &&
							elemRect.left - offset <= containerRect.right){
							xVisible = true;
						}
						return xVisible&&yVisible;
					}
					function checkImage(){
						Object.keys(elements).forEach(function(uid){
							var obj = elements[uid],
								iElement = obj.iElement,
								iScope = obj.iScope;
							if(isVisible(iElement)){
								if(iScope.imgCache){
									var loadingImg = angular.isUndefined(iScope.loadingImg)?config.loadingImg:iScope.loadingImg;
									var defaultImg = angular.isUndefined(iScope.defaultImg)?iScope.lazySrc:iScope.defaultImg;
									var rootDir = angular.isUndefined(iScope.rootDir)?config.rootDir:iScope.rootDir;
									var physicalPath = angular.isUndefined(iScope.physicalPath)?'cache':iScope.physicalPath;
									fileFactory.cacheImage(iScope.lazySrc, loadingImg, defaultImg, rootDir, physicalPath).then(function(success){
										iElement.attr('src', success.localURL);
									}, function(error){
										console.log('checkImage Error: ', error);
										iElement.attr('src', error.localURL);
									},function(notify){
										iElement.attr('src', notify.localURL);
									});
								}else{
									iElement.attr('src', iScope.lazySrc);
								}
							}
						});
					}
					this.addImg = function(iScope, iElement, iAttrs){
						iElement.bind('load', onLoad);
						iScope.$watch('lazySrc', function(){
							var speed = "1s";
							if (iScope.animateSpeed != null) speed = iScope.animateSpeed;
							if(isVisible(iElement)){
								if (iScope.animateVisible) {
									iElement.css({
										'background-color': '#fff',
										'opacity': 0,
										'-webkit-transition': 'opacity ' + speed,
										'transition': 'opacity ' + speed
									});
								}
								if(iScope.imgCache){
									var loadingImg = angular.isUndefined(iScope.loadingImg)?config.loadingImg:iScope.loadingImg;
									var defaultImg = angular.isUndefined(iScope.defaultImg)?iScope.lazySrc:iScope.defaultImg;
									var rootDir = angular.isUndefined(iScope.rootDir)?config.rootDir:iScope.rootDir;
									var physicalPath = angular.isUndefined(iScope.physicalPath)?config.physicalPath:iScope.physicalPath;
									fileFactory.cacheImage(iScope.lazySrc, loadingImg, defaultImg, rootDir, physicalPath).then(function(success){
										iElement.attr('src', success.localURL);
									}, function(error){
										console.log('addImg Error: ', error);
										iElement.attr('src', error.localURL);
									},function(notify){
										iElement.attr('src', notify.localURL);
									});
								}else{
									iElement.attr('src', iScope.lazySrc);
								}
							}else{
								var uid = getUid(iElement);
								iElement.css({
									'background-color': '#fff',
									'opacity': 0,
									'-webkit-transition': 'opacity ' + speed,
									'transition': 'opacity ' + speed
								});
								elements[uid] = {
									iElement: iElement,
									iScope: iScope
								};
							}
						});
						iScope.$on('$destroy', function(){
							iElement.unbind('load');
							var uid = getUid(iElement);
							if(elements.hasOwnProperty(uid)){
								delete elements[uid];
							}
						});
					};
					$element.bind('scroll', checkImage);
					$element.bind('resize', checkImage);
				}]
			};
		}
	])
	.directive('lazySrc', [
		function(){
			return {
				restrict: 'A',
				require: '^lazyContainer',
				scope: {
					lazySrc: '@',
					animateVisible: '@',
					animateSpeed: '@',
					imgCache: '@',
					loadingImg: '@',
					defaultImg: '@',
					rootDir: '@',
					physicalPath: '@'
				},
				link: function(iScope, iElement, iAttrs, containerCtrl){
					containerCtrl.addImg(iScope, iElement, iAttrs);
				}
			};
		}
	])
	.directive('loadSrc', ['$window', '$document', 'fileFactory', function($window, $document, fileFactory){
		var config = {
			loadingImg: './img/no-avatar.jpg',
			rootDir: 'appImages/',
			physicalPath: 'cache'
		};
		var doc = $document[0],
			body = doc.body,
			win = $window,
			$win = angular.element(win),
			uid = 0,
			elements = {};
		function getUid(el){
			var __uid = el.data("__uid");
			if (! __uid) el.data("__uid", (__uid = '' + ++uid));
			return __uid;
		};
		function getWindowOffset(){
			var t,
				pageXOffset = (typeof win.pageXOffset == 'number') ? win.pageXOffset : (((t = doc.documentElement) || (t = body.parentNode)) && typeof t.scrollLeft == 'number' ? t : body).scrollLeft,
				pageYOffset = (typeof win.pageYOffset == 'number') ? win.pageYOffset : (((t = doc.documentElement) || (t = body.parentNode)) && typeof t.scrollTop == 'number' ? t : body).scrollTop;
			return {
				offsetX: pageXOffset,
				offsetY: pageYOffset
			};
		};
		function isVisible(iElement){
			var elem = iElement[0],
				elemRect = elem.getBoundingClientRect(),
				windowOffset = getWindowOffset(),
				winOffsetX = windowOffset.offsetX,
				winOffsetY = windowOffset.offsetY,
				elemWidth = elemRect.width || elem.width,
				elemHeight = elemRect.height || elem.height,
				elemOffsetX = elemRect.left + winOffsetX,
				elemOffsetY = elemRect.top + winOffsetY,
				viewWidth = Math.max(doc.documentElement.clientWidth, win.innerWidth || 0),
				viewHeight = Math.max(doc.documentElement.clientHeight, win.innerHeight || 0),
				xVisible,
				yVisible;
			if(elemOffsetY <= winOffsetY){
				if(elemOffsetY + elemHeight >= winOffsetY) yVisible = true;
			}else if(elemOffsetY >= winOffsetY){
				if(elemOffsetY <= winOffsetY + viewHeight) yVisible = true;
			}
			if(elemOffsetX <= winOffsetX){
				if(elemOffsetX + elemWidth >= winOffsetX) xVisible = true;
			}else if(elemOffsetX >= winOffsetX){
				if(elemOffsetX <= winOffsetX + viewWidth) xVisible = true;
			}
			return xVisible && yVisible;
		};
		function checkImage(){
			angular.forEach(elements, function(obj, key) {
				var iElement = obj.iElement,
					$scope = obj.$scope;
				if(isVisible(iElement)){
					if($scope.imgCache){
						var loadingImg = angular.isUndefined($scope.loadingImg)?config.loadingImg:$scope.loadingImg;
						var defaultImg = angular.isUndefined($scope.defaultImg)?$scope.loadSrc:$scope.defaultImg;
						var rootDir = angular.isUndefined($scope.rootDir)?config.rootDir:$scope.rootDir;
						var physicalPath = angular.isUndefined($scope.physicalPath)?config.physicalPath:$scope.physicalPath;
						console.log('loadSrc', loadingImg, defaultImg, rootDir, physicalPath);
						fileFactory.cacheImage($scope.loadSrc, loadingImg, defaultImg, rootDir, physicalPath).then(function(success){
							console.log('success', success.localURL);
							iElement.attr('src', success.localURL);
						}, function(error){
							console.log('addImg Error: ', error);
							iElement.attr('src', error.localURL);
						},function(notify){
							console.log('notify', notify.localURL);
							iElement.attr('src', notify.localURL);
						});
					}else{
						iElement.attr('src', $scope.loadSrc);
					}
				}
			});
		}
		$win.bind('scroll', checkImage);
		$win.bind('resize', checkImage);
		function onLoad(){
			var $el = angular.element(this),
				uid = getUid($el);
			$el.css('opacity', 1);
			if(elements.hasOwnProperty(uid)) delete elements[uid];
		}
		return {
			restrict: 'A',
			scope: {
				loadSrc: '@',
				animateVisible: '@',
				animateSpeed: '@',
				imgCache: '@',
				loadingImg: '@',
				defaultImg: '@',
				rootDir: '@',
				physicalPath: '@'
			},
			link: function($scope, iElement){
				iElement.bind('load', onLoad);
				angular.element(document.querySelectorAll('.lazyLoadContainer')).bind('scroll', checkImage);
				iElement.bind('load', onLoad);
				$scope.$watch('loadSrc', function(){
					var speed = "1s";
					if ($scope.animateSpeed != null) {
						speed = $scope.animateSpeed;
					}
					if(isVisible(iElement)){
						if ($scope.animateVisible) {
							iElement.css({
								'opacity': 0,
								'-webkit-transition': 'opacity ' + speed,
								'transition': 'opacity ' + speed
							});
						}
						if($scope.imgCache){
							var loadingImg = angular.isUndefined($scope.loadingImg)?config.loadingImg:$scope.loadingImg;
							var defaultImg = angular.isUndefined($scope.defaultImg)?$scope.loadSrc:$scope.defaultImg;
							var rootDir = angular.isUndefined($scope.rootDir)?config.rootDir:$scope.rootDir;
							var physicalPath = angular.isUndefined($scope.physicalPath)?config.physicalPath:$scope.physicalPath;
							fileFactory.cacheImage($scope.loadSrc, loadingImg, defaultImg, rootDir, physicalPath).then(function(success){
								iElement.attr('src', success.localURL);
							}, function(error){
								iElement.attr('src', error.localURL);
							},function(notify){
								iElement.attr('src', notify.localURL);
							});
						}else{
							iElement.attr('src', $scope.loadSrc);
						}
					}else{
						var uid = getUid(iElement);
						iElement.css({
							'opacity': 0,
							'-webkit-transition': 'opacity ' + speed,
							'transition': 'opacity ' + speed
						});
						elements[uid] = {
							iElement: iElement,
							$scope: $scope
						};
					}
				});
				$scope.$on('$destroy', function(){
					iElement.unbind('load');
					var uid = getUid(iElement);
					if(elements.hasOwnProperty(uid)){
						delete elements[uid];
					}
				});
			}
		};
	}]);