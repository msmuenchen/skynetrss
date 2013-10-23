//SkyRSS app component: feedlist
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  console.glog("component.feedlist","initializing");
  appstate.feedlist={};
  appstate.feedlist.loaded=false;
  appstate.feedlist.object={};
});

$(document).on("skyrss_session_load",function() {
  if(appstate.online)
    loadFeedsFromServer()
  else
    loadFeedsFromLSO();
});

function loadFeedsFromServer() {
  console.glog("component.feedlist","loading feedlist from server");
  doAPIRequest("getfeeds",{},function(data) {
    console.glog("component.feedlist","got feedlist from server, data is",data);
    appstate.feedlist.loaded=true;
    appstate.feedlist.object=data;
    if(!Modernizr.localstorage || !window.localStorage) {
      console.gerror("component.feedlist","cannot store feedlist in LSO, no support!");
    } else {
      window.localStorage["skyrss.feedlist"]=JSON.stringify(data);
    }
    $(document).trigger("skyrss_feedlist_load");
  });
}

function loadFeedsFromLSO() {
  console.glog("component.feedlist","loading feedlist from LSO");
  if(!Modernizr.localstorage || !window.localStorage) {
    console.gerror("component.feedlist","cannot load offline, no support for LSO");
    return;
  }
  var lso=window.localStorage["skyrss.feedlist"];
  if(!lso) {
    console.gerror("component.feedlist","cannot load offline, LSO got deleted or never created?");
    return;
  }
  appstate.feedlist.object=JSON.parse(lso);
  appstate.feedlist.loaded=true;
  $(document).trigger("skyrss_feedlist_load");
}
