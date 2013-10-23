//SkyRSS app component: user settings
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  appstate.settings={};
  appstate.settings.loaded=false;
  appstate.settings.default={};
  appstate.settings.user={};
  appstate.settings.current={};
});
//$(document).on("skyrss_netonline",function() {

$(document).on("skyrss_session_load",function() {
  var s=appstate.session.object;
  console.glog("component.settings","updating with new settings",s);
  $("#settingsform-account .username").html(s.user.name);
  if(s.user.source!="") {
    $("#settingsform-account .passwordrow").hide();
  } else {
    $("#settingsform-account .passwordrow").show();
  }
  appstate.settings.default=s.default_settings;
  appstate.settings.user=s.user_settings;
  appstate.settings.current=appstate.settings.default;
  
  $.extend(appstate.settings.current,appstate.settings.user);
  appstate.settings.loaded=true;
});
