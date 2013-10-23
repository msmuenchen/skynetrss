//SkyRSS app component: user settings
if(typeof appstate!="object")
  appstate={};

//todo, load language here?
$(document).ready(function() {
  appstate.settings={};
  appstate.settings.loaded=false;
  appstate.settings.default={};
  appstate.settings.user={};
  appstate.settings.current={};
});

$(document).on("skyrss_session_load",function() {
  var s=appstate.session.object;
  console.glog("component.settings","updating with new settings",s);
  if(s.user) {
    $("#settingsform-account .username").html(s.user.name);
    if(s.user.source!="") {
      $("#settingsform-account .passwordrow").hide();
    } else {
      $("#settingsform-account .passwordrow").show();
    }
  }
  appstate.settings.default=s.default_settings;
  appstate.settings.user=s.user_settings;
  appstate.settings.current=appstate.settings.default;
  
  $.extend(appstate.settings.current,appstate.settings.user);
  appstate.settings.loaded=true;
});

//add feeds to list
$(document).on("skyrss_feedlist_load",function() {
  var data=appstate.feedlist.object;
  console.glog("component.settings","inserting feedlist",data);

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
  