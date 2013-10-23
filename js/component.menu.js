//SkyRSS app component: menu display
if(typeof appstate!="object")
  appstate={};

$(document).on("skyrss_session_load",function() {
  console.glog("component.menu","have got session data");
  var data=appstate.session.object;
  $("#menu .loginshow,#menu .logoutshow,#menu .connectedshow,#menu .offlineshow").show();
  //show the menu entries depending on login state
  if(data.user) {
    $("#menu .logoutshow").hide();
    $("#menu .username").html(data.user.name);
  } else {
    $("#menu .loginshow").hide();
  }
  //hide the menu entries depending on network connection
  //(do note that when connectivity changes, this event will be triggered by cascade)
  if(appstate.online) {
    $("#menu .offlineshow").hide();
  } else {
    $("#menu .connectedshow").hide();
  }
});
