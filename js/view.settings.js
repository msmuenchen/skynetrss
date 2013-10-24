//SkyRSS view: "settings"

if(typeof appstate!="object")
  appstate={};
if(typeof appstate.settings!="object")
  appstate.settings={};

$(document).ready(function() {
  console.glog("view.settings","initializing");
  
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

  $("#settings-display-save").click(function(ev) {
    ev.preventDefault();
    var sobj={};
    $("#settingsform-display input").each(function() {
      var e=$(this);
      var k=e.data("key");
      switch(e.attr("type")) {
        case "checkbox":
          if(e.is(":checked"))
            sobj[k]=1;
          else
            sobj[k]=0;
        break;
      }
    });
    $("#settingsform-display select").each(function() {
      var e=$(this);
      var k=e.data("key");
      sobj[k]=e.val();
    });
    $.extend(appstate.settings.user,sobj);
    console.glog("view.settings","saving settings",sobj);
    if(appstate.online==true) {
      $("#settings-display-save").attr("disabled","disabled");
      doAPIRequest("updatesettings",sobj,null, //success
      null, //fail
      function() { //always
        $("#settings-display-save").removeAttr("disabled");
      });
    } else {
      alert("Can not save settings while online!");
    }
  });
});

$(document).on("skyrss_view_settings",function() {
  console.glog("view.settings","loading settings view");
  $("#opsettings").show();
});

$(document).on("skyrss_settings_load",function() {
  var s=appstate.session.object;
  
  //tab 1: account
  if(s.user) {
    $("#settingsform-account .username").html(s.user.name);
    if(s.user.source!="") {
      $("#settingsform-account .passwordrow").hide();
    } else {
      $("#settingsform-account .passwordrow").show();
    }
  } else {
    $("#settingsform-account .username").html(_("page_anonymous"));
    $("#settingsform-account .passwordrow").hide();
  }
  
  //tab 3:display
  $("#settingsform-display input").each(function() {
    var e=$(this);
    var k=e.data("key");
    switch(e.attr("type")) {
      case "checkbox":
        if(appstate.settings.user[k]==1)
          e.prop("checked",true);
        else
          e.prop("checked",false);
      break;
    }
    e.change();
  });
  $("#settingsform-display select").each(function() {
    var e=$(this);
    var k=e.data("key");
    $("option",e).each(function() {
      var o=$(this);
      if(appstate.settings.user[k]==o.val())
        o.prop("selected",true);
    });
    e.change();
  });
});

