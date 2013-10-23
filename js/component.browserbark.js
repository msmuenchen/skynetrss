//SkyRSS component "browserbark"

//bark on Internet Explorer, no version can use data: URIs for iframe src
//see also http://msdn.microsoft.com/en-us/library/cc848897%28v=vs.85%29.aspx
//bark on Safari for Windows, it can't do CSS3 calc()
//http://www.basicthinking.de/blog/2012/07/26/safari-fur-windows-hat-apple-den-browser-still-und-heimlich-zuruckgezogen/
jQuery(document).ready(function($){
  var n=navigator.appName || "";
  var v=navigator.vendor || "";
  var u=navigator.userAgent || "";
  
  var r=/MSIE ([0-9]{1,}[\.0-9]{0,})/.exec(u)
  if(r && parseFloat(r[1])<10)
    $("#modal-container,#ie-warning").show();
  
  r=/apple computer/.exec(v.toLowerCase())
  if(r && navigator.platform && navigator.platform.toLowerCase()=="win32")
    $("#modal-container,#safariwin-warning").show();
});
