//SkyRSS app component: menu display
if(typeof appstate!="object")
  appstate={};

$(document).ready(function() {
  console.glog("component.menu","initializing");
  $("#feedlist .loading").show();
});

$(document).on("skyrss_session_load",function() {
  console.glog("component.menu","have got session data");
  var data=appstate.session.object;
  $("#menu .loginshow,#menu .logoutshow,#menu .connectedshow,#menu .offlineshow").show();
  //show the menu entries depending on login state
  if(data.user) {
    $("#menu .logoutshow").hide();
    $("#menu .username").html(data.user.name);
  } else {
    $("#menu .loginshow").hide();
  }
  //hide the menu entries depending on network connection
  //(do note that when connectivity changes, this event will be triggered by cascade)
  if(appstate.online) {
    $("#menu .offlineshow").hide();
  } else {
    $("#menu .connectedshow").hide();
  }
});

//add menu items
$(document).on("skyrss_feedlist_load",function() {
  var data=appstate.feedlist.object;
  console.glog("component.menu","inserting feedlist",data);
  $("#feedlist .nofeeds").hide();
  $("#feedlist .feed,#feedlist .dir").remove();
  $("#feedlist li,#feedlist .loading").hide();
  var c=$("#feedlist");
  if(data.items.length==0) {
    $("#feedlist .nofeeds").show();
    return;
  }
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
    var el=$($("#tpl-feedlist").jqote(obj));
    el.appendTo(c);
    el.attr("id","fd-"+e.id);
    if(e.id==0) {
      el.attr("data-lv",0);
    }
    el.attr("data-dir",e.id);
  });
  //now that the DOM elements for the dirs have been created, assign the indentation levels
  data.dirs.forEach(function(e) {
    if(e.id==0) {
      return;
    }
    var p=$("#fd-"+e.parent_id);
    var lvP=p.data("lv");
    var lv=lvP+1;
    //feedlist
    me=$("#fd-"+e.id);
    me.attr("data-lv",lv);
    me.addClass("lv"+lv);
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
    var el=$($("#tpl-feedlist").jqote(obj));
    el.attr("id","fi-"+e.id);
    var de=$("#fd-"+e.dir_id);
    if(de.length==1) {
      el.addClass("lv"+(de.data("lv")+1));
    } else {
      console.gerror("component.menu","directory",e.dir_id,"has no matching element");
    }
    var lastOfDir=$(".dir-"+e.dir_id,"#feedlist").last();
    if(lastOfDir.length==1) {
      el.insertAfter(lastOfDir);
    } else {
      el.insertAfter(de);
    }
    el.addClass("dir-"+e.dir_id);
    el.click(function() {
      location.hash="#feed/"+e.id+"/";
    });
  });
  //update last-fetch timestamp
  var d=new Date(data.ts*1000);
  var ds=dateFormat(d,_("page_tsformat"));
  $("#flts").html(ds);
});
