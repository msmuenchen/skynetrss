//SkyRSS view "feed", extension "keypress"

//Reference: http://www.shortcutworld.com/en/web/Google-Reader.html
//Section 1: Space, arrow keys, PgUp/Dn, Home, End keys
//Use keydown here, see http://stackoverflow.com/a/2218915/1933738
$(window).keydown(function(e) {
  //don't capture keypresses in anything other than feedview
  if(appstate.view!="feed")
      return;

  //check if keycode is allowed at all
  if($.inArray(e.keyCode,[32,33,34,35,36,38,40])==-1)
    return;
  
  //check if we're not allowed to react on keypresses
  //e.g. while entering comments, tags etc
  if(appstate.keyscope==99)
    return;
  
  //prevent unvoluntary crap
  e.preventDefault();
  
  //scroll delta
  var delta=$("#feedentries").height()/4;
  //current scrollTop
  var current=$("#feedentries").scrollTop();
  //maximum scrollTop
  var maxScroll=$("#feedentries")[0].scrollHeight-$("#feedentries").height();
  //new scrollTop (we centralize the scroll later)
  var newScroll=current;
  
  if(e.keyCode==32 && e.metaKey==false) { //space = next element
    if(appstate.feed.pos!=0 && !$("#fl-"+appstate.feed.pos).length) {
      //this happens when the current element is not present (e.g. on the next page)
      appstate.feed.pos=0;
    }
    
    var c=$("#fl-"+appstate.feed.pos);
    if(appstate.feed.pos==0) {
      var n=$(".feedline").first();
    } else {
      var n=$("#fl-"+appstate.feed.pos).next();
    }
    if(c.length==1 && !isFeedItemVisible(c)) { //current element is not fully visible, just scroll down
      console.log("current element is not fully visible");
      newScroll+=delta;
    } else { //current element is fully visible, open the next element
      var nId=n.attr("id");
      console.log(nId);
      console.log("next item is "+nId);
      if(nId=="feedmore") {
        if($("#feedmore").hasClass("more")) //more items available => click
          $("#feedmore").click();
      } else {
        var r=/fl-([0-9]*)/.exec(nId);
        location.hash="feed/"+appstate.feed.id+"/"+r[1];
      }
      return;
    }
  } else if(e.keyCode==40||e.keyCode==34) {
    if(e.keyCode==34)
      delta*=2; //pgdn doubles scrollheight
    newScroll+=delta;
  } else if(e.keyCode==38||e.keyCode==33) {
    if(e.keyCode==33)
      delta*=2; //pgdn doubles scrollheight
    newScroll-=delta;
  } else if(e.keyCode==36) { //pos1, scroll to top
    newScroll=0;
  } else if(e.keyCode==35) { //end, scroll to bottom
    newScroll=maxScroll;
  }
  if(newScroll>maxScroll)
    newScroll=maxScroll;
  if(newScroll<0)
    newScroll=0;
  console.log("delta "+delta+" current "+current+" new "+newScroll);
  $("#feedentries").scrollTop(newScroll);
});

