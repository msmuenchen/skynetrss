if(typeof i18n=="undefined")
  i18n={};

function _(k) {
  var dict;
  if(!i18n[appconfig.lang]) {
    console.error("no valid dictionary for language "+appconfig.lang+" and message "+k);
    dict=i18n[appconfig.deflang];
  } else
    dict=i18n[appconfig.lang];
  if(dict[k]) {
    var t=dict[k];
  } else if(i18n[appconfig.deflang][k]) {
    dict=i18n[appconfig.deflang];
    var t=dict[k];
  } else {
    console.log("Unknown key "+k);
    t=k;
  }
  return t;
}
jQuery(document).ready(function(){
  xlateAll();
});

function xlateAll() {
$(".i18n").each(function() {
    $(this).html(_($(this).data("key")));
  });
}