//add feeds to list
$(document).on("skyrss_feedlist_load",function() {
  var data=appstate.feedlist.object;
  console.glog("view.settings","inserting feedlist",data);

  var sl_dragstart=function(ev,ui) {
    //add a class to the helper so we can filter it out in saveFeedList
    $(ui.helper).addClass("ui-draggable-helper");
    var dh=$(".ddhelper","#settings-feeds");
    var me=$(this);
    hoverTarget=me.prev();
    dh.show().insertBefore(me);
    me.hide();
    
    console.glog("settings-feeds","drag start",me.attr("id"),"hover target",hoverTarget);
    if(me.hasClass("dir")) {
      $(".feed","#settings-feeds").hide();
      dragMode="dir";
    } else
      dragMode="feed";
  };
  var sl_dragstop=function(evt,ui){
    console.glog("dragstop",this,hoverTarget);
    console.glog("dragstop",$(this).data("dir"),hoverTarget.data("dir"))
    var me=$(this);
    var dh=$(".ddhelper","#settings-feeds");
    dh.hide().appendTo("#settings-feeds thead");
    me.show();
    console.glog("dragstop","moved",me.attr("id"),"below",hoverTarget.attr("id"));
    if(dragMode=="dir") {
      $(".feed","#settings-feeds").show();
    } else {
      me.insertAfter(hoverTarget);
      me.alterClass("lv*");
      console.glog("dragstop","old dir",me.data("dir"),me.attr("data-dir"));
      me.data("dir",hoverTarget.data("dir"));
      console.glog("dragstop","new dir",me.data("dir"),me.attr("data-dir"));
      if(hoverTarget.hasClass("dir")) {
        me.addClass("lv"+(hoverTarget.data("lv")+1));
      } else { //feed
        me.addClass("lv"+hoverTarget.data("lv"));
       }
    }
    saveFeedList();
    hoverTarget=null;
  };
  var sl_dropover=function(evt,ui) {
    var me=$(this);
    console.glog("drag","over",me.attr("id"));
    var dh=$(".ddhelper","#settings-feeds");
    dh.insertAfter(me);
    hoverTarget=me;
  };
  var hoverTarget=null;
  var dragMode="";

  if(data.items.length==0)
    $("#settings-feeds .nofeeds").show();
  else
    $("#settings-feeds .nofeeds").hide();
  $("#settings-feeds tbody").empty();
  
  data.dirs.forEach(function(e) {
    e.icon=appconfig.diricon;
    var obj={
      id:e.id,
      unread:0,
      title:e.label,
      icon:e.icon,
      desc:"",
      liclass:"dir hasicon",
      order:e.order,
    };
    var el=$($("#tpl-settings-dir").jqote(obj));
    el.appendTo($("#settings-feeds tbody"));
    el.attr("id","sfd-"+e.id);
    el.attr("data-id",e.id);
    el.attr("data-dir",e.id);
    el.attr("data-label",e.label);
    el.droppable();
    var h=$(".icon",el);
    el.draggable({containment:"#settings-feeds tbody",handle:h,helper:"clone"});
    el.on("dropover",sl_dropover);
    el.on("dragstart",sl_dragstart);
    el.on("dragstop",sl_dragstop);
    if(e.id==0) { //dont drag the root...
      el.draggable("destroy");
      el.attr("data-lv",0);
      el.unbind("dragstart");
    }
    h.click(function() {
      console.glog("settings-feeds","clicked on directory",e.id);
    });
  });
  //now that the DOM elements for the dirs have been created, assign the indentation levels
  data.dirs.forEach(function(e) {
    if(e.id==0) {
      return;
    }
    var p=$("#sfd-"+e.parent_id);
    var lvP=p.data("lv");
    var lv=lvP+1;
    
    var me=$("#sfd-"+e.id);
    me.attr("data-lv",lv);
    me.addClass("lv"+lv).attr("data-parent",e.parent_id);
  });
  
  data.items.forEach(function(e){
    if(e.icon=="")
      e.icon=appconfig.feedicon;
    var obj={
      id:e.id,
      unread:e.total-e.read,
      title:e.title,
      icon:e.icon,
      desc:e.desc,
      link:e.url,
      order:e.order,
    };
    if(e.read!=e.total)
      obj.liclass="feed hasunread ";
    else
      obj.liclass="feed ";
    
    if(e.icon!="")
      obj.liclass+="hasicon ";
    
    //create the DOM objects for the feedlist entry out of the template
    var el=$($("#tpl-settings-feed").jqote(obj));
    $(".del",el).click(function() {
      doAPIRequest("unsubscribe",{feed:e.id},null, //success
      null, //fail
      loadFeedList //always
      );
    });
    var h=$(".icon",el);
    el.draggable({containment:"#settings-feeds tbody",handle:h,helper:"clone"});
    el.droppable();
    el.attr("id","sfi-"+e.id);
    el.attr("data-id",e.id);
    el.attr("data-title",e.title);
    de=$("#sfd-"+e.dir_id);
    if(de.length==1) {
      el.addClass("lv"+(de.data("lv")+1)).attr("data-lv",(de.data("lv")+1));
    } else {
      console.gerror("getfeeds","directory",e.dir_id,"has no matching element");
    }
    el.insertAfter(de);
    el.on("dragstart",sl_dragstart);
    el.on("dragstop",sl_dragstop);
    el.on("dropover",sl_dropover);
    el.attr("data-dir",e.dir_id);
  });
});
