//SkyRSS view: "settings"

if(typeof appstate!="object")
  appstate={};
if(typeof appstate.settings!="object")
  appstate.settings={};

$(document).ready(function() {
  //display language
  var lc=$("#settings-display-language").empty();

  i18n._langs.forEach(function(e) {
    var el=$("<option></option>").val(e.key).html(e.name).appendTo(lc);
    console.glog("lang","iterating",e.key,i18n._lang)
    if(e.key==i18n._lang) {
      el.attr("selected",true);
      console.glog("lang","selected language",e.key);
    }
  });
  
  lc.change(function() {
    xlateChangeLang($(this).val());
  });
  
  //feed fonts from appconfig
  var fc=$("#settings-display-font").empty();
  appconfig.fonts.forEach(function(e) {
    var og=$("<optgroup></optgroup>").attr("label",e.title).appendTo(fc);
    e.elements.forEach(function(f) {
      var fo=$("<option></option>").appendTo(og);
      fo.attr("data-fn",f);//use attr so CSS selectors can pick it up
      fo.data("fallback",e.fallback);
      fo.html(f).val(f);	
    });
  });
});

$(document).on("skyrss_view_settings",function() {
  console.glog("view.settings","loading settings view");
  $("#opsettings").show();
});
