;/*!/static/js/index.js*/
(function(window, undefined) {

	var
		img2div = function(imgElem) {
			return new img2div.prototype.init(imgElem);
		},
		img = document.getElementById('img'),
		div = document.getElementById('toDiv'),
		code = document.getElementById('code'),
		result = document.getElementById('result');

	/**
	 * 监听图片上传事件
	 * @return {[type]} [description]
	 */
	function imgInputListener() {
		var input = document.getElementById("fileId1");

		if (typeof FileReader === 'undefined') {
			document.write = "抱歉，你的浏览器不支持，请尝试使用高级浏览器";
		} else {
			// input.click();
			input.addEventListener('change', readFile, false);
		}
	}

	/**
	 * 上传图片处理
	 * @return {[type]} [description]
	 */
	function readFile() {
		var file = this.files[0];
		if (!/image\/\w+/.test(file.type)) {
			alert("文件必须为图片！");
			return false;
		}
		var reader = new FileReader();
		reader.readAsDataURL(file);
		reader.onload = function(e) {
			result.innerHTML = '<img id="img" src="' + this.result + '" alt=""/>'
			img = document.getElementById('img');
			setTimeout(() => {
				img2div(img);
			})
		}
	}

	/**
	 * 获取图片每个像素颜色值
	 * @param  {[type]} imgElem [description]
	 * @return {[type]}         [description]
	 */
	img2div.prototype.getImgColor = function(imgElem) {

		var imgWidth = imgElem.width,
			imgHeight = imgElem.height,
			canvas = document.createElement("canvas"),
			context = canvas.getContext("2d");

		// 根据 img 设置 canvas 高宽
		canvas.width = imgWidth;
		canvas.height = imgHeight;

		// 绘图
		context.drawImage(imgElem, 0, 0, imgWidth, imgHeight);

		// 取色
		var colorArr = context.getImageData(0, 0, imgWidth, imgHeight),
			data = colorArr.data,
			len = data.length,
			boxShadowBox = [],
			i = 0;

		for (; i < len; i++) {
			if (i % 4 === 0) {
				var x = i / 4 % imgWidth,
					y = Math.floor(i / 4 / imgWidth),
					rgbaR = data[i],
					rgbaG = data[i + 1],
					rgbaB = data[i + 2],
					rgbaA = data[i + 3];

				boxShadowBox.push(
					(x + 1) + 'px ' +
					(y + 1) + 'px ' + 'rgba(' +
					rgbaR + ',' + rgbaG + ',' + rgbaB + ',' + rgbaA + ')'
				);
			}
		}
		// console.log(data);
		// console.log(boxShadowBox);
		// console.log('len is '+len);

		// div.style.width = imgWidth;
		// div.style.height = imgHeight;
		div.style.marginBottom = imgHeight + 20 + 'px';
		div.style.boxShadow = boxShadowBox.join();
		code.innerText = '<div style="width:1px;height:1px;box-shadow:' + boxShadowBox.join() + '">';

	}

	img2div.prototype.init = function(imgElem) {
		this.getImgColor(imgElem);
	}

	img2div.prototype.init.prototype = img2div.prototype;


	imgInputListener();
})(window);
