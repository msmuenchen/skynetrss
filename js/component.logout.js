//SkyRSS app component: logout form
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  console.glog("component.logout","initializing");
  //logout button
  $("#logout-btn").click(function() {
    if(appstate.online!=true) {
      alert(_("error_offline"));
      return;
    }
    if(!(appstate.session && appstate.session.object && appstate.session.object.user && appstate.session.object.user.id)) {
      alert(_("error_notloggedin"));
      return;
    }
    $(this).attr("disabled","disabled");
    doAPIRequest("logout",{},function(data) {
      $(document).trigger("skyrss_logout");
    },
    null,
    function() {
      $("#logout-btn").removeAttr("disabled");
    });
  });
});
