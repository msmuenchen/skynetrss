//SkyRSS app component: network connection status
if(typeof appstate!="object")
  appstate={};

//check if we're connected
function checkNetworkConnection() {
  console.glog("checkNetworkConnection","checking online status, current online=",appstate.online);
  doAPIRequest("onlinecheck",{ignoreNetworkException:true},function() { //success
    console.glog("checkNetworkConnection","we're online");
    if(appstate.online==false || appstate.online==null) {
      appstate.online=true;
      console.glog("checkNetworkConnection","going online");
      $(document).trigger("skyrss_netonline");
    } else //this doubling is intentional, the triggers may require API access and thus need appstate.online
      appstate.online=true;
    $("#offline-box").hide();
  },
  function() { //fail
    console.glog("checkNetworkConnection","we're apparently offline");
    if(appstate.online==true || appstate.online==null) {
      appstate.online=false;
      console.glog("checkNetworkConnection","going offline");
      $(document).trigger("skyrss_netoffline");
    } else
      appstate.online=false;
    $("#offline-box").show();
  },
  null //always
  );
}

//the first thing we have to do is to check if we're online!
$(document).ready(function() {
  appstate.online=null; //not true/false, so that the check always fires a trigger on first execution
  checkNetworkConnection();
  setInterval(checkNetworkConnection,1000*30); //check every two minutes if we're online
  $("#offline-box").click(checkNetworkConnection);
});