//Section 2: Feed item navigation
/*
j/k open next/previous item
n/p select next/previous item but dont open it
o/<return> open/close selected item
1 open all
2 close all
f open feedlist in fullscreen mode
*/
$(window).keypress(function(e) {
  if(appstate.view!="feed")
    return;
  
  //check if we're not allowed to react on keypresses
  //e.g. while entering comments, tags etc
  if(appstate.keyscope==99)
    return;
  //check if keycode is allowed at all
  if($.inArray(e.keyCode,[13,49,50,106,107,110,111,112,102])==-1)
    return;
  
  //no meta-key (alt,ctrl, etc) combos
  if(e.metaKey)
    return;
  
  //prevent unvoluntary crap
  e.preventDefault();
  
  switch(e.keyCode) {
    case 110: //n
      if(appstate.feed.selected==0) {
        var n=$(".feedline").first();
        var c=n;
      } else {
        var n=$("#fl-"+appstate.feed.selected).next();
        var c=$("#fl-"+appstate.feed.selected);
      }
      console.log("next");
      console.log(c);
      console.log(n);
      var nId=n.attr("id");
      if(nId=="feedmore")
        return;
      var r=/fl-([0-9]*)/.exec(nId);
      appstate.feed.selected=r[1];
      c.removeClass("selected");
      n.addClass("selected");
      $("#feedentries").scrollTo(n);
    break;
    case 112: //p
      if(appstate.feed.selected==0) {
        var n=$(".feedline").first();
        var c=n;
      } else {
        var n=$("#fl-"+appstate.feed.selected).prev();
        var c=$("#fl-"+appstate.feed.selected);
      }
      if(n.length!=1)
        return;
      var nId=n.attr("id");
      var r=/fl-([0-9]*)/.exec(nId);
      appstate.feed.selected=r[1];
      c.removeClass("selected");
      n.addClass("selected");
      $("#feedentries").scrollTo(n);
    break;
    case 111: //o
    case 13: //<return>
      if(appstate.feed.selected==0) {
        var c=$("#fl-"+appstate.feed.pos);
        if(c.length!=1)
          return;
      } else
        var c=$("#fl-"+appstate.feed.selected);
      var cId=c.attr("id");
      var r=/fl-([0-9]*)/.exec(cId);
      if(c.hasClass("open")) //collapse
        location.hash="feed/"+appstate.feed.id+"/";
      else
        location.hash="feed/"+appstate.feed.id+"/"+r[1];
    break;
    case 49: //1
      $(".feedline").each(function(e) {
        var cId=$(this).attr("id");
        var r=/fl-([0-9]*)/.exec(cId);
        openFeedItem(r[1],true);
      });
    break;
    case 50: //2
      $(".feedline.open").removeClass("open");
      $(".feedline iframe").remove();
      location.hash="feed/"+appstate.feed.id+"/";
    break;
    case 106: //j
      if(appstate.feed.pos!=0 && !$("#fl-"+appstate.feed.pos).length) {
        appstate.feed.pos=0;
      }
      if(appstate.feed.pos==0) {
        var n=$(".feedline").first();
      } else {
        var n=$("#fl-"+appstate.feed.pos).next();
      }
      var nId=n.attr("id");
      if(nId=="feedmore")
        return;
      var r=/fl-([0-9]*)/.exec(nId);
      location.hash="feed/"+appstate.feed.id+"/"+r[1];
    break;
    case 107: //k
      if(appstate.feed.pos!=0 && !$("#fl-"+appstate.feed.pos).length) {
        appstate.feed.pos=0;
      }
      if(appstate.feed.pos==0) {
        var n=$(".feedline").first();
      } else {
        var n=$("#fl-"+appstate.feed.pos).prev();
      }
      if(n.length!=1)
        return;
      var nId=n.attr("id");
      var r=/fl-([0-9]*)/.exec(nId);
      location.hash="feed/"+appstate.feed.id+"/"+r[1];
    break;
    case 102: //f
      $("#feed").toggleClass("fullscreen");
      $(".feedline.open iframe").each(function() {
        if(this.contentWindow && this.contentWindow.postMessage) {
          $(this).height(0);
          this.contentWindow.postMessage({type:"geth"},'*');
        }
      });
    break;
  }
});

//section 3: item actions
//v: open in new background tab
//m: toggle read/unread
//s: share (this DIFFERS from google reader!!)
$(window).keypress(function(e) {
  if(appstate.view!="feed")
    return;
  
  //check if we're not allowed to react on keypresses
  //e.g. while entering comments, tags etc
  if(appstate.keyscope==99)
    return;
  //check if keycode is allowed at all
  if($.inArray(e.keyCode,[109,115,118])==-1)
    return;
  
  //no meta-key (alt,ctrl, etc) combos
  if(e.metaKey)
    return;
  
  //prevent unvoluntary crap
  e.preventDefault();

  //get the current item
  var c=$("#fl-"+appstate.feed.pos);
  if(!c.length) //make sure that an item is open!
    return;

  switch(e.keyCode) {
    case 118: //v
      var l=$(".fullLink",c); //get the link element
      if(!l.length)
        return;
      if(l.attr("href")=="")
        return;
      //Open in background tab by firing a middle-click (http://stackoverflow.com/a/11389138/1933738)
      var evt = document.createEvent("MouseEvents");
      //the tenth parameter of initMouseEvent sets ctrl key
      evt.initMouseEvent("click", true, true, window, 0, 0, 0, 0, 0,
                                  true, false, false, false, 0, null);
      l.get(0).dispatchEvent(evt);
    break;
    case 109: //m
      var cb=$(".itemRead",c);
      cb.toggleCheckbox(); //toggle and fire the change event
    break;
    case 115: //s
      var btn=$(".share",c);
      btn.click();
      appstate.keyscope=99; //prevent firing of other handlers
    break;
  }
  console.log(e.keyCode+" "+e.metaKey);
});
