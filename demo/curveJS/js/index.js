!function(t,e){parabola=function(){function e(t,e,n){var o=.003,a=0,u=0,t=t-r.x,e=e-r.y,c=Date.now();a=(e-l-o*(t*t-f*f))/(t-f),u=e-o*t*t-a*t,requestAnimationFrame(function s(){var e=Math.min(1,(Date.now()-c)/n),r=(t-f)*e+f,l=o*r*r+a*r+u;i.style.left=r+960+"px",i.style.top=l+300+"px",1>e&&requestAnimationFrame(s)})}var n=document.querySelector(".drap"),i=document.querySelector(".parabola .ball"),o=n.offsetWidth/2,a=n.offsetHeight/2,r={x:960,y:300},f=i.getBoundingClientRect().left+.5*i.offsetWidth-r.x,l=i.getBoundingClientRect().top+.5*i.offsetHeight-r.y,u=!1;return{eventBind:function(){n.addEventListener("mousedown",function(){u=!0},!1),n.addEventListener("mouseup",function(t){u=!1;var n=t.pageX,i=t.pageY;e(n,i,2e3)},!1),t.addEventListener("mousemove",function(t){var e=t.pageX,i=t.pageY;u&&(n.style.left=e-o+"px",n.style.top=i-a+"px")},!1)},init:function(){this.eventBind()}}}(),sine=function(){function t(){var t=Date.now(),a=2e4;requestAnimationFrame(function r(){var f=Math.min(1,(Date.now()-t)/a),l=n*f,u=.05*n*Math.sin(10*Math.PI*f);e.style.left=l+i+"px",e.style.top=u+o+"px",1>f&&requestAnimationFrame(r)})}var e=document.querySelector(".sine .ball"),n=.8*document.body.clientWidth,i=e.getBoundingClientRect().left+Math.max(document.body.scrollLeft,document.documentElement.scrollLeft),o=e.getBoundingClientRect().top+Math.max(document.body.scrollTop,document.documentElement.scrollTop)-document.querySelector(".parabola").offsetHeight;return{eventBind:function(){e.addEventListener("click",function(){this.style.left=i+"px",this.style.top=o+"px",t()},!1)},init:function(){t(),this.eventBind()}}}(),circular=function(){function t(){var t=Date.now(),a=2e4,r=.6*e.offsetHeight/2;requestAnimationFrame(function f(){var e=Math.min(1,(Date.now()-t)/a),l=r*Math.cos(10*Math.PI*e),u=-r*Math.sin(10*Math.PI*e);n.style.left=l+i+"px",n.style.top=u+o+"px",1>e&&requestAnimationFrame(f)})}var e=document.querySelector(".circular"),n=e.querySelector(".circular .ball"),i=.5*e.offsetWidth-.5*n.offsetWidth,o=.5*e.offsetHeight-.5*n.offsetHeight;return{eventBind:function(){n.addEventListener("click",function(){this.style.left=i+"px",this.style.top=o+"px",t()},!1)},init:function(){t(),this.eventBind()}}}();var n=function(){function t(){var t=Date.now(),o=.8*n.offsetHeight,r=o/20,f=1e3*Math.sqrt(2*r/10);requestAnimationFrame(function l(){var n=Math.min(1,(Date.now()-t)/f),r=o*n*n;i.style.top=r+a+"px",1>n?requestAnimationFrame(l):e()})}function e(){var e=Date.now(),o=.8*n.offsetHeight,r=o/20,f=1e3*Math.sqrt(2*r/10);requestAnimationFrame(function l(){var n=Math.min(1,(Date.now()-e)/f),r=o-o*n*(2-n);i.style.top=r+a+"px",1>n?requestAnimationFrame(l):t()})}var n=document.querySelector(".freefall"),i=n.querySelector(".freefall .ball"),o=.5*n.offsetWidth-.5*i.offsetWidth,a=.1*n.offsetHeight-.5*i.offsetHeight;return console.log("freefall startX "+o),console.log("freefall startY "+a),{init:function(){t()}}}();parabola.init(),sine.init(),circular.init(),n.init()}(window);