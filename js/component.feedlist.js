//SkyRSS app component: feedlist
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  console.glog("component.feedlist::onReady","initializing");
  appstate.feedlist={loaded:false,object:{}};
});

$(document).on("skyrss_feedlist_load_request",function() {
  if(appstate.online)
    loadFeedsFromServer();
  else if(appstate.online!=true && appstate.offlineEnabled==true)
    loadFeedsFromLSO();
  else {
    console.glog("component.feedlist::onRequestLoad","offline, but no offline support enabled");
    alert(_("page_error_offline"));
  }
});

function loadFeedsFromServer() {
  console.glog("component.feedlist::loadFeedsFromServer","loading feedlist from server");
  doAPIRequest("getfeeds",{},function(data) {
    console.glog("component.feedlist::loadFeedsFromServer","got feedlist from server");
    appstate.feedlist.loaded=true;
    appstate.feedlist.object=data;
    $(document).trigger("skyrss_feedlist_load_done");
    $(document).trigger("skyrss_feedlist_persist");
  });
}

function loadFeedsFromLSO() {
  console.glog("component.feedlist::loadFeedsFromLSO","loading feedlist from LSO");
  var lso=window.localStorage["skyrss.feedlist"];
  if(!lso) {
    console.gerror("component.feedlist","cannot load offline, LSO got deleted or never created?");
    alert(_("page_error_neveronline"));
    return;
  }
  appstate.feedlist.object=JSON.parse(lso);
  appstate.feedlist.loaded=true;
  $(document).trigger("skyrss_feedlist_load_done");
}

$(document).on("skyrss_feedlist_persist",function() {
  console.glog("component.feedlist::onPersist","storing feedlist in LSO");
  window.localStorage["skyrss.feedlist"]=JSON.stringify(appstate.feedlist.object);
});
