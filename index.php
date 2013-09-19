<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="min-width=1000px" />
    <title>SKYRSS Reader</title>
    <link rel="stylesheet" href="app.css" type="text/css" media="all" />
    
    <script type="text/javascript" src="js/console.js"></script>
    <script type="text/javascript" src="js/jquery-1.8.3.min.js"></script>
    <script type="text/javascript" src="js/jquery.ba-hashchange.min.js"></script>
    <script type="text/javascript" src="js/jquery.disableSelection.js"></script>
    <script type="text/javascript" src="js/date.format.js"></script>
    <script type="text/javascript" src="js/jquery.scrollTo-min.js"></script>
    <script type="text/javascript" src="js/jquery.jqote2.min.js"></script>
    <script type="text/javascript" src="js/jquery.toggleCheckbox.js"></script>
    <script type="text/javascript" src="config.js"></script>
    <script type="text/javascript" src="js/i18n.js"></script>
    <script type="text/javascript" src="i18n/de.js"></script>
    <script type="text/javascript" src="i18n/en.js"></script>
    <script type="text/javascript" src="js/api.js"></script>
    <script type="text/javascript" src="js/importgr.js"></script>
    <script type="text/javascript" src="js/app.js"></script>
    <script type="text/javascript" src="js/tab.js"></script>
    
    <script type="text/javascript" src="js/sprintf.js/src/sprintf.js"></script>
    
    <!-- jqote template for a feed item line -->
    <script type="text/html" id="tpl-feedline">
<![CDATA[
<li id="fl-<%= this.id %>" class="feedline">
  <table class="topRow">
  <tr>
    <td class="title <%= this.titleclass %>"><%! this.title %></td>
    <td class="date"><%= this.date %></td>
  </tr>
  </table>
  <div class="feedDetails" id="data-<%= this.id %>">
    <div><a class="fullLink" target="_blank" href="<%! this.href %>"><%= _("page_openlink") %></a></div>
    <div class="author"><%! this.author %></div>
    <div class="fullText"></div>
  </div>
  <table class="bottomRow">
    <tr>
      <td><input type="checkbox" class="itemRead" id="itemread-<%= this.id %>"/> <label for="itemread-<%= this.id %>"><%= _("page_markasread") %></label></td>
      <td class="share"><%= _("page_share") %></td>
    </tr>
  </table>
</li>
]]>
    </script>
    
    <!-- jqote template for a feed list entry -->
    <script type="text/html" id="tpl-feedlist">
<![CDATA[
<li class="feed <%= this.liclass %>" id="fi-<%= this.id %>" title="<%! this.desc %>">
<% if(this.icon!="") { %>
  <img src="<%! this.icon %>" class="icon" />
<% } %>
  <a><%! this.title %></a>
  <span class="unread_count"><%= this.unread %></span>
</li>
]]>
    </script>

    <!-- jqote template for a library block -->
    <script type="text/html" id="tpl-libblock">
<![CDATA[
<div class="libblock">
  <h2><%! this.title %></h2>
  <table>
  </table>
</div>
]]>
    </script>

    <!-- jqote template for a library entry -->
    <script type="text/html" id="tpl-libentry">
<![CDATA[
<tr>
  <td><span title="<%! this.desc %>"><%! this.title %></td></td>
  <td><button class="i18n addfeed" data-key="page_add"></button></td>
</tr>
]]>
    </script>    

    <script type="text/plain" id="inject-height">
// This script gets injected into the content iframes.
// It tells the parent its inner height so that the iframe can be exactly fit
// and also tells the parent key presses to allow space-scrolling.
// This is not possible from outside because of same-origin policy.
function seth() {
  //tell parent our height
  window.parent.postMessage({
    type:"seth",
    scrollHeight:document.body.scrollHeight,
    myId:theId,
  },'*');
}
//Fire on onLoad as well as on DOMReady, so that the text can be read, even if not all images are loaded
//This is especially needed on mobile and other slow links
window.onload=function() {
  seth();
  var links=document.getElementsByTagName("a");
  for(var i=0;i<links.length;i++) {
    var link=links[i];
    if(link.href)
      link.target="_new";
  }
};
document.addEventListener('DOMContentLoaded',seth);

