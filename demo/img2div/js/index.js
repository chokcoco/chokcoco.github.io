! function (t, e) {
    function n() {
        var t = document.getElementById("fileId1");
        "undefined" == typeof FileReader ? document.write = "抱歉，你的浏览器不支持，请尝试使用高级浏览器" : t.addEventListener("change", o, !1)
    }

    function o() {
        var t = this.files[0];
        if (!/image\/\w+/.test(t.type)) return alert("文件必须为图片！"), !1;
        var e = new FileReader;
        e.readAsDataURL(t), e.onload = function (t) {
            g.innerHTML = '<img id="img" src="' + this.result + '" alt=""/>', r = document.getElementById("img"), i(r)
        }
    }
    var i = function (t) {
            return new i.prototype.init(t)
        },
        r = document.getElementById("img"),
        d = document.getElementById("toDiv"),
        a = document.getElementById("code"),
        g = document.getElementById("result");
    i.prototype.getImgColor = function (t) {
        var e = t.width,
            n = t.height,
            o = document.createElement("canvas"),
            i = o.getContext("2d");
        o.width = e, o.height = n, i.drawImage(t, 0, 0, e, n);
        for (var r = i.getImageData(0, 0, e, n), g = r.data, m = g.length, l = [], u = 0; m > u; u++)
            if (u % 4 === 0) {
                var c = u / 4 % e,
                    p = Math.floor(u / 4 / e),
                    h = g[u],
                    y = g[u + 1],
                    s = g[u + 2],
                    f = g[u + 3];
                l.push(c + 1 + "px " + (p + 1) + "px rgba(" + h + "," + y + "," + s + "," + f + ")")
            }
        d.style.marginBottom = n + 20 + "px", d.style.boxShadow = l.join(), a.innerText = '<div style="width:1px;height:1px;box-shadow:' + l.join() + '">'
    }, i.prototype.init = function (t) {
        this.getImgColor(t)
    }, i.prototype.init.prototype = i.prototype, n()
}(window);