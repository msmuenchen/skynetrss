//SkyRSS app component: user session
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  console.glog("component.session","initializing");
  appstate.session={};
  appstate.session.loaded=false;
  appstate.session.object={};
});

$(document).on("skyrss_netonline skyrss_login skyrss_logout",function() {
  console.glog("component.session","loading session from server");
  doAPIRequest("getsession",{},function(data) {
    console.glog("component.session","got session from server, data is",data);
    appstate.session.loaded=true;
    appstate.session.object=data;
    if(!Modernizr.localstorage || !window.localStorage) {
      console.gerror("component.session","cannot store session in LSO, no support!");
    } else {
      window.localStorage["skyrss.session"]=JSON.stringify(data);
    }
    $(document).trigger("skyrss_session_load");
  });
});

$(document).on("skyrss_netoffline",function() {
  console.glog("component.session","loading session from LSO");
  if(!Modernizr.localstorage || !window.localStorage) {
    console.gerror("component.session","cannot load offline, no support for LSO");
    return;
  }
  var lso=window.localStorage["skyrss.session"];
  if(!lso) {
    console.gerror("component.session","cannot load offline, LSO got deleted or never created?");
    return;
  }
  appstate.session.object=JSON.parse(lso);
  appstate.session.loaded=true;
  $(document).trigger("skyrss_session_load");
});