window.onkeypress=function(a) {
  //tell parent that a key was pressed (relay SPACE for scrolling)
  window.parent.postMessage({
    type:"keypress",
    ev: {
      keyCode:a.keyCode,
      metaKey:a.metaKey,
    },
  },'*');
}
//arrow keys are only passed in onkeydown
window.onkeydown=function(e) {
  switch(e.keyCode) {
    case 38:
    case 40:
    case 33:
    case 34:
    case 35:
    case 36:
//    default:
      window.parent.postMessage({
      type:"keydown",
      ev: {
        keyCode:e.keyCode,
        metaKey:e.metaKey,
      },
    },'*');
  }
  return true;
}
    </script>
  </head>
  <body>
  <div id="menu">
    <ul>
      <li><a href="#index"><span class="i18n" data-key="page_home"></span></a></li>
      <li class="loginshow"><a href="#op/addnew"><span class="i18n" data-key="page_addfeed"></span></a></li>
      <li class="loginshow"><a href="#op/addgr"><span class="i18n" data-key="page_addgr"></span></a></li>
      <li class="logoutshow"><a href="#op/login"><span class="i18n" data-key="page_login"></span></a></li>
      <li class="loginshow"><a href="#op/logout"><span class="i18n" data-key="page_logout"></span></a></li>
      <li class="loginshow"><a href="#op/settings"><span class="i18n" data-key="page_settingsfor"></span><span class="username"></span></a></li>
      <li class="loginshow"><a href="#library"><span class="i18n" data-key="page_library"></span></a></li>
      <li class="loginshow"><a href="#welcome"><span class="i18n" data-key="page_firststeps"></span></a></li>
    </ul>
    <hr />
    <ul id="feedlist">
      <li class="loading"><span class="i18n" data-key="page_loading"></span></li>
      <li class="nofeeds"><span class="i18n" data-key="page_nofeeds"></span></li>
    </ul>
    <hr />
    <ul id="debug_extra">
      <li id="flts"></li>
      <li>Pool: <span id="poollen"></span> Items</li>
    </ul>
  </div>
  <div id="content">
    <div class="view" id="oplogin">
      <h1><span class="i18n" data-key="page_login"></span></h1>
      <div class="tabcontainer_group tabgroup-login">
        <div class="tabcontainer tab-skyrssaccount">
          <h2 class="tabheader tabgroup-login tab-skyrssaccount"><span style="display:none" class="i18n" data-key="page_skyrssaccount"></span></h2>
          <div class="tab tab-skyrssaccount active">
            <form id="loginform">
            <div id="login-error"></div>
            <table>
              <tr><th><span class="i18n" data-key="page_username"></span></th><td><input type="text" id="login-username" /></td></tr>
              <tr><th><span class="i18n" data-key="page_password"></span></th><td><input type="password" id="login-password" /></td></tr>
              <tr><td colspan="2"><button id="login-btn"><span class="i18n" data-key="page_login"></span></button></td></tr>
              <tr><td colspan="2" id="login-captcha"></td></tr>
              <tr><td colspan="2"><button id="createaccount-btn"><span class="i18n" data-key="page_createaccount"></span></button></td></tr>
            </table>
            </form>
          </div>
        </div>
        <div class="tabcontainer tab-twitteraccount">
          <h2 class="tabheader tab-twitteraccount tabgroup-login">Twitter</h2>
          <div class="tab tab-twitteraccount">
            <a href="lib/twitter.php" id="logintw"></a>
          </div>
        </div>
        <div class="tabcontainer tab-facebookaccount">
          <h2 class="tabheader tab-facebookaccount tabgroup-login">Facebook</h2>
          <div class="tab tab-facebookaccount">
            <a href="lib/facebook.php" id="loginfb"></a>
          </div>
        </div>
      </div>
    </div>
    <div class="view" id="oplogout">
      <h1><span class="i18n" data-key="page_logout"></span></h1>
      <form id="logoutform">
      <p><span class="i18n" data-key="page_logoutconfirm"></span></p>
      <p><em><span class="i18n" data-key="page_warning"></span></em>: <span class="i18n" data-key="page_logoutwarning"></span></p>
      <p><button id="logout-btn"><span class="i18n" data-key="page_logout"></span></button></p>
      </form>
    </div>
    <div class="view" id="opsettings">
      <h1><span class="i18n" data-key="page_settings"></span></h1>
      <div class="tabcontainer_group tabgroup-settings">
        <div class="tabcontainer tab-account">
          <h2 class="tabheader tab-account tabgroup-settings"><span class="i18n" data-key="page_account"></span></h2>
          <div class="tab tab-account">
            <form id="settingsform-account">
            <table>
              <tr><th><span class="i18n" data-key="page_username"></span></th><td><span class="username"></span></td></tr>
              <tr class="passwordrow"><th><span class="i18n" data-key="page_password"></span></th><td><input type="password" placeholder="Neues Passwort..." id="setings-password" /></td></tr>
              <tr class="passwordrow"><td colspan="2"><button id="settings-accountbtn-save"><span class="i18n" data-key="page_save"></span></button></td></tr>
            </table>
            </form>
          </div>
        </div>
        <div class="tabcontainer tab-feeds">
          <h2 class="tabheader tab-feeds tabgroup-settings"><span class="i18n" data-key="page_feeds"></span></h2>
          <div class="tab tab-feeds active">
            <table id="settings-feeds">
              <thead>
                <tr><th><span class="i18n" data-key="page_feedid"></span></th><th><span class="i18n" data-key="page_feedurl"></span></th><th><span class="i18n" data-key="page_feedtitle"></span></th><th><span class="i18n" data-key="page_action"></span></th></tr>
                <tr class="nofeeds"><td colspan="4"><span class="i18n" data-key="page_nofeeds"></span></td></tr>
              </thead>
              <tbody>
              </tbody>
            </table>
          </div>
        </div>
        <div class="tabcontainer tab-display">
          <h2 class="tabheader tab-display tabgroup-settings"><span class="i18n" data-key="page_displaysettings"></span></h2>
          <div class="tab tab-display">
            <form id="settingsform-display">
            <table>
              <tr><th class="i18n" data-key="page_jumponopen"></th><td><input type="checkbox" id="settings-display-jumponopen" data-key="jumponopen" /></td></tr>
              <tr><td colspan="2"><button id="settings-display-save"><span class="i18n" data-key="page_save"></span></button></td></tr>
            </table>
            </form>
          </div>
        </div>
      </div>
    </div>
    <div class="view" id="opaddnew">
      <h1><span class="i18n" data-key="page_addfeed"></span></h1>
      <p><span class="i18n" data-key="page_addnewintro"></span></p>
      <p><form><input id="newfeedurl" size="90" type="url" placeholder="http://example.tld/feed.rss"/> <button id="addnewfeed"><span class="i18n" data-key="page_detectfeeds"></span></button></form></p>
      <div id="discover-results">
      <h2><span class="i18n" data-key="page_feeds"></span></h2>
        <table id="discover-feedlist">
          <thead>
            <tr><th><span class="i18n" data-key="page_feedurl"></span></th><th><span class="i18n" data-key="page_feedtitle"></span></th><th><span class="i18n" data-key="page_action"></span></th></tr>
          </thead>
          <tbody>
          </tbody>
        </table>
      </div>
    </div>
    <div class="view" id="opaddgr">
      <h1><span class="i18n" data-key="page_addgr"></span></h1>
      <h2><span class="i18n" data-key="page_file"></span></h2>
      <input id="grfile" type="file" size="90" /> <button id="importgrfile"><span class="i18n" data-key="page_startimport"></span></button>
      <h2><span class="i18n" data-key="page_results"></span></h2>
      <div id="grcounter"><span id="grcounter_cur">0</span> von <span id="grcounter_total">0</span> Feeds geladen</div>
      <table id="grresult" border="1">
        <tr class="header"><th><span class="i18n" data-key="page_requestid"></span></th><th><span class="i18n" data-key="page_feedid"></span></th><th><span class="i18n" data-key="page_feedurl"></span></th><th><span class="i18n" data-key="page_feedtitle"></span></th><th><span class="i18n" data-key="page_status"></span></th></tr>
        <tr id="grresult-noentries"><td colspan="5"><span class="i18n" data-key="page_nofeeds"></span></td></tr>
      </table>
    </div>
    <div class="view" id="library">
      <h1><span class="i18n" data-key="page_library"></span></h1>
      <div id="library-content">
      </div>
    </div>
    <div class="view" id="index">
      <span class="i18n" data-key="page_startsite"></span>
    </div>
    <div class="view" id="feed">
      <div id="feedbar">
        <a id="feed_href" target="_blank"><h1 id="feed_title"></h1></a>
        <div id="feedmenu">
          <span class="item"><span id="feed_shown"></span>/<span id="feed_total"></span> <span class="i18n" data-key="page_entries"></span></span>
          <span class="item"><button id="feed_reload"><span class="i18n" data-key="page_reload"></span></button></span>
          <span class="item"><button id="feed_update"><span class="i18n" data-key="page_reloadserver"></span></button></span>
          <span class="item"><button id="feed_allread"><span class="i18n" data-key="page_markallasread"></span></button></span>
          <span class="item">
            <select id="feed_sort">
              <option value="desc" class="i18n" data-key="page_newestfirst"></option>
              <option value="asc" class="i18n" data-key="page_oldestfirst"></option>
            </select>
          </span>
          <span class="item">
            <input id="feed_showread" checked="checked" type="checkbox"/> <label for="feed_showread"><span class="i18n" data-key="page_showread"></span></label>
          </span>
        </div>
      </div>
      <ul id="feedentries">
        <li id="feedmore">
          <span class="more"><span class="i18n" data-key="page_more"></span></span>
          <span class="loading"><span class="i18n" data-key="page_loading"></span></span>
          <span class="nomore"><span class="i18n" data-key="page_nomore"></span></span>
        </li>
      </ul>
      <div id="feedfooter">
        <span class="item"><span class="i18n" data-key="page_ts"></span>: <span id="feed_ts"></span></span>
      </div>
    </div>
    <div class="view" id="welcome">
      <h1 class="i18n" data-key="page_welcome"></h1>
      <h2 class="i18n" data-key="page_firststeps"></h2>
      <img src="assets/reader_feedview.png" style="width:500px" /><br />
      <ol id="welcome_firststeps">
        <li class="i18n" data-key="page_firststeps_1"></li>
        <li class="i18n" data-key="page_firststeps_2"></li>
        <li class="i18n" data-key="page_firststeps_3"></li>
        <li class="i18n" data-key="page_firststeps_4"></li>
        <li class="i18n" data-key="page_firststeps_5"></li>
        <li class="i18n" data-key="page_firststeps_6"></li>
      </ol>
    </div>  
  </div>
  <div id="modal-container">
    <div id="share-content" class="modal-box">
      <div id="share-close" class="modal-close">
      X
      </div>
      <h2>Twitter</h2>
      <a id="share-twitter" href="" target="_blank">
        <span class="i18n" data-key="page_shareontwitter"></span>
      </a>
      <h2>Facebook</h2>
      <a id="share-fb" href="" target="_blank">
        <span class="i18n" data-key="page_shareonfb"></span>
      </a>
    </div>
  </div>
  </body>
</html>
