//SkyRSS app component: login form
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  console.glog("component.login","initializing");
  //login button
  $("#login-btn").click(function() {
    if(appstate.online!=true) {
      alert(_("error_offline"));
      return;
    }
    if(appstate.session && appstate.session.object && appstate.session.object.user && appstate.session.object.user.id) {
      alert(_("error_alreadyloggedin"));
      return;
    }
    $(this).attr("disabled","disabled");
    $("#login-error").hide();
    //todo: autocomplete?
    doAPIRequest("login",{username:$("#login-username").val(),password:$("#login-password").val()},function(data) {
      if(data.login!="ok") {
        console.gerror("component.login","login failed:",data.msg);
        $("#login-error").show().html(data.msg);
        return;
      }
      $(document).trigger("skyrss_login");
    },
    null, //fail
    function() { //always
      $("#login-btn").removeAttr("disabled");
    });
  });
});
