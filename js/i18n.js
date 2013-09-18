if(typeof i18n=="undefined")
  i18n={
    _init:false, //are dict/defdict loaded?
    _dict:false, //current language's dictionary object
    _defdict:false, //fallback/default language's dictionary object
    _langs:[], //available languages
    _lang:"", //current language
  };

//shorthand translate function
function _(k) {
  if(!i18n._init)
    return k;
  
  if(i18n._dict[k]) {
    var t=i18n._dict[k];
  } else if(i18n._defdict[k]) {
    var t=i18n._defdict[k];
  } else {
    console.gerror("i18n","Unknown key",k);
    t=k;
  }
  return t;
}

jQuery(document).ready(function(){
  if(!appconfig || !appconfig.deflang) {
    console.gerror("i18n","appconfig not loaded or broken",appconfig);
    return;
  }
  
  var bl=navigator.language || navigator.userLanguage || appconfig.deflang;
  //get the language and strip the sublanguage
  bl=bl.replace("-","_").split("_")[0].toLowerCase(); //en-US => en_US => en
  
  if(!i18n[appconfig.deflang]) {
    console.gerror("i18n","no valid dictionary for default language",appconfig.deflang);
    i18n._defdict={};
  } else {
    i18n._defdict=i18n[appconfig.deflang];
    i18n._lang=appconfig.deflang;
  }
  
  if(!i18n[bl]) { //standard dictionary: browser language
    console.gerror("i18n","no valid dictionary for language",bl);
    i18n._dict=i18n._defdict;
  } else {
    i18n._dict=i18n[bl];
    i18n._lang=bl;
  }
  
  i18n._init=true;
  xlateAll();
});

function xlateAll() {
  $(".i18n").each(function() {
    $(this).html(_($(this).data("key")));
  });
}

//register new language
function xlateAddLang(key,name,dict) {
  i18n[key]=dict;
  i18n._langs.push({key:key,name:name});
  console.glog("langs","added language",key);
}