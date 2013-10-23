//SkyRSS app component: network connection status
if(typeof appstate!="object")
  appstate={};

//check if we're connected
function checkNetworkConnection() {
  $("#offline-box").show();
  console.glog("checkNetworkConnection","checking online status, current online=",appstate.online);
  doAPIRequest("onlinecheck",{ignoreNetworkException:true},function() { //success
    console.glog("checkNetworkConnection","we're online");
    if(appstate.online==false) {
      console.glog("checkNetworkConnection","going online");
      $(document).trigger("skyrss_netonline");
    }
    appstate.online=true;
    $("#offline-box").hide();
  },
  function() { //fail
    console.glog("checkNetworkConnection","we're apparently offline");
    if(appstate.online==true) {
      console.glog("checkNetworkConnection","going offline");
      $(document).trigger("skyrss_netoffline");
    }
    appstate.online=false;
  },
  null //always
  );
}

//the first thing we have to do is to check if we're online!
$(document).ready(function() {
  appstate.online=false;
  checkNetworkConnection();
  setInterval(checkNetworkConnection,1000*5); //check every two minutes if we're online
  $("#offline-box").click(checkNetworkConnection);
});
