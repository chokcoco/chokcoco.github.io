!function(t,e){var o=document.querySelectorAll(".s_wrap")[0];(function(){function e(t){console.log(t),r=t.touches[0].pageX,s=t.touches[0].pageY}function n(t){c=parseInt(t.touches[0].pageX-r),d=t.touches[0].pageY-s,console.log(c);var e=l+c;l+=c,console.log("rotateY",e),o.style.transform="translate3d(0, 346px, 742px) rotateX(-19deg) rotateY("+e+"deg) rotateZ(0deg) scale3d(1, 1, 1)"}function a(){o.offsetWidth;t.addEventListener("touchstart",e,!1),t.addEventListener("touchmove",n,!1)}var r=0,s=0,c=0,d=0,l=0;return{init:function(){o.style.transform="translate3d(0, 346px, 742px) rotateX(-19deg) rotateY(0deg) rotateZ(0deg) scale3d(1, 1, 1)",a()}}})()}(window);