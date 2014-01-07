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
    
    var u=$("#login-username").val();
    var p=$("#login-password").val();
    if(Modernizr.localstorage && !!!localStorage["skyrss.user"] && confirm(_("page_savepassword"))) {
      localStorage["skyrss.user"]=u;
      localStorage["skyrss.pass"]=p;
    }
    
    $(this).attr("disabled","disabled");
    $("#login-error").hide();
    //todo: autocomplete?
    doAPIRequest("login",{ignoreAPIException:true,username:u,password:p},function(data) {
      //todo: unify exception handling!
      if(data.status!="ok") {
        console.gerror("component.login","api error",data.message);
        $("#login-error").show().html(data.message);
        return;
      }
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
