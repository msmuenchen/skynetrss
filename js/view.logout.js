//SkyRSS view: "logout"

$(document).on("skyrss_view_logout",function() {
  console.glog("view.logout","loading logout view");
  $("#oplogout").show();
});

$(document).on("skyrss_logout",function() {
  location.hash="index";
});
