//SkyRSS app component: feed icons
$(document).on("skyrss_feedlist_load skyrss_feedicons_request",function() {
  if(!Modernizr.localstorage)
    return;
  if(appstate.feedlist.loaded!=true)
    return;
  if(appstate.online==true) {
    loadFeediconsFromServer();
  } else {
    loadFeediconsFromLSO();
  }
}
function loadFeediconsFromServer() {
  var items={};
  var ts = Math.round((new Date()).getTime() / 1000);
  var currentTS=localStorage["skyrss.feedicons.ts"]||0;
  if(ts-currentTS<60*10) //ttl 10min
    return;
  console.glog("component.feedicons::onFeediconsRequest","loading feed icons");
  var currentIconsLSO={};
  if(localStorage["skyrss.feedicons"])
    currentIconsLSO=JSON.parse(localStorage["skyrss.feedicons"]);
  var sha=new Rusha();
  appstate.feedlist.object.items.forEach(function(e) {
    var k=e.id.toString();
    var v=currentIconsLSO[k]||"";
    if(v==appconfig.feedicon)
      v=""; //allow sha1 comparison on server, too
    var h=sha.digest(v);
    items[k]=h;
  });
  doAPIRequest("geticons",{items:JSON.stringify(items)},function(data) {
    data.items.forEach(function(e) {
      var k=e.id.toString();
      currentIconsLSO[k]=e.icon;
    });
    localStorage["skyrss.feedicons"]=JSON.stringify(currentIconsLSO);
    localStorage["skyrss.feedicons.ts"]=ts;
    $(document).trigger("skyrss_feedicons_update");
  });
}
function loadFeediconsFromLSO() {
  if(!localStorage["skyrss.feedicons"])
    localStorage["skyrss.feedicons"]={};
  $(document).trigger("skyrss_feedicons_update");
}
