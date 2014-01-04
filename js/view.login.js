//SkyRSS view: "login"

$(document).on("skyrss_view_login",function() {
  console.glog("view.login","loading login view");
  $("#oplogin").show();
  if(Modernizr.localstorage) {
    var lso=window.localStorage;
    if(lso["skyrss.user"] && lso["skyrss.pass"]) {
      $("#login-username").val(lso["skyrss.user"]);
      $("#login-password").val(lso["skyrss.pass"]);
    }
  }
});

$(document).on("skyrss_login",function() {
  if(location.hash!="#welcome")
    location.hash="index";
});
$(document).on("skyrss_createaccount",function() {
  location.hash="welcome";
});