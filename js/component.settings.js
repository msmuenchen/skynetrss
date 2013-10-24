//SkyRSS app component: user settings
if(typeof appstate!="object")
  appstate={};

//todo, load language here?
$(document).ready(function() {
  appstate.settings={};
  appstate.settings.loaded=false;
  appstate.settings.default={};
  appstate.settings.user={};
  appstate.settings.current={};
});

$(document).on("skyrss_session_load",function() {
  var s=appstate.session.object;
  console.glog("component.settings","updating with new settings",s);
  
  appstate.settings.default=s.default_settings;
  appstate.settings.user=s.user_settings;
  appstate.settings.current=appstate.settings.default;
  
  $.extend(appstate.settings.current,appstate.settings.user);
  appstate.settings.loaded=true;
  $(document).trigger("skyrss_settings_load");
});
