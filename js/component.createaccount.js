//SkyRSS app component: createaccount form
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  console.glog("component.createaccount","initializing");
  //login button
  $("#createaccount-btn").click(function() {
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
    doAPIRequest("createaccount",{ignoreAPIException:true,username:$("#login-username").val(),password:$("#login-password").val()},function(data) {
      //todo: unify exception handling!
      if(data.status!="ok") {
        console.gerror("component.login","api error",data.message);
        $("#login-error").show().html(data.message);
        return;
      }
      if(data.login!="ok") {
        console.gerror("component.createaccount","create failed:",data.msg);
        $("#login-error").show().html(data.msg);
        return;
      }
      $(document).trigger("skyrss_createaccount");
      $(document).trigger("skyrss_login");
    },
    null, //fail
    function() { //always
      $("#createaccount-btn").removeAttr("disabled");
    });
  });
});
