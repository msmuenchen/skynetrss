//SkyRSS view: "login"

$(document).on("skyrss_view_login",function() {
  console.glog("view.login","loading login view");
  $("#oplogin").show();
});

$(document).on("skyrss_login",function() {
  if(location.hash!="#welcome")
    location.hash="index";
});
$(document).on("skyrss_createaccount",function() {
  location.hash="welcome";
});